// Constants
const LOGO_URL = "https://framerusercontent.com/images/j1dlu6n1FvSy6zdyfLKzd5meUc.png";
const BRAND_COLOR = "#C6630D";

// Helper function to generate email HTML with common styling
function generateEmailHTML(title, content) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #F9FAFB;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 40px 20px;
                }
                .logo {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo img {
                    width: 60px;
                    height: 49px;
                }
                .content {
                    background: #FFFFFF;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                h2 {
                    color: #1a1a1a;
                    margin-top: 0;
                    font-size: 24px;
                    font-weight: 600;
                }
                p {
                    margin: 16px 0;
                    color: #4a4a4a;
                }
                .button {
                    display: inline-block;
                    font-size: 16px !important;
                    padding: 14px 28px;
                    background: ${BRAND_COLOR};
                    color: #FFFFFF !important;
                    text-decoration: none;
                    border-radius: 8px;
                    margin: 24px 0;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }
                .button:hover {
                    background: #d45a3a;
                }
                .feedback-box {
                    background: #f8f9fa;
                    padding: 16px 20px;
                    border-left: 4px solid ${BRAND_COLOR};
                    border-radius: 4px;
                    margin: 20px 0;
                }
                .feedback-box strong {
                    color: #1a1a1a;
                    display: block;
                    margin-bottom: 8px;
                }
                .success-badge {
                    display: inline-block;
                    background: #10b981;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 16px;
                }
                .needs-revision-badge {
                    display: inline-block;
                    background: #f59e0b;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 16px;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 13px;
                    color: #666;
                }
                .divider {
                    height: 1px;
                    background: #eee;
                    margin: 30px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <img src="${LOGO_URL}" alt="Evo Dialed Logo" style="background-color: #ffffff;">
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    <p>This email was sent by Evo. If you have questions, please contact support.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Creative Rejection Instant Notification Email Template
function creativeRejectionInstantTemplate(campaignName, feedbackNotes, dashboardLink) {
    const content = `
        <h2>Creative Rejected</h2>
        <p>Your creative for <span class="campaign-name">${campaignName}</span> has been reviewed and requires changes.</p>

        <div class="feedback-box">
            <p><strong>Feedback:</strong></p>
            <p>${feedbackNotes || 'No specific feedback provided.'}</p>
        </div>

        <p>Please review the feedback and resubmit your creative with the requested changes.</p>

        <p style="text-align: center;">
            <a href="${dashboardLink}" class="button">View & Resubmit Creative</a>
        </p>

        <div class="divider"></div>

        <p style="font-size: 14px; color: #666;">
            <strong>Need help?</strong> If you have questions about the feedback or need assistance, please reach out to your campaign manager.
        </p>
    `;
    return generateEmailHTML("Creative Rejected", content);
}

// Creative Approval Instant Notification Email Template
function creativeApprovalInstantTemplate(campaignName, dashboardLink, feedbackNotes=null) {
    const content = `
        <h2>Creative Approved! 🎉</h2>
        <p>Great news! Your creative for <span class="campaign-name">${campaignName}</span> has been approved.</p>

        ${(feedbackNotes && feedbackNotes.length > 0) ? `
            <div class="feedback-box">
                <p><strong>Feedback:</strong></p>
                <p>${feedbackNotes}</p>
            </div>
        ` : ''}

        <p>You can now proceed with publishing your content according to the campaign guidelines.</p>

        <p style="text-align: center;">
            <a href="${dashboardLink}" class="button">View Creative</a>
        </p>

        <div class="divider"></div>

        <p style="font-size: 14px; color: #666;">
            <strong>Thank you!</strong> We're excited to see your content go live.
        </p>
    `;
    return generateEmailHTML("Creative Approved", content);
}

// Creative Rejection Follow-up Email Template (for daily reminders)
function creativeRejectionFollowupTemplate(campaignName, feedbackNotes, dashboardLink) {
    const content = `
        <h2>Action Needed</h2>
        <p>Your creative for <span class="campaign-name">${campaignName}</span> was rejected and is awaiting resubmission.</p>

        <div class="feedback-box">
            <p><strong>Feedback:</strong></p>
            <p>${feedbackNotes || 'No specific feedback provided.'}</p>
        </div>

        <p>Please review the feedback and resubmit your creative when you're ready.</p>

        <p style="text-align: center;">
            <a href="${dashboardLink}" class="button">View & Resubmit Creative</a>
        </p>

        <div class="divider"></div>

        <p style="font-size: 14px; color: #666;">
            <strong>Need help?</strong> If you have questions about the feedback or need assistance, please reach out to your campaign manager.
        </p>
    `;
    return generateEmailHTML("Action Needed", content);
}

module.exports = {
    creativeRejectionInstantTemplate,
    creativeApprovalInstantTemplate,
    creativeRejectionFollowupTemplate
};