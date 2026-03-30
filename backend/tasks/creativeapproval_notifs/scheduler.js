const { creativeApprovalNotifsQueue } = require('./queue.js');

// Schedule the creative approval rejection follow-up job
async function scheduleCreativeApprovalNotifs() {
    try {
        await creativeApprovalNotifsQueue.add(
            'daily-rejection-followup',
            {},
            {
                repeat: {
                    pattern: '0 10 * * *', // 10:00 AM every day
                    tz: 'America/New_York' // EDT/EST (adjusts automatically)
                }
            }
        );
        console.log('✅ Creative approval rejection follow-up scheduled for 10:00 AM EDT daily');
    } catch (error) {
        console.error('Failed to schedule creative approval notifications:', error);
    }
}

// Function to remove the recurring job (useful for testing)
async function removeCreativeApprovalNotifs() {
    try {
        const jobs = await creativeApprovalNotifsQueue.getRepeatableJobs();
        for (const job of jobs) {
            if (job.name === 'daily-rejection-followup') {
                await creativeApprovalNotifsQueue.removeRepeatableByKey(job.key);
                console.log('✅ Removed creative approval notification schedule');
            }
        }
    } catch (error) {
        console.error('Failed to remove creative approval notification schedule:', error);
    }
}

module.exports = {
    scheduleCreativeApprovalNotifs,
    removeCreativeApprovalNotifs
};