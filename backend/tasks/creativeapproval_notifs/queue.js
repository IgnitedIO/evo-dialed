const { Queue } = require('bullmq');

// Create a separate Redis connection for BullMQ with its specific requirements
const Redis = require('ioredis');
const BULLMQ_REDIS = new Redis({
    host: process.env.CACHE_SERVER_HOSTNAME,
    port: process.env.CACHE_SERVER_PORT,
    maxRetriesPerRequest: null // Required by BullMQ
});

// Create the queue for creative approval rejection notifications
const creativeApprovalNotifsQueue = new Queue('creative-approval-notifs', {
    connection: BULLMQ_REDIS
});

module.exports = { creativeApprovalNotifsQueue };