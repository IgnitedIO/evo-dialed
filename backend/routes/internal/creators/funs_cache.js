// Dependencies
const Redis = require('ioredis');

// Constants
const CACHE_TTL = {
    CREATORS_LIST: 5 * 60,        // 5 minutes - list can change frequently
    CREATORS_CONDENSED: 10 * 60,   // 10 minutes - condensed list is lighter
    CREATOR_DETAILS: 15 * 60,      // 15 minutes - details include metrics
    CREATOR_SUBMISSIONS: 10 * 60,  // 10 minutes - submissions with metrics
    SOCIAL_DETAILS: 3600,          // 1 hour - social account details
    CONNECTED_ACCOUNTS: 20 * 60    // 20 minutes - connected accounts info
};

const CACHE_SERVER = new Redis({ 
    host: process.env.CACHE_SERVER_HOSTNAME, 
    port: process.env.CACHE_SERVER_PORT 
});

// Helper Functions - Cache Key Generation
function getCreatorsCacheKey(category, options = {}) {
    const { page, pageSize, sort, search } = options;
    let cache_key = `intl_creators_${category}`;
    
    if (page && pageSize && sort) {
        cache_key += `_p${page}_s${pageSize}_${sort}`;
    }
    
    if (search && search.trim() !== '') {
        // Create a consistent hash for search to avoid cache key length issues
        const crypto = require('crypto');
        const searchHash = crypto.createHash('md5').update(search.trim()).digest('hex').substring(0, 8);
        cache_key += `_search${searchHash}`;
    }
    
    return cache_key;
}

function getCreatorDetailsCacheKey(creator_id) {
    return `intl_creator_details_${creator_id}`;
}

function getCreatorSubmissionsCacheKey(creator_id, page, pageSize) {
    return `intl_creator_submissions_${creator_id}_p${page}_s${pageSize}`;
}

function getCreatorConnectedAccountsCacheKey(creator_id) {
    return `intl_creator_accounts_${creator_id}`;
}

function getSocialDetailsCacheKey(conn_id) {
    return `socials_${conn_id}`;
}

// -------------------
// BASIC CACHE OPERATIONS
// -------------------

/**
 * Get a value from cache
 * @param {string} key - The cache key
 * @returns {Promise<Object|null>} The cached value or null if not found
 */
async function cache_get(key) {
    try {
        const cached_value = await CACHE_SERVER.get(key);
        return cached_value !== null ? JSON.parse(cached_value) : null;
    } catch (error) {
        console.error(`Error getting from cache (key: ${key}):`, error);
        return null;
    }
}

/**
 * Set a value in cache with TTL
 * @param {string} key - The cache key
 * @param {Object} value - The value to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
async function cache_set(key, value, ttl) {
    try {
        await CACHE_SERVER.setex(key, ttl, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error setting cache (key: ${key}):`, error);
        return false;
    }
}

/**
 * Delete a value from cache
 * @param {string} key - The cache key
 * @returns {Promise<boolean>} Success status
 */
async function cache_del(key) {
    try {
        await CACHE_SERVER.del(key);
        return true;
    } catch (error) {
        console.error(`Error deleting from cache (key: ${key}):`, error);
        return false;
    }
}

// -------------------
// RETRIEVE Functions
// -------------------

async function cache_getCreatorsList(page, pageSize, sort, search = '') {
    const cache_key = getCreatorsCacheKey('list', { page, pageSize, sort, search });
    try {
        const cached_data = await CACHE_SERVER.get(cache_key);
        return cached_data ? JSON.parse(cached_data) : null;
    } catch (err) {
        console.error('Error retrieving creators list cache:', err);
        return null;
    }
}

async function cache_getCreatorsCondensed(page, pageSize, sort, search = '') {
    const cache_key = getCreatorsCacheKey('condensed', { page, pageSize, sort, search });
    try {
        const cached_data = await CACHE_SERVER.get(cache_key);
        return cached_data ? JSON.parse(cached_data) : null;
    } catch (err) {
        console.error('Error retrieving creators condensed cache:', err);
        return null;
    }
}

