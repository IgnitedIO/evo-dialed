const { metricsSlackQueue } = require('./queue.js');

// Schedule the metrics Slack report job
async function scheduleMetricsSlackReport() {
    try {
        // First, remove any existing duplicate jobs
        await removeMetricsSlackReport();
        
        // Then schedule the new job
        await metricsSlackQueue.add(
            'daily-metrics-report',
            {},
            {
                repeat: {
                    pattern: '0 9 * * *', 
                    tz: 'America/New_York'
                }
            }
        );
        
        console.log('✅ Metrics Slack report scheduled for 9 AM ET');
    } catch (error) {
        console.error('❌ Failed to schedule metrics Slack report:', error);
    }
}

// Function to remove the recurring job (useful for testing)
async function removeMetricsSlackReport() {
    try {
        const jobs = await metricsSlackQueue.getRepeatableJobs();
        let removedCount = 0;
        
        for (const job of jobs) {
            if (job.name === 'daily-metrics-report') {
                await metricsSlackQueue.removeRepeatable('daily-metrics-report', {
                    pattern: job.pattern,
                    tz: job.tz
                });
                removedCount++;
                console.log(`🗑️  Removed duplicate job: ${job.key}`);
            }
        }
        
        if (removedCount > 0) {
            console.log(`✅ Removed ${removedCount} duplicate Slack report job(s)`);
        }
    } catch (error) {
        console.error('❌ Failed to remove metrics Slack report schedule:', error);
    }
}

module.exports = {
    scheduleMetricsSlackReport,
    removeMetricsSlackReport
}; 