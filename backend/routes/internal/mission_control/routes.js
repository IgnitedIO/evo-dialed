// Dependencies
const express = require('express');
const missionControlRouter = express.Router();

// Middleware
const { checkUserAuth, checkInternalUser } = require('../../auth/funs_perms.js');

// Controller Imports
const {
    getBoardData,
    updateCampaignBoardStatus,
    pauseCampaign,
    launchCampaign,
    getComments,
    addComment,
    deleteComment,
    getChecklist,
    updateChecklistItem,
    getBoardConfig,
    updateBoardConfig,
    getTeamMembers,
} = require('./controller.js');

// Auth middleware
missionControlRouter.use(checkUserAuth);
missionControlRouter.use(checkInternalUser);

// Board data
missionControlRouter.get('/board', getBoardData);

// Status transitions
missionControlRouter.patch('/:campaign_id/status', updateCampaignBoardStatus);
missionControlRouter.post('/:campaign_id/pause', pauseCampaign);
missionControlRouter.post('/:campaign_id/launch', launchCampaign);

// Comments
missionControlRouter.get('/:campaign_id/comments', getComments);
missionControlRouter.post('/:campaign_id/comments', addComment);
missionControlRouter.delete('/:campaign_id/comments/:comment_id', deleteComment);

// Renewal checklist
missionControlRouter.get('/:campaign_id/checklist', getChecklist);
missionControlRouter.patch('/:campaign_id/checklist/:item_id', updateChecklistItem);

// Board config
missionControlRouter.get('/config', getBoardConfig);
missionControlRouter.patch('/config/:config_key', updateBoardConfig);

// Team members (for @mentions)
missionControlRouter.get('/team-members', getTeamMembers);

// Export
module.exports = missionControlRouter;
