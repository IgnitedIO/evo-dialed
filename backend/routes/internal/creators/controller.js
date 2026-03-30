// Type Imports
const HttpStatus = require('../../../types/HttpStatus.js');

// Function Imports
const {
	db_createCreatorAccount,
	db_getCreators,
	db_getCreatorsCondensed,
	db_getCreatorDetails,
	db_getCreatorSubmissions,
	db_removeCreator,
	db_getCreatorConnectedAccounts,
	db_manuallyAddCreator,
	db_updateCreatorDetails,
	db_reassignCreatorHandle,
	db_manuallyInviteCreator,
	db_sendCreatorInviteEmail,
} = require("./funs_db.js");

const { generateCode, resend_sendCreatorInviteEmail } = require('../../../external_apis/resend');

// Constants
const VALID_SORTS_FULL = new Set(['hlposts', 'lhposts', 'hlcmp', 'lhcmp', 'hltime', 'lhtime']);
const VALID_SORTS_CONDENSED = new Set(['hltime', 'lhtime']);


// Controller Functions
async function createCreatorAccount(req, res) {
	try {
		// Validate request
		if (!req.body.email || !req.body.password) {
			return res.status(HttpStatus.FAILED_STATUS).send("Missing required fields");
		}

		// Create creator account
		const [ok, creator_account_id] = await db_createCreatorAccount(req.user.id, req.body.email, req.body.password, req.body.name || req.body.email);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': creator_account_id});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to create creator account");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function manuallyAddCreator(req, res) {
	try {
		// Validate request
		if (!req.body.name) {
			return res.status(HttpStatus.FAILED_STATUS).send("Missing required fields");
		}

		// Manually add creator
		const [ok, creator_account_id] = await db_manuallyAddCreator(req.user.id, req.body.name);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': creator_account_id});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to manually add creator");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function manuallyInviteCreator(req, res) {
	try {
		const { email, name, phone } = req.body;

		// Validate request
		if (!email || !name) {
			return res.status(HttpStatus.FAILED_STATUS).send("Missing required fields");
		}

		// Generate invite code
		const inviteCode = generateCode();

		// Create invitation in database
		const [ok, result] = await db_manuallyInviteCreator(req.user.id, name, email, phone, inviteCode);
		if (!ok) {
			return res.status(HttpStatus.FAILED_STATUS).send(result || "Failed to create invitation");
		}

		// Send invitation email
		const emailResult = await resend_sendCreatorInviteEmail(email, name, inviteCode);
		if (emailResult.error) {
			console.error('Failed to send invitation email:', emailResult.error);
			// Don't fail the invite if email fails - just log it
		}

		return res.status(HttpStatus.SUCCESS_STATUS).json({'data': result.invite_id});
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function getCreators(req, res) {
	try {
		// Get pagination parameters with defaults
		const page = parseInt(req.query.page) || 1;
		const pageSize = parseInt(req.query.page_size) || 25;
		const sort = req.query.sort || 'hltime';
		const search = req.query.search || '';

		// Validate pagination parameters
		if (page < 1 || pageSize < 1 || pageSize > 100) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid pagination parameters");
		}

		// Validate sort parameter
		if (!VALID_SORTS_FULL.has(sort)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid sort parameter");
		}

		// Validate search parameter type
		if (typeof search !== 'string') {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid search parameter");
		}

		const [ok, resp] = await db_getCreators(req.user.id, page, pageSize, sort, search);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		console.error('[getCreators] db_getCreators failed, resp:', resp);
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load creators");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function getCreatorsCondensed(req, res) {
	try {
		// Get pagination parameters with defaults
		const page = parseInt(req.query.page) || 1;
		const pageSize = parseInt(req.query.page_size) || 25;
		const sort = req.query.sort || 'hltime';
		const search = req.query.search || '';

		// Validate pagination parameters
		if (page < 1 || pageSize < 1 || pageSize > 100) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid pagination parameters");
		}

		// Validate sort parameter
		if (!VALID_SORTS_CONDENSED.has(sort)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid sort parameter");
		}

		// Validate search parameter type
		if (typeof search !== 'string') {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid search parameter");
		}

		// Return creators
		const [ok, resp] = await db_getCreatorsCondensed(req.user.id, page, pageSize, sort, search);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load creators");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function getCreatorDetails(req, res) {
	try {
		const [ok, resp] = await db_getCreatorDetails(req.user.id, req.params.creator_id);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load creator details");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function getCreatorSubmissions(req, res) {
	try {
		// Validate request
		if (!req.params.creator_id) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Get pagination parameters with defaults
		const page = parseInt(req.query.page) || 1;
		const pageSize = parseInt(req.query.page_size) || 25;

		// Validate pagination parameters
		if (page < 1 || pageSize < 1 || pageSize > 100) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid pagination parameters");
		}

		// Load submissions with pagination
		const [ok, resp] = await db_getCreatorSubmissions(req.user.id, req.params.creator_id, page, pageSize);
		if (!ok) {
			return res.status(HttpStatus.FAILED_STATUS).send("Failed to get creator submissions");
		}
		return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function getCreatorConnectedAccounts(req, res) {
	try {
		const [ok, resp] = await db_getCreatorConnectedAccounts(req.user.id, req.params.creator_id);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load creator connected accounts");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function sendCreatorInviteEmail(req, res) {
	try {
		const { creator_id } = req.params;

		// Validate request
		if (!creator_id) {
			return res.status(HttpStatus.FAILED_STATUS).send("Missing required fields");
		}

		// Generate invite code
		const inviteCode = generateCode();

		// Create invitation in database
		const [ok, result] = await db_sendCreatorInviteEmail(req.user.id, creator_id, inviteCode);
		if (!ok) {
			return res.status(HttpStatus.FAILED_STATUS).send(result || "Failed to create invitation");
		}

		// Send invitation email
		const emailResult = await resend_sendCreatorInviteEmail(result.email, result.name, inviteCode, true);
		if (emailResult.error) {
			console.error('Failed to send invitation email:', emailResult.error);
			// Don't fail the invite if email fails - just log it
		}

		return res.status(HttpStatus.SUCCESS_STATUS).json({'data': result.invite_id});
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function kickCreator(req, res) {
	try {
		const ok = await db_removeCreator(req.user.id, req.params.creator_id);
		if (ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to kick creator");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function updateCreatorDetails(req, res) {
	try {
		// Validate request
		if (!req.params.creator_id || !req.params.key || !req.body.value) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid request");
		}

		// Update creator details
		const [ok, error] = await db_updateCreatorDetails(req.user.id, req.params.creator_id, req.params.key, req.body.value);
		if (!ok) {
			return res.status(HttpStatus.FAILED_STATUS).send(error || "Failed to update creator details");
		}
		return res.sendStatus(HttpStatus.SUCCESS_STATUS);
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function reassignCreatorHandle(req, res) {
	try {
		// Validate request
		if (!req.body.handle || !req.body.new_creator_id) {
			return res.status(HttpStatus.FAILED_STATUS).send("Missing required fields: handle, new_creator_id");
		}

		// Validate new_creator_id is a number
		const newCreatorId = parseInt(req.body.new_creator_id);
		if (isNaN(newCreatorId)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid new_creator_id");
		}

		// Reassign creator handle
		const [ok, result] = await db_reassignCreatorHandle(req.user.id, req.body.handle, newCreatorId);
		if (!ok) {
			return res.status(HttpStatus.FAILED_STATUS).send(result || "Failed to reassign creator handle");
		}
		
		return res.sendStatus(HttpStatus.SUCCESS_STATUS);
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}



// Export
module.exports = {
	createCreatorAccount,
	manuallyAddCreator,
	manuallyInviteCreator,
	getCreators,
	getCreatorsCondensed,
	getCreatorDetails,
	getCreatorSubmissions,
	kickCreator,
	sendCreatorInviteEmail,
	getCreatorConnectedAccounts,
	updateCreatorDetails,
	reassignCreatorHandle
};