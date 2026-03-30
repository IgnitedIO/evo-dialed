// Constants
const LOGO_URL = "https://dialed.evomarketing.co/logo192.png";
const BRAND_COLOR = "#E66F47";

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
                    background: #ffffff !important;
                }
                .logo img { 
                    width: 48px;
                    height: 48px;
                    background: #ffffff !important;
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
                .code {
                    background: #f8f9fa;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-family: monospace;
                    font-size: 18px;
                    color: #1a1a1a;
                    display: inline-block;
                    margin: 8px 0;
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
                    <img src="${LOGO_URL}" alt="Evo Dialed Logo">
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    <p>This email was sent by Evo. If you didn't request this email, please ignore it.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Magic Link Email Template
function magicLinkTemplate(code, link) {
    const content = `
        <h2>Sign in to Evo Dialed</h2>
        <p>Click the button below to sign in to your Evo Dialed account:</p>
        <p style="text-align: center;">
            <a href="${link}" class="button">Sign In</a>
        </p>
        <div class="divider"></div>
        <p>Or use this code to sign in:</p>
        <div class="code">${code}</div>
        <p>This link will expire in 10 minutes.</p>
    `;
    return generateEmailHTML("Sign in to Evo Dialed", content);
}

// Password Reset Email Template
function resetPasswordTemplate(code, link) {
    const content = `
        <h2>Reset Your Password</h2>
        <p>Click the button below to reset your password:</p>
        <p style="text-align: center;">
            <a href="${link}" class="button">Reset Password</a>
        </p>
        <div class="divider"></div>
        <p>Or use this code to reset your password:</p>
        <div class="code">${code}</div>
        <p>This link will expire in 10 minutes.</p>
    `;
    return generateEmailHTML("Reset Your Password", content);
}

// Email Change Verification Template
function emailChangeVerificationTemplate(code, link, oldEmail, newEmail) {
    const content = `
        <h2>Confirm Your New Email Address</h2>
        <p>You requested to change your email address from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
        <p>Click the button below to confirm this change:</p>
        <p style="text-align: center;">
            <a href="${link}" class="button">Confirm Email Change</a>
        </p>
        <div class="divider"></div>
        <p>Or use this code to confirm:</p>
        <div class="code">${code}</div>
        <p>This link will expire in 10 minutes.</p>
    `;
    return generateEmailHTML("Confirm Your New Email Address", content);
}

// Workspace Invite Template
function workspaceInviteTemplate(wsName, link) {
    const content = `
        <h2>Join ${wsName} on Evo Dialed</h2>
        <p>You've been invited to join ${wsName} on Evo Dialed.</p>
        <p>Click the button below to accept the invitation:</p>
        <p style="text-align: center;">
            <a href="${link}" class="button">Join Workspace</a>
        </p>
        <p>This invitation will expire in 7 days.</p>
    `;
    return generateEmailHTML(`Join ${wsName} on Evo Dialed`, content);
}

// Creator Invite Template
function creatorInviteTemplate(creatorName, inviteLink, code) {
    const content = `
        <h2>You're invited to join Dialed!</h2>
        <p>Hi ${creatorName},</p>
        <p>You've been invited to join Dialed as a creator! Click the button below to set up your account and get started:</p>
        <p style="text-align: center;">
            <a href="${inviteLink}" class="button">Join Dialed</a>
        </p>
        <div class="divider"></div>
        <p>Or use this code to accept your invitation:</p>
        <div class="code">${code}</div>
        <p>This invitation will expire in 7 days.</p>
    `;
    return generateEmailHTML("Welcome to Dialed!", content);
}

module.exports = {
    magicLinkTemplate,
    resetPasswordTemplate,
    emailChangeVerificationTemplate,
    workspaceInviteTemplate,
    creatorInviteTemplate
}; 