// Dependencies
const knex = require('knex')(require('../../knexfile.js').development);

// Function Imports
const {
	scrapeCreators_getTiktokAnalytics
} = require('../../external_apis/scrapecreators.js');
const { checkAndSend10kViewsAlert } = require('./helpers.js');

/**
 * Get all active campaigns with their TikTok creators
 * @returns {Promise<Array>} Array of campaigns with their creator handles
 */
async function getCampaignsWithCreators() {
	try {
		// Get all active campaigns with their TikTok creator handles
		const campaigns = await knex('Campaigns as c')
			.join('Creator_Links as cl', 'c.id', 'cl.campaign_id')
			.join('Users as u', 'cl.user_id', 'u.id')
			.select(
				'c.id as campaign_id',
				'c.name as campaign_name',
				'cl.handle',
				'cl.clink_id',
				'cl.user_id',
				'u.name as creator_name'
			)
			.where('c.status', 'active')
			.where('cl.platform', 'tt');

		// Group creators by campaign
		const campaignMap = new Map();
		for (const row of campaigns) {
			if (!campaignMap.has(row.campaign_id)) {
				campaignMap.set(row.campaign_id, {
					campaign_id: row.campaign_id,
					campaign_name: row.campaign_name,
					creators: []
				});
			}
			campaignMap.get(row.campaign_id).creators.push({
				handle: row.handle,
				clink_id: row.clink_id,
				user_id: row.user_id,
				creator_name: row.creator_name
			});
		}

		return Array.from(campaignMap.values());
	} catch (error) {
		console.error('Error getting campaigns with TikTok creators:', error);
		throw error;
	}
}

/**
 * Get and update metrics for TikTok content, processing campaign by campaign
 * @returns {Promise<void>}
 */
async function tasks_tiktok_getVideoAnalytics() {
	try {
		const campaigns = await getCampaignsWithCreators();
		
		if (!campaigns || campaigns.length === 0) {
			console.log('No active campaigns with TikTok creators found');
			return;
		}

		console.log(`Processing ${campaigns.length} campaigns with TikTok creators`);

		// Process each campaign
		for (const campaign of campaigns) {
			console.log(`Processing campaign: ${campaign.campaign_name} (ID: ${campaign.campaign_id})`);
			console.log(`Campaign has ${campaign.creators.length} TikTok creators`);

			// Get handles for this campaign
			const handles = campaign.creators.map(c => c.handle);
			
			if (handles.length === 0) {
				console.log(`No TikTok handles found for campaign ${campaign.campaign_name}`);
				continue;
			}

			// Get analytics for the handles in this campaign
			const analyticsResults = await scrapeCreators_getTiktokAnalytics(handles);
			console.log(`Retrieved ${analyticsResults.length} creator results for campaign ${campaign.campaign_name}`);

			// Process each creator's results for this campaign
			for (const result of analyticsResults) {
				const { handle, videos } = result;
				console.log(`Processing ${videos.length} videos for handle: ${handle} in campaign: ${campaign.campaign_name}`);

				// Find the creator info for this campaign
				const creatorInfo = campaign.creators.find(c => c.handle === handle);
				if (!creatorInfo) {
					console.warn(`No creator info found for handle: ${handle} in campaign: ${campaign.campaign_name}`);
					continue;
				}

				// Process each video for this creator in this campaign
				for (const video of videos) {
					console.log(`Adding/updating video ${video.id} to database for campaign: ${campaign.campaign_name}`);
					
					// Try to insert new submission (will be ignored if already exists)
					await knex('Campaign_Submissions').insert({
						campaign_id: campaign.campaign_id,
						submit_typ: 'scrape',
						clink_id: creatorInfo.clink_id,
						npc_id: video.id,
						post_ts: video.createdAt,
						submit_ts: knex.fn.now(),
						caption: video.caption,
						post_url: video.link,
						thumbnail: video.thumbnail,
					}).onConflict().ignore();

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
						creator_name: creatorInfo.creator_name,
						creator_handle: handle,
						platform: 'tt',
						views: video.stats.views,
						campaign_name: campaign.campaign_name,
						post_url: video.link
					});
				}
			}

			console.log(`Completed processing campaign: ${campaign.campaign_name}`);
		}

		console.log('Completed processing all campaigns with TikTok creators');
	} catch (error) {
		console.error('Error updating TikTok metrics:', error);
		throw error;
	}
}

// Export
module.exports = {
	tasks_tiktok_getVideoAnalytics
};