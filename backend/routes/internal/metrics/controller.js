// Type Imports
const HttpStatus = require('../../../types/HttpStatus.js');

// Function Imports
const {
	getDateRangesForPeriod,
	db_getKeyMetrics,
	db_getGraphData,
	db_getTopCreators,
	db_getTopContent,
	db_getEarliestMetricDate,
} = require('./funs_db_metrics.js');
const {
	db_getCacheMetadata,
	db_markCacheRefreshing,
	db_markCacheComplete
} = require('./funs_db_cache.js');

// Cache Imports
const { 
	// General
	cache_waitForRefresh,
	// Key Metrics
	cache_getKeyMetricsKey,
	cache_getKeyMetrics,
	cache_updateKeyMetrics, 
	// Performance Graph
	cache_getPerformanceGraphKey,
	cache_getPerformanceGraph,
	cache_updatePerformanceGraph,
	// Top Creators
	cache_getTopCreatorsKey,
	cache_getTopCreators,
	cache_updateTopCreators,
	// Top Content
	cache_getTopContentKey,
	cache_getTopContent,
	cache_updateTopContent,
} = require('./funs_cache.js');

// Constants
const VALID_PERIODS = ['24h', '7d', '30d', '60d', '90d', '6m', 'ytd', 'all'];
const VALID_PERIODS_SET = new Set(['24h', '7d', '30d', '60d', '90d', '6m', 'ytd', 'all']);
const VALID_GRAPH_VIEW_TYPES = new Set(['incremental', 'cumulative']);

// Helper function to validate period
function validatePeriod(period) {
	if (!VALID_PERIODS_SET.has(period)) return false;
	return true;
}

// Helper function to extract query parameters
function extractQueryParams(req) {
	const { period = "30d", strict_filter = false } = req.query;
	return {
		period,
		strict_filter: strict_filter === 'true'
	};
}

// Helper function to extract performance graph query parameters
function extractPerformanceGraphQueryParams(req) {
	const { period = "30d", strict_filter = false, view_type = 'incremental' } = req.query;
	return {
		period,
		strict_filter: strict_filter === 'true',
		view_type
	};
}


// -------------------
// Core Logic Functions (return data, not HTTP responses)
// -------------------

async function getKeyMetricsData(period, campaignIds, creatorIds, strict_filter, start_date = null, end_date = null, force_refresh = false) {
    // Get cache key
    const cache_key = cache_getKeyMetricsKey(period, campaignIds, creatorIds, strict_filter, start_date, end_date);
    
    // Check if another process is already calculating these metrics
    const metadata = await db_getCacheMetadata(cache_key);
    if (metadata?.is_refreshing) {
        const cachedResult = await cache_waitForRefresh(
            cache_key,
            cache_getKeyMetrics,
            period, 
            campaignIds, 
            creatorIds, 
            strict_filter,
            start_date,
            end_date
        );
        if (cachedResult) {
            return {
				data: cachedResult.data,
				metadata: cachedResult.metadata
			};
        }
    }
    
    // Check if valid cache exists (skip if force_refresh is true)
    if (!force_refresh) {
        const cachedResult = await cache_getKeyMetrics(period, campaignIds, creatorIds, strict_filter, start_date, end_date);
        if (cachedResult) {
            return {
                data: cachedResult.data,
                metadata: cachedResult.metadata
            };
        }
    }
    
    // No cache exists - mark as refreshing and fetch
    await db_markCacheRefreshing(cache_key, period, campaignIds, creatorIds, strict_filter);
    
    try {
        // Get metrics from DB
        const result = await db_getKeyMetrics(period, campaignIds, creatorIds, strict_filter, start_date, end_date);
        
		// Cache the results
        await cache_updateKeyMetrics(period, result, campaignIds, creatorIds, strict_filter, start_date, end_date);
        
		// Mark refresh as complete
        await db_markCacheComplete(cache_key);

		// Return result
        return {
			data: result,
			metadata: {
				cache_age_minutes: 0,
				is_refreshing: false,
				last_refresh_ts: new Date()
			}
		};

    } catch (error) {
        // Mark cache as complete even on error
        await db_markCacheComplete(cache_key);
        throw error;
    }
}

