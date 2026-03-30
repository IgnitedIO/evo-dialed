import { InternalMetricsHome } from "../../Internal/Metrics/Home";

export const CreatorDashboard = () => {
	return <InternalMetricsHome isCreatorUser={true} pageTitle="My Dashboard" />;
};

// // Dependencies
// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// // API Imports
// import { getCreatorDashboard } from "../../../api/creators";

// // Component Imports
// import LoadingCircleScreen from "../../../ui/Components/LoadingCircle/LoadingCircleScreen.jsx";
// import { MetricCard } from "../../../components/MetricCard";
// import { EmptyView } from "../../../ui/Components";

// // Icon Imports
// import { CAMPAIGNS_ICON } from "../../../assets/icons/svg";

// // Style Imports
// import styles from "./Dashboard.module.css";

// // Helper Functions
// const formatNumber = (num) => {
// 	if (num === undefined || num === null) return '0';
// 	if (num >= 1000000) {
// 		return (num / 1000000).toFixed(1) + 'M';
// 	}
// 	if (num >= 1000) {
// 		return (num / 1000).toFixed(1) + 'K';
// 	}
// 	return num.toString();
// };


// // Creator Dashboard

// // Responsibilities:
// // - Display dashboard data (see backend/routes/creators/dashboard/controller.js)
// // - Open any associated campaigns (useNavigate)
// export const CreatorDashboard = () => {

// 	const navigate = useNavigate();
// 	const [dashboardData, setDashboardData] = useState(null);
// 	const [loading, setLoading] = useState(true);
// 	const [error, setError] = useState(null);

// 	useEffect(() => {
// 		const fetchDashboardData = async () => {
// 			try {
// 				const response = await getCreatorDashboard();
// 				if (response.status === 200) {
// 					setDashboardData(response.data);
// 				} else {
// 					setError("Failed to load dashboard data");
// 				}
// 			} catch (err) {
// 				setError("Error loading dashboard data");
// 			} finally {
// 				setLoading(false);
// 			}
// 		};

// 		fetchDashboardData();
// 	}, []);

// 	const handleCampaignClick = (campaignId) => {
// 		navigate(`/campaigns/${campaignId}`);
// 	};

// 	const handleViewAllCampaigns = () => {
// 		navigate("/campaigns");
// 	};

// 	const getStatusClass = (status) => {
// 		switch (status.toLowerCase()) {
// 			case "active":
// 				return styles.statusActive;
// 			case "pending":
// 				return styles.statusPending;
// 			case "completed":
// 				return styles.statusCompleted;
// 			case "rejected":
// 				return styles.statusRejected;
// 			default:
// 				return "";
// 		}
// 	};

// 	if (loading) return <div className={styles.container}><LoadingCircleScreen /></div>;
// 	if (error) return <div className={styles.container}>{error}</div>;
// 	if (!dashboardData) return <div className={styles.container}>No dashboard data available</div>;

// 	return (
// 		<div className={styles.container}>
// 			<div className={styles.header}>
// 				<h1 className={styles.title}>My Dashboard</h1>
// 			</div>

// 			{/* Stats Overview */}
// 			<div className={styles.statsGrid}>
// 				<MetricCard
// 					large={true}
// 					icon={CAMPAIGNS_ICON}
// 					title={`Campaign${(dashboardData.total_campaigns !== 1) ? 's' : ''}`}
// 					value={dashboardData.total_campaigns || 0}
// 					formatValue={formatNumber}
// 					showChange={false}
// 				/>
// 				<MetricCard
// 					large={true}
// 					icon={CAMPAIGNS_ICON}
// 					title={`Active Campaign${(dashboardData.active_campaigns !== 1) ? 's' : ''}`}
// 					value={dashboardData.active_campaigns || 0}
// 					formatValue={formatNumber}
// 					showChange={false}
// 				/>
// 				<MetricCard
// 					large={true}
// 					icon={CAMPAIGNS_ICON}
// 					title={`Submission${(dashboardData.total_submissions !== 1) ? 's' : ''}`}
// 					value={dashboardData.total_submissions || 0}
// 					formatValue={formatNumber}
// 					showChange={false}
// 				/>
// 				<MetricCard
// 					large={true}
// 					icon={CAMPAIGNS_ICON}
// 					title={`Approved Submission${(dashboardData.approved_submissions !== 1) ? 's' : ''}`}
// 					value={dashboardData.approved_submissions || 0}
// 					formatValue={formatNumber}
// 					showChange={false}
// 				/>
// 			</div>

// 			{/* Active Campaigns */}
// 			<div className={styles.section}>
// 				<div className={styles.sectionHeader}>
// 					<h2 className={styles.sectionTitle}>Campaigns</h2>
// 					<button className={styles.viewAllButton} onClick={handleViewAllCampaigns}>
// 						View All →
// 					</button>
// 				</div>
// 				{(!dashboardData.active_campaigns_list || dashboardData.active_campaigns_list.length <= 0) ? (
// 					<EmptyView message="No active campaigns." />
// 				) : (
// 					<div className={styles.campaignsGrid}>
// 						{/* {dashboardData.active_campaigns_list.map((campaign) => (
// 							<div
// 								key={campaign.id}
// 								className={styles.campaignCard}
// 								onClick={() => handleCampaignClick(campaign.id)}
// 							>
// 								<h3 className={styles.campaignTitle}>{campaign.title}</h3>
// 								<p className={styles.campaignDescription}>{campaign.description}</p>
// 								<div className={styles.campaignMeta}>
// 									<span
// 										className={`${styles.statusBadge} ${getStatusClass(campaign.status)}`}
// 									>
// 										{campaign.status}
// 									</span>
// 									<span>Due: {new Date(campaign.due_date).toLocaleDateString()}</span>
// 								</div>
// 							</div>
// 						))} */}
// 					</div>
// 				)}
// 			</div>

// 			{/* Recent Activity */}
// 			<div className={styles.section}>
// 				<div className={styles.sectionHeader}>
// 					<h2 className={styles.sectionTitle}>Recent Activity</h2>
// 				</div>
// 				{(!dashboardData.recent_activity || dashboardData.recent_activity.length <= 0) ? (
// 					<EmptyView message="No recent activity." />
// 				) : (
// 					<div className={styles.recentActivity}>
// 						<div className={styles.activityList}>
// 							{/* {dashboardData.recent_activity.map((activity, index) => (
// 								<div key={index} className={styles.activityItem}>
// 									<div className={styles.activityIcon}>
// 										{activity.type === "submission" ? "📝" : 
// 										activity.type === "campaign" ? "🎯" : 
// 										activity.type === "approval" ? "✅" : "📊"}
// 									</div>
// 									<div className={styles.activityContent}>
// 										<div className={styles.activityTitle}>{activity.title}</div>
// 										<div className={styles.activityMeta}>
// 											{new Date(activity.timestamp).toLocaleString()}
// 										</div>
// 									</div>
// 								</div>
// 							))} */}
// 						</div>
// 					</div>
// 				)}
// 			</div>
// 		</div>
// 	);
// };
