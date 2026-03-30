// Dependencies
const authPass = require('../../auth_pass/native.js');
const HttpStatus = require('../../types/HttpStatus.js');

// Function Imports
const { resend_sendMagicLinkEmail, resend_sendResetPasswordEmail } = require('../../external_apis/resend.js');
const {
    db_getUserDetails,
    db_createUser,
    db_changePassword,
    db_createMagicLinkCode,
    db_validateMagicLinkCode,
    db_createPassResetCode,
    db_validatePassResetCode
} = require("./funs_db.js");
const {
    db_acceptCreatorInvite,
    db_joinCreatorInvite,
} = require("../internal/creators/funs_db.js");

/**
 * Handle login success
 */
function loginSuccess(_req, res, _next) {
    return res.sendStatus(HttpStatus.SUCCESS_STATUS);
}

/**
 * Handle login failure
 */
function loginFailure(err, _req, res, _next) {
    if (err.status !== 401) return res.sendStatus(HttpStatus.MISC_ERROR_STATUS);
    else return res.sendStatus(HttpStatus.UNAUTHORIZED_STATUS);
}

/**
 * Get user status
 */
async function getUserStatus(req, res) {
    try {
        // Get user details
        const [ok, resp] = await db_getUserDetails(req.user.id);
        // Return results
        if (!ok) return res.sendStatus(HttpStatus.FAILED_STATUS);
        return res.status(HttpStatus.SUCCESS_STATUS).json(resp);

    } catch (err) {
        console.log("MTE = ", err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

/**
 * Register new user
 */
async function registerUser(req, res) {
    try {
        const ok = await db_createUser(req.body.em, req.body.pw);
        if (ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);
        return res.status(HttpStatus.FAILED_STATUS).send("Failed to register");

    } catch (err) {
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

/**
 * Change password
 */
async function changePassword(req, res) {
    try {
        await db_changePassword(req.user.id, req.body.p, function (resp) {
            if (resp.ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);
            else return res.status(HttpStatus.MISC_ERROR_STATUS).send(resp.msg ?? HttpStatus.MISC_ERROR_MSG);
        });

    } catch (err) {
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

/**
 * Logout user
 */
function logoutUser(req, res, _next) {
    req.logout(function(err) {
        if (err) return res.sendStatus(HttpStatus.MISC_ERROR_STATUS);
        return res.sendStatus(HttpStatus.SUCCESS_STATUS);
    });
}

/**
 * Request a magic link sign-in
 */
async function requestMagicLink(req, res) {
    try {
        const { email } = req.body;
        if (!email) return res.status(HttpStatus.BAD_REQUEST_STATUS).send("Email is required");

        // Create magic link code
        const [ok, result] = await db_createMagicLinkCode(email);
        // Don't leak user existence - return success even if user not found
        if (!ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);

        // Send email
        const emailResp = await resend_sendMagicLinkEmail(email, result.code);
        if (emailResp.error) {
            console.error("Failed to send magic link email:", emailResp.error);
            return res.status(HttpStatus.MISC_ERROR_STATUS).send("Failed to send magic link email");
        }

        return res.sendStatus(HttpStatus.SUCCESS_STATUS);
    } catch (err) {
        console.error("Error in requestMagicLink:", err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

/**
 * Request a password reset
 */
async function requestPasswordReset(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(HttpStatus.FAILED_STATUS).send("Email is required");
        }
        
        // Create reset code
        const [ok, result] = await db_createPassResetCode(email);
        if (!ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);

        // Send email
        const emailResp = await resend_sendResetPasswordEmail(email, result.code);
        if (emailResp.error) {
            console.error("Failed to send password reset email:", emailResp.error);
            return res.status(HttpStatus.MISC_ERROR_STATUS).send("Failed to send password reset email");
        }

        return res.sendStatus(HttpStatus.SUCCESS_STATUS);
    } catch (err) {
        console.error("Error in requestPasswordReset:", err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

/**
 * Validate magic link code and sign in user
 */
async function validateMagicLink(req, res) {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(HttpStatus.BAD_REQUEST_STATUS).send("Email and code are required");
        }

        // Validate code
        const [ok, result] = await db_validateMagicLinkCode(email, code);
        if (!ok) return res.status(HttpStatus.UNAUTHORIZED_STATUS).send("Invalid or expired magic link");

        // Get user details for login session
        const [userOk, userDetails] = await db_getUserDetails(result.user_id);
        if (!userOk || !userDetails) {
            return res.status(HttpStatus.MISC_ERROR_STATUS).send("Failed to retrieve user details after magic link verification");
        }

        // Log in user with full details
        req.login({ id: result.user_id, ...userDetails }, (err) => {
            if (err) {
                console.error("Error during req.login after magic link verification:", err);
                return res.status(HttpStatus.MISC_ERROR_STATUS).send("Login failed after magic link verification");
            }
            return res.sendStatus(HttpStatus.SUCCESS_STATUS);
        });
    } catch (err) {
        console.error("Error in validateMagicLink:", err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

/**
 * Validate password reset code and update password
 */
async function validatePasswordReset(req, res) {
    try {
        const { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword) {
            return res.status(HttpStatus.FAILED_STATUS).send("Email, code, and new password are required");
        }

        // Validate code and update password
        const [ok, result] = await db_validatePassResetCode(email, code, newPassword);
        if (!ok) return res.status(HttpStatus.UNAUTHORIZED_STATUS).send("Invalid or expired password reset code");

        return res.sendStatus(HttpStatus.SUCCESS_STATUS);
    } catch (err) {
        console.error("Error in validatePasswordReset:", err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

/**
 * Accept creator invitation and create account
 */
async function acceptCreatorInvite(req, res) {
    try {
        const { email, code, password } = req.body;
        if (!email || !code || !password) {
            return res.status(HttpStatus.BAD_REQUEST_STATUS).send("Email, code, and password are required");
        }

        // Accept invite and create account
        const [ok, result] = await db_acceptCreatorInvite(email, code, password);
        if (!ok) {
            return res.status(HttpStatus.FAILED_STATUS).send(result || "Failed to accept invitation");
        }

        // Get user details for login session
        const [userOk, userDetails] = await db_getUserDetails(result);
        if (!userOk || !userDetails) {
            return res.status(HttpStatus.MISC_ERROR_STATUS).send("Account created but failed to login");
        }

        // Log in user automatically
        req.login({ id: result, ...userDetails }, (err) => {
            if (err) {
                console.error("Error during req.login after invite acceptance:", err);
                return res.status(HttpStatus.MISC_ERROR_STATUS).send("Account created but login failed");
            }
            return res.sendStatus(HttpStatus.SUCCESS_STATUS);
        });
    } catch (err) {
        console.error("Error in acceptCreatorInvite:", err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

/**
 * Join creator invite (for existing account) and create account
 */
async function joinCreatorInvite(req, res) {
    try {
        const { email, code, password } = req.body;
        if (!email || !code || !password) {
            return res.status(HttpStatus.BAD_REQUEST_STATUS).send("Email, code, and password are required");
        }

        // Join invite and create account
        const [ok, result] = await db_joinCreatorInvite(email, code, password);
        if (!ok) {
            return res.status(HttpStatus.FAILED_STATUS).send(result || "Failed to join invitation");
        }

        // Get user details for login session
        const [userOk, userDetails] = await db_getUserDetails(result);
        if (!userOk || !userDetails) {
            return res.status(HttpStatus.MISC_ERROR_STATUS).send("Joined but failed to login");
        }

        // Log in user automatically
        req.login({ id: result, ...userDetails }, (err) => {
            if (err) {
                console.error("Error during req.login after invite joined:", err);
                return res.status(HttpStatus.MISC_ERROR_STATUS).send("Joined but login failed");
            }
            return res.sendStatus(HttpStatus.SUCCESS_STATUS);
        });
    } catch (err) {
        console.error("Error in joinCreatorInvite:", err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

// Export controllers
module.exports = {
    authPass,
    loginSuccess,
    loginFailure,
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
};