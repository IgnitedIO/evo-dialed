// Dependencies
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// API Imports
import { 
	getCreatorDetails,
} from "../../../../api/internal";

// Component Imports
import { OverviewTab } from "./tabs/Overview";
import { MetricsTab } from "./tabs/Metrics";
import { CampaignsTab } from "./tabs/Campaigns";
import { SubmissionsTab } from "./tabs/Submissions";
import { AccountsTab } from "./tabs/Accounts";
import { SettingsTab } from "./tabs/Settings";

// Style Imports
import dashboardStyles from "../../../Clients/Dashboard/Dashboard.module.css";
import styles from "./Details.module.css";
import LoadingCircleScreen from "../../../../ui/Components/LoadingCircle/LoadingCircleScreen.jsx";

// Main Component
export const InternalCreatorDetails = () => {
	const { creatorId } = useParams();
	const navigate = useNavigate();

	// States
	const [creator, setCreator] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("overview");

	// load creator details on mount
	const loadCreatorDetails = async () => {
		try {
			const response = await getCreatorDetails(creatorId);
			if (response.status === 200) setCreator(response.data.data);
			else setError("Failed to load creator details");
		} catch (err) {
			setError("Error loading creator details");
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		loadCreatorDetails();
	}, [creatorId]);

	// Handle creator updates
	const handleCreatorUpdate = (updatedCreator) => {
		setCreator(updatedCreator);
	};

	// Render loading state
	if (loading) {
		return <div className={dashboardStyles.container}><LoadingCircleScreen /></div>;
	}

	// Render error state
	if (error || !creator) {
		return (
			<div className={dashboardStyles.container}>
				<button
					className={dashboardStyles.backButton}
					onClick={() => navigate("/team/creators")}
				>
					← Back to Creators
				</button>
				<div className={styles.errorContainer}>
					<h1 className={styles.errorTitle}>Error</h1>
					<p className={styles.errorMessage}>{error || "Creator not found"}</p>
				</div>
			</div>
		);
	}

	// Render creator details
	return (
		<div className={dashboardStyles.container}>
			<button
				className={dashboardStyles.backButton}
				onClick={() => navigate("/team/creators")}
			>
				← Back to Creators
			</button>
			{/* Header */}
			<div className={styles.header}>
				<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
					<img 
						src={creator.pfp || "/defaults/u.webp"} 
						alt={creator.name || creator.email}
						style={{
							width: "30px",
							height: "30px",
							borderRadius: "50%",
							objectFit: "cover"
						}}
					/>
					<h1 className={styles.headerTitle}>{creator.name || creator.email}</h1>
				</div>
			</div>

			{/* Tabs */}
			<div className={styles.tabs}>
				<button
					onClick={() => setActiveTab("overview")}
					className={`${styles.tabButton} ${activeTab === "overview" ? styles.tabButtonActive : styles.tabButtonInactive}`}
				>
					Overview
				</button>
				<button
					onClick={() => setActiveTab("metrics")}
					className={`${styles.tabButton} ${activeTab === "metrics" ? styles.tabButtonActive : styles.tabButtonInactive}`}
				>
					Metrics
				</button>
				<button
					onClick={() => setActiveTab("campaigns")}
					className={`${styles.tabButton} ${activeTab === "campaigns" ? styles.tabButtonActive : styles.tabButtonInactive}`}
				>
					Campaigns
				</button>
				<button
					onClick={() => setActiveTab("submissions")}
					className={`${styles.tabButton} ${activeTab === "submissions" ? styles.tabButtonActive : styles.tabButtonInactive}`}
				>
					Posts
				</button>
				<button
					onClick={() => setActiveTab("accounts")}
					className={`${styles.tabButton} ${activeTab === "accounts" ? styles.tabButtonActive : styles.tabButtonInactive}`}
				>
					Accounts
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
				{activeTab === "overview" && <OverviewTab creator={creator} />}
				{activeTab === "metrics" && <MetricsTab creatorId={creator.id} />}
				{activeTab === "campaigns" && <CampaignsTab creator={creator} onUpdate={loadCreatorDetails} />}
				{activeTab === "accounts" && <AccountsTab creator={creator} />}
				{activeTab === "submissions" && <SubmissionsTab creator={creator} />}
				{activeTab === "settings" && <SettingsTab creator={creator} onUpdate={handleCreatorUpdate} />}
			</div>
		</div>
	);
};
