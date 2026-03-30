// Dependencies
const { Worker } = require('bullmq');

// Function Imports
const {
    metricsSlackQueue
} = require('./queue.js');
const {
    sendSlackMessage
} = require('./slack.js');
const {
    db_getTopContent
} = require('../../routes/internal/metrics/funs_db_metrics.js');

// Create a separate Redis connection for BullMQ with its specific requirements
const Redis = require('ioredis');
const BULLMQ_REDIS = new Redis({ 
    host: process.env.CACHE_SERVER_HOSTNAME, 
    port: process.env.CACHE_SERVER_PORT,
    maxRetriesPerRequest: null // Required by BullMQ
});

// Process the metrics Slack report job
async function processMetricsSlackReport(job) {
    try {
        // Get start and end dates for last 24 hours
        // Use same calculation as regular metrics API for "24h" period
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setHours(startDate.getHours() - 24); 

        console.log('Fetching metrics for period:', {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });

        // Get top content for last 24 hours
        // Set filterBySubmissionDate to true to show posts CREATED in the last 24h (strict filter)
        // This shows performance of fresh content only, not old content with recent activity
        const contentData = await db_getTopContent(
            startDate,
            endDate,
            null, // campaignIds
            null, // creatorIds
            true, // filterBySubmissionDate - show posts CREATED in last 24h (strict filter)
            10    // limit to top 10 posts
        );

        // Extract content performance data
        const contentPerformance = contentData.data || [];
        
        console.log('Found content:', {
            totalContent: contentPerformance.length,
            content: contentPerformance.map(c => ({
                npc_id: c.npc_id,
                views: c.views,
                post_ts: c.post_ts
            }))
        });

        // Send to Slack
        const slackResult = await sendSlackMessage(contentPerformance);
        
        if (!slackResult.success) {
            throw new Error(`Slack send failed: ${slackResult.error}`);
        }

        console.log('✅ Successfully sent Slack report with', contentPerformance.length, 'posts');
    } catch (error) {
        console.error('❌ Error processing metrics Slack report:', error);
        throw error; // Re-throw to mark job as failed
    }
}

// Create the worker
const worker = new Worker('metrics-slack-report', processMetricsSlackReport, {
    connection: BULLMQ_REDIS
});

module.exports = {
    worker,
    processMetricsSlackReport
}; 