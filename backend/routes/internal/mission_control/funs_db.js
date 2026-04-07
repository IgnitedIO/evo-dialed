// Dependencies
const knex = require('knex')(require('../../../knexfile.js').development);
const { convertEncodedImage } = require('../../../utils/convertEncodedImage.js');

// -------------------
// Board Stages
// -------------------
const BOARD_STATUSES = ['onboarding', 'active', 'renewal', 'renewed', 'relaunch', 'paused'];

const VALID_TRANSITIONS = {
    'onboarding': ['active'],
    'active': ['renewal', 'paused'],
    'renewal': ['paused', 'renewed'],
    'renewed': ['relaunch'],
    'relaunch': ['active'],
    'paused': ['renewal', 'active'],
};

// -------------------
// READ Functions
// -------------------

/**
 * Get full board data: all campaigns in board statuses, enriched with metrics
 */
async function db_getBoardData() {
    try {
        // 1. Get all campaigns on the board
        const campaigns = await knex('Campaigns')
            .leftJoin('Users', 'Campaigns.assigned_cd', 'Users.id')
            .whereIn('Campaigns.status', BOARD_STATUSES)
            .select(
                'Campaigns.id',
                'Campaigns.name',
                'Campaigns.description',
                'Campaigns.status',
                'Campaigns.start_date',
                'Campaigns.end_date',
                'Campaigns.budget',
                'Campaigns.target_views',
                'Campaigns.supports_ig',
                'Campaigns.supports_tt',
                'Campaigns.img',
                'Users.name as cd_name',
                'Users.id as cd_id'
            );

        if (campaigns.length === 0) {
            return [true, { onboarding: [], active: [], renewal: [], renewed: [], relaunch: [], paused: [] }];
        }

        const campaignIds = campaigns.map(c => c.id);

        // 2. Get creator assignments (for expected posts calculation)
        const assignments = await knex('Creator_Assignments')
            .whereIn('campaign_id', campaignIds)
            .select('campaign_id', 'user_id', 'num_posts', 'frequency', 'start_date', 'end_date');

        // 3. Get submission counts per campaign
        const submissionCounts = await knex('Campaign_Submissions')
            .whereIn('campaign_id', campaignIds)
            .groupBy('campaign_id')
            .select('campaign_id')
            .count('npc_id as submitted');

        // The historical metrics table is large in production, and the full
        // "latest metric per submission" aggregate can block the whole board load.
        // Return the board immediately and keep metrics fields present with
        // zero defaults until a lighter aggregate path is added.
        const latestMetrics = [];

        // 5. Get creator counts per campaign
        const creatorCounts = await knex('Creator_Assignments')
            .whereIn('campaign_id', campaignIds)
            .groupBy('campaign_id')
            .select('campaign_id')
            .countDistinct('user_id as creator_count');

        // 6. Get comment counts per campaign (user comments only)
        const commentCounts = await knex('MC_Comments')
            .whereIn('campaign_id', campaignIds)
            .where('is_system', 0)
            .groupBy('campaign_id')
            .select('campaign_id')
            .count('id as comment_count');

        // 7. Get latest activity timestamp per campaign
        const latestActivity = await knex('MC_Comments')
            .whereIn('campaign_id', campaignIds)
            .groupBy('campaign_id')
            .select('campaign_id')
            .max('created_ts as latest_ts');

        // Build lookup maps
        const submissionMap = {};
        submissionCounts.forEach(s => { submissionMap[s.campaign_id] = parseInt(s.submitted); });

        const metricsMap = {};
        latestMetrics.forEach(m => {
            metricsMap[m.campaign_id] = {
                views: parseInt(m.total_views) || 0,
                likes: parseInt(m.total_likes) || 0,
                comments: parseInt(m.total_comments) || 0,
                shares: parseInt(m.total_shares) || 0,
            };
        });

        const creatorCountMap = {};
        creatorCounts.forEach(c => { creatorCountMap[c.campaign_id] = parseInt(c.creator_count); });

        const commentCountMap = {};
        commentCounts.forEach(c => { commentCountMap[c.campaign_id] = parseInt(c.comment_count); });

        const latestActivityMap = {};
        latestActivity.forEach(a => { latestActivityMap[a.campaign_id] = a.latest_ts; });

        // Group assignments by campaign
        const assignmentMap = {};
        assignments.forEach(a => {
            if (!assignmentMap[a.campaign_id]) assignmentMap[a.campaign_id] = [];
            assignmentMap[a.campaign_id].push(a);
        });

        // 6. Enrich campaigns with calculated data
        const enriched = campaigns.map(campaign => {
            const submitted = submissionMap[campaign.id] || 0;
            const metrics = metricsMap[campaign.id] || { views: 0, likes: 0, comments: 0, shares: 0 };
            const creators = creatorCountMap[campaign.id] || 0;
            const campaignAssignments = assignmentMap[campaign.id] || [];

            // Calculate total expected posts
            const totalExpected = calculateTotalExpectedPosts(campaignAssignments);

            // Calculate progress
            const progressPct = totalExpected > 0 ? Math.round((submitted / totalExpected) * 100) : 0;

            // Calculate posting velocity & estimated end date
            const { velocity, estimatedEndDate } = calculateVelocity(campaign, submitted, totalExpected);

            // Determine progress color
            const expectedByNow = calculateExpectedPostsByNow(campaignAssignments);
            let progressColor = 'green';
            if (expectedByNow > 0) {
                const ratio = submitted / expectedByNow;
                if (ratio >= 1.0) progressColor = 'green';
                else if (ratio >= 0.9) progressColor = 'yellow';
                else progressColor = 'red';
            }

            return {
                id: campaign.id,
                name: campaign.name,
                description: campaign.description,
                status: campaign.status,
                start_date: campaign.start_date,
                end_date: campaign.end_date,
                budget: campaign.budget,
                target_views: campaign.target_views,
                supports_ig: campaign.supports_ig,
                supports_tt: campaign.supports_tt,
                img: campaign.img ? convertEncodedImage(campaign.img) : null,
                cd_name: campaign.cd_name,
                cd_id: campaign.cd_id,
                creators: creators,
                posts: { submitted, expected: totalExpected },
                metrics,
                progress: { pct: progressPct, color: progressColor },
                velocity,
                estimated_end_date: estimatedEndDate,
                comment_count: commentCountMap[campaign.id] || 0,
                latest_activity_ts: latestActivityMap[campaign.id] || null,
            };
        });

        // 7. Group into stages
        const stages = { onboarding: [], active: [], renewal: [], renewed: [], relaunch: [], paused: [] };
        enriched.forEach(c => {
            if (stages[c.status]) stages[c.status].push(c);
        });

        return [true, stages];

    } catch (err) {
        console.error("db_getBoardData error:", err);
        return [false, null];
    }
}

