// Dependencies
const Redis = require('ioredis');
const knex = require('knex')(require('../../../knexfile.js').development);

// Constants
const CACHE_SERVER = new Redis({ 
	host: process.env.CACHE_SERVER_HOSTNAME, 
	port: process.env.CACHE_SERVER_PORT 
});


// -------------------
// CACHE DB Functions
// -------------------

/**
 * Get cache metadata
 * @param {string} cache_key - The cache key to get metadata for
 * @returns {object|null} - The cache metadata or null if not found
 */
async function db_getCacheMetadata(cache_key) {
    let err_code;

    // Retrieve metadata
    const metadata = await knex('Metrics_Cache_Metadata').where({
        'cache_key': cache_key
    }).first().catch((err) => { if (err) err_code = err; });
    if (err_code || !metadata) return null;

    // Calculate cache age
    const now = new Date();
    const lastCached = new Date(metadata.last_cached_ts);
    const cacheAgeMinutes = Math.floor((now - lastCached) / (1000 * 60));
    
    // Return
    return {
        ...metadata,
        cache_age_minutes: cacheAgeMinutes,
        campaign_ids: metadata.campaign_ids ? JSON.parse(metadata.campaign_ids) : null,
        creator_ids: metadata.creator_ids ? JSON.parse(metadata.creator_ids) : null,
        strict_period: Boolean(metadata.strict_period),
        is_refreshing: Boolean(metadata.is_refreshing)
    };
}

/**
 * Update cache metadata
 * @param {string} cache_key - The cache key to update
 * @param {string} timespan - The timespan of the cache
 * @param {number[]} campaign_ids - The campaign IDs to filter by
 * @param {number[]} creator_ids - The creator IDs to filter by
 * @param {boolean} strict_period - Whether to use strict period
 * @param {boolean} isRefreshing - Whether the cache is refreshing
 * @returns {boolean} - True if successful, false if error
 */
async function db_updateCacheMetadata(cache_key, timespan, campaignIds = null, creatorIds = null, strict_period = false, isRefreshing = false) {
	let err_code;
    // Insert or update metadata
    await knex('Metrics_Cache_Metadata').insert({
        cache_key,
        timespan,
        campaign_ids: (campaignIds) ? JSON.stringify(campaignIds) : null,
        creator_ids: (creatorIds) ? JSON.stringify(creatorIds) : null,
        strict_period: strict_period ? 1 : 0,
        last_cached_ts: knex.fn.now(),
        last_refresh_ts: isRefreshing ? null : knex.fn.now(),
        is_refreshing: isRefreshing ? 1 : 0,
        refresh_started_ts: isRefreshing ? knex.fn.now() : null,
        cache_age_minutes: 0
    }).onConflict().merge({
        last_cached_ts: knex.fn.now(),
        last_refresh_ts: isRefreshing ? knex.raw('last_refresh_ts') : knex.fn.now(),
        is_refreshing: isRefreshing ? 1 : 0,
        refresh_started_ts: isRefreshing ? knex.fn.now() : knex.raw('refresh_started_ts'),
        cache_age_minutes: 0
    }).catch((err) => { if (err) err_code = err; });
    // Return
    if (err_code) return false;
    return true;
}

/**
 * Mark cache as refreshing
 * @param {string} cache_key - The cache key to mark as refreshing
 * @param {string} timespan - The timespan of the cache
 * @param {number[]} campaign_ids - The campaign IDs to filter by
 * @param {number[]} creator_ids - The creator IDs to filter by
 * @param {boolean} strict_period - Whether to use strict period
 * @returns {boolean} - True if successful, false if error
 */
