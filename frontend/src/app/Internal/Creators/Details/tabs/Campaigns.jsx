// Dependencies
import { useState, useEffect } from 'react';

// Component Imports
import { EmptyView } from "../../../../../ui/Components";
import { AssignCampaignsModal } from "../modals/AssignCampaigns";

// Style Imports
import styles from "../Details.module.css";
import dashboardStyles from "../../../../Clients/Dashboard/Dashboard.module.css";

// Icon Imports
import { INSTAGRAM_ICON, TIKTOK_ICON, POSTS_ICON, VIEWS_ICON, LIKES_ICON } from "../../../../../assets/icons/svg.jsx";

// Helper Functions
const formatDate = (dateString) => {
	if (!dateString) return "Not set";
	const date = new Date(dateString);
	const currentYear = new Date().getFullYear();
	
	const month = date.toLocaleString('default', { month: 'short' });
	const day = date.getDate();
	const year = date.getFullYear() !== currentYear ? ` ${date.getFullYear()}` : '';
	
	return `${month} ${day}${year}`;
};

const formatDateRange = (startDate, endDate) => {
	if (!startDate || !endDate) return "Dates not set";
	return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

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

const getStatusClass = (status) => {
	switch (status?.toLowerCase()) {
		case "active":
			return dashboardStyles.statusActive;
		case "archive":
			return dashboardStyles.statusArchive;
		case "complete":
			return dashboardStyles.statusComplete;
		case "draft":
			return dashboardStyles.statusDraft;
		default:
			return dashboardStyles.statusDraft;
	}
};

// Creator Campaigns Tab
export const CampaignsTab = ({ creator, onUpdate }) => {
	// States
	const [showAssignModal, setShowAssignModal] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredCampaigns, setFilteredCampaigns] = useState(creator.campaigns || []);

	// Filter campaigns based on search query
	useEffect(() => {
		if (!searchQuery.trim()) {
			setFilteredCampaigns(creator.campaigns || []);
			return;
		}

		const filtered = (creator.campaigns || []).filter(campaign =>
			campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(campaign.description && campaign.description.toLowerCase().includes(searchQuery.toLowerCase()))
		);
		setFilteredCampaigns(filtered);
	}, [searchQuery, creator.campaigns]);


	const formatStatus = (status) => {
		if (!status) return "Draft";
		return status.charAt(0).toUpperCase() + status.slice(1);
	};

	const getPlatformIcons = (platforms) => {
		const icons = [];
		if (platforms?.instagram) {
			icons.push(
				<div key="instagram" className={dashboardStyles.platformIcon}>
					{INSTAGRAM_ICON}
				</div>
			);
		}
		if (platforms?.tiktok) {
			icons.push(
				<div key="tiktok" className={dashboardStyles.platformIcon}>
					{TIKTOK_ICON}
				</div>
			);
		}
		return icons;
	};

	return (
		<div>
			<div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
				<input
					type="text"
					className={styles.searchBar}
					placeholder="Search campaigns..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				<button
					onClick={() => setShowAssignModal(true)}
					style={{
						padding: "12px 18px",
						background: "var(--main-hl)",
						color: "white",
						border: "none",
						borderRadius: "8px",
						fontSize: "15px",
						cursor: "pointer",
						whiteSpace: "nowrap"
					}}
				>
					Assign Campaigns
				</button>
			</div>

			<div className={dashboardStyles.campaignsGrid}>
				{filteredCampaigns.map((campaign) => (
					<div
						key={campaign.id}
						className={dashboardStyles.campaignCard}
					>
						<div className={dashboardStyles.campaignMeta}>
							<div className={dashboardStyles.dates}>
								{formatDateRange(campaign.start_date, campaign.end_date)}
							</div>
							<div className={dashboardStyles.metaRight}>
								<div className={dashboardStyles.platformIcons}>
									{getPlatformIcons(campaign.platforms)}
								</div>
								<span className={`${dashboardStyles.statusBadge} ${getStatusClass(campaign.status)}`}>
									{formatStatus(campaign.status)}
								</span>
							</div>
						</div>

						<img 
							src={campaign.img || "/defaults/cmp.webp"} 
							alt={campaign.name}
							className={dashboardStyles.campaignImage}
						/>

						<div className={dashboardStyles.campaignContent}>
							<h3 className={dashboardStyles.campaignTitle}>{campaign.name}</h3>
							<p className={dashboardStyles.campaignDescription}>{
								(campaign.description && campaign.description.length > 0) ? (
									(campaign.description.length > 100) ? (
										campaign.description.substring(0, 100) + "..."
									) : (
										campaign.description
									)
								) : "No Description"
							}</p>
							<div className={dashboardStyles.campaignStats}>
								<div>
									<span className={dashboardStyles.metricLabel}>{POSTS_ICON}Posts</span>
									<span className={dashboardStyles.metricValue}>{campaign.submitted} / {campaign.num_posts}</span>
								</div>
								{campaign.metrics && (
									<>
										<div>
											<span className={dashboardStyles.metricLabel}>{VIEWS_ICON}Views</span>
											<span className={dashboardStyles.metricValue}>{formatNumber(campaign.metrics.views || 0)}</span>
										</div>
										<div>
											<span className={dashboardStyles.metricLabel}>{LIKES_ICON}Likes</span>
											<span className={dashboardStyles.metricValue}>{formatNumber(campaign.metrics.likes || 0)}</span>
										</div>
									</>
								)}
							</div>
						</div>
					</div>
				))}
				{(!filteredCampaigns || filteredCampaigns.length === 0) && (
					<EmptyView message={searchQuery ? "No campaigns match your search." : "No campaigns assigned."} />
				)}
			</div>

			<AssignCampaignsModal
				isOpen={showAssignModal}
				onClose={() => setShowAssignModal(false)}
				creatorId={creator.id}
				onSuccess={onUpdate}
			/>
		</div>
	);
};