/**
 * Calculate total expected posts from assignments
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

/**
 * Calculate expected posts by now (for progress color)
 */
function calculateExpectedPostsByNow(assignments) {
    const now = new Date();
    return assignments.reduce((total, a) => {
        const start = new Date(a.start_date);
        const daysElapsed = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
        let periods;
        switch (a.frequency) {
            case 'daily': periods = daysElapsed; break;
            case 'weekly': periods = Math.floor(daysElapsed / 7); break;
            case 'monthly': periods = Math.floor(daysElapsed / 30); break;
            default: periods = 0;
        }
        return total + (a.num_posts * periods);
    }, 0);
}

/**
 * Calculate posting velocity and estimated end date
 */
function calculateVelocity(campaign, submitted, totalExpected) {
    const start = new Date(campaign.start_date);
    const now = new Date();
    const daysElapsed = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    const velocity = submitted / daysElapsed; // posts per day

    let estimatedEndDate = campaign.end_date;
    if (velocity > 0 && submitted < totalExpected) {
        const remaining = totalExpected - submitted;
        const daysRemaining = Math.ceil(remaining / velocity);
        const estEnd = new Date(now);
        estEnd.setDate(estEnd.getDate() + daysRemaining);
        estimatedEndDate = estEnd.toISOString();
    }

    return { velocity: Math.round(velocity * 100) / 100, estimatedEndDate };
}


// -------------------
// STATUS Functions
// -------------------

/**
 * Update campaign board status with validation
 */
async function db_updateBoardStatus(campaignId, newStatus, userId) {
    try {
        const campaign = await knex('Campaigns').where('id', campaignId).select('status').first();
        if (!campaign) return [false, 'Campaign not found'];

        if (!BOARD_STATUSES.includes(newStatus)) {
            return [false, `Invalid status: '${newStatus}'`];
        }

        if (campaign.status === newStatus) {
            return [false, 'Campaign is already in this status'];
        }

        // Gated check: renewed -> relaunch requires checklist complete
        if (campaign.status === 'renewed' && newStatus === 'relaunch') {
            const incomplete = await knex('MC_Renewal_Checklist')
                .where('campaign_id', campaignId)
                .where('is_complete', 0)
                .count('id as cnt')
                .first();
            if (parseInt(incomplete.cnt) > 0) {
                return [false, 'Cannot relaunch: checklist items are incomplete'];
            }
        }

        await knex('Campaigns').where('id', campaignId).update({ status: newStatus });

        // Log activity
        await knex('MC_Activity_Log').insert({
            campaign_id: campaignId,
            user_id: userId,
            action: 'status_change',
            from_status: campaign.status,
            to_status: newStatus,
            is_automated: 0,
        });

        return [true, { from: campaign.status, to: newStatus }];

    } catch (err) {
        console.error("db_updateBoardStatus error:", err);
        return [false, 'Database error'];
    }
}

