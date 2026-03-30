// Dependencies
const knex = require('knex')(require('../../../knexfile.js').development);
const { convertEncodedImage } = require('../../../utils/convertEncodedImage.js');

// -------------------
// Helper Functions
// -------------------
function getDateRangesForPeriod(period) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // For 'all' period, return null dates (no filtering)
    if (period === 'all') {
        return {
            currentPeriod: { start: null, end: null },
            referencePeriod: { start: null, end: null }
        };
    }

    // For YTD, handle specially
    if (period === 'ytd') {
        const currentStart = new Date(currentYear, 0, 1); // Jan 1 of current year
        const currentEnd = now; // Current time
        
        const prevYearStart = new Date(currentYear - 1, 0, 1); // Jan 1 of previous year
        const prevYearEnd = new Date(currentYear - 1, currentMonth, currentDay);

        return {
            currentPeriod: { start: currentStart, end: currentEnd },
            referencePeriod: { start: prevYearStart, end: prevYearEnd }
        };
    }

    // For other periods, calculate based on days
    let days;
    switch (period) {
        case '24h': days = 1; break;
        case '7d': days = 7; break;
        case '30d': days = 30; break;
        case '60d': days = 60; break;
        case '90d': days = 90; break;
        case '6m': days = 180; break; // Approximate 6 months
        default: throw new Error(`Invalid period: ${period}`);
    }

    // Calculate start date by subtracting days from now
    const startDate = new Date(now);
    if (period === '24h') {
        // For 24h, go back exactly 24 hours from current time
        startDate.setHours(startDate.getHours() - 24);
    } else {
        // For other periods, use the day-based calculation
        startDate.setDate(startDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0); // Set to start of day
    }

    // For reference period, go back the same number of days
    const referenceEnd = new Date(startDate);
    const referenceStart = new Date(referenceEnd);
    
    if (period === '24h') {
        // For 24h, reference period is previous 24 hours
        referenceStart.setHours(referenceStart.getHours() - 24);
    } else {
        // For other periods, use day-based calculation
        referenceEnd.setDate(referenceEnd.getDate() - 1);
        referenceStart.setDate(referenceStart.getDate() - days + 1);
        referenceStart.setHours(0, 0, 0, 0);
    }

    return {
        currentPeriod: { start: startDate, end: now }, // Use current time as end
        referencePeriod: { start: referenceStart, end: referenceEnd }
    };
}

// Helper function to generate date ranges
function generateDatePoints(startDate, endDate, period) {
    const points = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    // Determine step based on period
    let step;
    switch (period) {
        case '24h':
        case '7d':
        case '30d':
            step = 1; // daily
            break;
        case '60d':
        case '90d':
            step = 7; // weekly
            break;
        case '6m':
        case 'ytd':
        case 'all':
            // For monthly, we'll handle this specially
            while (current <= end) {
                points.push(new Date(current.getFullYear(), current.getMonth(), 1));
                current.setMonth(current.getMonth() + 1);
            }
            
            // Ensure the end date is included if it's not the first of the month
            if (points.length > 0) {
                const lastPoint = points[points.length - 1];
                if (lastPoint.getTime() !== end.getTime()) {
                    points.push(new Date(end));
                }
            }
            
            return points;
        default:
            step = 1;
    }

    // For daily and weekly - ensure we include the end date
    while (current <= end) {
        points.push(new Date(current));
        current.setDate(current.getDate() + step);
        
        // For weekly steps, ensure we don't go beyond the end date
        if (step === 7 && current > end) {
            // Add the end date if it's not already included
            const lastPoint = points[points.length - 1];
            if (lastPoint.getTime() !== end.getTime()) {
                points.push(new Date(end));
            }
            break;
        }
    }
    
    // Ensure the end date is always included for all periods
    if (points.length > 0) {
        const lastPoint = points[points.length - 1];
        if (lastPoint.getTime() !== end.getTime()) {
            points.push(new Date(end));
        }
    }
    
    return points;
}

// Helper function to get grouping SQL for different periods
function getGroupByForPeriod(period) {
    switch (period) {
        case '24h':
        case '7d':
        case '30d':
            return 'DATE(recorded_ts)';
        case '60d':
        case '90d':
            return 'DATE(DATE_SUB(recorded_ts, INTERVAL WEEKDAY(recorded_ts) DAY))';
        case '6m':
        case 'ytd':
        case 'all':
            return 'DATE_FORMAT(recorded_ts, "%Y-%m-01")';
        default:
            return 'DATE(recorded_ts)';
    }
}

// Helper function to pre-filter npc_ids based on campaigns and creators
async function getFilteredNpcIds(campaignIds = null, creatorIds = null) {
    let filteredNpcIds = null;
    
    // Step 1: Filter by campaigns if provided
    if (campaignIds && campaignIds.length > 0) {
        const campaignNpcIds = await knex('Campaign_Submissions')
            .select('npc_id')
            .whereIn('campaign_id', campaignIds)
            .groupBy('npc_id'); // Ensure unique npc_ids
        filteredNpcIds = campaignNpcIds.map(r => r.npc_id);
    }
    
    // Step 2: Filter by creators if provided
    if (creatorIds && creatorIds.length > 0) {
        // Get creator links for these users
        const creatorLinks = await knex('Creator_Links')
            .select('clink_id')
            .whereIn('user_id', creatorIds);
        
        // Get npc_ids for these creators (only from creator_links)
        const creatorNpcIds = await knex('Campaign_Submissions')
            .select('npc_id')
            .whereIn('clink_id', creatorLinks.map(c => c.clink_id))
            .groupBy('npc_id'); // Ensure unique npc_ids
        
        const creatorNpcIdList = creatorNpcIds.map(r => r.npc_id);
        
        // Intersect with campaign filter if both exist
        if (filteredNpcIds) {
            filteredNpcIds = filteredNpcIds.filter(id => creatorNpcIdList.includes(id));
        } else {
            filteredNpcIds = creatorNpcIdList;
        }
    }
    
    return filteredNpcIds;
}

