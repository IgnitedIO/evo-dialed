// Dependencies
import { http } from "./http";

/*
------------------------
> CREATORS API CALLS <
------------------------
*/

// Dashboard Routes
export const getCreatorDashboard = async () => {
  return await http.get("/creators/dashboard/load", {
    withCredentials: true,
  });
};

// Campaign Routes
export const getCampaigns = async () => {
  return await http.get("/creators/campaigns/list", {
    withCredentials: true,
  });
};

export const getCampaignsSimple = async () => {
  return await http.get("/creators/campaigns/list/simple", {
    withCredentials: true,
  });
};

export const getCampaignDetails = async (campaignId) => {
  return await http.get(`/creators/campaigns/${campaignId}/details`, {
    withCredentials: true,
  });
};

export const getAvailablePostsToSubmit = async (campaignId) => {
  return await http.get(`/creators/campaigns/${campaignId}/posts`, {
    withCredentials: true,
  });
};

export const submitToCampaign = async (campaignId, submissionData) => {
  return await http.post(
    `/creators/campaigns/${campaignId}/submit`,
    submissionData,
    {
      withCredentials: true,
    }
  );
};

// Integration Routes
export const getIntegrations = async () => {
  return await http.get("/creators/integrations/list", {
    withCredentials: true,
  });
};

export const connectPlatform = async (platform, connectionData) => {
  return await http.patch(
    `/creators/integrations/${platform}/connect`,
    connectionData,
    {
      withCredentials: true,
    }
  );
};

export const disconnectIntegration = async (connectionId) => {
  return await http.patch(
    `/creators/integrations/${connectionId}/disconnect`,
    {},
    {
      withCredentials: true,
    }
  );
};

// V1.1 - Creative Approval Routes

export const getCreatorCreatives = async (page = 1, pageSize = 25, status = null, timeFrame = 'all', sort = 'newest') => {
  const params = {
    page,
    page_size: pageSize,
    time_frame: timeFrame,
    sort,
  };
  if (status) params.status = status;

  return await http.get("/creators/creative-approval/all/list", {
    params,
    withCredentials: true,
  });
};

export const getCreatorCampaignCreatives = async (campaignId, page = 1, pageSize = 25, status = null, timeFrame = 'all', sort = 'newest') => {
  const params = {
    page,
    page_size: pageSize,
    time_frame: timeFrame,
    sort,
  };
  if (status) params.status = status;

  return await http.get(`/creators/creative-approval/campaign/${campaignId}/list`, {
    params,
    withCredentials: true,
  });
};

export const getCreatorCreativeDetails = async (creativeId) => {
  return await http.get(`/creators/creative-approval/creative/${creativeId}/dtl`, {
    withCredentials: true,
  });
};

export const generateCreativeUploadUrl = async (campaignId, fileName, fileSize, contentType) => {
  return await http.post(
    `/creators/creative-approval/campaign/${campaignId}/upload-url`,
    {
      file_name: fileName,
      file_size: fileSize,
      content_type: contentType,
    },
    {
      withCredentials: true,
    }
  );
};

export const submitCreative = async (campaignId, s3Key, contentType, platform, caption = null, creatorNotes = null, thumbnail = null) => {
  return await http.post(
    `/creators/creative-approval/campaign/${campaignId}/submit`,
    {
      s3_key: s3Key,
      content_type: contentType,
      platform,
      caption,
      thumbnail,
      creator_notes: creatorNotes,
    },
    {
      withCredentials: true,
    }
  );
};

export const resubmitCreative = async (creativeId, s3Key, contentType, platform, caption = null, creatorNotes = null, thumbnail = null) => {
  return await http.post(
    `/creators/creative-approval/creative/${creativeId}/resubmit`,
    {
      s3_key: s3Key,
      content_type: contentType,
      platform,
      caption,
      thumbnail,
      creator_notes: creatorNotes,
    },
    {
      withCredentials: true,
    }
  );
};

export const deleteCreative = async (creativeId) => {
  return await http.delete(`/creators/creative-approval/creative/${creativeId}/rm`, {
    withCredentials: true,
  });
}; 



/**
 * Get top content list
 * @param {string} period - Time period (24h, 7d, 30d, 60d, 90d, 6m, ytd, all)
 * @param {number} limit - Number of content items to return (1-100)
 * @param {string|null} cursor - Pagination cursor for next page
 * @param {boolean} strictFilter - Whether to use strict filtering
 * @param {number|null} campaignId - Campaign ID filter
 * @returns {Promise} API response with top content data and pagination
 */
export const getCreatorTopContent = async (
  period = "30d",
  limit = 10,
  cursor = null,
  strictFilter = false,
  campaignId = null,
  startDate = null,
  endDate = null,
  lastNPosts = null
) => {
  const params = {
    period,
    limit: Math.min(Math.max(1, limit), 100), // Clamp between 1 and 100
  };
  if (cursor) params.cursor = cursor;
  if (campaignId) params.campaign_id = campaignId;
  if (strictFilter) params.strict_filter = strictFilter;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (lastNPosts && lastNPosts !== "") params.num_limit = parseInt(lastNPosts);

  return await http.get("/creators/dashboard/top-content", {
    params,
    withCredentials: true,
    timeout: 30000, // 30 second timeout
  });
};


/**
 * Get key metrics for the dashboard
 * @param {string} period - Time period (24h, 7d, 30d, 60d, 90d, 6m, ytd, all)
 * @param {number|null} campaignId - Campaign ID filter
 * @param {boolean} strictFilter - Whether to use strict filtering
 * @returns {Promise} API response with key metrics data
 */
export const getCreatorKeyMetrics = async (
  period = "30d",
  campaignId = null,
  strictFilter = false,
  startDate = null,
  endDate = null,
  lastNPosts = null
) => {
  const params = { period };
  if (campaignId) params.campaign_id = campaignId;
  if (strictFilter) params.strict_filter = strictFilter;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (lastNPosts && lastNPosts !== "") params.num_limit = parseInt(lastNPosts);

  return await http.get("/creators/dashboard/key-metrics", {
    params,
    withCredentials: true,
    timeout: 30000, // 30 second timeout
  });
};

/**
 * Get performance graph data
 * @param {string} period - Time period (24h, 7d, 30d, 60d, 90d, 6m, ytd, all)
 * @param {Array<number>|null} campaignIds - Array of campaign IDs
 * @param {boolean} strictFilter - Whether to use strict filtering
 * @param {string} viewType - View type (incremental or cumulative)
 * @returns {Promise} API response with performance graph data
 */
export const getCreatorPerformanceGraph = async (
  period = "30d",
  campaignIds = null,
  strictFilter = false,
  viewType = "incremental",
  group = true,
  startDate = null,
  endDate = null,
  csv = false,
  lastNPosts = null
) => {
  const params = { period };
  if (campaignIds && campaignIds.length > 0) {
    params.campaign_ids = campaignIds.join(",");
  }
  if (strictFilter) params.strict_filter = strictFilter;
  if (viewType) params.view_type = viewType;
  if (group !== undefined) params.group = group;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (csv) params.csv = csv;
  if (lastNPosts && lastNPosts !== "") params.num_limit = parseInt(lastNPosts);

  return await http.get("/creators/dashboard/performance-graph", {
    params,
    withCredentials: true,
    timeout: 30000, // 30 second timeout
  });
};