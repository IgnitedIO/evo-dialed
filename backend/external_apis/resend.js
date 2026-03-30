// Dependencies
const { Resend } = require('resend');

// Initialize Resend client
function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn('Resend API key not available: Missing API key');
        return null;
    }
    
    try {
        return new Resend(apiKey);
    } catch (error) {
        console.warn('Resend API key not available:', error.message);
        return null;
    }
}

// Template Imports
const {
    magicLinkTemplate,
    resetPasswordTemplate,
    emailChangeVerificationTemplate,
    workspaceInviteTemplate,
    creatorInviteTemplate
} = require('./resend_templates/auth_emails');

const {
    creativeRejectionInstantTemplate,
    creativeApprovalInstantTemplate,
    creativeRejectionFollowupTemplate
} = require('./resend_templates/creative_approval_emails');

// Constants
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@dialedevo.evomarketing.co';
const REPLYTO_EMAIL = process.env.RESEND_REPLYTO_EMAIL || 'support@dialedevo.evomarketing.co';

// Helper Functions
function generateMagicLinkUrl(email, code) {
    return `${process.env.FRONTEND_URL_PREFIX}/magic-link?email=${encodeURIComponent(email)}&code=${code}`;
}

function generatePasswordResetUrl(email, code) {
    return `${process.env.FRONTEND_URL_PREFIX}/reset-password?email=${encodeURIComponent(email)}&code=${code}`;
}

function generateEmailVerificationUrl(email, code) {
    return `${process.env.FRONTEND_URL_PREFIX}/verify-email?email=${encodeURIComponent(email)}&code=${code}`;
}

function generateCreatorInviteUrl(email, code, isAlreadyCreated=false) {
    if (isAlreadyCreated) {
        return `${process.env.FRONTEND_URL_PREFIX}/join-invite?email=${encodeURIComponent(email)}&code=${code}`;
    }
    return `${process.env.FRONTEND_URL_PREFIX}/accept-invite?email=${encodeURIComponent(email)}&code=${code}`;
}

/**
 * Generate a random 6-digit code
 */
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send magic link email
 */
async function resend_sendMagicLinkEmail(email, code) {
    const resend = getResendClient();
    if (!resend) {
        console.warn('Resend not initialized, skipping email send');
        return { success: true, data: { id: 'mock-email-id' } };
    }
    
    try {
        const magicLink = generateMagicLinkUrl(email, code);
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [email],
            replyTo: REPLYTO_EMAIL,
            subject: 'Sign in to Evo Dialed',
            html: magicLinkTemplate(code, magicLink)
        });

        if (error) {
            console.error('Resend error:', error);
            return { error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email send error:', error);
        return { error: error.message };
    }
}

/**
 * Send password reset email
 */
async function resend_sendResetPasswordEmail(email, code) {
    const resend = getResendClient();
    if (!resend) {
        console.warn('Resend not initialized, skipping email send');
        return { success: true, data: { id: 'mock-email-id' } };
    }
    
    try {
        const resetLink = generatePasswordResetUrl(email, code);
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [email],
            replyTo: REPLYTO_EMAIL,
            subject: 'Reset Your Password',
            html: resetPasswordTemplate(code, resetLink)
        });

        if (error) {
            console.error('Resend error:', error);
            return { error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email send error:', error);
        return { error: error.message };
    }
}

/**
 * Send creative rejection notification email
 */
async function resend_sendCreativeRejectedEmail(creatorEmail, creatorName, campaignName, campaignId, feedbackNotes) {
    return { success: true, data: {} };
    // const resend = getResendClient();
    // if (!resend) {
    //     console.warn('Resend not initialized, skipping email send');
    //     return { success: true, data: { id: 'mock-email-id' } };
    // }

    // try {
    //     const dashboardLink = `${process.env.FRONTEND_URL_PREFIX}/creatives`;
    //     const { data, error } = await resend.emails.send({
    //         from: FROM_EMAIL,
    //         to: [creatorEmail],
    //         replyTo: REPLYTO_EMAIL,
    //         subject: `Creative Rejected - ${campaignName}`,
    //         html: creativeRejectionInstantTemplate(campaignName, feedbackNotes, dashboardLink)
    //     });

    //     if (error) {
    //         console.error('Resend error:', error);
    //         return { error: error.message };
    //     }

    //     return { success: true, data };
    // } catch (error) {
    //     console.error('Email send error:', error);
    //     return { error: error.message };
    // }
}