// Helper function to get latest metrics for specific npc_ids
async function getLatestMetricsForPosts(npcIds) {
    if (!npcIds || npcIds.length === 0) return [];

    console.log("Getting post metrics");
    
    // Get the latest recorded_ts for each npc_id first
    const latestTimestamps = await knex('Campaign_Submissions_Metrics')
        .select('npc_id', knex.raw('MAX(recorded_ts) as latest_ts'))
        .whereIn('npc_id', npcIds)
        .groupBy('npc_id');
    
    // Then get the actual metrics for those timestamps
    const metricsPromises = latestTimestamps.map(async (item) => {
        return knex('Campaign_Submissions_Metrics')
            .select('npc_id', 'views', 'likes', 'comments', 'shares')
            .where('npc_id', item.npc_id)
            .where('recorded_ts', item.latest_ts)
            .first();
    });
    
    const results = await Promise.all(metricsPromises);
    return results.filter(r => r !== undefined);
}

// Helper function to get metrics range for lift calculation
async function getMetricsRangeForPeriod(npcIds, startDate, endDate) {
    if (!npcIds || npcIds.length === 0) return [];
    
    // Get earliest and latest metrics in two separate efficient queries
    const [earliestMetrics, latestMetrics] = await Promise.all([
        // Get earliest metrics
        knex('Campaign_Submissions_Metrics as csm')
            .select('csm.npc_id', 'csm.views', 'csm.likes', 'csm.comments', 'csm.shares')
            .join(
                knex('Campaign_Submissions_Metrics')
                    .select('npc_id', knex.raw('MIN(recorded_ts) as min_ts'))
                    .whereIn('npc_id', npcIds)
                    .where('recorded_ts', '>=', startDate)
                    .where('recorded_ts', '<=', endDate)
                    .groupBy('npc_id')
                    .as('earliest'),
                function() {
                    this.on('csm.npc_id', '=', 'earliest.npc_id')
                        .andOn('csm.recorded_ts', '=', 'earliest.min_ts');
                }
            ),
        
        // Get latest metrics
        knex('Campaign_Submissions_Metrics as csm')
            .select('csm.npc_id', 'csm.views', 'csm.likes', 'csm.comments', 'csm.shares')
            .join(
                knex('Campaign_Submissions_Metrics')
                    .select('npc_id', knex.raw('MAX(recorded_ts) as max_ts'))
                    .whereIn('npc_id', npcIds)
                    .where('recorded_ts', '>=', startDate)
                    .where('recorded_ts', '<=', endDate)
                    .groupBy('npc_id')
                    .as('latest'),
                function() {
                    this.on('csm.npc_id', '=', 'latest.npc_id')
                        .andOn('csm.recorded_ts', '=', 'latest.max_ts');
                }
            )
    ]);
    
    // Calculate lifts (latest - earliest)
    const lifts = [];
    latestMetrics.forEach(latest => {
        const earliest = earliestMetrics.find(e => e.npc_id === latest.npc_id);
        if (earliest) {
            lifts.push({
                npc_id: latest.npc_id,
                views: Math.max(0, (latest.views || 0) - (earliest.views || 0)),
                likes: Math.max(0, (latest.likes || 0) - (earliest.likes || 0)),
                comments: Math.max(0, (latest.comments || 0) - (earliest.comments || 0)),
                shares: Math.max(0, (latest.shares || 0) - (earliest.shares || 0))
            });
        }
    });
    
    return lifts;
}