async function cache_getCreatorDetails(creator_id) {
    const cache_key = getCreatorDetailsCacheKey(creator_id);
    try {
        const cached_data = await CACHE_SERVER.get(cache_key);
        return cached_data ? JSON.parse(cached_data) : null;
    } catch (err) {
        console.error('Error retrieving creator details cache:', err);
        return null;
    }
}

async function cache_getCreatorSubmissions(creator_id, page, pageSize) {
    const cache_key = getCreatorSubmissionsCacheKey(creator_id, page, pageSize);
    try {
        const cached_data = await CACHE_SERVER.get(cache_key);
        return cached_data ? JSON.parse(cached_data) : null;
    } catch (err) {
        console.error('Error retrieving creator submissions cache:', err);
        return null;
    }
}

async function cache_getCreatorConnectedAccounts(creator_id) {
    const cache_key = getCreatorConnectedAccountsCacheKey(creator_id);
    try {
        const cached_data = await CACHE_SERVER.get(cache_key);
        return cached_data ? JSON.parse(cached_data) : null;
    } catch (err) {
        console.error('Error retrieving creator connected accounts cache:', err);
        return null;
    }
}

// -------------------
// UPDATE Functions
// -------------------

async function cache_updateCreatorsList(page, pageSize, sort, search, data) {
    const cache_key = getCreatorsCacheKey('list', { page, pageSize, sort, search });
    try {
        await CACHE_SERVER.setex(cache_key, CACHE_TTL.CREATORS_LIST, JSON.stringify(data));
        return true;
    } catch (err) {
        console.error('Error updating creators list cache:', err);
        return false;
    }
}

async function cache_updateCreatorsCondensed(page, pageSize, sort, search, data) {
    const cache_key = getCreatorsCacheKey('condensed', { page, pageSize, sort, search });
    try {
        await CACHE_SERVER.setex(cache_key, CACHE_TTL.CREATORS_CONDENSED, JSON.stringify(data));
        return true;
    } catch (err) {
        console.error('Error updating creators condensed cache:', err);
        return false;
    }
}

async function cache_updateCreatorDetails(creator_id, data) {
    const cache_key = getCreatorDetailsCacheKey(creator_id);
    try {
        await CACHE_SERVER.setex(cache_key, CACHE_TTL.CREATOR_DETAILS, JSON.stringify(data));
        return true;
    } catch (err) {
        console.error('Error updating creator details cache:', err);
        return false;
    }
}

async function cache_updateCreatorSubmissions(creator_id, page, pageSize, data) {
    const cache_key = getCreatorSubmissionsCacheKey(creator_id, page, pageSize);
    try {
        await CACHE_SERVER.setex(cache_key, CACHE_TTL.CREATOR_SUBMISSIONS, JSON.stringify(data));
        return true;
    } catch (err) {
        console.error('Error updating creator submissions cache:', err);
        return false;
    }
}

async function cache_updateCreatorConnectedAccounts(creator_id, data) {
    const cache_key = getCreatorConnectedAccountsCacheKey(creator_id);
    try {
        await CACHE_SERVER.setex(cache_key, CACHE_TTL.CONNECTED_ACCOUNTS, JSON.stringify(data));
        return true;
    } catch (err) {
        console.error('Error updating creator connected accounts cache:', err);
        return false;
    }
}

// -------------------
// DELETE Functions
// -------------------

async function cache_deleteCreatorsList() {
    try {
        const keys = await CACHE_SERVER.keys('intl_creators_list_*');
        if (keys.length > 0) {
            await CACHE_SERVER.del(...keys);
        }
        return true;
    } catch (err) {
        console.error('Error deleting creators list cache:', err);
        return false;
    }
}

async function cache_deleteCreatorsCondensed() {
    try {
        const keys = await CACHE_SERVER.keys('intl_creators_condensed_*');
        if (keys.length > 0) {
            await CACHE_SERVER.del(...keys);
        }
        return true;
    } catch (err) {
        console.error('Error deleting creators condensed cache:', err);
        return false;
    }
}

