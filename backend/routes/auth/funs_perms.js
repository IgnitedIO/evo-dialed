// ----------------------
// Middleware Functions
// ----------------------
function checkUserAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    return res.sendStatus(401);
}

function checkInternalUser(req, res, next) {
    if (req.user.user_typ === 'evo') return next();
    return res.sendStatus(401);
}

function checkCreatorUser(req, res, next) {
    if (req.user.user_typ === 'creator') return next();
    return res.sendStatus(401);
}

// ----- Export -----
module.exports = {
    checkUserAuth,
    checkInternalUser,
    checkCreatorUser
};