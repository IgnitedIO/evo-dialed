// Type Imports
const HttpStatus = require('../../../types/HttpStatus.js');

// Function Imports
const {
	db_getCampaigns,
	db_getCampaignsSimple,
	db_getCampaignDetails,
	db_getAvailableSubmissions,
	db_submitToCampaign,
} = require("./funs_db.js");


async function getCampaigns(req, res) {
	try {
		const [ok, resp] = await db_getCampaigns(req.user.id);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load campaigns");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function getCampaignsSimple(req, res) {
	try {
		const [ok, resp] = await db_getCampaignsSimple(req.user.id);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load campaigns");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function getCampaignDetails(req, res) {
	try {
		const [ok, resp] = await db_getCampaignDetails(req.user.id, req.params.campaign_id);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load campaign details");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function getAvailablePostsToSubmit(req, res) {
	try {
		const [ok, resp] = await db_getAvailableSubmissions(req.user.id, req.params.campaign_id);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load available submissions");
	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}
async function submitToCampaign(req, res) {
	try {
		// Validate input
		if (!req.params.submissions || !Array.isArray(req.params.submissions)) {
			return res.status(HttpStatus.FAILED_STATUS).send("Invalid submissions");
		}
		// Check each submission for connection ID & post ID
		for (let i = 0; i < req.params.submissions.length; i++) {
			if (!req.params.submissions[i].conn_id || !req.params.submissions[i].post_id) {
				return res.status(HttpStatus.FAILED_STATUS).send("Invalid submissions");
			}
		}
		// Submit to campaign
		const ok = await db_submitToCampaign(req.user.id, req.params.campaign_id, req.params.submissions);
		if (ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to submit to campaign");

	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}



// Export
module.exports = {
	getCampaigns,
	getCampaignsSimple,
	getCampaignDetails,
	getAvailablePostsToSubmit,
	submitToCampaign,
};