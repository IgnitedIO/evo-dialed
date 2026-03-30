// Use the new Slack Web API instead of legacy webhooks
const { sendSlackMessage, send10kViewsAlert } = require('../../external_apis/slack.js');

// Re-export for backward compatibility
module.exports = {
    sendSlackMessage,
    send10kViewsAlert
};

// All functions are now imported from the new Slack Web API module 