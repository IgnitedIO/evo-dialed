// Dependencies
const knex = require('knex')(require('../../../knexfile.js').development);
const fetch = require('node-fetch');

// Function Imports
const { encodeImage, convertEncodedImage } = require('../../../utils/convertEncodedImage.js');
const { convertUTCToESTDate, isTimestampOnESTDate } = require('../../../utils/timezoneUtils.js');
const { 
	scrapeCreators_getInstagramProfile,
	scrapeCreators_getTiktokProfile 
} = require('../../../external_apis/scrapecreators.js');

// Cache Imports
const { cache_getCampaignsList, cache_updateCampaignsList } = require('./funs_cache.js');
const { db_invalidateCampaignCache, db_invalidateCreatorCache } = require('../metrics/funs_db_cache.js');

// -------------------
// Helper Functions
// -------------------

/**
 * Download an image from a URL and convert it to a buffer
 * @param {string} url - URL of the image to download
 * @returns {Promise<Buffer|null>} Buffer containing the image data or null if download fails
 */
async function downloadImage(url) {
	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		
		const contentType = response.headers.get('content-type');
		if (!contentType?.startsWith('image/')) {
			throw new Error('URL does not point to an image');
		}

		const arrayBuffer = await response.arrayBuffer();
		return Buffer.from(arrayBuffer);
	} catch (error) {
		console.error('Error downloading image:', error);
		return null;
	}
}

/**
 * Scrape profile information for a given platform and handle
 * @param {string} platform - Platform identifier ('ig' or 'tt')
 * @param {string} handle - Social media handle
 * @param {boolean} isPreview - Whether this is a preview scrape (true) or final scrape (false)
 * @returns {Promise<[boolean, Object|null]>} Tuple of [success, data]
 */
async function scrapeProfileInfo(platform, handle, isPreview = false) {
	try {
		let profileInfo;
		
		switch (platform) {
			case 'ig':
				profileInfo = await scrapeCreators_getInstagramProfile(handle);
				break;
			
			case 'tt':
				profileInfo = await scrapeCreators_getTiktokProfile(handle);
				break;
			
			default:
				console.error(`Unsupported platform: ${platform}`);
				return [false, null];
		}

		// Download and process profile image
		let pfp = null;
		if (profileInfo.profile_image) {
			const imageBuffer = await downloadImage(profileInfo.profile_image);
			if (imageBuffer) {
				// Convert buffer to base64 string for storage
				pfp = imageBuffer.toString('base64');
			}
		}

		const profileData = {
			username: profileInfo.username,
			display_name: profileInfo.display_name || profileInfo.displayName || handle,
			pfp: pfp,
			profile_id: profileInfo.profile_id || profileInfo.profileId,
			bio: profileInfo.bio || null,
			num_posts: profileInfo.num_posts || 0,
			followers: profileInfo.followers || 0,
			following: profileInfo.following || 0,
			is_private: profileInfo.is_private ? 1 : 0
		};

		// If this is a preview scrape, store in Social_Preview_Info table
		if (isPreview) {
			const url = `https://${(platform === 'ig') ? 'instagram.com/' : 'tiktok.com/@'}${handle}`;
			await knex('Social_Preview_Info').insert({
				platform,
				url,
				handle,
				display_name: profileInfo.display_name || handle,
				pfp,
				follower_count: profileInfo.followers || 0,
				bio: profileInfo.bio || null,
				num_posts: profileInfo.num_posts || 0,
				following: profileInfo.following || 0,
				is_private: profileInfo.is_private ? 1 : 0
			}).onConflict(['handle', 'platform']).merge();
		}

		return [true, profileData];
	} catch (error) {
		console.error(`Error scraping profile info for ${platform}/${handle}:`, error);
		return [false, null];
	}
}

// -------------------
// CREATE Functions
// -------------------
async function db_addCampaignLink(user_id, campaign_id, url, title, description) {
	let err_code;

	// Add link
	const [new_link_id] = await knex('Campaign_Links')
		.insert({
			'campaign_id': campaign_id,
			'url': url,
			'title': title,
			'description': description
		})
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];
	return [true, new_link_id];
}

async function db_inviteCreator(user_id, campaign_id, creator_user_id, num_posts, frequency, start_date, end_date) {
	let err_code;

	// Add creator assignment
	await knex('Creator_Assignments')
		.insert({
			'campaign_id': campaign_id,
			'user_id': creator_user_id,
			'num_posts': num_posts,
			'frequency': frequency,
			'start_date': start_date,
			'end_date': end_date
		})
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Update cache
	db_getCampaigns(user_id, true);

	// Invalidate metrics cache for both campaign and creator
	await Promise.all([
		db_invalidateCampaignCache(campaign_id),
		db_invalidateCreatorCache(creator_user_id)
	]);

	// Return
	return [true, null];
}

async function db_createCampaign(user_id, name, description, img, supports_ig, supports_tt, budget, start_date, end_date, status) {
	let err_code;

	// Create campaign
	const result = await knex('Campaigns')
		.insert({
			'name': name,
			'description': description,
			'img': encodeImage(img),
			'supports_ig': supports_ig ? 1 : 0,
			'supports_tt': supports_tt ? 1 : 0,
			'budget': budget,
			'start_date': start_date || new Date(),
			'end_date': end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
			'status': status || 'active'
		})
		.catch((err) => { if (err) err_code = err });
	if (err_code) console.log ("ERR = ", err_code);
	if (err_code) return [false, null];
	
	// Get the inserted ID
	const campaign_id = result[0];

	// Update cache
	db_getCampaigns(user_id, true);

	// Return
	return [true, campaign_id];
}