async function getPerformanceGraphData(period, campaignIds, creatorIds, strict_filter, view_type, start_date, end_date, force_refresh = false, group = true, isCSVExport = false) {
    // Get cache key - include CSV flag in cache key
    const cache_key = cache_getPerformanceGraphKey(period, campaignIds, creatorIds, strict_filter, view_type, start_date, end_date, isCSVExport);
    
    // Check if another process is already calculating these metrics
    const metadata = await db_getCacheMetadata(cache_key);
    if (metadata?.is_refreshing) {
        const cachedResult = await cache_waitForRefresh(
            cache_key,
            cache_getPerformanceGraph,
            period,
            campaignIds,
            creatorIds,
            strict_filter,
            view_type,
            start_date,
            end_date,
            isCSVExport
        );
        if (cachedResult) {
            return {
                data: cachedResult.data,
                metadata: cachedResult.metadata
            };
        }
    }
    
    // Check if valid cache exists (skip if force_refresh is true)
    if (!force_refresh) {
        const cachedResult = await cache_getPerformanceGraph(period, campaignIds, creatorIds, strict_filter, view_type, start_date, end_date, isCSVExport);
        if (cachedResult) {
            return cachedResult.data;
        }
    }
    
    // No cache exists - mark as refreshing and fetch
    await db_markCacheRefreshing(cache_key, period, campaignIds, creatorIds, strict_filter);
    
    try {
        let dateRanges = {};
        let adjustedStartDate = null;  // Track the original start date for CSV exports
        
        switch (period) {
            case 'all':
                // Get earliest date and current date
                const earliestDate = await db_getEarliestMetricDate(campaignIds, creatorIds);
                const now = new Date();
                dateRanges.currentPeriod = { start: earliestDate, end: now };
                dateRanges.referencePeriod = { start: null, end: null };
                break;
            case 'custom':
                // Get reference period distance (in days)
                const custom_period_length = Math.floor((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24));
                // Construct reference period
                const ref_period_start = new Date(start_date);
                ref_period_start.setDate(ref_period_start.getDate() - custom_period_length);
                const ref_period_end = new Date(start_date);
                ref_period_end.setDate(ref_period_end.getDate() - 1);
                // Set date ranges
                dateRanges.currentPeriod = { start: new Date(start_date), end: new Date(end_date) };
                dateRanges.referencePeriod = { start: ref_period_start, end: ref_period_end };
                break;
            default:
                dateRanges = getDateRangesForPeriod(period);
                break;
        }
        
        // For CSV exports, adjust the start date by subtracting one day
        // This fixes the cumulative bug in the first row
        if (isCSVExport) {
            adjustedStartDate = new Date(dateRanges.currentPeriod.start);
            const csvStartDate = new Date(dateRanges.currentPeriod.start);
            csvStartDate.setDate(csvStartDate.getDate() - 1);
            dateRanges.currentPeriod.start = csvStartDate;
        }
        
        // Load graph data
        let graphData = await db_getGraphData(
            dateRanges.currentPeriod.start,
            dateRanges.currentPeriod.end,
            period,
            campaignIds,
            creatorIds,
            strict_filter,
            view_type,
            group
        );
        
        // For CSV exports, filter out the extra day we added
        if (isCSVExport && adjustedStartDate) {
            const originalStartDateStr = adjustedStartDate.toISOString().split('T')[0];
            graphData = graphData.filter(row => {
                const rowDateStr = typeof row.date === 'string' ? row.date :
                                  row.date instanceof Date ? row.date.toISOString().split('T')[0] :
                                  new Date(row.date).toISOString().split('T')[0];
                return rowDateStr >= originalStartDateStr;
            });
        }
        
        await cache_updatePerformanceGraph(period, graphData, campaignIds, creatorIds, strict_filter, view_type, start_date, end_date, isCSVExport);
        await db_markCacheComplete(cache_key);
        return graphData;
    } catch (error) {
        await db_markCacheComplete(cache_key);
        throw error;
    }
}

