// Dependencies
const knex = require('knex')(require('../../../knexfile.js').development);
const crypto = require('crypto');

// Function Imports
const {
	db_createPassword
} = require("../../auth/funs_db.js");
const { instagram_getAccountDetails } = require('../../../external_apis/meta_ig');
const { generateCode } = require('../../../external_apis/resend');
const { tiktok_getAccountDetails } = require('../../../external_apis/tiktok');
const { 
	get_social_details,
	cache_getCreatorsList,
	cache_updateCreatorsList,
	cache_getCreatorsCondensed,
	cache_updateCreatorsCondensed,
	cache_getCreatorDetails,
	cache_updateCreatorDetails,
	cache_getCreatorSubmissions,
	cache_updateCreatorSubmissions,
	cache_getCreatorConnectedAccounts,
	cache_updateCreatorConnectedAccounts,
	invalidateCreatorCache
} = require('./funs_cache');
const { convertEncodedImage } = require('../../../utils/convertEncodedImage.js');

// -------------------
// CREATE Functions
// -------------------
async function db_createCreatorAccount(user_id, email, password, name) {
	let err_code;

	// Add creator account
	const [creator_id] = await knex('Users')
		.insert({
			'email': email,
			'name': name,
			'user_typ': 'creator'
		})
		.returning('id')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Add creator password
    const create_pass = await new Promise((resolve, _) => {
        db_createPassword(creator_id, password, function(pw_ok) {
            if (!pw_ok.ok) return resolve(false);
            return resolve(true);
        });
    });
    if (!create_pass) return [false, null];

	return [true, creator_id];
}
async function db_manuallyAddCreator(user_id, name) {
	let err_code;

	const uuid = crypto.randomUUID();

	// Add creator account
	const [creator_id] = await knex('Users')
		.insert({
			'email': `${name}-${uuid}@evomarketing.co`,
			'name': name,
			'user_typ': 'creator'
		})
		.returning('id')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	return [true, creator_id];
}
async function db_manuallyInviteCreator(user_id, name, email, phone, inviteCode) {
	let err_code;

	// Check if user already exists
	const existingUser = await knex('Users')
		.where('email', email)
		.first();

	if (existingUser) {
		return [false, 'User with this email already exists'];
	}

	// Check if invite already exists
	const existingInvite = await knex('Invited_Creators')
		.where('email', email)
		.first();

	if (existingInvite) {
		// Return success with existing invite_id to avoid duplicate invite error
		return [true, { invite_id: existingInvite.id, inviteCode: existingInvite.invite_code }];
	}

	// Add to invited creators table
	const [invite_id] = await knex('Invited_Creators')
		.insert({
			'email': email,
			'name': name,
			'phone': phone,
			'invite_code': inviteCode,
			'invited_by': user_id
		})
		.returning('id')
		.catch((err) => { if (err) err_code = err.code });

	if (err_code) return [false, null];

	return [true, { invite_id, inviteCode }];
}
async function db_sendCreatorInviteEmail(user_id, creator_id, inviteCode) {
	let err_code;

	// Get creator details
	const creator = await knex('Users')
		.where('id', creator_id)
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (!creator || err_code) return [false, 'Creator not found'];

	// Create invitation in database
	const [invite_id] = await knex('Invited_Creators')
		.insert({
			'email': creator.email,
			'name': creator.name,
			'phone': creator.phone,
			'invite_code': inviteCode,
			'invited_by': user_id,
		})
		.returning('id')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	return [true, { 
		email: creator.email,
		name: creator.name,
		invite_id
	}];
}



