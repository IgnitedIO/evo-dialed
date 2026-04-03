const { mcTransitionsQueue } = require('./queue.js');

async function scheduleMCTransitions() {
    try {
        await mcTransitionsQueue.add(
            'check-campaign-transitions',
            {},
            {
                repeat: {
                    pattern: '*/30 * * * *', // Every 30 minutes
                    tz: 'America/New_York'
                }
            }
        );
        console.log('MC campaign transitions scheduled every 30 minutes');
    } catch (error) {
        console.error('Failed to schedule MC transitions:', error);
    }
}

async function removeMCTransitions() {
    try {
        const jobs = await mcTransitionsQueue.getRepeatableJobs();
        for (const job of jobs) {
            if (job.name === 'check-campaign-transitions') {
                await mcTransitionsQueue.removeRepeatableByKey(job.key);
                console.log('Removed MC transitions schedule');
            }
        }
    } catch (error) {
        console.error('Failed to remove MC transitions schedule:', error);
    }
}

module.exports = { scheduleMCTransitions, removeMCTransitions };
