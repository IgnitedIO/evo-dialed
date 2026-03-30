// Dependencies
const crypto = require('crypto');
const fetch = require('node-fetch');
const querystring = require('querystring');

// Constants
// const TIKTOK_REDIRECT_URI = `${(process.env.NODE_ENV === "development") ? process.env.BACKEND_URL_PREFIX : "https://dialedapi.evomarketing.co/v1"}/creators/integrations/tt/cb`;
const TIKTOK_REDIRECT_URI = "https://dialed.evomarketing.co/wh/tt/connect";

// -------------------
// Utility Functions
// -------------------
 
/**
 * Generates a code verifier and challenge for TikTok OAuth flow
 * @returns {Object} Object containing the codeVerifier and codeChallenge
 */
function generateCodeVerifier() {
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    const base64Digest = crypto.createHash('sha256').update(codeVerifier).digest('base64');
    const codeChallenge = base64Digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return { codeVerifier, codeChallenge };
}

/**
 * Refreshes an expired TikTok access token
 * @param {string} refreshToken The refresh token from the original OAuth flow
 * @returns {Promise<Array>} [success, tokens] Success status and new token data
 */
async function tiktok_refreshTokens(refreshToken) {
    try {
        const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            'body': querystring.stringify({
                'client_key': process.env.TIKTOK_CLIENT_KEY,
                'client_secret': process.env.TIKTOK_CLIENT_SECRET,
                'grant_type': 'refresh_token',
                'refresh_token': refreshToken
            })
        });
        if (!response.ok) throw new Error('Failed to refresh token');
        const tokenData = await response.json();
        return [true, {
            'access_token': tokenData.access_token,
            'refresh_token': tokenData.refresh_token,
        }];

    } catch (error) {
        console.error('Error refreshing tokens:', error);
        return [false, null];
    }
}

/**
 * Wrapper function for TikTok API requests that use access tokens
 * Handles automatic token refresh and retries
 * @param {string} url The API endpoint URL
 * @param {string} method The HTTP method (GET, POST, etc)
 * @param {Object} tokens Object containing access_token and refresh_token
 * @param {Object} additionalHeaders Additional headers to include (optional)
 * @param {Object} body Request body (optional)
 * @returns {Promise<Array>} [success, responseData, tokens] Success status, response data, and tokens used
 */
async function tiktok_wrapRequest(url, method, tokens, additionalHeaders = {}, body = null) {
    let currentTokens = { ...tokens };
    let attempts = 0;
    const MAX_RETRIES = 3;

    while (attempts < MAX_RETRIES) {
        try {
            const headers = {
                'Authorization': `Bearer ${currentTokens.access_token}`,
                ...additionalHeaders
            };

            const requestOptions = {
                'method': method,
                'headers': headers
            };

            if (body) {
                if (headers['Content-Type'] === 'application/x-www-form-urlencoded') requestOptions.body = querystring.stringify(body);
                else requestOptions.body = JSON.stringify(body);
            }

            const response = await fetch(url, requestOptions);

            // If request successful, return data and current tokens
            if (response.status === 200) {
                const data = await response.json();
				// Return successful request
                return [true, data, currentTokens];
            }

            // If unauthorized and we have retries left, try refreshing token
            if (response.status === 401 && attempts < MAX_RETRIES - 1) {
                const [refreshSuccess, newTokens] = await tiktok_refreshTokens(currentTokens.refresh_token);
                if (!refreshSuccess) throw new Error('Token refresh failed');
                currentTokens = newTokens;
                attempts++;
                continue;
            }

            // If we get here, the request failed for a non-401 reason or we're out of retries
            console.log("TT RESP = ", (await response.json()))
            throw new Error(`API request failed with status ${response.status}`);

        } catch (error) {
            if (attempts === MAX_RETRIES - 1) {
                console.error('Error in wrapped request after max retries:', error);
                return [false, null, currentTokens];
            }
            attempts++;
        }
    }

	// Return
    return [false, null, currentTokens];
}




// -------------------
// OAuth Functions
// -------------------

/**
 * Revokes TikTok access token
 * @param {string} accessToken - The user's current TikTok access token
 * @returns {Promise<boolean>} Success status
 */
async function tiktok_revokeAccessToken(accessToken) {
    try {
        const response = await fetch('https://open.tiktokapis.com/v2/oauth/revoke/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'token': accessToken,
                'client_key': process.env.TIKTOK_CLIENT_KEY,
                'client_secret': process.env.TIKTOK_CLIENT_SECRET
            })
        });

        return response.ok;
    } catch (error) {
        console.error('[TikTok] Error revoking access token:', error);
        return false;
    }
}

