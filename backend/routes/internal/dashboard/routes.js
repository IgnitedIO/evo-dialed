// Dependencies
const express = require('express');
const dashboardRouter = express.Router();

// Controller Imports
const {
	loadDashboard
} = require('./controller.js');

// Middleware
const { checkUserAuth, checkInternalUser } = require('../../auth/funs_perms.js');

// Routes
dashboardRouter.use(checkUserAuth, checkInternalUser);

dashboardRouter.get('/load', loadDashboard);

// Export
module.exports = dashboardRouter; 