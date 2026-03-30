// Component Imports
import { MetricCard } from "../../../../../components/MetricCard";

// Style Imports
import styles from "../Details.module.css";

// Icon Imports
import { 
	INSTAGRAM_ICON, 
	TIKTOK_ICON, 
	VIEWS_ICON, 
	POSTS_ICON, 
	COMMENTS_ICON, 
	CREATORS_ICON, 
} from "../../../../../assets/icons/svg";

// Overview Tab Component
export default function OverviewTab({
	campaign
}) {
	// Render
	return (
		<div>
			{/* Campaign Description */}
			<div className={styles.description}>
				<h2>Description</h2>
				<div className={styles.descriptionText}>
					{campaign.description || "No description"}
				</div>
			</div>

			{/* Supported Platforms */}
			<div className={styles.platforms}>
				<h2>Platforms</h2>
				<div className={styles.platformsList}>
					{campaign.supports_ig ? (
						<span className={styles.platformTag}>
							{INSTAGRAM_ICON}Instagram
						</span>
					) : <></> }
					{campaign.supports_tt ? (
						<span className={styles.platformTag}>
							{TIKTOK_ICON}TikTok
						</span>
					) : <></> }
				</div>
			</div>

			{/* Campaign Metrics */}
			{/* <div className={styles.metrics}>
				<h2>Metrics</h2>
				<div className={styles.metricsGrid}>
					<MetricCard
						icon={CREATORS_ICON}
						title="Creators"
						value={campaign.total_creators}
						formatValue={(v) => v.toLocaleString()}
						showChange={false}
					/>
					<MetricCard
						icon={POSTS_ICON}
						title="Posts"
						value={campaign.total_submissions}
						formatValue={(v) => v.toLocaleString()}
						showChange={false}
					/>
					<MetricCard
						icon={VIEWS_ICON}
						title="Total Views"
						value={campaign.metrics.views}
						formatValue={(v) => v.toLocaleString()}
						showChange={false}
					/>
					<MetricCard
						icon={COMMENTS_ICON}
						title="Total Engagement"
						value={campaign.metrics.likes + campaign.metrics.comments + campaign.metrics.shares}
						formatValue={(v) => v.toLocaleString()}
						showChange={false}
					/>
				</div>
			</div> */}
		</div>
	);
}