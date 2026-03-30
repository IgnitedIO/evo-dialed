// Dependencies
const express = require('express');
const metricsRouter = express.Router();

// Controller Imports
const {
	generateReport,
	getCacheStatus,
	// Main functions (formerly v5)
	getKeyMetrics,
	getPerformanceGraph,
	getTopCreators,
	getTopContent
} = require('./controller.js');

// Middleware
const { checkUserAuth, checkInternalUser } = require('../../auth/funs_perms.js');

// Routes
metricsRouter.use(checkUserAuth, checkInternalUser);

// Unique v1 routes
metricsRouter.get('/report', generateReport);
metricsRouter.get('/cache-status', getCacheStatus);

// Main routes (formerly v5)
metricsRouter.get('/key-metrics', getKeyMetrics);
metricsRouter.get('/performance-graph', getPerformanceGraph);
metricsRouter.get('/top-creators', getTopCreators);
metricsRouter.get('/top-content', getTopContent);

// Export
module.exports = metricsRouter; 