// Helper function to calculate metrics for a specific period
async function calculatePeriodMetrics(startDate, endDate, filteredNpcIds, filterBySubmissionDate) {
    let metricsData = [];
    let postCounts = { total_posts: 0, ig_posts: 0, tt_posts: 0 };
    
    if (filterBySubmissionDate) {
        // Only consider posts created within the period
        const postsInPeriod = await knex('Campaign_Submissions')
            .select('npc_id')
            .where('post_ts', '>=', startDate)
            .where('post_ts', '<=', endDate)
            .modify(query => {
                if (filteredNpcIds && filteredNpcIds.length > 0) {
                    query.whereIn('npc_id', filteredNpcIds);
                }
            });
        
        const npcIds = postsInPeriod.map(p => p.npc_id);
        if (npcIds.length > 0) {
            metricsData = await getLatestMetricsForPosts(npcIds);
        }
        
        // Get post counts for posts created in period
        postCounts = await getPostCounts(npcIds);
        
    } else {
        // Handle lift calculation for all posts
        let allNpcIds = filteredNpcIds;
        
        if (!allNpcIds) {
            // Get all npc_ids if no filtering
            const allPosts = await knex('Campaign_Submissions')
                .select('npc_id')
                .groupBy('npc_id'); // Ensure unique npc_ids
            allNpcIds = allPosts.map(p => p.npc_id);
        }

        if (startDate === null && endDate === null) {
            // "All" period
            const allPosts = await knex('Campaign_Submissions')
                .select('npc_id')
                .whereIn('npc_id', allNpcIds)
                .groupBy('npc_id'); // Deduplicate at query level
            console.log("ALL POSTS IDS = ", allPosts.map(p => p.npc_id));
            metricsData = await getLatestMetricsForPosts(allPosts.map(p => p.npc_id));
        }
        
        else if (allNpcIds.length > 0) {
            // Separate posts created within period vs before period
            const postsCreatedInPeriod = await knex('Campaign_Submissions')
                .select('npc_id')
                .whereIn('npc_id', allNpcIds)
                .where('post_ts', '>=', startDate)
                .where('post_ts', '<=', endDate)
                .groupBy('npc_id'); // Deduplicate at query level
            const newPostIds = postsCreatedInPeriod.map(p => p.npc_id);
            
            // Only get posts that were created BEFORE period AND are NOT in the new posts list
            const postsCreatedBeforePeriod = await knex('Campaign_Submissions')
                .select('npc_id')
                .whereIn('npc_id', allNpcIds)
                .where('post_ts', '<', startDate)
                .whereNotIn('npc_id', newPostIds.length > 0 ? newPostIds : [0]) // Exclude npc_ids already in new posts
                .groupBy('npc_id'); // Deduplicate at query level
            const oldPostIds = postsCreatedBeforePeriod.map(p => p.npc_id);
            
            // Get latest metrics for new posts
            const newPostMetrics = await getLatestMetricsForPosts(newPostIds);
            
            // Get lift metrics for old posts within the period
            const oldPostLifts = await getMetricsRangeForPeriod(oldPostIds, startDate, endDate);
            
            // Combine all metrics
            metricsData = [...newPostMetrics, ...oldPostLifts];
        }
        
        // Get post counts for all posts
        postCounts = await getPostCounts(allNpcIds);
    }
    
    // CRITICAL FIX: Deduplicate metrics by npc_id before aggregation
    // In case the same npc_id appears in both newPostMetrics and oldPostLifts
    const deduplicatedMetrics = {};
    metricsData.forEach(item => {
        if (!deduplicatedMetrics[item.npc_id]) {
            deduplicatedMetrics[item.npc_id] = item;
        } else {
            // If duplicate, keep the one with higher views (probably the latest/most accurate)
            if ((item.views || 0) > (deduplicatedMetrics[item.npc_id].views || 0)) {
                deduplicatedMetrics[item.npc_id] = item;
            }
        }
    });
    
    const finalMetricsData = Object.values(deduplicatedMetrics);
    
    // Aggregate metrics
    const totals = finalMetricsData.reduce((acc, item) => {
        acc.views += item.views || 0;
        acc.likes += item.likes || 0;
        acc.comments += item.comments || 0;
        acc.shares += item.shares || 0;
        return acc;
    }, { views: 0, likes: 0, comments: 0, shares: 0 });
    
    // Calculate engagement rate
    const engagement_rate = totals.views > 0 
        ? ((totals.likes + totals.comments + totals.shares) / totals.views) 
        : 0;
    
    return {
        views: totals.views,
        likes: totals.likes,
        comments: totals.comments,
        shares: totals.shares,
        engagement_rate: engagement_rate,
        total_posts: postCounts.total_posts,
        ig_posts: postCounts.ig_posts,
        tt_posts: postCounts.tt_posts
    };
}

// Helper function to get post counts by platform
async function getPostCounts(npcIds) {
    if (!npcIds || npcIds.length === 0) {
        return { total_posts: 0, ig_posts: 0, tt_posts: 0 };
    }
    
    const postCounts = await knex('Campaign_Submissions as cs')
        .leftJoin('Creator_Links as cl', 'cs.clink_id', 'cl.clink_id')
        .select(
            knex.raw('COUNT(*) as total_posts'),
            knex.raw('SUM(CASE WHEN cl.platform = "ig" THEN 1 ELSE 0 END) as ig_posts'),
            knex.raw('SUM(CASE WHEN cl.platform = "tt" THEN 1 ELSE 0 END) as tt_posts')
        )
        .whereIn('cs.npc_id', npcIds)
        .first();
    
    return {
        total_posts: parseInt(postCounts.total_posts) || 0,
        ig_posts: parseInt(postCounts.ig_posts) || 0,
        tt_posts: parseInt(postCounts.tt_posts) || 0
    };
}