// -------------------
// READ Functions
// -------------------

/**
 * Check if a handle/platform combination already exists in Social_Preview_Info
 * @param {string} platform - Platform identifier ('ig' or 'tt')
 * @param {string} handle - Social media handle
 * @returns {Promise<[boolean, Object|null]>} Tuple of [exists, data]
 */
async function db_findCreatorPreview(platform, handle) {
	let err_code;

	// Check if the handle/platform combination already exists
	const existingPreview = await knex('Social_Preview_Info').where({
		platform,
		handle
	}).first().catch((err) => { if (err) err_code = err.code });	
	if (err_code) {
		console.log("DBE = ", err_code);
		return [false, null];
	}
	if (!existingPreview) return [false, null];

	// Return existing data
	return [true, {
		username: existingPreview.handle,
		display_name: existingPreview.display_name,
		pfp: existingPreview.pfp,
		profile_id: null, // Not stored in preview table
		bio: existingPreview.bio,
		num_posts: existingPreview.num_posts,
		followers: existingPreview.follower_count,
		following: existingPreview.following,
		is_private: existingPreview.is_private
	}];
}

async function db_getCampaigns(user_id, force_cache_refresh = false, cd_user_id = null) {
	let err_code;

	// Check cache first (skip cache if filtering by CD)
	if (!force_cache_refresh && !cd_user_id) {
		const cached_data = await cache_getCampaignsList();
		if (cached_data) return [true, cached_data];
	}

	// Get all campaigns with basic info
	let query = knex('Campaigns')
		.select(
			'id',
			'name',
			'img',
			'description',
			'supports_ig',
			'supports_tt',
			'created_ts',
			'status',
			'budget',
			'start_date',
			'end_date'
		);

	// Apply creative director filter if provided
	if (cd_user_id) {
		query = query.where('assigned_cd', cd_user_id);
	}

	const campaigns = await query.catch((err) => { if (err) err_code = err.code });
	if (err_code) console.log("DBE = ", err_code);
	if (err_code) return [false, null];

	// Get submission counts for each campaign
	const submissions = await knex('Campaign_Submissions')
		.groupBy('campaign_id')
		.select('campaign_id')
		.count('npc_id as submitted')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) console.log("DBE 2 = ", err_code);
	if (err_code) return [false, null];

	// Get creator assignments for each campaign
	const creators = await knex('Creator_Assignments')
		.select(
			'campaign_id',
			'frequency',
			'num_posts',
			'start_date',
			'end_date'
		)
		.catch((err) => { if (err) err_code = err });
	if (err_code) console.log("DBE 3 = ", err_code);
	if (err_code) return [false, null];

	// Get creator counts separately
	const creator_counts = await knex('Creator_Assignments')
		.groupBy('campaign_id')
		.select('campaign_id')
		.count('user_id as creators')
		.catch((err) => { if (err) err_code = err });
	if (err_code) console.log("DBE 4 = ", err_code);
	if (err_code) return [false, null];

	// Combine the data
	const enriched_campaigns = campaigns.map(campaign => {
		const submission_count = submissions.find(s => s.campaign_id === campaign.id)?.submitted || 0;
		const creator_assignments = creators.filter(c => c.campaign_id === campaign.id);
		const creator_count = creator_counts.find(c => c.campaign_id === campaign.id)?.creators || 0;
		
		// Calculate total posts based on frequency and date range
		const total_posts = creator_assignments.reduce((total, assignment) => {
			const days_diff = Math.max(0, Math.floor((new Date() - new Date(assignment.start_date)) / (1000 * 60 * 60 * 24)));
			let multiplier;
			
			switch(assignment.frequency) {
				case 'daily':
					multiplier = days_diff;
					break;
				case 'weekly':
					multiplier = Math.floor(days_diff / 7);
					break;
				case 'monthly':
					multiplier = Math.floor(days_diff / 30);
					break;
				default:
					multiplier = 0;
			}
			
			return total + (assignment.num_posts * multiplier);
		}, 0);
		
		return {
			...campaign,
			img: campaign.img ? convertEncodedImage(campaign.img) : null,
			status: campaign.status,
			submitted: submission_count,
			creator_count: creator_count,
			total_posts: total_posts,
			progress: {
				submitted: submission_count,
				total: total_posts
			},
			platforms: {
				instagram: campaign.supports_ig === 1,
				tiktok: campaign.supports_tt === 1
			}
		};
	});

	// Update cache (only if not filtering by CD)
	if (!cd_user_id) {
		cache_updateCampaignsList(enriched_campaigns);
	}

	// Return
	return [true, enriched_campaigns];
}

