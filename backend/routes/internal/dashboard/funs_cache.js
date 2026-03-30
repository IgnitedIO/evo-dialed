// Dependencies
const Redis = require('ioredis');

// Constants
const CACHE_TTL = 3 * 60 * 60; // 3 hours
const CACHE_SERVER = new Redis({ 
	host: process.env.CACHE_SERVER_HOSTNAME, 
	port: process.env.CACHE_SERVER_PORT 
});

// Helper Functions
function getDashboardCacheKey(timespan, num_limit = null) {
	let cache_key = `intl_dash_${timespan}`;
	if (num_limit !== null) {
		cache_key += `_limit_${num_limit}`;
	}
	return cache_key;
}

// -------------------
// RETRIEVE Functions
// -------------------
async function cache_getDashboard(timespan, num_limit = null) {
	const cache_key = getDashboardCacheKey(timespan, num_limit);
	try {
		const cached_data = await CACHE_SERVER.get(cache_key);
		return cached_data ? JSON.parse(cached_data) : null;
	} catch (err) {
		console.error('Error retrieving dashboard cache:', err);
		return null;
	}
}

// -------------------
// UPDATE Functions
// -------------------
async function cache_updateDashboard(timespan, data, num_limit = null) {
	const cache_key = getDashboardCacheKey(timespan, num_limit);
	try {
		// Cache for 24 hours (86400 seconds)
		await CACHE_SERVER.setex(cache_key, CACHE_TTL, JSON.stringify(data));
		return true;
	} catch (err) {
		console.error('Error updating dashboard cache:', err);
		return false;
	}
}

// Export
module.exports = {
	cache_getDashboard,
	cache_updateDashboard
}