// Helper function to calculate metrics for creator links
async function calculateCreatorLinkMetrics(clinkIds, startDate, endDate, filteredNpcIds, filterBySubmissionDate) {
    if (!clinkIds || clinkIds.length === 0) return [];
    
    let postsQuery = knex('Campaign_Submissions')
        .select('npc_id', 'clink_id')
        .whereIn('clink_id', clinkIds)
        .whereNotNull('clink_id');
    
    if (filteredNpcIds && filteredNpcIds.length > 0) {
        postsQuery = postsQuery.whereIn('npc_id', filteredNpcIds);
    }
    
    if (filterBySubmissionDate) {
        postsQuery = postsQuery.where('post_ts', '>=', startDate)
                             .where('post_ts', '<=', endDate);
    }
    
    const posts = await postsQuery;
    const npcIds = posts.map(p => p.npc_id);
    
    if (npcIds.length === 0) return [];
    
    // Get metrics for these posts using mixed approach
    let metricsData = [];
    if (filterBySubmissionDate) {
        metricsData = await getLatestMetricsForPosts(npcIds);
    } else {
        // Use mixed approach: latest metrics for new posts, lift for old posts
        const postsCreatedInPeriod = await knex('Campaign_Submissions')
            .select('npc_id')
            .whereIn('npc_id', npcIds)
            .where('post_ts', '>=', startDate)
            .where('post_ts', '<=', endDate)
            .groupBy('npc_id'); // Deduplicate at query level
        const newPostIds = postsCreatedInPeriod.map(p => p.npc_id);
        
        // Only get posts that were created BEFORE period AND are NOT in the new posts list
        const postsCreatedBeforePeriod = await knex('Campaign_Submissions')
            .select('npc_id')
            .whereIn('npc_id', npcIds)
            .where('post_ts', '<', startDate)
            .whereNotIn('npc_id', newPostIds.length > 0 ? newPostIds : [0]) // Exclude npc_ids already in new posts
            .groupBy('npc_id'); // Deduplicate at query level
        const oldPostIds = postsCreatedBeforePeriod.map(p => p.npc_id);
        
        // Get latest metrics for new posts
        const newPostMetrics = await getLatestMetricsForPosts(newPostIds);
        
        // Get lift metrics for old posts within the period
        const oldPostLifts = await getMetricsRangeForPeriod(oldPostIds, startDate, endDate);
        
        // Combine all metrics
        metricsData = [...newPostMetrics, ...oldPostLifts];
    }
    
    // Group by clink_id and sum metrics
    const clinkMetrics = {};
    posts.forEach(post => {
        const metrics = metricsData.find(m => m.npc_id === post.npc_id);
        if (metrics) {
            if (!clinkMetrics[post.clink_id]) {
                clinkMetrics[post.clink_id] = { views: 0, likes: 0, comments: 0, shares: 0 };
            }
            clinkMetrics[post.clink_id].views += metrics.views || 0;
            clinkMetrics[post.clink_id].likes += metrics.likes || 0;
            clinkMetrics[post.clink_id].comments += metrics.comments || 0;
            clinkMetrics[post.clink_id].shares += metrics.shares || 0;
        }
    });
    
    return Object.entries(clinkMetrics).map(([clink_id, metrics]) => ({
        clink_id: parseInt(clink_id),
        ...metrics
    }));
}

// Helper function to enrich content with creator and submission details
async function enrichContentWithDetails(npcIds) {
    if (!npcIds || npcIds.length === 0) return [];
    
    const contentDetails = await knex('Campaign_Submissions as cs')
        .leftJoin('Creator_Links as cl', 'cs.clink_id', 'cl.clink_id')
        .leftJoin('Campaigns as camp', 'cs.campaign_id', 'camp.id')
        .select(
            'cs.npc_id',
            'cs.caption',
            'cs.post_url',
            'cs.thumbnail',
            'cs.post_ts',
            'cs.campaign_id',
            'camp.name as campaign_name',
            // Creator link details
            'cl.display_name as creator_name',
            'cl.handle as creator_handle',
            'cl.platform as creator_platform',
            'cl.pfp as creator_pfp',
            'cl.user_id as creator_user_id'
        )
        .whereIn('cs.npc_id', npcIds);
    
    return contentDetails.map(content => ({
        npc_id: content.npc_id,
        caption: content.caption,
        post_url: content.post_url,
        thumbnail: content.thumbnail,
        post_ts: content.post_ts,
        campaign_id: content.campaign_id,
        campaign_name: content.campaign_name,
        creator_name: content.creator_name,
        creator_handle: content.creator_handle,
        creator_platform: content.creator_platform,
        creator_pfp: content.creator_pfp ? convertEncodedImage(content.creator_pfp) : null,
        creator_user_id: content.creator_user_id
    }));
}


// -------------------
// METRICS Functions
// -------------------

/**
 * Get earliest metric date
 * @param {number[]} campaignIds - The campaign IDs to filter by
 * @param {number[]} creatorIds - The creator IDs to filter by
 */
async function db_getEarliestMetricDate(campaignIds = null, creatorIds = null) {
	// Use inline implementation for reliability
	try {
		let query = knex('Campaign_Submissions_Metrics as csm')
			.join('Campaign_Submissions as cs', 'cs.npc_id', 'csm.npc_id');

		// Apply campaign filter
		if (campaignIds && campaignIds.length > 0) {
			query = query.whereIn('cs.campaign_id', campaignIds);
		}

		// Apply creator filter
		if (creatorIds && creatorIds.length > 0) {
			query = query.leftJoin('Creator_Socials as soc', 'cs.conn_id', 'soc.conn_id')
				.leftJoin('Creator_Links as cl', 'cs.clink_id', 'cl.clink_id')
				.where(function() {
					this.whereIn('soc.user_id', creatorIds)
						.orWhereIn('cl.user_id', creatorIds);
				});
		}

		const result = await query
			.select(knex.raw('MIN(csm.recorded_ts) as earliest_date'))
			.first();
		
		if (!result?.earliest_date) {
			const fallbackDate = new Date();
			fallbackDate.setMonth(fallbackDate.getMonth() - 6);
			return fallbackDate;
		}

		return result.earliest_date;
	} catch (error) {
		console.error('Error in db_getEarliestMetricDate:', error);
		const fallbackDate = new Date();
		fallbackDate.setMonth(fallbackDate.getMonth() - 6);
		return fallbackDate;
	}
}

