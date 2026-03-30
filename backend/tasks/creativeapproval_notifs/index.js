const { scheduleCreativeApprovalNotifs } = require('./scheduler.js');
const { worker } = require('./processor.js');

// Initialize the creative approval notifications system
async function initializeCreativeApprovalNotifs() {
    try {
        // Schedule the recurring job
        await scheduleCreativeApprovalNotifs();
        console.log('Creative approval notifications system initialized successfully');
    } catch (error) {
        console.error('Failed to initialize creative approval notifications system:', error);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down creative approval notifications system...');
    await worker.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down creative approval notifications system...');
    await worker.close();
    process.exit(0);
});

// Export for use in main app
module.exports = {
    initializeCreativeApprovalNotifs,
    worker
};

// If this file is run directly, initialize the system
if (require.main === module) {
    initializeCreativeApprovalNotifs();
}