// Dependencies
const crypto = require('crypto');
const knex = require('knex')(require('../../../knexfile.js').development)

// Util Imports
const {
	encodeImage,
    convertEncodedImage
} = require("../../../utils/convertEncodedImage.js");

const { db_createPassword } = require('../../auth/funs_db.js');

// Constants
const HASH_ITERATIONS = parseInt(process.env.HASH_ITERATIONS);

// -------------------
// RETRIEVE Functions
// -------------------
async function db_getCreativeDirectors() {
	let err_code;

	// Get all users where is_cd = 1
	const creative_directors = await knex('Users')
		.where('is_cd', 1)
		.select('id', 'name', 'pfp')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Format the results
	const formatted = creative_directors.map(cd => ({
		id: cd.id,
		name: cd.name,
		pfp: cd.pfp ? convertEncodedImage(cd.pfp) : null
	}));

	return [true, formatted];
}

// -------------------
// CREATE Functions
// -------------------
async function db_createUser(email, pass, name, pfp) {
	let err_code;
	
    // Add to user table
	const db_resp = await knex('Users').insert({
		'email': email,
		'name': name,
		'pfp': encodeImage(pfp),
        'user_typ': 'evo'
	}).catch((err)=>{if (err) err_code = err});
	if (err_code) return false;

	// Create password
    const create_pass = await new Promise((resolve, _) => {
        db_createPassword(db_resp[0], pass, function(pw_ok) {
            if (!pw_ok.ok) return resolve(false);
            return resolve(true);
        });
    });
    if (!create_pass) return false;
    return true;
}


module.exports = {
    db_createUser,
    db_getCreativeDirectors
}