/**
 * Get key metrics for the dashboard
 * @param {string} period - The time period to get metrics for
 * @param {number[]} campaignIds - The campaign IDs to filter by
 * @param {number[]} creatorIds - The creator IDs to filter by
 * @param {boolean} filterBySubmissionDate - Whether to filter by submission date
 */
async function db_getKeyMetrics(period="30d", campaignIds = null, creatorIds = null, filterBySubmissionDate = false, start_date = null, end_date = null) {
    try {
        // Get date ranges for current and reference periods
        let currentPeriod, referencePeriod;
        if (period === 'custom' && start_date && end_date) {
            // For custom period, use provided dates
            currentPeriod = { start: new Date(start_date), end: new Date(end_date) };
            referencePeriod = { start: null, end: null };
        } else {
            const dateRanges = getDateRangesForPeriod(period);
            currentPeriod = dateRanges.currentPeriod;
            referencePeriod = dateRanges.referencePeriod;
        }
        
        // Pre-filter npc_ids based on campaigns and creators
        const filteredNpcIds = await getFilteredNpcIds(campaignIds, creatorIds);
        
        // Calculate current period metrics
        const currentMetrics = await calculatePeriodMetrics(
            currentPeriod.start, 
            currentPeriod.end, 
            filteredNpcIds, 
            filterBySubmissionDate
        );
        
        // Calculate reference period metrics (skip for 'all' period)
        let referenceMetrics = null;
        if (referencePeriod.start && period !== 'all') {
            referenceMetrics = await calculatePeriodMetrics(
                referencePeriod.start, 
                referencePeriod.end, 
                filteredNpcIds, 
                filterBySubmissionDate
            );
        }
        
        // Return flat structure matching v2 format (frontend calculates lifts)
        return {
            total_views: currentMetrics?.views || 0,
            prev_total_views: referenceMetrics?.views || 0,
            total_likes: currentMetrics?.likes || 0,
            prev_total_likes: referenceMetrics?.likes || 0,
            total_comments: currentMetrics?.comments || 0,
            prev_total_comments: referenceMetrics?.comments || 0,
            total_shares: currentMetrics?.shares || 0,
            prev_total_shares: referenceMetrics?.shares || 0,
            engagement_rate: Number((currentMetrics?.engagement_rate || 0).toFixed(4)),
            prev_engagement_rate: Number((referenceMetrics?.engagement_rate || 0).toFixed(4)),
            total_posts: currentMetrics?.total_posts || 0,
            prev_total_posts: referenceMetrics?.total_posts || 0,
            ig_total_posts: currentMetrics?.ig_posts || 0,
            tt_total_posts: currentMetrics?.tt_posts || 0
        };
        
    } catch (error) {
        console.error('Error in db_getKeyMetrics:', error);
        throw error;
    }
}

/**
 * Get graph data points for the dashboard
 * @param {Date} startDate - The start date of the period
 * @param {Date} endDate - The end date of the period
 * @param {string} period - The time period to get metrics for
 * @param {number[]} campaignIds - The campaign IDs to filter by
 * @param {number[]} creatorIds - The creator IDs to filter by
 * @param {boolean} filterBySubmissionDate - Whether to filter by submission date
 * @param {string} viewType - The type of view to get data for (incremental or cumulative)
 */
