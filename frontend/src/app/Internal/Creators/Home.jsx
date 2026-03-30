// Dependencies
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

// API Imports
import { getCreatorsList } from "../../../api/internal";

// Style Imports
import styles from "../../Clients/Dashboard/Dashboard.module.css";
import filterStyles from "../Campaigns/FilterButton.module.css";

// Icon Imports
import { RATE_ICON, POSTS_ICON, CAMPAIGNS_ICON, INSTAGRAM_ICON, TIKTOK_ICON } from "../../../assets/icons/svg.jsx";
import LoadingCircleScreen from "../../../ui/Components/LoadingCircle/LoadingCircleScreen.jsx";
import LoadingCircle from "../../../ui/Components/LoadingCircle/LoadingCircle.jsx";

// Constants
const DEFAULT_PROFILE_IMAGE = "/defaults/u.webp";
const PAGE_SIZE = 25;
const SORT_OPTIONS = {
	MOST_POSTS: { label: "Most Posts", key: "hlposts" },
	LEAST_POSTS: { label: "Least Posts", key: "lhposts" },
	MOST_CAMPAIGNS: { label: "Most Campaigns", key: "hlcmp" },
	LEAST_CAMPAIGNS: { label: "Least Campaigns", key: "lhcmp" },
	LATEST: { label: "Latest", key: "hltime" },
	OLDEST: { label: "Oldest", key: "lhtime" }
};

// Custom hook for debouncing
const useDebounce = (value, delay) => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
};

// Helper Functions
const formatJoinDate = (dateString) => {
	if (!dateString) return "Joined recently";
	const date = new Date(dateString);
	const currentYear = new Date().getFullYear();
	
	const month = date.toLocaleString('default', { month: 'long' });
	const day = date.getDate();
	const year = date.getFullYear() !== currentYear ? `, ${date.getFullYear()}` : '';
	
	return `Joined ${month} ${day}${year}`;
};

const getPlatformIcons = (platforms) => {
	const icons = [];
	if (platforms?.instagram) {
		icons.push(
			<div key="instagram" className={styles.platformIcon}>
				{INSTAGRAM_ICON}
			</div>
		);
	}
	if (platforms?.tiktok) {
		icons.push(
			<div key="tiktok" className={styles.platformIcon}>
				{TIKTOK_ICON}
			</div>
		);
	}
	return icons;
};

// const formatEngagementRate = (rate) => {
// 	return `${(rate * 100).toFixed(1)}%`;
// };


