const axios = require('axios');

// Format metrics data for Slack message with real buttons
function formatSlackMessage(contentPerformance) {
    // Get the date range from the content
    let reportDate = new Date();
    if (contentPerformance && contentPerformance.length > 0) {
        // Use the most recent post date
        const dates = contentPerformance
            .map(item => new Date(item.post_ts || item.created_ts))
            .filter(date => !isNaN(date.getTime()));
        if (dates.length > 0) {
            reportDate = new Date(Math.max(...dates));
        }
    }

    const blocks = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: `Daily Content Performance Report - ${reportDate.toLocaleDateString()}`,
                emoji: true
            }
        },
        {
            type: "divider"
        }
    ];

    // Add top 3 content performance items
    if (contentPerformance && contentPerformance.length > 0) {
        contentPerformance.slice(0, 3).forEach((item, index) => {
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
            
            // Extract the relevant data fields
            const title = item.caption || item.campaign_name || `Post ${index + 1}`;
            const views = item.views || 0;
            const likes = item.likes || 0;
            const comments = item.comments || 0;
            const shares = item.shares || 0;
            const creator = item.creator_name || item.creator_handle || 'Unknown Creator';
            const creatorHandle = item.creator_handle || '';
            const postUrl = item.post_url || null;
            
            // Get platform
            const platform = item.creator_platform || item.platform || 'unknown';
            const platformText = platform === 'ig' ? 'Instagram' : platform === 'tt' ? 'TikTok' : 'Unknown';
            
            // Create the main section with title and inline button
            const titleText = `${medal} ${title}`;
            const buttonText = postUrl ? ` <${postUrl}|View Post>` : '';
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: titleText + buttonText
                }
            });
            
            // Add creator info on separate line
            const creatorDisplay = creatorHandle ? `${creator} (@${creatorHandle})` : creator;
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `${creatorDisplay} | ${platformText}`
                }
            });
            
            // Add metrics in a 2x2 grid
            blocks.push({
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*Views:* ${views.toLocaleString()}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Likes:* ${likes.toLocaleString()}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Comments:* ${comments.toLocaleString()}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Shares:* ${shares.toLocaleString()}`
                    }
                ]
            });
            
            // Add divider between posts (except after the last one)
            if (index < Math.min(2, contentPerformance.length - 1)) {
                blocks.push({
                    type: "divider"
                });
            }
        });
    } else {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: "No content performance data available for the last 24 hours."
            }
        });
    }

    blocks.push({
        type: "context",
        elements: [
            {
                type: "mrkdwn",
                text: `Report created at ${reportDate.toLocaleString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true,
                    timeZone: 'America/New_York',
                    timeZoneName: 'short'
                })}, ${reportDate.toLocaleString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    timeZone: 'America/New_York'
                })}`
            }
        ]
    });

    return {
        text: "Daily Content Performance Report",
        blocks: blocks
    };
}

// Format 10k+ views alert message with button
function format10kViewsAlert(postData) {
    const platform = postData.platform === 'ig' ? 'Instagram' : 'TikTok';
    const timestamp = new Date().toLocaleString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true,
        timeZone: 'America/New_York',
        timeZoneName: 'short'
    });

    const blocks = [
        { type: "divider" },
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "🚨 10k+ Views Alert",
                emoji: true
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Caption:* ${postData.caption ? postData.caption : '(none)'}`
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Campaign:* ${postData.campaign_name}\n*Creator:* ${postData.creator_name} (@${postData.creator_handle})\n*Platform:* ${platform}`
            },
            accessory: {
                type: "button",
                text: {
                    type: "plain_text",
                    text: "View Post",
                    emoji: true
                },
                url: postData.post_url,
                style: "primary"
            }
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: `Alert sent at ${timestamp}`
                }
            ]
        }
    ];

    return {
        text: `10k+ Views Alert: ${postData.campaign_name} - ${postData.creator_name}`,
        blocks: blocks
    };
}

// Webhook fallback formatting with real buttons using Block Kit
function formatSlackMessageWebhook(contentPerformance) {
    const blocks = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: `Daily Content Performance Report - ${new Date().toLocaleDateString()}`,
                emoji: true
            }
        },
        {
            type: "divider"
        }
    ];

    // Add top 3 content performance items
    if (contentPerformance && contentPerformance.length > 0) {
        contentPerformance.slice(0, 3).forEach((item, index) => {
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
            
            // Extract the relevant data fields
            const title = item.caption || item.campaign_name || `Post ${index + 1}`;
            const views = item.views || 0;
            const likes = item.likes || 0;
            const comments = item.comments || 0;
            const shares = item.shares || 0;
            const creator = item.creator_name || item.creator_handle || 'Unknown Creator';
            const creatorHandle = item.creator_handle || '';
            const postUrl = item.post_url || null;
            
            // Get platform
            const platform = item.creator_platform || item.platform || 'unknown';
            const platformText = platform === 'ig' ? 'Instagram' : platform === 'tt' ? 'TikTok' : 'Unknown';
            
            // Create the main section with title and inline button
            const titleText = `${medal} ${title}`;
            const buttonText = postUrl ? ` <${postUrl}|View Post>` : '';
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: titleText + buttonText
                }
            });
            
            // Add creator info on separate line
            const creatorDisplay = creatorHandle ? `${creator} (@${creatorHandle})` : creator;
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `${creatorDisplay} | ${platformText}`
                }
            });
            
            // Add metrics in a 2x2 grid
            blocks.push({
                type: "section",
                fields: [
                    {
                        type: "mrkdwn",
                        text: `*Views:* ${views.toLocaleString()}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Likes:* ${likes.toLocaleString()}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Comments:* ${comments.toLocaleString()}`
                    },
                    {
                        type: "mrkdwn",
                        text: `*Shares:* ${shares.toLocaleString()}`
                    }
                ]
            });
            
            // Add divider between posts (except after the last one)
            if (index < Math.min(2, contentPerformance.length - 1)) {
                blocks.push({
                    type: "divider"
                });
            }
        });
    } else {
        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: "No content performance data available for the last 24 hours."
            }
        });
    }

    blocks.push({
        type: "context",
        elements: [
            {
                type: "mrkdwn",
                text: `Report created at ${new Date().toLocaleString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true,
                    timeZone: 'America/New_York',
                    timeZoneName: 'short'
                })}, ${new Date().toLocaleString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    timeZone: 'America/New_York'
                })}`
            }
        ]
    });

    return {
        text: "Daily Content Performance Report",
        blocks: blocks
    };
}

// Webhook fallback formatting for 10k+ views alert with real button
function format10kViewsAlertWebhook(postData) {
    // Use the same design as format10kViewsAlert for consistency
    return format10kViewsAlert(postData);
}

// Send message to Slack using webhook 
async function sendSlackMessage(contentPerformance) {
    try {        
        // Use webhook
        if (process.env.SLACK_WEBHOOK_URL) {
            console.log('📝 Formatting Slack message...');
            const message = formatSlackMessageWebhook(contentPerformance);
            console.log('📤 Sending to Slack webhook:', process.env.SLACK_WEBHOOK_URL);
            console.log('Message:', JSON.stringify(message, null, 2));
            
            const response = await axios.post(process.env.SLACK_WEBHOOK_URL, message, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            console.log('📬 Slack response:', response.status, response.statusText);
            console.log('Response data:', response.data);
            
            return { success: true, response: response.data };
        }
        
        throw new Error('No Slack webhook URL configured');
    } catch (error) {
        console.error('❌ Failed to send Slack message:', error.message);
        if (error.response) {
            console.error('Error response:', {
                status: error.response.status,
                data: error.response.data
            });
        }
        return { success: false, error: error.message };
    }
}

// Send 10k+ views alert to Slack using webhook 
async function send10kViewsAlert(postData) {
    try {
        // Use webhook
        if (process.env.SLACK_WEBHOOK_URL) {
            const message = format10kViewsAlertWebhook(postData);
            const response = await axios.post(process.env.SLACK_WEBHOOK_URL, message, {
                headers: { 'Content-Type': 'application/json' }
            });
            return { success: true, response: response.data };
        }
        
        throw new Error('No Slack configuration found (neither bot token nor webhook URL)');
    } catch (error) {
        console.error('❌ Failed to send 10k+ views alert:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendSlackMessage,
    formatSlackMessage,
    send10kViewsAlert,
    format10kViewsAlert
}; 