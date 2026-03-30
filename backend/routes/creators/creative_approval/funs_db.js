// Dependencies
const knex = require('knex')(require('../../../knexfile.js').development);

// Function Imports
const { convertEncodedImage } = require('../../../utils/convertEncodedImage.js');

// -------------------
// READ Functions
// -------------------

/**
 * Get paginated list of creatives for a creator in a campaign with optional filters and sorting
 * @param {number} user_id - Creator User ID
 * @param {number} campaign_id - Campaign ID
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Items per page
 * @param {string|null} status - Status filter ('pending', 'approved', 'rejected') or null for all
 * @param {string} timeFrame - Time frame filter ('all', '24h', '7d', '30d', '90d')
 * @param {string} sort - Sort option ('newest', 'oldest')
 * @param {string|null} platform - Platform filter ('tt', 'ig') or null for all
 * @returns {Promise<[boolean, Object|null]>} Tuple of [success, data]
 */
async function db_getCreatorCampaignCreatives(user_id, campaign_id, page = 1, pageSize = 25, status = null, timeFrame = 'all', sort = 'newest', platform = null) {
	let err_code;

	// Calculate offset
	const offset = (page - 1) * pageSize;

	// Build query
	let query = knex('CrvApprv_Creator_Creatives as ccc')
		.join('Campaigns as c', 'ccc.campaign_id', 'c.id')
		.where('ccc.campaign_id', campaign_id)
		.where('ccc.user_id', user_id);

	// Apply status filter if provided
	if (status) {
		query = query.where('ccc.status', status);
	}

	// Apply platform filter if provided
	if (platform) {
		query = query.where('ccc.platform', platform);
	}

	// Apply time frame filter
	if (timeFrame !== 'all') {
		let hoursAgo;
		switch (timeFrame) {
			case '24h':
				hoursAgo = 24;
				break;
			case '7d':
				hoursAgo = 24 * 7;
				break;
			case '30d':
				hoursAgo = 24 * 30;
				break;
			case '90d':
				hoursAgo = 24 * 90;
				break;
		}
		if (hoursAgo) {
			query = query.where('ccc.created_ts', '>=', knex.raw(`DATE_SUB(NOW(), INTERVAL ${hoursAgo} HOUR)`));
		}
	}

	// Get total count (after filters, before pagination)
	const [{ count }] = await query.clone()
		.count('* as count')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Apply sorting
	const sortDirection = sort === 'newest' ? 'desc' : 'asc';
	query = query.orderBy('ccc.created_ts', sortDirection);

	// Get paginated results
	const creatives = await query
		.select(
			'ccc.id',
			'ccc.campaign_id',
			'ccc.caption',
			'ccc.thumbnail',
			'ccc.platform',
			'ccc.content_typ',
			'ccc.status',
			'ccc.version',
			'ccc.creator_notes',
			'ccc.feedback_notes',
			'ccc.created_ts',
			'ccc.reviewed_ts',
			'c.name as campaign_name'
		)
		.limit(pageSize)
		.offset(offset)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Format results
	const formatted_creatives = creatives.map(creative => ({
		id: creative.id,
		campaign: {
			id: creative.campaign_id,
			name: creative.campaign_name
		},
		caption: creative.caption,
		thumbnail: creative.thumbnail ? convertEncodedImage(creative.thumbnail) : null,
		platform: creative.platform,
		content_type: creative.content_typ,
		status: creative.status,
		version: creative.version,
		creator_notes: creative.creator_notes,
		feedback_notes: creative.feedback_notes,
		created_ts: creative.created_ts,
		reviewed_ts: creative.reviewed_ts
	}));

	return [true, {
		creatives: formatted_creatives,
		pagination: {
			total: parseInt(count),
			page,
			pageSize,
			totalPages: Math.ceil(parseInt(count) / pageSize)
		}
	}];
}

/**
 * Get paginated list of creatives for a creator across ALL campaigns with optional filters and sorting
 * @param {number} user_id - Creator User ID
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Items per page
 * @param {string|null} status - Status filter ('pending', 'approved', 'rejected') or null for all
 * @param {string} timeFrame - Time frame filter ('all', '24h', '7d', '30d', '90d')
 * @param {string} sort - Sort option ('newest', 'oldest')
 * @param {string|null} platform - Platform filter ('tt', 'ig') or null for all
 * @returns {Promise<[boolean, Object|null]>} Tuple of [success, data]
 */
