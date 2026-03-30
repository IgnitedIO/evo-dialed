// Type Imports
const HttpStatus = require('../../../types/HttpStatus.js');

// Function Imports
const {
	db_getCampaignCreatives,
	db_getAllCreatives,
	db_getCreativeDetails,
	db_getGDriveMetadata,
	db_approveCreative,
	db_rejectCreative
} = require('./funs_db.js');

// S3 Function Imports
const {
	s3_getPresignedUrl,
	s3_getFileBuffer
} = require('../../../external_apis/s3/creative_approval_s3.js');

// Email + Text API Imports
const {
	resend_sendCreativeApprovedEmail,
	resend_sendCreativeRejectedEmail
} = require('../../../external_apis/resend.js');
const {
	twilio_sendCreativeApprovedText,
	twilio_sendCreativeRejectedText
} = require('../../../external_apis/twilio.js');

// Google Drive API Imports
const {
	gdrive_uploadFile
} = require('../../../external_apis/google_drive.js');

// Constants
const VALID_STATUSES = new Set(['pending', 'approved', 'rejected']);
const VALID_TIME_FRAMES = new Set(['all', '24h', '7d', '30d', '90d']);
const VALID_SORT_OPTIONS = new Set(['newest', 'oldest']);
const VALID_PLATFORMS = new Set(['tt', 'ig']);

// Controller Functions

async function getCampaignCreatives(req, res) {
	try {
		// Validate request
		if (!req.params.campaign_id) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Get pagination parameters with defaults
		const page = parseInt(req.query.page) || 1;
		const pageSize = parseInt(req.query.page_size) || 25;
		const status = req.query.status || 'pending';
		const timeFrame = req.query.time_frame || 'all'; // Default to all time
		const sort = req.query.sort || 'newest'; // Default to newest first
		const platform = req.query.platform || null; // Default to all platforms

		// Validate pagination parameters
		if (page < 1 || pageSize < 1 || pageSize > 100) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid pagination parameters");
		}

		// Validate status filter
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

		// Load creatives with pagination
		const [ok, resp] = await db_getCampaignCreatives(
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

async function getAllCreatives(req, res) {
	try {
		console.log("getAllCreatives = ", req.query);

		// Get pagination parameters with defaults
		const page = parseInt(req.query.page) || 1;
		const pageSize = parseInt(req.query.page_size) || 25;
		const status = req.query.status || 'pending';
		const timeFrame = req.query.time_frame || 'all'; // Default to all time
		const sort = req.query.sort || 'newest'; // Default to newest first
		const platform = req.query.platform || null; // Default to all platforms
		const cdUserId = req.query.cd_user_id ? parseInt(req.query.cd_user_id) : null; // Creative director filter

		// Validate pagination parameters
		if (page < 1 || pageSize < 1 || pageSize > 100) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid pagination parameters");
		}

		// Validate status filter
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

		// Load creatives from all campaigns with pagination
		const [ok, resp] = await db_getAllCreatives(
			req.user.id,
			page,
			pageSize,
			status,
			timeFrame,
			sort,
			platform,
			cdUserId
		);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({ 'data': resp });
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load creatives");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function getCreativeDetails(req, res) {
	try {
		// Validate request
		if (!req.params.creative_id) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Load creative details
		const [ok, data] = await db_getCreativeDetails(req.user.id, req.params.creative_id);
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

async function approveCreative(req, res) {
	try {
		// Validate request
		if (!req.params.creative_id) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Get creative details for email notification
		const [details_ok, creative_data] = await db_getCreativeDetails(req.user.id, req.params.creative_id);
		if (!details_ok) {
			return res.status(HttpStatus.FAILED_STATUS).send("Creative not found");
		}

		// Approve the creative
		const ok = await db_approveCreative(req.user.id, req.params.creative_id, (req.body.notes) ? req.body.notes : null);
		if (!ok) return res.status(HttpStatus.FAILED_STATUS).send("Failed to approve creative");

		// Upload to Google Drive
		try {
			// Get metadata for Google Drive upload
			const [metadata_ok, metadata] = await db_getGDriveMetadata(req.params.creative_id);
			if (metadata_ok && metadata) {
				// Download file from S3 as buffer
				const fileBuffer = await s3_getFileBuffer(metadata.s3Key);

				// Determine MIME type
				const mimeType = metadata.fileExtension === 'mp4' ? 'video/mp4' : 'image/png';

				// Upload to Google Drive
				const fileName = `${metadata.approvedNumber}.${metadata.fileExtension}`;
				const folderPath = [metadata.campaignName, metadata.creatorName];

				const gdriveResult = await gdrive_uploadFile(
					fileBuffer,
					fileName,
					folderPath,
					mimeType
				);

				if (gdriveResult.success) {
					console.log(`Successfully uploaded creative ${req.params.creative_id} to Google Drive: ${gdriveResult.webViewLink}`);
				} else {
					console.warn(`Failed to upload creative ${req.params.creative_id} to Google Drive:`, gdriveResult.error);
				}
			}
		} catch (gdriveError) {
			// Log error but don't fail the approval
			console.error('Google Drive upload error:', gdriveError);
		}

		// Send email to creator using Resend that creative was approved
		if (creative_data.creator.email) {
			const emailResult = await resend_sendCreativeApprovedEmail(
				creative_data.creator.email,
				creative_data.creator.name,
				creative_data.campaign.name,
				creative_data.campaign.id,
				(req.body.notes) ? req.body.notes : null
			);
			if (emailResult.error) {
				console.warn('Failed to send approval email:', emailResult.error);
			}
		}

		// Send text to creator using Twilio that creative was approved
		if (creative_data.creator.phone) {
			const textResult = await twilio_sendCreativeApprovedText(
				creative_data.creator.phone,
				creative_data.campaign.name
			);
			if (textResult.error) {
				console.warn('Failed to send approval text:', textResult.error);
			}
		}

		return res.sendStatus(HttpStatus.SUCCESS_STATUS);
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function rejectCreative(req, res) {
	try {
		// Validate request
		if (!req.params.creative_id || !req.body.notes) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request - notes are required");
		}

		// Get creative details for email notification
		const [details_ok, creative_data] = await db_getCreativeDetails(req.user.id, req.params.creative_id);
		if (!details_ok) {
			return res.status(HttpStatus.FAILED_STATUS).send("Creative not found");
		}

		// Reject the creative with feedback notes
		const ok = await db_rejectCreative(req.user.id, req.params.creative_id, req.body.notes);
		if (!ok) return res.status(HttpStatus.FAILED_STATUS).send("Failed to reject creative");

		// Send email to creator using Resend that creative was rejected
		if (creative_data.creator.email) {
			const emailResult = await resend_sendCreativeRejectedEmail(
				creative_data.creator.email,
				creative_data.creator.name,
				creative_data.campaign.name,
				creative_data.campaign.id,
				req.body.notes
			);
			if (emailResult.error) {
				console.warn('Failed to send rejection email:', emailResult.error);
			}
		}

		// Send text to creator using Twilio that creative was rejected
		if (creative_data.creator.phone) {
			const textResult = await twilio_sendCreativeRejectedText(
				creative_data.creator.phone,
				creative_data.campaign.name,
				req.body.notes
			);
			if (textResult.error) {
				console.warn('Failed to send rejection text:', textResult.error);
			}
		}

		return res.sendStatus(HttpStatus.SUCCESS_STATUS);
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

// Export
module.exports = {
	getCampaignCreatives,
	getAllCreatives,
	getCreativeDetails,
	approveCreative,
	rejectCreative
};
