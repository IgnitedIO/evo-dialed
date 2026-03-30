// Dependencies
const Redis = require('ioredis');

// Function Imports
const {
	db_getCacheMetadata,
	db_updateCacheMetadata,
	db_resetTimedOutCache
} = require('./funs_db_cache.js');

// Constants
const CACHE_SERVER = new Redis({ 
	host: process.env.CACHE_SERVER_HOSTNAME, 
	port: process.env.CACHE_SERVER_PORT 
});
const MAX_WAIT_TIME = 50000; // 50 seconds in milliseconds
const POLL_INTERVAL = 2000; // 2 seconds in milliseconds
const CACHE_VERSION = '500.0.1';


// -------------------
// Key Generators
// -------------------
function cache_getKeyMetricsKey(timespan, campaignIds = null, creatorIds = null, strict_period = false, start_date = null, end_date = null) {
	let cache_key = `intl_key_metrics_v${CACHE_VERSION}-${timespan}`;
	if (timespan !== 'all' && strict_period) cache_key += `_strict`;
	if (campaignIds && campaignIds.length > 0) cache_key += `_cmp${campaignIds.sort().join(',')}`;
	if (creatorIds && creatorIds.length > 0) cache_key += `_crt${creatorIds.sort().join(',')}`;
	if (start_date) cache_key += `_start${start_date}`;
	if (end_date) cache_key += `_end${end_date}`;
	return cache_key;
}
function cache_getPerformanceGraphKey(timespan, campaignIds = null, creatorIds = null, strict_period = false, viewType = 'incremental', start_date = null, end_date = null, isCSVExport = false) {
	let cache_key = `intl_perf_graph_v${CACHE_VERSION}-${timespan}`;
	if (timespan !== 'all' && strict_period) cache_key += `_strict`;
	cache_key += `_${viewType}`;
	if (campaignIds && campaignIds.length > 0) cache_key += `_cmp${campaignIds.sort().join(',')}`;
	if (creatorIds && creatorIds.length > 0) cache_key += `_crt${creatorIds.sort().join(',')}`;
	if (start_date) cache_key += `_start${start_date}`;
	if (end_date) cache_key += `_end${end_date}`;
	if (isCSVExport) cache_key += `_csv`;
	return cache_key;
}
function cache_getTopCreatorsKey(timespan, limit = 10, page = 1, campaignIds = null, creatorIds = null, strict_period = false, start_date = null, end_date = null) {
	let cache_key = `intl_top_creators_v${CACHE_VERSION}-${timespan}-${limit}-${page}`;
	if (timespan !== 'all' && strict_period) cache_key += `_strict`;
	if (campaignIds && campaignIds.length > 0) cache_key += `_cmp${campaignIds.sort().join(',')}`;
	if (creatorIds && creatorIds.length > 0) cache_key += `_crt${creatorIds.sort().join(',')}`;
	if (start_date) cache_key += `_start${start_date}`;
	if (end_date) cache_key += `_end${end_date}`;
	return cache_key;
}
function cache_getTopContentKey(timespan, limit = 10, campaignIds = null, creatorIds = null, strict_period = false, cursor = null, start_date = null, end_date = null) {
	let cache_key = `intl_top_content_v${CACHE_VERSION}-${timespan}-${limit}`;
	if (timespan !== 'all' && strict_period) cache_key += `_strict`;
	if (campaignIds && campaignIds.length > 0) cache_key += `_cmp${campaignIds.sort().join(',')}`;
	if (creatorIds && creatorIds.length > 0) cache_key += `_crt${creatorIds.sort().join(',')}`;
	if (cursor) cache_key += `_cursor${cursor}`;
	if (start_date) cache_key += `_start${start_date}`;
	if (end_date) cache_key += `_end${end_date}`;
	return cache_key;
}

// -------------------
// Retrieval Functions
// -------------------
async function cache_getKeyMetrics(timespan, campaignIds = null, creatorIds = null, strict_period = false, start_date = null, end_date = null) {
	const cache_key = cache_getKeyMetricsKey(timespan, campaignIds, creatorIds, strict_period, start_date, end_date);
	try {
		const cached_data = await CACHE_SERVER.get(cache_key);
		if (!cached_data) return null;
		const metadata = await db_getCacheMetadata(cache_key);
		return {
			data: JSON.parse(cached_data),
			metadata: metadata
		};
	} catch (err) {
		console.error('Error retrieving key metrics cache:', err);
		return null;
	}
}
async function cache_getPerformanceGraph(timespan, campaignIds = null, creatorIds = null, strict_period = false, viewType = 'incremental', start_date = null, end_date = null, isCSVExport = false) {
	const cache_key = cache_getPerformanceGraphKey(timespan, campaignIds, creatorIds, strict_period, viewType, start_date, end_date, isCSVExport);
	try {
		const cached_data = await CACHE_SERVER.get(cache_key);
		if (!cached_data) return null;
		const metadata = await db_getCacheMetadata(cache_key);
		return {
			data: JSON.parse(cached_data),
			metadata: metadata
		};
	} catch (err) {
		console.error('Error retrieving performance graph cache:', err);
		return null;
	}
}
async function cache_getTopCreators(timespan, limit = 10, page = 1, campaignIds = null, creatorIds = null, strict_period = false, start_date = null, end_date = null) {
	const cache_key = cache_getTopCreatorsKey(timespan, limit, page, campaignIds, creatorIds, strict_period, start_date, end_date);
	try {
		const cached_data = await CACHE_SERVER.get(cache_key);
		if (!cached_data) return null;
		const metadata = await db_getCacheMetadata(cache_key);
		return {
			data: JSON.parse(cached_data),
			metadata: metadata
		};
	} catch (err) {
		console.error('Error retrieving top creators cache:', err);
		return null;
	}
}
async function cache_getTopContent(timespan, limit = 10, campaignIds = null, creatorIds = null, strict_period = false, cursor = null, start_date = null, end_date = null) {
	const cache_key = cache_getTopContentKey(timespan, limit, campaignIds, creatorIds, strict_period, cursor, start_date, end_date);
	try {
		const cached_data = await CACHE_SERVER.get(cache_key);
		if (!cached_data) return null;
		const metadata = await db_getCacheMetadata(cache_key);
		return {
			data: JSON.parse(cached_data),
			metadata: metadata
		};
	} catch (err) {
		console.error('Error retrieving top content cache:', err);
		return null;
	}
}

