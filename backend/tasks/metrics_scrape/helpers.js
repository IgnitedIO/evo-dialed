// Dependencies
const knex = require('knex')(require('../../knexfile.js').development);
const {
    scrapeCreators_getInstagramAnalytics,
    scrapeCreators_getTiktokAnalytics
} = require('../../external_apis/scrapecreators.js');
const { send10kViewsAlert } = require('../metrics_slack/slack.js');

/**
 * Check if post has 10k+ views and send Slack alert if needed
 * @param {string} npc_id - The native platform content ID
 * @param {number} views - Current view count
 * @param {Object} postData - Post data for the alert
 * @returns {Promise<void>}
 */
async function checkAndSend10kViewsAlert(npc_id, views, postData) {
    try {
        // Check if views >= 10k and alert hasn't been sent yet
        if (views >= 10000) {
            const submission = await knex('Campaign_Submissions')
                .where('npc_id', npc_id)
                .where('slack_alert_sent', 0)
                .first();

            if (submission) {
                console.log(`🎉 Post ${npc_id} reached 10k+ views (${views.toLocaleString()}), sending Slack alert...`);
                
                // Send Slack alert
                const alertResult = await send10kViewsAlert(postData);
                
                if (alertResult.success) {
                    // Mark alert as sent
                    await knex('Campaign_Submissions')
                        .where('npc_id', npc_id)
                        .update({ slack_alert_sent: 1 });
                    
                    console.log(`✅ Slack alert sent and marked for post ${npc_id}`);
                } else {
                    console.error(`❌ Failed to send Slack alert for post ${npc_id}:`, alertResult.error);
                }
            }
        }
    } catch (error) {
        console.error(`Error checking/sending 10k views alert for post ${npc_id}:`, error);
        // Don't throw - we don't want to break the scraping process
    }
}

/**
 * Scrape metrics for a single Instagram creator
 * @param {string} handle - The Instagram handle to scrape
 * @returns {Promise<void>}
 */
async function scrapeInstagramCreator(handle) {
    try {
        console.log(`Getting Instagram analytics for handle: ${handle}`);
        const analyticsResults = await scrapeCreators_getInstagramAnalytics([handle]);
        
        if (analyticsResults.length === 0) {
            console.warn(`No results found for Instagram handle: ${handle}`);
            return;
        }

        const { reels } = analyticsResults[0];
        console.log(`Processing ${reels.length} reels for handle: ${handle}`);

        // Get the creator's link info including campaign_id and check campaign status
        const creatorLink = await knex('Creator_Links as cl')
            .join('Campaigns as c', 'cl.campaign_id', 'c.id')
            .join('Users as u', 'cl.user_id', 'u.id')
            .select('cl.clink_id', 'cl.user_id', 'cl.campaign_id', 'c.status', 'c.name as campaign_name', 'u.name as creator_name')
            .where({
                'cl.handle': handle,
                'cl.platform': 'ig'
            })
            .first();

        if (!creatorLink) {
            console.warn(`No creator link found for handle: ${handle}`);
            return;
        }

        // Process each reel
        for (const reel of reels) {
            console.log(`Adding/updating reel ${reel.id} to database`);
            // Try to insert new submission (will be ignored if already exists)
            await knex('Campaign_Submissions').insert({
                campaign_id: creatorLink.campaign_id,
                submit_typ: 'scrape',
                clink_id: creatorLink.clink_id,
                npc_id: reel.id,
                post_ts: reel.createdAt,
                submit_ts: knex.fn.now(),
                caption: reel.caption,
                post_url: reel.link,
                thumbnail: reel.thumbnail,
            }).onConflict('npc_id').ignore();

            // Update metrics (will insert if new, update if exists)
            await knex('Campaign_Submissions_Metrics').insert({
                npc_id: reel.id,
                recorded_ts: knex.fn.now(),
                views: reel.stats.views,
                likes: reel.stats.likes,
                comments: reel.stats.comments,
                shares: reel.stats.shares
            }).onConflict('npc_id').merge();

            // Check for 10k+ views and send Slack alert if needed
            await checkAndSend10kViewsAlert(reel.id, reel.stats.views, {
                npc_id: reel.id,
                caption: reel.caption,
                creator_name: creatorLink.creator_name,
                creator_handle: handle,
                platform: 'ig',
                views: reel.stats.views,
                campaign_name: creatorLink.campaign_name,
                post_url: reel.link
            });
        }

    } catch (error) {
        console.error(`Error updating Instagram metrics for ${handle}:`, error);
        // Don't throw - we want this to be fire-and-forget
    }
}

/**
 * Scrape metrics for a single TikTok creator
 * @param {string} handle - The TikTok handle to scrape
 * @returns {Promise<void>}
 */
async function scrapeTiktokCreator(handle) {
    try {
        console.log(`Getting TikTok analytics for handle: ${handle}`);
        const analyticsResults = await scrapeCreators_getTiktokAnalytics([handle]);
        
        if (analyticsResults.length === 0) {
            console.warn(`No results found for TikTok handle: ${handle}`);
            return;
        }

        const { videos } = analyticsResults[0];
        console.log(`Processing ${videos.length} videos for handle: ${handle}`);

        // Get the creator's link info including campaign_id and check campaign status
        const creatorLink = await knex('Creator_Links as cl')
            .join('Campaigns as c', 'cl.campaign_id', 'c.id')
            .join('Users as u', 'cl.user_id', 'u.id')
            .select('cl.clink_id', 'cl.user_id', 'cl.campaign_id', 'c.status', 'c.name as campaign_name', 'u.name as creator_name')
            .where({
                'cl.handle': handle,
                'cl.platform': 'tt'
            })
            .first();

        if (!creatorLink) {
            console.warn(`No creator link found for handle: ${handle}`);
            return;
        }

        // Process each video
        for (const video of videos) {
            console.log(`Adding/updating video ${video.id} to database`);
            // Try to insert new submission (will be ignored if already exists)
            await knex('Campaign_Submissions').insert({
                campaign_id: creatorLink.campaign_id,
                submit_typ: 'scrape',
                clink_id: creatorLink.clink_id,
                npc_id: video.id,
                post_ts: video.createdAt,
                submit_ts: knex.fn.now(),
                caption: video.caption,
                post_url: video.link,
                thumbnail: video.thumbnail,
            }).onConflict('npc_id').ignore();

            // Update metrics (will insert if new, update if exists)
            await knex('Campaign_Submissions_Metrics').insert({
                npc_id: video.id,
                recorded_ts: knex.fn.now(),
                views: video.stats.views,
                likes: video.stats.likes,
                comments: video.stats.comments,
                shares: video.stats.shares
            }).onConflict('npc_id').merge();

            // Check for 10k+ views and send Slack alert if needed
            await checkAndSend10kViewsAlert(video.id, video.stats.views, {
                npc_id: video.id,
                caption: video.caption,
                creator_name: creatorLink.creator_name,
                creator_handle: handle,
                platform: 'tt',
                views: video.stats.views,
                campaign_name: creatorLink.campaign_name,
                post_url: video.link
            });
        }
    } catch (error) {
        console.error(`Error updating TikTok metrics for ${handle}:`, error);
        // Don't throw - we want this to be fire-and-forget
    }
}

// Export
module.exports = {
    scrapeInstagramCreator,
    scrapeTiktokCreator,
    checkAndSend10kViewsAlert
}; 