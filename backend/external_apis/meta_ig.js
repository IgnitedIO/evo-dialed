// Dependencies
const crypto = require('crypto');
const fetch = require('node-fetch');
const querystring = require('querystring');

// Constants
const INSTAGRAM_REDIRECT_URI = `${(process.env.NODE_ENV === "development") ? process.env.BACKEND_URL_PREFIX : "https://api.getpaydapp.com/v1"}/mb/settings/linked/instagram/cb`;

/**
 * Refreshes an expired Instagram access token
 */
async function instagram_refreshTokens(refreshToken) {
    try {
        const response = await fetch(`https://graph.instagram.com/refresh_access_token?` +
            querystring.stringify({
                'grant_type': 'ig_refresh_token',
                'access_token': refreshToken
            })
        );

        if (!response.ok) throw new Error('Failed to refresh token');

        const tokenData = await response.json();
        return [true, {
            'access_token': tokenData.access_token,
            'refresh_token': tokenData.access_token,
            'expires_in': tokenData.expires_in || 5184000
        }];

    } catch (error) {
        console.error('Error refreshing tokens:', error);
        return [false, null];
    }
}

/**
 * Wrapper function for Instagram API requests
 */
async function instagram_wrapRequest(url, method, tokens, additionalHeaders = {}, body = null) {
    let currentTokens = { ...tokens };
    let attempts = 0;
    const MAX_RETRIES = 3;

    while (attempts < MAX_RETRIES) {
        try {
            const headers = {
                ...additionalHeaders
            };
            const requestOptions = {
                'method': method,
                'headers': headers
            };
            if (body) requestOptions.body = JSON.stringify(body);

            // Add access token to URL for Instagram Graph API
            const urlWithToken = `${url}${url.includes('?') ? '&' : '?'}access_token=${currentTokens.access_token}`;

            console.log(urlWithToken);

            const response = await fetch(urlWithToken, requestOptions);

            if (response.ok) {
                const data = await response.json();
                return [true, data, currentTokens];
            }

            if (response.status === 401 && attempts < MAX_RETRIES - 1) {
                const [refreshSuccess, newTokens] = await instagram_refreshTokens(currentTokens.refresh_token);
                if (!refreshSuccess) throw new Error('Token refresh failed');
                currentTokens = newTokens;
                attempts++;
                continue;
            }
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

/**
 * Generates an Instagram OAuth link for user authorization
 */
async function instagram_getOAuthLink() {
    try {
        const state = crypto.randomBytes(16).toString('hex');
        const params = {
            'client_id': process.env.INSTAGRAM_APP_ID,
            'redirect_uri': INSTAGRAM_REDIRECT_URI,
            'enable_fb_login': '0',
            'force_authentication': '1',
            'scope': [
                'instagram_business_basic',
                'instagram_business_manage_insights',
                // 'instagram_business_manage_messages',
                // 'instagram_business_manage_comments',
                // 'instagram_business_content_publish',
            ].join(','),
            'response_type': 'code',
            'state': state
        };

        const baseUrl = 'https://www.instagram.com/oauth/authorize';
        const authUrl = `${baseUrl}?${querystring.stringify(params)}`;
        console.log("IG URL = ", authUrl);
        return [true, authUrl, state];

    } catch (error) {
        console.error('Error generating OAuth link:', error);
        return [false, null];
    }
}

/**
 * Handles the Instagram OAuth callback
 */
async function instagram_handleCallback(code, received_state, expected_state) {
    try {
        if (received_state !== expected_state) throw new Error('State mismatch');
        console.log("\n\n\n--- IG OAUTH ---\n\n");

        const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: querystring.stringify({
                'client_id': process.env.INSTAGRAM_APP_ID,
                'client_secret': process.env.INSTAGRAM_APP_SECRET,
                'grant_type': 'authorization_code',
                'redirect_uri': INSTAGRAM_REDIRECT_URI,
                'code': code
            })
        });

        if (tokenResponse.status !== 200) {
            console.log("Failed to exchange code for token ... ");
            throw new Error('Failed to exchange code for token');
        }
        const tokenData = await tokenResponse.json();
        return [true, tokenData.access_token, tokenData.access_token];

    } catch (error) {
        console.error('Error handling OAuth callback:', error);
        return [false, null, null];
    }
}

/**
 * Gets Instagram account details
 */
async function instagram_getAccountDetails(access_token, refresh_token) {
    const tokens = { access_token, refresh_token };

    console.log("GETTING IG ACCOUNT DETAILS = ", access_token, " ... ", refresh_token);
    
    const [success, response, tokensUpdate] = await instagram_wrapRequest(
        'https://graph.instagram.com/v22.0/me?fields=username,name,id,account_type,profile_picture_url',
        'GET',
        tokens
    );

    if (!success) return [false, null, tokensUpdate];

    return [true, {
        'pfp': response.profile_picture_url || null,
        'un': `@${response.username}`,
        'dn': response.name || response.username
    }, tokensUpdate];
}

/**
 * Gets Instagram posts with pagination (excluding reels)
 */
async function instagram_getPosts(access_token, refresh_token, pagingToken = null, limit = 25) {
    let allPosts = [];
    let nextPageToken = pagingToken?.after || null;
    let prevPageToken = pagingToken?.before || null;
    let currentTokens = { access_token, refresh_token };
    
    // Keep fetching until we have enough posts or there are no more pages
    while (allPosts.length < limit && nextPageToken !== undefined) {
        let url = `https://graph.instagram.com/v22.0/me/media?fields=id,caption,media_type,media_url,media_product_type,thumbnail_url,timestamp,permalink&limit=50`; // Fetch more items per request

        if (nextPageToken) url += `&after=${nextPageToken}`;

        const [success, response, tokens] = await instagram_wrapRequest(
            url,
            'GET',
            currentTokens
        );

        if (!success) return [false, null, null, tokens];

        // Filter only posts (excluding reels) from this batch
        const posts = response.data.filter(item => item.media_product_type !== 'REELS');
        allPosts = allPosts.concat(posts);

        // Update tokens and pagination info
        currentTokens = tokens;
        nextPageToken = response.paging?.cursors?.after;
        
        // If this is the first batch, store the prev token
        if (allPosts.length <= 50) {
            prevPageToken = response.paging?.cursors?.before;
        }

        // If we have enough posts, trim the excess and save the last item's token
        if (allPosts.length >= limit) {
            nextPageToken = response.paging?.cursors?.after;
            allPosts = allPosts.slice(0, limit);
            break;
        }
    }

    return [
        true,
        allPosts,
        {
            prevPageToken: prevPageToken || null,
            nextPageToken: nextPageToken || null
        },
        currentTokens
    ];
}

/**
 * Gets Instagram reels with pagination
 */
async function instagram_getReels(access_token, refresh_token, pagingToken = null, limit = 25) {
    let allReels = [];
    let nextPageToken = pagingToken?.after || null;
    let prevPageToken = pagingToken?.before || null;
    let currentTokens = { access_token, refresh_token };
    
    // Keep fetching until we have enough reels or there are no more pages
    while (allReels.length < limit && nextPageToken !== undefined) {
        let url = `https://graph.instagram.com/v22.0/me/media?fields=id,caption,media_type,media_url,media_product_type,thumbnail_url,timestamp,permalink&limit=50`; // Fetch more items per request

        if (nextPageToken) url += `&after=${nextPageToken}`;

        const [success, response, tokens] = await instagram_wrapRequest(
            url,
            'GET',
            currentTokens
        );

        if (!success) return [false, null, null, tokens];

        // Filter only reels from this batch
        const reels = response.data.filter(item => item.media_product_type === 'REELS');
        allReels = allReels.concat(reels);

        // Update tokens and pagination info
        currentTokens = tokens;
        nextPageToken = response.paging?.cursors?.after;
        
        // If this is the first batch, store the prev token
        if (allReels.length <= 50) {
            prevPageToken = response.paging?.cursors?.before;
        }

        // If we have enough reels, trim the excess and save the last item's token
        if (allReels.length >= limit) {
            nextPageToken = response.paging?.cursors?.after;
            allReels = allReels.slice(0, limit);
            break;
        }
    }

    return [
        true,
        allReels,
        {
            prevPageToken: prevPageToken || null,
            nextPageToken: nextPageToken || null
        },
        currentTokens
    ];
}

/**
 * Gets analytics for an Instagram post
 */
async function instagram_getPostAnalytics(post_id, tokens) {

    // Ensure post_id is a string
    if (typeof post_id !== 'string') post_id = String(post_id);

    const metrics = 'metric=likes,impressions,reach,comments,saved';
    const [success, response, tokensUpdate] = await instagram_wrapRequest(
        `https://graph.instagram.com/v21.0/${post_id}/insights?${metrics}&period=lifetime`,
        'GET',
        tokens
    );

    if (!success) return [false, null, tokensUpdate];
    return [true, response.data, tokensUpdate];
}

module.exports = {
    instagram_getOAuthLink,
    instagram_handleCallback,
    instagram_refreshTokens,
    instagram_getAccountDetails,
    instagram_getPosts,
    instagram_getReels, 
    instagram_getPostAnalytics
};