async function db_getCampaignDetails(user_id, campaign_id) {
	let err_code;

	// 1. Get campaign details
	const campaign = await knex('Campaigns')
		.where('id', campaign_id)
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// 2. Get campaign links
	const links = await knex('Campaign_Links')
		.where('campaign_id', campaign_id)
		.select('title', 'url', 'description')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// 3. Get creator_links (enriched assignments)
	const creator_links = await knex('Creator_Links as cl')
		.join('Users as u', 'cl.user_id', 'u.id')
		.join('Creator_Assignments as ca', function() {
			this.on('ca.campaign_id', '=', 'cl.campaign_id')
				.andOn('ca.user_id', '=', 'cl.user_id');
		})
		.where('cl.campaign_id', campaign_id)
		.select(
			'cl.clink_id as id',
			'cl.platform',
			'cl.handle',
			'cl.pfp as account_pfp',
			'cl.url',
			'ca.num_posts',
			'ca.frequency',
			'u.id as creator_id',
			'u.name as name',
			'u.pfp as creator_pfp',
			'u.email as creator_email',
			knex.raw(`
				CAST(
					CASE 
						WHEN ca.frequency = 'daily' THEN 
							ca.num_posts * DATEDIFF(
								LEAST(ca.end_date, CURRENT_TIMESTAMP),
								ca.start_date
							)
						WHEN ca.frequency = 'weekly' THEN 
							ca.num_posts * FLOOR(
								DATEDIFF(
									LEAST(ca.end_date, CURRENT_TIMESTAMP),
									ca.start_date
								) / 7
							)
						WHEN ca.frequency = 'monthly' THEN 
							ca.num_posts * (
								(YEAR(LEAST(ca.end_date, CURRENT_TIMESTAMP)) - YEAR(ca.start_date)) * 12 + 
								(MONTH(LEAST(ca.end_date, CURRENT_TIMESTAMP)) - MONTH(ca.start_date)) +
								CASE 
									WHEN DAY(LEAST(ca.end_date, CURRENT_TIMESTAMP)) >= DAY(ca.start_date) THEN 1
									ELSE 0
								END
							)
					END AS UNSIGNED
				) as total_assigned_posts
			`)
		)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Get submission counts for each creator link in this campaign
	const submissions = await knex('Campaign_Submissions as cs')
		.where('cs.campaign_id', campaign_id)
		.groupBy('cs.clink_id')
		.select('cs.clink_id')
		.count('cs.npc_id as submitted')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Enrich creator links with submission counts
	const enriched_assignments = creator_links.map(link => {
		const submission_count = submissions.find(s => s.clink_id === link.id)?.submitted || 0;
		return {
			id: link.id, // clink_id
			creator: {
				id: link.creator_id,
				name: link.name,
				email: link.creator_email,
				pfp: link.creator_pfp ? convertEncodedImage(link.creator_pfp) : null
			},
			account: {
				platform: link.platform,
				handle: link.handle,
				display_name: link.name,
				pfp: link.account_pfp ? convertEncodedImage(link.account_pfp) : null,
				url: link.url
			},
			num_posts: link.num_posts,
			total_assigned_posts: link.total_assigned_posts || 0,
			submitted: submission_count,
			frequency: link.frequency
		};
	});

	// 4. Get submission metrics with creator details
	const submissions_metrics = await knex('Campaign_Submissions as cs')
		.join('Campaign_Submissions_Metrics as csm', 'cs.npc_id', 'csm.npc_id')
		.join('Creator_Socials as soc', 'cs.conn_id', 'soc.conn_id')
		.join('Users as u', 'soc.user_id', 'u.id')
		.where('cs.campaign_id', campaign_id)
		.select(
			'cs.npc_id',
			'cs.submit_ts',
			'csm.views',
			'csm.likes',
			'csm.comments',
			'csm.shares',
			'soc.platform',
			'soc.key_c as account_id',
			'u.email as creator_email'
		)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Calculate total metrics
	const metrics = submissions_metrics.reduce((acc, curr) => ({
		views: acc.views + curr.views,
		likes: acc.likes + curr.likes,
		comments: acc.comments + curr.comments,
		shares: acc.shares + curr.shares
	}), { views: 0, likes: 0, comments: 0, shares: 0 });

	// 5. Get creative director info if assigned
	let creative_director = null;
	if (campaign.assigned_cd) {
		const cd = await knex('Users')
			.where('id', campaign.assigned_cd)
			.select('id', 'name', 'pfp')
			.first()
			.catch((err) => { if (err) err_code = err.code });

		if (cd) {
			creative_director = {
				id: cd.id,
				name: cd.name,
				pfp: cd.pfp ? convertEncodedImage(cd.pfp) : null
			};
		}
	}

	return [true, {
		...campaign,
		img: campaign.img || null,
		links,
		assignments: enriched_assignments,
		submissions: submissions_metrics,
		metrics,
		total_creators: enriched_assignments.length,
		total_submissions: submissions_metrics.length,
		creative_director
	}];
}

