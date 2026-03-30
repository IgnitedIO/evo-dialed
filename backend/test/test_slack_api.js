require('dotenv').config();
const { send10kViewsAlert } = require('./external_apis/slack.js');

async function testSlackAPI() {
    console.log('🧪 Testing 10k+ views alert only...');

    // Test: 10k+ Views Alert with button
    const mockPostData = {
        campaign_name: "Pumpfun Campaign",
        creator_name: "Shai Gilgeous Alexander",
        creator_handle: "shai",
        platform: "tt",
        post_url: "https://www.tiktok.com/@shai/video/123456789"
    };

    try {
        const alertResult = await send10kViewsAlert(mockPostData);
        if (alertResult.success) {
            console.log('✅ 10k+ views alert sent successfully!');
        } else {
            console.error('❌ 10k+ views alert failed:', alertResult.error);
        }
    } catch (error) {
        console.error('❌ 10k+ views alert error:', error.message);
    }
}

testSlackAPI(); 