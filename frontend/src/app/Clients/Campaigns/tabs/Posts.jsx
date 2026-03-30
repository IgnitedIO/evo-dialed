// Dependencies
import { useState, useEffect } from "react";

// API Imports
import { getCreatorTopContent } from "../../../../api/creators";

// Component Imports
import LoadingCircle from "../../../../ui/Components/LoadingCircle/LoadingCircle";
import CampaignPostCard from "../../../Internal/Dashboard/components/CampaignPostCard";
import { PostsFilterMenu } from "../../../Internal/Creators/Details/modals/PostsFilterMenu";
import { PostsSortMenu } from "../../../Internal/Creators/Details/modals/PostsSortMenu";

// Style Imports
import styles from "../Campaigns.module.css";
import { EmptyView } from "../../../../ui/Components";

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

// Posts Tab Component
export default function PostsTab({
	campaign
}) {
	// States
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms delay
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState(null);

	// Pagination states
	const [contentCursor, setContentCursor] = useState(null);
	const [contentPagination, setContentPagination] = useState(null);

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

	// Style imports for Load More button
	const metricsStyles = require("../../../Internal/Metrics/Home.module.css").default;


	// Filter and sort posts locally (only for platform, search, and sorting)
	const getFilteredAndSortedPosts = () => {
		let filtered = [...posts];

		// Apply platform filters
		if (platformFilters.instagram || platformFilters.tiktok) {
			filtered = filtered.filter(post => {
				const platform = post.creator_platform?.toLowerCase();
				return (platformFilters.instagram && platform === 'ig') ||
					   (platformFilters.tiktok && platform === 'tt');
			});
		}

		// Apply search filter
		if (debouncedSearchQuery) {
			filtered = filtered.filter(post =>
				post.caption.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
			);
		}

		// Apply sorting
		filtered.sort((a, b) => {
			switch (sortBy) {
				case "most_views":
					return (b.views || b.metrics?.views || 0) - (a.views || a.metrics?.views || 0);
				case "most_likes":
					return (b.likes || b.metrics?.likes || 0) - (a.likes || a.metrics?.likes || 0);
				case "most_comments":
					return (b.comments || b.metrics?.comments || 0) - (a.comments || a.metrics?.comments || 0);
				case "most_shares":
					return (b.shares || b.metrics?.shares || 0) - (a.shares || a.metrics?.shares || 0);
				case "most_recent":
					return new Date(b.post_ts) - new Date(a.post_ts);
				case "oldest":
					return new Date(a.post_ts) - new Date(b.post_ts);
				default:
					return 0;
			}
		});

		return filtered;
	};

	// Load initial posts
	const loadPosts = async () => {
		try {
			setLoading(true);
			setError(null);
			setContentCursor(null);

			// Convert dateFilter to period format expected by backend
			let period = 'all';
			if (dateFilter !== 'all') period = dateFilter;

			// Use getTopContent with campaign ID (& strict filter)
			const response = await getCreatorTopContent(period, PAGE_SIZE, null, true, campaign.id, null);
			if (response.status === 200) {
				setPosts(response.data.data);
				setContentPagination(response.data.pagination);
			} else {
				setError("Failed to load posts");
			}
		} catch (err) {
			console.error("Error loading posts:", err);
			setError("Error loading posts");
		} finally {
			setLoading(false);
		}
	};

	// Load more posts
	const loadMorePosts = async () => {
		if (loadingMore || !contentPagination?.hasNext) return;

		try {
			setLoadingMore(true);

			// Convert dateFilter to period format expected by backend
			let period = 'all';
			if (dateFilter !== 'all') {
				period = dateFilter; // dateFilter values match backend: '24h', '7d', '30d', '90d'
			}

			// Use getTopContent with cursor pagination
			const response = await getCreatorTopContent(period, PAGE_SIZE, contentPagination.cursor, false, campaign.id, null);

			if (response.status === 200) {
				setPosts(prev => [...prev, ...response.data.data]);
				setContentPagination(response.data.pagination);
			} else {
				setError("Failed to load more posts");
			}
		} catch (err) {
			console.error("Error loading more posts:", err);
			setError("Error loading more posts");
		} finally {
			setLoadingMore(false);
		}
	};

	// Reset and reload when filters change
	useEffect(() => {
		loadPosts();
	}, [campaign.id, dateFilter]);

	// Apply local filters without reloading
	const filteredPosts = getFilteredAndSortedPosts();

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

	// Render posts
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
				<div style={{flex: 1}} />
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
			{(filteredPosts.length === 0) ? (
				<EmptyView message="No posts yet." />
			) : (
				<div className={styles.postList}>
					{filteredPosts.map((post) => (
						<div key={post.id}>
							<CampaignPostCard
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
								postViews={post.views || post.metrics?.views}
								postLikes={post.likes || post.metrics?.likes}
								postComments={post.comments || post.metrics?.comments}
								postShares={post.shares || post.metrics?.shares}
								postUrl={post.post_url}
								showCampaignName={false}
							/>
						</div>
					))}
					{contentPagination?.hasNext && (
						<div style={{ textAlign: "center", margin: "12px auto 0 auto", width: "fit-content" }}>
							{loadingMore ? (
								<LoadingCircle />
							) : (
								<button
									onClick={loadMorePosts}
									className={`${metricsStyles.shareLinkButton} ${metricsStyles.loadMoreButton}`}
								>
									Load More
								</button>
							)}
						</div>
					)}
				</div>
			)}
		</>
	);
}
