// Dependencies
const Redis = require('ioredis');

// Constants
const CACHE_TTL = 2 * 60 * 60; // 2 hours
const CACHE_SERVER = new Redis({ 
	host: process.env.CACHE_SERVER_HOSTNAME, 
	port: process.env.CACHE_SERVER_PORT 
});

// Helper Functions
function getCampaignsCacheKey(category) {
	let cache_key = `intl_cmp_${category}`;
	return cache_key;
}

// -------------------
// RETRIEVE Functions
// -------------------
async function cache_getCampaignsList() {
	const cache_key = getCampaignsCacheKey('list');
	try {
		const cached_data = await CACHE_SERVER.get(cache_key);
		return cached_data ? JSON.parse(cached_data) : null;
	} catch (err) {
		console.error('Error retrieving campaigns cache:', err);
		return null;
	}
}

// -------------------
// UPDATE Functions
// -------------------
async function cache_updateCampaignsList(campaigns) {
	const cache_key = getCampaignsCacheKey('list');
	try {
		// Cache for 24 hours (86400 seconds)
		await CACHE_SERVER.setex(cache_key, CACHE_TTL, JSON.stringify(campaigns));
		return true;
	} catch (err) {
		console.error('Error updating campaigns cache:', err);
		return false;
	}
}

// Export
module.exports = {
	cache_getCampaignsList,
	cache_updateCampaignsList
}