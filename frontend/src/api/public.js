// Dependencies
import { http } from "./http";

/*
------------------------
> PUBLIC API CALLS <
------------------------
*/

// Public Campaign Details (lightweight endpoint for campaign name)
export const getPublicCampaignDetails = async (shareLink) => {
  return await http.get(`/public/campaigns/${shareLink}/details`);
};

// Public Campaign Metrics
export const getPublicCampaignMetrics = async (shareLink, params = {}) => {
  const queryParams = { ...params };
  
  return await http.get(`/public/campaigns/${shareLink}/metrics`, {
    params: queryParams,
  });
};

// Public Campaign Report
export const getPublicCampaignReport = async (shareLink, params = {}) => {
  const queryParams = { ...params };
  
  return await http.get(`/public/campaigns/${shareLink}/report`, {
    params: queryParams,
  });
};

// Public Key Metrics (using campaign ID)
export const getPublicKeyMetrics = async (campaignId, params = {}) => {
  const queryParams = { ...params };
  
  return await http.get(`/public/campaigns/${campaignId}/key-metrics`, {
    params: queryParams,
  });
};

// Public Performance Graph (using campaign ID)
export const getPublicPerformanceGraph = async (campaignId, params = {}) => {
  const queryParams = { ...params };
  
  return await http.get(`/public/campaigns/${campaignId}/performance-graph`, {
    params: queryParams,
  });
};

// Public Top Creators (using campaign ID)
export const getPublicTopCreators = async (campaignId, params = {}) => {
  const queryParams = { ...params };
  
  return await http.get(`/public/campaigns/${campaignId}/top-creators`, {
    params: queryParams,
  });
};

// Public Top Content (using campaign ID)
export const getPublicTopContent = async (campaignId, params = {}) => {
  const queryParams = { ...params };
  
  return await http.get(`/public/campaigns/${campaignId}/top-content`, {
    params: queryParams,
  });
};

// Public Report (using campaign ID)
export const getPublicReport = async (campaignId) => {
  return await http.get(`/public/campaigns/${campaignId}/report`);
};