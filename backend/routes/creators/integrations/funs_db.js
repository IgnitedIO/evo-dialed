// Dependencies
const knex = require('knex')(require('../../../knexfile.js').development);


// -------------------
// CREATE Functions
// -------------------
async function db_connectPlatform(platform) {
	// TODO: Handle platform callback
	return [false, null];
}
async function db_saveLinkedState(user_id, platform, state, code_verifier) {
	let err_code;

	console.log("SAVING LINKED STATE = ", {
		user_id,
		platform,
		state,
		code_verifier
	})

	// Save linked state
	// await knex('User_Linked_States').insert({
	// 	'user_id': user_id,
	// 	'platform': platform,
	// 	'state': state,
	// 	'expiry': (new Date(Date.now() + 5 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' '),
	// }).onConflict().merge().catch((err)=>{if (err) err_code = err.code});
	if (err_code) return false;
	return true;
}


// -------------------
// READ Functions
// -------------------
async function db_getIntegrations(user_id) {
	let err_code;

	// 1. Get keys
	const db_resp = await knex('Creator_Socials').where('user_id',user_id).select(
		'conn_id AS conn_id',
		'platform AS platform',
		'key_a',
		'key_b',
		'key_c'
	).catch((err)=>{if (err) err_code = err.code});
	if (err_code) return [false, null];

	// 2. Get details for each account
	let enriched_resp = [];
	for (let i = 0; i < db_resp.length; i++) {
		let account_details;
		switch (db_resp[i].platform) {
			case "ig":
				// TODO: Get Instagram details
				break;
			case "tt":
				// TODO: Get TikTok details
				break;
			default:
				continue;
		}
		enriched_resp.push({
			'id': db_resp[i].conn_id,
			...account_details,
		});
	}

	return [true, enriched_resp];
}

// -------------------
// UPDATE Functions
// -------------------


// -------------------
// DELETE Functions
// -------------------
async function db_disconnectIntegration(user_id, conn_id) {
	let err_code;

	// 1. Check if integration exists for given user_id
	const db_resp = await knex('Creator_Socials').where({
		'conn_id': conn_id,
		'user_id': user_id,
	}).select('conn_id').limit(1).catch((err)=>{if (err) err_code = err.code});
	if (err_code || db_resp.length <= 0) return [false, null];

	// 2. Delete integration
	await knex('Creator_Socials').where({
		'conn_id': conn_id,
		'user_id': user_id,
	}).del().catch((err)=>{if (err) err_code = err.code});
	if (err_code) return false;
	return true;
}



// ----- Export -----
module.exports = {
	db_getIntegrations,
	db_connectPlatform,
	db_disconnectIntegration,
	db_saveLinkedState,
};