async function db_getCreatorAllCreatives(user_id, page = 1, pageSize = 25, status = null, timeFrame = 'all', sort = 'newest', platform = null) {
	let err_code;

	// Calculate offset
	const offset = (page - 1) * pageSize;

	// Build query
	let query = knex('CrvApprv_Creator_Creatives as ccc')
		.where('ccc.user_id', user_id);

	// Apply status filter if provided
	if (status) {
		query = query.where('ccc.status', status);
	}

	// Apply platform filter if provided
	if (platform) {
		query = query.where('ccc.platform', platform);
	}

	// Apply time frame filter
	if (timeFrame !== 'all') {
		let hoursAgo;
		switch (timeFrame) {
			case '24h':
				hoursAgo = 24;
				break;
			case '7d':
				hoursAgo = 24 * 7;
				break;
			case '30d':
				hoursAgo = 24 * 30;
				break;
			case '90d':
				hoursAgo = 24 * 90;
				break;
		}
		if (hoursAgo) {
			query = query.where('ccc.created_ts', '>=', knex.raw(`DATE_SUB(NOW(), INTERVAL ${hoursAgo} HOUR)`));
		}
	}

	// Get total count (after filters, before pagination)
	const [{ count }] = await query.clone()
		.count('* as count')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) {
		console.error('[db_getCreatorAllCreatives] Error in count query:', err_code);
		return [false, null];
	}

	// Apply sorting
	const sortDirection = sort === 'newest' ? 'desc' : 'asc';
	query = query.orderBy('ccc.created_ts', sortDirection);

	// Get paginated results
	const creatives = await query
		.select(
			'ccc.id',
			'ccc.campaign_id',
			'ccc.caption',
			'ccc.thumbnail',
			'ccc.platform',
			'ccc.content_typ',
			'ccc.status',
			'ccc.version',
			'ccc.creator_notes',
			'ccc.feedback_notes',
			'ccc.created_ts',
			'ccc.reviewed_ts'
		)
		.limit(pageSize)
		.offset(offset)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) {
		console.error('[db_getCreatorAllCreatives] Error in results query:', err_code);
		return [false, null];
	}

	// Get unique campaign IDs
	const campaignIds = [...new Set(creatives.map(c => c.campaign_id))];

	// Enrich with campaign data (efficient batch query)
	const campaigns = await knex('Campaigns')
		.whereIn('id', campaignIds)
		.select(
			'id',
			'name',
			// 'img'
		).catch((err) => { if (err) err_code = err.code });
	if (err_code) {
		console.error('[db_getCreatorAllCreatives] Error in campaigns query:', err_code);
		return [false, null];
	}

	// Create campaign map for efficient lookup
	const campaignMap = campaigns.reduce((map, campaign) => {
		map[campaign.id] = {
			id: campaign.id,
			name: campaign.name,
			// logo: campaign.img ? convertEncodedImage(campaign.img) : null
		};
		return map;
	}, {});

	// Format results with enriched campaign data
	const formatted_creatives = creatives.map(creative => ({
		id: creative.id,
		campaign: campaignMap[creative.campaign_id] || { id: creative.campaign_id, name: 'Unknown', logo: null },
		caption: creative.caption,
		thumbnail: creative.thumbnail ? convertEncodedImage(creative.thumbnail) : null,
		platform: creative.platform,
		content_type: creative.content_typ,
		status: creative.status,
		version: creative.version,
		creator_notes: creative.creator_notes,
		feedback_notes: creative.feedback_notes,
		created_ts: creative.created_ts,
		reviewed_ts: creative.reviewed_ts
	}));

	return [true, {
		creatives: formatted_creatives,
		pagination: {
			total: parseInt(count),
			page,
			pageSize,
			totalPages: Math.ceil(parseInt(count) / pageSize)
		}
	}];
}

/**
 * Get details for a specific creative (creator can only view their own)
 * @param {number} user_id - Creator User ID
 * @param {number} creative_id - Creative ID
 * @returns {Promise<[boolean, Object|null]>} Tuple of [success, data]
 */
async function db_getCreatorCreativeDetails(user_id, creative_id) {
	let err_code;

	const creative = await knex('CrvApprv_Creator_Creatives as ccc')
		.join('Campaigns as c', 'ccc.campaign_id', 'c.id')
		.leftJoin('Users as reviewer', 'ccc.reviewed_by', 'reviewer.id')
		.where('ccc.id', creative_id)
		.where('ccc.user_id', user_id) // Only allow creator to view their own creatives
		.select(
			'ccc.id',
			'ccc.user_id',
			'ccc.campaign_id',
			'ccc.s3_url',
			'ccc.caption',
			'ccc.platform',
			'ccc.content_typ',
			'ccc.status',
			'ccc.creator_notes',
			'ccc.feedback_notes',
			'ccc.version',
			'ccc.supersedes_id',
			'ccc.reviewed_by',
			'ccc.reviewed_ts',
			'ccc.created_ts',
			'c.name as campaign_name',
			'c.supports_ig',
			'c.supports_tt',
			'reviewer.name as reviewer_name'
		)
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];
	if (!creative) return [false, null];

	// If this creative supersedes another, get the previous version
	let previous_version = null;
	if (creative.supersedes_id) {
		const prev = await knex('CrvApprv_Creator_Creatives')
			.where('id', creative.supersedes_id)
			.select('id', 'version', 'status', 'creator_notes', 'feedback_notes', 'created_ts')
			.first()
			.catch((err) => { if (err) err_code = err.code });
		if (prev) {
			previous_version = prev;
		}
	}

	return [true, {
		id: creative.id,
		campaign: {
			id: creative.campaign_id,
			name: creative.campaign_name,
			supports_ig: creative.supports_ig,
			supports_tt: creative.supports_tt
		},
		s3_url: creative.s3_url,
		caption: creative.caption,
		platform: creative.platform,
		content_type: creative.content_typ,
		status: creative.status,
		creator_notes: creative.creator_notes,
		feedback_notes: creative.feedback_notes,
		version: creative.version,
		supersedes_id: creative.supersedes_id,
		previous_version: previous_version,
		reviewer_name: creative.reviewer_name,
		reviewed_ts: creative.reviewed_ts,
		created_ts: creative.created_ts
	}];
}