// -------------------
// READ Functions
// -------------------
async function db_getCreators(user_id, page = 1, pageSize = 25, sort = 'hltime', search = '') {
	let err_code;

	// Check cache first
	// const cache_key_params = { page, pageSize, sort, search };
	// const cached_data = await cache_getCreatorsList(page, pageSize, sort, search);
	// if (cached_data) {
	// 	console.log('[db_getCreators] Cache hit');
	// 	return [true, cached_data];
	// }

	console.log('[db_getCreators] Cache miss - fetching from database');

	// Calculate offset for pagination
	const offset = (page - 1) * pageSize;

	// Build search filter condition for the raw query
	let searchCondition = '';
	let searchParams = [];
	if (search && search.trim() !== '') {
		const searchTerm = `%${search.trim()}%`;
		searchCondition = 'AND (u.email LIKE ? OR u.name LIKE ?)';
		searchParams = [searchTerm, searchTerm];
	}

	// Build sort clause
	let sortClause = 'u.created_ts DESC'; // default
	switch (sort) {
		case 'hltime':
			sortClause = 'u.created_ts DESC';
			break;
		case 'lhtime':
			sortClause = 'u.created_ts ASC';
			break;
		case 'hlcmp':
			sortClause = 'campaigns DESC';
			break;
		case 'lhcmp':
			sortClause = 'campaigns ASC';
			break;
		case 'hlposts':
			sortClause = 'submitted DESC';
			break;
		case 'lhposts':
			sortClause = 'submitted ASC';
			break;
	}

	// Get total count for pagination first
	const countQuery = knex('Users')
		.where('user_typ', 'creator');

	// Add search filtering to count query if search parameter is provided
	if (search && search.trim() !== '') {
		const searchTerm = `%${search.trim()}%`;
		countQuery.where(function() {
			this.where('email', 'LIKE', searchTerm)
				.orWhere('name', 'LIKE', searchTerm);
		});
	}

	// Get total count
	const [{ count: total_count }] = await countQuery
		.count('* as count')
		.catch((err) => { 
			console.error('[db_getCreators] Error in count query:', err); 
			if (err) err_code = err.code 
		});
	if (err_code) {
		console.error('[db_getCreators] count query failed');
		return [false, null];
	}

	// Simplified query without engagement rate calculation for performance
	const query = knex.raw(`
		WITH campaign_counts AS (
			SELECT 
				user_id,
				COUNT(DISTINCT campaign_id) as campaigns
			FROM Creator_Links
			GROUP BY user_id
		),
		submission_counts AS (
			SELECT 
				cl.user_id,
				COUNT(DISTINCT cs.npc_id) as submitted
			FROM Campaign_Submissions cs
			JOIN Creator_Links cl ON cs.clink_id = cl.clink_id
			GROUP BY cl.user_id
		),
		platform_posts AS (
			SELECT 
				cl.user_id,
				cl.platform,
				COUNT(DISTINCT cs.npc_id) as post_count
			FROM Campaign_Submissions cs
			JOIN Creator_Links cl ON cs.clink_id = cl.clink_id
			GROUP BY cl.user_id, cl.platform
		),
		platform_connections AS (
			SELECT 
				user_id,
				GROUP_CONCAT(DISTINCT platform) as platforms
			FROM Creator_Socials
			GROUP BY user_id
		)
		SELECT 
			u.id,
			u.email,
			u.name,
			u.pfp,
			u.created_ts,
			COALESCE(cc.campaigns, 0) as campaigns,
			COALESCE(sc.submitted, 0) as submitted,
			COALESCE(ig_posts.post_count, 0) as posts_ig,
			COALESCE(tt_posts.post_count, 0) as posts_tt,
			CASE WHEN pc.platforms LIKE '%ig%' THEN 1 ELSE 0 END as has_instagram,
			CASE WHEN pc.platforms LIKE '%tt%' THEN 1 ELSE 0 END as has_tiktok
		FROM Users u
		LEFT JOIN campaign_counts cc ON u.id = cc.user_id
		LEFT JOIN submission_counts sc ON u.id = sc.user_id
		LEFT JOIN platform_posts ig_posts ON u.id = ig_posts.user_id AND ig_posts.platform = 'ig'
		LEFT JOIN platform_posts tt_posts ON u.id = tt_posts.user_id AND tt_posts.platform = 'tt'
		LEFT JOIN platform_connections pc ON u.id = pc.user_id
		WHERE u.user_typ = 'creator' ${searchCondition}
		ORDER BY ${sortClause}
		LIMIT ? OFFSET ?
	`, [...searchParams, pageSize, offset]);

	const [results] = await query
		.catch((err) => { 
			console.error('[db_getCreators] Error in optimized query:', err); 
			if (err) err_code = err.code 
		});
	
	if (err_code || !results) {
		console.error('[db_getCreators] optimized query failed or returned null/undefined');
		return [false, null];
	}

	// Transform the results to match the expected format
	const enriched_creators = results.map(creator => ({
		id: creator.id,
		email: creator.email,
		name: creator.name,
		pfp: creator.pfp,
		created_ts: creator.created_ts,
		campaigns: parseInt(creator.campaigns) || 0,
		submitted: parseInt(creator.submitted) || 0,
		posts_ig: parseInt(creator.posts_ig) || 0,
		posts_tt: parseInt(creator.posts_tt) || 0,
		platforms: {
			instagram: Boolean(creator.has_instagram),
			tiktok: Boolean(creator.has_tiktok)
		}
	}));

	const response_data = {
		creators: enriched_creators,
		pagination: {
			total: parseInt(total_count),
			page,
			pageSize,
			totalPages: Math.ceil(parseInt(total_count) / pageSize)
		}
	};

	// Cache the result
	// await cache_updateCreatorsList(page, pageSize, sort, search, response_data);

	return [true, response_data];
}