async function db_getCampaignPosts(user_id, campaign_id, page = 1, pageSize = 25) {
	let err_code;
	const offset = (page - 1) * pageSize;

	console.time(`[POSTS] Count`);
	const [{ count }] = await knex('Campaign_Submissions as cs')
		.where('cs.campaign_id', campaign_id)
		.count('* as count')
		.catch((err) => { if (err) err_code = err.code });
	console.timeEnd(`[POSTS] Count`);
	if (err_code) return [false, null];

	console.time(`[POSTS] Main Query`);
	const posts = await knex('Campaign_Submissions as cs')
		.leftJoin(knex.raw(`
			(
				SELECT m1.*
				FROM Campaign_Submissions_Metrics m1
				INNER JOIN (
					SELECT npc_id, MAX(recorded_ts) AS latest_ts
					FROM Campaign_Submissions_Metrics
					GROUP BY npc_id
				) m2 ON m1.npc_id = m2.npc_id AND m1.recorded_ts = m2.latest_ts
			) as latest_metrics
		`), 'cs.npc_id', 'latest_metrics.npc_id')
		.where('cs.campaign_id', campaign_id)
		.select(
			'cs.npc_id',
			'cs.caption',
			'cs.post_url',
			'cs.thumbnail',
			'cs.post_ts',
			'cs.submit_ts',
			'cs.clink_id',
			'latest_metrics.views',
			'latest_metrics.likes',
			'latest_metrics.comments',
			'latest_metrics.shares'
		)
		.orderBy('cs.submit_ts', 'desc')
		.limit(pageSize)
		.offset(offset)
		.catch((err) => { if (err) err_code = err.code });
	console.timeEnd(`[POSTS] Main Query`);
	if (err_code) return [false, null];

	console.time(`[POSTS] Creator Join`);
	const clinkIds = posts.filter(p => p.clink_id).map(p => p.clink_id);
	let creators = [];
	if (clinkIds.length > 0) {
		creators = await knex('Creator_Links as cl')
			.join('Users as u', 'cl.user_id', 'u.id')
			.whereIn('cl.clink_id', clinkIds)
			.select(
				'cl.clink_id',
				'cl.platform',
				'cl.pfp as creator_pfp',
				'cl.handle',
				'cl.display_name',
				'u.id as user_id',
				'u.name as user_name',
				'u.pfp as user_pfp'
			)
			.catch((err) => { if (err) err_code = err.code });
	}
	console.timeEnd(`[POSTS] Creator Join`);
	if (err_code) return [false, null];

	console.time(`[POSTS] Formatting`);
	const formatted_posts = posts.map(post => {
		const creator = creators.find(c => c.clink_id === post.clink_id);
		
		return {
			post: {
				id: post.npc_id,
				caption: post.caption,
				post_url: post.post_url,
				thumbnail: post.thumbnail,
				post_ts: post.post_ts,
				submit_ts: post.submit_ts
			},
			creator: creator ? {
				platform: creator.platform,
				pfp: creator.creator_pfp ? convertEncodedImage(creator.creator_pfp) : null,
				handle: creator.handle,
				display_name: creator.display_name
			} : null,
			metrics: {
				views: post.views || 0,
				likes: post.likes || 0,
				comments: post.comments || 0,
				shares: post.shares || 0
			},
			user: creator ? {
				id: creator.user_id,
				name: creator.user_name,
				pfp: creator.user_pfp ? convertEncodedImage(creator.user_pfp) : null
			} : null
		};
	});
	console.timeEnd(`[POSTS] Formatting`);

	return [true, {
		posts: formatted_posts,
		pagination: {
			total: parseInt(count),
			page,
			pageSize,
			totalPages: Math.ceil(parseInt(count) / pageSize)
		}
	}];
}


async function db_getCampaignSubmissions(user_id, campaign_id, page = 1, pageSize = 25) {
	let err_code;

	// Calculate offset
	const offset = (page - 1) * pageSize;

	// Get total count first
	const [{ count }] = await knex('Campaign_Submissions as cs')
		.join('Creator_Links as cl', 'cs.clink_id', 'cl.clink_id')
		.where('cs.campaign_id', campaign_id)
		.count('* as count')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Get paginated submissions with latest metrics
	const submissions = await knex('Campaign_Submissions as cs')
		.join('Creator_Links as cl', 'cs.clink_id', 'cl.clink_id')
		.join('Users as u', 'cl.user_id', 'u.id')
		.leftJoin('Campaign_Submissions_Metrics as csm', function() {
			this.on('cs.npc_id', '=', 'csm.npc_id')
				.andOn('csm.recorded_ts', '=', function() {
					this.select(knex.raw('MAX(m3.recorded_ts)'))
						.from('Campaign_Submissions_Metrics as m3')
						.whereRaw('m3.npc_id = cs.npc_id');
				});
		})
		.where('cs.campaign_id', campaign_id)
		.select(
			'cs.npc_id',
			'cs.url',
			'cs.title',
			'cs.description',
			'cs.submitted_ts',
			'cs.status',
			'u.name as creator_name',
			'cl.handle',
			'cl.platform',
			'csm.views',
			'csm.likes',
			'csm.comments',
			'csm.shares'
		)
		.orderBy('cs.submitted_ts', 'desc')
		.limit(pageSize)
		.offset(offset)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	return [true, {
		submissions,
		pagination: {
			total: parseInt(count),
			page,
			pageSize,
			totalPages: Math.ceil(parseInt(count) / pageSize)
		}
	}];
}

