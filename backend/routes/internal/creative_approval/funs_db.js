// Dependencies
const knex = require('knex')(require('../../../knexfile.js').development);

// Function Imports
const { convertEncodedImage } = require('../../../utils/convertEncodedImage.js');

// -------------------
// READ Functions
// -------------------

/**
 * Get paginated list of creatives for a campaign with optional filters and sorting
 * @param {number} user_id - User ID (for authorization)
 * @param {number} campaign_id - Campaign ID
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Items per page
 * @param {string} status - Status filter ('pending', 'approved', 'rejected')
 * @param {string} timeFrame - Time frame filter ('all', '24h', '7d', '30d', '90d')
 * @param {string} sort - Sort option ('newest', 'oldest')
 * @param {string|null} platform - Platform filter ('tt', 'ig') or null for all
 * @returns {Promise<[boolean, Object|null]>} Tuple of [success, data]
 */
async function db_getCampaignCreatives(user_id, campaign_id, page = 1, pageSize = 25, status = 'pending', timeFrame = 'all', sort = 'newest', platform = null) {
	let err_code;

	// Calculate offset
	const offset = (page - 1) * pageSize;

	// Build query
	let query = knex('CrvApprv_Creator_Creatives as ccc')
		.join('Users as u', 'ccc.user_id', 'u.id')
		.join('Campaigns as c', 'ccc.campaign_id', 'c.id')
		.where('ccc.campaign_id', campaign_id);

	// Apply status filter
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
			'ccc.user_id',
			'ccc.campaign_id',
			'ccc.platform',
			'ccc.content_typ',
			'ccc.status',
			'ccc.version',
			'ccc.created_ts',
			'ccc.caption',
			'ccc.thumbnail',
			'u.name as creator_name',
			'u.email as creator_email',
			'u.pfp as creator_pfp',
			'c.name as campaign_name'
		)
		.limit(pageSize)
		.offset(offset)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Format results
	const formatted_creatives = creatives.map(creative => ({
		id: creative.id,
		creator: {
			id: creative.user_id,
			name: creative.creator_name,
			email: creative.creator_email,
			pfp: creative.creator_pfp ? convertEncodedImage(creative.creator_pfp) : null
		},
		campaign: {
			id: creative.campaign_id,
			name: creative.campaign_name
		},
		caption: creative.caption,
		platform: creative.platform,
		thumbnail: creative.thumbnail ? convertEncodedImage(creative.thumbnail) : null,
		content_type: creative.content_typ,
		status: creative.status,
		version: creative.version,
		created_ts: creative.created_ts
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
 * Get paginated list of creatives across ALL campaigns with optional filters and sorting
 * @param {number} user_id - User ID (for authorization)
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Items per page
 * @param {string} status - Status filter ('pending', 'approved', 'rejected')
 * @param {string} timeFrame - Time frame filter ('all', '24h', '7d', '30d', '90d')
 * @param {string} sort - Sort option ('newest', 'oldest')
 * @param {string|null} platform - Platform filter ('tt', 'ig') or null for all
 * @param {number|null} cdUserId - Creative director user ID filter (optional)
 * @returns {Promise<[boolean, Object|null]>} Tuple of [success, data]
 */
async function db_getAllCreatives(user_id, page = 1, pageSize = 25, status = 'pending', timeFrame = 'all', sort = 'newest', platform = null, cdUserId = null) {
	let err_code;

	// Calculate offset
	const offset = (page - 1) * pageSize;

	// Build query - join with Campaigns to access assigned_cd
	let query = knex('CrvApprv_Creator_Creatives as ccc')
		.join('Users as u', 'ccc.user_id', 'u.id')
		.join('Campaigns as c', 'ccc.campaign_id', 'c.id');

	// Apply status filter
	if (status) {
		query = query.where('ccc.status', status);
	}

	// Apply platform filter if provided
	if (platform) {
		query = query.where('ccc.platform', platform);
	}

	// Apply creative director filter if provided
	if (cdUserId) {
		query = query.where('c.assigned_cd', cdUserId);
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
			'ccc.user_id',
			'ccc.campaign_id',
			'ccc.platform',
			'ccc.content_typ',
			'ccc.status',
			'ccc.version',
			'ccc.created_ts',
			'ccc.caption',
			'ccc.thumbnail',
			'u.name as creator_name',
			'u.email as creator_email',
			'u.pfp as creator_pfp',
			'c.name as campaign_name'
		)
		.limit(pageSize)
		.offset(offset)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Format results - campaign name is already included from the join
	const formatted_creatives = creatives.map(creative => ({
		id: creative.id,
		creator: {
			id: creative.user_id,
			name: creative.creator_name,
			email: creative.creator_email,
			pfp: creative.creator_pfp ? convertEncodedImage(creative.creator_pfp) : null
		},
		campaign: {
			id: creative.campaign_id,
			name: creative.campaign_name
		},
		thumbnail: creative.thumbnail ? convertEncodedImage(creative.thumbnail) : null,
		platform: creative.platform,
		caption: creative.caption,
		content_type: creative.content_typ,
		status: creative.status,
		version: creative.version,
		created_ts: creative.created_ts
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
 * Get details for a specific creative
 * @param {number} user_id - User ID (for authorization)
 * @param {number} creative_id - Creative ID
 * @returns {Promise<[boolean, Object|null]>} Tuple of [success, data]
 */
async function db_getCreativeDetails(user_id, creative_id) {
	let err_code;

	const creative = await knex('CrvApprv_Creator_Creatives as ccc')
		.join('Users as u', 'ccc.user_id', 'u.id')
		.join('Campaigns as c', 'ccc.campaign_id', 'c.id')
		.leftJoin('Users as reviewer', 'ccc.reviewed_by', 'reviewer.id')
		.where('ccc.id', creative_id)
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
			'u.name as creator_name',
			'u.email as creator_email',
			'u.phone as creator_phone',
			'u.pfp as creator_pfp',
			'c.name as campaign_name',
			'reviewer.name as reviewer_name',
			'reviewer.email as reviewer_email'
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
		creator: {
			id: creative.user_id,
			name: creative.creator_name,
			email: creative.creator_email,
			phone: creative.creator_phone,
			pfp: creative.creator_pfp ? convertEncodedImage(creative.creator_pfp) : null
		},
		campaign: {
			id: creative.campaign_id,
			name: creative.campaign_name
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
		reviewer: creative.reviewed_by ? {
			id: creative.reviewed_by,
			name: creative.reviewer_name,
			email: creative.reviewer_email
		} : null,
		reviewed_ts: creative.reviewed_ts,
		created_ts: creative.created_ts
	}];
}

/**
 * Get Google Drive upload metadata for an approved creative
 * @param {number} creative_id - Creative ID
 * @returns {Promise<[boolean, Object|null]>} Tuple of [success, {campaignName, creatorName, approvedNumber, fileExtension, s3Key}]
 */
async function db_getGDriveMetadata(creative_id) {
	let err_code;

	// Get the creative details
	const creative = await knex('CrvApprv_Creator_Creatives as ccc')
		.join('Users as u', 'ccc.user_id', 'u.id')
		.join('Campaigns as c', 'ccc.campaign_id', 'c.id')
		.where('ccc.id', creative_id)
		.select(
			'ccc.user_id',
			'ccc.campaign_id',
			'ccc.s3_url',
			'ccc.content_typ',
			'u.name as creator_name',
			'c.name as campaign_name'
		)
		.first()
		.catch((err) => { if (err) err_code = err.code });
	if (err_code || !creative) return [false, null];

	// Count how many approved creatives this creator has for this campaign (excluding current one)
	const [{ count }] = await knex('CrvApprv_Creator_Creatives')
		.where({
			user_id: creative.user_id,
			campaign_id: creative.campaign_id,
			status: 'approved'
		})
		.whereNot('id', creative_id) // Exclude the current creative
		.count('* as count')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// The approved number is count + 1 (this is the next approved creative)
	const approvedNumber = parseInt(count) + 1;

	// Extract S3 key from URL if needed
	let s3Key = creative.s3_url;
	if (s3Key.includes('amazonaws.com/')) {
		s3Key = s3Key.split('amazonaws.com/')[1];
		s3Key = decodeURIComponent(s3Key.replace(/\+/g, ' '));
	}

	// Extract file extension from S3 key (e.g., "path/file.mp4" -> "mp4")
	const fileExtension = s3Key.split('.').pop().toLowerCase();

	return [true, {
		campaignName: creative.campaign_name,
		creatorName: creative.creator_name,
		approvedNumber,
		fileExtension,
		s3Key
	}];
}

// -------------------
// UPDATE Functions
// -------------------

/**
 * Approve a creative
 * @param {number} user_id - User ID (reviewer)
 * @param {number} creative_id - Creative ID
 * @returns {Promise<boolean>} Success status
 */
async function db_approveCreative(user_id, creative_id, feedback_notes=null) {
	let err_code;

	// Update the creative
	await knex('CrvApprv_Creator_Creatives')
		.where('id', creative_id)
		.update({
			status: 'approved',
			feedback_notes: feedback_notes,
			reviewed_by: user_id,
			reviewed_ts: knex.fn.now()
		})
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return false;

	return true;
}

/**
 * Reject a creative with feedback notes
 * @param {number} user_id - User ID (reviewer)
 * @param {number} creative_id - Creative ID
 * @param {string} feedback_notes - Rejection reason/notes
 * @returns {Promise<boolean>} Success status
 */
async function db_rejectCreative(user_id, creative_id, feedback_notes) {
	let err_code;

	// Update the creative
	await knex('CrvApprv_Creator_Creatives')
		.where('id', creative_id)
		.update({
			status: 'rejected',
			feedback_notes: feedback_notes,
			reviewed_by: user_id,
			reviewed_ts: knex.fn.now()
		})
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return false;

	return true;
}

// Export
module.exports = {
	db_getCampaignCreatives,
	db_getAllCreatives,
	db_getCreativeDetails,
	db_getGDriveMetadata,
	db_approveCreative,
	db_rejectCreative
};