/**
 * Generates a TikTok OAuth link with token revocation step
 * @param {string} previousAccessToken - The user's previous access token (if available)
 * @returns {Promise<Array>} [success, auth_url, state, codeVerifier]
 */
async function tiktok_getOAuthLink(previousAccessToken = null) {
    try {
        // Revoke token if available
        if (previousAccessToken) {
            const revoked = await tiktok_revokeAccessToken(previousAccessToken);
            console.log(`[TikTok] Token revoked: ${revoked}`);
        }

        const state = crypto.randomBytes(16).toString('hex');
        const { codeVerifier, codeChallenge } = generateCodeVerifier();

        const params = {
            'client_key': process.env.TIKTOK_CLIENT_KEY,
            'response_type': 'code',
            'scope': 'user.info.basic,user.info.profile,user.info.stats,video.list',
            'redirect_uri': TIKTOK_REDIRECT_URI,
            'state': state,
            'code_challenge': codeChallenge,
            'code_challenge_method': 'S256'
        };

        const base_url = 'https://www.tiktok.com/v2/auth/authorize/';
        const auth_url = `${base_url}?${querystring.stringify(params)}`;

        return [true, auth_url, state, codeVerifier];

    } catch (error) {
        console.error('[TikTok] Error generating OAuth link:', error);
        return [false, null, null];
    }
}
 
/**
 * Handles the OAuth callback and exchanges code for access tokens
 * @param {string} code The authorization code from TikTok
 * @param {string} state The state parameter from the callback
 * @param {string} expectedState The original state generated in getOAuthLink
 * @param {string} redirect_uri The same redirect URI used in the authorization request
 * @returns {Promise<Array>} [success, access_token, refresh_token] Success status and token values
 */
async function tiktok_handleCallback(code, received_state, expected_state, codeVerifier) {
    try {
        // Verify state matches to prevent CSRF attacks
        if (received_state !== expected_state) throw new Error('State mismatch - possible CSRF attack');

		// Retrieve access tokens
        const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            'body': querystring.stringify({
                'client_key': process.env.TIKTOK_CLIENT_KEY,
                'client_secret': process.env.TIKTOK_CLIENT_SECRET,
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': TIKTOK_REDIRECT_URI,
                'code_verifier': codeVerifier
            })
        });

        if (!tokenResponse.ok) throw new Error('Failed to get access token');
        const tokenData = await tokenResponse.json();
        return [true, tokenData.access_token, tokenData.refresh_token];
        
    } catch (error) {
        console.error('[TikTok] Error handling OAuth callback:', error);
        return [false, null];
    }
}


// -------------------
// TikTok Functions
// -------------------

/**
 * Retrieves TikTok account details using access token
 * @param {string} access_token The access token from handleCallback
 * @param {string} refresh_token The refresh token from handleCallback
 * @returns {Promise<Array>} [success, userData, tokens] Success status, user details, and current tokens
 */
async function tiktok_getAccountDetails(access_token, refresh_token) {
    const [success, response, tokens] = await tiktok_wrapRequest('https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name,username', 'GET', {
		'access_token': access_token,
		'refresh_token': refresh_token
	});

    if (!success) return [false, null, tokens];
    return [true, {
        'pfp': response.data.user.avatar_url,
        'un': response.data.user.username,
        'dn': response.data.user.display_name
    }, tokens];
}

/**
 * Retrieves TikTok videos using access token
 * @param {string} access_token The access token from handleCallback
 * @param {string} refresh_token The refresh token from handleCallback
 * @param {string} [cursor] The cursor for pagination (optional)
 * @returns {Promise<Array>} [success, videosData, tokens, pagination] Success status, videos details, current tokens, and pagination cursor
 */
async function tiktok_getVideos(access_token, refresh_token, cursor = null) {

    //TODO: Define here which props we want to return for each video and the pagination number 'maxResults'
    const videoProps = `id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count`;
    const maxResults = 20;

    const url = `https://open.tiktokapis.com/v2/video/list/?fields=${videoProps}${cursor ? `&cursor=${cursor}` : ''}`;

    const [success, response, tokens] = await tiktok_wrapRequest(url, 'POST', {
        'access_token': access_token,
        'refresh_token': refresh_token
    }, {}, {max_count:maxResults});

    if (!success) return [false, null, tokens, null];

    // Extract video data
    const videos = response.data?.videos?.map(video => ({
        id: video.id,
        thumbnail: video.cover_image_url,
        link: video.video_url,
        description: video.video_description,
        views: video.view_count,
        created: video.create_time,
    }));

    // Return data with pagination cursor
    return [true, videos, tokens, response.data.has_more ? response.data.cursor : null];
}

