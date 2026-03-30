// Dependencies
const knex = require('knex')(require('../../../knexfile.js').development);

// Function Imports
const { convertEncodedImage } = require('../../../utils/convertEncodedImage.js');

// Cache Imports
const { cache_getCampaignsList, cache_updateCampaignsList } = require('../../internal/campaigns/funs_cache.js');

// -------------------
// CREATE Functions
// -------------------
async function db_submitToCampaign(user_id, campaign_id, submission_entries) {
	let err_code;

	// 1. Verify creator is assigned to campaign
	const assignment_check = await knex('Creator_Assignments')
		.where({
			'user_id': user_id,
			'campaign_id': campaign_id
		})
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];
	if (!assignment_check) return [false, 'Not assigned to campaign'];

	// 2. Get all valid social connections for this user
	const valid_connections = await knex('Creator_Socials')
		.where('user_id', user_id)
		.where('typ', 'oauth')
		.select('conn_id')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	const valid_conn_ids = new Set(valid_connections.map(c => c.conn_id));

	// 3. Get existing submissions to check for duplicates
	const existing_submissions = await knex('Campaign_Submissions')
		.where('campaign_id', campaign_id)
		.select('npc_id')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	const existing_npc_ids = new Set(existing_submissions.map(s => s.npc_id));

	// 4. Filter out invalid connections and duplicates
	const valid_submissions = submission_entries.filter(entry => 
		valid_conn_ids.has(entry.conn_id) && !existing_npc_ids.has(entry.post_id)
	);

	// If no valid submissions after filtering, return early
	if (valid_submissions.length === 0) {
		return [true, {
			skipped: submission_entries.length,
			submitted: 0,
			reason: 'All submissions were either invalid or duplicates'
		}];
	}

	// 5. Submit valid content in a transaction
	const trx = await knex.transaction();
	try {
		for (const entry of valid_submissions) {
			// Insert submission
			await trx('Campaign_Submissions')
				.insert({
					'campaign_id': campaign_id,
					'conn_id': entry.conn_id,
					'npc_id': entry.post_id
				});

			// Initialize metrics
			await trx('Campaign_Submissions_Metrics')
				.insert({
					'npc_id': entry.post_id
				});
		}
		await trx.commit();
	} catch (err) {
		await trx.rollback();
		return [false, null];
	}

	return [true, {
		submitted: valid_submissions.length,
		skipped: submission_entries.length - valid_submissions.length
	}];
}


// -------------------
// READ Functions
// -------------------
async function db_getCampaigns(user_id, force_cache_refresh = false) {
	let err_code;

	// if (!force_cache_refresh) {
	// 	const cached_data = await cache_getCampaignsList();
	// 	if (cached_data) return [true, cached_data];
	// }

	// Get campaigns assigned to creator with basic info
	const campaigns = await knex('Campaigns as c')
		.join('Creator_Assignments as ca', 'c.id', 'ca.campaign_id')
		.where('ca.user_id', user_id)
		.select(
			'c.id',
			'c.name',
			'c.img',
			'c.description',
			'c.supports_ig',
			'c.supports_tt',
			'ca.num_posts',
			'ca.frequency',
			'ca.start_date',
			'ca.end_date'
		)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Get submission counts for each campaign
	const submissions = await knex('Campaign_Submissions as cs')
		.join('Creator_Socials as soc', 'cs.conn_id', 'soc.conn_id')
		.where('soc.user_id', user_id)
		.groupBy('cs.campaign_id')
		.select('cs.campaign_id')
		.count('cs.npc_id as submitted')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Combine the data
	const enriched_campaigns = campaigns.map(campaign => ({
		...campaign,
		img: campaign.img ? convertEncodedImage(campaign.img) : null,
		submitted: submissions.find(s => s.campaign_id === campaign.id)?.submitted || 0
	}));

	// Update cache
	// cache_updateCampaignsList(enriched_campaigns);

	// Return
	return [true, enriched_campaigns];
}

async function db_getCampaignsSimple(user_id) {
	let err_code;

	// Get active campaigns assigned to creator with basic info
	const campaigns = await knex('Campaigns as c')
		.join('Creator_Assignments as ca', 'c.id', 'ca.campaign_id')
		.where('ca.user_id', user_id)
		.where('c.status', 'active')
		.select(
			'c.id',
			'c.name',
			'c.supports_ig',
			'c.supports_tt'
		)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Format platforms array
	const formatted_campaigns = campaigns.map(campaign => ({
		id: campaign.id,
		name: campaign.name,
		platforms: [
			...(campaign.supports_ig ? ['ig'] : []),
			...(campaign.supports_tt ? ['tt'] : [])
		]
	}));

	return [true, formatted_campaigns];
}