async function db_getCreators(user_id, campaign_id) {
	let err_code;

	// Get creators assigned to this campaign with their details
	const creators = await knex('Creator_Assignments as ca')
		.join('Users as u', 'ca.user_id', 'u.id')
		.leftJoin('Creator_Socials as cs', 'u.id', 'cs.user_id')
		.where('ca.campaign_id', campaign_id)
		.select(
			'u.id',
			'u.name',
			'u.email',
			'u.pfp',
			'u.created_ts',
			'ca.num_posts',
			knex.raw('GROUP_CONCAT(DISTINCT cs.platform) as platforms'),
			knex.raw(`
				CAST(
					CASE 
						WHEN ca.frequency = 'daily' THEN 
							ca.num_posts * DATEDIFF(
								LEAST(ca.end_date, CURRENT_TIMESTAMP),
								ca.start_date
							)
						WHEN ca.frequency = 'weekly' THEN 
							ca.num_posts * FLOOR(
								DATEDIFF(
									LEAST(ca.end_date, CURRENT_TIMESTAMP),
									ca.start_date
								) / 7
							)
						WHEN ca.frequency = 'monthly' THEN 
							ca.num_posts * (
								(YEAR(LEAST(ca.end_date, CURRENT_TIMESTAMP)) - YEAR(ca.start_date)) * 12 + 
								(MONTH(LEAST(ca.end_date, CURRENT_TIMESTAMP)) - MONTH(ca.start_date)) +
								CASE 
									WHEN DAY(LEAST(ca.end_date, CURRENT_TIMESTAMP)) >= DAY(ca.start_date) THEN 1
									ELSE 0
								END
							)
					END AS UNSIGNED
				) as total_assigned_posts
			`)
		)
		.groupBy('u.id')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Get submission counts for each creator in this campaign
	const submissions = await knex('Campaign_Submissions as cs')
		.join('Creator_Socials as soc', 'cs.conn_id', 'soc.conn_id')
		.where('cs.campaign_id', campaign_id)
		.groupBy('soc.user_id')
		.select('soc.user_id')
		.count('cs.npc_id as submitted')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Get total campaigns for each creator
	const campaigns = await knex('Creator_Assignments')
		.groupBy('user_id')
		.select('user_id')
		.count('campaign_id as campaigns')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Get engagement metrics for each creator
	const metrics = await knex('Campaign_Submissions as cs')
		.join('Campaign_Submissions_Metrics as csm', 'cs.npc_id', 'csm.npc_id')
		.join('Creator_Socials as soc', 'cs.conn_id', 'soc.conn_id')
		.where('cs.campaign_id', campaign_id)
		.groupBy('soc.user_id')
		.select('soc.user_id')
		.sum('csm.views as views')
		.sum('csm.likes as likes')
		.sum('csm.comments as comments')
		.sum('csm.shares as shares')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Combine the data
	const enriched_creators = creators.map(creator => {
		const submission_count = submissions.find(s => s.user_id === creator.id)?.submitted || 0;
		const campaign_count = campaigns.find(c => c.user_id === creator.id)?.campaigns || 0;
		const creator_metrics = metrics.find(m => m.user_id === creator.id) || { views: 0, likes: 0, comments: 0, shares: 0 };
		
		// Calculate engagement rate
		const total_engagement = creator_metrics.likes + creator_metrics.comments + creator_metrics.shares;
		const engagement_rate = creator_metrics.views > 0 ? total_engagement / creator_metrics.views : 0;

		return {
			...creator,
			platforms: creator.platforms ? {
				instagram: creator.platforms.includes('ig'),
				tiktok: creator.platforms.includes('tt')
			} : { instagram: false, tiktok: false },
			submitted: submission_count,
			campaigns: campaign_count,
			engagement_rate,
			metrics: creator_metrics,
			assignment: {
				num_posts: creator.num_posts,
				frequency: creator.frequency,
				start_date: creator.start_date,
				end_date: creator.end_date,
				total_assigned_posts: creator.total_assigned_posts
			}
		};
	});

	return [true, enriched_creators];
}

async function db_getAvailableCreators(user_id, campaign_id) {
	let err_code;

	// First, get campaign details to check supported platforms
	const campaign = await knex('Campaigns')
		.where('id', campaign_id)
		.first()
		.catch((err) => { if (err) err_code = err });
	if (err_code) console.log("ERR -1 = ", err_code);
	if (err_code || !campaign) return [false, null];

	// Get currently assigned creator IDs to exclude them
	const assignedCreators = await knex('Creator_Assignments')
		.where('campaign_id', campaign_id)
		.select('user_id')
		.catch((err) => { if (err) err_code = err });
	if (err_code) console.log("ERR 0 = ", err_code);
	if (err_code) return [false, null];

	const assignedCreatorIds = assignedCreators.map(row => row.user_id);

	// Build platform conditions for the query
	const platformConditions = [];
	if (campaign.supports_ig) platformConditions.push('ig');
	if (campaign.supports_tt) platformConditions.push('tt');

	// If no platforms are supported, return empty list
	if (platformConditions.length === 0) {
		return [true, []];
	}

	// 1. Get basic creator info and their platforms
	const creators = await knex('Users as u')
		.join('Creator_Socials as cs', 'u.id', 'cs.user_id')
		.whereNotIn('u.id', assignedCreatorIds)
		.whereIn('cs.platform', platformConditions)
		.select('u.id', 'u.name', 'u.pfp', 'cs.platform')
		.orderBy('u.name', 'asc')
		.catch((err) => { if (err) err_code = err });
	if (err_code) console.log("ERR 1 = ", err_code);
	if (err_code) return [false, null];

	// 2. Get submission counts for these creators
	const submissions = await knex('Campaign_Submissions as s')
		.join('Creator_Socials as cs', 's.conn_id', 'cs.conn_id')
		.whereIn('cs.user_id', creators.map(c => c.id))
		.groupBy('cs.user_id')
		.select('cs.user_id')
		.count('s.npc_id as submission_count')
		.catch((err) => { if (err) err_code = err });
	if (err_code) console.log("ERR 2 = ", err_code);
	if (err_code) return [false, null];

	// 3. Get campaign counts for these creators
	const campaigns = await knex('Creator_Assignments')
		.whereIn('user_id', creators.map(c => c.id))
		.groupBy('user_id')
		.select('user_id')
		.count('campaign_id as campaign_count')
		.catch((err) => { if (err) err_code = err });
	if (err_code) console.log("ERR 3 = ", err_code);
	if (err_code) return [false, null];

	// 4. Get metrics for these creators
	const metrics = await knex('Campaign_Submissions as s')
		.join('Creator_Socials as cs', 's.conn_id', 'cs.conn_id')
		.join('Campaign_Submissions_Metrics as sm', 'sm.npc_id', 's.npc_id')
		.whereIn('cs.user_id', creators.map(c => c.id))
		.groupBy('cs.user_id')
		.select('cs.user_id')
		.sum('sm.views as total_views')
		.sum('sm.likes as total_likes')
		.sum('sm.comments as total_comments')
		.sum('sm.shares as total_shares')
		.catch((err) => { if (err) err_code = err });
	if (err_code) console.log("ERR 4 = ", err_code);
	if (err_code) return [false, null];

	// Combine all the data
	const enriched_creators = creators.reduce((acc, creator) => {
		// Group platforms for this creator
		const creatorPlatforms = creators
			.filter(c => c.id === creator.id)
			.map(c => c.platform);

		// Get metrics and counts
		const submissionCount = submissions.find(s => s.user_id === creator.id)?.submission_count || 0;
		const campaignCount = campaigns.find(c => c.user_id === creator.id)?.campaign_count || 0;
		const creatorMetrics = metrics.find(m => m.user_id === creator.id) || {
			total_views: 0,
			total_likes: 0,
			total_comments: 0,
			total_shares: 0
		};

		// Only add each creator once
		if (!acc.find(c => c.id === creator.id)) {
			acc.push({
				id: creator.id,
				name: creator.name,
				pfp: creator.pfp ? convertEncodedImage(creator.pfp) : null,
				platforms: {
					instagram: creatorPlatforms.includes('ig'),
					tiktok: creatorPlatforms.includes('tt')
				},
				total_submissions: submissionCount,
				total_campaigns: campaignCount,
				total_views: creatorMetrics.total_views || 0,
				total_likes: creatorMetrics.total_likes || 0,
				total_comments: creatorMetrics.total_comments || 0,
				total_shares: creatorMetrics.total_shares || 0
			});
		}
		return acc;
	}, []);

	return [true, enriched_creators];
}

