// Dependencies
const express = require('express');
const integrationsRouter = express.Router();

// Middleware
const { checkUserAuth } = require('../../auth/funs_perms.js');

// Controller Imports
const {
    getIntegrations,
    connectPlatform,
    handleOauthCallback,
    disconnectIntegration,
} = require('./controller.js');

// Routes
// integrationsRouter.use(checkUserAuth);

integrationsRouter.get('/list', getIntegrations);
integrationsRouter.get('/:platform/connect', connectPlatform);
integrationsRouter.post('/:platform/cb', handleOauthCallback);
integrationsRouter.patch('/:conn_id/disconnect', disconnectIntegration);

// Export
module.exports = integrationsRouter;