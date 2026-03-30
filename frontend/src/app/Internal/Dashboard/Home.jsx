// Dependencies
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

// API Imports
import { getInternalDashboard } from "../../../api/internal";

// Component Imports
import CampaignPostCard from "./components/CampaignPostCard";
import { MetricCard } from "../../../components/MetricCard";
import { EmptyView } from "../../../ui/Components";

// Style Imports
import styles from "./Home.module.css";

// Icon Imports
import { VIEWS_ICON, LIKES_ICON, COMMENTS_ICON, SHARE_ICON, POSTS_ICON } from "../../../assets/icons/svg.jsx";
import LoadingCircleScreen from "../../../ui/Components/LoadingCircle/LoadingCircleScreen.jsx";

// Helper Functions
const formatNumber = (num) => {
	if (num === undefined || num === null) return '0';
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + 'M';
	}
	if (num >= 1000) {
		return (num / 1000).toFixed(1) + 'K';
	}
	return num.toString();
};

const formatDate = (date) => {
	return new Date(date).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
};

const getStatusColor = (status) => {
	switch (status.toLowerCase()) {
		case 'active':
			return '#28a745';
		case 'pending':
			return '#ffc107';
		case 'completed':
			return '#17a2b8';
		case 'draft':
			return '#6c757d';
		default:
			return '#6c757d';
	}
};

export const InternalDashboardHome = () => {
	const [dashboardData, setDashboardData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [period, setPeriod] = useState("30d");

	const periodOptions = [
		{ value: "24h", label: "24h" },
		{ value: "7d", label: "7d" },
		{ value: "30d", label: "30d" },
		{ value: "60d", label: "60d" },
		{ value: "90d", label: "3m" },
		{ value: "6m", label: "6m" },
		{ value: "ytd", label: "YTD" },
		{ value: "all", label: "All" }
	];

	useEffect(() => {
		const loadDashboardData = async () => {
			setLoading(true);
			try {
				const response = await getInternalDashboard(period);
				if (response.status === 200) {
					setDashboardData(response.data.data);
				} else {
					setError("Failed to load dashboard data");
				}
			} catch (err) {
				setError("Error loading dashboard data");
			} finally {
				setLoading(false);
			}
		};

		loadDashboardData();
	}, [period]);

	if (loading) {
		return <div className={styles.container}><LoadingCircleScreen /></div>;
	}

	if (error || !dashboardData) {
		return (
			<div className={styles.container}>
				<div className={styles.errorContainer}>
					<h1 className={styles.errorTitle}>Error</h1>
					<p className={styles.errorMessage}>{error || "Failed to load dashboard data"}</p>
				</div>
			</div>
		);
	}

	const { metrics, campaigns, topPosts, performance } = dashboardData;

	return (
		<div className={styles.container}>
			{/* Header */}
			<div className={styles.header}>
				<h1 className={styles.headerTitle}>Dashboard</h1>
				<div className={styles.timePeriodSwitcher}>
					{periodOptions.map(option => (
						<button
							key={option.value}
							onClick={() => setPeriod(option.value)}
							className={`${styles.timePeriodButton} ${period === option.value ? styles.selected : ''}`}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>

			{/* Metrics */}
			<div className={styles.contentWrapper}>
				<div className={styles.metricsGrid}>
					<MetricCard
						icon={VIEWS_ICON}
						title="Total Views"
						value={metrics.total_views}
						prevValue={metrics.prev_total_views}
						formatValue={formatNumber}
						period={period}
					/>
					<MetricCard
						icon={LIKES_ICON}
						title="Total Likes"
						value={metrics.total_likes}
						prevValue={metrics.prev_total_likes}
						formatValue={formatNumber}
						period={period}
					/>
					<MetricCard
						icon={COMMENTS_ICON}
						title="Engagement Rate"
						value={metrics.engagement_rate}
						prevValue={metrics.prev_engagement_rate}
						formatValue={(v) => `${(v * 100).toFixed(2)}%`}
						period={period}
					/>
					<MetricCard
						icon={POSTS_ICON}
						title="Total Posts"
						value={metrics.total_posts}
						prevValue={metrics.prev_total_posts}
						formatValue={formatNumber}
						period={period}
					/>
				</div>

				{/* Time Series Chart Section */}
				<div className={styles.section}>
					<h2 className={styles.sectionTitle}>Performance</h2>
					<div className={styles.chartContainer}>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={performance || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis 
									dataKey="date" 
									tick={{ fontSize: 12 }}
									tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric'
									})}
								/>
								<YAxis tick={{ fontSize: 12 }} />
								<Tooltip 
									formatter={(value, name) => [formatNumber(value), name]}
									labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
										month: 'long',
										day: 'numeric',
										year: 'numeric'
									})}
								/>
								<Line type="monotone" dataKey="views" name="Views" stroke="#ff5c5c" strokeWidth={2} dot={false} />
								<Line type="monotone" dataKey="likes" name="Likes" stroke="#1abc9c" strokeWidth={2} dot={false} />
								<Line type="monotone" dataKey="comments" name="Comments" stroke="#34495e" strokeWidth={2} dot={false} />
								<Line type="monotone" dataKey="shares" name="Shares" stroke="#f1c40f" strokeWidth={2} dot={false} />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Campaigns List */}
				<div className={styles.section}>
					<h2 className={styles.sectionTitle}>Campaigns</h2>
					<div className={styles.campaignsList}>
						{campaigns.map((campaign) => (
							<NavLink
								key={campaign.id}
								to={`/team/campaigns/${campaign.id}/overview`}
								className={styles.campaignLink}
							>
								<div>
									<h3 className={styles.campaignName}>{campaign.name}</h3>
									<div className={styles.campaignDate}>
										{formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
									</div>
								</div>
								{/* <div 
									className={styles.statusBadge}
									style={{ 
										background: getStatusColor(campaign.status) + "20",
										color: getStatusColor(campaign.status)
									}}
								>
									{campaign.status}
								</div> */}
							</NavLink>
						))}
						{campaigns.length === 0 && (
							<div className={styles.emptyState}>
								No active campaigns
							</div>
						)}
					</div>
				</div>

				{/* Top Performing Posts */}
				<div>
					<h2 className={styles.sectionTitle}>Top Performing Posts</h2>
					<div className={styles.postsList}>
						{topPosts.map((post) => (
							<CampaignPostCard
								postId={post.id}
								creatorUserPfp={post.creator.user?.pfp}
								creatorUserName={post.creator.user?.name}
								creatorSocialPfp={post.creator_pfp}
								creatorSocialHandle={post.creator.handle}
								creatorSocialDisplayName={""}
								campaignName={post.campaign_name}
								postPlatform={post.creator?.platform}
								postThumbnail={post.thumbnail}
								postCaption={post.caption}
								postTs={post.post_ts}
								postSubmitTs={post.submit_ts}
								postViews={post.metrics.views}
								postLikes={post.metrics.likes}
								postComments={post.metrics.comments}
								postShares={post.metrics.shares}
								postUrl={post.post_url}
							/>
						))}
						{topPosts.length === 0 && (
							<EmptyView message="No posts yet." />
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
