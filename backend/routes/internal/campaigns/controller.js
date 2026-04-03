// Type Imports
const HttpStatus = require('../../../types/HttpStatus.js');

// Function Imports
const {
	db_getCampaigns,
	db_getCampaignDetails,
	db_getCampaignPosts,
	db_addCampaignLink,
	db_updateCampaignLink,
	db_removeCampaignLink,
	db_getCampaignSubmissions,
	db_getCreators,
	db_inviteCreator,
	db_getAvailableSubmissions,
	db_updateCampaignSettings,
	db_createCampaign,
	db_getAvailableCampaigns,
	db_bulkAssignCampaigns,
	db_bulkAssignCreators,
	db_getAvailableCreators,
	db_removeCreatorFromCampaign,
	db_bulkAssignCreatorsV2,
	db_findCreatorPreview,
	db_deleteCampaign,
	db_getCreatorDailyPosts,
	db_getPostsOnDate,
	db_generateShareLink,
	db_assignCreativeDirector,
	db_removeCreativeDirector
} = require("./funs_db.js");
const {
	scrapeInstagramCreator,
	scrapeTiktokCreator
} = require("../../../tasks/metrics_scrape/helpers.js");
const {
	db_getKeyMetrics
} = require("../metrics/funs_db_metrics.js");
const {
	cache_updateKeyMetrics
} = require("../metrics/funs_cache.js");
const {
	scrapeProfileInfo
} = require("./funs_db.js");
// Add these imports for metrics
const { getTopContentData } = require("../metrics/controller.js");

// Cache Imports
// const { cache_getCampaignsList, cache_updateCampaignsList } = require('./funs_cache.js');

// Util Imports
const {
	convertEncodedImage,
	encodeImage
} = require("../../../utils/convertEncodedImage.js");

// Constants
const VALID_PERIODS = ['24h', '7d', '30d', '60d', '90d', '6m', 'ytd', 'all'];
const VALID_ASSIGNMENT_FREQUENCIES = new Set(['daily', 'weekly', 'monthly']);
const VALID_CAMPAIGN_SETTINGS_KEYS = new Set(['supports_ig', 'supports_tt', 'name', 'description', 'img', 'status', 'delete', 'start_date', 'end_date']);


// Controller Functions