async function cache_deleteCreatorDetails(creator_id) {
    const cache_key = getCreatorDetailsCacheKey(creator_id);
    try {
        await CACHE_SERVER.del(cache_key);
        return true;
    } catch (err) {
        console.error('Error deleting creator details cache:', err);
        return false;
    }
}

async function cache_deleteCreatorSubmissions(creator_id) {
    try {
        const keys = await CACHE_SERVER.keys(`intl_creator_submissions_${creator_id}_*`);
        if (keys.length > 0) {
            await CACHE_SERVER.del(...keys);
        }
        return true;
    } catch (err) {
        console.error('Error deleting creator submissions cache:', err);
        return false;
    }
}

async function cache_deleteCreatorConnectedAccounts(creator_id) {
    const cache_key = getCreatorConnectedAccountsCacheKey(creator_id);
    try {
        await CACHE_SERVER.del(cache_key);
        return true;
    } catch (err) {
        console.error('Error deleting creator connected accounts cache:', err);
        return false;
    }
}

// -------------------
// CACHE INVALIDATION FUNCTIONS
// -------------------

/**
 * Invalidate all creator list cache entries
 * @returns {Promise<boolean>} Success status
 */
async function invalidateCreatorListCache() {
    try {
        // Get all creator list related keys
        const listKeys = await CACHE_SERVER.keys('intl_creators_list_*');
        const condensedKeys = await CACHE_SERVER.keys('intl_creators_condensed_*');
        
        // Combine all keys
        const allKeys = [...listKeys, ...condensedKeys];
        
        // Delete all keys if any exist
        if (allKeys.length > 0) {
            await CACHE_SERVER.del(...allKeys);
        }
        
        return true;
    } catch (error) {
        console.error('Error invalidating creator list cache:', error);
        return false;
    }
}

/**
 * Pattern-based cache key invalidation
 * @param {string} pattern - The pattern to match (e.g., 'intl_creators_*')
 * @returns {Promise<boolean>} Success status
 */
async function invalidateCacheByPattern(pattern) {
    try {
        const keys = await CACHE_SERVER.keys(pattern);
        if (keys.length > 0) {
            await CACHE_SERVER.del(...keys);
        }
        return true;
    } catch (error) {
        console.error(`Error invalidating cache by pattern (${pattern}):`, error);
        return false;
    }
}

/**
 * Selective invalidation by creator ID - removes all cache entries for a specific creator
 * @param {string|number} creator_id - The creator ID
 * @returns {Promise<boolean>} Success status
 */
async function invalidateCreatorCache(creator_id) {
    try {
        // Get all keys related to this creator
        const detailsKey = getCreatorDetailsCacheKey(creator_id);
        const submissionsKeys = await CACHE_SERVER.keys(`intl_creator_submissions_${creator_id}_*`);
        const accountsKey = getCreatorConnectedAccountsCacheKey(creator_id);
        
        // Combine all keys
        const keysToDelete = [detailsKey, accountsKey, ...submissionsKeys];
        
        // Delete all keys
        if (keysToDelete.length > 0) {
            await CACHE_SERVER.del(...keysToDelete);
        }
        
        // Also invalidate list caches as creator data might have changed
        await invalidateCreatorListCache();
        
        return true;
    } catch (error) {
        console.error(`Error invalidating creator cache (ID: ${creator_id}):`, error);
        return false;
    }
}

/**
 * Cache cleanup utility - removes expired or orphaned cache entries
 * @param {Object} options - Cleanup options
 * @param {boolean} options.removeExpired - Whether to remove expired entries
 * @param {string[]} options.patterns - Specific patterns to clean
 * @returns {Promise<Object>} Cleanup results
 */
