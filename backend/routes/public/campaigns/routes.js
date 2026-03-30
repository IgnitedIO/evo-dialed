// Dependencies
const express = require('express');
const publicCampaignsRouter = express.Router();

// Controller Imports
const {
    getPublicCampaignDetails,
    getPublicKeyMetrics,
    getPublicPerformanceGraph,
    getPublicTopCreators,
    getPublicTopContent,
    getPublicReport
} = require('./controller.js');

// ------------
// Public Campaign Routes
// ------------

// Share hash route (for initial campaign lookup)
publicCampaignsRouter.get('/:shareHash/details', getPublicCampaignDetails);

// Campaign ID based routes (matching internal metrics structure)
publicCampaignsRouter.get('/:campaignId/key-metrics', getPublicKeyMetrics);
publicCampaignsRouter.get('/:campaignId/performance-graph', getPublicPerformanceGraph);
publicCampaignsRouter.get('/:campaignId/top-creators', getPublicTopCreators);
publicCampaignsRouter.get('/:campaignId/top-content', getPublicTopContent);
publicCampaignsRouter.get('/:campaignId/report', getPublicReport);

// Export routes
module.exports = publicCampaignsRouter;