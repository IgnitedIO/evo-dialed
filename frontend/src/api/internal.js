// Dependencies
import { http } from "./http";

/*
------------------------
> INTERNAL API CALLS <
------------------------
*/

// Creator Management Routes
export const createCreatorAccount = async (creatorData) => {
  return await http.post("/internal/creators/new", creatorData, {
    withCredentials: true,
  });
};

export const getCreatorsList = async (page = 1, pageSize = 10, sort = "hltime", search = "") => {
  return await http.get("/internal/creators/list/full", {
    params: { page, page_size: pageSize, sort, search },
    withCredentials: true,
  });
};

export const getCreatorsListCondensed = async (page = 1, pageSize = 10, sort = "hltime", search = "") => {
  return await http.get("/internal/creators/list/mini", {
    params: { page, page_size: pageSize, sort, search },
    withCredentials: true,
  });
};

export const getCreatorDetails = async (creatorId) => {
  return await http.get(`/internal/creators/${creatorId}/details`, {
    withCredentials: true,
  });
};

export const sendCreatorInviteEmail = async (creatorId) => {
  return await http.post(`/internal/creators/${creatorId}/send-invite`, {}, {
    withCredentials: true,
  });
};

export const kickCreator = async (creatorId) => {
  return await http.delete(`/internal/creators/${creatorId}/kick`, {
    withCredentials: true,
  });
};

export const getCreatorConnectedAccounts = async (creatorId) => {
  return await http.get(`/internal/creators/${creatorId}/connected-accounts`, {
    withCredentials: true,
  });
};

export const updateCreatorDetails = async (creatorId, key, value) => {
  return await http.patch(
    `/internal/creators/${creatorId}/${key}/touch`,
    { value },
    {
      withCredentials: true,
    }
  );
};

// Campaign Management Routes
export const getInternalCampaigns = async (cdUserId = null) => {
  const params = {};
  if (cdUserId) {
    params.cd_user_id = cdUserId;
  }
  return await http.get("/internal/campaigns/list", {
    params,
    withCredentials: true,
  });
};

export const getAvailableCampaigns = async (creatorId) => {
  return await http.get(`/internal/campaigns/available/${creatorId}`, {
    withCredentials: true,
  });
};

export const bulkAssignCampaigns = async (creatorId, assignments) => {
  return await http.post(
    "/internal/campaigns/bulk-assign",
    {
      creator_id: creatorId,
      assignments: assignments,
    },
    {
      withCredentials: true,
    }
  );
};

export const getInternalCampaignDetails = async (campaignId) => {
  return await http.get(`/internal/campaigns/${campaignId}/details`, {
    withCredentials: true,
  });
};

export const getInternalCampaignPosts = async (campaignId, page = 1, pageSize = 25, period = null) => {
  const params = {
    page,
    page_size: pageSize,
  };

  if (period) {
    params.period = period;
  }

  return await http.get(`/internal/campaigns/${campaignId}/posts`, {
    params,
    withCredentials: true,
  });
};

export const addCampaignLink = async (campaignId, linkData) => {
  return await http.post(`/internal/campaigns/${campaignId}/links/new`, linkData, {
    withCredentials: true,
  });
};

export const updateCampaignLink = async (campaignId, linkId, linkData) => {
  return await http.patch(`/internal/campaigns/${campaignId}/links/${linkId}/touch`, linkData, {
    withCredentials: true,
  });
};

export const removeCampaignLink = async (campaignId, linkId) => {
  return await http.delete(`/internal/campaigns/${campaignId}/links/${linkId}/rm`, {
    withCredentials: true,
  });
};

export const getCampaignSubmissions = async (campaignId) => {
  return await http.get(`/internal/campaigns/${campaignId}/submissions`, {
    withCredentials: true,
  });
};

export const getCampaignCreators = async (campaignId) => {
  return await http.get(`/internal/campaigns/${campaignId}/creators`, {
    withCredentials: true,
  });
};

export const bulkAssignCreators = async (campaignId, assignments) => {
  return await http.post(
    `/internal/campaigns/${campaignId}/creators/bulk-assign`,
    {
      assignments: assignments,
    },
    {
      withCredentials: true,
    }
  );
};

export const inviteCreatorToCampaign = async (campaignId, creatorId) => {
  return await http.post(
    `/internal/campaigns/${campaignId}/creators/${creatorId}/invite`,
    {},
    {
      withCredentials: true,
    }
  );
};

export const getCampaignSettings = async (campaignId) => {
  return await http.get(`/internal/campaigns/${campaignId}/settings`, {
    withCredentials: true,
  });
};

export const updateCampaignSettings = async (campaignId, key, value) => {
  return await http.patch(
    `/internal/campaigns/${campaignId}/settings/${key}/touch`,
    { value },
    {
      withCredentials: true,
    }
  );
};

