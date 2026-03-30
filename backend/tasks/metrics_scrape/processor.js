// Dependencies
const { Worker } = require('bullmq');

// Queue Imports
const { QUEUE_NAMES, queueOptions, redisConnection } = require('./queue');

// Function Imports
const { tasks_instagram_getReelsAnalytics } = require('./instagram');
const { tasks_tiktok_getVideoAnalytics } = require('./tiktok');

// Create Instagram metrics worker
const instagramWorker = new Worker(
    QUEUE_NAMES.INSTAGRAM_METRICS,
    async (job) => {
        console.log(`Processing Instagram metrics job ${job.id}`);
        try {
            await tasks_instagram_getReelsAnalytics();
            return { success: true };
        } catch (error) {
            console.error('Error processing Instagram metrics:', error);
            throw error;
        }
    },
    { connection: redisConnection, ...queueOptions }
);

// Create TikTok metrics worker
const tiktokWorker = new Worker(
    QUEUE_NAMES.TIKTOK_METRICS,
    async (job) => {
        console.log(`Processing TikTok metrics job ${job.id}`);
        try {
            await tasks_tiktok_getVideoAnalytics();
            return { success: true };
        } catch (error) {
            console.error('Error processing TikTok metrics:', error);
            throw error;
        }
    },
    { connection: redisConnection, ...queueOptions }
);

// Handle worker events
[instagramWorker, tiktokWorker].forEach(worker => {
    worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, error) => {
        console.error(`Job ${job.id} failed:`, error);
    });

    worker.on('error', (error) => {
        console.error('Worker error:', error);
    });
});

// Export
module.exports = {
    instagramWorker,
    tiktokWorker
}; 