async function db_getCreatorsCondensed(user_id, page = 1, pageSize = 25, sort = 'hltime', search = '') {
	let err_code;

	// Check cache first
	// const cached_data = await cache_getCreatorsCondensed(page, pageSize, sort, search);
	// if (cached_data) {
	// 	console.log('[db_getCreatorsCondensed] Cache hit');
	// 	return [true, cached_data];
	// }

	// console.log('[db_getCreatorsCondensed] Cache miss - fetching from database');

	// Calculate offset for pagination
	const offset = (page - 1) * pageSize;

	// Build base query for count
	const countQuery = knex('Users')
		.where('user_typ', 'creator');

	// Add search filtering to count query if search parameter is provided
	if (search && search.trim() !== '') {
		const searchTerm = `%${search.trim()}%`;
		// countQuery.where(function() {
		// 	this.where('email', 'LIKE', searchTerm)
		// 		.orWhere('name', 'LIKE', searchTerm);
		// });
		countQuery.where('name', 'LIKE', searchTerm);
	}

	// Get total count for pagination
	const [{ count }] = await countQuery
		.count('* as count')
		.catch((err) => { 
			console.error('[db_getCreatorsCondensed] Error in count query:', err); 
			if (err) err_code = err.code 
		});
	if (err_code) {
		console.error('[db_getCreatorsCondensed] count query failed');
		return [false, null];
	}

	// Determine sort order
	const sortOrder = (sort === 'lhtime') ? 'asc' : 'desc';

	// Build creators query
	const creatorsQuery = knex('Users')
		.where('user_typ', 'creator')
		.select(
			'id',
			'name',
			'created_ts'
		);

	// Add search filtering to creators query if search parameter is provided
	if (search && search.trim() !== '') {
		const searchTerm = `%${search.trim()}%`;
		// creatorsQuery.where(function() {
		// 	this.where('email', 'LIKE', searchTerm)
		// 		.orWhere('name', 'LIKE', searchTerm);
		// });
		creatorsQuery.where('name', 'LIKE', searchTerm);
	}

	// Get paginated and sorted creators
	const creators = await creatorsQuery
		.orderBy('created_ts', sortOrder)
		.limit(pageSize)
		.offset(offset)
		.catch((err) => { 
			console.error('[db_getCreatorsCondensed] Error in creators query:', err); 
			if (err) err_code = err.code 
		});
	if (err_code || !creators) {
		console.error('[db_getCreatorsCondensed] creators query failed or returned null/undefined');
		return [false, null];
	}

	const response_data = {
		creators,
		pagination: {
			total: parseInt(count),
			page,
			pageSize,
			totalPages: Math.ceil(parseInt(count) / pageSize)
		}
	};

	// Cache the result
	// await cache_updateCreatorsCondensed(page, pageSize, sort, search, response_data);

	return [true, response_data];
}