export const createCampaign = async ({ name, description, supports_ig, supports_tt, img, start_date, end_date, status, budget }) => {
  const requestBody = {
    name,
    description,
    supports_ig,
    supports_tt,
    img: img || null,
    start_date: start_date || null,
    end_date: end_date || null,
    status: status || "active",
    budget: budget || null,
  };

  return await http.post("/internal/campaigns/new", requestBody, {
    withCredentials: true,
  });
};

// Dashboard Routes
export const getInternalDashboard = async (period = "30d") => {
  return await http.get(`/internal/dashboard/load?period=${period}`, {
    withCredentials: true,
  });
};

export const generateReport = async (campaignId = null, creatorId = null) => {
  const params = {};
  if (campaignId) params.campaign_id = campaignId;
  if (creatorId) params.creator_id = creatorId;

  return await http.get(`/internal/metrics/report`, {
    params,
    withCredentials: true,
  });
};

export const getCreatorSubmissions = async (creatorId, page = 1, pageSize = 25) => {
  return await http.get(`/internal/creators/${creatorId}/submissions`, {
    params: {
      page,
      page_size: pageSize,
    },
    withCredentials: true,
  });
};

export const removeCreatorFromCampaign = async (campaignId, creatorId, linkId) => {
  return await http.delete(`/internal/campaigns/${campaignId}/creators/${creatorId}/links/${linkId}/rm`, {
    withCredentials: true,
  });
};

export const getAvailableCreators = async (campaignId) => {
  return await http.get(`/internal/campaigns/${campaignId}/creators/available`, {
    withCredentials: true,
  });
};

export const manuallyAddCreator = async (name, email, phone) => {
  return await http.post(
    "/internal/creators/manual/add",
    { name, email, phone },
    {
      withCredentials: true,
    }
  );
};

export const manuallyInviteCreator = async (name, email, phone) => {
  return await http.post(
    "/internal/creators/manual/invite",
    { name, email, phone },
    {
      withCredentials: true,
    }
  );
};

export const getCreatorPreview = async (handle, platform) => {
  return await http.post(
    "/internal/campaigns/creators/preview",
    {
      handle,
      platform,
    },
    {
      withCredentials: true,
    }
  );
};

export const getCreatorDailyPosts = async (creatorId, campaignId = null) => {
  const params = {};
  if (campaignId) params.campaign_id = campaignId;
  const res = await http.get(`/internal/campaigns/creators/${creatorId}/daily-posts`, {
    params,
    withCredentials: true,
  });
  return res.data.data;
};

export const getPostsOnDate = async (creatorId, date, campaignId = null) => {
  const params = {};
  if (campaignId) params.campaign_id = campaignId;
  const res = await http.get(`/internal/campaigns/creators/${creatorId}/posts/${date}`, {
    params,
    withCredentials: true,
  });
  return res.data.data;
};

export const generateShareLink = async (campaignId = null, creatorId = null) => {
  const params = {};
  if (campaignId) params.campaign_id = campaignId;
  if (creatorId) params.creator_id = creatorId;

  return await http.post(`/internal/campaigns/share-link/generate`, params, {
    withCredentials: true,
  });
};
// -------------------
// METRICS API FUNCTIONS
// -------------------

/**
 * Get key metrics for the dashboard
 * @param {string} period - Time period (24h, 7d, 30d, 60d, 90d, 6m, ytd, all)
 * @param {number|null} campaignId - Campaign ID filter
 * @param {number|null} creatorId - Creator ID filter
 * @param {boolean} strictFilter - Whether to use strict filtering
 * @returns {Promise} API response with key metrics data
 */
export const getKeyMetrics = async (
  period = "30d",
  campaignId = null,
  creatorId = null,
  strictFilter = false,
  startDate = null,
  endDate = null,
  lastNPosts = null
) => {
  const params = { period };
  if (campaignId) params.campaign_id = campaignId;
  if (creatorId) params.creator_id = creatorId;
  if (strictFilter) params.strict_filter = strictFilter;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (lastNPosts && lastNPosts !== "") params.num_limit = parseInt(lastNPosts);

  return await http.get("/internal/metrics/key-metrics", {
    params,
    withCredentials: true,
    timeout: 30000, // 30 second timeout
  });
};

/**
 * Get performance graph data
 * @param {string} period - Time period (24h, 7d, 30d, 60d, 90d, 6m, ytd, all)
 * @param {Array<number>|null} campaignIds - Array of campaign IDs
 * @param {Array<number>|null} creatorIds - Array of creator IDs
 * @param {boolean} strictFilter - Whether to use strict filtering
 * @param {string} viewType - View type (incremental or cumulative)
 * @returns {Promise} API response with performance graph data
 */
