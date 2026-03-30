// Type Imports
const HttpStatus = require('../../../types/HttpStatus.js');

// Function Imports
const {
	db_getCreatorCampaignCreatives,
	db_getCreatorAllCreatives,
	db_getCreatorCreativeDetails,
	db_submitCreative,
	db_resubmitCreative,
	db_deleteCreative
} = require('./funs_db.js');

// Knex
const knex = require('knex')(require('../../../knexfile.js').development);

// S3 Function Imports
const {
	s3_getPresignedUrl,
	s3_deleteObject,
	s3_generateUploadUrl
} = require('../../../external_apis/s3/creative_approval_s3.js');

// Constants
const VALID_STATUSES = new Set(['pending', 'approved', 'rejected']);
const VALID_CONTENT_TYPES = new Set(['img', 'vid']);
const VALID_TIME_FRAMES = new Set(['all', '24h', '7d', '30d', '90d']);
const VALID_SORT_OPTIONS = new Set(['newest', 'oldest']);
const VALID_PLATFORMS = new Set(['tt', 'ig']);

// Controller Functions

async function getCreatorCampaignCreatives(req, res) {
	try {
		// Validate request
		if (!req.params.campaign_id) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Get pagination parameters with defaults
		const page = parseInt(req.query.page) || 1;
		const pageSize = parseInt(req.query.page_size) || 25;
		const status = req.query.status || null; // Default to all statuses
		const timeFrame = req.query.time_frame || 'all'; // Default to all time
		const sort = req.query.sort || 'newest'; // Default to newest first
		const platform = req.query.platform || null; // Default to all platforms

		// Validate pagination parameters
		if (page < 1 || pageSize < 1 || pageSize > 100) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid pagination parameters");
		}

		// Validate status filter if provided
		if (status && !VALID_STATUSES.has(status)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid status filter");
		}

		// Validate time frame filter
		if (!VALID_TIME_FRAMES.has(timeFrame)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid time_frame filter");
		}

		// Validate sort option
		if (!VALID_SORT_OPTIONS.has(sort)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid sort option");
		}

		// Validate platform filter if provided
		if (platform && !VALID_PLATFORMS.has(platform)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid platform filter");
		}

		// Load creatives with pagination (filtered to creator's own submissions)
		const [ok, resp] = await db_getCreatorCampaignCreatives(
			req.user.id,
			req.params.campaign_id,
			page,
			pageSize,
			status,
			timeFrame,
			sort,
			platform
		);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({ 'data': resp });
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load creatives");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function getCreatorAllCreatives(req, res) {
	try {
		// Get pagination parameters with defaults
		const page = parseInt(req.query.page) || 1;
		const pageSize = parseInt(req.query.page_size) || 25;
		const status = req.query.status || null; // Default to all statuses
		const timeFrame = req.query.time_frame || 'all'; // Default to all time
		const sort = req.query.sort || 'newest'; // Default to newest first
		const platform = req.query.platform || null; // Default to all platforms

		// Validate pagination parameters
		if (page < 1 || pageSize < 1 || pageSize > 100) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid pagination parameters");
		}

		// Validate status filter if provided
		if (status && !VALID_STATUSES.has(status)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid status filter");
		}

		// Validate time frame filter
		if (!VALID_TIME_FRAMES.has(timeFrame)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid time_frame filter");
		}

		// Validate sort option
		if (!VALID_SORT_OPTIONS.has(sort)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid sort option");
		}

		// Validate platform filter if provided
		if (platform && !VALID_PLATFORMS.has(platform)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid platform filter");
		}

		// Load creatives from all campaigns (filtered to creator's own submissions)
		const [ok, resp] = await db_getCreatorAllCreatives(
			req.user.id,
			page,
			pageSize,
			status,
			timeFrame,
			sort,
			platform
		);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({ 'data': resp });
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load creatives");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function getCreatorCreativeDetails(req, res) {
	try {
		// Validate request
		if (!req.params.creative_id) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Load creative details (only if owned by this creator)
		const [ok, data] = await db_getCreatorCreativeDetails(req.user.id, req.params.creative_id);
		if (!ok) return res.status(HttpStatus.FAILED_STATUS).send("Failed to load creative details");

		// Retrieve S3 presigned URL for data.s3_url
		try {
			// Extract S3 key from full URL if needed
			let s3Key = data.s3_url;
			if (s3Key.includes('amazonaws.com/')) {
				// Extract key from full URL: https://bucket.s3.region.amazonaws.com/key/path
				s3Key = s3Key.split('amazonaws.com/')[1];
				// Decode the key to handle special characters properly
				// First replace + with space (URL encoding), then decode
				s3Key = decodeURIComponent(s3Key.replace(/\+/g, ' '));
			}
			const presignedUrl = await s3_getPresignedUrl(s3Key);
			data.s3_url = presignedUrl;
		} catch (error) {
			console.error('Failed to generate presigned URL:', error);
			console.error('S3 Key that failed:', data.s3_url);
			// Continue with original URL if presigned generation fails
		}

		return res.status(HttpStatus.SUCCESS_STATUS).json({ 'data': data });
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function generateUploadUrl(req, res) {
	try {
		// Validate request
		if (!req.params.campaign_id || !req.body.file_name || !req.body.file_size || !req.body.content_type) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request - campaign_id, file_name, file_size, and content_type are required");
		}

		// Validate content type (must be image or video)
		if (!req.body.content_type.startsWith('image/') && !req.body.content_type.startsWith('video/')) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid content_type - must be image/* or video/*");
		}

		// Generate presigned upload URL
		const { uploadUrl, s3Key } = await s3_generateUploadUrl(
			req.user.id,
			req.params.campaign_id,
			req.body.file_name,
			req.body.file_size,
			req.body.content_type
		);

		return res.status(HttpStatus.SUCCESS_STATUS).json({
			'data': {
				upload_url: uploadUrl,
				s3_key: s3Key
			}
		});
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function submitCreative(req, res) {
	try {
		// Validate request
		if (!req.params.campaign_id || !req.body.s3_key || !req.body.content_type || !req.body.platform) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request - campaign_id, s3_key, content_type, and platform are required");
		}

		// Validate content type
		if (!VALID_CONTENT_TYPES.has(req.body.content_type)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid content_type - must be 'img' or 'vid'");
		}

		// Validate platform
		if (!VALID_PLATFORMS.has(req.body.platform)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid platform - must be 'tt' or 'ig'");
		}

		// Verify campaign supports this platform
		const campaign = await knex('Campaigns')
			.where('id', req.params.campaign_id)
			.select('supports_tt', 'supports_ig')
			.first();

		if (!campaign) {
			return res.status(HttpStatus.FAILED_STATUS).send("Campaign not found");
		}

		const platformSupported = (req.body.platform === 'tt' && campaign.supports_tt === 1) ||
		                          (req.body.platform === 'ig' && campaign.supports_ig === 1);

		if (!platformSupported) {
			return res.status(HttpStatus.FAILED_STATUS).send(`Campaign does not support ${req.body.platform} platform`);
		}

		// Process thumbnail if provided (base64 string to Buffer)
		let thumbnailBuffer = null;
		if (req.body.thumbnail) {
			try {
				// Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
				const base64Data = req.body.thumbnail.replace(/^data:image\/\w+;base64,/, '');
				thumbnailBuffer = Buffer.from(base64Data, 'base64');
			} catch (err) {
				console.error('Failed to process thumbnail:', err);
				return res.status(HttpStatus.FAILED_STATUS).send("Invalid thumbnail format");
			}
		}

		// Submit the creative
		const [ok, creative_id] = await db_submitCreative(
			req.user.id,
			req.params.campaign_id,
			req.body.s3_key,
			req.body.caption || null,
			req.body.content_type,
			req.body.platform,
			thumbnailBuffer
		);
		if (!ok) return res.status(HttpStatus.FAILED_STATUS).send("Failed to submit creative");

		return res.status(HttpStatus.SUCCESS_STATUS).json({ 'data': { creative_id } });
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function resubmitCreative(req, res) {
	try {
		// Validate request
		if (!req.params.creative_id || !req.body.s3_key || !req.body.content_type || !req.body.platform) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request - creative_id, s3_key, content_type, and platform are required");
		}

		// Validate content type
		if (!VALID_CONTENT_TYPES.has(req.body.content_type)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid content_type - must be 'img' or 'vid'");
		}

		// Validate platform
		if (!VALID_PLATFORMS.has(req.body.platform)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid platform - must be 'tt' or 'ig'");
		}

		// Get the previous creative to find the campaign_id
		const previousCreative = await knex('CrvApprv_Creator_Creatives')
			.where('id', req.params.creative_id)
			.where('user_id', req.user.id)
			.select('campaign_id')
			.first();

		if (!previousCreative) {
			return res.status(HttpStatus.FAILED_STATUS).send("Previous creative not found");
		}

		// Verify campaign supports this platform
		const campaign = await knex('Campaigns')
			.where('id', previousCreative.campaign_id)
			.select('supports_tt', 'supports_ig')
			.first();

		if (!campaign) {
			return res.status(HttpStatus.FAILED_STATUS).send("Campaign not found");
		}

		const platformSupported = (req.body.platform === 'tt' && campaign.supports_tt === 1) ||
		                          (req.body.platform === 'ig' && campaign.supports_ig === 1);

		if (!platformSupported) {
			return res.status(HttpStatus.FAILED_STATUS).send(`Campaign does not support ${req.body.platform} platform`);
		}

		// Process thumbnail if provided (base64 string to Buffer)
		let thumbnailBuffer = null;
		if (req.body.thumbnail) {
			try {
				// Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
				const base64Data = req.body.thumbnail.replace(/^data:image\/\w+;base64,/, '');
				thumbnailBuffer = Buffer.from(base64Data, 'base64');
			} catch (err) {
				console.error('Failed to process thumbnail:', err);
				return res.status(HttpStatus.FAILED_STATUS).send("Invalid thumbnail format");
			}
		}

		// Resubmit the creative
		const [ok, new_creative_id] = await db_resubmitCreative(
			req.user.id,
			req.params.creative_id,
			req.body.s3_key,
			req.body.caption || null,
			req.body.content_type,
			req.body.platform,
			thumbnailBuffer
		);
		if (!ok) return res.status(HttpStatus.FAILED_STATUS).send("Failed to resubmit creative");

		return res.status(HttpStatus.SUCCESS_STATUS).json({ 'data': { creative_id: new_creative_id } });
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function deleteCreative(req, res) {
	try {
		// Validate request
		if (!req.params.creative_id) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Delete the creative
		const [ok, s3_url] = await db_deleteCreative(req.user.id, req.params.creative_id);
		if (!ok) return res.status(HttpStatus.FAILED_STATUS).send("Failed to delete creative");

		// Delete S3 resource
		const deleteSuccess = await s3_deleteObject(s3_url);
		if (!deleteSuccess) {
			console.warn(`Failed to delete S3 object: ${s3_url}`);
			// Continue anyway - database record is already deleted
		}

		return res.sendStatus(HttpStatus.SUCCESS_STATUS);
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

// Export
module.exports = {
	getCreatorCampaignCreatives,
	getCreatorAllCreatives,
	getCreatorCreativeDetails,
	generateUploadUrl,
	submitCreative,
	resubmitCreative,
	deleteCreative
};
