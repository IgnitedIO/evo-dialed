// Dependencies
const express = require('express');
const dashboardRouter = express.Router();

// Middleware
const { checkUserAuth } = require('../../auth/funs_perms.js');

// Controller Imports
const {
    getCreatorDashboard,
    getCreatorTopContent,
    getCreatorKeyMetrics,
    getCreatorPerformanceGraph,
} = require('./controller.js');

// Routes
dashboardRouter.use(checkUserAuth);

dashboardRouter.get('/load', getCreatorDashboard);
dashboardRouter.get('/top-content', getCreatorTopContent);
dashboardRouter.get('/key-metrics', getCreatorKeyMetrics);
dashboardRouter.get('/performance-graph', getCreatorPerformanceGraph);

// Export
module.exports = dashboardRouter;