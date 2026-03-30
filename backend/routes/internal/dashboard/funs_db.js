// Dependencies
const knex = require('knex')(require('../../../knexfile.js').development);

// Util Imports
const { convertEncodedImage } = require('../../../utils/convertEncodedImage.js');


// -------------------
// Helper Functions
// -------------------

// Get the latest X post IDs by post_ts
async function getLatestPostIds(num_limit, startDate = null, endDate = null) {
    if (!num_limit) return null;
    
    let query = knex('Campaign_Submissions')
        .select('npc_id')
        .orderBy('post_ts', 'desc')
        .limit(num_limit);
    
    // Only apply date filtering if we have dates (not 'all' period)
    if (startDate && endDate) {
        query = query.where('post_ts', '>=', startDate)
                    .where('post_ts', '<=', endDate);
    }
    
    const results = await query;
    return results.map(row => row.npc_id);
}

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

    // Special handling for 24h period - use rolling 24-hour window
    if (period === '24h') {
        const startDate24h = new Date(now);
        startDate24h.setHours(startDate24h.getHours() - 24);
        
        // Reference period: 24h before that
        const referenceEnd24h = new Date(startDate24h);
        const referenceStart24h = new Date(referenceEnd24h);
        referenceStart24h.setHours(referenceStart24h.getHours() - 24);
        
        return {
            currentPeriod: { start: startDate24h, end: now },
            referencePeriod: { start: referenceStart24h, end: referenceEnd24h }
        };
    }

    // For other periods, calculate based on calendar days
    let days;
    switch (period) {
        case '7d': days = 7; break;
        case '30d': days = 30; break;
        case '60d': days = 60; break;
        case '90d': days = 90; break;
        case '6m': days = 180; break; // Approximate 6 months
        default: throw new Error(`Invalid period: ${period}`);
    }

    // Calculate start date by subtracting days from now
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0); // Set to start of day

    // For reference period, go back the same number of days
    const referenceEnd = new Date(startDate);
    referenceEnd.setDate(referenceEnd.getDate() - 1);
    const referenceStart = new Date(referenceEnd);
    referenceStart.setDate(referenceStart.getDate() - days + 1);
    referenceStart.setHours(0, 0, 0, 0);

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
            return points;
        default:
            step = 1;
    }

    // For daily and weekly
    while (current <= end) {
        points.push(new Date(current));
        current.setDate(current.getDate() + step);
    }
    return points;
}

