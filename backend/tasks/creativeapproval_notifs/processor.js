// Dependencies
const { Worker } = require('bullmq');

// Email Imports
const { resend_sendCreativeRejectionFollowupEmail } = require('../../external_apis/resend.js');

// DB Imports
const { db_getRejectedCreativesForNotification } = require('./funs_db.js');

// Create a separate Redis connection for BullMQ with its specific requirements
const Redis = require('ioredis');
const BULLMQ_REDIS = new Redis({
    host: process.env.CACHE_SERVER_HOSTNAME,
    port: process.env.CACHE_SERVER_PORT,
    maxRetriesPerRequest: null // Required by BullMQ
});

/**
 * Process the creative approval rejection follow-up job
 */
async function processCreativeApprovalNotifs(job) {
    try {
        console.log('📧 Starting creative approval rejection follow-up job...');

        // Get all rejected creatives that need follow-up
        const rejectedCreatives = await db_getRejectedCreativesForNotification();

        if (!rejectedCreatives || rejectedCreatives.length === 0) {
            console.log('✅ No rejected creatives requiring follow-up');
            return { success: true, emailsSent: 0 };
        }

        console.log(`📬 Found ${rejectedCreatives.length} rejected creative(s) requiring follow-up`);

        let successCount = 0;
        let failureCount = 0;
        let skippedCount = 0;

        // Send email to each creator
        for (const creative of rejectedCreatives) {
            const {
                creative_id,
                user_email,
                user_name,
                campaign_name,
                feedback_notes
            } = creative;

            console.log(`  → Sending follow-up to ${user_email} for creative #${creative_id} (${campaign_name})`);

            const result = await resend_sendCreativeRejectionFollowupEmail(
                user_email,
                user_name,
                campaign_name,
                feedback_notes
            );

            if (result.success) {
                if (result.skipped) {
                    skippedCount++;
                    console.log(`    ⏭️  Skipped (Resend not configured)`);
                } else {
                    successCount++;
                    console.log(`    ✅ Sent successfully`);
                }
            } else {
                failureCount++;
                console.error(`    ❌ Failed: ${result.error}`);
            }
        }

        console.log(`\n📊 Summary: ${successCount} sent, ${failureCount} failed, ${skippedCount} skipped`);

        return {
            success: true,
            totalCreatives: rejectedCreatives.length,
            emailsSent: successCount,
            emailsFailed: failureCount,
            emailsSkipped: skippedCount
        };
    } catch (error) {
        console.error('Error processing creative approval notifications:', error);
        throw error; // Re-throw to mark job as failed
    }
}

// Create the worker
const worker = new Worker('creative-approval-notifs', processCreativeApprovalNotifs, {
    connection: BULLMQ_REDIS
});

// Worker event handlers
worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});

module.exports = {
    worker,
    processCreativeApprovalNotifs
};