async function db_markCacheRefreshing(cache_key, timespan, campaign_ids = null, creator_ids = null, strict_period = false) {
    let err_code;

    // Insert or update metadata
    await knex('Metrics_Cache_Metadata').insert({
        cache_key,
        timespan,
        campaign_ids: campaign_ids ? JSON.stringify(campaign_ids) : null,
        creator_ids: creator_ids ? JSON.stringify(creator_ids) : null,
        strict_period: strict_period ? 1 : 0,
        is_refreshing: 1,
        refresh_started_ts: new Date()
    }).onConflict().merge({
        is_refreshing: 1,
        refresh_started_ts: new Date()
    }).catch((err) => { if (err) err_code = err; });

    // Return
    if (err_code) return false;
    return true;
}

/**
 * Mark cache as complete
 * @param {string} cache_key - The cache key to mark as complete
 * @returns {boolean} - True if successful, false if error
 */
async function db_markCacheComplete(cache_key) {
    let err_code;
    await knex('Metrics_Cache_Metadata').where({
        'cache_key': cache_key
    }).update({
        is_refreshing: 0,
        refresh_started_ts: null,
        last_refresh_ts: new Date()
    }).catch((err) => { if (err) err_code = err; });
    // Return
    if (err_code) return false;
    return true;
}

/**
 * Reset timed out cache
 * @param {string} cache_key - The cache key to reset
 * @returns {boolean} - True if successful, false if error
 */
async function db_resetTimedOutCache(cache_key) {
    let err_code;
    await knex('Metrics_Cache_Metadata').where({
        'cache_key': cache_key
    }).update({
        is_refreshing: 0,
        refresh_started_ts: null
    }).catch((err) => { if (err) err_code = err; });
    // Return
    if (err_code) return false;
    return true;
}

/**
 * Invalidate campaign cache
 * @param {number} campaignId - The campaign ID to invalidate
 * @returns {boolean} - True if successful, false if error
 */
async function db_invalidateCampaignCache(campaignId) {
	try {
		// Find all cache entries that include this campaign
		const affectedCaches = await knex('Metrics_Cache_Metadata')
			.whereRaw('JSON_CONTAINS(campaign_ids, ?)', JSON.stringify(campaignId))
			.orWhere('campaign_ids', null) // Also invalidate dashboard cache (all campaigns)
			.select('cache_key');
		
		// Delete from Redis
		const cacheKeys = affectedCaches.map(cache => cache.cache_key);
		if (cacheKeys.length > 0) {
			await CACHE_SERVER.del(...cacheKeys);
		}
		
		// Mark as refreshing in metadata
		await knex('Metrics_Cache_Metadata')
			.whereIn('cache_key', cacheKeys)
			.update({
				is_refreshing: 1,
				refresh_started_ts: new Date()
			});
		
		return true;
	} catch (err) {
		console.error('Error invalidating campaign cache:', err);
		return false;
	}
}

/**
 * Invalidate creator cache
 * @param {number} creatorId - The creator ID to invalidate
 * @returns {boolean} - True if successful, false if error
 */
async function db_invalidateCreatorCache(creatorId) {
	try {
		// Find all cache entries that include this creator
		const affectedCaches = await knex('Metrics_Cache_Metadata')
			.whereRaw('JSON_CONTAINS(creator_ids, ?)', JSON.stringify(creatorId))
			.orWhere('creator_ids', null) // Also invalidate dashboard cache (all creators)
			.select('cache_key');
		
		// Delete from Redis
		const cacheKeys = affectedCaches.map(cache => cache.cache_key);
		if (cacheKeys.length > 0) {
			await CACHE_SERVER.del(...cacheKeys);
		}
		
		// Mark as refreshing in metadata
		await knex('Metrics_Cache_Metadata')
			.whereIn('cache_key', cacheKeys)
			.update({
				is_refreshing: 1,
				refresh_started_ts: new Date()
			});
		
		return true;
	} catch (err) {
		console.error('Error invalidating creator cache:', err);
		return false;
	}
}




// Export
module.exports = {
	db_getCacheMetadata,
    db_updateCacheMetadata,
	db_markCacheRefreshing,
	db_markCacheComplete,
	db_resetTimedOutCache,
	db_invalidateCampaignCache,
	db_invalidateCreatorCache
};