async function db_getCampaignDetails(user_id, campaign_id) {
	let err_code;

	// 1. Ensure creator is assigned to campaign
	const assignment = await knex('Creator_Assignments')
		.where({
			'user_id': user_id,
			'campaign_id': campaign_id
		})
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) console.log("DBE = ", err_code);
	if (err_code) return [false, null];
	if (!assignment) return [false, 'Not assigned to campaign'];

	// 2. Get campaign details
	const campaign = await knex('Campaigns')
		.where('id', campaign_id)
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) console.log("DBE 2 = ", err_code);
	if (err_code) return [false, null];

	// 3. Get campaign links
	const links = await knex('Campaign_Links')
		.where('campaign_id', campaign_id)
		.select('title', 'url', 'description')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) console.log("DBE 3 = ", err_code);
	if (err_code) return [false, null];

	// 4. Get submission metrics
	const submissions = await knex('Campaign_Submissions as cs')
		.join('Campaign_Submissions_Metrics as csm', 'cs.npc_id', 'csm.npc_id')
		.join('Creator_Socials as soc', 'cs.conn_id', 'soc.conn_id')
		.where({
			'cs.campaign_id': campaign_id,
			'soc.user_id': user_id
		})
		.select(
			'cs.npc_id',
			'cs.submit_ts',
			'csm.views',
			'csm.likes',
			'csm.comments',
			'csm.shares'
		)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) console.log("DBE 4 = ", err_code);
	if (err_code) return [false, null];

	// Calculate total metrics
	const metrics = submissions.reduce((acc, curr) => ({
		views: acc.views + curr.views,
		likes: acc.likes + curr.likes,
		comments: acc.comments + curr.comments,
		shares: acc.shares + curr.shares
	}), { views: 0, likes: 0, comments: 0, shares: 0 });

	return [true, {
		...campaign,
		img: campaign.img ? convertEncodedImage(campaign.img) : null,
		assigned_posts: assignment.num_posts,
		submitted_posts: submissions.length,
		links,
		submissions,
		metrics
	}];
}

async function db_getAvailableSubmissions(user_id, campaign_id) {
	let err_code;
	
	// 1. Get all valid social connections for this user
	const valid_connections = await knex('Creator_Socials')
		.where('user_id', user_id)
		.select(
			'conn_id',
			'platform',
			'key_a', // access token
			'key_c'  // account id
		)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// 2. Get campaign platform requirements
	const campaign = await knex('Campaigns')
		.where('id', campaign_id)
		.select('supports_ig', 'supports_tt')
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// 3. Get existing submissions to filter out
	const existing_submissions = await knex('Campaign_Submissions')
		.where('campaign_id', campaign_id)
		.select('npc_id')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];
	const existing_npc_ids = new Set(existing_submissions.map(s => s.npc_id));

	// 4. Load available posts from each platform
	let available_posts = [];
	for (const conn of valid_connections) {
		let platform_posts;
		switch (conn.platform) {
			case 'ig':
				// TODO: Fetch Instagram posts using conn.key_a (access token)
				// Should return array of { id, url, thumbnail, created_at, metrics }
				platform_posts = [];
				break;
			case 'tt':
				// TODO: Fetch TikTok posts using conn.key_a (access token)
				// Should return array of { id, url, thumbnail, created_at, metrics }
				platform_posts = [];
				break;
			default:
				continue;
		}

		// Filter out already submitted posts and add connection info
		const filtered_posts = platform_posts
			.filter(post => !existing_npc_ids.has(post.id))
			.map(post => ({
				...post,
				conn_id: conn.conn_id,
				platform: conn.platform
			}));

		available_posts = available_posts.concat(filtered_posts);
	}

	return [true, {
		posts: available_posts,
		platforms: {
			instagram: campaign.supports_ig,
			tiktok: campaign.supports_tt
		}
	}];
}


// -------------------
// UPDATE Functions
// -------------------


// -------------------
// DELETE Functions
// -------------------


// -------------------
// UTILITY Functions
// -------------------
async function db_verifyCampaignAssignment(user_id, campaign_id) {
	let err_code;

	// Check if creator is assigned to this campaign
	const assignment = await knex('Creator_Assignments')
		.where({
			'user_id': user_id,
			'campaign_id': campaign_id
		})
		.first()
		.catch((err) => { if (err) err_code = err.code });

	if (err_code) return [false, 'Database error'];
	if (!assignment) return [false, 'Not assigned to campaign'];

	return [true, null];
}


// ----- Export -----
module.exports = {
	db_submitToCampaign,
	db_getCampaigns,
	db_getCampaignsSimple,
	db_getCampaignDetails,
	db_getAvailableSubmissions,
	db_verifyCampaignAssignment
};