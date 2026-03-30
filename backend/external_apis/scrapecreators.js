const fetch = require('node-fetch');

// Timezone utilities
const { convertUnixToEasternDateTime } = require('../utils/timezoneUtils.js');

// ScrapeCreators API configuration
const SCRAPECREATORS_API_KEY = process.env.SCRAPECREATORS_API_KEY;
const BASE_URL = 'https://api.scrapecreators.com/v1';
const V3_BASE_URL = 'https://api.scrapecreators.com/v3';

// Batch processing configuration
const BATCH_SIZE = 3; // Process 3 handles at a time

/**
 * Process an array of items in batches using promises
 * @param {Array} items - Array of items to process
 * @param {Function} processFn - Function to process each item
 * @param {number} batchSize - Size of each batch
 * @returns {Promise<Array>} Array of processed results
 */
async function processBatch(items, processFn, batchSize = BATCH_SIZE) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchPromises = batch.map(item => processFn(item));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }
    return results;
}

/**
 * Get Instagram profile data
 * @param {string} handle - Instagram handle
 * @returns {Promise<Object>} Profile data
*/
async function scrapeCreators_getInstagramProfile(handle) {
    try {
        const url = new URL(`${BASE_URL}/instagram/profile`);
        url.searchParams.append('handle', handle);
        
        const response = await fetch(url, {
            headers: {
                "x-api-key": SCRAPECREATORS_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { data: { user } } = await response.json();
        return {
            display_name: user.full_name || user.display_name || null,
            username: user.username || null,
            bio: user.biography || user.bio || null,
            profile_image: user.profile_pic_url || user.profile_pic_url_hd || user.profile_picture || user.profileImage || null,
            num_posts: user.edge_owner_to_timeline_media?.count ?? 0,
            followers: user.edge_followed_by?.count ?? 0,
            following: user.edge_follow?.count ?? 0,
            is_private: user.is_private ?? user.private ?? true,
            profile_id: user.id || null
        };
    } catch (error) {
        console.error('Error fetching Instagram profile:', error);
        throw error;
    }
}

/**
 * Get TikTok profile data
 * @param {string} handle - TikTok handle
 * @returns {Promise<Object>} Profile data
 */
async function scrapeCreators_getTiktokProfile(handle) {
    try {
        const url = new URL(`${BASE_URL}/tiktok/profile`);
        url.searchParams.append('handle', handle);

        const response = await fetch(url, {
            headers: { "x-api-key": SCRAPECREATORS_API_KEY }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        const stats = json.stats;

        const user = json.user;
        if (!user) {
            throw new Error('TikTok profile: "user" field is missing in response');
        }

        return {
			display_name: user.nickname || null,
			username: user.uniqueId || null,
			bio: user.signature || null,
			profile_image: user.avatarThumb || user.avatarMedium || user.avatarLarger || null,
			num_posts: stats?.videoCount ?? 0,
			followers: stats?.followerCount ?? 0,
			following: stats?.followingCount ?? 0,
			is_private: user.privateAccount ?? true,
			profile_id: user.id || null
		};
    } catch (error) {
        console.error('Error fetching TikTok profile:', error);
        throw error;
    }
}

/**
 * Get Instagram analytics for multiple handles using batched processing
 * @param {string[]} handles - Array of Instagram handles to analyze
 * @returns {Promise<Array>} Array of analytics data for each handle
 */
async function scrapeCreators_getInstagramAnalytics(handles) {
    try {
        const processHandle = async (handle) => {
            try {
                const url = new URL(`${BASE_URL}/instagram/user/reels/simple`);
                url.searchParams.append('handle', handle);
                url.searchParams.append('amount', '1000');

                const reelsResponse = await fetch(url, {
                    headers: {
                        "x-api-key": SCRAPECREATORS_API_KEY
                    }
                });

                if (reelsResponse.status === 502) {
                    console.error(`502 error fetching Instagram reels for handle ${handle}, skipping...`);
                    return { handle, reels: [], error: '502 Bad Gateway' };
                }

                if (!reelsResponse.ok) {
                    throw new Error(`HTTP error! status: ${reelsResponse.status}`);
                }

                const json = await reelsResponse.json();

                if (!json || typeof json !== 'object') {
                    console.error(`Invalid response structure for ${handle}:`, json);
                    return { handle, reels: [] };
                }

                const processedReels = Array.isArray(json) 
                    ? json.map(item => {
                        const media = item.media;
                        if (!media) return null;

                        return {
                            id: media.pk,
                            thumbnail: media.image_versions2?.candidates?.[0]?.url || null,
                            caption: media.caption?.text || null,
                            link: media.url || null,
                            createdAt: convertUnixToEasternDateTime(media.taken_at),
                            stats: {
                                views: media.play_count ?? null,
                                likes: media.like_count ?? null,
                                comments: media.comment_count ?? null,
                                shares: 0 // Not available in the API
                            }
                        };
                    }).filter(Boolean) // Remove any null entries
                    : [];

                return {
                    handle,
                    reels: processedReels
                };
            } catch (error) {
                console.error(`Error fetching Instagram analytics for handle ${handle}:`, error);
                return { handle, reels: [], error: error.message };
            }
        };

        return await processBatch(handles, processHandle);
    } catch (error) {
        console.error('Error fetching Instagram analytics:', error);
        throw error;
    }
}

/**
 * Get TikTok analytics for multiple handles using batched processing
 * @param {string[]} handles - Array of TikTok handles to analyze
 * @returns {Promise<Array>} Array of analytics data for each handle
 */
async function scrapeCreators_getTiktokAnalytics(handles) {
    try {
        const processHandle = async (handle) => {
            try {
                const url = new URL(`${V3_BASE_URL}/tiktok/profile-videos`);
                url.searchParams.append('handle', handle);
                url.searchParams.append('amount', '1000');
                url.searchParams.append('trim', 'true');

                const videosResponse = await fetch(url, {
                    headers: { "x-api-key": SCRAPECREATORS_API_KEY }
                });

                if (videosResponse.status === 502) {
                    console.error(`502 error fetching TikTok videos for handle ${handle}, skipping...`);
                    return { handle, videos: [], error: '502 Bad Gateway' };
                }

                if (!videosResponse.ok) {
                    throw new Error(`HTTP error! status: ${videosResponse.status}`);
                }

                const response = await videosResponse.json();
                // console.log('Raw TikTok API response:', JSON.stringify(response, null, 2));
                
                // Check if we're accessing the right property
                const videosArray = response.data || response.videos || response;
                if (!Array.isArray(videosArray)) {
                    console.error('Unexpected response structure:', response);
                    return { handle, videos: [] };
                }

                const processedVideos = videosArray.map(video => ({
                    id: video.aweme_id,
                    thumbnail: video.video?.cover?.url_list?.[0] || null,
                    caption: video.desc,
                    createdAt: convertUnixToEasternDateTime(video.create_time),
                    link: `https://www.tiktok.com/@${handle}/video/${video.aweme_id}`,
                    stats: {
                        views: video.statistics?.play_count ?? null,
                        likes: video.statistics?.digg_count ?? null,
                        comments: video.statistics?.comment_count ?? null,
                        shares: video.statistics?.share_count ?? null
                    }
                }));

                // console.log(`Processed ${processedVideos.length} videos for handle ${handle}`);
                // if (processedVideos.length > 0) {
                //     console.log('First video sample:', Object.keys(processedVideos[0]).slice(0, 10));
                // } else {
                //     console.log('No videos found for handle:', handle);
                // }

                return {
                    handle,
                    videos: processedVideos
                };
            } catch (error) {
                console.error(`Error fetching TikTok analytics for handle ${handle}:`, error);
                return { handle, videos: [], error: error.message };
            }
        };

        return await processBatch(handles, processHandle);
    } catch (error) {
        console.error('Error fetching TikTok analytics:', error);
        throw error;
    }
}

module.exports = {
    scrapeCreators_getInstagramProfile,
    scrapeCreators_getTiktokProfile,
    scrapeCreators_getInstagramAnalytics,
    scrapeCreators_getTiktokAnalytics
};