async function db_getGraphData(startDate, endDate, period="30d", campaignIds = null, creatorIds = null, filterBySubmissionDate = false, viewType = 'incremental', group = true) {
    try {
        // Generate all expected date points
        const expectedDates = generateDatePoints(startDate, endDate, period);
        
        // Pre-filter npc_ids based on campaigns and creators
        const filteredNpcIds = await getFilteredNpcIds(campaignIds, creatorIds);
        
        // Get grouping SQL for the period
        // If group is false, always use daily grouping
        const groupBy = group ? getGroupByForPeriod(period) : 'DATE(recorded_ts)';
        
        let metricsData = [];
        
        // NEW OPTIMIZED APPROACH: Aggregate at database level
        if (filterBySubmissionDate) {
            // Build query that joins and aggregates in one go
            let query = knex('Campaign_Submissions_Metrics as csm')
                .join('Campaign_Submissions as cs', 'cs.npc_id', 'csm.npc_id')
                .select(
                    knex.raw(`${groupBy} as date`),
                    knex.raw('SUM(csm.views) as views'),
                    knex.raw('SUM(csm.likes) as likes'),
                    knex.raw('SUM(csm.comments) as comments'),
                    knex.raw('SUM(csm.shares) as shares')
                )
                .where('csm.recorded_ts', '>=', startDate)
                .where('csm.recorded_ts', '<=', endDate)
                .where('cs.post_ts', '>=', startDate)
                .where('cs.post_ts', '<=', endDate);
            
            if (filteredNpcIds && filteredNpcIds.length > 0) {
                query = query.whereIn('csm.npc_id', filteredNpcIds);
            }
            
            metricsData = await query
                .groupBy('date')
                .orderBy('date', 'asc');
                
        } else {
            // For non-filtered by submission date, we need to handle lifts properly
            // This is more complex but still optimized
            
            // First, build the base query for metrics aggregation
            let baseQuery = knex('Campaign_Submissions_Metrics as csm')
                .where('csm.recorded_ts', '>=', startDate)
                .where('csm.recorded_ts', '<=', endDate);
            
            if (filteredNpcIds && filteredNpcIds.length > 0) {
                baseQuery = baseQuery.whereIn('csm.npc_id', filteredNpcIds);
            }
            
            // Cumulative - get max values per date for each npc_id, then sum
            // This properly handles the "lift" calculation
            const subquery = knex('Campaign_Submissions_Metrics')
                .select(
                    'npc_id',
                    knex.raw(`${groupBy} as date`),
                    knex.raw('MAX(views) as views'),
                    knex.raw('MAX(likes) as likes'),
                    knex.raw('MAX(comments) as comments'),
                    knex.raw('MAX(shares) as shares')
                )
                .where('recorded_ts', '>=', startDate)
                .where('recorded_ts', '<=', endDate)
                .modify(query => {
                    if (filteredNpcIds && filteredNpcIds.length > 0) {
                        query.whereIn('npc_id', filteredNpcIds);
                    }
                })
                .groupBy('npc_id', 'date')
                .as('daily_max');
            
            metricsData = await knex(subquery)
                .select(
                    'date',
                    knex.raw('SUM(views) as views'),
                    knex.raw('SUM(likes) as likes'),
                    knex.raw('SUM(comments) as comments'),
                    knex.raw('SUM(shares) as shares')
                )
                .groupBy('date')
                .orderBy('date', 'asc');
        }
        
        // Create a map of existing results
        const resultMap = new Map(
            metricsData.map(r => {
                // Handle date string from database
                const dateStr = typeof r.date === 'string' ? r.date : 
                              r.date instanceof Date ? r.date.toISOString().split('T')[0] :
                              new Date(r.date).toISOString().split('T')[0];
                
                return [
                    dateStr,
                    {
                        views: parseInt(r.views) || 0,
                        likes: parseInt(r.likes) || 0,
                        comments: parseInt(r.comments) || 0,
                        shares: parseInt(r.shares) || 0
                    }
                ];
            })
        );
        
        // Generate complete dataset for missing dates
        let prev = { views: 0, likes: 0, comments: 0, shares: 0 };
        
        let complete_data = expectedDates.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const existingData = resultMap.get(dateStr);
            
            if (existingData) {
                // Update previous values when we have data
                prev = { ...existingData };
                return {
                    date: dateStr,
                    views: existingData.views, likes: existingData.likes,
                    comments: existingData.comments, shares: existingData.shares
                };
            } else {
                // For missing dates:
                // - Cumulative view: carry over previous values
                return {
                    date: dateStr,
                    views: prev.views, likes: prev.likes,
                    comments: prev.comments, shares: prev.shares
                };
            }
        });

        // If incremental, convert to incremental
        if (viewType === 'incremental') {
        return complete_data.map((data, index) => {
                if (index === 0) return data;
                return {
                    ...data,
                    views: Math.max(0, data.views - (complete_data[index - 1]?.views || 0)),
                    likes: Math.max(0, data.likes - (complete_data[index - 1]?.likes || 0)), 
                    comments: Math.max(0, data.comments - (complete_data[index - 1]?.comments || 0)),
                    shares: Math.max(0, data.shares - (complete_data[index - 1]?.shares || 0))
                };
            });
        } else return complete_data;

    } catch (error) {
        console.error('Error in db_getGraphData:', error);
        console.error('Memory at error:', process.memoryUsage().heapUsed / 1024 / 1024, 'MB');
        throw error;
    }
}

/**
 * Get top creators for the dashboard
 * @param {Date} startDate - The start date of the period
 * @param {Date} endDate - The end date of the period
 * @param {number[]} campaignIds - The campaign IDs to filter by
 * @param {number[]} creatorIds - The creator IDs to filter by
 * @param {boolean} filterBySubmissionDate - Whether to filter by submission date
 * @param {number} limit - The number of creators to return
 * @param {number} page - The page number to return
 */