async function db_getCreatorDetails(user_id, creator_id) {
	let err_code;

	// Check cache first
	const cached_data = await cache_getCreatorDetails(creator_id);
	if (cached_data) {
		console.log('[db_getCreatorDetails] Cache hit');
		return [true, cached_data];
	}

	console.log('[db_getCreatorDetails] Cache miss - fetching from database');

	// 1. Get creator basic info
	const creator = await knex('Users')
		.where({
			'id': creator_id,
			'user_typ': 'creator'
		})
		.select(
			'id',
			'pfp',
			'email',
			'name',
			'phone',
			'created_ts'
		)
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];
	if (!creator) return [false, 'Creator not found'];

	// 2. Get assigned campaigns with details from Creator_Links
	const campaigns = await knex('Campaigns as c')
		.join('Creator_Links as cl', 'c.id', 'cl.campaign_id')
		.where('cl.user_id', creator_id)
		.distinct(
			'c.id',
			'c.name',
			'c.img',
			'c.description',
			'c.start_date',
			'c.end_date',
			'c.status'
		)
		.select(
			knex.raw('MIN(cl.clink_id) as clink_id')  // Take the first clink_id for each campaign
		)
		.groupBy(
			'c.id',
			'c.name',
			'c.img',
			'c.description',
			'c.start_date',
			'c.end_date',
			'c.status'
		)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// 3. Get submission counts and latest metrics for each campaign
	const submissions = await knex('Campaign_Submissions as cs')
		.join('Creator_Links as cl', 'cs.clink_id', 'cl.clink_id')
		.join('Campaign_Submissions_Metrics as csm', function() {
			this.on('cs.npc_id', '=', 'csm.npc_id')
				.andOn('csm.recorded_ts', '=', function() {
					this.select(knex.raw('MAX(m3.recorded_ts)'))
						.from('Campaign_Submissions_Metrics as m3')
						.whereRaw('m3.npc_id = cs.npc_id');
				});
		})
		.where('cl.user_id', creator_id)
		.groupBy('cs.campaign_id')
		.select(
			'cs.campaign_id',
			knex.raw('count(DISTINCT cs.npc_id) as submitted'),
			knex.raw('sum(csm.views) as views'),
			knex.raw('sum(csm.likes) as likes'),
			knex.raw('sum(csm.comments) as comments'),
			knex.raw('sum(csm.shares) as shares')
		)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// 4. Get total metrics across all campaigns (using latest metrics)
	const total_metrics = await knex('Campaign_Submissions as cs')
		.join('Creator_Links as cl', 'cs.clink_id', 'cl.clink_id')
		.join('Campaign_Submissions_Metrics as csm', function() {
			this.on('cs.npc_id', '=', 'csm.npc_id')
				.andOn('csm.recorded_ts', '=', function() {
					this.select(knex.raw('MAX(m3.recorded_ts)'))
						.from('Campaign_Submissions_Metrics as m3')
						.whereRaw('m3.npc_id = cs.npc_id');
				});
		})
		.where('cl.user_id', creator_id)
		.select(
			knex.raw('count(DISTINCT cs.npc_id) as total_submissions'),
			knex.raw('sum(csm.views) as total_views'),
			knex.raw('sum(csm.likes) as total_likes'),
			knex.raw('sum(csm.comments) as total_comments'),
			knex.raw('sum(csm.shares) as total_shares')
		)
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// 5. Get platform-specific post counts
	const platform_posts = await knex('Campaign_Submissions as cs')
		.join('Creator_Links as cl', 'cs.clink_id', 'cl.clink_id')
		.where('cl.user_id', creator_id)
		.groupBy('cl.platform')
		.select(
			'cl.platform',
			knex.raw('count(DISTINCT cs.npc_id) as post_count')
		)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// 6. Get creator links and their submission counts
	const creator_links = await knex('Creator_Links as cl')
		.leftJoin('Campaign_Submissions as cs', 'cl.clink_id', 'cs.clink_id')
		.where('cl.user_id', creator_id)
		.select(
			'cl.clink_id',
			'cl.platform',
			'cl.pfp',
			'cl.handle',
			'cl.display_name as name',
			'cl.url',
			knex.raw('count(DISTINCT cs.npc_id) as num_posts')
		)
		.groupBy('cl.clink_id')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Format creator links data
	const accounts = creator_links.map(link => ({
		platform: link.platform,
		pfp: link.pfp || null,
		handle: link.handle,
		name: link.name,
		url: link.url,
		num_posts: parseInt(link.num_posts) || 0
	}));

	// Combine campaign data
	const enriched_campaigns = campaigns.map(campaign => {
		const campaign_submissions = submissions.find(s => s.campaign_id === campaign.id);
		return {
			...campaign,
			submitted: campaign_submissions?.submitted || 0,
			metrics: campaign_submissions ? {
				views: parseInt(campaign_submissions.views || 0),
				likes: parseInt(campaign_submissions.likes || 0),
				comments: parseInt(campaign_submissions.comments || 0),
				shares: parseInt(campaign_submissions.shares || 0)
			} : { views: 0, likes: 0, comments: 0, shares: 0 }
		};
	});

	const response_data = {
		...creator,
		pfp: convertEncodedImage(creator.pfp),
		campaigns: enriched_campaigns,
		metrics: {
			views: parseInt(total_metrics?.total_views || 0),
			likes: parseInt(total_metrics?.total_likes || 0),
			comments: parseInt(total_metrics?.total_comments || 0),
			shares: parseInt(total_metrics?.total_shares || 0)
		},
		total_campaigns: campaigns.length,
		total_submissions: parseInt(total_metrics?.total_submissions || 0),
		posts_ig: platform_posts.find(p => p.platform === 'ig')?.post_count || 0,
		posts_tt: platform_posts.find(p => p.platform === 'tt')?.post_count || 0,
		accounts: accounts
	};

	// Cache the result
	await cache_updateCreatorDetails(creator_id, response_data);

	return [true, response_data];
}

