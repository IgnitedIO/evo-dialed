// Dependencies
const express = require('express');
const campaignsRouter = express.Router();

// Middleware
const { checkUserAuth } = require('../../auth/funs_perms.js');

// Controller Imports
const {
    getCampaigns,
    getCampaignsSimple,
    getCampaignDetails,
    submitToCampaign,
    getAvailablePostsToSubmit,
} = require('./controller.js');

// Routes
campaignsRouter.use(checkUserAuth);

campaignsRouter.get('/list', getCampaigns);
campaignsRouter.get('/list/simple', getCampaignsSimple);
campaignsRouter.get('/:campaign_id/details', getCampaignDetails);
campaignsRouter.post('/:campaign_id/submit', submitToCampaign);
campaignsRouter.get('/:campaign_id/posts', getAvailablePostsToSubmit);

// Export
module.exports = campaignsRouter;