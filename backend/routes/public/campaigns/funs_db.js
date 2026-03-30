// Dependencies
const knex = require('knex')(require('../../../knexfile.js').development);

/**
 * Get campaign ID and name by share link
 * @param {string} shareLink - The share link to look up
 * @returns {Promise<[boolean, Object|null]>} [success, {campaign_id, name}] or [false, null]
 */
async function db_getCampaignIdByShareLink(shareLink) {
    let err_code;
    const campaign = await knex('Campaigns')
        .select('id as campaign_id', 'name')
        .where('share_link', shareLink)
        .where('status', '!=', 'draft')
        .first()
        .catch((err) => { if (err) err_code = err.code });
    if (err_code || !campaign) return [false, null];
    return [true, campaign];
}

// Export
module.exports = {
    db_getCampaignIdByShareLink
};