async function db_getCreatorSubmissions(user_id, creator_id, page = 1, pageSize = 25) {
	let err_code;

	// Check cache first
	const cached_data = await cache_getCreatorSubmissions(creator_id, page, pageSize);
	if (cached_data) {
		console.log('[db_getCreatorSubmissions] Cache hit');
		return [true, cached_data];
	}

	console.log('[db_getCreatorSubmissions] Cache miss - fetching from database');

	// Calculate offset
	const offset = (page - 1) * pageSize;

	// Get total count first
	const [{ count }] = await knex('Campaign_Submissions as cs')
		.join('Creator_Links as cl', 'cs.clink_id', 'cl.clink_id')
		.where('cl.user_id', creator_id)
		.count('* as count')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) {
		console.log("Error getting count:", err_code);
		return [false, null];
	}

	// Get paginated submissions with latest metrics
	const submissions = await knex('Campaign_Submissions as cs')
		.join('Creator_Links as cl', 'cs.clink_id', 'cl.clink_id')
		.join('Campaigns as c', 'cs.campaign_id', 'c.id')
		.leftJoin('Campaign_Submissions_Metrics as csm', function() {
			this.on('cs.npc_id', '=', 'csm.npc_id')
				.andOn('csm.recorded_ts', '=', function() {
					this.select(knex.raw('MAX(m3.recorded_ts)'))
						.from('Campaign_Submissions_Metrics as m3')
						.whereRaw('m3.npc_id = cs.npc_id');
				});
		})
		.where('cl.user_id', creator_id)
		.select(
			'cs.npc_id',
			'cs.post_url as url',
			'cs.caption as description',
			'cs.submit_ts as submitted_ts',
			'cs.submit_typ as status',
			'c.name as campaign_name',
			'cl.handle',
			'cl.platform',
			'csm.views',
			'csm.likes',
			'csm.comments',
			'csm.shares'
		)
		.orderBy('cs.submit_ts', 'desc')
		.limit(pageSize)
		.offset(offset)
		.catch((err) => { 
			if (err) {
				console.log("Error getting submissions:", err.code);
				err_code = err.code;
			}
		});
	if (err_code) return [false, null];

	const response_data = {
		submissions,
		pagination: {
			total: parseInt(count),
			page,
			pageSize,
			totalPages: Math.ceil(parseInt(count) / pageSize)
		}
	};

	// Cache the result
	await cache_updateCreatorSubmissions(creator_id, page, pageSize, response_data);

	return [true, response_data];
}