async function db_getAvailableCampaigns(user_id, creator_id) {
	let err_code;

	// Get all campaigns that the creator is not assigned to
	const campaigns = await knex('Campaigns as c')
		.whereNotExists(function() {
			this.select('*')
				.from('Creator_Assignments')
				.whereRaw('Creator_Assignments.campaign_id = c.id')
				.where('Creator_Assignments.user_id', creator_id);
		})
		.select(
			'id',
			'name',
			'img',
			'description',
			'supports_ig',
			'supports_tt',
			'created_ts'
		)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	return [true, {
		...campaigns,
		img: convertEncodedImage(campaigns.img)
	}];
}

async function db_getCreatorDailyPosts(creator_id, campaign_id) {	
	let err_code;
	let query = knex('Campaign_Submissions as cs')
		.join('Creator_Links as cl', 'cs.clink_id', 'cl.clink_id')
		.where('cl.clink_id', creator_id)
		.select('cs.post_ts');
	if (campaign_id) {
		query = query.andWhere('cs.campaign_id', campaign_id);
	}
	const results = await query.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];
	
	// Group by EST date
	const estDateGroups = {};
	(results || []).forEach(r => {
		const estDateString = convertUTCToESTDate(r.post_ts);
		
		if (!estDateGroups[estDateString]) {
			estDateGroups[estDateString] = 0;
		}
		estDateGroups[estDateString] += 1;
	});
	
	const formatted = Object.entries(estDateGroups)
		.map(([date, post_count]) => ({ date, post_count }))
		.sort((a, b) => a.date.localeCompare(b.date));
	
	return [true, formatted];
}

async function db_getPostsOnDate(creator_id, campaign_id, date) {
  let err_code;
  let query = knex("Campaign_Submissions as cs")
    .join("Creator_Links as cl", "cs.clink_id", "cl.clink_id")
    .where("cl.clink_id", creator_id)
    .select(
      "cs.npc_id",
      "cs.caption",
      "cs.post_url",
      "cs.thumbnail",
      "cs.post_ts",
      "cs.submit_ts",
      "cs.campaign_id",
      "cl.platform",
      "cl.handle",
      "cl.url",
      "cl.display_name",
      "cl.pfp"
    )
    .orderBy("cs.post_ts", "asc");

  if (campaign_id) {
    query = query.andWhere("cs.campaign_id", campaign_id);
  }

  const results = await query.catch((err) => {
    if (err) err_code = err.code;
  });
  if (err_code) return [false, null];

  // Filter posts by EST date
  const filteredResults = (results || []).filter(post => {
    return isTimestampOnESTDate(post.post_ts, date);
  });

  const formatted = filteredResults.map(post => ({
    ...post,
    pfp: post.pfp ? convertEncodedImage(post.pfp) : null
  }));

  return [true, formatted];
}

// -------------------
// UPDATE Functions
// -------------------
async function db_updateCampaignLink(user_id, campaign_id, url, title, description) {
	let err_code;

	// Update link
	await knex('Campaign_Links')
		.where({
			'campaign_id': campaign_id,
			'url': url
		})
		.update({
			'title': title,
			'description': description
		})
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	return [true, null];
}

async function db_updateCampaignSettings(user_id, campaign_id, key, value) {
	let err_code;

	// Update setting
	await knex('Campaigns')
		.where('id', campaign_id)
		.update({ [key]: value })
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Update cache
	db_getCampaigns(user_id, true);

	// Return
	return [true, null];
}

