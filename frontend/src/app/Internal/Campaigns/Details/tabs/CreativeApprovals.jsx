// Dependencies
import { useState, useEffect } from "react";

// API Imports
import { getCampaignCreatives } from "../../../../../api/internal";

// Component Imports
import LoadingCircle from "../../../../../ui/Components/LoadingCircle/LoadingCircle";
import CreativeApprovalDetailsModal from "../../../CreativeApproval/components/DetailsModal";
import { EmptyView } from "../../../../../ui/Components";

// Style Imports
import styles from "../Details.module.css";

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
	
	return `${month} ${day}${year}`;
};

// Creative Approvals Tab Component
export default function CreativeApprovalsTab({ campaign }) {
	// States
	const [creatives, setCreatives] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState(null);

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState(null);

	// Filter states
	const [statusFilter, setStatusFilter] = useState("pending");
	const [timeFrameFilter, setTimeFrameFilter] = useState("all");

	// Sort states
	const [sortBy, setSortBy] = useState("newest");

	// Dropdown states
	const [activeDropdown, setActiveDropdown] = useState(null); // null, "filter", or "sort"

	// Modal state
	const [selectedCreativeId, setSelectedCreativeId] = useState(null);

	// Style imports for Load More button
	const metricsStyles = require("../../../Metrics/Home.module.css").default;

	// Load initial creatives
	const loadCreatives = async () => {
		try {
			setLoading(true);
			setError(null);
			setCurrentPage(1);

			const response = await getCampaignCreatives(
				campaign.id,
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

			const response = await getCampaignCreatives(
				campaign.id,
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

	// Reset and reload when filters or sort change
	useEffect(() => {
		loadCreatives();
	}, [campaign.id, statusFilter, timeFrameFilter, sortBy]);

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

	// Render loading state
	if (loading) {
		return (
			<div style={{ textAlign: "center", padding: "24px", color: "#667" }}>
				<LoadingCircle />
			</div>
		);
	}

	// Render error state
	if (error) {
		return (
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
		);
	}

	// Render creatives
	return (
		<>
			<div
				style={{
					marginBottom: "24px",
					display: "flex",
					justifyContent: "flex-end",
					alignItems: "center",
					gap: "16px",
				}}
			>
				{/* Filter Button */}
				<div style={{ position: "relative" }}>
					<button
						className={styles.filterButton}
						onClick={() =>
							setActiveDropdown((activeDropdown === "filter") ? null : "filter")
						}
					>
						Filter
						<span className={`${styles.dropdownArrow} ${(activeDropdown === "filter") ? styles.dropdownArrowOpen : ''}`}>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
								<path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m19 9-7 7-7-7"/>
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
							<div className={styles.dropdownMenu}>
								<div className={styles.dropdownSection}>
									<div className={styles.dropdownSectionTitle}>Status</div>
									<button type="button" className={`${styles.dropdownItemButton} ${(statusFilter === "pending") ? styles.dropdownItemButtonActive : ""}`} onClick={() => setStatusFilter("pending")}>
										Pending
									</button>
									<button type="button" className={`${styles.dropdownItemButton} ${(statusFilter === "approved") ? styles.dropdownItemButtonActive : ""}`} onClick={() => setStatusFilter("approved")}>
										Approved
									</button>
									<button type="button" className={`${styles.dropdownItemButton} ${(statusFilter === "rejected") ? styles.dropdownItemButtonActive : ""}`} onClick={() => setStatusFilter("rejected")}>
										Rejected
									</button>
								</div>
								<div className={styles.dropdownSection}>
									<div className={styles.dropdownSectionTitle}>Time Frame</div>
									<button type="button" className={`${styles.dropdownItemButton} ${(timeFrameFilter === "all") ? styles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter("all")}>
										All Time
									</button>
									<button type="button" className={`${styles.dropdownItemButton} ${(timeFrameFilter === "24h") ? styles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter("24h")}>
										Last 24 Hours
									</button>
									<button type="button" className={`${styles.dropdownItemButton} ${(timeFrameFilter === "7d") ? styles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter("7d")}>
										Last 7 Days
									</button>
									<button type="button" className={`${styles.dropdownItemButton} ${(timeFrameFilter === "30d") ? styles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter("30d")}>
										Last 30 Days
									</button>
									<button type="button" className={`${styles.dropdownItemButton} ${(timeFrameFilter === "90d") ? styles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter("90d")}>
										Last 90 Days
									</button>
								</div>
							</div>
						</>
					)}
				</div>

				{/* Sort Button */}
				<div style={{ position: "relative" }}>
					<button
						className={styles.sortButton}
						onClick={() =>
							setActiveDropdown((activeDropdown === "sort") ? null : "sort")
						}
					>
						Sort
						<span className={`${styles.dropdownArrow} ${(activeDropdown === "sort") ? styles.dropdownArrowOpen : ''}`}>
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
							<div className={styles.dropdownMenu}>
								<div className={styles.dropdownSection}>
									<div className={styles.dropdownSectionTitle}>Sort</div>
									<button type="button" className={`${styles.dropdownItemButton} ${(sortBy === "newest") ? styles.dropdownItemButtonActive : ""}`} onClick={() => setSortBy("newest")}>
										Newest
									</button>
									<button type="button" className={`${styles.dropdownItemButton} ${(sortBy === "oldest") ? styles.dropdownItemButtonActive : ""}`} onClick={() => setSortBy("oldest")}>
										Oldest
									</button>
								</div>
							</div>
						</>
					)}
				</div>
			</div>

			<div className={styles.postList}>
				{creatives.map((creative) => (
					<div
						key={creative.id}
						className={styles.creativeCard}
						onClick={() => handleCreativeClick(creative.id)}
						style={{ cursor: "pointer" }}
					>
						<div className={styles.creativeHeader}>
							<div className={styles.creativeCreatorInfo}>
								<img
									src={creative.creator.pfp ?? "/defaults/u.webp"}
									alt={creative.creator.name}
									className={styles.creatorPfp}
								/>
								<div>
									<div className={styles.creatorName}>
										{creative.creator.name}
									</div>
									<div className={styles.creativeTimestamp}>
										{formatDate(creative.created_ts)}
									</div>
								</div>
							</div>
							<div className={styles.creativeStatusBadge}>
								<span
									className={`${styles.statusBadge} ${
										styles[`statusBadge${creative.status.charAt(0).toUpperCase() + creative.status.slice(1)}`]
									}`}
								>
									{creative.status.charAt(0).toUpperCase() +
										creative.status.slice(1)}
								</span>
							</div>
						</div>
						<div className={styles.creativeContent}>
							<img className={styles.creativeThumbnail} src={creative.thumbnail} alt={""} />
							<div className={styles.creativeInfo}>
								<div className={styles.creativeCaption}>
									{creative.caption}
								</div>
								<div className={styles.creativeMetadata}>
									<div className={styles.creativePlatform}>
										{creative.platform === "tt" ? "TikTok" : "Instagram"}
									</div>
									<div className={styles.creativeType}>
										{(creative.content_type === "vid") ? <>
											<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>
											Video
										</> : <>
											<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/></svg>
											Image
										</>}
									</div>
									{(creative.version > 1) && (
										<div className={styles.creativeVersion}>
											Version {creative.version}
										</div>
									)}
								</div>
							</div>
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

			{/* Modal */}
			{selectedCreativeId && (
				<CreativeApprovalDetailsModal
					creativeId={selectedCreativeId}
					onClose={() => setSelectedCreativeId(null)}
					onStatusUpdate={handleStatusUpdate}
				/>
			)}
		</>
	);
}
