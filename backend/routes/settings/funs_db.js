// Dependencies
const knex = require('knex')(require('../../knexfile.js').development);

// Utility Imports
const { convertEncodedImage } = require('../../utils/convertEncodedImage.js');


// -------------------
// CREATE Functions
// -------------------


// -------------------
// READ Functions
// -------------------
async function db_getProfileDetails(user_id) {
	let err_code;
	const db_resp = await knex('Users').where('id',user_id).select(
		'email AS email',
		'name AS name',
		'phone AS phone',
		'pfp AS pfp'
	).limit(1).catch((err)=>{if (err) err_code = err.code});
	if (err_code || db_resp.length <= 0) return [false, null];

	// Convert the blob to base64 for output
	const profile = db_resp[0];
	profile.pfp = convertEncodedImage(profile.pfp);

	return [true, profile];
}


// -------------------
// UPDATE Functions
// -------------------
async function db_updateProfileEmail(user_id, new_email) {
	let err_code;
	await knex('Users').where('id',user_id).update({
		'email': new_email,
	}).catch((err)=>{if (err) err_code = err.code});
	if (err_code) return false;
	return true;
}

async function db_updateProfilePhone(user_id, new_phone) {
	let err_code;
	await knex('Users').where('id',user_id).update({
		'phone': new_phone,
	}).catch((err)=>{if (err) err_code = err.code});
	if (err_code) return false;
	return true;
}

async function db_updateProfileName(user_id, new_name) {
	let err_code;
	await knex('Users').where('id',user_id).update({
		'name': new_name,
	}).catch((err)=>{if (err) err_code = err.code});
	if (err_code) return false;
	return true;
}

async function db_updateProfilePfp(user_id, new_pfp_buffer) {
	let err_code;
	await knex('Users').where('id',user_id).update({
		'pfp': new_pfp_buffer,
	}).catch((err)=>{if (err) err_code = err.code});
	if (err_code) return false;
	return true;
}


// -------------------
// DELETE Functions
// -------------------



// ----- Export -----
module.exports = {
	db_getProfileDetails,
	db_updateProfileEmail,
	db_updateProfilePhone,
	db_updateProfileName,
	db_updateProfilePfp,
};