async function db_bulkAssignCampaigns(user_id, creator_id, assignments) {
	let err_code;

	try {
		await knex.transaction(async (trx) => {
			// Insert all assignments
			for (const assignment of assignments) {
				await trx('Creator_Assignments')
					.insert({
						user_id: creator_id,
						campaign_id: assignment.campaign_id,
						num_posts: assignment.num_posts,
						frequency: assignment.frequency,
						start_date: assignment.start_date,
						end_date: assignment.end_date
					})
					.onConflict().merge()
					.catch((err) => { if (err) err_code = err.code });
			}
		});

		if (err_code) return [false, null];
	} catch (err) {
		console.log("DBE = ", err);
		return [false, null];
	}

	// Update cache
	db_getCampaigns(user_id, true);

	// Invalidate metrics cache for creator and all affected campaigns
	const campaignIds = assignments.map(a => a.campaign_id);
	await Promise.all([
		db_invalidateCreatorCache(creator_id),
		...campaignIds.map(campaignId => db_invalidateCampaignCache(campaignId))
	]);

	// Return
	return [true, null];
}

async function db_bulkAssignCreators(user_id, campaign_id, assignments) {
	let err_code;

	// Validate campaign exists and user has access
	const campaign = await knex('Campaigns')
		.where('id', campaign_id)
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code || !campaign) return [false, null];

	// Start a transaction
	const trx = await knex.transaction();

	try {
		// Remove existing assignments for these creators
		await trx('Creator_Assignments')
			.where('campaign_id', campaign_id)
			.whereIn('user_id', assignments.map(a => a.creator_id))
			.delete();

		// Insert new assignments
		await trx('Creator_Assignments')
			.insert(assignments.map(a => ({
				campaign_id,
				user_id: a.creator_id,
				num_posts: a.num_posts,
				frequency: a.frequency,
				start_date: a.start_date,
				end_date: a.end_date
			})));

		await trx.commit();

	} catch (err) {
		await trx.rollback();
		return [false, null];
	}

	// Update cache
	db_getCampaigns(user_id, true);

	// Invalidate metrics cache for campaign and all affected creators
	const creatorIds = assignments.map(a => a.creator_id);
	await Promise.all([
		db_invalidateCampaignCache(campaign_id),
		...creatorIds.map(creatorId => db_invalidateCreatorCache(creatorId))
	]);

	// Return
	return [true, null];
}

async function db_bulkAssignCreatorsV2(user_id, campaign_id, assignments) {
	let err_code;

	// Validate campaign exists and user has access
	const campaign = await knex('Campaigns')
		.where('id', campaign_id)
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code || !campaign) return false;

	// Group assignments by creator_id to handle multiple accounts per creator
	const creatorAssignments = assignments.reduce((acc, assignment) => {
		if (!acc[assignment.creator_id]) {
			acc[assignment.creator_id] = {
				creator_id: assignment.creator_id,
				accounts: []
			};
		}
		acc[assignment.creator_id].accounts.push(assignment);
		return acc;
	}, {});

	// Start a transaction
	const trx = await knex.transaction();

	try {
		// Process each creator's assignments
		for (const creatorData of Object.values(creatorAssignments)) {
			// Remove existing assignment for this creator
			await trx('Creator_Assignments')
				.where({
					campaign_id,
					user_id: creatorData.creator_id
				})
				.del();

			// Create new assignment for this creator
			// Use the first account's frequency and calculate total posts
			const firstAccount = creatorData.accounts[0];
			const totalPosts = creatorData.accounts.reduce((sum, acc) => sum + acc.num_posts, 0);
			
			await trx('Creator_Assignments')
				.insert({
					campaign_id,
					user_id: creatorData.creator_id,
					num_posts: totalPosts,
					frequency: firstAccount.frequency,
					start_date: new Date(),
					end_date: campaign.end_date
				});

			// Create Creator_Links entries for each account
			for (const account of creatorData.accounts) {
				// Map platform names to database enum values
				const platform = account.platform === 'instagram' ? 'ig' : 'tt';
				
				// Check if link already exists
				const existingLink = await trx('Creator_Links')
					.where({
						handle: account.handle,
						platform
					})
					.first();

				if (!existingLink) {
					// Get preview data from Social_Preview_Info
					const previewData = await trx('Social_Preview_Info')
						.where({
							handle: account.handle,
							platform
						})
						.first();

					if (previewData) {
						// Create new link using preview data
						await trx('Creator_Links').insert({
							campaign_id,
							user_id: creatorData.creator_id,
							platform,
							handle: account.handle,
							url: previewData.url,
							display_name: previewData.display_name,
							pfp: previewData.pfp
						});

						// Delete the preview data since we've used it
						await trx('Social_Preview_Info')
							.where({
								handle: account.handle,
								platform
							})
							.del();
					} else {
						// Fallback to scraping if no preview data exists
						const [scrape_ok, scrape_info] = await scrapeProfileInfo(platform, account.handle);
						
						if (scrape_ok) {
							await trx('Creator_Links').insert({
								campaign_id,
								user_id: creatorData.creator_id,
								platform,
								handle: account.handle,
								url: `https://${(platform === 'ig') ? 'instagram.com/' : 'tiktok.com/@'}${account.handle}`,
								display_name: scrape_info.display_name,
								pfp: scrape_info.pfp
							});
						}
					}
				}
			}
		}

		await trx.commit();

	} catch (err) {
		await trx.rollback();
		console.log("DBE = ", err);
		return false;
	}

	// Update cache
	db_getCampaigns(user_id, true);

	// Invalidate metrics cache for campaign and all affected creators
	const creatorIds = Object.keys(creatorAssignments).map(id => parseInt(id));
	await Promise.all([
		db_invalidateCampaignCache(campaign_id),
		...creatorIds.map(creatorId => db_invalidateCreatorCache(creatorId))
	]);

	// Return
	return true;
}