async function getTopCreatorsData(period, limitNum, pageNum, campaignIds, creatorIds, strict_filter, start_date = null, end_date = null, force_refresh = false) {
    const cache_key = cache_getTopCreatorsKey(period, limitNum, pageNum, campaignIds, creatorIds, strict_filter, start_date, end_date);
    const metadata = await db_getCacheMetadata(cache_key);
    
    if (metadata?.is_refreshing) {
        const cachedResult = await cache_waitForRefresh(
            cache_key,
            cache_getTopCreators,
            period,
            limitNum,
            pageNum,
            campaignIds,
            creatorIds,
            strict_filter,
            start_date,
            end_date
        );
        if (cachedResult) {
            return cachedResult.data;
        }
    }
    
    // Check if valid cache exists (skip if force_refresh is true)
    if (!force_refresh) {
        const cachedResult = await cache_getTopCreators(period, limitNum, pageNum, campaignIds, creatorIds, strict_filter, start_date, end_date);
        if (cachedResult) {
            return cachedResult.data;
        }
    }
    
    // No cache exists - mark as refreshing and fetch
    await db_markCacheRefreshing(cache_key, period, campaignIds, creatorIds, strict_filter);
    
    try {
        let dateRanges = {};
        if (period === 'custom') {
            dateRanges = {
                currentPeriod: { start: new Date(start_date), end: new Date(end_date) },
                referencePeriod: { start: null, end: null }
            };
        } else if (period === 'all') {
            const earliestDate = await db_getEarliestMetricDate(null, null);
            const now = new Date();
            dateRanges = {
                currentPeriod: { start: earliestDate, end: now },
                referencePeriod: { start: null, end: null }
            };
        } else {
            dateRanges = getDateRangesForPeriod(period);
        }
        
        const result = await db_getTopCreators(
            dateRanges.currentPeriod.start,
            dateRanges.currentPeriod.end,
            campaignIds,
            creatorIds,
            strict_filter,
            limitNum,
            pageNum,
            start_date,
            end_date
        );
        
        // Add safety check for empty data
        if (!result || !result.data) {
            const emptyResult = {
                data: [],
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrevious: false
                }
            };
            await cache_updateTopCreators(period, emptyResult, limitNum, pageNum, campaignIds, creatorIds, strict_filter, start_date, end_date);
            await db_markCacheComplete(cache_key);
            return emptyResult;
        }
        
        await cache_updateTopCreators(period, result, limitNum, pageNum, campaignIds, creatorIds, strict_filter, start_date, end_date);
        await db_markCacheComplete(cache_key);
        return result;
    } catch (error) {
        await db_markCacheComplete(cache_key);
        // Return empty result on error instead of throwing
        console.error('Error in getTopCreatorsData, returning empty result:', error);
        return {
            data: [],
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrevious: false
            }
        };
    }
}

async function getTopContentData(period, parsedLimit, cursor, campaignIds, creatorIds, strict_filter, start_date = null, end_date = null, force_refresh = false) {
    const cache_key = cache_getTopContentKey(period, parsedLimit, campaignIds, creatorIds, strict_filter, cursor, start_date, end_date);
    const metadata = await db_getCacheMetadata(cache_key);
    
    if (metadata?.is_refreshing) {
        const cachedResult = await cache_waitForRefresh(
            cache_key,
            cache_getTopContent,
            period,
            parsedLimit,
            campaignIds,
            creatorIds,
            strict_filter,
            cursor,
            start_date,
            end_date
        );
        if (cachedResult) {
            return cachedResult.data;
        }
    }
    
    // Check if valid cache exists (skip if force_refresh is true)
    if (!force_refresh) {
        const cachedResult = await cache_getTopContent(period, parsedLimit, campaignIds, creatorIds, strict_filter, cursor, start_date, end_date);
        if (cachedResult) {
            return cachedResult.data;
        }
    }
    
    // No cache exists - mark as refreshing and fetch
    await db_markCacheRefreshing(cache_key, period, campaignIds, creatorIds, strict_filter);
    
    try {
        let dateRanges = {};
        if (period === 'custom') {
            dateRanges = {
                currentPeriod: { start: new Date(start_date), end: new Date(end_date) },
                referencePeriod: { start: null, end: null }
            };
        } else if (period === 'all') {
            const earliestDate = await db_getEarliestMetricDate(null, null);
            const now = new Date();
            dateRanges = {
                currentPeriod: { start: earliestDate, end: now },
                referencePeriod: { start: null, end: null }
            };
        } else {
            dateRanges = getDateRangesForPeriod(period);
        }
        
        const contentData = await db_getTopContent(
            dateRanges.currentPeriod.start,
            dateRanges.currentPeriod.end,
            campaignIds,
            creatorIds,
            strict_filter,
            parsedLimit,
            cursor,
            start_date,
            end_date
        );
        
        // Add safety check for empty data
        if (!contentData || !contentData.data) {
            const emptyResult = {
                data: [],
                pagination: {
                    cursor: null,
                    hasNext: false,
                    limit: parsedLimit
                }
            };
            if (!cursor) {
                await cache_updateTopContent(period, emptyResult, parsedLimit, campaignIds, creatorIds, strict_filter, cursor, start_date, end_date);
            }
            await db_markCacheComplete(cache_key);
            return emptyResult;
        }
        
        if (!cursor) {
            await cache_updateTopContent(period, contentData, parsedLimit, campaignIds, creatorIds, strict_filter, cursor, start_date, end_date);
        }
        await db_markCacheComplete(cache_key);
        return contentData;
    } catch (error) {
        await db_markCacheComplete(cache_key);
        // Return empty result on error instead of throwing
        console.error('Error in getTopContentData, returning empty result:', error);
        return {
            data: [],
            pagination: {
                cursor: null,
                hasNext: false,
                limit: parsedLimit
            }
        };
    }
}

