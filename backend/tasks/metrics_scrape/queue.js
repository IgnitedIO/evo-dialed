// Dependencies
const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

// Redis connection
const connection = new Redis(process.env.CACHE_SERVER_HOSTNAME, {
    port: process.env.CACHE_SERVER_PORT,
    maxRetriesPerRequest: null
});

// Queue names
const QUEUE_NAMES = {
    INSTAGRAM_METRICS: 'instagram-metrics',
    TIKTOK_METRICS: 'tiktok-metrics'
};

// Create queues
const instagramQueue = new Queue(QUEUE_NAMES.INSTAGRAM_METRICS, { connection });
const tiktokQueue = new Queue(QUEUE_NAMES.TIKTOK_METRICS, { connection });

// Queue options
const queueOptions = {
    removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 100 // Keep last 100 completed jobs
    },
    removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        count: 500 // Keep last 500 failed jobs
    }
};

// Export
module.exports = {
    instagramQueue,
    tiktokQueue,
    QUEUE_NAMES,
    queueOptions,
    redisConnection: connection
}; 