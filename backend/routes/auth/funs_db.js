// Dependencies
const crypto = require('crypto');
const knex = require('knex')(require('../../knexfile.js').development);

// Util Imports
const { convertEncodedImage } = require('../../utils/convertEncodedImage.js');

// Constants
const HASH_ITERATIONS = parseInt(process.env.HASH_ITERATIONS);

/**
 * Generate a random 6-digit code
 */
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


// -------------------
// CREATE Functions
// -------------------
async function db_createUser(email, pass) {
	let err_code;
	
    // Add to user table
	const db_resp = await knex('Users').insert({
		'email': email,
        'name': email,
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


// -------------------
// READ Functions
// -------------------
async function db_getUserDetails(user_id) {
	let err_code;

    // Account details
    const db_resp = await knex('Users').where({
        'id': user_id,
    }).select(
        'email AS email',
        'name AS dn',
        'pfp AS pfp',
        'user_typ AS ut'
    ).limit(1).catch((err)=>{if (err) err_code = err.code});
    if (err_code || db_resp.length <= 0) return [false, null];

    // Format + return data
    return [true, {
        ...db_resp[0],
        'pfp': (db_resp[0].pfp) ? convertEncodedImage(db_resp[0].pfp) : null,
    }];
}


// -------------------
// UPDATE Functions
// -------------------
async function db_changePassword(user_id, pw, cb) {
    const gen_salt = crypto.randomBytes(128).toString('base64');
    try {
        crypto.pbkdf2(pw, gen_salt, HASH_ITERATIONS, 32, 'sha256', async function(crypto_err, hashedPassword) {
            if (crypto_err) return cb({ok: false, msg: 'Misc Crypto Error'});
            var err_code = null;
            await knex('Users_Auth').where('user_id',user_id).update({"hash": hashedPassword.toString('base64'), "salt": gen_salt}).catch((err)=>{if (err) err_code = err.code});
            if (err_code) return cb({ok: false, msg: 'Error updating password.'});
            else return cb({ok: true});
        });
    } catch (misc_err) {
        return cb({ok: false, msg: 'An unknown error occurred.'});
    }
}
async function db_createPassword(target_user_id, pass, cb) {
    const gen_salt = crypto.randomBytes(128).toString('base64');
    try {
        crypto.pbkdf2(pass, gen_salt, HASH_ITERATIONS, 32, 'sha256', async function(crypto_err, hashedPassword) {
            if (crypto_err) return cb({'ok': false});
            var db_err = null;
            await knex('Users_Auth').insert({'user_id': target_user_id, 'hash': hashedPassword.toString('base64'), 'salt': gen_salt}).catch((err)=>{if (err) db_err = err.code});
            if (db_err) return cb({'ok': false});
            else return cb({'ok': true});
        });
    } catch (misc_err) {
        return cb({'ok': false});
    }
}


// -------------------
// DELETE Functions
// -------------------


/**
 * Create a password reset code for a user
 */
async function db_createPassResetCode(email) {
    const maxRetries = 10;
    let retries = 0;
    let success = false;

    while (retries < maxRetries && !success) {
        try {
            // Get user ID from email
            const [user] = await knex('Users').where({ email }).select('id');
            if (!user) return [false, "User not found"];

            // Generate code using the existing function
            const code = generateCode();

            // Store code
            await knex('PassReset_Codes').insert({
                user_id: user.id,
                code
            });

            success = true;
            return [true, { code, user_id: user.id }];
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                retries++;
                if (retries === maxRetries) {
                    return [false, "Failed to generate a unique code after 10 attempts"];
                }
            } else {
                console.error("Error creating password reset code:", err);
                return [false, "Failed to create password reset code"];
            }
        }
    }
}

/**
 * Create a magic link code for a user
 */
async function db_createMagicLinkCode(email) {
    try {
        console.log("Creating magic link code for email:", email);
        
        // Get user ID from email
        const [user] = await knex('Users').where({ email }).select('id');
        console.log("Found user:", user);
        
        if (!user) return [false, "User not found"];

        // Try up to 10 times to generate and insert a unique code
        for (let attempt = 0; attempt < 10; attempt++) {
            try {
                // Generate code
                const code = generateCode();
                console.log("Generated code:", code);

                // Store code
                const insertResult = await knex('MagicLink_Codes').insert({
                    user_id: user.id,
                    code
                });
                console.log("Insert result:", insertResult);

                return [true, { code, user_id: user.id }];
            } catch (insertErr) {
                // If it's not a duplicate entry error, rethrow
                if (insertErr.code !== 'ER_DUP_ENTRY') {
                    throw insertErr;
                }
                // Otherwise, continue to next attempt
                console.log("Duplicate code generated, retrying...");
            }
        }
        
        // If we get here, we failed all attempts
        return [false, "Failed to generate unique code after multiple attempts"];
    } catch (err) {
        console.error("Error creating magic link code:", err);
        return [false, "Failed to create magic link code"];
    }
}

/**
 * Validate a magic link code
 */
async function db_validateMagicLinkCode(email, code) {
    try {
        // Get user ID from email
        const [user] = await knex('Users').where({ email }).select('id');
        if (!user) return [false, "User not found"];

        // Find valid code
        const [magicCode] = await knex('MagicLink_Codes')
            .where({
                user_id: user.id,
                code
            })
            .where('created_ts', '>', knex.raw('DATE_SUB(NOW(), INTERVAL 10 MINUTE)'))
            .select('id');

        if (!magicCode) return [false, "Invalid or expired code"];

        // Delete the code since it's been used
        await knex('MagicLink_Codes')
            .where({ id: magicCode.id })
            .del();

        return [true, { user_id: user.id }];
    } catch (err) {
        console.error("Error validating magic link code:", err);
        return [false, "Failed to validate magic link code"];
    }
}

/**
 * Validate a password reset code and update password
 */
async function db_validatePassResetCode(email, code, newPassword) {
    try {
        // Get user ID from email
        const [user] = await knex('Users').where({ email }).select('id');
        if (!user) return [false, "User not found"];

        // Find valid code
        const [resetCode] = await knex('PassReset_Codes')
            .where({
                user_id: user.id,
                code
            })
            .where('created_ts', '>', knex.raw('DATE_SUB(NOW(), INTERVAL 10 MINUTE)'))
            .select('id');

        if (!resetCode) return [false, "Invalid or expired code"];

        // Delete the code entry
        await knex('PassReset_Codes')
            .where({ id: resetCode.id })
            .del();

        // Update password
        await new Promise((resolve, reject) => {
            db_changePassword(user.id, newPassword, (resp) => {
                if (resp.ok) resolve();
                else reject(new Error(resp.msg || "Password change failed"));
            });
        });

        return [true, { user_id: user.id }];
    } catch (err) {
        console.error("Error validating password reset code:", err);
        return [false, "Failed to validate password reset code"];
    }
}

// ----- Export -----
module.exports = {
	db_getUserDetails,
	db_createUser,
	db_changePassword,
	db_createPassword,
	db_createMagicLinkCode,
	db_validateMagicLinkCode,
	db_createPassResetCode,
	db_validatePassResetCode
};