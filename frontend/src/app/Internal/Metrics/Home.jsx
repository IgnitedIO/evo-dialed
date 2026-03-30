// Dependencies
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { NavLink } from "react-router-dom";
import Popup from "reactjs-popup";

// API Imports
import { getCreatorKeyMetrics, getCreatorPerformanceGraph, getCreatorTopContent } from "../../../api/creators";
import { generateReport, generateShareLink, getKeyMetrics, getPerformanceGraph, getTopCreators, getTopContent } from "../../../api/internal";
import { getPublicKeyMetrics, getPublicPerformanceGraph, getPublicTopCreators, getPublicTopContent, getPublicReport } from "../../../api/public";

// Component Imports
import { MetricCard } from "../../../components/MetricCard";
import CampaignPostCard from "../Dashboard/components/CampaignPostCard";
import CreatorPopup from "../Dashboard/components/CreatorPopup";
import ExportPDFGraph from "./ExportPDF/ExportPDFGraph";
import ShareLinkModal from "./ShareLinkModal";
import CustomDateRangeModal from "./components/CustomDateRangeModal";
import LoadingCircle from "../../../ui/Components/LoadingCircle/LoadingCircle";
import { EmptyView } from "../../../ui/Components";

// Function Imports
import { exportMetricsToPDF } from "./ExportPDF/metricsExport";
import { exportMetricsToCSV } from "./utils/csvExport";

// Style Imports
import styles from "./Home.module.css";
import dashboardStyles from "../Dashboard/Home.module.css";
import detailsStyles from "../Creators/Details/Details.module.css";
import LoadingCircleScreen from "../../../ui/Components/LoadingCircle/LoadingCircleScreen.jsx";

// Icon Imports
import { FaTiktok, FaInstagram } from "react-icons/fa";
import {
  VIEWS_ICON,
  LIKES_ICON,
  COMMENTS_ICON,
  SHARE_ICON,
  POSTS_ICON,
  RATE_ICON,
  TIKTOK_ICON,
  INSTAGRAM_ICON,
  EXPORT_ICON,
  EXTERNAL_LINK_ICON,
} from "../../../assets/icons/svg.jsx";