// Main Component
export const InternalCreatorsHome = () => {
	const navigate = useNavigate();

	// Core state management
	const [creators, setCreators] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 500);
	const [currentSort, setCurrentSort] = useState(SORT_OPTIONS.MOST_POSTS);
	const [showSortDropdown, setShowSortDropdown] = useState(false);

	// Loading and error states
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState(null);

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [totalPages, setTotalPages] = useState(1);

	// Merge new creators with existing ones, avoiding duplicates
	const mergeCreators = (existing, newData) => {
		const merged = [...existing];
		const existingIds = new Set(existing.map(c => c.id));
		
		newData.forEach(creator => {
			if (!existingIds.has(creator.id)) {
				merged.push(creator);
			}
		});
		
		return merged;
	};

	// Load more creators
	const loadMoreCreators = useCallback(async () => {
		if (loadingMore || !hasMore) return;
		
		try {
			setLoadingMore(true);
			const nextPage = currentPage + 1;
			const sortKey = currentSort.key;
			const response = await getCreatorsList(nextPage, PAGE_SIZE, sortKey, debouncedSearchQuery);
			
			if (response.status === 200) {
				const { creators: newCreators, pagination } = response.data.data;
				setCreators(prev => mergeCreators(prev, newCreators));
				setCurrentPage(nextPage);
				setHasMore(nextPage < pagination.totalPages);
			} else {
				setError("Failed to load more creators");
			}
		} catch (err) {
			setError("Error loading more creators");
		} finally {
			setLoadingMore(false);
		}
	}, [loadingMore, hasMore, currentPage, currentSort.key, debouncedSearchQuery]);

	// Intersection Observer ref for infinite scroll
	const observer = useRef();
	const lastCreatorRef = useCallback(node => {
		if (loading || loadingMore) return;
		if (observer.current) observer.current.disconnect();
		
		observer.current = new IntersectionObserver(entries => {
			if (entries[0].isIntersecting && hasMore) {
				loadMoreCreators();
			}
		}, { threshold: 0.5 });
		
		if (node) observer.current.observe(node);
	}, [loading, loadingMore, hasMore, loadMoreCreators]);

	// Load initial creators
	const loadCreators = async (search = '', sort = 'submitted') => {
		try {
			setLoading(true);
			setError(null);
			const response = await getCreatorsList(1, PAGE_SIZE, sort, search);
			if (response.status === 200) {
				const { creators: newCreators, pagination } = response.data.data;
				setCreators(newCreators);
				setCurrentPage(1);
				setTotalPages(pagination.totalPages);
				setHasMore(pagination.page < pagination.totalPages);
			} else {
				setError("Failed to load creators");
			}
		} catch (err) {
			setError("Error loading creators");
		} finally {
			setLoading(false);
		}
	};


	// Effect to load creators when debounced search or sort changes
	useEffect(() => {
		const sortKey = currentSort.key;
		loadCreators(debouncedSearchQuery, sortKey);
	}, [debouncedSearchQuery, currentSort]);

	// Cleanup observer on unmount
	useEffect(() => {
		return () => {
			if (observer.current) {
				observer.current.disconnect();
			}
		};
	}, []);


	// Handle navigation
	const handleCreatorClick = (creatorId) => {
		navigate(`/team/creators/${creatorId}/details`);
	};
	const handleCreateCreator = () => {
		navigate("/team/creators/add");
	};

	// Get sort button text
	const getSortButtonText = () => {
		return currentSort.label;
	};

	// Optimized loading and error states
	if (loading) {
		return (
			<div className={styles.container}>
				<LoadingCircleScreen />
			</div>
		);
	}
	
	if (error && creators.length === 0) {
		return (
			<div className={styles.container}>
				<div style={{
					textAlign: "center",
					padding: "48px",
					color: "#d32f2f",
					background: "white",
					borderRadius: "8px",
					border: "1px solid #ffebee",
					backgroundColor: "#ffeaea"
				}}>
					<strong>Error: </strong>{error}
					<div style={{ marginTop: "16px" }}>
						<button 
							onClick={() => loadCreators(debouncedSearchQuery, currentSort.key)}
							style={{
								padding: "8px 16px",
								background: "var(--main-hl)",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer"
							}}
						>
							Retry
						</button>
					</div>
				</div>
			</div>
		);
	}
	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h1 className={styles.title}>Creators</h1>
			</div>

			{/* Search Bar and Create Button Container */}
			<div style={{ 
				marginBottom: "24px",
				display: "flex",
				gap: "12px",
				alignItems: "center"
			}}>
				<input
					type="text"
					placeholder="Search creators..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					style={{
						flex: 1,
						padding: "12px",
						border: "1px solid var(--brd-light)",
						borderRadius: "8px",
						fontSize: "14px",
						backgroundColor: "#fff",
					}}
				/>
				<div style={{ position: "relative" }}>
					<button 
						onClick={() => setShowSortDropdown(!showSortDropdown)}
						className={filterStyles.filterButton}
					>
						{getSortButtonText()}
						<span className={filterStyles.dropdownArrow}>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
								<path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m19 9-7 7-7-7"/>
							</svg>
						</span>
					</button>
					{showSortDropdown && (
						<div className={filterStyles.dropdownContainer}>
							{Object.values(SORT_OPTIONS).map((option) => (
								<button
									key={option.label}
									onClick={() => {
										setCurrentSort(option);
										setShowSortDropdown(false);
									}}
									className={`${filterStyles.filterOption} ${
										currentSort.label === option.label ? filterStyles.filterOptionSelected : ''
									}`}
								>
									{option.label}
								</button>
							))}
						</div>
					)}
				</div>
				<button 
					onClick={handleCreateCreator}
					className="createButton"
				>
					Invite Creator
				</button>
			</div>

			{/* Creators Grid */}
			<div className={styles.campaignsGrid}>
				{creators.map((creator, index) => (
					<div
						key={creator.id}
						className={styles.campaignCard}
						onClick={() => handleCreatorClick(creator.id)}
						ref={index === creators.length - 1 ? lastCreatorRef : null}
					>
						<div className={styles.campaignMeta}>
							<div className={styles.dates}>
								{formatJoinDate(creator.created_ts)}
							</div>
							<div className={styles.platformIcons}>
								{getPlatformIcons(creator.platforms)}
							</div>
						</div>

						<div className={styles.creatorHeader}>
							<img 
								src={creator.pfp ?? DEFAULT_PROFILE_IMAGE}
								alt={creator.name || creator.email}
								className={styles.creatorImage}
							/>
							<h3 className={styles.creatorName}>{creator.name || creator.email}</h3>
						</div>

						<div className={styles.creatorStats}>
							<div>
								<span className={styles.metricLabel}>{CAMPAIGNS_ICON}Campaigns</span>
								<span className={styles.metricValue}>{creator.campaigns}</span>
							</div>
							<div>
								<span className={styles.metricLabel}>{POSTS_ICON}Posts</span>
								<span className={styles.metricValue}>{creator.submitted}</span>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Loading More State */}
			{loadingMore && (
				<div style={{ textAlign: "center", padding: "16px", color: "#667" }}>
					<LoadingCircle />
				</div>
			)}

			{/* Error State for Load More */}
			{error && creators.length > 0 && (
				<div style={{
					textAlign: "center",
					padding: "16px",
					color: "#d32f2f",
					backgroundColor: "#ffeaea",
					border: "1px solid #ffebee",
					borderRadius: "8px",
					margin: "16px 0"
				}}>
					<strong>Error: </strong>{error}
					<button 
						onClick={() => {
							setError(null);
							setHasMore(true);
						}}
						style={{
							marginLeft: "12px",
							padding: "4px 8px",
							background: "var(--main-hl)",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
							fontSize: "12px"
						}}
					>
						Retry
					</button>
				</div>
			)}

			{/* End of Results Indicator */}
			{!hasMore && creators.length > 0 && !error && (
				<div style={{ textAlign: "center", padding: "16px", color: "#667" }}>
					{/* End of creators list */}
				</div>
			)}

			{/* Empty State */}
			{creators.length === 0 && !loading && !error && (
				<div style={{ 
					textAlign: "center", 
					padding: "48px", 
					color: "#667",
					background: "white",
					borderRadius: "8px",
					border: "1px solid var(--brd-light)"
				}}>
					{searchQuery ? 
						`No creators match your search for "${searchQuery}"` : 
						"No creators available"
					}
					{searchQuery && (
						<div style={{ marginTop: "16px" }}>
							<button 
								onClick={() => setSearchQuery('')}
								style={{
									padding: "8px 16px",
									background: "var(--main-hl)",
									color: "white",
									border: "none",
									borderRadius: "4px",
									cursor: "pointer"
								}}
							>
								Clear Search
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
