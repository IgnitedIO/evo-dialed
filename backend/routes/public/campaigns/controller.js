// Type Imports
const HttpStatus = require('../../../types/HttpStatus.js');

// Function Imports
const {
    db_getCampaignIdByShareLink
} = require("./funs_db.js");

// Import core logic functions from internal controller
const {
    getKeyMetricsData,
    getPerformanceGraphData,
    getTopCreatorsData,
    getTopContentData
} = require("../../internal/metrics/controller.js");

// Constants
const VALID_PERIODS = ['24h', '7d', '30d', '60d', '90d', '6m', 'ytd', 'all', 'custom'];

// Controller Functions

/**
 * Get public campaign details by share link (lightweight endpoint for campaign name)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getPublicCampaignDetails(req, res) {
    try {
        const { shareHash } = req.params;

        // Validate share hash format
        if (!shareHash || typeof shareHash !== 'string' || shareHash.length < 8 || shareHash.length > 64) {
            return res.status(HttpStatus.FAILED_STATUS).json({
                'error': 'Invalid share hash format'
            });
        }

        // Get campaign ID and name from share hash
        const [ok, campaignData] = await db_getCampaignIdByShareLink(shareHash);
        if (!ok || !campaignData) {
            return res.status(HttpStatus.NOT_FOUND_STATUS).json({
                'error': 'Campaign not found or share hash is invalid'
            });
        }

        const { campaign_id, name } = campaignData;

        return res.status(HttpStatus.SUCCESS_STATUS).json({
            'data': {
                campaign_id,
                name
            }
        });

    } catch (error) {
        console.error('Error getting public campaign details:', error);
        return res.status(HttpStatus.MISC_ERROR_STATUS).json({
            'error': 'Internal server error'
        });
    }
}

/**
 * Get public key metrics by campaign ID
 * Wrapper around internal getKeyMetricsData
 */
async function getPublicKeyMetrics(req, res) {
    try {
        const { campaignId } = req.params;
        const { period = "30d", strict_filter = false, start_date, end_date } = req.query;

        // Validate campaign ID
        const parsedCampaignId = parseInt(campaignId);
        if (isNaN(parsedCampaignId) || parsedCampaignId <= 0) {
            return res.status(HttpStatus.FAILED_STATUS).json({
                'error': 'Invalid campaign ID'
            });
        }

        // Check custom time period
        if (period === 'custom') {
            if (!start_date || !end_date) {
                return res.status(HttpStatus.FAILED_STATUS).send("Invalid custom time period. Must provide start_date and end_date.");
            }
            // Validate that end_date is after start_date
            if (new Date(start_date) >= new Date(end_date)) {
                return res.status(HttpStatus.FAILED_STATUS).send("Invalid date range. end_date must be after start_date.");
            }
        }
        // Validate time period
        else if (!VALID_PERIODS.includes(period)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid time period. Must be one of: " + VALID_PERIODS.join(", "));
        }

        // Use internal logic function
        const result = await getKeyMetricsData(period, [parsedCampaignId], null, strict_filter === 'true', start_date, end_date);
        
        return res.status(HttpStatus.SUCCESS_STATUS).json(result);

    } catch (error) {
        console.error('Error getting public key metrics:', error);
        return res.status(HttpStatus.MISC_ERROR_STATUS).json({
            'error': 'Internal server error'
        });
    }
}

/**
 * Get public performance graph by campaign ID
 * Wrapper around internal getPerformanceGraphData
 */
async function getPublicPerformanceGraph(req, res) {
    try {
        const { campaignId } = req.params;
        const { period = "30d", strict_filter = false, view_type = 'incremental', start_date, end_date, group, csv } = req.query;

        // Validate campaign ID
        const parsedCampaignId = parseInt(campaignId);
        if (isNaN(parsedCampaignId) || parsedCampaignId <= 0) {
            return res.status(HttpStatus.FAILED_STATUS).json({
                'error': 'Invalid campaign ID'
            });
        }

        // Check custom time period
        if (period === 'custom') {
            if (!start_date || !end_date) {
                return res.status(HttpStatus.FAILED_STATUS).send("Invalid custom time period. Must provide start_date and end_date.");
            }
            // Validate that end_date is after start_date
            if (new Date(start_date) >= new Date(end_date)) {
                return res.status(HttpStatus.FAILED_STATUS).send("Invalid date range. end_date must be after start_date.");
            }
        }
        // Validate parameters
        else if (!VALID_PERIODS.includes(period)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid time period. Must be one of: " + VALID_PERIODS.join(", "));
        }
        if (!['incremental', 'cumulative'].includes(view_type)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid view_type. Must be 'incremental' or 'cumulative'.");
        }

        // Parse group parameter (default to true)
        const shouldGroup = group !== 'false';
        
        // Parse csv parameter 
        const isCSVExport = csv === 'true';
        
        // Use internal logic function
        const graphData = await getPerformanceGraphData(period, [parsedCampaignId], null, strict_filter === 'true', view_type, start_date, end_date, false, shouldGroup, isCSVExport);
        
        return res.status(HttpStatus.SUCCESS_STATUS).json({
            data: graphData
        });

    } catch (error) {
        console.error('Error getting public performance graph:', error);
        return res.status(HttpStatus.MISC_ERROR_STATUS).json({
            'error': 'Internal server error'
        });
    }
}

/**
 * Get public top creators by campaign ID
 * Wrapper around internal getTopCreatorsData
 */
