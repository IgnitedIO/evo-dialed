// Dependencies
const express = require('express');
const authRouter = express.Router();

// Middleware
const { checkUserAuth } = require('./funs_perms.js');

// Controller Imports
const {
    authPass,
    loginSuccess, loginFailure,
    getUserStatus,
    registerUser,
    changePassword,
    logoutUser,
    requestMagicLink,
    validateMagicLink,
    requestPasswordReset,
    validatePasswordReset,
    acceptCreatorInvite,
    joinCreatorInvite,
} = require('./controller.js');

// ------------
// Auth Routes
// ------------

authRouter.post('/login', authPass.authenticate('local', {failureMessage: true, failWithError: true}),
    loginSuccess,
    loginFailure
);

authRouter.get('/status', checkUserAuth, getUserStatus);
authRouter.post('/register', registerUser);
authRouter.patch('/pw/touch', checkUserAuth, changePassword);
authRouter.get('/logout', checkUserAuth, logoutUser);

// Magic Link Routes
authRouter.post('/magic-link/request', requestMagicLink);
authRouter.post('/magic-link/validate', validateMagicLink);

// Password Reset Routes
authRouter.post('/forgot-password', requestPasswordReset);
authRouter.post('/reset-password', validatePasswordReset);

// Creator Invite Routes
authRouter.post('/accept-invite', acceptCreatorInvite);
authRouter.post('/join-invite', joinCreatorInvite);

// Export routes
module.exports = authRouter; 