// Dependencies
const cron = require('node-cron');

// Queue Imports
const { instagramQueue, tiktokQueue } = require('./queue');

// Function to schedule metrics scraping
function scheduleMetricsScraping() {
    // Schedule Instagram metrics scraping every 3 hours
    cron.schedule('0 */3 * * *', async () => {
        console.log('Scheduling Instagram metrics scraping...');
        try {
            await instagramQueue.add('instagram-metrics-daily', {}, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000 // Start with 1 second delay
                }
            });
            console.log('Instagram metrics scraping job added to queue');
        } catch (error) {
            console.error('Error scheduling Instagram metrics scraping:', error);
        }
    });

    // Schedule TikTok metrics scraping every 3 hours
    cron.schedule('0 */3 * * *', async () => {
        console.log('Scheduling TikTok metrics scraping...');
        try {
            await tiktokQueue.add('tiktok-metrics-daily', {}, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000 // Start with 1 second delay
                }
            });
            console.log('TikTok metrics scraping job added to queue');
        } catch (error) {
            console.error('Error scheduling TikTok metrics scraping:', error);
        }
    });

    console.log('Metrics scraping scheduler initialized');
}

// Export
module.exports = {
    scheduleMetricsScraping
}; 