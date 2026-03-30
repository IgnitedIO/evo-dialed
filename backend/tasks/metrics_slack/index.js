const { scheduleMetricsSlackReport } = require('./scheduler.js');
const { worker } = require('./processor.js');

// Initialize the metrics Slack reporting system
async function initializeMetricsSlackSystem() {
    try {        
        // Schedule the recurring job
        await scheduleMetricsSlackReport();
        console.log('Metrics Slack reporting system initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize Metrics Slack reporting system:', error);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down Metrics Slack reporting system...');
    await worker.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down Metrics Slack reporting system...');
    await worker.close();
    process.exit(0);
});

// Export for use in main app
module.exports = {
    initializeMetricsSlackSystem,
    worker
};

// If this file is run directly, initialize the system
if (require.main === module) {
    initializeMetricsSlackSystem();
} 