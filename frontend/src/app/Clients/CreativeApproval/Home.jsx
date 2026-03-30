// V1.1 - Creative Approvals
// * Creator Creative Approvals Home Page
// - Display all creatives for the creator, paginated with respect to active filters and sorts
// - Filter creatives by status (default status = null), time frame (default time frame = "all"), and platform
// - Sort creatives by newest & oldest
// - Click onto creative to open creative details modal

// Dependencies
import { useState, useEffect } from "react";

// API Imports
import { getCreatorCreatives } from "../../../api/creators";

// Component Imports
import LoadingCircle from "../../../ui/Components/LoadingCircle/LoadingCircle";
import LoadingCircleScreen from "../../../ui/Components/LoadingCircle/LoadingCircleScreen.jsx";
import CreativeApprovalSubmitModal from "./modals/CreativeSubmitModal";
import CreativeApprovalDetailsModal from "./modals/CreativeDetailsModal";
import { EmptyView } from "../../../ui/Components";

// Icon Imports
import { INSTAGRAM_ICON, TIKTOK_ICON } from "../../../assets/icons/svg";

// Style Imports
import styles from "./styles/CreativeApproval.module.css";
import campaignStyles from "../Campaigns/Campaigns.module.css";
import cardStyles from "../../Internal/Campaigns/Details/Details.module.css";
import dashboardStyles from "../Dashboard/Dashboard.module.css";

// Constants
const PAGE_SIZE = 25;

// Helper Functions
const formatDate = (dateString) => {
	if (!dateString) return "Not set";
	const date = new Date(dateString);
	const currentYear = new Date().getFullYear();

	const month = date.toLocaleString('default', { month: 'short' });
	const day = date.getDate();
	const year = date.getFullYear() !== currentYear ? ` ${date.getFullYear()}` : '';

	const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

	return `${time} on ${month} ${day}${year}`;
};