export const getPerformanceGraph = async (
  period = "30d",
  campaignIds = null,
  creatorIds = null,
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
  if (creatorIds && creatorIds.length > 0) {
    params.creator_ids = creatorIds.join(",");
  }
  if (strictFilter) params.strict_filter = strictFilter;
  if (viewType) params.view_type = viewType;
  if (group !== undefined) params.group = group;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (csv) params.csv = csv;
  if (lastNPosts && lastNPosts !== "") params.num_limit = parseInt(lastNPosts);

  return await http.get("/internal/metrics/performance-graph", {
    params,
    withCredentials: true,
    timeout: 30000, // 30 second timeout
  });
};

/**
 * Get top creators list
 * @param {string} period - Time period (24h, 7d, 30d, 60d, 90d, 6m, ytd, all)
 * @param {number} limit - Number of creators to return (1-100)
 * @param {number} page - Page number (1-based)
 * @param {boolean} strictFilter - Whether to use strict filtering
 * @param {number|null} campaignId - Campaign ID filter
 * @param {number|null} creatorId - Creator ID filter
 * @returns {Promise} API response with top creators data and pagination
 */
export const getTopCreators = async (
  period = "30d",
  limit = 10,
  page = 1,
  strictFilter = false,
  campaignId = null,
  creatorId = null,
  startDate = null,
  endDate = null,
  lastNPosts = null
) => {
  const params = {
    period,
    limit: Math.min(Math.max(1, limit), 100), // Clamp between 1 and 100
    page: Math.max(1, page), // Ensure page is at least 1
  };
  if (campaignId) params.campaign_id = campaignId;
  if (creatorId) params.creator_id = creatorId;
  if (strictFilter) params.strict_filter = strictFilter;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (lastNPosts && lastNPosts !== "") params.num_limit = parseInt(lastNPosts);

  return await http.get("/internal/metrics/top-creators", {
    params,
    withCredentials: true,
    timeout: 30000, // 30 second timeout
  });
};

/**
 * Get top content list
 * @param {string} period - Time period (24h, 7d, 30d, 60d, 90d, 6m, ytd, all)
 * @param {number} limit - Number of content items to return (1-100)
 * @param {string|null} cursor - Pagination cursor for next page
 * @param {boolean} strictFilter - Whether to use strict filtering
 * @param {number|null} campaignId - Campaign ID filter
 * @param {number|null} creatorId - Creator ID filter
 * @returns {Promise} API response with top content data and pagination
 */
export const getTopContent = async (
  period = "30d",
  limit = 10,
  cursor = null,
  strictFilter = false,
  campaignId = null,
  creatorId = null,
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
  if (creatorId) params.creator_id = creatorId;
  if (strictFilter) params.strict_filter = strictFilter;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (lastNPosts && lastNPosts !== "") params.num_limit = parseInt(lastNPosts);

  return await http.get("/internal/metrics/top-content", {
    params,
    withCredentials: true,
    timeout: 30000, // 30 second timeout
  });
};

export const reassignCreatorHandle = async (handle, newCreatorId) => {
  return await http.patch(
    "/internal/creators/reassign-handle",
    {
      handle,
      new_creator_id: newCreatorId,
    },
    {
      withCredentials: true,
    }
  );
};

// -------------------
// TEAM MANAGEMENT API FUNCTIONS
// -------------------

/**
 * Invite a new admin user
 * @param {string} email - Admin email address
 * @param {string} password - Admin password
 * @param {string} displayName - Admin display name
 * @param {string|null} profilePicture - Admin profile picture (base64 encoded)
 * @returns {Promise} API response
 */
export const inviteAdmin = async (email, password, displayName, profilePicture = null) => {
  return await http.post(
    "/internal/team/invite-admin",
    {
      em: email,
      pw: password,
      dn: displayName,
      pfp: profilePicture,
    },
    {
      withCredentials: true,
    }
  );
};

// -------------------
// CREATIVE APPROVAL API FUNCTIONS
// -------------------

/**
 * Get paginated list of creatives for a campaign with optional filters and sorting
 * @param {number} campaignId - Campaign ID
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Items per page
 * @param {string} status - Status filter ('pending', 'approved', 'rejected')
 * @param {string} timeFrame - Time frame filter ('all', '24h', '7d', '30d', '90d')
 * @param {string} sort - Sort option ('newest', 'oldest')
 * @returns {Promise} API response with creatives list and pagination
 */
export const getCampaignCreatives = async (campaignId, page = 1, pageSize = 25, status = "pending", timeFrame = 'all', sort = 'newest') => {
  const params = {
    page,
    page_size: pageSize,
    status,
    time_frame: timeFrame,
    sort,
  };

  return await http.get(`/internal/creative-approval/campaign/${campaignId}/list`, {
    params,
    withCredentials: true,
  });
};