// -------------------
// Update Functions
// -------------------
async function cache_updateKeyMetrics(timespan, data, campaignIds = null, creatorIds = null, strict_period = false, start_date = null, end_date = null) {
	const cache_key = cache_getKeyMetricsKey(timespan, campaignIds, creatorIds, strict_period, start_date, end_date);
	try {
		await CACHE_SERVER.setex(cache_key, 6 * 60 * 60, JSON.stringify(data));
		await db_updateCacheMetadata(cache_key, timespan, campaignIds, creatorIds, strict_period, false);
		return true;
	} catch (err) {
		console.error('Error updating key metrics cache:', err);
		return false;
	}
}
async function cache_updatePerformanceGraph(timespan, data, campaignIds = null, creatorIds = null, strict_period = false, viewType = 'incremental', start_date = null, end_date = null, isCSVExport = false) {
	const cache_key = cache_getPerformanceGraphKey(timespan, campaignIds, creatorIds, strict_period, viewType, start_date, end_date, isCSVExport);
	try {
		await CACHE_SERVER.setex(cache_key, 12 * 60 * 60, JSON.stringify(data));
		await db_updateCacheMetadata(cache_key, timespan, campaignIds, creatorIds, strict_period, false);
		return true;
	} catch (err) {
		console.error('Error updating performance graph cache:', err);
		return false;
	}
}
async function cache_updateTopCreators(timespan, data, limit = 10, page = 1, campaignIds = null, creatorIds = null, strict_period = false, start_date = null, end_date = null) {
	const cache_key = cache_getTopCreatorsKey(timespan, limit, page, campaignIds, creatorIds, strict_period, start_date, end_date);
	try {
		await CACHE_SERVER.setex(cache_key, 12 * 60 * 60, JSON.stringify(data));
		await db_updateCacheMetadata(cache_key, timespan, campaignIds, creatorIds, strict_period, false);
		return true;
	} catch (err) {
		console.error('Error updating top creators cache:', err);
		return false;
	}
}
async function cache_updateTopContent(timespan, data, limit = 10, campaignIds = null, creatorIds = null, strict_period = false, cursor = null, start_date = null, end_date = null) {
	const cache_key = cache_getTopContentKey(timespan, limit, campaignIds, creatorIds, strict_period, cursor, start_date, end_date);
	try {
		await CACHE_SERVER.setex(cache_key, 12 * 60 * 60, JSON.stringify(data));
		await db_updateCacheMetadata(cache_key, timespan, campaignIds, creatorIds, strict_period, false);
		return true;
	} catch (err) {
		console.error('Error updating top content cache:', err);
		return false;
	}
}

// -------------------
// Polling Functions
// -------------------

/**
 * Wait for cache refresh
 * @param {string} cache_key - The cache key to wait for
 * @param {function} getCacheFn - The function to get the cache
 * @param {...any} cacheArgs - The arguments to pass to the getCacheFn
 * @returns {Promise<any>} The cached data or null if timed out
 */
async function cache_waitForRefresh(cache_key, getCacheFn, ...cacheArgs) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < MAX_WAIT_TIME) {
        // Try to get from cache
        const cachedResult = await getCacheFn(...cacheArgs);
        if (cachedResult) return cachedResult;
        
        // Check if cache is still refreshing
        const metadata = await db_getCacheMetadata(cache_key);
        if (!metadata || !metadata.is_refreshing) {
            // Cache refresh is complete or cache entry doesn't exist
            return null;
        }
        
        // Check if refresh has timed out
        if (metadata.refresh_started_ts) {
            const refreshAge = Date.now() - new Date(metadata.refresh_started_ts).getTime();
            if (refreshAge > MAX_WAIT_TIME) {
                // Reset the refresh state since it's timed out	
                await db_resetTimedOutCache(cache_key);
                return null;
            }
        }
        
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
    
    // If we get here, we've timed out waiting
    throw new Error('Timed out waiting for cache refresh');
}


// Export
module.exports = {
	cache_getKeyMetrics,
	cache_getPerformanceGraph,
	cache_getTopCreators,
	cache_getTopContent,
	cache_updateKeyMetrics,
	cache_updatePerformanceGraph,
	cache_updateTopCreators,
	cache_updateTopContent,
	cache_getKeyMetricsKey,
	cache_getPerformanceGraphKey,
	cache_getTopCreatorsKey,
	cache_getTopContentKey,
	cache_waitForRefresh,
}