/**
 * Send creative approval notification email
 */
async function resend_sendCreativeApprovedEmail(creatorEmail, creatorName, campaignName, campaignId, feedbackNotes=null) {
    return { success: true, data: {} };
    // const resend = getResendClient();
    // if (!resend) {
    //     console.warn('Resend not initialized, skipping email send');
    //     return { success: true, data: { id: 'mock-email-id' } };
    // }

    // try {
    //     const dashboardLink = `${process.env.FRONTEND_URL_PREFIX}/creatives`;
    //     const { data, error } = await resend.emails.send({
    //         from: FROM_EMAIL,
    //         to: [creatorEmail],
    //         replyTo: REPLYTO_EMAIL,
    //         subject: `Creative Approved - ${campaignName}`,
    //         html: creativeApprovalInstantTemplate(campaignName, dashboardLink, feedbackNotes)
    //     });

    //     if (error) {
    //         console.error('Resend error:', error);
    //         return { error: error.message };
    //     }

    //     return { success: true, data };
    // } catch (error) {
    //     console.error('Email send error:', error);
    //     return { error: error.message };
    // }
}

/**
 * Send creative rejection follow-up notification email
 */
async function resend_sendCreativeRejectionFollowupEmail(creatorEmail, creatorName, campaignName, feedbackNotes) {
    return { success: true, data: {} };
    // const resend = getResendClient();
    // if (!resend) {
    //     console.warn('Resend not initialized, skipping email send');
    //     return { success: true, skipped: true };
    // }

    // try {
    //     const dashboardLink = `${process.env.FRONTEND_URL_PREFIX}/creatives`;
    //     const { data, error } = await resend.emails.send({
    //         from: FROM_EMAIL,
    //         to: [creatorEmail],
    //         replyTo: REPLYTO_EMAIL,
    //         subject: `Action Needed - ${campaignName}`,
    //         html: creativeRejectionFollowupTemplate(campaignName, feedbackNotes, dashboardLink)
    //     });

    //     if (error) {
    //         console.error('Resend error:', error);
    //         return { success: false, error: error.message };
    //     }

    //     return { success: true, data };
    // } catch (error) {
    //     console.error('Email send error:', error);
    //     return { success: false, error: error.message };
    // }
}

/**
 * Send creator invitation email
 */
async function resend_sendCreatorInviteEmail(email, name, code, isAlreadyCreated=false) {
    const resend = getResendClient();
    if (!resend) {
        console.warn('Resend not initialized, skipping email send');
        return { success: true, data: { id: 'mock-email-id' } };
    }

    try {
        const inviteLink = generateCreatorInviteUrl(email, code, isAlreadyCreated);
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [email],
            replyTo: REPLYTO_EMAIL,
            subject: 'Welcome to Evo Dialed',
            html: creatorInviteTemplate(name, inviteLink, code)
        });
        if (error) {
            console.error('Resend error (full):', JSON.stringify(error, null, 2));
            return { error: error.message };
        }
        return { success: true, data };
    } catch (error) {
        console.error('Email send error (full):', JSON.stringify(error, null, 2));
        return { error: error.message };
    }
}

// Export functions
module.exports = {
    generateCode,
    resend_sendMagicLinkEmail,
    resend_sendResetPasswordEmail,
    resend_sendCreativeApprovedEmail,
    resend_sendCreativeRejectedEmail,
    resend_sendCreativeRejectionFollowupEmail,
    resend_sendCreatorInviteEmail
}; 