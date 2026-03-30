// Dependencies
const express = require('express');
const campaignsRouter = express.Router();

// Middleware
const { checkUserAuth, checkInternalUser } = require('../../auth/funs_perms.js');

// Controller Imports
const {
    getCampaigns,
    getCampaignDetails,
    getCampaignPosts,
    addCampaignLink,
    updateCampaignLink,
    removeCampaignLink,
    getCampaignSubmissions,
    getCreators,
    inviteCreator,
    updateCampaignSettings,
    createCampaign,
    getAvailableCampaigns,
    bulkAssignCampaigns,
    bulkAssignCreators,
    bulkAssignCreatorsV2,
    getAvailableCreators,
    removeCreatorFromCampaign,
    previewCreator,
    getCreatorDailyPosts,
    getPostsOnDate,
    generateShareLink,
    assignCreativeDirector,
    removeCreativeDirector
} = require('./controller.js');

// Routes
campaignsRouter.use(checkUserAuth);
campaignsRouter.use(checkInternalUser);

campaignsRouter.get('/list', getCampaigns);
campaignsRouter.get('/:campaign_id/details', getCampaignDetails);
// campaignsRouter.get('/:campaign_id/posts', getCampaignPosts);
campaignsRouter.post('/:campaign_id/links/new', addCampaignLink);
campaignsRouter.patch('/:campaign_id/links/:link_id/touch', updateCampaignLink);
campaignsRouter.delete('/:campaign_id/links/:link_id/rm', removeCampaignLink);
campaignsRouter.get('/:campaign_id/submissions', getCampaignSubmissions);
campaignsRouter.get('/:campaign_id/creators', getCreators);
campaignsRouter.post('/:campaign_id/creators/bulk-assign', bulkAssignCreatorsV2);
campaignsRouter.post('/:campaign_id/creators/:creator_id/invite', inviteCreator);
campaignsRouter.patch('/:campaign_id/settings/:key/touch', updateCampaignSettings);
campaignsRouter.post('/new', createCampaign);
campaignsRouter.get('/available/:creator_id', getAvailableCampaigns);
campaignsRouter.post('/bulk-assign', bulkAssignCampaigns);
campaignsRouter.get('/:campaign_id/creators/available', getAvailableCreators);
campaignsRouter.delete('/:campaign_id/creators/:creator_id/links/:link_id/rm', removeCreatorFromCampaign);
campaignsRouter.post('/creators/preview', previewCreator);
campaignsRouter.get('/creators/:creator_id/daily-posts', getCreatorDailyPosts);
campaignsRouter.get('/creators/:creator_id/posts/:date', getPostsOnDate);
campaignsRouter.post('/share-link/generate', generateShareLink);
campaignsRouter.patch('/:campaign_id/creative-director/assign', assignCreativeDirector);
campaignsRouter.delete('/:campaign_id/creative-director/remove', removeCreativeDirector);

// Export
module.exports = campaignsRouter;