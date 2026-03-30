// Type Imports
const HttpStatus = require('../../../types/HttpStatus.js');

// Function Imports
const {
	db_getCreatorDashboard,
} = require("./funs_db.js");
const {
	db_verifyCampaignAssignment,
} = require("../campaigns/funs_db.js");

// Import internal metrics controller
const {
	getTopContentData,
	getKeyMetricsData,
	getPerformanceGraphData,
} = require("../../internal/metrics/controller.js");


async function getCreatorDashboard(req, res) {
	try {
		const [ok, resp] = await db_getCreatorDashboard(req.user.id);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load dashboard");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function getCreatorTopContent(req, res) {
	try {
		const { period = "30d", limit = 10, cursor = null, campaign_id, strict_filter = false } = req.query;
		const parsedLimit = parseInt(limit);

		const campaignId = parseInt(campaign_id);
		if (campaign_id && (isNaN(campaignId) || campaignId <= 0)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid campaign_id. Must be a positive integer.");
		}

		// Verify creator is assigned to this campaign
		if (campaign_id) {
			const [isAssigned, errorMsg] = await db_verifyCampaignAssignment(req.user.id, campaignId);
			if (!isAssigned) {
				return res.status(HttpStatus.FORBIDDEN_STATUS).send(errorMsg || "Not authorized to view this campaign");
			}
		}

		// Validate limit
		if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid limit. Must be between 1 and 100.");
		}

		// Force strict_filter to be boolean
		const strictFilterBool = strict_filter === 'true';

		// Call internal metrics controller with creator_id set to req.user.id
		const contentData = await getTopContentData(
			period,
			parsedLimit,
			cursor,
			(campaign_id) ? [campaignId] : null,  // campaignIds array
			[req.user.id], // creatorIds array - force to current user
			strictFilterBool,
			null, // start_date
			null  // end_date
		);

		// Return result in the same format as internal endpoint
		return res.status(HttpStatus.SUCCESS_STATUS).json({
			data: contentData.data,
			pagination: contentData.pagination
		});

	} catch (err) {
		console.error('Creator Top Content Error = ', err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}


async function getCreatorKeyMetrics(req, res) {
	try {
		const { period = "30d", campaign_id, strict_filter = false, start_date, end_date } = req.query;

		// If campaign_id is provided, verify assignment
		if (campaign_id) {
			const campaignId = parseInt(campaign_id);
			if (isNaN(campaignId) || campaignId <= 0) {
				return res.status(HttpStatus.FAILED_STATUS).send("Invalid campaign_id. Must be a positive integer.");
			}

			// Verify creator is assigned to this campaign
			const [isAssigned, errorMsg] = await db_verifyCampaignAssignment(req.user.id, campaignId);
			if (!isAssigned) {
				return res.status(HttpStatus.FORBIDDEN_STATUS).send(errorMsg || "Not authorized to view this campaign");
			}
		}

		// Parse campaign_id to array if provided
		const campaignIds = campaign_id ? [parseInt(campaign_id)] : null;

		// Force strict_filter to be boolean
		const strictFilterBool = strict_filter === 'true';

		// Call internal metrics controller with creator_id set to req.user.id
		const result = await getKeyMetricsData(
			period,
			campaignIds,
			[req.user.id], // creatorIds array - force to current user
			strictFilterBool,
			start_date,
			end_date
		);

		// Return result in the same format as internal endpoint
		return res.status(HttpStatus.SUCCESS_STATUS).json(result);

	} catch (err) {
		console.error('Creator Key Metrics Error = ', err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

async function getCreatorPerformanceGraph(req, res) {
	try {
		const {
			period = "30d",
			campaign_ids,
			strict_filter = false,
			view_type = 'incremental',
			start_date,
			end_date,
			group,
			csv
		} = req.query;

		// Parse campaign IDs from comma-separated string
		const campaignIds = campaign_ids ? campaign_ids.split(',').map(id => parseInt(id.trim())) : null;

		// If any campaign_ids are provided, verify assignment to ALL of them
		if (campaignIds && campaignIds.length > 0) {
			for (const campaignId of campaignIds) {
				if (isNaN(campaignId) || campaignId <= 0) {
					return res.status(HttpStatus.FAILED_STATUS).send("Invalid campaign_id in list. Must be positive integers.");
				}

				// Verify creator is assigned to this campaign
				const [isAssigned, errorMsg] = await db_verifyCampaignAssignment(req.user.id, campaignId);
				if (!isAssigned) {
					return res.status(HttpStatus.FORBIDDEN_STATUS).send(errorMsg || `Not authorized to view campaign ${campaignId}`);
				}
			}
		}

		// Force strict_filter to be boolean
		const strictFilterBool = strict_filter === 'true';

		// Parse group parameter (default to true)
		const shouldGroup = group !== 'false';

		// Parse csv parameter
		const isCSVExport = csv === 'true';

		// Call internal metrics controller with creator_id set to req.user.id
		const graphData = await getPerformanceGraphData(
			period,
			campaignIds,
			[req.user.id], // creatorIds array - force to current user
			strictFilterBool,
			view_type,
			start_date,
			end_date,
			false, // force_refresh
			shouldGroup,
			isCSVExport
		);

		// Return result in the same format as internal endpoint
		return res.status(HttpStatus.SUCCESS_STATUS).json({
			data: graphData,
			metadata: {
				cache_age_minutes: 0, // Could enhance this if needed
				is_refreshing: false,
				last_refresh_ts: new Date()
			}
		});

	} catch (err) {
		console.error('Creator Performance Graph Error = ', err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}


// Export
module.exports = {
	getCreatorDashboard,
	getCreatorTopContent,
	getCreatorKeyMetrics,
	getCreatorPerformanceGraph,
};