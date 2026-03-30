// Dependencies
import { useState, useEffect, useCallback, useRef } from 'react';

// API Imports
import {
	getCreatorSubmissions
} from "../../../../../api/internal";

// Component Imports
import CampaignPostCard from "../../../Dashboard/components/CampaignPostCard";
import { PostsFilterMenu } from "../modals/PostsFilterMenu";
import { PostsSortMenu } from "../modals/PostsSortMenu";
import LoadingCircle from "../../../../../ui/Components/LoadingCircle/LoadingCircle.jsx";

// Style Imports
import styles from "../Details.module.css";
import LoadingCircleScreen from "../../../../../ui/Components/LoadingCircle/LoadingCircleScreen.jsx";

// Constants
const PAGE_SIZE = 25;

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

// Creator Submissions Tab
export const SubmissionsTab = ({ creator }) => {
	// States
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms delay
	const [submissions, setSubmissions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState(null);
	
	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [totalPages, setTotalPages] = useState(1);

	// Filter states
	const [platformFilters, setPlatformFilters] = useState({
		instagram: false,
		tiktok: false
	});
	const [dateFilter, setDateFilter] = useState("all");
	
	// Sort states
	const [sortBy, setSortBy] = useState("most_recent");

	// Dropdown states
	const [activeDropdown, setActiveDropdown] = useState(null); // null, "filter", or "sort"

	// Intersection Observer ref for infinite scroll
	const observer = useRef();
	const lastPostRef = useCallback(node => {
		if (loading || loadingMore) return;
		if (observer.current) observer.current.disconnect();
		
		observer.current = new IntersectionObserver(entries => {
			if (entries[0].isIntersecting && hasMore) {
				loadMoreSubmissions();
			}
		}, { threshold: 0.5 });
		
		if (node) observer.current.observe(node);
	}, [loading, loadingMore, hasMore]);

	// Merge new submissions with existing ones, avoiding duplicates
	const mergeSubmissions = (existing, newData) => {
		const merged = [...existing];
		const existingIds = new Set(existing.map(s => s.post.id));
		
		newData.forEach(submission => {
			if (!existingIds.has(submission.post.id)) {
				merged.push(submission);
			}
		});
		
		return merged;
	};

	// Filter and sort submissions
	const getFilteredAndSortedSubmissions = () => {
		let filtered = [...submissions];
		
		// Apply platform filters
		if (platformFilters.instagram || platformFilters.tiktok) {
			filtered = filtered.filter(post => {
				const platform = post.creator?.platform?.toLowerCase();
				return (platformFilters.instagram && platform === 'ig') ||
					   (platformFilters.tiktok && platform === 'tt');
			});
		}
		
		// Apply date filter
		const now = new Date();
		if (dateFilter !== "all") {
			const days = {
				"24h": 1,
				"7d": 7,
				"30d": 30,
				"90d": 90
			}[dateFilter] || 0;
			
			if (days > 0) {
				const cutoffDate = new Date(now - days * 24 * 60 * 60 * 1000);
				filtered = filtered.filter(post => new Date(post.post.post_ts) >= cutoffDate);
			}
		}
		
		// Apply search filter
		if (debouncedSearchQuery) {
			filtered = filtered.filter(post => 
				post.post.caption.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
			);
		}
		
		// Apply sorting
		filtered.sort((a, b) => {
			switch (sortBy) {
				case "most_views":
					return b.metrics.views - a.metrics.views;
				case "most_likes":
					return b.metrics.likes - a.metrics.likes;
				case "most_comments":
					return b.metrics.comments - a.metrics.comments;
				case "most_shares":
					return b.metrics.shares - a.metrics.shares;
				case "most_recent":
					return new Date(b.post.post_ts) - new Date(a.post.post_ts);
				case "oldest":
					return new Date(a.post.post_ts) - new Date(b.post.post_ts);
				default:
					return 0;
			}
		});
		
		return filtered;
	};

	// Transform API submission to expected format
	const transformSubmission = (submission) => ({
		post: {
			id: submission.npc_id,
			thumbnail: null, // API doesn't provide this
			caption: submission.description,
			post_ts: submission.submitted_ts,
			submit_ts: submission.submitted_ts,
			url: submission.url
		},
		user: {
			pfp: null, // API doesn't provide this
			name: submission.handle
		},
		creator: {
			pfp: null, // API doesn't provide this
			handle: submission.handle,
			platform: submission.platform,
			displayName: submission.handle
		},
		metrics: {
			views: submission.views,
			likes: submission.likes,
			comments: submission.comments,
			shares: submission.shares
		}
	});

	// Load initial submissions
	const loadSubmissions = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await getCreatorSubmissions(creator.id, 1, PAGE_SIZE);
			if (response.status === 200) {
				const { submissions, pagination } = response.data.data;
				const transformedSubmissions = submissions.map(transformSubmission);
				setSubmissions(transformedSubmissions);
				setCurrentPage(1);
				setTotalPages(pagination.totalPages);
				setHasMore(pagination.page < pagination.totalPages);
			} else {
				setError("Failed to load submissions");
			}
		} catch (err) {
			setError("Error loading submissions");
		} finally {
			setLoading(false);
		}
	};

	// Load more submissions
	const loadMoreSubmissions = async () => {
		if (loadingMore || !hasMore) return;
		
		try {
			setLoadingMore(true);
			const nextPage = currentPage + 1;
			const response = await getCreatorSubmissions(creator.id, nextPage, PAGE_SIZE);
			
			if (response.status === 200) {
				const { submissions, pagination } = response.data.data;
				const transformedSubmissions = submissions.map(transformSubmission);
				setSubmissions(prev => mergeSubmissions(prev, transformedSubmissions));
				setCurrentPage(nextPage);
				setHasMore(nextPage < pagination.totalPages);
			} else {
				setError("Failed to load more submissions");
			}
		} catch (err) {
			setError("Error loading more submissions");
		} finally {
			setLoadingMore(false);
		}
	};

	// Reset and reload when filters change
	useEffect(() => {
		loadSubmissions();
	}, [creator.id, platformFilters, dateFilter, sortBy, debouncedSearchQuery]);

	const filteredSubmissions = getFilteredAndSortedSubmissions();

	// Render loading state
	if (loading) {
		return (
			<div style={{ textAlign: "center", padding: "24px", color: "#667" }}>
				<LoadingCircleScreen />
			</div>
		);
	}

	// Render error state
	if (error) {
		return (
			<div style={{ 
				color: "#dc3545", 
				background: "#f8d7da", 
				padding: "12px", 
				borderRadius: "8px", 
				marginBottom: "24px" 
			}}>
				{error}
			</div>
		);
	}

	// Render submissions
	return (
		<>
			<div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
				<input
					type="text"
					className={styles.searchBar}
					placeholder="Search posts..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				<PostsFilterMenu
					platformFilters={platformFilters}
					setPlatformFilters={setPlatformFilters}
					dateFilter={dateFilter}
					setDateFilter={setDateFilter}
					isOpen={activeDropdown === "filter"}
					onOpenChange={(isOpen) => setActiveDropdown(isOpen ? "filter" : null)}
				/>
				<PostsSortMenu
					sortBy={sortBy}
					setSortBy={setSortBy}
					isOpen={activeDropdown === "sort"}
					onOpenChange={(isOpen) => setActiveDropdown(isOpen ? "sort" : null)}
				/>
			</div>
			<div className={styles.postList}>
				{filteredSubmissions.map((post, index) => (
					<div
						key={post.post.id}
						ref={index === filteredSubmissions.length - 1 ? lastPostRef : null}
					>
						<CampaignPostCard
							postId={post.post.id}
							creatorUserPfp={post.user.pfp}
							creatorUserName={post.user.name}
							creatorSocialPfp={post.creator?.pfp}
							creatorSocialHandle={post.creator?.handle}
							creatorSocialDisplayName={""}
							campaignName={null}
							postPlatform={post.creator?.platform}
							postThumbnail={post.post.thumbnail}
							postCaption={post.post.caption}
							postTs={post.post.post_ts}
							postSubmitTs={post.post.submit_ts}
							postViews={post.metrics.views}
							postLikes={post.metrics.likes}
							postComments={post.metrics.comments}
							postShares={post.metrics.shares}
							postUrl={post.post.url}
							showCampaignName={false}
						/>
					</div>
				))}
				{loadingMore && (
					<div style={{ textAlign: "center", padding: "16px", color: "#667" }}>
						<LoadingCircle />
					</div>
				)}
				{!hasMore && filteredSubmissions.length > 0 && (
					<div style={{ textAlign: "center", padding: "16px", color: "#667" }}>
						{/* No more posts to load */}
					</div>
				)}
			</div>
		</>
	);
};