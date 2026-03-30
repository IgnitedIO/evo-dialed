// Dependencies
const express = require('express');
const teamRouter = express.Router();



// Controller Imports
const {
    inviteAdmin,
    getCreativeDirectors
} = require('./controller.js');

// ------------
// Team Routes
// ------------

teamRouter.post('/invite-admin', inviteAdmin);
teamRouter.get('/creative-directors', getCreativeDirectors);

// Export routes
module.exports = teamRouter;
