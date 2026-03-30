// Component Imports
import { MetricCard } from "../../../../../components/MetricCard";

// Icon Imports
import { CAMPAIGNS_ICON, POSTS_ICON, VIEWS_ICON, LIKES_ICON, COMMENTS_ICON, SHARE_ICON } from "../../../../../assets/icons/svg.jsx";

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

// Creator Overview Tab
export const OverviewTab = ({ creator }) => {
	const totalSubmissions = creator.campaigns?.reduce((sum, campaign) => sum + (campaign.submitted || 0), 0) || 0;
	const totalViews = creator.campaigns?.reduce((sum, campaign) => sum + (campaign.metrics?.views || 0), 0) || 0;
	const totalLikes = creator.campaigns?.reduce((sum, campaign) => sum + (campaign.metrics?.likes || 0), 0) || 0;
	const totalComments = creator.campaigns?.reduce((sum, campaign) => sum + (campaign.metrics?.comments || 0), 0) || 0;
	const totalShares = creator.campaigns?.reduce((sum, campaign) => sum + (campaign.metrics?.shares || 0), 0) || 0;

	return (
		<div>
			{/* Creator Metrics */}
			<div style={{ marginBottom: "24px" }}>
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
					<MetricCard
						large={true}
						icon={CAMPAIGNS_ICON}
						title={`Campaign${(creator.campaigns?.length !== 1) ? 's' : ''}`}
						value={creator.campaigns?.length || 0}
						formatValue={formatNumber}
						showChange={false}
					/>
					<MetricCard
						large={true}
						icon={POSTS_ICON}
						title="Posts"
						value={totalSubmissions}
						formatValue={formatNumber}
						showChange={false}
					/>
					<MetricCard
						large={true}
						icon={VIEWS_ICON}
						title="Total Views"
						value={totalViews}
						formatValue={formatNumber}
						showChange={false}
					/>
					<MetricCard
						large={true}
						icon={LIKES_ICON}
						title="Total Likes"
						value={totalLikes}
						formatValue={formatNumber}
						showChange={false}
					/>
					<MetricCard
						large={true}
						icon={COMMENTS_ICON}
						title="Total Comments"
						value={totalComments}
						formatValue={formatNumber}
						showChange={false}
					/>
					<MetricCard
						large={true}
						icon={SHARE_ICON}
						title="Total Shares"
						value={totalShares}
						formatValue={formatNumber}
						showChange={false}
					/>
				</div>
			</div>
		</div>
	);
};