/**
 * Pause a campaign
 */
async function db_pauseCampaign(campaignId, userId) {
    try {
        const campaign = await knex('Campaigns').where('id', campaignId).select('status', 'name').first();
        if (!campaign) return [false, 'Campaign not found'];
        if (campaign.status === 'paused') return [false, 'Campaign is already paused'];

        const fromStatus = campaign.status;
        await knex('Campaigns').where('id', campaignId).update({ status: 'paused' });

        // Log activity
        await knex('MC_Activity_Log').insert({
            campaign_id: campaignId,
            user_id: userId,
            action: 'pause',
            from_status: fromStatus,
            to_status: 'paused',
        });

        // Add system comment
        await knex('MC_Comments').insert({
            campaign_id: campaignId,
            user_id: userId,
            content: `Campaign paused (was: ${fromStatus})`,
            is_system: 1,
        });

        // Get assigned creators for notifications
        const creators = await knex('Creator_Assignments')
            .join('Users', 'Creator_Assignments.user_id', 'Users.id')
            .where('Creator_Assignments.campaign_id', campaignId)
            .select('Users.email', 'Users.name');

        return [true, { campaign_name: campaign.name, from_status: fromStatus, creators }];

    } catch (err) {
        console.error("db_pauseCampaign error:", err);
        return [false, 'Database error'];
    }
}

/**
 * Launch/relaunch a campaign (relaunch -> active)
 */
async function db_launchCampaign(campaignId, userId) {
    try {
        const campaign = await knex('Campaigns').where('id', campaignId).select('status', 'name').first();
        if (!campaign) return [false, 'Campaign not found'];
        if (campaign.status !== 'relaunch') return [false, 'Campaign must be in relaunch status to launch'];

        await knex('Campaigns').where('id', campaignId).update({ status: 'active' });

        // Log activity
        await knex('MC_Activity_Log').insert({
            campaign_id: campaignId,
            user_id: userId,
            action: 'status_change',
            from_status: 'relaunch',
            to_status: 'active',
        });

        // Add system comment
        await knex('MC_Comments').insert({
            campaign_id: campaignId,
            user_id: userId,
            content: 'Campaign relaunched and moved to Active',
            is_system: 1,
        });

        return [true, { campaign_name: campaign.name }];

    } catch (err) {
        console.error("db_launchCampaign error:", err);
        return [false, 'Database error'];
    }
}


// -------------------
// COMMENTS Functions
// -------------------

/**
 * Get comments and activity log for a campaign (interleaved by timestamp)
 */
async function db_getComments(campaignId) {
    try {
        const comments = await knex('MC_Comments')
            .join('Users', 'MC_Comments.user_id', 'Users.id')
            .where('MC_Comments.campaign_id', campaignId)
            .select(
                'MC_Comments.id',
                'MC_Comments.content',
                'MC_Comments.mentions',
                'MC_Comments.is_system',
                'MC_Comments.created_ts',
                'MC_Comments.user_id',
                'Users.name as user_name',
                'Users.email as user_email',
            )
            .orderBy('MC_Comments.created_ts', 'asc');

        const activity = await knex('MC_Activity_Log')
            .leftJoin('Users', 'MC_Activity_Log.user_id', 'Users.id')
            .where('MC_Activity_Log.campaign_id', campaignId)
            .select(
                'MC_Activity_Log.id',
                'MC_Activity_Log.action',
                'MC_Activity_Log.from_status',
                'MC_Activity_Log.to_status',
                'MC_Activity_Log.details',
                'MC_Activity_Log.is_automated',
                'MC_Activity_Log.created_ts',
                'Users.name as user_name',
            )
            .orderBy('MC_Activity_Log.created_ts', 'asc');

        // Merge and sort by timestamp
        const merged = [
            ...comments.map(c => ({ ...c, type: 'comment' })),
            ...activity.map(a => ({ ...a, type: 'activity' })),
        ].sort((a, b) => new Date(a.created_ts) - new Date(b.created_ts));

        return [true, merged];

    } catch (err) {
        console.error("db_getComments error:", err);
        return [false, null];
    }
}

/**
 * Add a comment to a campaign
 */
async function db_addComment(campaignId, userId, content, mentions) {
    try {
        const [id] = await knex('MC_Comments').insert({
            campaign_id: campaignId,
            user_id: userId,
            content,
            mentions: mentions ? JSON.stringify(mentions) : null,
            is_system: 0,
        });

        return [true, { id }];

    } catch (err) {
        console.error("db_addComment error:", err);
        return [false, null];
    }
}