// Constants
const periodOptions = [
  { value: "24h", label: "Past 24 hours" },
  { value: "7d", label: "Past 7 days" },
  { value: "30d", label: "Past 30 days" },
  { value: "60d", label: "Past 60 days" },
  { value: "90d", label: "Past 3 months" },
  { value: "6m", label: "Past 6 months" },
  { value: "ytd", label: "Year to Date" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
];

const postFilterOptions = [
  { value: "all_posts", label: "All Posts" },
  { value: "posted_within_period", label: "Posted within Period" },
];

// Helper Functions
const formatNumber = (num) => {
  if (num === undefined || num === null) return "0";
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

const getPeriodButtonText = (period) => {
  const option = periodOptions.find((opt) => opt.value === period);
  return option ? `${option.label}` : "Period";
};

const getPostFilterButtonText = (postFilter) => {
  const option = postFilterOptions.find((opt) => opt.value === postFilter);
  return option ? `${option.label}` : "Filter";
};

// Cache age helper
function getCacheAgeString(cacheAgeMinutes) {
  if (cacheAgeMinutes == null) return "";
  if (cacheAgeMinutes < 1) return "Updated just now";
  if (cacheAgeMinutes < 60) return `Updated ${cacheAgeMinutes} min ago`;
  const hr = Math.floor(cacheAgeMinutes / 60);
  if (hr < 24) return `Updated ${hr} hr ago`;
  const day = Math.floor(hr / 24);
  return `Updated ${day} day${day > 1 ? "s" : ""} ago`;
}

// Calculate maximum value across all chart data for consistent Y-axis scaling
const calculateMaxValue = (performanceData) => {
  if (!performanceData || performanceData.length === 0) return 100;

  let maxValue = 0;
  performanceData.forEach((dataPoint) => {
    maxValue = Math.max(maxValue, dataPoint.views || 0, dataPoint.likes || 0, dataPoint.comments || 0, dataPoint.shares || 0);
  });

  // Add some padding to the max value (20% buffer)
  return Math.ceil(maxValue * 1.2);
};

// Main Component
export const InternalMetricsHome = ({
  campaignId = null, creatorId = null,
  hideShareButton = false,
  usePublicApi = false,
  pageTitle = null,
  isCreatorUser = false,
}) => {
  // States
  const [dashboardData, setDashboardData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState((usePublicApi) ? "ytd" : "30d");
  const [postFilter, setPostFilter] = useState("all_posts");
  const [lastNPosts, setLastNPosts] = useState(""); // Number of posts filter
  const [isLoading, setIsLoading] = useState(false); // Track actual API call loading state
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [isPostFilterDropdownOpen, setIsPostFilterDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharingLink, setIsSharingLink] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState(null); // [startDate, endDate]
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);

  // API States
  const [keyMetrics, setKeyMetrics] = useState(null);
  const [performanceGraph, setPerformanceGraph] = useState(null);
  const [topCreators, setTopCreators] = useState(null);
  const [topContent, setTopContent] = useState(null);

  // Loading states for individual sections
  const [keyMetricsLoading, setKeyMetricsLoading] = useState(false);
  const [performanceGraphLoading, setPerformanceGraphLoading] = useState(false);
  const [topCreatorsLoading, setTopCreatorsLoading] = useState(false);
  const [topContentLoading, setTopContentLoading] = useState(false);

  // Pagination states
  const [creatorsPage, setCreatorsPage] = useState(1);
  const [creatorsPagination, setCreatorsPagination] = useState(null);
  const [contentCursor, setContentCursor] = useState(null);
  const [contentPagination, setContentPagination] = useState(null);

  // View type for performance graph
  const [viewType, setViewType] = useState("incremental"); // 'incremental' or 'cumulative'

  // Error states for individual sections
  const [keyMetricsError, setKeyMetricsError] = useState(null);
  const [performanceGraphError, setPerformanceGraphError] = useState(null);
  const [topCreatorsError, setTopCreatorsError] = useState(null);
  const [topContentError, setTopContentError] = useState(null);

  // Handle click outside to close dropdowns
  const handleClickOutside = (event) => {
    // Check if click is outside all dropdowns
    // We need to check if the click is on the dropdown containers or buttons
    const isDropdownClick = event.target.closest('[class*="dropdownContainer"]');
    const isFilterButtonClick = event.target.closest('[class*="filterButton"]');
    const isExportButtonClick = event.target.closest('[class*="exportButton"]');
    const isFilterOptionClick = event.target.closest('[class*="filterOption"]');

    if (!isDropdownClick && !isFilterButtonClick && !isExportButtonClick && !isFilterOptionClick) {
      setIsPeriodDropdownOpen(false);
      setIsPostFilterDropdownOpen(false);
      setIsExportDropdownOpen(false);
    }
  };

  // Load dashboard when period changes
  const loadDashboardData = async () => {
    // Don't load if we're in the middle of an API call
    if (isLoading) return;

    // For custom period, ensure we have valid dates
    if (period === "custom" && (!customDateRange || !customDateRange[0] || !customDateRange[1])) {
      return; // Don't load until dates are selected
    }

    setIsLoading(true);
    const isStrictFilter = postFilter === "posted_within_period";

    // Format dates for API
    const start_date = period === "custom" && customDateRange ? customDateRange[0].toISOString().split("T")[0] : undefined;
    const end_date = period === "custom" && customDateRange ? customDateRange[1].toISOString().split("T")[0] : undefined;

    try {
      // Reset pagination states
      setCreatorsPage(1);
      setContentCursor(null);

      // Stagger the API calls for better UX
      const promises = [];

      // Key metrics (fastest, load first)
      setKeyMetricsLoading(true);
      const keyMetricsParams = usePublicApi ? { period, strict_filter: isStrictFilter, start_date, end_date } : null;
      const keyMetricsCall = usePublicApi
        ? getPublicKeyMetrics(campaignId, keyMetricsParams)
        : isCreatorUser ? getCreatorKeyMetrics(period, campaignId, isStrictFilter, start_date, end_date, lastNPosts)
        : getKeyMetrics(period, campaignId, creatorId, isStrictFilter, start_date, end_date, lastNPosts);

      promises.push(
        keyMetricsCall
          .then((response) => {
            if (response.status === 200) {
              setKeyMetrics(response.data.data);
              setMetadata(response.data.metadata);
              setKeyMetricsError(null);
            } else {
              setKeyMetricsError("Failed to load key metrics");
            }
          })
          .catch((err) => {
            console.error("Key metrics load error:", err);
            setKeyMetricsError("Error loading key metrics");
          })
          .finally(() => setKeyMetricsLoading(false))
      );

      // Performance graph is handled by separate useEffect

      // Top creators
      if (!isCreatorUser) {
        setTopCreatorsLoading(true);
        const topCreatorsParams = usePublicApi ? { period, limit: 10, page: 1, strict_filter: isStrictFilter, start_date, end_date } : null;
        const topCreatorsCall = usePublicApi
          ? getPublicTopCreators(campaignId, topCreatorsParams)
          : getTopCreators(period, 10, 1, isStrictFilter, campaignId, creatorId, start_date, end_date, lastNPosts);

        promises.push(
          topCreatorsCall
            .then((response) => {
              if (response.status === 200) {
                setTopCreators(response.data.data);
                setCreatorsPagination(response.data.pagination);
                setTopCreatorsError(null);
              } else {
                setTopCreatorsError("Failed to load top creators");
              }
            })
            .catch((err) => {
              console.error("Top creators load error:", err);
              setTopCreatorsError("Error loading top creators");
            })
            .finally(() => setTopCreatorsLoading(false))
        );
      }

      // Top content
      setTopContentLoading(true);
      const topContentParams = usePublicApi ? { period, limit: 10, strict_filter: isStrictFilter, start_date, end_date } : null;
      const topContentCall = usePublicApi
        ? getPublicTopContent(campaignId, topContentParams)
        : isCreatorUser ? getCreatorTopContent(period, 10, null, isStrictFilter, campaignId, start_date, end_date, lastNPosts)
        : getTopContent(period, 10, null, isStrictFilter, campaignId, creatorId, start_date, end_date, lastNPosts);

      promises.push(
        topContentCall
          .then((response) => {
            if (response.status === 200) {
              setTopContent(response.data.data);
              setContentPagination(response.data.pagination);
              setTopContentError(null);
            } else {
              setTopContentError("Failed to load top content");
            }
          })
          .catch((err) => {
            console.error("Top content load error:", err);
            setTopContentError("Error loading top content");
          })
          .finally(() => setTopContentLoading(false))
      );

      // Wait for all promises to complete
      await Promise.allSettled(promises);

      // Set loading to false once we have at least key metrics
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Error loading dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load more creators
  const loadMoreCreators = async () => {
    if (isCreatorUser || topCreatorsLoading || !creatorsPagination?.hasNext) return;

    setTopCreatorsLoading(true);
    const isStrictFilter = postFilter === "posted_within_period";

    // Format dates for API
    const start_date = period === "custom" && customDateRange ? customDateRange[0].toISOString().split("T")[0] : undefined;
    const end_date = period === "custom" && customDateRange ? customDateRange[1].toISOString().split("T")[0] : undefined;

    try {
      const moreCreatorsParams = usePublicApi
        ? { period, limit: 10, page: creatorsPage + 1, strict_filter: isStrictFilter, start_date, end_date }
        : null;
      const response = usePublicApi
        ? await getPublicTopCreators(campaignId, moreCreatorsParams)
        : await getTopCreators(period, 10, creatorsPage + 1, isStrictFilter, campaignId, creatorId, start_date, end_date, lastNPosts);
      if (response.status === 200) {
        setTopCreators((prev) => [...prev, ...response.data.data]);
        setCreatorsPagination(response.data.pagination);
        setCreatorsPage((prev) => prev + 1);
        setTopCreatorsError(null);
      } else {
        setTopCreatorsError("Failed to load more creators");
      }
    } catch (err) {
      console.error("Load more creators error:", err);
      setTopCreatorsError("Error loading more creators");
    } finally {
      setTopCreatorsLoading(false);
    }
  };

  // Load more content
  const loadMoreContent = async () => {
    if (topContentLoading || !contentPagination?.hasNext) return;

    setTopContentLoading(true);
    const isStrictFilter = postFilter === "posted_within_period";

    // Format dates for API
    const start_date = period === "custom" && customDateRange ? customDateRange[0].toISOString().split("T")[0] : undefined;
    const end_date = period === "custom" && customDateRange ? customDateRange[1].toISOString().split("T")[0] : undefined;

    try {
      const moreContentParams = usePublicApi
        ? { period, limit: 10, cursor: contentPagination.cursor, strict_filter: isStrictFilter, start_date, end_date }
        : null;
      const response = usePublicApi
        ? await getPublicTopContent(campaignId, moreContentParams)
        : await getTopContent(period, 10, contentPagination.cursor, isStrictFilter, campaignId, creatorId, start_date, end_date, lastNPosts);
      if (response.status === 200) {
        setTopContent((prev) => [...prev, ...response.data.data]);
        setContentPagination(response.data.pagination);
        setTopContentError(null);
      } else {
        setTopContentError("Failed to load more content");
      }
    } catch (err) {
      console.error("Load more content error:", err);
      setTopContentError("Error loading more content");
    } finally {
      setTopContentLoading(false);
    }
  };

  // Reset data when switching between campaign/creator/all views
  useEffect(() => {
    setDashboardData(null);
    setMetadata(null);
    setError(null);
    setLoading(true); // Reset loading state when switching views
  }, [campaignId, creatorId]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load data when period changes or when switching views
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      // For custom period, only load if we have valid dates
      if (period === "custom" && (!customDateRange || !customDateRange[0] || !customDateRange[1])) {
        return;
      }

      try {
        await loadDashboardData();
      } catch (err) {
        if (mounted) {
          console.error("Metrics load error:", err);
          setError("Error loading metrics data");
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [period, postFilter, lastNPosts, campaignId, creatorId, customDateRange]);

  // Load performance graph when viewType or other dependencies change
  useEffect(() => {
    if (!performanceGraphLoading && !isLoading) {
      // For custom period, ensure we have valid dates
      if (period === "custom" && (!customDateRange || !customDateRange[0] || !customDateRange[1])) {
        return; // Don't load until dates are selected
      }

      const isStrictFilter = postFilter === "posted_within_period";
      setPerformanceGraphLoading(true);

      // Format dates for API
      const start_date = period === "custom" && customDateRange ? customDateRange[0].toISOString().split("T")[0] : undefined;
      const end_date = period === "custom" && customDateRange ? customDateRange[1].toISOString().split("T")[0] : undefined;

      const performanceParams = usePublicApi ? { period, strict_filter: isStrictFilter, view_type: viewType, start_date, end_date } : null;
      const performanceCall = usePublicApi
        ? getPublicPerformanceGraph(campaignId, performanceParams)
        : isCreatorUser ? getCreatorPerformanceGraph(period, campaignId, isStrictFilter, start_date, end_date, lastNPosts)
        : getPerformanceGraph(
            period,
            campaignId ? [campaignId] : null,
            creatorId ? [creatorId] : null,
            isStrictFilter,
            viewType,
            true,
            start_date,
            end_date,
            false,
            lastNPosts
          );

      performanceCall
        .then((response) => {
          if (response.status === 200) {
            setPerformanceGraph(response.data.data);
            setPerformanceGraphError(null);
          } else {
            setPerformanceGraphError("Failed to load performance graph");
          }
        })
        .catch((err) => {
          console.error("Performance graph load error:", err);
          setPerformanceGraphError("Error loading performance graph");
        })
        .finally(() => setPerformanceGraphLoading(false));
    }
  }, [viewType, period, postFilter, lastNPosts, campaignId, creatorId, usePublicApi, customDateRange]);

  // Export data - V1 (PRESERVED FOR EASY REVERT)
  // const handleExport = async (exportType = 'pdf') => {
  // 	let title = "Key Metrics";
  // 	if (campaignId) title = "Campaign Metrics";
  // 	else if (creatorId) title = "Creator Metrics";

  // 	setIsExporting(true);
  // 	setIsExportDropdownOpen(false);

  // 	try {
  // 		if (exportType === 'pdf') {
  // 			const responseData = usePublicApi
  // 				? await getPublicReport(campaignId)
  // 				: await generateReport(campaignId, creatorId);

  // 			if (responseData.status === 200) {
  // 				await exportMetricsToPDF(responseData.data, period, title);
  // 			}
  // 		} else if (exportType === 'csv') {
  // 			// Get performance graph data with group=false for daily data
  // 			const isStrictFilter = postFilter === 'posted_within_period';

  // 			// Format dates for API
  // 			const start_date = period === 'custom' && customDateRange ?
  // 				customDateRange[0].toISOString().split('T')[0] : undefined;
  // 			const end_date = period === 'custom' && customDateRange ?
  // 				customDateRange[1].toISOString().split('T')[0] : undefined;

  // 			const params = usePublicApi
  // 				? { period, strict_filter: isStrictFilter, view_type: viewType, group: false, start_date, end_date }
  // 				: null;

  // 			const response = usePublicApi
  // 				? await getPublicPerformanceGraph(campaignId, params)
  // 				: await getPerformanceGraph(period, campaignId ? [campaignId] : null, creatorId ? [creatorId] : null, isStrictFilter, viewType, false, start_date, end_date);

  // 			if (response.status === 200) {
  // 				// Get campaign or creator name for filename
  // 				let name = null;
  // 				if (campaignId && keyMetrics?.campaign_name) {
  // 					name = keyMetrics.campaign_name;
  // 				} else if (creatorId && keyMetrics?.creator_name) {
  // 					name = keyMetrics.creator_name;
  // 				}

  // 				exportMetricsToCSV(response.data.data || response.data.graph_data || response.data, name, creatorId ? name : null);
  // 			}
  // 		}
  // 	} catch (error) {
  // 		console.error(`Error exporting ${exportType}:`, error);
  // 		// You might want to show a toast notification here
  // 	} finally {
  // 		setIsExporting(false);
  // 	}
  // };

  // Export data - V2 (USES LOCALLY LOADED DATA)
  const handleExport = async (exportType = "pdf") => {
    let title = "Key Metrics";
    if (campaignId) title = "Campaign Metrics";
    else if (creatorId) title = "Creator Metrics";

    setIsExporting(true);
    setIsExportDropdownOpen(false);

    try {
      if (exportType === "pdf") {
        // V2: Use already loaded data instead of making new API call
        const exportData = {
          metrics: keyMetrics || {},
          performance: performanceGraph || [],
          creatorPerformance: topCreators || [],
          contentPerformance: topContent || [],
          weeklyBreakdown: [], // We don't have weekly breakdown in current loaded data
        };

        // Pass custom date range if it's a custom period
        const periodOrDateRange = period === "custom" && customDateRange ? { startDate: customDateRange[0], endDate: customDateRange[1] } : period;

        await exportMetricsToPDF(exportData, periodOrDateRange, title);
      } else if (exportType === "csv") {
        // CSV export still needs the full data, so we make an API call for it
        // This could be optimized in future if needed
        const isStrictFilter = postFilter === "posted_within_period";

        // Format dates for API
        const start_date = period === "custom" && customDateRange ? customDateRange[0].toISOString().split("T")[0] : undefined;
        const end_date = period === "custom" && customDateRange ? customDateRange[1].toISOString().split("T")[0] : undefined;

        const params = usePublicApi
          ? { period, strict_filter: isStrictFilter, view_type: viewType, group: false, start_date, end_date, csv: true }
          : null;

        const response = usePublicApi
          ? await getPublicPerformanceGraph(campaignId, params)
          : await getPerformanceGraph(
              period,
              campaignId ? [campaignId] : null,
              creatorId ? [creatorId] : null,
              isStrictFilter,
              viewType,
              false,
              start_date,
              end_date,
              true,
              lastNPosts
            );

        if (response.status === 200) {
          // Get campaign or creator name for filename
          let name = null;
          if (campaignId && keyMetrics?.campaign_name) {
            name = keyMetrics.campaign_name;
          } else if (creatorId && keyMetrics?.creator_name) {
            name = keyMetrics.creator_name;
          }

          exportMetricsToCSV(response.data.data || response.data.graph_data || response.data, name, creatorId ? name : null);
        }
      }
    } catch (error) {
      console.error(`Error exporting ${exportType}:`, error);
      // You might want to show a toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  // Share link
  const handleShareLink = async () => {
    setIsSharingLink(true);
    try {
      const response = await generateShareLink(campaignId, creatorId);

      if (response.status === 200) {
        setShareLink(response.data.share_link);
        setIsShareModalOpen(true);
        setShareLinkCopied(false);
      }
    } catch (error) {
      console.error("Error generating share link:", error);
      // You might want to show a toast notification here
    } finally {
      setIsSharingLink(false);
    }
  };

  // Copy share link to clipboard
  const handleCopyShareLink = () => {
    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        setShareLinkCopied(true);
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setShareLinkCopied(false);
        }, 2000);
      })
      .catch((error) => {
        console.error("Error copying to clipboard:", error);
      });
  };

  // Render
  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingCircleScreen />
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.container}>
        <div style={{ padding: "24px 0" }}>
          <h1 style={{ fontSize: "24px" }}>Error</h1>
          <p style={{ color: "#dc3545" }}>{error}</p>
        </div>
      </div>
    );
  }

  // Use current API data
  const metrics = keyMetrics || dashboardData?.metrics;
  const performance = performanceGraph || dashboardData?.performance;
  const creatorPerformance = topCreators || dashboardData?.creatorPerformance || [];
  const contentPerformance = topContent || dashboardData?.contentPerformance || [];

  // Render
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={`${styles.header} ${(campaignId === null && creatorId === null) ? "" : styles.campaignHeader}`}>
        {/* {(campaignId === null && creatorId === null) && <h1 className={styles.headerTitle}>Analytics</h1>} */}
        {((campaignId === null && creatorId === null) || (pageTitle !== null)) ?
          <h1 className={styles.headerTitle}>{(pageTitle === null) ? "Dashboard" : pageTitle}</h1>
        : (isCreatorUser) ?
          <h1 className={styles.headerTitleSmall}>Key Metrics</h1>
        :
          <><span /> {/* Force rest of header to right */}</>
        }
        <div
          style={{
            // width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            justifyContent: campaignId === null && creatorId === null ? "flex-end" : "space-between",
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: usePublicApi || (campaignId === null && creatorId === null) ? "flex-end" : "flex-start",
            }}
          >
            {/* <div className={styles.timePeriodSwitcher}>
							{periodOptions.map(option => (
								<button
									key={option.value}
									onClick={() => setPeriod(option.value)}
									className={`${styles.timePeriodButton} ${period === option.value ? styles.selected : ''}`}
								>
									{option.label}
								</button>
							))}
						</div> */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              {/* Cache age indicator */}
              <span className={styles.cacheAgeIndicator}>
                {metadata?.cache_age_minutes != null ? (
                  <svg width="12" height="12" viewBox="0 0 22 22" style={{ marginRight: 6, flexShrink: 0 }}>
                    <circle cx="11" cy="11" r="11" fill="#28a745" />
                    <path d="M6.5 11.5l3 3 6-6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 22 22" style={{ marginRight: 6, flexShrink: 0, animation: "spin 1s linear infinite" }}>
                    <circle cx="11" cy="11" r="9" stroke="#bbb" strokeWidth="3" fill="none" opacity="0.3" />
                    <path d="M20 11a9 9 0 0 0-9-9" stroke="#888" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                  </svg>
                )}
                {getCacheAgeString(metadata?.cache_age_minutes)}
              </span>
              <button
                onClick={() => {
                  setIsPeriodDropdownOpen(!isPeriodDropdownOpen);
                  setIsPostFilterDropdownOpen(false); // Close the other dropdown
                  setIsExportDropdownOpen(false); // Close export dropdown
                }}
                className={detailsStyles.filterButton}
                style={{ background: "white", color: "black", border: "1px solid var(--brd-light)" }}
              >
                {getPeriodButtonText(period)}
                <span className={`${detailsStyles.dropdownArrow} ${isPeriodDropdownOpen ? detailsStyles.dropdownArrowOpen : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m19 9-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {isPeriodDropdownOpen && (
                <div className={detailsStyles.dropdownContainer} style={{ left: 0, right: "auto" }}>
                  {periodOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        if (option.value === "custom") {
                          setIsCustomDateModalOpen(true);
                          setIsPeriodDropdownOpen(false);
                        } else {
                          setPeriod(option.value);
                          setIsPeriodDropdownOpen(false);
                        }
                      }}
                      className={`${detailsStyles.filterOption} ${period === option.value ? detailsStyles.filterOptionSelected : ""}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setIsPostFilterDropdownOpen(!isPostFilterDropdownOpen);
                  setIsPeriodDropdownOpen(false); // Close the other dropdown
                  setIsExportDropdownOpen(false); // Close export dropdown
                }}
                className={detailsStyles.filterButton}
                style={{ background: "white", color: "black", border: "1px solid var(--brd-light)" }}
              >
                {getPostFilterButtonText(postFilter)}
                <span className={`${detailsStyles.dropdownArrow} ${isPostFilterDropdownOpen ? detailsStyles.dropdownArrowOpen : ""}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m19 9-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {(isPostFilterDropdownOpen) && (
                <div className={detailsStyles.dropdownContainer} style={{ left: 0, right: "auto" }}>
                  {postFilterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setPostFilter(option.value);
                        setIsPostFilterDropdownOpen(false);
                      }}
                      className={`${detailsStyles.filterOption} ${postFilter === option.value ? detailsStyles.filterOptionSelected : ""}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {(!isCreatorUser) && (
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  placeholder="Last Posts"
                  value={lastNPosts}
                  onChange={(e) => setLastNPosts(e.target.value)}
                  className={detailsStyles.filterButton}
                  style={{
                    background: "white",
                    color: "black",
                    border: "1px solid var(--brd-light)",
                    width: "140px",
                    textAlign: "center",
                  }}
                  min="1"
                  max="1000"
                />
              </div>
            )}
          </div>
          {(!isCreatorUser && campaignId !== null && !hideShareButton) && (
            <button className={styles.shareLinkButton} onClick={handleShareLink} disabled={isSharingLink}>
              {EXTERNAL_LINK_ICON}
              Share
            </button>
          )}
          {(!isCreatorUser) &&
            <div style={{ position: "relative" }}>
              <button
                className={styles.exportButton}
                onClick={() => {
                  setIsExportDropdownOpen(!isExportDropdownOpen);
                  setIsPeriodDropdownOpen(false);
                  setIsPostFilterDropdownOpen(false);
                }}
                disabled={isExporting}
              >
                {EXPORT_ICON}
                {isExporting ? <>Exporting...</> : <>Export</>}
              </button>
              {isExportDropdownOpen && (
                <div className={detailsStyles.dropdownContainer} style={{ left: "auto", right: 0 }}>
                  <button
                    className={detailsStyles.filterOption}
                    onClick={() => {
                      handleExport("pdf");
                      setIsExportDropdownOpen(false);
                    }}
                  >
                    Export PDF
                  </button>
                  <button
                    className={detailsStyles.filterOption}
                    onClick={() => {
                      handleExport("csv");
                      setIsExportDropdownOpen(false);
                    }}
                  >
                    Export CSV
                  </button>
                </div>
              )}
            </div>
          }
        </div>
      </div>

      {/* Custom Date Range Modal */}
      <CustomDateRangeModal
        isOpen={isCustomDateModalOpen}
        onClose={() => setIsCustomDateModalOpen(false)}
        initialValue={customDateRange}
        onApply={(value) => {
          setCustomDateRange(value);
          setPeriod("custom");
          // Reset pagination when date range changes
          setCreatorsPage(1);
          setContentCursor(null);
        }}
        minDate={null}
        maxDate={new Date()}
      />

      {/* Metrics */}
      <div style={{ padding: "24px 0" }}>
        {keyMetricsLoading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <LoadingCircle />
            <p style={{ marginTop: "16px", color: "#667" }}>Loading key metrics...</p>
          </div>
        ) : keyMetricsError ? (
          <div
            style={{
              color: "#dc3545",
              background: "#f8d7da",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            {keyMetricsError}
          </div>
        ) : metrics ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "16px",
              marginBottom: "50px",
            }}
          >
            <MetricCard
              // large={usePublicApi}
              large={true}
              icon={POSTS_ICON}
              title="Total Posts"
              value={metrics.total_posts}
              prevValue={metrics.prev_total_posts}
              formatValue={formatNumber}
              period={period}
            />
            {(metrics.ig_total_posts > 0) && (
              <MetricCard
                // large={usePublicApi}
                large={true}
                icon={INSTAGRAM_ICON}
                title="Instagram Posts"
                value={metrics.ig_total_posts}
                formatValue={formatNumber}
                period={period}
              />
            )}
            {(metrics.tt_total_posts > 0) && (
              <MetricCard
                // large={usePublicApi}
                large={true}
                icon={TIKTOK_ICON}
                title="TikTok Posts"
                value={metrics.tt_total_posts}
                formatValue={formatNumber}
                period={period}
              />
            )}
            <MetricCard
              // large={usePublicApi}
              large={true}
              icon={VIEWS_ICON}
              title="Total Views"
              value={metrics.total_views}
              prevValue={metrics.prev_total_views}
              formatValue={formatNumber}
              period={period}
            />
            <MetricCard
              // large={usePublicApi}
              large={true}
              icon={LIKES_ICON}
              title="Total Likes"
              value={metrics.total_likes}
              prevValue={metrics.prev_total_likes}
              formatValue={formatNumber}
              period={period}
            />
            <MetricCard
              // large={usePublicApi}
              large={true}
              icon={COMMENTS_ICON}
              title="Total Comments"
              value={metrics.total_comments}
              prevValue={metrics.prev_total_comments}
              formatValue={formatNumber}
              period={period}
            />
            <MetricCard
              // large={usePublicApi}
              large={true}
              icon={SHARE_ICON}
              title="Total Shares"
              value={metrics.total_shares}
              prevValue={metrics.prev_total_shares}
              formatValue={formatNumber}
              period={period}
            />
            <MetricCard
              // large={usePublicApi}
              large={true}
              icon={RATE_ICON}
              title="Engagement Rate"
              value={metrics.engagement_rate}
              prevValue={metrics.prev_engagement_rate}
              formatValue={(v) => `${(v * 100).toFixed(2)}%`}
              period={period}
            />
          </div>
        ) : null}

        {/* Performance Graph */}
        <div style={{ marginBottom: "32px" }} id="performance-graph">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "500", fontFamily: "Transducer" }}>Performance</h2>
            <div className={styles.viewTypeToggle}>
              <button
                onClick={() => setViewType("incremental")}
                className={`${styles.viewTypeButton} ${viewType === "incremental" ? styles.active : ""}`}
              >
                Incremental
              </button>
              <button
                onClick={() => setViewType("cumulative")}
                className={`${styles.viewTypeButton} ${viewType === "cumulative" ? styles.active : ""}`}
              >
                Cumulative
              </button>
            </div>
          </div>
          {performanceGraphLoading ? (
            <div style={{ background: "white", borderRadius: "8px", border: "1px solid var(--brd-light)", padding: "24px", textAlign: "center" }}>
              <LoadingCircle />
              <p style={{ marginTop: "16px", color: "#667" }}>Loading performance data...</p>
            </div>
          ) : performanceGraphError ? (
            <div
              style={{
                color: "#dc3545",
                background: "#f8d7da",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              {performanceGraphError}
            </div>
          ) : performance ? (
            <div style={{ background: "white", borderRadius: "8px", border: "1px solid var(--brd-light)", padding: "24px" }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performance || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    interval={1}
                    type="category"
                  />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, calculateMaxValue(performance)]} tickFormatter={(value) => formatNumber(value)} />
                  <Tooltip
                    formatter={(value, name) => [formatNumber(value), name]}
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                  />
                  <Line type="monotone" dataKey="views" name="Views" stroke="#ff5c5c" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="likes" name="Likes" stroke="#1abc9c" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="comments" name="Comments" stroke="#34495e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="shares" name="Shares" stroke="#f1c40f" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </div>

        {/* Creator Performance */}
        {(!isCreatorUser) && (
          <div className={styles.creatorPerformanceSection}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 className={styles.creatorPerformanceTitle}>Top Creators</h2>
              {campaignId === null && creatorId === null && (
                <NavLink to="/team/creators" className={styles.viewAllLink}>
                  View All →
                </NavLink>
              )}
            </div>
            {topCreatorsLoading ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <LoadingCircle />
                <p style={{ marginTop: "16px", color: "#667" }}>Loading top creators...</p>
              </div>
            ) : topCreatorsError ? (
              <div
                style={{
                  color: "#dc3545",
                  background: "#f8d7da",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "24px",
                }}
              >
                {topCreatorsError}
              </div>
            ) : (
              <div className={styles.creatorPerformanceList}>
                {creatorPerformance
                  .sort((a, b) => b.total_views - a.total_views)
                  .map((creator, index) => {
                    // Use the first platform for the popup if there are multiple
                    const primaryPlatform = creator.platforms && creator.platforms.length > 0 ? creator.platforms[0] : null;
                    const creatorUsername = creator.social?.handle;
                    
                    return (
                      <CreatorPopup
                        key={`${creator.id}-${index}`}
                        platform={primaryPlatform}
                        username={creatorUsername}
                        trigger={
                          <div className={styles.creatorCard}>
                            <div className={styles.creatorHeader}>
                              <img src={creator.profile_img || "/defaults/u.webp"} alt={creator.name} className={styles.creatorProfileImage} />
                              <h3 className={styles.creatorName}>{creator.name}</h3>
                              <div className={styles.creatorSocialInfo}>
                                {creator.social && (
                                  <>
                                    <img
                                      src={creator.social.pfp ?? "/defaults/u.webp"}
                                      alt={`${creator.name}'s social profile`}
                                      className={styles.creatorSocialPfp}
                                    />
                                    <span className={styles.creatorHandle}>@{creator.social.handle}</span>
                                  </>
                                )}
                              </div>
                              <div className={styles.platformIcons}>
                                {creator.platforms.map((platform, index) => {
                                  return platform === "tt" ? (
                                    <FaTiktok key={`${platform}-${index}`} style={{ color: "#000000" }} />
                                  ) : (
                                    <FaInstagram key={`${platform}-${index}`} style={{ color: "#E1306C" }} />
                                  );
                                })}
                              </div>
                            </div>
                            <div className={`${dashboardStyles.postMetricsGrid} ${dashboardStyles.autogrid}`}>
                              <div>
                                <span className={dashboardStyles.metricLabel}>{VIEWS_ICON}Views</span>
                                <span className={dashboardStyles.metricValue}>{formatNumber(creator.total_views)}</span>
                              </div>
                              <div>
                                <span className={dashboardStyles.metricLabel}>{LIKES_ICON}Likes</span>
                                <span className={dashboardStyles.metricValue}>{formatNumber(creator.total_likes)}</span>
                              </div>
                              <div>
                                <span className={dashboardStyles.metricLabel}>{COMMENTS_ICON}Comments</span>
                                <span className={dashboardStyles.metricValue}>{formatNumber(creator.total_comments)}</span>
                              </div>
                              <div>
                                <span className={dashboardStyles.metricLabel}>{SHARE_ICON}Shares</span>
                                <span className={dashboardStyles.metricValue}>{formatNumber(creator.total_shares)}</span>
                              </div>
                              <div>
                                <span className={dashboardStyles.metricLabel}>{RATE_ICON}Engagement Rate</span>
                                <span className={dashboardStyles.metricValue}>{(100 * (creator.engagement_rate ?? 0)).toFixed(2)}%</span>
                              </div>
                            </div>
                          </div>
                        }
                      />
                    );
                  })}
                {(creatorPerformance.length === 0) && <EmptyView message="No creator data available." />}
                {creatorsPagination?.hasNext && (
                  <div style={{ textAlign: "center", margin: "12px auto 0 auto", width: "fit-content" }}>
                    {topCreatorsLoading ? (
                      <LoadingCircle />
                    ) : (
                      <button onClick={loadMoreCreators} className={`${styles.shareLinkButton} ${styles.loadMoreButton}`}>
                        Load More
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content Performance */}
        <div className={styles.contentPerformanceSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 className={styles.contentPerformanceTitle}>Top Content</h2>
            {campaignId === null && creatorId === null && (
              <NavLink to="/team/campaigns" className={styles.viewAllLink}>
                View All →
              </NavLink>
            )}
          </div>
          {topContentLoading && contentPerformance.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <LoadingCircle />
              <p style={{ marginTop: "16px", color: "#667" }}>Loading top content...</p>
            </div>
          ) : topContentError ? (
            <div
              style={{
                color: "#dc3545",
                background: "#f8d7da",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              {topContentError}
            </div>
          ) : (
            <div className={dashboardStyles.postsList}>
              {contentPerformance.map((post) => (
                <CampaignPostCard
                  key={post.id}
                  postId={post.id}
                  creatorUserPfp={post.user_pfp}
                  creatorUserName={post.user_name}
                  creatorSocialPfp={post.creator_pfp}
                  creatorSocialHandle={post.creator_handle}
                  creatorSocialDisplayName={post.creator_name}
                  campaignName={post.campaign_name}
                  postPlatform={post.creator_platform}
                  postThumbnail={post.thumbnail}
                  postCaption={post.caption}
                  postTs={post.post_ts}
                  postSubmitTs={post.created_ts}
                  postViews={post.views}
                  postLikes={post.likes}
                  postComments={post.comments}
                  postShares={post.shares}
                  postUrl={post.post_url}
                  showCreatorUserAccount={!isCreatorUser}
                />
              ))}
              {(contentPerformance.length === 0) && <EmptyView message="No posts yet." />}
              {contentPagination?.hasNext && (
                <div style={{ textAlign: "center", margin: "12px auto 0 auto", width: "fit-content" }}>
                  {topContentLoading ? (
                    <LoadingCircle />
                  ) : (
                    <button onClick={loadMoreContent} className={`${styles.shareLinkButton} ${styles.loadMoreButton}`}>
                      Load More
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden performance graph for PDF export */}
      <div style={{ position: "absolute", left: "-9999px", top: "0" }}>
        <ExportPDFGraph performance={performance || []} />
      </div>

      {/* Share Link Modal */}
      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareLink={shareLink}
        copied={shareLinkCopied}
        onCopyLink={handleCopyShareLink}
      />
    </div>
  );
};