// -------------------
// DELETE Functions
// -------------------
async function db_removeCampaignLink(campaign_id, url) {
	let err_code;

	// Remove link
	await knex('Campaign_Links')
		.where({
			'campaign_id': campaign_id,
			'url': url
		})
		.del()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	return [true, null];
}

async function db_removeCreatorFromCampaign(user_id, campaign_id, creator_user_id, creator_link_id) {
	let err_code;

	// Check if there are other creator links for this campaign/user combination
	const otherLinks = await knex('Creator_Links').where({
		campaign_id,
		'user_id': creator_user_id,
	}).whereNot({
		'clink_id': creator_link_id
	}).first().catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Only remove creator assignment if there are no other links for this campaign/user
	if (!otherLinks) {
		await knex('Creator_Assignments').where({
			campaign_id,
			user_id: creator_user_id
		}).del().catch((err) => { if (err) err_code = err.code });
		if (err_code) return [false, null];
	}

	// Remove creator link
	await knex('Creator_Links').where({
		'clink_id': creator_link_id
	}).del().catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Update cache
	db_getCampaigns(user_id, true);

	// Invalidate metrics cache for both campaign and creator
	await Promise.all([
		db_invalidateCampaignCache(campaign_id),
		db_invalidateCreatorCache(creator_user_id)
	]);

	// Return
	return [true, null];
}

async function db_deleteCampaign(user_id, campaign_id) {
	let err_code;
	await knex('Campaigns').where('id', campaign_id).del().catch((err) => { if (err) err_code = err.code });
	if (err_code) return false;
	return true;
}

/**
 * Generate or retrieve share link for a campaign
 * @param {number} campaign_id - The campaign ID
 * @returns {Promise<string|null>} The share link code or null if error
 */
async function db_generateShareLink(campaign_id) {
	try {
		// First, check if the campaign already has a share link
		const campaign = await knex('Campaigns')
			.where('id', campaign_id)
			.select('share_link')
			.first();

		if (!campaign) {
			console.error('Campaign not found:', campaign_id);
			return null;
		}

		// If share link already exists, return it
		if (campaign.share_link) {
			return campaign.share_link;
		}

		// Generate a new share link
		const chars = 'ABCDEFGHKLOPQRSTUVWXYZabcdefghklopqrstuvwxyz23456789';
		let shareLink;
		let attempts = 0;
		const maxAttempts = 10;

		// Keep generating until we find a unique one
		while (attempts < maxAttempts) {
			// Generate code in format: XXXX-XXXXXX-XXXX
			const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
			const part2 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
			const part3 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

			shareLink = `${part1}-${part2}-${part3}`;

			// Check if this share link already exists
			const existing = await knex('Campaigns')
				.where('share_link', shareLink)
				.first();

			if (!existing) {
				// Update the campaign with the new share link
				await knex('Campaigns')
					.where('id', campaign_id)
					.update({ share_link: shareLink });

				return shareLink;
			}

			attempts++;
		}

		console.error('Failed to generate unique share link after', maxAttempts, 'attempts');
		return null;
	} catch (error) {
		console.error('Error in db_generateShareLink:', error);
		return null;
	}
}

async function db_assignCreativeDirector(user_id, campaign_id, cd_user_id) {
	let err_code;

	// Verify the user being assigned is a creative director
	const user = await knex('Users')
		.where('id', cd_user_id)
		.select('is_cd')
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, 'Database error'];
	if (!user) return [false, 'User not found'];
	if (!user.is_cd) return [false, 'User is not a creative director'];

	// Update campaign with assigned creative director
	await knex('Campaigns')
		.where('id', campaign_id)
		.update({ assigned_cd: cd_user_id })
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, 'Failed to assign creative director'];

	// Update cache
	db_getCampaigns(user_id, true);

	return [true, null];
}

async function db_removeCreativeDirector(user_id, campaign_id) {
	let err_code;

	// Update campaign to remove assigned creative director
	await knex('Campaigns')
		.where('id', campaign_id)
		.update({ assigned_cd: null })
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, 'Failed to remove creative director'];

	// Update cache
	db_getCampaigns(user_id, true);

	return [true, null];
}

// Export
module.exports = {
	db_getCampaigns,
	db_getCampaignDetails,
	db_getCampaignPosts,
	db_addCampaignLink,
	db_updateCampaignLink,
	db_removeCampaignLink,
	db_getCampaignSubmissions,
	db_getCreators,
	db_inviteCreator,
	db_getAvailableCampaigns,
	db_bulkAssignCampaigns,
	db_updateCampaignSettings,
	db_createCampaign,
	db_bulkAssignCreators,
	db_getAvailableCreators,
	db_removeCreatorFromCampaign,
	db_bulkAssignCreatorsV2,
	scrapeProfileInfo,
	db_findCreatorPreview,
	db_deleteCampaign,
	db_getCreatorDailyPosts,
	db_getPostsOnDate,
	db_generateShareLink,
	db_assignCreativeDirector,
	db_removeCreativeDirector
};