// Dependencies
const express = require('express');
const creativeApprovalRouter = express.Router();

// Middleware
const { checkUserAuth, checkCreatorUser } = require('../../auth/funs_perms.js');

// Controller Imports
const {
	getCreatorCampaignCreatives,
	getCreatorAllCreatives,
	getCreatorCreativeDetails,
	generateUploadUrl,
	submitCreative,
	resubmitCreative,
	deleteCreative
} = require('./controller.js');

// Routes
creativeApprovalRouter.use(checkUserAuth);
// creativeApprovalRouter.use(checkCreatorUser);

creativeApprovalRouter.get('/campaign/:campaign_id/list', getCreatorCampaignCreatives);
creativeApprovalRouter.get('/all/list', getCreatorAllCreatives);
creativeApprovalRouter.get('/creative/:creative_id/dtl', getCreatorCreativeDetails);
creativeApprovalRouter.post('/campaign/:campaign_id/upload-url', generateUploadUrl);
creativeApprovalRouter.post('/campaign/:campaign_id/submit', submitCreative);
creativeApprovalRouter.post('/creative/:creative_id/resubmit', resubmitCreative);
creativeApprovalRouter.delete('/creative/:creative_id/rm', deleteCreative);

// Export
module.exports = creativeApprovalRouter;
