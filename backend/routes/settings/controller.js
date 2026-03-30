// Type Imports
const HttpStatus = require('../../types/HttpStatus.js');

// Function Imports
const {
	db_getProfileDetails,
	db_updateProfileEmail,
	db_updateProfilePhone,
	db_updateProfileName,
	db_updateProfilePfp,
} = require("./funs_db.js");

// Utility Imports
const { encodeImage } = require('../../utils/convertEncodedImage.js');


/**
 * Get profile details
 */
async function getProfileDetails(req, res) {
	try {
		const [ok, resp] = await db_getProfileDetails(req.user.id);
		if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({'data': resp});
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to load profile details");

	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}

/**
 * Update profile details
 */
async function updateProfileDetails(req, res) {
	try {
		let ok;
		switch (req.params.key) {
			case "email":
				ok = await db_updateProfileEmail(req.user.id, req.body.email);
				break;
			case "phone":
				ok = await db_updateProfilePhone(req.user.id, req.body.phone);
				break;
			case "name":
				ok = await db_updateProfileName(req.user.id, req.body.name);
				break;
			case "pfp":
				// Encode the base64 image to a buffer before saving
				const encodedImage = encodeImage(req.body.pfp);
				if (encodedImage === null) {
					return res.status(HttpStatus.FAILED_STATUS).send("Image is too large or invalid");
				}
				ok = await db_updateProfilePfp(req.user.id, encodedImage);
				break;
			default:
				return res.sendStatus(HttpStatus.NOT_FOUND_STATUS);
		}
		if (ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);
		return res.status(HttpStatus.FAILED_STATUS).send("Failed to update profile");

	} catch (err) {
		console.log("MTE = ", err);
		return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
	}
}


// Export
module.exports = {
	getProfileDetails,
	updateProfileDetails,
};