// Helper function to get performance data
async function getPerformanceData(startDate, endDate, period, validPostIds = null) {
    // If no dates provided (all period), use last 6 months as default
    if (!startDate || !endDate) {
        endDate = new Date();
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
    }

    // Generate all expected date points
    const expectedDates = generateDatePoints(startDate, endDate, period);

    // Determine grouping based on period
    let groupBy;
    switch (period) {
        case '24h':
        case '7d':
        case '30d':
            groupBy = 'DATE(csm.recorded_ts)';
            break;
        case '60d':
        case '90d':
            groupBy = 'DATE(DATE_SUB(csm.recorded_ts, INTERVAL WEEKDAY(csm.recorded_ts) DAY))';
            break;
        case '6m':
        case 'ytd':
        case 'all':
            groupBy = 'DATE_FORMAT(csm.recorded_ts, "%Y-%m-01")';
            break;
        default:
            groupBy = 'DATE(csm.recorded_ts)';
    }

    // Get the latest metrics for each post within each time period
    const performanceQuery = knex('Campaign_Submissions_Metrics as csm')
        .join('Campaign_Submissions as cs', 'cs.npc_id', 'csm.npc_id')
        .select(
            knex.raw(`${groupBy} as date`),
            knex.raw('SUM(csm.views) as views'),
            knex.raw('SUM(csm.likes) as likes'),
            knex.raw('SUM(csm.comments) as comments'),
            knex.raw('SUM(csm.shares) as shares')
        )
        .whereIn('csm.id', function() {
            // Subquery to get the latest metrics record for each post within each time period
            let subquery = this.select('m2.id')
                .from('Campaign_Submissions_Metrics as m2')
                .join('Campaign_Submissions_Metrics as m3', function() {
                    this.on('m2.npc_id', '=', 'm3.npc_id')
                        .andOn('m2.recorded_ts', '=', function() {
                            this.select(knex.raw('MAX(m3.recorded_ts)'))
                                .from('Campaign_Submissions_Metrics as m3')
                                .whereRaw('m3.npc_id = m2.npc_id')
                                .whereRaw(`${groupBy} = DATE(m2.recorded_ts)`);
                        });
                });
            
            // Filter by valid post IDs if provided
            if (validPostIds && validPostIds.length > 0) {
                subquery = subquery.whereIn('m2.npc_id', validPostIds);
            }
            
            return subquery;
        })
        .groupBy('date')
        .orderBy('date', 'asc');

    // Only apply date filtering if we have dates (not 'all' period)
    if (startDate && endDate) {
        performanceQuery.where('csm.recorded_ts', '>=', startDate)
                       .where('csm.recorded_ts', '<=', endDate);
    }

    const results = await performanceQuery;
    
    // Create a map of existing results
    const resultMap = new Map(
        results.map(r => {
            // Handle date string from database
            const dateStr = typeof r.date === 'string' ? r.date : 
                          r.date instanceof Date ? r.date.toISOString().split('T')[0] :
                          new Date(r.date).toISOString().split('T')[0];
            
            return [
                dateStr,
                {
                    views: r.views || 0,
                    likes: r.likes || 0,
                    comments: r.comments || 0,
                    shares: r.shares || 0
                }
            ];
        })
    );

    // Generate complete dataset with zero values for missing dates
    return expectedDates.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const existingData = resultMap.get(dateStr);
        return {
            date: dateStr,
            views: existingData?.views || 0,
            likes: existingData?.likes || 0,
            comments: existingData?.comments || 0,
            shares: existingData?.shares || 0
        };
    });
}

// Build the base query for metrics
const buildMetricsQuery = (startDate, endDate, validPostIds = null) => {
    let query = knex('Campaign_Submissions_Metrics as csm')
        .join('Campaign_Submissions as cs', 'cs.npc_id', 'csm.npc_id')
        .whereIn('csm.id', function() {
            // Subquery to get the latest metrics record for each post
            let subquery = this.select('m2.id')
                .from('Campaign_Submissions_Metrics as m2')
                .join('Campaign_Submissions_Metrics as m3', function() {
                    this.on('m2.npc_id', '=', 'm3.npc_id')
                        .andOn('m2.recorded_ts', '=', function() {
                            this.select(knex.raw('MAX(m3.recorded_ts)'))
                                .from('Campaign_Submissions_Metrics as m3')
                                .whereRaw('m3.npc_id = m2.npc_id');
                        });
                });
            
            // Filter by valid post IDs if provided
            if (validPostIds && validPostIds.length > 0) {
                subquery = subquery.whereIn('m2.npc_id', validPostIds);
            }
            
            return subquery;
        })
        .select(
            knex.raw('SUM(csm.views) as total_views'),
            knex.raw('SUM(csm.likes) as total_likes'),
            knex.raw('SUM(csm.comments) as total_comments'),
            knex.raw('COUNT(DISTINCT cs.npc_id) as total_posts'),
            knex.raw(`
                CASE 
                    WHEN SUM(csm.views) > 0 
                    THEN (SUM(csm.likes) + SUM(csm.comments) + SUM(csm.shares)) / SUM(csm.views)
                    ELSE 0 
                END as engagement_rate
            `)
        );

    // Only apply date filtering if we have dates (not 'all' period)
    if (startDate && endDate) {
        query = query.where('csm.recorded_ts', '>=', startDate)
                    .where('csm.recorded_ts', '<=', endDate);
    }

    return query.first();
};