async function cleanupCache(options = {}) {
    const results = {
        success: false,
        keysRemoved: 0,
        errors: []
    };
    
    try {
        const { removeExpired = true, patterns = [] } = options;
        let keysToRemove = [];
        
        // If specific patterns provided, use those
        if (patterns.length > 0) {
            for (const pattern of patterns) {
                const keys = await CACHE_SERVER.keys(pattern);
                keysToRemove = keysToRemove.concat(keys);
            }
        } else {
            // Default cleanup - get all creator-related keys
            const allPatterns = [
                'intl_creators_list_*',
                'intl_creators_condensed_*',
                'intl_creator_details_*',
                'intl_creator_submissions_*',
                'intl_creator_accounts_*',
                'socials_*'
            ];
            
            for (const pattern of allPatterns) {
                const keys = await CACHE_SERVER.keys(pattern);
                keysToRemove = keysToRemove.concat(keys);
            }
        }
        
        // If checking for expired entries
        if (removeExpired && keysToRemove.length > 0) {
            const expiredKeys = [];
            
            // Check TTL for each key
            for (const key of keysToRemove) {
                const ttl = await CACHE_SERVER.ttl(key);
                if (ttl === -1 || ttl === -2) {
                    // -1 means no expiration, -2 means key doesn't exist
                    if (ttl === -2) {
                        expiredKeys.push(key);
                    }
                }
            }
            
            keysToRemove = expiredKeys;
        }
        
        // Remove the keys
        if (keysToRemove.length > 0) {
            await CACHE_SERVER.del(...keysToRemove);
            results.keysRemoved = keysToRemove.length;
        }
        
        results.success = true;
        
    } catch (error) {
        console.error('Error during cache cleanup:', error);
        results.errors.push(error.message);
    }
    
    return results;
}

/**
 * Invalidate all cache entries related to social accounts
 * @param {string} conn_id - Optional specific connection ID to invalidate
 * @returns {Promise<boolean>} Success status
 */
async function invalidateSocialCache(conn_id = null) {
    try {
        if (conn_id) {
            // Invalidate specific social account cache
            const cache_key = getSocialDetailsCacheKey(conn_id);
            await CACHE_SERVER.del(cache_key);
        } else {
            // Invalidate all social account caches
            const keys = await CACHE_SERVER.keys('socials_*');
            if (keys.length > 0) {
                await CACHE_SERVER.del(...keys);
            }
        }
        
        return true;
    } catch (error) {
        console.error(`Error invalidating social cache (conn_id: ${conn_id}):`, error);
        return false;
    }
}

// -------------------
// SPECIAL FUNCTIONS
// -------------------

/**
 * Get social account details from cache or fetch and cache them
 * @param {string} conn_id - The connection ID
 * @param {Function} fetchFn - Function to fetch data if not in cache
 * @returns {Promise<Object|null>} The account details or null if failed
 */
async function get_social_details(conn_id, fetchFn) {
    const cache_key = getSocialDetailsCacheKey(conn_id);
    
    // Try cache first
    const cached_details = await cache_get(cache_key);
    if (cached_details !== null) {
        return cached_details;
    }

    // Cache miss - fetch and cache
    try {
        const details = await fetchFn();
        if (details) {
            await cache_set(cache_key, details, CACHE_TTL.SOCIAL_DETAILS);
        }
        return details;
    } catch (error) {
        console.error(`Error fetching social details for ${conn_id}:`, error);
        return null;
    }
}

/**
 * Test cache connection
 * @returns {Promise<boolean>} Connection status
 */
async function cache_testConnection() {
    try {
        await CACHE_SERVER.ping();
        return true;
    } catch (error) {
        console.error('Cache connection test failed:', error);
        return false;
    }
}

// Export
module.exports = {
    CACHE_TTL,
    cache_get,
    cache_set,
    cache_del,
    cache_getCreatorsList,
    cache_getCreatorsCondensed,
    cache_getCreatorDetails,
    cache_getCreatorSubmissions,
    cache_getCreatorConnectedAccounts,
    cache_updateCreatorsList,
    cache_updateCreatorsCondensed,
    cache_updateCreatorDetails,
    cache_updateCreatorSubmissions,
    cache_updateCreatorConnectedAccounts,
    cache_deleteCreatorsList,
    cache_deleteCreatorsCondensed,
    cache_deleteCreatorDetails,
    cache_deleteCreatorSubmissions,
    cache_deleteCreatorConnectedAccounts,
    get_social_details,
    cache_testConnection,
    // Cache invalidation functions
    invalidateCreatorListCache,
    invalidateCacheByPattern,
    cleanupCache,
    invalidateSocialCache
}; 