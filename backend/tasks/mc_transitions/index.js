const { scheduleMCTransitions } = require('./scheduler.js');
const { worker } = require('./processor.js');

async function initializeMCTransitions() {
    try {
        await scheduleMCTransitions();
        console.log('MC campaign transitions system initialized');
    } catch (error) {
        console.error('Failed to initialize MC transitions system:', error);
    }
}

module.exports = { initializeMCTransitions, worker };