// -------------------
// READ Functions
// -------------------
async function db_getDashboardData(user_id, period="30d", num_limit = null) {
    let err_code;

    // Get date ranges for the specified period
    const dateRanges = getDateRangesForPeriod(period);

    // Get latest post IDs if num_limit is specified
    const validPostIds = num_limit ? 
        await getLatestPostIds(num_limit, dateRanges.currentPeriod.start, dateRanges.currentPeriod.end)
            .catch((err) => { if (err) err_code = err.code; return null; }) :
        null;
    
    if (err_code) {
        return [true, {
            metrics: defaultMetrics,
            campaigns: [],
            topPosts: [],
            performance: []
        }];
    }

    // Get current period metrics
    const currentMetrics = await buildMetricsQuery(
        dateRanges.currentPeriod.start,
        dateRanges.currentPeriod.end,
        validPostIds
    ).catch((err) => { if (err) err_code = err.code });
    if (err_code) {
        return [true, {
            metrics: defaultMetrics,
            campaigns: [],
            topPosts: [],
            performance: []
        }];
    }

    // For reference period, get valid post IDs for that period too if num_limit is specified
    const prevValidPostIds = (num_limit && dateRanges.referencePeriod.start) ? 
        await getLatestPostIds(num_limit, dateRanges.referencePeriod.start, dateRanges.referencePeriod.end)
            .catch((err) => { if (err) err_code = err.code; return null; }) :
        null;
    
    if (err_code) {
        return [true, {
            metrics: defaultMetrics,
            campaigns: [],
            topPosts: [],
            performance: []
        }];
    }

    // Get reference period metrics (if applicable)
    const prevMetrics = dateRanges.referencePeriod.start ? 
        await buildMetricsQuery(
            dateRanges.referencePeriod.start,
            dateRanges.referencePeriod.end,
            prevValidPostIds
        ).catch((err) => { if (err) err_code = err.code }) :
        null;
    if (err_code) {
        return [true, {
            metrics: defaultMetrics,
            campaigns: [],
            topPosts: [],
            performance: []
        }];
    }

    // Get active campaigns (using current period dates if applicable)
    let campaignsQuery = knex('Campaigns as c')
        .leftJoin('Campaign_Submissions as cs', 'c.id', 'cs.campaign_id')
        .leftJoin('Creator_Assignments as ca', 'c.id', 'ca.campaign_id')
        .select(
            'c.id',
            'c.name',
            'c.created_ts as start_date',
            knex.raw('DATE_ADD(c.created_ts, INTERVAL 30 DAY) as end_date'),
            knex.raw(`
                CASE 
                    WHEN COUNT(cs.npc_id) >= ca.num_posts THEN 'completed'
                    WHEN COUNT(cs.npc_id) > 0 THEN 'active'
                    ELSE 'Pending'
                END as status
            `)
        )
        .groupBy('c.id', 'c.name', 'c.created_ts', 'ca.num_posts')
        .orderBy('c.created_ts', 'desc');

    // Only apply date filtering if we have dates (not 'all' period)
    if (dateRanges.currentPeriod.start) {
        campaignsQuery = campaignsQuery.where('c.created_ts', '>=', dateRanges.currentPeriod.start);
    }
    
    // Filter campaigns to only include those with posts in our valid post IDs
    if (validPostIds && validPostIds.length > 0) {
        campaignsQuery = campaignsQuery.whereIn('cs.npc_id', validPostIds);
    }

    const campaigns = await campaignsQuery.catch((err) => { if (err) err_code = err.code });
    if (err_code) {
        return [true, {
            metrics: defaultMetrics,
            campaigns: [],
            topPosts: [],
            performance: []
        }];
    }

    // Get top performing posts (using current period dates if applicable)
    let topPostsQuery = knex('Campaign_Submissions as cs')
        .join('Campaigns as c', 'cs.campaign_id', 'c.id')
        .join('Campaign_Submissions_Metrics as csm', 'cs.npc_id', 'csm.npc_id')
        .leftJoin('Creator_Links as cl', function() {
            this.on('cs.clink_id', '=', 'cl.clink_id')
        })
        .leftJoin('Users as u', 'cl.user_id', 'u.id')
        .select(
            'cs.npc_id as id',
            'c.name as campaign_name',
            'cs.submit_ts as created_ts',
            'cs.post_ts AS post_ts',
            'cs.caption',
            'cs.post_url',
            'cs.thumbnail',
            'cl.handle as creator_handle',
            'cl.pfp as creator_pfp',
            'cl.display_name as creator_name',
            'cl.platform as creator_platform',
            'u.name as user_name',
            'u.pfp as user_pfp',
            'csm.views',
            'csm.likes',
            'csm.comments',
            'csm.shares'
        )
        .whereIn('csm.id', function() {
            // Get latest metrics for each post
            let subquery = this.select('m2.id')
                .from('Campaign_Submissions_Metrics as m2')
                .join('Campaign_Submissions_Metrics as m3', function() {
                    this.on('m2.npc_id', '=', 'm3.npc_id')
                        .andOn('m2.recorded_ts', '=', function() {
                            this.select(knex.raw('MAX(m3.recorded_ts)'))
                                .from('Campaign_Submissions_Metrics as m3')
                                .whereRaw('m3.npc_id = m2.npc_id');
                        });
                });
            
            // Filter by valid post IDs if provided
            if (validPostIds && validPostIds.length > 0) {
                subquery = subquery.whereIn('m2.npc_id', validPostIds);
            }
            
            return subquery;
        })
        .orderByRaw('(csm.views + csm.likes * 2 + csm.comments * 3 + csm.shares * 4) DESC')
        .limit(10);

    // Only apply date filtering if we have dates (not 'all' period)
    if (dateRanges.currentPeriod.start) {
        topPostsQuery = topPostsQuery.where('cs.submit_ts', '>=', dateRanges.currentPeriod.start)
                    .where('cs.submit_ts', '<=', dateRanges.currentPeriod.end);
    }

    const topPosts = await topPostsQuery.catch((err) => { if (err) err_code = err.code });
    if (err_code) {
        return [true, {
            metrics: defaultMetrics,
            campaigns: [],
            topPosts: [],
            performance: []
        }];
    }

    // Get performance data
    const performance = await getPerformanceData(
        dateRanges.currentPeriod.start,
        dateRanges.currentPeriod.end,
        period,
        validPostIds
    ).catch((err) => { if (err) err_code = err.code });
    if (err_code) {
        return [true, {
            metrics: defaultMetrics,
            campaigns: [],
            topPosts: [],
            performance: []
        }];
    }

    // Format the response
    const defaultMetrics = {
        total_views: 0,
        prev_total_views: 0,
        total_likes: 0,
        prev_total_likes: 0,
        engagement_rate: 0,
        prev_engagement_rate: 0,
        total_posts: 0,
        prev_total_posts: 0
    };

    const metrics = {
        total_views: currentMetrics?.total_views || 0,
        prev_total_views: prevMetrics?.total_views || 0,
        total_likes: currentMetrics?.total_likes || 0,
        prev_total_likes: prevMetrics?.total_likes || 0,
        engagement_rate: Number(Number(currentMetrics?.engagement_rate || 0).toFixed(2)),
        prev_engagement_rate: Number(Number(prevMetrics?.engagement_rate || 0).toFixed(2)),
        total_posts: currentMetrics?.total_posts || 0,
        prev_total_posts: prevMetrics?.total_posts || 0
    };

    const response = {
        metrics: metrics || defaultMetrics,
        campaigns: campaigns?.map(c => ({
            ...c,
            start_date: c.start_date.toISOString(),
            end_date: c.end_date.toISOString()
        })) || [],
        topPosts: topPosts?.map(p => ({
            ...p,
            created_ts: p.created_ts.toISOString(),
            creator: p.creator_handle ? {
                handle: p.creator_handle,
                name: p.creator_name,
                platform: p.creator_platform,
                // pfp: convertEncodedImage(p.creator_pfp),
                user: p.user_name ? {
                    name: p.user_name,
                    pfp: convertEncodedImage(p.user_pfp)
                } : null
            } : null,
            metrics: {
                views: p.views,
                likes: p.likes,
                comments: p.comments,
                shares: p.shares
            }
        })) || [],
        performance: performance || []
    };

    // Return response
    return [true, response];
}

module.exports = {
    db_getDashboardData
}; 