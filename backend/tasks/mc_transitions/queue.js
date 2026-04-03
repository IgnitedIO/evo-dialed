const { Queue } = require('bullmq');

const Redis = require('ioredis');
const BULLMQ_REDIS = new Redis({
    host: process.env.CACHE_SERVER_HOSTNAME,
    port: process.env.CACHE_SERVER_PORT,
    maxRetriesPerRequest: null
});

const mcTransitionsQueue = new Queue('mc-campaign-transitions', {
    connection: BULLMQ_REDIS
});

module.exports = { mcTransitionsQueue };