// Functional Component
export const CreatorCreativesHome = () => {
	// States
	const [creatives, setCreatives] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState(null);

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState(null);

	// Filter states
	const [statusFilter, setStatusFilter] = useState(null);
	const [timeFrameFilter, setTimeFrameFilter] = useState("all");

	// Sort states
	const [sortBy, setSortBy] = useState("newest");

	// Dropdown states
	const [activeDropdown, setActiveDropdown] = useState(null); // null, "filter", or "sort"

	// Modal state
	const [selectedCreativeId, setSelectedCreativeId] = useState(null);
	const [showSubmitModal, setShowSubmitModal] = useState(false);
	const [submitModalConfig, setSubmitModalConfig] = useState(null);

	// Refresh counter for reloading creatives after submission
	const [refreshCount, setRefreshCount] = useState(0);

	// Style imports for Load More button
	const metricsStyles = require("../../Internal/Metrics/Home.module.css").default;

	// Load initial creatives
	const loadCreatives = async () => {
		try {
			setLoading(true);
			setError(null);
			setCurrentPage(1);

			const response = await getCreatorCreatives(
				1,
				PAGE_SIZE,
				statusFilter,
				timeFrameFilter,
				sortBy
			);

			if (response.status === 200) {
				setCreatives(response.data.data.creatives);
				setPagination(response.data.data.pagination);
			} else {
				setError("Failed to load creatives");
			}
		} catch (err) {
			console.error("Error loading creatives:", err);
			setError("Error loading creatives");
		} finally {
			setLoading(false);
		}
	};

	// Load more creatives
	const loadMoreCreatives = async () => {
		if (loadingMore || !pagination || currentPage >= pagination.totalPages) return;

		try {
			setLoadingMore(true);
			const nextPage = currentPage + 1;

			const response = await getCreatorCreatives(
				nextPage,
				PAGE_SIZE,
				statusFilter,
				timeFrameFilter,
				sortBy
			);

			if (response.status === 200) {
				setCreatives((prev) => [...prev, ...response.data.data.creatives]);
				setPagination(response.data.data.pagination);
				setCurrentPage(nextPage);
			} else {
				setError("Failed to load more creatives");
			}
		} catch (err) {
			console.error("Error loading more creatives:", err);
			setError("Error loading more creatives");
		} finally {
			setLoadingMore(false);
		}
	};

	// Reset and reload when filters, sort, or refreshCount change
	useEffect(() => {
		loadCreatives();
	}, [statusFilter, timeFrameFilter, sortBy, refreshCount]);

	// Handle creative click
	const handleCreativeClick = (creativeId) => {
		setSelectedCreativeId(creativeId);
	};

	// Handle status update from modal
	const handleStatusUpdate = (creativeId, newStatus) => {
		setCreatives((prev) =>
			prev.map((creative) =>
				creative.id === creativeId
					? { ...creative, status: newStatus }
					: creative
			)
		);
	};

	// Handle resubmit from details modal
	const handleResubmit = (creativeId, campaignInfo) => {
		setSubmitModalConfig({
			mode: 'resubmit',
			creativeId: creativeId,
			campaign: campaignInfo
		});
		setShowSubmitModal(true);
	};

	// Handle delete from details modal
	const handleDelete = (creativeId) => {
		setCreatives((prev) => prev.filter((creative) => creative.id !== creativeId));
		loadCreatives(); // Reload to ensure consistency
	};

	// Handle submit modal close
	const handleSubmitModalClose = () => {
		setShowSubmitModal(false);
		setSubmitModalConfig(null);
	};

	// Handle successful submission
	const handleSubmitSuccess = () => {
		setShowSubmitModal(false);
		setSubmitModalConfig(null);
		setRefreshCount(prev => prev + 1); // Trigger reload via useEffect
	};

	// Render loading state
	if (loading) {
		return (
			<div className={campaignStyles.container}>
				<LoadingCircleScreen />
			</div>
		);
	}

	// Render error state
	if (error) {
		return (
			<div className={campaignStyles.container}>
				<div
					style={{
						color: "#dc3545",
						background: "#f8d7da",
						padding: "12px",
						borderRadius: "8px",
						marginBottom: "24px",
					}}
				>
					{error}
				</div>
			</div>
		);
	}

	// Render creatives
	return (
        <>
            {/* Modals */}
            {(showSubmitModal) && (
                <CreativeApprovalSubmitModal
                    onClose={handleSubmitModalClose}
                    onSubmit={handleSubmitSuccess}
                    config={submitModalConfig}
                />
            )}
            {(selectedCreativeId) && (
                <CreativeApprovalDetailsModal
                    creativeId={selectedCreativeId}
                    onClose={() => setSelectedCreativeId(null)}
                    onResubmit={handleResubmit}
                    onDelete={handleDelete}
                />
            )}

            {/* Dashboard Content */}
            <div className={campaignStyles.container}>
                <div className={campaignStyles.header}>
                    <h1 className={campaignStyles.title}>My Creatives</h1>
                </div>

                <div className={`${dashboardStyles.filterContainer} ${dashboardStyles.mt90}`}>
                    {/* Filter Button */}
                    <div className={dashboardStyles.filterButtonContainer} style={{ position: "relative" }}>
                        <button
                            className={cardStyles.creatorFilterButton}
                            onClick={() =>
                                setActiveDropdown((activeDropdown === "filter") ? null : "filter")
                            }
                        >
                            Filter
                            <span className={`${cardStyles.dropdownArrow} ${(activeDropdown === "filter") ? styles.dropdownArrowOpen : ''}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m19 9-7 7-7-7"/>
                                </svg>
                            </span>
                        </button>
                        {(activeDropdown === "filter") && (
                            <>
                                <div
                                    style={{
                                        position: "fixed",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        zIndex: 999,
                                    }}
                                    onClick={() => setActiveDropdown(null)}
                                />
                                <div className={cardStyles.dropdownMenu}>
                                    <div className={cardStyles.dropdownSection}>
                                        <div className={cardStyles.dropdownSectionTitle}>Status</div>
                                        <button type="button" className={`${cardStyles.dropdownItemButton} ${(statusFilter === null) ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setStatusFilter(null)}>
                                            All
                                        </button>
                                        <button type="button" className={`${cardStyles.dropdownItemButton} ${(statusFilter === "pending") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setStatusFilter("pending")}>
                                            Pending
                                        </button>
                                        <button type="button" className={`${cardStyles.dropdownItemButton} ${(statusFilter === "approved") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setStatusFilter("approved")}>
                                            Approved
                                        </button>
                                        <button type="button" className={`${cardStyles.dropdownItemButton} ${(statusFilter === "rejected") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setStatusFilter("rejected")}>
                                            Rejected
                                        </button>
                                    </div>
                                    <div className={cardStyles.dropdownSection}>
                                        <div className={cardStyles.dropdownSectionTitle}>Time Frame</div>
                                        <button type="button" className={`${cardStyles.dropdownItemButton} ${(timeFrameFilter === "all") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter("all")}>
                                            All Time
                                        </button>
                                        <button type="button" className={`${cardStyles.dropdownItemButton} ${(timeFrameFilter === "24h") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter("24h")}>
                                            Last 24 Hours
                                        </button>
                                        <button type="button" className={`${cardStyles.dropdownItemButton} ${(timeFrameFilter === "7d") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter("7d")}>
                                            Last 7 Days
                                        </button>
                                        <button type="button" className={`${cardStyles.dropdownItemButton} ${(timeFrameFilter === "30d") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter("30d")}>
                                            Last 30 Days
                                        </button>
                                        <button type="button" className={`${cardStyles.dropdownItemButton} ${(timeFrameFilter === "90d") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter("90d")}>
                                            Last 90 Days
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sort Button */}
                    <div className={dashboardStyles.filterButtonContainer} style={{ position: "relative" }}>
                        <button
                            className={cardStyles.sortButton}
                            onClick={() =>
                                setActiveDropdown((activeDropdown === "sort") ? null : "sort")
                            }
                        >
                            Sort
                            <span className={`${cardStyles.dropdownArrow} ${(activeDropdown === "sort") ? cardStyles.dropdownArrowOpen : ''}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m19 9-7 7-7-7"/>
                                </svg>
                            </span>
                        </button>
                        {(activeDropdown === "sort") && (
                            <>
                                <div
                                    style={{
                                        position: "fixed",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        zIndex: 999,
                                    }}
                                    onClick={() => setActiveDropdown(null)}
                                />
                                <div className={cardStyles.dropdownMenu}>
                                    <div className={cardStyles.dropdownSection}>
                                        <div className={cardStyles.dropdownSectionTitle}>Sort</div>
                                        <button type="button" className={`${cardStyles.dropdownItemButton} ${(sortBy === "newest") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setSortBy("newest")}>
                                            Newest First
                                        </button>
                                        <button type="button" className={`${cardStyles.dropdownItemButton} ${(sortBy === "oldest") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setSortBy("oldest")}>
                                            Oldest First
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className={dashboardStyles.filterButtonContainer} style={{ position: "relative" }}>
                        <button className={`${dashboardStyles.createButton} flex`} onClick={() => setShowSubmitModal(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>
                            Submit Creative
                        </button>
                    </div>
                </div>

                <div className={cardStyles.postList}>
                    {creatives.map((creative) => (
                        <div
                            key={creative.id}
                            className={cardStyles.creativeCard}
                            onClick={() => handleCreativeClick(creative.id)}
                            style={{ cursor: "pointer" }}
                        >
                            <div className={cardStyles.creativeHeader}>
                                <div className={cardStyles.creativeStatusBadge}>
                                    {(creative.version > 1) && (
                                        <div className={cardStyles.resubmitBadge}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                                            Resubmitted
                                        </div>
                                    )}
                                    <span
                                        className={`${cardStyles.statusBadge} ${
                                            cardStyles[`statusBadge${creative.status.charAt(0).toUpperCase() + creative.status.slice(1)}`]
                                        }`}
                                    >
                                        {creative.status.charAt(0).toUpperCase() +
                                            creative.status.slice(1)}
                                    </span>
                                </div>
                                <div className={cardStyles.creatorCreativeTimestamp}>
                                    {formatDate(creative.created_ts)}
                                </div>
                            </div>
                            <div className={cardStyles.creativeContent}>
                                <img className={cardStyles.creativeThumbnail} src={creative.thumbnail} alt={""} />
                                <div className={cardStyles.creativeInfo}>
                                    <div className={cardStyles.creativeCaption}>
                                        {creative.caption}
                                    </div>
                                    <div className={cardStyles.creativeMetadata}>
                                        <div className={cardStyles.creativePlatform}>
                                            {(creative.platform === "tt") ? <>
                                                {TIKTOK_ICON}
                                                TikTok
                                            </> : <>
                                                {INSTAGRAM_ICON}
                                                Instagram
                                            </>}
                                        </div>
                                        <div>•</div>
                                        <div className={cardStyles.creativeType}>
                                            {(creative.content_type === "vid") ? <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>
                                                Video
                                            </> : <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/></svg>
                                                Image
                                            </>}
                                        </div>
                                        {(creative.version > 1) && (<>
                                            <div>•</div>
                                            <div className={cardStyles.creativeVersion}>
                                                Version {creative.version}
                                            </div>
                                        </>)}
                                    </div>
                                </div>
                            </div>
                            <div className={cardStyles.creativeCreatorInfo}>
                                {/* Display Campaign Info */}
                                {creative.campaign && (
                                    <div className={cardStyles.creatorCampaignInfo}>
                                        {creative.campaign.logo && (
                                            <img
                                                src={creative.campaign.logo}
                                                alt={creative.campaign.name}
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    borderRadius: "4px",
                                                    objectFit: "cover"
                                                }}
                                            />
                                        )}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--main-hl)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="22" x2="2" y1="6" y2="6" />
                                            <line x1="22" x2="2" y1="18" y2="18" />
                                            <line x1="6" x2="6" y1="2" y2="22" />
                                            <line x1="18" x2="18" y1="2" y2="22" />
                                        </svg>
                                        {creative.campaign.name}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {(creatives.length === 0) && (
                        <EmptyView message="No creatives found." />
                    )}

                    {(pagination && currentPage < pagination.totalPages) && (
                        <div
                            style={{
                                textAlign: "center",
                                margin: "12px auto 0 auto",
                                width: "fit-content",
                            }}
                        >
                            {(loadingMore) ? (
                                <LoadingCircle />
                            ) : (
                                <button
                                    onClick={loadMoreCreatives}
                                    className={`${metricsStyles.shareLinkButton} ${metricsStyles.loadMoreButton}`}
                                >
                                    Load More
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
	);
}