async function db_getTopCreators(startDate, endDate, campaignIds = null, creatorIds = null, filterBySubmissionDate = false, limit = 50, page = 1, custom_start_date = null, custom_end_date = null) {
    try {
        // Pre-filter npc_ids based on campaigns and creators
        const filteredNpcIds = await getFilteredNpcIds(campaignIds, creatorIds);
        
        // Get relevant creator links
        const creatorLinks = await knex('Creator_Links as cl')
            .select('cl.clink_id', 'cl.user_id', 'cl.display_name', 'cl.handle', 'cl.platform', 'cl.pfp')
            .modify(query => {
                if (campaignIds && campaignIds.length > 0) {
                    query.whereIn('cl.campaign_id', campaignIds);
                }
                if (creatorIds && creatorIds.length > 0) {
                    query.whereIn('cl.user_id', creatorIds);
                }
            });
        
        // Calculate metrics for creator links
        const clinkMetrics = await calculateCreatorLinkMetrics(
            creatorLinks.map(cl => cl.clink_id),
            startDate,
            endDate,
            filteredNpcIds,
            filterBySubmissionDate
        );
        
        // Format results
        const allCreatorMetrics = [];
        
        // Add creator link metrics
        clinkMetrics.forEach(metric => {
            const creatorLink = creatorLinks.find(cl => cl.clink_id === metric.clink_id);
            if (creatorLink) {
                allCreatorMetrics.push({
                    user_id: creatorLink.user_id,
                    creator_id: creatorLink.clink_id,
                    name: creatorLink.display_name,
                    handle: creatorLink.handle,
                    platform: creatorLink.platform,
                    pfp: creatorLink.pfp,
                    views: metric.views,
                    likes: metric.likes,
                    comments: metric.comments,
                    shares: metric.shares || 0
                });
            }
        });
        
        // NEW: Enrich with Users table data
        const userIds = [...new Set(allCreatorMetrics.map(c => c.user_id).filter(id => id))];
        let usersMap = new Map();
        
        if (userIds.length > 0) {
            const usersData = await knex('Users')
                .select('id', 'name', 'pfp')
                .whereIn('id', userIds);
            
            usersMap = new Map(usersData.map(u => [u.id, {
                name: u.name,
                pfp: u.pfp ? convertEncodedImage(u.pfp) : null
            }]));
        }
        
        // Update allCreatorMetrics with Users data
        allCreatorMetrics.forEach(metric => {
            const userData = usersMap.get(metric.user_id);
            if (userData) {
                metric.name = userData.name;
                metric.pfp = userData.pfp;
            }
        });
        
        // Sort by views (descending) and apply pagination
        const sortedMetrics = allCreatorMetrics.sort((a, b) => b.views - a.views);
        const offset = (page - 1) * limit;
        const paginatedResults = sortedMetrics.slice(offset, offset + limit);
        
        // Convert pfp to base64 if needed - handle Creator_Links pfp if no Users pfp
        const enrichedResults = paginatedResults.map(creator => ({
            ...creator,
            pfp: creator.pfp || (creator.pfp ? convertEncodedImage(creator.pfp) : null)
        }));
        
        return {
            data: enrichedResults.map(creator => ({
                id: creator.user_id?.toString() || '',
                name: creator.name,
                profile_img: creator.pfp,
                platforms: creator.platform ? [creator.platform] : [],
                social: creator.handle ? {
                    id: creator.creator_id,
                    handle: creator.handle,
                    platform: creator.platform,
                    pfp: creator.pfp
                } : null,
                total_views: creator.views,
                total_likes: creator.likes,
                total_comments: creator.comments,
                total_shares: creator.shares,
                engagement_rate: creator.views > 0 ? Number(Math.min(1.0, (creator.likes + creator.comments + creator.shares) / creator.views).toFixed(4)) : 0
            })),
            pagination: {
                page,
                limit,
                total: sortedMetrics.length,
                totalPages: Math.ceil(sortedMetrics.length / limit),
                hasNext: page < Math.ceil(sortedMetrics.length / limit),
                hasPrevious: page > 1
            }
        };
        
    } catch (error) {
        console.error('Error in db_getTopCreators:', error);
        throw error;
    }
}

/**
 * Get top content for the dashboard
 * @param {Date} startDate - The start date of the period
 * @param {Date} endDate - The end date of the period
 * @param {number[]} campaignIds - The campaign IDs to filter by
 * @param {number[]} creatorIds - The creator IDs to filter by
 * @param {boolean} filterBySubmissionDate - Whether to filter by submission date
 * @param {number} limit - The number of content items to return
 * @param {string} cursor - The cursor to use for pagination
 */
