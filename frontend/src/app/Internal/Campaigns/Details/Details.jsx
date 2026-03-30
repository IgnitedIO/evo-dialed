// Dependencies
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// API Imports
import { 
	getInternalCampaignDetails, 
} from "../../../../api/internal";

// Component Imports
import OverviewTab from "./tabs/Overview";
import CreatorsTab from "./tabs/Creators";
import PostsTab from "./tabs/Posts";
import MetricsTab from "./tabs/Metrics";
import ResourcesTab from "./tabs/Resources";
import CreativeApprovalsTab from "./tabs/CreativeApprovals";
import SettingsTab from "./tabs/Settings";
import LoadingCircleScreen from "../../../../ui/Components/LoadingCircle/LoadingCircleScreen.jsx";

// Style Imports
import dashboardStyles from "../../../Clients/Dashboard/Dashboard.module.css";
import styles from "./Details.module.css";

// Main Component
export const InternalCampaignDetails = () => {
	const { campaignId } = useParams();
	const navigate = useNavigate();

	// States
	const [campaign, setCampaign] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("overview");

	// Load campaign details
	const loadCampaignDetails = async () => {
		try {
			const response = await getInternalCampaignDetails(campaignId);
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
					onClick={() => navigate("/team/campaigns")}
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
				onClick={() => navigate("/team/campaigns")}
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
					onClick={() => setActiveTab("overview")}
					className={`${styles.tabButton} ${activeTab === "overview" ? styles.tabButtonActive : styles.tabButtonInactive}`}
				>
					Details
				</button>
				<button
					onClick={() => setActiveTab("creators")}
					className={`${styles.tabButton} ${activeTab === "creators" ? styles.tabButtonActive : styles.tabButtonInactive}`}
				>
					Creators
				</button>
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
				{/* <button
					onClick={() => setActiveTab("resources")}
					className={`${styles.tabButton} ${activeTab === "resources" ? styles.tabButtonActive : styles.tabButtonInactive}`}
				>
					Resources
				</button> */}
				<button
					onClick={() => setActiveTab("creatives")}
					className={`${styles.tabButton} ${activeTab === "creatives" ? styles.tabButtonActive : styles.tabButtonInactive}`}
				>
					Creatives
				</button>
				<button
					onClick={() => setActiveTab("settings")}
					className={`${styles.tabButton} ${activeTab === "settings" ? styles.tabButtonActive : styles.tabButtonInactive}`}
				>
					Settings
				</button>
			</div>

			{/* Tab Content */}
			<div className={styles.tabContent}>
				{activeTab === "overview" && <OverviewTab campaign={campaign} />}
				{activeTab === "creators" && <CreatorsTab campaign={campaign} onUpdate={loadCampaignDetails} />}
				{activeTab === "posts" && <PostsTab campaign={campaign} />}
				{activeTab === "metrics" && <MetricsTab campaign={campaign} />}
				{activeTab === "resources" && <ResourcesTab campaign={campaign} onUpdate={loadCampaignDetails} />}
				{activeTab === "creatives" && <CreativeApprovalsTab campaign={campaign} />}
				{activeTab === "settings" && <SettingsTab campaign={campaign} onUpdate={loadCampaignDetails} />}
			</div>
		</div>
	);
};