async function db_getCreatorConnectedAccounts(user_id, creator_id) {
	let err_code;

	// Check cache first
	const cached_data = await cache_getCreatorConnectedAccounts(creator_id);
	if (cached_data) {
		console.log('[db_getCreatorConnectedAccounts] Cache hit');
		return [true, cached_data];
	}

	console.log('[db_getCreatorConnectedAccounts] Cache miss - fetching from database');

	// 1. Get keys
	const db_resp = await knex('Creator_Socials').where('user_id', creator_id).select(
		'conn_id AS conn_id',
		'platform AS platform',
		'key_a',
		'key_b',
		'key_c'
	).catch((err)=>{if (err) err_code = err.code});
	if (err_code) return [false, null];

	// 2. Get details for each account
	let enriched_resp = [];
	for (let i = 0; i < db_resp.length; i++) {
		let account_details;
		try {
			// Define fetch function based on platform
			const fetchAccountDetails = async () => {
				switch (db_resp[i].platform) {
					case "ig":
						const [igSuccess, igDetails, igTokens] = await instagram_getAccountDetails(
							db_resp[i].key_a,
							db_resp[i].key_b
						);
						if (igSuccess) {
							// Update tokens if they were refreshed
							if (igTokens && (igTokens.access_token !== db_resp[i].key_a || igTokens.refresh_token !== db_resp[i].key_b)) {
								await knex('Creator_Socials')
									.where('conn_id', db_resp[i].conn_id)
									.update({
										key_a: igTokens.access_token,
										key_b: igTokens.refresh_token
									});
							}
							return {
								platform: 'ig',
								platform_name: 'Instagram',
								username: igDetails.un,
								display_name: igDetails.dn,
								profile_picture: igDetails.pfp,
								account_id: db_resp[i].key_c
							};
						}
						return null;
					case "tt":
						const [ttSuccess, ttDetails, ttTokens] = await tiktok_getAccountDetails(
							db_resp[i].key_a,
							db_resp[i].key_b
						);
						if (ttSuccess) {
							// Update tokens if they were refreshed
							if (ttTokens && (ttTokens.access_token !== db_resp[i].key_a || ttTokens.refresh_token !== db_resp[i].key_b)) {
								await knex('Creator_Socials')
									.where('conn_id', db_resp[i].conn_id)
									.update({
										key_a: ttTokens.access_token,
										key_b: ttTokens.refresh_token
									});
							}
							return {
								platform: 'tt',
								platform_name: 'TikTok',
								username: ttDetails.un,
								display_name: ttDetails.dn,
								profile_picture: ttDetails.pfp,
								account_id: db_resp[i].key_c
							};
						}
						return null;
					default:
						return null;
				}
			};

			// Get account details (from cache or fetch)
			account_details = await get_social_details(db_resp[i].conn_id, fetchAccountDetails);

		} catch (error) {
			console.error(`Error getting account details for ${db_resp[i].platform}:`, error);
			continue;
		}

		if (account_details) {
			enriched_resp.push({
				'id': db_resp[i].conn_id,
				...account_details,
			});
		}
	}

	// Cache the result
	await cache_updateCreatorConnectedAccounts(creator_id, enriched_resp);

	return [true, enriched_resp];
}


// -------------------
// UPDATE Functions
// -------------------

// Add new function for updating creator details
async function db_updateCreatorDetails(user_id, creator_id, key, value) {
	let err_code;

	// Validate key
	if (!['email', 'name', 'phone'].includes(key)) {
		return [false, 'Invalid key'];
	}

	// Update creator details
	await knex('Users')
		.where({
			'id': creator_id,
			'user_typ': 'creator'
		})
		.update({
			[key]: value
		})
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	return [true, null];
}

// Add new function for reassigning creator handle
async function db_reassignCreatorHandle(user_id, handle, new_creator_id) {
	let err_code;

	// 1. Validate that the new creator exists and is a creator
	const newCreator = await knex('Users')
		.where({
			'id': new_creator_id,
			'user_typ': 'creator'
		})
		.first();
	
	if (!newCreator) {
		return [false, 'New creator not found or is not a creator'];
	}

	// 2. Find the current creator link with this handle
	const currentLink = await knex('Creator_Links')
		.where('handle', handle)
		.first();

	if (!currentLink) {
		return [false, 'Handle not found'];
	}

	// 3. Check if the new creator already has this handle
	const existingLink = await knex('Creator_Links')
		.where({
			'handle': handle,
			'platform': currentLink.platform,
			'user_id': new_creator_id
		})
		.first();

	if (existingLink) {
		return [false, 'New creator already has this handle'];
	}

	// 4. Update the creator link to point to the new creator
	await knex('Creator_Links')
		.where({
			'handle': handle,
			'platform': currentLink.platform
		})
		.update({
			'user_id': new_creator_id
		})
		.catch((err) => { if (err) err_code = err.code });

	if (err_code) {
		return [false, null];
	}

	return [true, null];
}