async function getCampaigns(req, res) {
	try {
		// Get creative director filter if provided
		const cdUserId = req.query.cd_user_id ? parseInt(req.query.cd_user_id) : null;

		// Update: cache functionality now encapsulated in db_getCampaigns
		const [ok, resp] = await db_getCampaigns(req.user.id, false, cdUserId);
		if (!ok) return res.status(HttpStatus.FAILED_STATUS).send("Failed to load campaigns");

		return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function getCampaignDetails(req, res) {
	try {
		const [ok, resp] = await db_getCampaignDetails(req.user.id, req.params.campaign_id);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load campaign details");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function getCampaignPosts(req, res) {
	try {
		// Validate request
		if (!req.params.campaign_id) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Get period and pagination parameters
		const period = req.query.period || 'all';
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.page_size) || 25;
        const strict_filter = req.query.strict_filter === 'true';

		// Validate pagination parameters
		if (page < 1 || limit < 1 || limit > 100) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid pagination parameters");
		}

		// Validate period
		if (!VALID_PERIODS.includes(period)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid period");
		}

		const campaignIds = [parseInt(req.params.campaign_id)];

		// Use the metrics controller wrapper for caching and consistent response
		const result = await getTopContentData(period, limit, page, campaignIds, null, strict_filter);

		return res.status(HttpStatus.SUCCESS_STATUS).json({
			data: result.data,
			pagination: result.pagination,
			metadata: result.metadata || {
				cache_age_minutes: 0,
				is_refreshing: false,
				last_refresh_ts: new Date()
			}
		});
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function addCampaignLink(req, res) {
	try {
		// Validate request
		if (!req.params.campaign_id || !req.body.url || !req.body.title) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Add link
		const [ok, link_id] = await db_addCampaignLink(req.user.id, req.params.campaign_id, req.body.url, req.body.title, req.body.description || null);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': link_id});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to add link");

	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function updateCampaignLink(req, res) {
	try {
		// Validate request
		if (!req.params.campaign_id || !req.params.link_id || !(['url', 'title', 'description'].includes(req.body.key)) || !req.body.value) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Update link
		const ok = await db_updateCampaignLink(req.user.id, req.params.campaign_id, req.params.link_id, req.body.key, req.body.value);
		if (ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to update link");

	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function removeCampaignLink(req, res) {
	try {
		// Validate request
		if (!req.params.campaign_id || !req.params.link_id) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Remove link
		const ok = await db_removeCampaignLink(req.user.id, req.params.campaign_id, req.params.link_id);
		if (ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to remove link");

	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function getCampaignSubmissions(req, res) {
	try {
		// Validate request
		if (!req.params.campaign_id) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Get pagination parameters with defaults
		const page = parseInt(req.query.page) || 1;
		const pageSize = parseInt(req.query.page_size) || 25;

		// Validate pagination parameters
		if (page < 1 || pageSize < 1 || pageSize > 100) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid pagination parameters");
		}

		// Load submissions with pagination
		const [ok, resp] = await db_getCampaignSubmissions(req.user.id, req.params.campaign_id, page, pageSize);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load submissions");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function getCreators(req, res) {
	try {
		// Validate request
		if (!req.params.campaign_id) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Load creators
		const [ok, resp] = await db_getCreators(req.user.id, req.params.campaign_id);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load creators");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function inviteCreator(req, res) {
	try {
		// Validate request
		if (!req.params.campaign_id || !req.params.creator_id || !req.body.num_posts || !req.body.frequency || !req.body.start_date || !req.body.end_date) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}
		if (!VALID_ASSIGNMENT_FREQUENCIES.has(req.body.frequency)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid frequency");
		}
		if (req.body.start_date && !Date.parse(req.body.start_date)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid start date");
		}
		if (req.body.end_date && !Date.parse(req.body.end_date)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid end date");
		}

		// Invite creator
		const ok = await db_inviteCreator(req.user.id, req.params.campaign_id, req.params.creator_id, req.body.num_posts, req.body.frequency, req.body.start_date, req.body.end_date);
		if (ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to invite creator");

	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function updateCampaignSettings(req, res) {
	try {
		// Validate key
		if (!VALID_CAMPAIGN_SETTINGS_KEYS.has(req.params.key)) return res.status(HttpStatus.FAILED_STATUS).send("Invalid key");

		// Validate date fields if updating dates
		if (req.params.key === 'start_date' || req.params.key === 'end_date') {
			if (req.body.value && !Date.parse(req.body.value)) {
				return res.status(HttpStatus.FAILED_STATUS).send(`Invalid ${req.params.key} format`);
			}
		}

		// Update settings
		let ok;
		if (req.params.key === 'delete') {
			ok = await db_deleteCampaign(req.user.id, req.params.campaign_id);
		} else {
			const val = (req.params.key === 'img') ? encodeImage(req.body.value) : req.body.value;
			ok = await db_updateCampaignSettings(req.user.id, req.params.campaign_id, req.params.key, val);
		}

		// Update cache
		db_getCampaigns(req.user.id, true);

		// Return
		if (ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to update campaign settings");

	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function createCampaign(req, res) {
	try {
		// Validate request
		if (!req.body.name) {
			return res.status(HttpStatus.FAILED_STATUS).send("Campaign name is required");
		}

		// Validate dates if provided
		if (req.body.start_date && !Date.parse(req.body.start_date)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid start date format");
		}
		if (req.body.end_date && !Date.parse(req.body.end_date)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid end date format");
		}
		if (req.body.budget && isNaN(req.body.budget)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid budget");
		}

		// Validate status if provided
		const validStatuses = ['active', 'archive', 'complete', 'draft', 'onboarding', 'renewal', 'renewed', 'relaunch', 'paused'];
		if (req.body.status && !validStatuses.includes(req.body.status)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid status");
		}

		// Create campaign
		const [ok, campaign_id] = await db_createCampaign(
			req.user.id,
			req.body.name,
			req.body.description,
			req.body.img,
			req.body.supports_ig,
			req.body.supports_tt,
			req.body.budget,
			req.body.start_date,
			req.body.end_date,
			req.body.status || 'active'
		);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': campaign_id});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to create campaign");

	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function getAvailableCampaigns(req, res) {
	try {
		// Validate request
		if (!req.params.creator_id) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Get available campaigns
		const [ok, resp] = await db_getAvailableCampaigns(req.user.id, req.params.creator_id);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load available campaigns");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function bulkAssignCampaigns(req, res) {
	try {
		// Validate request
		if (!req.body.creator_id || !req.body.assignments || !Array.isArray(req.body.assignments)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Validate each assignment
		for (const assignment of req.body.assignments) {
			if (!assignment.campaign_id || !assignment.num_posts || assignment.num_posts < 1 || !VALID_ASSIGNMENT_FREQUENCIES.has(assignment.frequency || 'none') || !assignment.start_date || !assignment.end_date || !Date.parse(assignment.start_date) || !Date.parse(assignment.end_date)) {
				return res.status(HttpStatus.FAILED_STATUS).send("Invalid assignment data");
			}
		}

		// Bulk assign campaigns
		const ok = await db_bulkAssignCampaigns(
			req.user.id,
			req.body.creator_id,
			req.body.assignments
		);
		if (ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to assign campaigns");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function bulkAssignCreators(req, res) {
	try {
		// Validate request
		if (!req.params.campaign_id || !req.body.assignments || !Array.isArray(req.body.assignments)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Validate each assignment
		for (const assignment of req.body.assignments) {
			if (!assignment.creator_id || !assignment.num_posts || assignment.num_posts < 1 || !VALID_ASSIGNMENT_FREQUENCIES.has(assignment.frequency || 'none') || !assignment.start_date || !assignment.end_date || !Date.parse(assignment.start_date) || !Date.parse(assignment.end_date)) {
				return res.status(HttpStatus.FAILED_STATUS).send("Invalid assignment data");
			}
		}

		// Bulk assign creators
		const [ok] = await db_bulkAssignCreators(
			req.user.id,
			req.params.campaign_id,
			req.body.assignments
		);
		if (ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to assign creators");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function bulkAssignCreatorsV2(req, res) {
	try {
		// Validate request
		if (!req.params.campaign_id || !req.body.assignments || !Array.isArray(req.body.assignments)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Validate each assignment
		for (const assignment of req.body.assignments) {
			// Required fields
			if (!assignment.creator_id || !assignment.handle || !assignment.platform || 
				!assignment.num_posts || !assignment.frequency) {
				return res.status(HttpStatus.FAILED_STATUS).send("Missing required fields in assignment");
			}

			// Validate types and values
			if (typeof assignment.num_posts !== "number" || assignment.num_posts < 1) {
				return res.status(HttpStatus.FAILED_STATUS).send("Invalid number of posts");
			}

			if (!["daily", "weekly", "monthly"].includes(assignment.frequency)) {
				return res.status(HttpStatus.FAILED_STATUS).send("Invalid frequency");
			}

			if (!["instagram", "tiktok"].includes(assignment.platform)) {
				return res.status(HttpStatus.FAILED_STATUS).send("Invalid platform");
			}
		}

		// Bulk assign creators
		const ok = await db_bulkAssignCreatorsV2(
			req.user.id,
			req.params.campaign_id,
			req.body.assignments
		);
		
		if (!ok) {
			return res.status(HttpStatus.FAILED_STATUS).send("Failed to assign creators");
		}

		// Fire off scraping tasks for each newly assigned creator
		for (const assignment of req.body.assignments) {
			// Don't await - fire and forget
			if (assignment.platform === 'instagram') {
				scrapeInstagramCreator(assignment.handle).catch(err => 
					console.error(`Failed to scrape Instagram for ${assignment.handle}:`, err)
				);
			} else if (assignment.platform === 'tiktok') {
				scrapeTiktokCreator(assignment.handle).catch(err => 
					console.error(`Failed to scrape TikTok for ${assignment.handle}:`, err)
				);
			}
		}

		// Refresh metrics cache for all periods
		const creatorIds = [...new Set(req.body.assignments.map(a => a.creator_id))];
		const campaignId = parseInt(req.params.campaign_id);

		// Clear and refresh cache for each period
		for (const period of VALID_PERIODS) {
			// Clear existing cache
			await cache_updateKeyMetrics(period, null, null, null);
			await cache_updateKeyMetrics(period, null, campaignId, null);
			for (const creatorId of creatorIds) {
				await cache_updateKeyMetrics(period, null, null, creatorId);
			}

			// Refresh cache with new data (fire and forget)
			// Overall metrics
			db_getKeyMetrics(period)
				.then((data) => {
					cache_updateKeyMetrics(period, data, null, null);
				})
				.catch(err => console.error('Error refreshing overall metrics cache:', err));

			// Campaign metrics
			db_getKeyMetrics(period, [campaignId])
				.then((data) => {
					cache_updateKeyMetrics(period, data, campaignId, null);
				})
				.catch(err => console.error('Error refreshing campaign metrics cache:', err));

			// Creator metrics
			for (const creatorId of creatorIds) {
				db_getKeyMetrics(period, null, [creatorId])
					.then((data) => {
						cache_updateKeyMetrics(period, data, null, creatorId);
					})
					.catch(err => console.error(`Error refreshing metrics cache for creator ${creatorId}:`, err));
			}
		}

		// Return
		return res.sendStatus(HttpStatus.SUCCESS_STATUS);
		
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function getAvailableCreators(req, res) {
	try {
		// Validate params
		if (!req.params.campaign_id || isNaN(parseInt(req.params.campaign_id))) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Get available creators
		const [ok, result] = await db_getAvailableCreators(req.user.id, req.params.campaign_id);
		if (!ok) return res.status(HttpStatus.FAILED_STATUS).send("Failed to load available creators");
		return res.status(HttpStatus.SUCCESS_STATUS).json({ data: result });

	} catch (err) {
		console.error("Error in getAvailableCreators:", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
};

async function removeCreatorFromCampaign(req, res) {
	try {
		// Validate params
		if (!req.params.campaign_id || !req.params.creator_id || !req.params.link_id || isNaN(parseInt(req.params.campaign_id)) || isNaN(parseInt(req.params.creator_id)) || isNaN(parseInt(req.params.link_id))) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Remove creator from campaign
		const ok = await db_removeCreatorFromCampaign(req.user.id, req.params.campaign_id, req.params.creator_id, req.params.link_id);
		if (!ok) return res.status(HttpStatus.FAILED_STATUS).send("Failed to remove creator from campaign");

		// Return
		return res.sendStatus(HttpStatus.SUCCESS_STATUS);

	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function previewCreator(req, res) {
	let check_ok, scrape_info;
	try {
		// Validate request
		if (!req.body.handle || !req.body.platform) {
			return res.status(HttpStatus.FAILED_STATUS).send("Missing required fields: handle and platform");
		}

		// Validate platform
		if (!['instagram', 'tiktok'].includes(req.body.platform)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid platform. Must be 'instagram' or 'tiktok'");
		}

		// Map platform to database enum value
		const platform = req.body.platform === 'instagram' ? 'ig' : 'tt';

		// Check if preview already exists in DB to avoid extra scrape
		[check_ok, scrape_info] = await db_findCreatorPreview(platform, req.body.handle);

		// If no existing preview found, scrape profile info with preview flag
		const [scrape_ok, _scrape_data] = await scrapeProfileInfo(platform, req.body.handle, true);
		if (!scrape_ok) return res.status(HttpStatus.FAILED_STATUS).send("Failed to scrape profile info");

		// Standardize by getting same data
		[check_ok, scrape_info] = await db_findCreatorPreview(platform, req.body.handle);
		if (!check_ok) return res.status(HttpStatus.FAILED_STATUS).send("Failed to find creator preview");

		// Return scraped profile data
		return res.status(HttpStatus.SUCCESS_STATUS).json({
			data: {
				handle: req.body.handle,
				platform: req.body.platform,
				display_name: scrape_info.display_name,
				pfp: convertEncodedImage(scrape_info.pfp),
				bio: scrape_info.bio,
				num_posts: scrape_info.num_posts,
				followers: scrape_info.followers,
				following: scrape_info.following,
				is_private: scrape_info.is_private
			}
		});

	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function getCreatorDailyPosts(req, res) {
	try {
		// Validate creator ID
		const creatorId = parseInt(req.params.creator_id);
		if (isNaN(creatorId)) return res.status(HttpStatus.FAILED_STATUS).send("Invalid creator_id");

		// Get daily posts
		const campaignId = req.query.campaign_id ? parseInt(req.query.campaign_id) : null;
		const [ok, data] = await db_getCreatorDailyPosts(creatorId, campaignId);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({ data });

		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load daily posts");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function getPostsOnDate(req, res) {
	try {
		// Validate creator ID
		const creatorId = parseInt(req.params.creator_id);
		if (isNaN(creatorId)) return res.status(HttpStatus.FAILED_STATUS).send("Invalid creator_id");
		
		// Get campaign ID if provided and date
		const campaignId = req.query.campaign_id ? parseInt(req.query.campaign_id) : null;
		const date = req.params.date;

		// Validate date formatting
		if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid date format. Use YYYY-MM-DD");
		}

		// Get posts on date
		const [ok, data] = await db_getPostsOnDate(creatorId, campaignId, date);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({ data });
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load posts for date");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function generateShareLink(req, res) {
	try {
		const { campaign_id, creator_id } = req.body;

		// For now, we only support campaign share links
		if (!campaign_id) {
			return res.status(HttpStatus.FAILED_STATUS).json({
				message: 'Campaign ID is required'
			});
		}

		// Get or generate share link
		const shareLink = await db_generateShareLink(campaign_id);
		
		if (!shareLink) {
			return res.status(HttpStatus.FAILED_STATUS).json({
				message: 'Failed to generate share link'
			});
		}

		// Construct full URL using environment variable
		const baseUrl = process.env.FRONTEND_URL_PREFIX;
		const fullShareLink = `${baseUrl}/metrics/${shareLink}`;

		return res.status(HttpStatus.SUCCESS_STATUS).json({
			share_link: fullShareLink
		});
	} catch (error) {
		console.error('Error generating share link:', error);
		return res.status(HttpStatus.FAILED_STATUS).json({
			message: 'Error generating share link'
		});
	}
}

async function assignCreativeDirector(req, res) {
	try {
		const { campaign_id } = req.params;
		const { cd_user_id } = req.body;

		// Validate request
		if (!campaign_id) {
			return res.status(HttpStatus.FAILED_STATUS).json({
				message: 'Campaign ID is required'
			});
		}
		if (!cd_user_id) {
			return res.status(HttpStatus.FAILED_STATUS).json({
				message: 'Creative director user ID is required'
			});
		}

		const [ok, error_msg] = await db_assignCreativeDirector(req.user.id, campaign_id, cd_user_id);
		if (ok) {
			return res.status(HttpStatus.SUCCESS_STATUS).json({
				message: 'Creative director assigned successfully'
			});
		}
		return res.status(HttpStatus.FAILED_STATUS).json({
			message: error_msg || 'Failed to assign creative director'
		});
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function removeCreativeDirector(req, res) {
	try {
		const { campaign_id } = req.params;

		// Validate request
		if (!campaign_id) {
			return res.status(HttpStatus.FAILED_STATUS).json({
				message: 'Campaign ID is required'
			});
		}

		const [ok, error_msg] = await db_removeCreativeDirector(req.user.id, campaign_id);
		if (ok) {
			return res.status(HttpStatus.SUCCESS_STATUS).json({
				message: 'Creative director removed successfully'
			});
		}
		return res.status(HttpStatus.FAILED_STATUS).json({
			message: error_msg || 'Failed to remove creative director'
		});
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

// Export
module.exports = {
	getCampaigns,
	getCampaignDetails,
	getCampaignPosts,
	addCampaignLink,
	updateCampaignLink,
	removeCampaignLink,
	getCampaignSubmissions,
	getCreators,
	inviteCreator,
	updateCampaignSettings,
	createCampaign,
	getAvailableCampaigns,
	bulkAssignCampaigns,
	bulkAssignCreators,
	bulkAssignCreatorsV2,
	getAvailableCreators,
	removeCreatorFromCampaign,
	previewCreator,
	getCreatorDailyPosts,
	getPostsOnDate,
	generateShareLink,
	assignCreativeDirector,
	removeCreativeDirector
};