// -------------------
// UNIQUE V1 Functions
// -------------------

async function generateReport(req, res) {
    try {
        const { campaign_id, creator_id } = req.query;
        
        // Convert to arrays if provided
        const campaignIds = campaign_id ? [parseInt(campaign_id)] : null;
        const creatorIds = creator_id ? [parseInt(creator_id)] : null;

        // Use Promise.all to fetch all metrics data in parallel - now with caching!
        const [keyMetricsResult, performanceGraphResult, topCreatorsResult, topContentResult] = await Promise.all([
            // Get key metrics for 'all' period with caching
            getKeyMetricsData('all', campaignIds, creatorIds, false),
            // Get performance graph data for 'all' period with cumulative view and caching
            getPerformanceGraphData('all', campaignIds, creatorIds, false, 'cumulative', null, null),
            // Get top creators (limit 50 for reports) with caching
            getTopCreatorsData('all', 50, 1, campaignIds, creatorIds, false),
            // Get top content (limit 50 for reports) with caching
            getTopContentData('all', 50, null, campaignIds, creatorIds, false)
        ]);

        // Combine the data into the same format as the original report
        const reportData = {
            // Spread only the data from key metrics (not the metadata)
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

    } catch (err) {
        console.error('Report Generation Error = ', err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

async function getCacheStatus(req, res) {
    try {
        const { timespan, campaign_id, creator_id, strict_filter = false } = req.query;
        
        // Validate time period if provided
        if (timespan && !VALID_PERIODS.includes(timespan)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid time period. Must be one of: " + VALID_PERIODS.join(", "));
        }

        // Convert to arrays if provided
        const campaignIds = campaign_id ? [parseInt(campaign_id)] : null;
        const creatorIds = creator_id ? [parseInt(creator_id)] : null;

        // Get cache metadata for the specified parameters
        const cache_key = cache_getKeyMetricsKey(timespan || '30d', campaignIds, creatorIds, (strict_filter === 'true'));
        const metadata = await db_getCacheMetadata(cache_key);

        if (!metadata) {
            return res.status(HttpStatus.SUCCESS_STATUS).json({
                has_cache: false,
                is_refreshing: false,
                cache_age_minutes: null,
                last_refresh_ts: null
            });
        }

        return res.status(HttpStatus.SUCCESS_STATUS).json({
            has_cache: true,
            is_refreshing: metadata.is_refreshing,
            cache_age_minutes: metadata.cache_age_minutes,
            last_refresh_ts: metadata.last_refresh_ts,
            refresh_started_ts: metadata.refresh_started_ts
        });

    } catch (err) {
        console.error('Cache Status Error = ', err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

// -------------------
// MAIN Functions (formerly v5)
// -------------------

/**
 * Get key metrics for the dashboard
 * Endpoint: GET /api/internal/metrics/key-metrics
 */
async function getKeyMetrics(req, res) {
    try {
        const { period, strict_filter } = extractQueryParams(req);
        const { campaign_id, creator_id, start_date, end_date } = req.query;
        
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
        else if (!validatePeriod(period)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid time period.");
        }

        // Convert to arrays if provided and validate
        const campaignIds = campaign_id ? [parseInt(campaign_id)] : null;
        const creatorIds = creator_id ? [parseInt(creator_id)] : null;

        // Use the core logic function
        const result = await getKeyMetricsData(period, campaignIds, creatorIds, strict_filter, start_date, end_date);
        
        // Check if cache is older than 2 hours (120 minutes) and trigger background refresh
        const cacheAge = result.metadata?.cache_age_minutes || 0;
        if (cacheAge >= 120) {
            // Fire-and-forget refresh call
            getKeyMetricsData(period, campaignIds, creatorIds, strict_filter, start_date, end_date, true).catch(err => {
                console.error('Background refresh error:', err);
            });
            
            // Update metadata to show refreshing status
            result.metadata.is_refreshing = true;
        }
        
        return res.status(HttpStatus.SUCCESS_STATUS).json(result);
		
    } catch (err) {
        console.error('Key Metrics Error = ', err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

async function getPerformanceGraph(req, res) {
    try {
        const { period, strict_filter, view_type } = extractPerformanceGraphQueryParams(req);
        const { campaign_ids, creator_ids, start_date, end_date, group, csv } = req.query;

        // Validate view_type parameter
        if (!VALID_GRAPH_VIEW_TYPES.has(view_type)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid view_type. Must be 'incremental' or 'cumulative'.");
        }
        // Check custom time period
        if (period === 'custom') {
            if (!start_date || !end_date) {
                return res.status(HttpStatus.FAILED_STATUS).send("Invalid custom time period. Must provide start_date and end_date.");
            }
        }
        // Validate time period
        else if (!validatePeriod(period)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid time period.");
        }
		
        // Parse campaign and creator IDs
        const campaignIds = campaign_ids ? campaign_ids.split(',').map(id => parseInt(id.trim())) : null;
        const creatorIds = creator_ids ? creator_ids.split(',').map(id => parseInt(id.trim())) : null;
        
        // Parse group parameter (default to true)
        const shouldGroup = group !== 'false';
        
        // Parse csv parameter 
        const isCSVExport = csv === 'true';
        
        // Use the core logic function
        const graphData = await getPerformanceGraphData(period, campaignIds, creatorIds, strict_filter, view_type, start_date, end_date, false, shouldGroup, isCSVExport);
        
        // For PerformanceGraph, trigger refresh after 2 hours (fire-and-forget)
        // Check cache metadata to get age
        const cache_key = cache_getPerformanceGraphKey(period, campaignIds, creatorIds, strict_filter, view_type, start_date, end_date, isCSVExport);
        const metadata = await db_getCacheMetadata(cache_key);
        const cacheAge = metadata?.cache_age_minutes || 0;
        
        let is_refreshing = false;
        if (cacheAge >= 120) {
            // Fire-and-forget refresh call
            getPerformanceGraphData(period, campaignIds, creatorIds, strict_filter, view_type, start_date, end_date, true, shouldGroup, isCSVExport).catch(err => {
                console.error('Background refresh error:', err);
            });
            is_refreshing = true;
        }

        // Return result
        return res.status(HttpStatus.SUCCESS_STATUS).json({
            data: graphData,
            metadata: {
                cache_age_minutes: cacheAge,
                is_refreshing: is_refreshing,
                last_refresh_ts: metadata?.last_refresh_ts || new Date()
            }
        });
    } catch (err) {
        console.error('Performance Graph Error = ', err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

async function getTopCreators(req, res) {
    try {
        const { period, strict_filter } = extractQueryParams(req);
        const { limit = 10, page = 1, campaign_id, creator_id, start_date, end_date } = req.query;
        
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
        else if (!validatePeriod(period)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid time period.");
        }
        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid limit. Must be between 1 and 100.");
        }
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid page. Must be a positive integer.");
        }
        const campaignIds = campaign_id ? [parseInt(campaign_id)] : null;
        const creatorIds = creator_id ? [parseInt(creator_id)] : null;
        if (campaign_id && (isNaN(parseInt(campaign_id)) || parseInt(campaign_id) <= 0)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid campaign_id. Must be a positive integer.");
        }
        if (creator_id && (isNaN(parseInt(creator_id)) || parseInt(creator_id) <= 0)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid creator_id. Must be a positive integer.");
        }
        
        // Use the core logic function
        const result = await getTopCreatorsData(period, limitNum, pageNum, campaignIds, creatorIds, strict_filter, start_date, end_date);
        
        // For TopCreators, trigger refresh after 2 hours (fire-and-forget)
        // Check cache metadata to get age
        const cache_key = cache_getTopCreatorsKey(period, limitNum, pageNum, campaignIds, creatorIds, strict_filter, start_date, end_date);
        const metadata = await db_getCacheMetadata(cache_key);
        const cacheAge = metadata?.cache_age_minutes || 0;
        
        let is_refreshing = false;
        if (cacheAge >= 120) {
            // Fire-and-forget refresh call
            getTopCreatorsData(period, limitNum, pageNum, campaignIds, creatorIds, strict_filter, start_date, end_date, true).catch(err => {
                console.error('Background refresh error:', err);
            });
            is_refreshing = true;
        }
        
        return res.status(HttpStatus.SUCCESS_STATUS).json({
            data: result.data,
            pagination: result.pagination,
            metadata: {
                cache_age_minutes: cacheAge,
                is_refreshing: is_refreshing,
                last_refresh_ts: metadata?.last_refresh_ts || new Date()
            }
        });
    } catch (err) {
        console.error('Top Creators Error = ', err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

async function getTopContent(req, res) {
    try {
        const { period, strict_filter } = extractQueryParams(req);
        const { limit = 10, cursor = null, campaign_id, creator_id, start_date, end_date } = req.query;
        const parsedLimit = parseInt(limit);
        
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
        else if (!validatePeriod(period)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid time period.");
        }
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid limit. Must be between 1 and 100.");
        }
        const campaignIds = campaign_id ? [parseInt(campaign_id)] : null;
        const creatorIds = creator_id ? [parseInt(creator_id)] : null;
        if (campaign_id && (isNaN(parseInt(campaign_id)) || parseInt(campaign_id) <= 0)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid campaign_id. Must be a positive integer.");
        }
        if (creator_id && (isNaN(parseInt(creator_id)) || parseInt(creator_id) <= 0)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid creator_id. Must be a positive integer.");
        }
        
        // Use the core logic function
        const contentData = await getTopContentData(period, parsedLimit, cursor, campaignIds, creatorIds, strict_filter, start_date, end_date);
        
        // For TopContent, trigger refresh after 2 hours (fire-and-forget)
        // Check cache metadata to get age
        const cache_key = cache_getTopContentKey(period, parsedLimit, campaignIds, creatorIds, strict_filter, cursor, start_date, end_date);
        const metadata = await db_getCacheMetadata(cache_key);
        const cacheAge = metadata?.cache_age_minutes || 0;
        
        let is_refreshing = false;
        if (cacheAge >= 120) {
            // Fire-and-forget refresh call
            getTopContentData(period, parsedLimit, cursor, campaignIds, creatorIds, strict_filter, start_date, end_date, true).catch(err => {
                console.error('Background refresh error:', err);
            });
            is_refreshing = true;
        }

        // Return result
        return res.status(HttpStatus.SUCCESS_STATUS).json({
            data: contentData.data,
            pagination: contentData.pagination,
            metadata: {
                cache_age_minutes: cacheAge,
                is_refreshing: is_refreshing,
                last_refresh_ts: metadata?.last_refresh_ts || new Date()
            }
        });
    } catch (err) {
        console.error('Top Content Error = ', err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

module.exports = {
    // Unique v1 functions
    generateReport,
    getCacheStatus,
    // Main functions (formerly v5)
    getKeyMetrics,
    getPerformanceGraph,
    getTopCreators,
    getTopContent,
    // Core logic functions for public API wrapper
    getKeyMetricsData,
    getPerformanceGraphData,
    getTopCreatorsData,
    getTopContentData
};