const knex = require('knex')(require('../../knexfile.js').development);

/**
 * Get renewal threshold config from MC_Board_Config
 */
async function db_getRenewalThreshold() {
    try {
        const row = await knex('MC_Board_Config')
            .where('config_key', 'renewal_threshold_pct')
            .select('config_value')
            .first();
        if (row) return JSON.parse(row.config_value);
        return { min: 80, max: 85 };
    } catch (err) {
        console.error('db_getRenewalThreshold error:', err);
        return { min: 80, max: 85 };
    }
}

/**
 * Get all active campaigns with their assignment/submission data for transition check
 */
async function db_getActiveCampaignsForTransition() {
    try {
        const campaigns = await knex('Campaigns')
            .where('status', 'active')
            .select('id', 'name', 'start_date', 'end_date');

        if (campaigns.length === 0) return [];

        const campaignIds = campaigns.map(c => c.id);

        // Get assignments
        const assignments = await knex('Creator_Assignments')
            .whereIn('campaign_id', campaignIds)
            .select('campaign_id', 'num_posts', 'frequency', 'start_date', 'end_date');

        // Get submission counts
        const submissionCounts = await knex('Campaign_Submissions')
            .whereIn('campaign_id', campaignIds)
            .groupBy('campaign_id')
            .select('campaign_id')
            .count('npc_id as submitted');

        const submissionMap = {};
        submissionCounts.forEach(s => { submissionMap[s.campaign_id] = parseInt(s.submitted); });

        const assignmentMap = {};
        assignments.forEach(a => {
            if (!assignmentMap[a.campaign_id]) assignmentMap[a.campaign_id] = [];
            assignmentMap[a.campaign_id].push(a);
        });

        return campaigns.map(c => {
            const campaignAssignments = assignmentMap[c.id] || [];
            const totalExpected = calculateTotalExpectedPosts(campaignAssignments);
            const submitted = submissionMap[c.id] || 0;
            const pct = totalExpected > 0 ? Math.round((submitted / totalExpected) * 100) : 0;

            return { id: c.id, name: c.name, submitted, totalExpected, pct };
        });
    } catch (err) {
        console.error('db_getActiveCampaignsForTransition error:', err);
        return [];
    }
}

/**
 * Transition a campaign to renewal status (automated)
 */
async function db_transitionToRenewal(campaignId) {
    try {
        await knex('Campaigns').where('id', campaignId).update({ status: 'renewal' });

        // Log activity as automated
        await knex('MC_Activity_Log').insert({
            campaign_id: campaignId,
            action: 'status_change',
            from_status: 'active',
            to_status: 'renewal',
            is_automated: 1,
        });

        // System comment
        await knex('MC_Comments').insert({
            campaign_id: campaignId,
            user_id: 1, // system user
            content: 'Campaign automatically moved to renewal (posting threshold reached)',
            is_system: 1,
        });

        // Create default checklist
        const config = await knex('MC_Board_Config')
            .where('config_key', 'default_checklist_items')
            .select('config_value')
            .first();

        const items = config ? JSON.parse(config.config_value) : [
            { key: 'budget_updated', label: 'Budget and agreement data updated' },
            { key: 'creators_confirmed', label: 'All creators confirmed for next cycle' },
        ];

        for (const item of items) {
            await knex('MC_Renewal_Checklist')
                .insert({
                    campaign_id: campaignId,
                    item_key: item.key,
                    label: item.label,
                })
                .onConflict(['campaign_id', 'item_key'])
                .ignore();
        }

        return true;
    } catch (err) {
        console.error('db_transitionToRenewal error:', err);
        return false;
    }
}

/**
 * Calculate total expected posts from assignments (same logic as mission_control/funs_db.js)
 */
function calculateTotalExpectedPosts(assignments) {
    return assignments.reduce((total, a) => {
        const start = new Date(a.start_date);
        const end = new Date(a.end_date);
        const daysTotal = Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
        let periods;
        switch (a.frequency) {
            case 'daily': periods = daysTotal; break;
            case 'weekly': periods = Math.floor(daysTotal / 7); break;
            case 'monthly': periods = Math.floor(daysTotal / 30); break;
            default: periods = 0;
        }
        return total + (a.num_posts * periods);
    }, 0);
}

module.exports = {
    db_getRenewalThreshold,
    db_getActiveCampaignsForTransition,
    db_transitionToRenewal,
};
