// Dependencies
const twilio = require('twilio');

// Constants
const FROM_PHONE = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
function getTwilioClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiKeySecret = process.env.TWILIO_API_KEY_SK;

    if (!accountSid || !apiKeySid || !apiKeySecret) {
        console.warn('Twilio credentials not available: Missing Account SID, API Key SID, or API Key Secret');
        return null;
    }

    try {
        return twilio(apiKeySid, apiKeySecret, { accountSid });
    } catch (error) {
        console.warn('Twilio client initialization failed:', error.message);
        return null;
    }
}

/**
 * Send SMS message via Twilio
 * @param {string} recipient_phone - Phone number in E.164 format (e.g., +1234567890)
 * @param {string} msg - Message text to send
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function twilio_sendText(recipient_phone, msg) {
    const client = getTwilioClient();

    if (!client) {
        console.warn('Twilio not initialized, skipping SMS send');
        return { success: true, data: { sid: 'mock-sms-id' } };
    }

    if (!FROM_PHONE) {
        console.error('Twilio phone number not configured');
        return { error: 'Twilio phone number not configured' };
    }

    try {
        const message = await client.messages.create({
            body: msg,
            from: FROM_PHONE,
            to: recipient_phone
        });

        return { success: true, data: { sid: message.sid, status: message.status } };
    } catch (error) {
        console.error('Twilio SMS send error:', error);
        return { error: error.message };
    }
}

/*
* Send notification text for creative approved
* @param {string} recipient_phone - Phone number in E.164 format (e.g., +1234567890)
* @param {string} campaignName - Name of the campaign
* @returns {Promise<{success: boolean, data?: object, error?: string}>}
*/
async function twilio_sendCreativeApprovedText(recipient_phone, campaignName) {
    return { success: true, data: {} };
    // const message = `Your creative for ${campaignName} was approved!`;
    // return await twilio_sendText(recipient_phone, message);
}

/*
* Send notification text for creative rejected
* @param {string} recipient_phone - Phone number in E.164 format (e.g., +1234567890)
* @param {string} campaignName - Name of the campaign
* @param {string} feedbackNotes - Feedback notes from the reviewer
* @returns {Promise<{success: boolean, data?: object, error?: string}>}
*/
async function twilio_sendCreativeRejectedText(recipient_phone, campaignName, feedbackNotes) {
    return { success: true, data: {} };
    // const message = `Your creative for ${campaignName} was rejected. See https://dialed.evomarketing.co/creatives for feedback.`;
    // return await twilio_sendText(recipient_phone, message);
}

/*
* Send notification text for creative rejection followup
* @param {string} recipient_phone - Phone number in E.164 format (e.g., +1234567890)
* @param {string} campaignName - Name of the campaign
* @returns {Promise<{success: boolean, data?: object, error?: string}>}
*/
async function twilio_sendCreativeRejectionFollowupText(recipient_phone, campaignName) {
    return { success: true, data: {} };
    // const message = `Please resubmit your creative for ${campaignName}. See https://dialed.evomarketing.co/creatives for feedback.`;
    // return await twilio_sendText(recipient_phone, message);
}


// Export functions
module.exports = {
    twilio_sendText,
    twilio_sendCreativeApprovedText,
    twilio_sendCreativeRejectedText,
    twilio_sendCreativeRejectionFollowupText
};