/**
 * Get paginated list of creatives across ALL campaigns with filtering
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Number of items per page
 * @param {string} status - Status filter ('pending', 'approved', 'rejected')
 * @param {string} timeFrame - Time frame filter ('all', '24h', '7d', '30d', '90d')
 * @param {string} sort - Sort option ('newest', 'oldest')
 * @param {number|null} cdUserId - Creative director user ID filter (optional)
 * @returns {Promise} API response with creatives list and pagination
 */
export const getAllCreatives = async (page = 1, pageSize = 25, status = "pending", timeFrame = 'all', sort = 'newest', cdUserId = null) => {
  const params = {
    page,
    page_size: pageSize,
    status,
    time_frame: timeFrame,
    sort,
  };

  if (cdUserId) {
    params.cd_user_id = cdUserId;
  }

  return await http.get(`/internal/creative-approval/all/list`, {
    params,
    withCredentials: true,
  });
};

/**
 * Get details for a specific creative
 * @param {number} creativeId - Creative ID
 * @returns {Promise} API response with creative details
 */
export const getCreativeDetails = async (creativeId) => {
  return await http.get(`/internal/creative-approval/creative/${creativeId}/dtl`, {
    withCredentials: true,
  });
};

/**
 * Approve a creative
 * @param {number} creativeId - Creative ID
 * @returns {Promise} API response
 */
export const approveCreative = async (creativeId, notes) => {
  return await http.patch(
    `/internal/creative-approval/creative/${creativeId}/approve`,
    {
      notes,
    },
    {
      withCredentials: true,
    }
  );
};

/**
 * Reject a creative with feedback notes
 * @param {number} creativeId - Creative ID
 * @param {string} notes - Rejection feedback notes
 * @returns {Promise} API response
 */
export const rejectCreative = async (creativeId, notes) => {
  return await http.patch(
    `/internal/creative-approval/creative/${creativeId}/reject`,
    {
      notes,
    },
    {
      withCredentials: true,
    }
  );
};

// Creative Director Management Routes

/**
 * Get list of all creative directors
 * @returns {Promise} API response with creative directors list
 */
export const getCreativeDirectors = async () => {
  return await http.get("/internal/team/creative-directors", {
    withCredentials: true,
  });
};

/**
 * Assign a creative director to a campaign
 * @param {number} campaignId - Campaign ID
 * @param {number} cdUserId - Creative director user ID
 * @returns {Promise} API response
 */
export const assignCreativeDirector = async (campaignId, cdUserId) => {
  return await http.patch(
    `/internal/campaigns/${campaignId}/creative-director/assign`,
    {
      cd_user_id: cdUserId,
    },
    {
      withCredentials: true,
    }
  );
};

/**
 * Remove creative director from a campaign
 * @param {number} campaignId - Campaign ID
 * @returns {Promise} API response
 */
export const removeCreativeDirector = async (campaignId) => {
  return await http.delete(
    `/internal/campaigns/${campaignId}/creative-director/remove`,
    {
      withCredentials: true,
    }
  );
};

// -------------------
// MISSION CONTROL API FUNCTIONS
// -------------------

export const getMissionControlBoard = async () => {
  return await http.get("/internal/mission-control/board", { withCredentials: true });
};

export const updateCampaignBoardStatus = async (campaignId, status) => {
  return await http.patch(`/internal/mission-control/${campaignId}/status`, { status }, { withCredentials: true });
};

export const pauseMCCampaign = async (campaignId) => {
  return await http.post(`/internal/mission-control/${campaignId}/pause`, {}, { withCredentials: true });
};

export const launchMCCampaign = async (campaignId) => {
  return await http.post(`/internal/mission-control/${campaignId}/launch`, {}, { withCredentials: true });
};

export const getMCComments = async (campaignId) => {
  return await http.get(`/internal/mission-control/${campaignId}/comments`, { withCredentials: true });
};

export const addMCComment = async (campaignId, content, mentions) => {
  return await http.post(`/internal/mission-control/${campaignId}/comments`, { content, mentions }, { withCredentials: true });
};

export const deleteMCComment = async (campaignId, commentId) => {
  return await http.delete(`/internal/mission-control/${campaignId}/comments/${commentId}`, { withCredentials: true });
};

export const getMCChecklist = async (campaignId) => {
  return await http.get(`/internal/mission-control/${campaignId}/checklist`, { withCredentials: true });
};

export const updateMCChecklistItem = async (campaignId, itemId, isComplete) => {
  return await http.patch(`/internal/mission-control/${campaignId}/checklist/${itemId}`, { is_complete: isComplete }, { withCredentials: true });
};

export const getMCTeamMembers = async () => {
  return await http.get("/internal/mission-control/team-members", { withCredentials: true });
};