/**
 * Delete a comment (only own comments)
 */
async function db_deleteComment(commentId, userId) {
    try {
        const deleted = await knex('MC_Comments')
            .where('id', commentId)
            .where('user_id', userId)
            .where('is_system', 0)
            .delete();

        return [deleted > 0, deleted > 0 ? 'Deleted' : 'Not found or not authorized'];

    } catch (err) {
        console.error("db_deleteComment error:", err);
        return [false, 'Database error'];
    }
}

async function db_editComment(commentId, userId, content) {
    try {
        const updated = await knex('MC_Comments')
            .where('id', commentId)
            .where('user_id', userId)
            .where('is_system', 0)
            .update({ content, updated_ts: knex.fn.now() });

        return [updated > 0, updated > 0 ? 'Updated' : 'Not found or not authorized'];

    } catch (err) {
        console.error("db_editComment error:", err);
        return [false, 'Database error'];
    }
}


// -------------------
// CHECKLIST Functions
// -------------------

/**
 * Get renewal checklist for a campaign
 */
async function db_getChecklist(campaignId) {
    try {
        const items = await knex('MC_Renewal_Checklist')
            .leftJoin('Users', 'MC_Renewal_Checklist.completed_by', 'Users.id')
            .where('MC_Renewal_Checklist.campaign_id', campaignId)
            .select(
                'MC_Renewal_Checklist.id',
                'MC_Renewal_Checklist.item_key',
                'MC_Renewal_Checklist.label',
                'MC_Renewal_Checklist.is_complete',
                'MC_Renewal_Checklist.completed_ts',
                'Users.name as completed_by_name',
            )
            .orderBy('MC_Renewal_Checklist.created_ts', 'asc');

        const allComplete = items.length > 0 && items.every(i => i.is_complete === 1);

        return [true, { items, all_complete: allComplete }];

    } catch (err) {
        console.error("db_getChecklist error:", err);
        return [false, null];
    }
}

/**
 * Toggle a checklist item
 */
async function db_toggleChecklistItem(itemId, userId, isComplete) {
    try {
        await knex('MC_Renewal_Checklist')
            .where('id', itemId)
            .update({
                is_complete: isComplete ? 1 : 0,
                completed_by: isComplete ? userId : null,
                completed_ts: isComplete ? knex.fn.now() : null,
            });

        // Check if all items are now complete
        const item = await knex('MC_Renewal_Checklist').where('id', itemId).select('campaign_id').first();
        if (!item) return [false, 'Item not found'];

        const incomplete = await knex('MC_Renewal_Checklist')
            .where('campaign_id', item.campaign_id)
            .where('is_complete', 0)
            .count('id as cnt')
            .first();

        return [true, { all_complete: parseInt(incomplete.cnt) === 0 }];

    } catch (err) {
        console.error("db_toggleChecklistItem error:", err);
        return [false, 'Database error'];
    }
}

/**
 * Create default checklist items for a campaign entering renewal
 */
async function db_createDefaultChecklist(campaignId) {
    try {
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

        return [true];

    } catch (err) {
        console.error("db_createDefaultChecklist error:", err);
        return [false];
    }
}


// -------------------
// CONFIG Functions
// -------------------

/**
 * Get board config
 */
async function db_getConfig() {
    try {
        const rows = await knex('MC_Board_Config').select('config_key', 'config_value');
        const config = {};
        rows.forEach(r => { config[r.config_key] = JSON.parse(r.config_value); });
        return [true, config];
    } catch (err) {
        console.error("db_getConfig error:", err);
        return [false, null];
    }
}

/**
 * Update a config value
 */
async function db_updateConfig(configKey, configValue) {
    try {
        await knex('MC_Board_Config')
            .where('config_key', configKey)
            .update({ config_value: JSON.stringify(configValue) });
        return [true];
    } catch (err) {
        console.error("db_updateConfig error:", err);
        return [false];
    }
}

/**
 * Get all evo team members (for @mention suggestions)
 */
async function db_getTeamMembers() {
    try {
        const members = await knex('Users')
            .where('user_typ', 'evo')
            .select('id', 'name', 'email')
            .orderBy('name', 'asc');
        return [true, members];
    } catch (err) {
        console.error("db_getTeamMembers error:", err);
        return [false, null];
    }
}


// ----- Export -----
module.exports = {
    BOARD_STATUSES,
    VALID_TRANSITIONS,
    db_getBoardData,
    db_updateBoardStatus,
    db_pauseCampaign,
    db_launchCampaign,
    db_getComments,
    db_addComment,
    db_deleteComment,
    db_editComment,
    db_getChecklist,
    db_toggleChecklistItem,
    db_createDefaultChecklist,
    db_getConfig,
    db_updateConfig,
    db_getTeamMembers,
};
