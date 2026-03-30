// Dependencies
const knex = require('knex')(require('../../../knexfile.js').development);


// -------------------
// CREATE Functions
// -------------------


// -------------------
// READ Functions
// -------------------
async function db_getCreatorDashboard(user_id) {
	let err_code;

	// 1. Get assigned campaigns with their details
	const campaigns_resp = await knex('Campaigns as c')
		.join('Creator_Assignments as ca', 'c.id', 'ca.campaign_id')
		.where('ca.user_id', user_id)
		.select('c.id', 'c.name', 'c.img', 'c.description', 'ca.num_posts', 'ca.frequency', 'ca.start_date', 'ca.end_date')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// 2. Get performance metrics for all submissions
	const metrics_resp = await knex('Campaign_Submissions as cs')
		.join('Campaign_Submissions_Metrics as csm', 'cs.npc_id', 'csm.npc_id')
		.join('Creator_Socials as soc', 'cs.conn_id', 'soc.conn_id')
		.where('soc.user_id', user_id)
		.select(
			'cs.campaign_id',
			'csm.views',
			'csm.likes',
			'csm.comments',
			'csm.shares'
		)
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// 3. Get submission counts per campaign
	const submissions_resp = await knex('Campaign_Submissions as cs')
		.join('Creator_Socials as soc', 'cs.conn_id', 'soc.conn_id')
		.where('soc.user_id', user_id)
		.groupBy('cs.campaign_id')
		.select('cs.campaign_id')
		.count('cs.npc_id as submitted')
		.catch((err) => { if (err) err_code = err.code });
	if (err_code) return [false, null];

	// Process the data
	const campaigns = campaigns_resp.map(campaign => {
		// Find submission count for this campaign
		const submissionCount = submissions_resp.find(s => s.campaign_id === campaign.id)?.submitted || 0;
		
		// Calculate total metrics for this campaign
		const campaignMetrics = metrics_resp
			.filter(m => m.campaign_id === campaign.id)
			.reduce((acc, curr) => ({
				views: acc.views + curr.views,
				likes: acc.likes + curr.likes,
				comments: acc.comments + curr.comments,
				shares: acc.shares + curr.shares
			}), { views: 0, likes: 0, comments: 0, shares: 0 });

		return {
			id: campaign.id,
			name: campaign.name,
			img: campaign.img,
			description: campaign.description,
			assigned: campaign.num_posts,
			submitted: submissionCount,
			metrics: campaignMetrics
		};
	});

	// Calculate overall performance metrics
	const performance = metrics_resp.reduce((acc, curr) => ({
		total_views: acc.total_views + curr.views,
		total_likes: acc.total_likes + curr.likes,
		total_comments: acc.total_comments + curr.comments,
		total_shares: acc.total_shares + curr.shares
	}), { total_views: 0, total_likes: 0, total_comments: 0, total_shares: 0 });

	// Return
	return [true, {
		campaigns,
		performance
	}];
}


// -------------------
// UPDATE Functions
// -------------------


// -------------------
// DELETE Functions
// -------------------



// ----- Export -----
module.exports = {
	db_getCreatorDashboard,
};