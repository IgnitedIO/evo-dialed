// Dependencies
const HttpStatus = require('../../../types/HttpStatus.js');

// Function Imports
const { db_createUser, db_getCreativeDirectors } = require("./funs_db.js");


/**
 * Register new user
 */
async function inviteAdmin(req, res) {
    try {
        const ok = await db_createUser(req.body.em, req.body.pw, req.body.dn, req.body.pfp);
        if (ok) return res.sendStatus(HttpStatus.SUCCESS_STATUS);
        return res.status(HttpStatus.FAILED_STATUS).send("Failed to register");

    } catch (err) {
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

/**
 * Get all creative directors
 */
async function getCreativeDirectors(req, res) {
    try {
        const [ok, creative_directors] = await db_getCreativeDirectors();
        if (ok) return res.status(HttpStatus.SUCCESS_STATUS).json({ data: creative_directors });
        return res.status(HttpStatus.FAILED_STATUS).send("Failed to retrieve creative directors");

    } catch (err) {
        console.log("MTE = ", err);
        return res.status(HttpStatus.MISC_ERROR_STATUS).send(HttpStatus.MISC_ERROR_MSG);
    }
}

// Export controllers
module.exports = {
    inviteAdmin,
    getCreativeDirectors
}
