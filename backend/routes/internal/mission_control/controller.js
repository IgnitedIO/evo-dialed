// Dependencies
const HttpStatus = require('../../../types/HttpStatus.js');

// Function Imports
const {
    db_getBoardData,
    db_updateBoardStatus,
    db_pauseCampaign,
    db_launchCampaign,
    db_getComments,
    db_addComment,
    db_deleteComment,
    db_getChecklist,
    db_toggleChecklistItem,
    db_getConfig,
    db_updateConfig,
    db_getTeamMembers,
} = require('./funs_db.js');

// -------------------
// Board Data
// -------------------

async function getBoardData(req, res) {
    try {
        const [ok, data] = await db_getBoardData();
        if (!ok) return res.sendStatus(HttpStatus.FAILED_STATUS);
        return res.status(HttpStatus.SUCCESS_STATUS).json(data);
    } catch (err) {
        console.error("getBoardData error:", err);
        return res.sendStatus(HttpStatus.MISC_ERROR_STATUS);
    }
}

// -------------------
// Status Transitions
// -------------------

async function updateCampaignBoardStatus(req, res) {
    try {
        const { campaign_id } = req.params;
        const { status } = req.body;
        if (!status) return res.status(HttpStatus.BAD_REQUEST_STATUS).send('Status is required');

        const [ok, result] = await db_updateBoardStatus(parseInt(campaign_id), status, req.user.id);
        if (!ok) return res.status(HttpStatus.FAILED_STATUS).send(result);
        return res.status(HttpStatus.SUCCESS_STATUS).json(result);
    } catch (err) {
        console.error("updateCampaignBoardStatus error:", err);
        return res.sendStatus(HttpStatus.MISC_ERROR_STATUS);
    }
}

async function pauseCampaign(req, res) {
    try {
        const { campaign_id } = req.params;
        const [ok, result] = await db_pauseCampaign(parseInt(campaign_id), req.user.id);
        if (!ok) return res.status(HttpStatus.FAILED_STATUS).send(result);
        return res.status(HttpStatus.SUCCESS_STATUS).json(result);
    } catch (err) {
        console.error("pauseCampaign error:", err);
        return res.sendStatus(HttpStatus.MISC_ERROR_STATUS);
    }
}

async function launchCampaign(req, res) {
    try {
        const { campaign_id } = req.params;
        const [ok, result] = await db_launchCampaign(parseInt(campaign_id), req.user.id);
        if (!ok) return res.status(HttpStatus.FAILED_STATUS).send(result);
        return res.status(HttpStatus.SUCCESS_STATUS).json(result);
    } catch (err) {
        console.error("launchCampaign error:", err);
        return res.sendStatus(HttpStatus.MISC_ERROR_STATUS);
    }
}

// -------------------
// Comments
// -------------------

async function getComments(req, res) {
    try {
        const { campaign_id } = req.params;
        const [ok, data] = await db_getComments(parseInt(campaign_id));
        if (!ok) return res.sendStatus(HttpStatus.FAILED_STATUS);
        return res.status(HttpStatus.SUCCESS_STATUS).json(data);
    } catch (err) {
        console.error("getComments error:", err);
        return res.sendStatus(HttpStatus.MISC_ERROR_STATUS);
    }
}

async function addComment(req, res) {
    try {
        const { campaign_id } = req.params;
        const { content, mentions } = req.body;
        if (!content) return res.status(HttpStatus.BAD_REQUEST_STATUS).send('Content is required');

        const [ok, data] = await db_addComment(parseInt(campaign_id), req.user.id, content, mentions);
        if (!ok) return res.sendStatus(HttpStatus.FAILED_STATUS);
        return res.status(HttpStatus.SUCCESS_STATUS).json(data);
    } catch (err) {
        console.error("addComment error:", err);
        return res.sendStatus(HttpStatus.MISC_ERROR_STATUS);
    }
}

async function deleteComment(req, res) {
    try {
        const { comment_id } = req.params;
        const [ok, msg] = await db_deleteComment(parseInt(comment_id), req.user.id);
        if (!ok) return res.status(HttpStatus.FAILED_STATUS).send(msg);
        return res.sendStatus(HttpStatus.SUCCESS_STATUS);
    } catch (err) {
        console.error("deleteComment error:", err);
        return res.sendStatus(HttpStatus.MISC_ERROR_STATUS);
    }
}

// -------------------
// Checklist
// -------------------

async function getChecklist(req, res) {
    try {
        const { campaign_id } = req.params;
        const [ok, data] = await db_getChecklist(parseInt(campaign_id));
        if (!ok) return res.sendStatus(HttpStatus.FAILED_STATUS);
        return res.status(HttpStatus.SUCCESS_STATUS).json(data);
    } catch (err) {
        console.error("getChecklist error:", err);
        return res.sendStatus(HttpStatus.MISC_ERROR_STATUS);
    }
}

async function updateChecklistItem(req, res) {
    try {
        const { item_id } = req.params;
        const { is_complete } = req.body;
        if (is_complete === undefined) return res.status(HttpStatus.BAD_REQUEST_STATUS).send('is_complete is required');

        const [ok, result] = await db_toggleChecklistItem(parseInt(item_id), req.user.id, is_complete);
        if (!ok) return res.status(HttpStatus.FAILED_STATUS).send(result);
        return res.status(HttpStatus.SUCCESS_STATUS).json(result);
    } catch (err) {
        console.error("updateChecklistItem error:", err);
        return res.sendStatus(HttpStatus.MISC_ERROR_STATUS);
    }
}

// -------------------
// Config
// -------------------

async function getBoardConfig(req, res) {
    try {
        const [ok, data] = await db_getConfig();
        if (!ok) return res.sendStatus(HttpStatus.FAILED_STATUS);
        return res.status(HttpStatus.SUCCESS_STATUS).json(data);
    } catch (err) {
        console.error("getBoardConfig error:", err);
        return res.sendStatus(HttpStatus.MISC_ERROR_STATUS);
    }
}

async function updateBoardConfig(req, res) {
    try {
        const { config_key } = req.params;
        const { value } = req.body;
        if (!value) return res.status(HttpStatus.BAD_REQUEST_STATUS).send('Value is required');

        const [ok] = await db_updateConfig(config_key, value);
        if (!ok) return res.sendStatus(HttpStatus.FAILED_STATUS);
        return res.sendStatus(HttpStatus.SUCCESS_STATUS);
    } catch (err) {
        console.error("updateBoardConfig error:", err);
        return res.sendStatus(HttpStatus.MISC_ERROR_STATUS);
    }
}

// -------------------
// Team Members
// -------------------

async function getTeamMembers(req, res) {
    try {
        const [ok, data] = await db_getTeamMembers();
        if (!ok) return res.sendStatus(HttpStatus.FAILED_STATUS);
        return res.status(HttpStatus.SUCCESS_STATUS).json(data);
    } catch (err) {
        console.error("getTeamMembers error:", err);
        return res.sendStatus(HttpStatus.MISC_ERROR_STATUS);
    }
}

// ----- Export -----
module.exports = {
    getBoardData,
    updateCampaignBoardStatus,
    pauseCampaign,
    launchCampaign,
    getComments,
    addComment,
    deleteComment,
    getChecklist,
    updateChecklistItem,
    getBoardConfig,
    updateBoardConfig,
    getTeamMembers,
};
