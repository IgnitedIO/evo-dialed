// Dependencies
const express = require('express');
const creativeApprovalRouter = express.Router();

// Middleware
const { checkUserAuth, checkInternalUser } = require('../../auth/funs_perms.js');

// Controller Imports
const {
	getCampaignCreatives,
	getAllCreatives,
	getCreativeDetails,
	approveCreative,
	rejectCreative
} = require('./controller.js');

// Routes
creativeApprovalRouter.use(checkUserAuth);
creativeApprovalRouter.use(checkInternalUser);

creativeApprovalRouter.get('/campaign/:campaign_id/list', getCampaignCreatives);
creativeApprovalRouter.get('/all/list', getAllCreatives);
creativeApprovalRouter.get('/creative/:creative_id/dtl', getCreativeDetails);
creativeApprovalRouter.patch('/creative/:creative_id/approve', approveCreative);
creativeApprovalRouter.patch('/creative/:creative_id/reject', rejectCreative);

// Export
module.exports = creativeApprovalRouter;
