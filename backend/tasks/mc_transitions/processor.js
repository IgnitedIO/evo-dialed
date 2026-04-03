const { Worker } = require('bullmq');
const { db_getRenewalThreshold, db_getActiveCampaignsForTransition, db_transitionToRenewal } = require('./funs_db.js');

const Redis = require('ioredis');
const BULLMQ_REDIS = new Redis({
    host: process.env.CACHE_SERVER_HOSTNAME,
    port: process.env.CACHE_SERVER_PORT,
    maxRetriesPerRequest: null
});

async function processMCTransitions(job) {
    try {
        console.log('Checking campaign transitions...');

        const threshold = await db_getRenewalThreshold();
        const campaigns = await db_getActiveCampaignsForTransition();

        if (campaigns.length === 0) {
            console.log('No active campaigns to check');
            return { success: true, transitioned: 0 };
        }

        let transitioned = 0;

        for (const campaign of campaigns) {
            if (campaign.totalExpected > 0 && campaign.pct >= threshold.min) {
                console.log(`  Campaign "${campaign.name}" at ${campaign.pct}% (threshold: ${threshold.min}%) — transitioning to renewal`);
                const ok = await db_transitionToRenewal(campaign.id);
                if (ok) transitioned++;
            }
        }

        console.log(`MC transitions complete: ${transitioned} campaign(s) moved to renewal`);
        return { success: true, checked: campaigns.length, transitioned };
    } catch (error) {
        console.error('Error processing MC transitions:', error);
        throw error;
    }
}

const worker = new Worker('mc-campaign-transitions', processMCTransitions, {
    connection: BULLMQ_REDIS
});

worker.on('completed', (job) => {
    console.log(`MC transition job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.error(`MC transition job ${job?.id} failed:`, err);
});

module.exports = { worker, processMCTransitions };