// -------------------
// CREATE Functions
// -------------------

/**
 * Submit a new creative for review
 * @param {number} user_id - Creator User ID
 * @param {number} campaign_id - Campaign ID
 * @param {string} s3_key - S3 key of the creative content
 * @param {string} caption - Caption for the creative
 * @param {string} content_type - Content type ('img' or 'vid')
 * @param {string} platform - Platform ('tt' or 'ig')
 * @param {Buffer|null} thumbnail - Optional thumbnail BLOB
 * @returns {Promise<[boolean, number|null]>} Tuple of [success, creative_id]
 */
async function db_submitCreative(user_id, campaign_id, s3_key, caption, content_type, platform, thumbnail = null) {
	let err_code;

	// Insert the creative
	const [creative_id] = await knex('CrvApprv_Creator_Creatives')
		.insert({
			user_id: user_id,
			campaign_id: campaign_id,
			s3_url: s3_key,
			caption: caption,
			thumbnail: thumbnail,
			platform: platform,
			content_typ: content_type,
			status: 'pending',
			version: 1
		})
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	return [true, creative_id];
}

/**
 * Resubmit a previously rejected creative for review
 * @param {number} user_id - Creator User ID
 * @param {number} previous_creative_id - Previous creative ID being resubmitted
 * @param {string} s3_key - S3 key of the new creative content
 * @param {string} caption - Caption for the creative
 * @param {string} content_type - Content type ('img' or 'vid')
 * @param {string} platform - Platform ('tt' or 'ig')
 * @param {Buffer|null} thumbnail - Optional thumbnail BLOB
 * @returns {Promise<[boolean, number|null]>} Tuple of [success, new_creative_id]
 */
async function db_resubmitCreative(user_id, previous_creative_id, s3_key, caption, content_type, platform, thumbnail = null) {
	let err_code;

	// First, get the previous creative to verify ownership and get campaign_id
	const previous_creative = await knex('CrvApprv_Creator_Creatives')
		.where('id', previous_creative_id)
		.where('user_id', user_id) // Verify ownership
		.select('campaign_id', 'version')
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code || !previous_creative) return [false, null];

	// Insert the new creative version
	const [new_creative_id] = await knex('CrvApprv_Creator_Creatives')
		.insert({
			user_id: user_id,
			campaign_id: previous_creative.campaign_id,
			s3_url: s3_key,
			caption: caption,
			thumbnail: thumbnail,
			platform: platform,
			content_typ: content_type,
			status: 'pending',
			version: previous_creative.version + 1,
			supersedes_id: previous_creative_id
		})
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	return [true, new_creative_id];
}

// -------------------
// DELETE Functions
// -------------------

/**
 * Delete a creative (creator can only delete their own)
 * @param {number} user_id - Creator User ID
 * @param {number} creative_id - Creative ID
 * @returns {Promise<[boolean, string|null]>} Tuple of [success, s3_url]
 */
async function db_deleteCreative(user_id, creative_id) {
	let err_code;

	// First get the creative to verify ownership and get S3 URL
	const creative = await knex('CrvApprv_Creator_Creatives')
		.where('id', creative_id)
		.where('user_id', user_id) // Verify ownership
		.select('s3_url')
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code || !creative) return [false, null];

	// Delete the creative
	await knex('CrvApprv_Creator_Creatives')
		.where('id', creative_id)
		.where('user_id', user_id) // Extra safety check
		.del()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Return the S3 URL so it can be deleted
	return [true, creative.s3_url];
}

// Export
module.exports = {
	db_getCreatorCampaignCreatives,
	db_getCreatorAllCreatives,
	db_getCreatorCreativeDetails,
	db_submitCreative,
	db_resubmitCreative,
	db_deleteCreative
};
