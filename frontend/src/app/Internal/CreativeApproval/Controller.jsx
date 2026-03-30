// Dependencies
import { useState, useEffect } from "react";

// API Imports
import { getAllCreatives, getCreativeDirectors } from "../../../api/internal";

// Component Imports
import LoadingCircle from "../../../ui/Components/LoadingCircle/LoadingCircle";
import LoadingCircleScreen from "../../../ui/Components/LoadingCircle/LoadingCircleScreen";
import CreativeApprovalDetailsModal from "./components/DetailsModal";
import { EmptyView } from "../../../ui/Components";

// Icon Imports
import { INSTAGRAM_ICON, TIKTOK_ICON } from "../../../assets/icons/svg";

// Style Imports
import styles from "../../Clients/Dashboard/Dashboard.module.css";
import cardStyles from "../Campaigns/Details/Details.module.css";

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

// Creative Approvals Controller Component
export const CreativeApprovalController = () => {
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
	const [creativeDirectorFilter, setCreativeDirectorFilter] = useState(null);

	// Creative directors list
	const [creativeDirectors, setCreativeDirectors] = useState([]);
	const [loadingDirectors, setLoadingDirectors] = useState(true);

	// Sort states
	const [sortBy, setSortBy] = useState("newest");

	// Dropdown states
	const [activeDropdown, setActiveDropdown] = useState(null); // null, "filter", "sort", or "director"

	// Modal state
	const [selectedCreativeId, setSelectedCreativeId] = useState(null);

	// Style imports for Load More button
	const metricsStyles = require("../Metrics/Home.module.css").default;

	// Load creative directors
	const loadCreativeDirectors = async () => {
		try {
			const response = await getCreativeDirectors();
			if (response.status === 200) {
				setCreativeDirectors(response.data.data);
			}
		} catch (err) {
			console.error("Error loading creative directors:", err);
		} finally {
			setLoadingDirectors(false);
		}
	};

	// Load initial creatives
	const loadCreatives = async () => {
		try {
			setLoading(true);
			setError(null);
			setCurrentPage(1);

			const response = await getAllCreatives(
				1,
				PAGE_SIZE,
				statusFilter,
				timeFrameFilter,
				sortBy,
				creativeDirectorFilter
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

			const response = await getAllCreatives(
				nextPage,
				PAGE_SIZE,
				statusFilter,
				timeFrameFilter,
				sortBy,
				creativeDirectorFilter
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

	// Load creative directors on mount
	useEffect(() => {
		loadCreativeDirectors();
	}, []);

	// Reset and reload when filters or sort change
	useEffect(() => {
		loadCreatives();
	}, [statusFilter, timeFrameFilter, sortBy, creativeDirectorFilter]);

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
			<div className={styles.container}>
				<LoadingCircleScreen />
			</div>
		);
	}

	// Render error state
	if (error) {
		return (
			<div className={styles.container}>
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
		<div className={styles.container}>
			<div className={styles.header}>
				<h1 className={styles.title}>Creative Approval</h1>
			</div>

			<div className={styles.filterContainer}>
				{/* Creative Director Filter Button */}
				<div style={{ position: "relative" }}>
					<button
						className={cardStyles.sortButton}
						onClick={() =>
							setActiveDropdown((activeDropdown === "director") ? null : "director")
						}
					>
						{creativeDirectorFilter
							? creativeDirectors.find(cd => cd.id === creativeDirectorFilter)?.name || "Creative Director"
							: "All Creative Directors"}
						<span className={`${cardStyles.dropdownArrow} ${(activeDropdown === "director") ? styles.dropdownArrowOpen : ''}`}>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
								<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m19 9-7 7-7-7"/>
							</svg>
						</span>
					</button>
					{(activeDropdown === "director") && (
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
									<div className={cardStyles.dropdownSectionTitle}>Creative Director</div>
									<button
										type="button"
										className={`${cardStyles.dropdownItemButton} ${creativeDirectorFilter === null ? cardStyles.dropdownItemButtonActive : ""}`}
										onClick={() => setCreativeDirectorFilter(null)}
									>
										All Creative Directors
									</button>
									{creativeDirectors.map((director) => (
										<button
											key={director.id}
											type="button"
											className={`${cardStyles.dropdownItemButton} ${creativeDirectorFilter === director.id ? cardStyles.dropdownItemButtonActive : ""}`}
											onClick={() => setCreativeDirectorFilter(director.id)}
										>
											{director.name}
										</button>
									))}
								</div>
							</div>
						</>
					)}
				</div>

				{/* Divider */}
				<div style={{ height: "40px", width: "1px", background: "#c9c9c9", margin: "0" }} />

				{/* Filter Button */}
				<div style={{ position: "relative" }}>
					<button
						className={cardStyles.filterButton}
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
									<button type="button" className={`${cardStyles.dropdownItemButton} ${(statusFilter === "pending") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setStatusFilter((prev) => (prev === "pending") ? null : "pending")}>
										Pending
									</button>
									<button type="button" className={`${cardStyles.dropdownItemButton} ${(statusFilter === "approved") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setStatusFilter((prev) => (prev === "approved") ? null : "approved")}>
										Approved
									</button>
									<button type="button" className={`${cardStyles.dropdownItemButton} ${(statusFilter === "rejected") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setStatusFilter((prev) => (prev === "rejected") ? null : "rejected")}>
										Rejected
									</button>
								</div>
								<div className={cardStyles.dropdownSection}>
									<div className={cardStyles.dropdownSectionTitle}>Time Frame</div>
									<button type="button" className={`${cardStyles.dropdownItemButton} ${(timeFrameFilter === "all") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter((prev) => (prev === "all") ? null : "all")}>
										All Time
									</button>
									<button type="button" className={`${cardStyles.dropdownItemButton} ${(timeFrameFilter === "24h") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter((prev) => (prev === "24h") ? null : "24h")}>
										Last 24 Hours
									</button>
									<button type="button" className={`${cardStyles.dropdownItemButton} ${(timeFrameFilter === "7d") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter((prev) => (prev === "7d") ? null : "7d")}>
										Last 7 Days
									</button>
									<button type="button" className={`${cardStyles.dropdownItemButton} ${(timeFrameFilter === "30d") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter((prev) => (prev === "30d") ? null : "30d")}>
										Last 30 Days
									</button>
									<button type="button" className={`${cardStyles.dropdownItemButton} ${(timeFrameFilter === "90d") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setTimeFrameFilter((prev) => (prev === "90d") ? null : "90d")}>
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
										Newest
									</button>
									<button type="button" className={`${cardStyles.dropdownItemButton} ${(sortBy === "oldest") ? cardStyles.dropdownItemButtonActive : ""}`} onClick={() => setSortBy("oldest")}>
										Oldest
									</button>
								</div>
							</div>
						</>
					)}
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
							<div className={cardStyles.creativeCreatorInfo}>
								<img
									src={creative.creator.pfp ?? "/defaults/u.webp"}
									alt={creative.creator.name}
									className={cardStyles.creatorPfp}
								/>
								<div>
									<div className={cardStyles.creatorName}>
										{creative.creator.name}
									</div>
									<div className={cardStyles.creativeTimestamp}>
										{formatDate(creative.created_ts)}
									</div>
								</div>
							</div>
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
						{/* Display Campaign Info */}
						{creative.campaign && (
							<div className={cardStyles.campaignInfo}>
								{/* {creative.campaign.logo && (
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
								)} */}
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
		</div>
	);
};
