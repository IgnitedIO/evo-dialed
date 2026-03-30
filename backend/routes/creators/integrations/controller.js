// Type Imports
const HttpStatus = require('../../../types/HttpStatus.js');

// Function Imports
const {
	db_getIntegrations,
	db_connectPlatform,
	db_saveLinkedState,
	db_disconnectIntegration,
} = require("./funs_db.js");
const {
	tiktok_getOAuthLink,
	tiktok_handleCallback
} = require("../../../external_apis/tiktok.js");


async function getIntegrations(req, res) {
	try {
		const [ok, resp] = await db_getIntegrations(req.user.id);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load integrations");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function connectPlatform(req, res) {
	try {
		// Validate platform
		if (!req.params.platform || (req.params.platform !== "tt" && req.params.platform !== "ig")) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid platform");
		}

		// Connect platform
		let oauth_ok, oauth_link, oauth_state, oauth_code_verifier;
		switch (req.params.platform) {
			case "ig":
				// TODO: Get OAuth URL
				break;
			case "tt":
				// TODO: Get OAuth URL
				[oauth_ok, oauth_link, oauth_state, oauth_code_verifier] = await tiktok_getOAuthLink();
				break;
			default:
				return [false, null];
		}
		if (!oauth_ok) return res.status(HttpStatus.FAILED_STATUS).send("Failed to connect platform");

		// Save linked state
		const db_ok = await db_saveLinkedState(/*req.user.id*/ 1, req.params.platform, oauth_state, oauth_code_verifier);
		if (!db_ok) return res.status(HttpStatus.FAILED_STATUS).send("Failed to save linked state");

		// Return link
		return res.status(HttpStatus.SUCCESS_STATUS).json({'data': oauth_link});

	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function handleOauthCallback(req, res) {
	try {
		// Validate platform
		if (!req.params.platform || req.params.platform !== "tt") {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid platform");
		}

		// TikTok OAuth callback handling
		// Expecting: req.body.code (string), req.body.scopes (array of strings), req.body.state (string)
		const { code, scopes, state } = req.body;

		if (!code || typeof code !== 'string') {
			return res.status(HttpStatus.FAILED_STATUS).send("No code provided or code is not a string");
		}
		if (!Array.isArray(scopes) || !scopes.every(s => typeof s === 'string')) {
			return res.status(HttpStatus.FAILED_STATUS).send("Scopes must be an array of strings");
		}
		if (!state || typeof state !== 'string') {
			return res.status(HttpStatus.FAILED_STATUS).send("No state provided or state is not a string");
		}

		// TODO: Fetch expectedState and codeVerifier from DB/session for this user and platform
		const expectedState = state; // <-- Placeholder: Replace with real lookup
		const codeVerifier = "PLACEHOLDER_CODE_VERIFIER"; // <-- Placeholder: Replace with real lookup

		try {
			const [ok, access_token, refresh_token] = await tiktok_handleCallback(code, state, expectedState, codeVerifier);
			if (!ok) {
				return res.status(HttpStatus.FAILED_STATUS).send("Failed to exchange code for tokens");
			}
			// TODO: Save access_token, refresh_token, and scopes to DB for this user
			return res.status(HttpStatus.SUCCESS_STATUS).json({
				access_token,
				refresh_token,
				scopes
			});
		} catch (err) {
			console.log("TikTok OAuth error:", err);
			return res.status(HttpStatus.FAILED_STATUS).send("TikTok OAuth error");
		}
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}


async function disconnectIntegration(req, res) {
	try {
		const [ok, resp] = await db_disconnectIntegration(req.user.id, req.params.conn_id);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to disconnect integration");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}



// Export
module.exports = {
	getIntegrations,
	connectPlatform,
	handleOauthCallback,
	disconnectIntegration,
};