async function getPublicTopCreators(req, res) {
    try {
        const { campaignId } = req.params;
        const { period = "30d", strict_filter = false, limit = 10, page = 1, start_date, end_date } = req.query;

        // Validate campaign ID
        const parsedCampaignId = parseInt(campaignId);
        if (isNaN(parsedCampaignId) || parsedCampaignId <= 0) {
            return res.status(HttpStatus.FAILED_STATUS).json({
                'error': 'Invalid campaign ID'
            });
        }

        // Check custom time period
        if (period === 'custom') {
            if (!start_date || !end_date) {
                return res.status(HttpStatus.FAILED_STATUS).send("Invalid custom time period. Must provide start_date and end_date.");
            }
            // Validate that end_date is after start_date
            if (new Date(start_date) >= new Date(end_date)) {
                return res.status(HttpStatus.FAILED_STATUS).send("Invalid date range. end_date must be after start_date.");
            }
        }
        // Validate parameters
        else if (!VALID_PERIODS.includes(period)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid time period. Must be one of: " + VALID_PERIODS.join(", "));
        }
        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid limit. Must be between 1 and 100.");
        }
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid page. Must be a positive integer.");
        }

        // Use internal logic function
        const result = await getTopCreatorsData(period, limitNum, pageNum, [parsedCampaignId], null, strict_filter === 'true', start_date, end_date);
        
        return res.status(HttpStatus.SUCCESS_STATUS).json({
            data: result.data,
            pagination: result.pagination
        });

    } catch (error) {
        console.error('Error getting public top creators:', error);
        return res.status(HttpStatus.MISC_ERROR_STATUS).json({
            'error': 'Internal server error'
        });
    }
}

/**
 * Get public top content by campaign ID
 * Wrapper around internal getTopContentData
 */
async function getPublicTopContent(req, res) {
    try {
        const { campaignId } = req.params;
        const { period = "30d", strict_filter = false, limit = 10, cursor = null, start_date, end_date } = req.query;

        // Validate campaign ID
        const parsedCampaignId = parseInt(campaignId);
        if (isNaN(parsedCampaignId) || parsedCampaignId <= 0) {
            return res.status(HttpStatus.FAILED_STATUS).json({
                'error': 'Invalid campaign ID'
            });
        }

        // Check custom time period
        if (period === 'custom') {
            if (!start_date || !end_date) {
                return res.status(HttpStatus.FAILED_STATUS).send("Invalid custom time period. Must provide start_date and end_date.");
            }
            // Validate that end_date is after start_date
            if (new Date(start_date) >= new Date(end_date)) {
                return res.status(HttpStatus.FAILED_STATUS).send("Invalid date range. end_date must be after start_date.");
            }
        }
        // Validate parameters
        else if (!VALID_PERIODS.includes(period)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid time period. Must be one of: " + VALID_PERIODS.join(", "));
        }
        const parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid limit. Must be between 1 and 100.");
        }

        // Use internal logic function
        const contentData = await getTopContentData(period, parsedLimit, cursor, [parsedCampaignId], null, strict_filter === 'true', start_date, end_date);
        
        return res.status(HttpStatus.SUCCESS_STATUS).json({
            data: contentData.data,
            pagination: contentData.pagination
        });

    } catch (error) {
        console.error('Error getting public top content:', error);
        return res.status(HttpStatus.MISC_ERROR_STATUS).json({
            'error': 'Internal server error'
        });
    }
}

/**
 * Generate public report by campaign ID
 * Wrapper around internal report generation
 */
async function getPublicReport(req, res) {
    try {
        const { campaignId } = req.params;

        // Validate campaign ID
        const parsedCampaignId = parseInt(campaignId);
        if (isNaN(parsedCampaignId) || parsedCampaignId <= 0) {
            return res.status(HttpStatus.FAILED_STATUS).json({
                'error': 'Invalid campaign ID'
            });
        }

        // Use Promise.all to fetch all metrics data in parallel
        const [keyMetricsResult, performanceGraphResult, topCreatorsResult, topContentResult] = await Promise.all([
            // Get key metrics for 'all' period
            getKeyMetricsData('all', [parsedCampaignId], null, false),
            // Get performance graph data for 'all' period with cumulative view
            getPerformanceGraphData('all', [parsedCampaignId], null, false, 'cumulative'),
            // Get top creators (limit 50 for reports)
            getTopCreatorsData('all', 50, 1, [parsedCampaignId], null, false),
            // Get top content (limit 50 for reports)
            getTopContentData('all', 50, null, [parsedCampaignId], null, false)
        ]);

        // Combine the data into the same format as the internal report
        const reportData = {
            // Key metrics data
            metrics: keyMetricsResult.data,
            // Performance graph data
            performance: performanceGraphResult,
            // Top creators data
            creatorPerformance: topCreatorsResult.data || [],
            // Top content data
            contentPerformance: topContentResult.data || []
        };

        // Return response
        return res.status(HttpStatus.SUCCESS_STATUS).json(reportData);

    } catch (error) {
        console.error('Error generating public report:', error);
        return res.status(HttpStatus.MISC_ERROR_STATUS).json({
            'error': 'Internal server error'
        });
    }
}

// Export
module.exports = {
    getPublicCampaignDetails,
    getPublicKeyMetrics,
    getPublicPerformanceGraph,
    getPublicTopCreators,
    getPublicTopContent,
    getPublicReport
};