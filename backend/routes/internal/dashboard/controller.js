// Type Imports
const HttpStatus = require('../../../types/HttpStatus.js');

// Function Imports
const {
	db_getDashboardData
} = require('./funs_db.js');

// Cache Imports
const { cache_getDashboard, cache_updateDashboard } = require('./funs_cache.js');

// Constants
const VALID_PERIODS = new Set(['7d', '30d', '60d', '90d', '6m', 'ytd', 'all']);
const DEFAULT_REPORTING_PERIOD = '30d';


// Controller Functions
async function loadDashboard(req, res) {
    try {
        // Validate params
        const period = req.query.period || DEFAULT_REPORTING_PERIOD;
        const num_limit = req.query.num_limit ? parseInt(req.query.num_limit) : null;
        
        if (!VALID_PERIODS.has(period)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid period");
        }

        // Validate num_limit if provided
        if (num_limit !== null && (isNaN(num_limit) || num_limit <= 0)) {
            return res.status(HttpStatus.FAILED_STATUS).send("Invalid num_limit: must be a positive integer");
        }

        // Check cache first
        const cached_data = await cache_getDashboard(period, num_limit);
        if (cached_data) return res.status(HttpStatus.SUCCESS_STATUS).json({ data: cached_data });

        // Get data
        const [ok, data] = await db_getDashboardData(req.user.id, period, num_limit);
        if (!ok) return res.status(HttpStatus.FAILED_STATUS).send("Failed to load dashboard data");

        // Update cache
        cache_updateDashboard(period, data, num_limit);

        // Return data
        return res.status(HttpStatus.SUCCESS_STATUS).json({ data });

    } catch (err) {
        console.error('Dashboard Error:', err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}


// Export
module.exports = {
    loadDashboard
}; 