// Dependencies
const express = require('express');
const creatorsRouter = express.Router();

// Middleware
const { checkUserAuth, checkInternalUser } = require('../../auth/funs_perms.js');

// Controller Imports
const {
    createCreatorAccount,
    getCreators,
    getCreatorsCondensed,
    getCreatorDetails,
    getCreatorSubmissions,
    kickCreator,
    sendCreatorInviteEmail,
    getCreatorConnectedAccounts,
    manuallyAddCreator,
    manuallyInviteCreator,
    updateCreatorDetails,
    reassignCreatorHandle
} = require('./controller.js');

// Routes
creatorsRouter.use(checkUserAuth, checkInternalUser);

creatorsRouter.post('/new', createCreatorAccount);
creatorsRouter.post('/manual/add', manuallyAddCreator);
creatorsRouter.post('/manual/invite', manuallyInviteCreator);
creatorsRouter.get('/list/full', getCreators);
creatorsRouter.get('/list/mini', getCreatorsCondensed);
creatorsRouter.get('/:creator_id/details', getCreatorDetails);
creatorsRouter.post('/:creator_id/send-invite', sendCreatorInviteEmail);
creatorsRouter.get('/:creator_id/connected-accounts', getCreatorConnectedAccounts);
creatorsRouter.delete('/:creator_id/kick', kickCreator);
creatorsRouter.get('/:creator_id/submissions', getCreatorSubmissions);
creatorsRouter.patch('/:creator_id/:key/touch', updateCreatorDetails);
creatorsRouter.patch('/reassign-handle', reassignCreatorHandle);

// Export
module.exports = creatorsRouter;