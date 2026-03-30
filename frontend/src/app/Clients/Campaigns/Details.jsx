// Dependencies
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// API Imports
import { getCampaignDetails } from "../../../api/creators.js";

// Component Imports
import PostsTab from "./tabs/Posts";
import MetricsTab from "./tabs/Metrics";
import CreativeApprovalsTab from "./tabs/CreativeApprovals";
import LoadingCircleScreen from "../../../ui/Components/LoadingCircle/LoadingCircleScreen.jsx";

// Style Imports
import dashboardStyles from "../Dashboard/Dashboard.module.css";
import styles from "./Campaigns.module.css";

// Main Component
export const CreatorCampaignDetails = () => {
	const { campaignId } = useParams();
	const navigate = useNavigate();

	// States
	const [campaign, setCampaign] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("posts");

	// Load campaign details
	const loadCampaignDetails = async () => {
		try {
			const response = await getCampaignDetails(campaignId);
			if (response.status === 200) {
				setCampaign(response.data.data);
			} else {
				setError("Failed to load campaign details");
			}
		} catch (err) {
			setError("Error loading campaign details");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadCampaignDetails();
	}, [campaignId]);

	if (loading) {
		return <div className={dashboardStyles.container}><LoadingCircleScreen /></div>;
	}

	if (error || !campaign) {
		return (
			<div className={dashboardStyles.container}>
				<button
					className={dashboardStyles.backButton}
					onClick={() => navigate("/campaigns")}
				>
					←&nbsp;&nbsp;Back to Campaigns
				</button>
				<div className={styles.errorContainer}>
					<h1 className={styles.errorTitle}>Error</h1>
					<p className={styles.errorMessage}>{error || "Campaign not found"}</p>
				</div>
			</div>
		);
	}

	return (
		<div className={dashboardStyles.container}>
			<button
				className={dashboardStyles.backButton}
				onClick={() => navigate("/campaigns")}
			>
				←&nbsp;&nbsp;Back to Campaigns
			</button>
			{/* Header */}
			<div className={styles.header}>
				<h1 className={styles.headerTitle}>{campaign.name}</h1>
			</div>

			{/* Tabs */}
			<div className={styles.tabs}>
				<button
					onClick={() => setActiveTab("posts")}
					className={`${styles.tabButton} ${activeTab === "posts" ? styles.tabButtonActive : styles.tabButtonInactive}`}
				>
					Posts
				</button>
				<button
					onClick={() => setActiveTab("metrics")}
					className={`${styles.tabButton} ${activeTab === "metrics" ? styles.tabButtonActive : styles.tabButtonInactive}`}
				>
					Metrics
				</button>
				<button
					onClick={() => setActiveTab("creatives")}
					className={`${styles.tabButton} ${activeTab === "creatives" ? styles.tabButtonActive : styles.tabButtonInactive}`}
				>
					Creatives
				</button>
			</div>

			{/* Tab Content */}
			<div className={styles.tabContent}>
				{activeTab === "posts" && <PostsTab campaign={campaign} />}
				{activeTab === "metrics" && <MetricsTab campaign={campaign} />}
				{activeTab === "creatives" && <CreativeApprovalsTab campaign={campaign} />}
			</div>
		</div>
	);
};