async function db_getTopContent(startDate, endDate, campaignIds = null, creatorIds = null, filterBySubmissionDate = false, limit, cursor = null, custom_start_date = null, custom_end_date = null) {
    try {
        // Pre-filter npc_ids based on campaigns and creators
        const filteredNpcIds = await getFilteredNpcIds(campaignIds, creatorIds);
        
        // Get all relevant npc_ids for the period
        let targetNpcIds = filteredNpcIds;
        
        if (filterBySubmissionDate) {
            // Only consider posts created within the period
            const postsInPeriod = await knex('Campaign_Submissions')
                .select('npc_id')
                .where('post_ts', '>=', startDate)
                .where('post_ts', '<=', endDate)
                .modify(query => {
                    if (filteredNpcIds && filteredNpcIds.length > 0) {
                        query.whereIn('npc_id', filteredNpcIds);
                    }
                });
            
            targetNpcIds = postsInPeriod.map(p => p.npc_id);
        }
        
        // Return empty result if no posts found for the filtered criteria
        if (!targetNpcIds || targetNpcIds.length === 0) {
            return { 
                data: [], 
                pagination: {
                    cursor: null,
                    hasNext: false,
                    limit: limit
                }
            };
        }
        
        // Calculate metrics for each npc_id
        let contentMetrics = [];
        
        if (filterBySubmissionDate) {
            // Get latest metrics for posts created in period
            const metricsData = await getLatestMetricsForPosts(targetNpcIds);
            contentMetrics = metricsData.map(metric => ({
                npc_id: metric.npc_id,
                views: metric.views || 0,
                likes: metric.likes || 0,
                comments: metric.comments || 0,
                shares: metric.shares || 0
            }));
        } else {
            // Use mixed approach: latest metrics for new posts, lift for old posts
            const postsCreatedInPeriod = await knex('Campaign_Submissions')
                .select('npc_id')
                .whereIn('npc_id', targetNpcIds)
                .where('post_ts', '>=', startDate)
                .where('post_ts', '<=', endDate)
                .groupBy('npc_id'); // Deduplicate at query level
            const newPostIds = postsCreatedInPeriod.map(p => p.npc_id);
            
            // Only get posts that were created BEFORE period AND are NOT in the new posts list
            const postsCreatedBeforePeriod = await knex('Campaign_Submissions')
                .select('npc_id')
                .whereIn('npc_id', targetNpcIds)
                .where('post_ts', '<', startDate)
                .whereNotIn('npc_id', newPostIds.length > 0 ? newPostIds : [0]) // Exclude npc_ids already in new posts
                .groupBy('npc_id'); // Deduplicate at query level
            const oldPostIds = postsCreatedBeforePeriod.map(p => p.npc_id);
            
            // Get latest metrics for new posts
            const newPostMetrics = await getLatestMetricsForPosts(newPostIds);
            
            // Get lift metrics for old posts within the period
            const oldPostLifts = await getMetricsRangeForPeriod(oldPostIds, startDate, endDate);
            
            // Combine all metrics
            const combinedMetrics = [...newPostMetrics, ...oldPostLifts];
            
            // CRITICAL FIX: Deduplicate metrics by npc_id before sorting
            // In case the same npc_id appears in both newPostMetrics and oldPostLifts
            const deduplicatedMetrics = {};
            combinedMetrics.forEach(metric => {
                if (!deduplicatedMetrics[metric.npc_id]) {
                    deduplicatedMetrics[metric.npc_id] = metric;
                } else {
                    // If duplicate, keep the one with higher views (probably the latest/most accurate)
                    if ((metric.views || 0) > (deduplicatedMetrics[metric.npc_id].views || 0)) {
                        deduplicatedMetrics[metric.npc_id] = metric;
                    }
                }
            });
            
            contentMetrics = Object.values(deduplicatedMetrics).map(metric => ({
                npc_id: metric.npc_id,
                views: metric.views || 0,
                likes: metric.likes || 0,
                comments: metric.comments || 0,
                shares: metric.shares || 0
            }));
        }
        
        // Sort by views (descending) and apply cursor pagination
        const sortedMetrics = contentMetrics.sort((a, b) => b.views - a.views);
        
        // Apply cursor filtering if provided
        let filteredMetrics = sortedMetrics;
        if (cursor) {
            filteredMetrics = sortedMetrics.filter(content => content.views < cursor);
        }
        
        // Apply limit and get next cursor
        const paginatedMetrics = filteredMetrics.slice(0, limit);
        const hasMore = filteredMetrics.length > limit;
        const nextCursor = hasMore ? paginatedMetrics[paginatedMetrics.length - 1].views : null;
        
        // Enrich with content details
        const enrichedContent = await enrichContentWithDetails(paginatedMetrics.map(m => m.npc_id));
        
        // NEW: Enrich with Users table data
        const userIds = [...new Set(enrichedContent.map(c => c.creator_user_id).filter(id => id))];
        let usersMap = new Map();
        
        if (userIds.length > 0) {
            const usersData = await knex('Users')
                .select('id', 'name', 'pfp')
                .whereIn('id', userIds);
            
            usersMap = new Map(usersData.map(u => [u.id, {
                name: u.name,
                pfp: u.pfp ? convertEncodedImage(u.pfp) : null
            }]));
        }
        
        // Combine metrics with content details
        const finalResults = paginatedMetrics.map(metric => {
            const contentDetails = enrichedContent.find(content => content.npc_id === metric.npc_id);
            return {
                npc_id: metric.npc_id,
                views: metric.views,
                likes: metric.likes,
                comments: metric.comments,
                shares: metric.shares,
                ...contentDetails
            };
        });
        
        return {
            data: finalResults.map(content => {
                // Get user data from Users table if available
                const userData = content.creator_user_id ? usersMap.get(content.creator_user_id) : null;
                const userName = userData?.name || content.creator_name || null;
                const userPfp = userData?.pfp || content.creator_pfp || null;
                
                return {
                    id: content.npc_id,
                    campaign_name: content.campaign_name || null,
                    created_ts: content.post_ts ? new Date(content.post_ts).toISOString() : null,
                    post_ts: content.post_ts ? new Date(content.post_ts).toISOString() : null,
                    caption: content.caption,
                    post_url: content.post_url,
                    thumbnail: content.thumbnail || null,
                    creator_handle: content.creator_handle || null,
                    creator_pfp: content.creator_pfp || null,
                    creator_name: content.creator_name || null,
                    creator_platform: content.creator_platform || null,
                    user_name: userName,
                    user_pfp: userPfp,
                    views: content.views,
                    likes: content.likes,
                    comments: content.comments,
                    shares: content.shares,
                    creator: {
                        handle: content.creator_handle || null,
                        name: content.creator_name || null,
                        platform: content.creator_platform || null,
                        user: userName ? {
                            name: userName,
                            pfp: userPfp
                        } : null
                    },
                    metrics: {
                        views: content.views,
                        likes: content.likes,
                        comments: content.comments,
                        shares: content.shares
                    }
                };
            }),
            pagination: {
                cursor: nextCursor,
                hasNext: hasMore,
                limit: limit
            }
        };
        
    } catch (error) {
        console.error('Error in db_getTopContent:', error);
        throw error;
    }
}


// Export
module.exports = {
    getDateRangesForPeriod,
    db_getEarliestMetricDate,
    db_getKeyMetrics,
    db_getGraphData,
    db_getTopCreators,
    db_getTopContent,
};