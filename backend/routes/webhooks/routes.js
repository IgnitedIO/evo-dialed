// Dependencies
const express = require('express');
const webhooksRouter = express.Router();

// Middleware
// const { checkUserAuth } = require('./funs_perms.js');

// Controller Imports
const {
	backfill_metrics_ig,
	backfill_metrics_tt,
} = require('./controller.js');

// ------------
// Webhooks Routes
// ------------

webhooksRouter.post('/ig/backfill', backfill_metrics_ig);
webhooksRouter.post('/tt/backfill', backfill_metrics_tt);

// Export routes
module.exports = webhooksRouter; 