// -------------------
// ACCEPT INVITE Functions
// -------------------
async function db_acceptCreatorInvite(email, code, password) {
	let err_code;

	// Find the invite
	const invite = await knex('Invited_Creators')
		.where({
			'email': email,
			'invite_code': code
		})
		.first()
		.catch((err) => { if (err) err_code = err.code });

	if (err_code) return [false, 'Database error'];
	if (!invite) return [false, 'Invalid invitation code'];

	// Check if invite is expired (7 days)
	const inviteDate = new Date(invite.created_ts);
	const now = new Date();
	const daysDiff = (now - inviteDate) / (1000 * 60 * 60 * 24);

	if (daysDiff > 7) {
		// Delete expired invite
		await knex('Invited_Creators').where('id', invite.id).del();
		return [false, 'Invitation has expired'];
	}

	// Create the user account
	const [creator_id] = await knex('Users')
		.insert({
			'email': invite.email,
			'name': invite.name,
			'phone': invite.phone,
			'user_typ': 'creator'
		})
		.returning('id')
		.catch((err) => { if (err) err_code = err.code });

	if (err_code) return [false, 'Failed to create account'];

	// Add creator password
	const create_pass = await new Promise((resolve, _) => {
		db_createPassword(creator_id, password, function(pw_ok) {
			if (!pw_ok.ok) return resolve(false);
			return resolve(true);
		});
	});

	if (!create_pass) {
		// Rollback: delete the user if password creation fails
		await knex('Users').where('id', creator_id).del();
		return [false, 'Failed to set password'];
	}

	// Delete the invitation
	await knex('Invited_Creators')
		.where('id', invite.id)
		.del()
		.catch((err) => { if (err) console.error('Failed to delete invite:', err) });

	return [true, creator_id];
}

async function db_joinCreatorInvite(email, code, password) {
	let err_code;

	// Find the invite
	const invite = await knex('Invited_Creators')
		.where({
			'email': email,
			'invite_code': code
		})
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, 'Database error'];
	if (!invite) return [false, 'Invalid invitation code'];

	// Check if invite is expired (7 days)
	const inviteDate = new Date(invite.created_ts);
	const now = new Date();
	const daysDiff = (now - inviteDate) / (1000 * 60 * 60 * 24);

	if (daysDiff > 7) {
		// Delete expired invite
		await knex('Invited_Creators').where('id', invite.id).del();
		return [false, 'Invitation has expired'];
	}
	if (err_code) return [false, 'Failed to create account'];

	// Get creator details
	const creator = await knex('Users')
		.where({
			'email': invite.email,
			'user_typ': 'creator'
		})
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, 'Database error'];
	if (!creator) return [false, 'Creator not found'];

	// Add creator password
	const create_pass = await new Promise((resolve, _) => {
		db_createPassword(creator.id, password, function(pw_ok) {
			if (!pw_ok.ok) return resolve(false);
			return resolve(true);
		});
	});
	if (!create_pass) {
		return [false, 'Failed to set password'];
	}

	// Delete the invitation
	await knex('Invited_Creators')
		.where('id', invite.id)
		.del()
		.catch((err) => { if (err) console.error('Failed to delete invite:', err) });

	return [true, creator.id];
}


// -------------------
// DELETE Functions
// -------------------
async function db_removeCreator(user_id, creator_id) {
	let err_code;

	// Remove creator from entire platform
	await knex('Users')
		.where({
			'id': creator_id,
			'user_typ': 'creator'
		})
		.del()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	return [true, null];
}


// ----- Export -----
module.exports = {
	db_createCreatorAccount,
	db_manuallyAddCreator,
	db_manuallyInviteCreator,
	db_sendCreatorInviteEmail,
	db_acceptCreatorInvite,
	db_joinCreatorInvite,
	db_getCreators,
	db_getCreatorsCondensed,
	db_getCreatorDetails,
	db_getCreatorSubmissions,
	db_removeCreator,
	db_getCreatorConnectedAccounts,
	db_updateCreatorDetails,
	db_reassignCreatorHandle,
};