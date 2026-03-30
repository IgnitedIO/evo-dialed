// DB Imports
const knex = require('knex')(require('../../knexfile.js').development);

/**
 * Get list of rejected creatives that have NOT been resubmitted
 * Filters:
 * - Status is 'rejected'
 * - Creative has not been superseded (no newer version exists)
 * - Campaign is ACTIVE (not archived, complete, or draft)
 * - User is still assigned to the campaign
 */
async function db_getRejectedCreativesForNotification() {
    try {
        const results = await knex('CrvApprv_Creator_Creatives as ccc')
            .select(
                'ccc.id as creative_id',
                'ccc.user_id',
                'ccc.campaign_id',
                'ccc.creator_notes',
                'ccc.feedback_notes',
                'ccc.reviewed_ts',
                'ccc.created_ts',
                'u.email as user_email',
                'u.name as user_name',
                'c.name as campaign_name'
            )
            .join('Users as u', 'ccc.user_id', 'u.id')
            .join('Campaigns as c', 'ccc.campaign_id', 'c.id')
            .join('Creator_Assignments as ca', function() {
                this.on('ca.campaign_id', '=', 'ccc.campaign_id')
                    .andOn('ca.user_id', '=', 'ccc.user_id');
            })
            .where('ccc.status', 'rejected')
            .where('c.status', 'active') // Only active campaigns
            .whereNotExists(function() {
                // Check that no newer version (resubmission) exists
                this.select('*')
                    .from('CrvApprv_Creator_Creatives as newer')
                    .whereRaw('newer.supersedes_id = ccc.id');
            });

        return results;
    } catch (error) {
        console.error('Error fetching rejected creatives:', error);
        throw error;
    }
}

// Exports
module.exports = {
    db_getRejectedCreativesForNotification
};