/**
 * Retrieves analytics for a specific TikTok video
 * @param {string} video_id The ID of the video to fetch analytics for
 * @param {string} access_token The access token from handleCallback
 * @param {string} refresh_token The refresh token from handleCallback
 * @returns {Promise<Array>} [success, analyticsData, tokens] Success status, analytics details, and current tokens
 */
async function tiktok_getVideoAnalytics(video_id, access_token, refresh_token) {
    
    const videoProps = `id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count`;

    const url = `https://open.tiktokapis.com/v2/video/query/?fields=${videoProps}`;

    const [success, response, tokens] = await tiktok_wrapRequest(url, 'POST', {
        'access_token': access_token,
        'refresh_token': refresh_token
    }, {}, {"filters": {"video_ids": [video_id]}});

    if (!success) return [false, null, tokens];

    // Extract the desired analytics
    const analyticsData = {
        views: response.data?.videos[0].view_count,
        likes: response.data?.videos[0].like_count,
        comments: response.data?.videos[0].comment_count,
        shares: response.data?.videos[0].share_count
    };

    return [true, analyticsData, tokens];
}

/**
 * Retrieves details and metrics for a specific TikTok video
 * @param {string} video_id The ID of the video to fetch details for
 * @param {string} access_token The access token from handleCallback
 * @param {string} refresh_token The refresh token from handleCallback
 * @returns {Promise<Array>} [success, videoDetails, tokens] Success status, video details, and current tokens
 */
async function tiktok_getVideoDetails(video_id, access_token, refresh_token) {
    const videoProps = `id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,embed_html,embed_link,like_count,comment_count,share_count,view_count`;

    const url = `https://open.tiktokapis.com/v2/video/query/?fields=${videoProps}`;

    const [success, response, tokens] = await tiktok_wrapRequest(url, 'POST', {
        'access_token': access_token,
        'refresh_token': refresh_token
    }, {}, {"filters": {"video_ids": [video_id]}});

    if (!success) return [false, null, tokens];

    // Extract the desired video details
    const videoDetails = {
        id: response.data?.videos[0].id,
        title: response.data?.videos[0].title,
        thumbnail: response.data?.videos[0].cover_image_url,
        videoLink: response.data?.videos[0].share_url,
        views: response.data?.videos[0].view_count,
        likes: response.data?.videos[0].like_count,
        comments: response.data?.videos[0].comment_count,
        shares: response.data?.videos[0].share_count,
        description: response.data?.videos[0].video_description,
        createdTime: response.data?.videos[0].create_time,
        duration: response.data?.videos[0].duration,
        height: response.data?.videos[0].height,
        width: response.data?.videos[0].width,
        embedHtml: response.data?.videos[0].embed_html,
        embedLink: response.data?.videos[0].embed_link
    };

    return [true, videoDetails, tokens];
}

/**
 * Retrieves oEmbed information for a TikTok video to get a non-expiring thumbnail URL
 * @param {string} share_url The share URL of the TikTok video
 * @returns {Promise<Array>} [success, embedInfo] Success status and embed information including thumbnail_url
 */
async function tiktok_getEmbedInfo(share_url) {
    try {
        // Strip query parameters from the share_url
        const cleanUrl = share_url.split('?')[0];
        
        const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`);
        
        if (!response.ok) {
            console.error(`[TikTok] oEmbed request failed with status ${response.status}`);
            return [false, null];
        }
        
        const embedData = await response.json();
        return [true, {
            thumbnail_url: embedData.thumbnail_url,
            title: embedData.title,
            author_name: embedData.author_name,
            author_url: embedData.author_url,
            html: embedData.html
        }];
    } catch (error) {
        console.error('[TikTok] Error getting oEmbed info:', error);
        return [false, null];
    }
}

// ----- Export -----
module.exports = {
	tiktok_getOAuthLink, tiktok_handleCallback, tiktok_revokeAccessToken,
	tiktok_getAccountDetails, tiktok_getVideos, tiktok_getVideoAnalytics, tiktok_getVideoDetails,
    tiktok_getEmbedInfo,
};