// Dependencies
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// API Imports
import { getInternalCampaigns, getCreativeDirectors } from "../../../api/internal";

// Component Imports
import LoadingCircleScreen from "../../../ui/Components/LoadingCircle/LoadingCircleScreen.jsx";
import {
	EmptyView
} from "../../../ui/Components";

// Icon Imports
import { CREATORS_ICON, INSTAGRAM_ICON, TIKTOK_ICON, POSTS_ICON, MONEY_ICON } from "../../../assets/icons/svg";

// Style Imports
import styles from "../../Clients/Dashboard/Dashboard.module.css";
import filterStyles from "./FilterButton.module.css";

// Constants
const DEFAULT_CAMPAIGN_IMAGE = "/defaults/cmp.webp";

// Helper Functions
const getFilterButtonText = () => {
	return "Filter";
	// const parts = [];
	// if (selectedStatus) parts.push(selectedStatus);
	// if (selectedPlatforms.length > 0) parts.push(`${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? 's' : ''}`);
	// return parts.length > 0 ? `Filter (${parts.join(', ')})` : 'Filter';
};
const getStatusClass = (status) => {
	switch (status?.toLowerCase()) {
		case "active":
			return styles.statusActive;
		case "archive":
			return styles.statusArchive;
		default:
			return styles.statusDraft;
	}
};
const formatStatus = (status) => {
	if (!status) return "Draft";
	return status.charAt(0).toUpperCase() + status.slice(1);
};
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
const getPlatformIcons = (platforms) => {
	const icons = [];
	if (platforms?.instagram) {
		icons.push(
			<div key="instagram" className={styles.platformIcon}>
				{INSTAGRAM_ICON}
			</div>
		);
	}
	if (platforms?.tiktok) {
		icons.push(
			<div key="tiktok" className={styles.platformIcon}>
				{TIKTOK_ICON}
			</div>
		);
	}
	return icons;
};


// Main Component
export const InternalCampaignsHome = () => {
	const navigate = useNavigate();
	const [campaigns, setCampaigns] = useState([]);
	const [filteredCampaigns, setFilteredCampaigns] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showFilterDropdown, setShowFilterDropdown] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState("active");
	const [selectedPlatforms, setSelectedPlatforms] = useState([]);
	const [creativeDirectors, setCreativeDirectors] = useState([]);
	const [selectedCdUserId, setSelectedCdUserId] = useState(null);

	// Fetch campaigns when creative director filter changes
	useEffect(() => {
		const fetchCampaigns = async () => {
			try {
				setLoading(true);
				const response = await getInternalCampaigns(selectedCdUserId);
				if (response.status === 200) {
					setCampaigns(response.data.data);
					setFilteredCampaigns(response.data.data);
				} else {
					setError("Failed to load campaigns");
				}
			} catch (err) {
				setError("Error loading campaigns");
			} finally {
				setLoading(false);
			}
		};

		fetchCampaigns();
	}, [selectedCdUserId]);

	// Fetch creative directors on component mount
	useEffect(() => {
		const fetchCreativeDirectors = async () => {
			try {
				const response = await getCreativeDirectors();
				if (response.status === 200) {
					setCreativeDirectors(response.data.data || []);
				}
			} catch (err) {
				console.error("Error loading creative directors:", err);
			}
		};

		fetchCreativeDirectors();
	}, []);

	// Filter campaigns based on search query, status, and platforms
	useEffect(() => {
		let filtered = campaigns;

		// Apply search filter
		if (searchQuery.trim()) {
			filtered = filtered.filter((campaign) =>
				campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		// Apply status filter
		if (selectedStatus) {
			filtered = filtered.filter((campaign) => 
				campaign.status?.toLowerCase() === selectedStatus.toLowerCase()
			);
		}

		// Apply platform filters
		if (selectedPlatforms.length > 0) {
			filtered = filtered.filter((campaign) => {
				return selectedPlatforms.every(platform => {
					const platformKey = platform.toLowerCase();
					return campaign.platforms?.[platformKey] === true;
				});
			});
		}

		setFilteredCampaigns(filtered);
	}, [searchQuery, campaigns, selectedStatus, selectedPlatforms]);

	const handleCampaignClick = (campaignId) => {
		navigate(`/team/campaigns/${campaignId}/overview`);
	};

	const handleCreateCampaign = () => {
		navigate("/team/campaigns/new");
	};

	const handleStatusFilter = (status) => {
		setSelectedStatus(status === selectedStatus ? null : status);
	};

	const handlePlatformFilter = (platform) => {
		setSelectedPlatforms(prev => {
			if (prev.includes(platform)) {
				return prev.filter(p => p !== platform);
			}
			return [...prev, platform];
		});
	};

	const handleCreativeDirectorFilter = (cdUserId) => {
		setSelectedCdUserId(cdUserId === selectedCdUserId ? null : cdUserId);
	};


	if (loading) return <div className={styles.container}><LoadingCircleScreen /></div>;
	if (error) return <div className={styles.container}>{error}</div>;

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h1 className={styles.title}>Campaigns</h1>
			</div>

			{/* Search Bar and Create Button Container */}
			<div style={{ 
				marginBottom: "24px",
				display: "flex",
				gap: "12px",
				alignItems: "center",
			}}>
				<input
					type="text"
					placeholder="Search campaigns..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					style={{
						flex: 1,
						padding: "12px",
						border: "1px solid var(--brd-light)",
						borderRadius: "8px",
						fontSize: "14px",
						backgroundColor: "var(--card-bg)",
					}}
				/>
				<div style={{ position: "relative" }}>
					<button 
						onClick={() => setShowFilterDropdown(!showFilterDropdown)}
						className={filterStyles.filterButton}
					>
						{getFilterButtonText()}
						<span className={filterStyles.dropdownArrow}>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
								<path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m19 9-7 7-7-7"/>
							</svg>
						</span>
					</button>
					{showFilterDropdown && (
						<div className={filterStyles.dropdownContainer}>
							{/* Platforms Section */}
							<div className={filterStyles.section}>
								<div className={filterStyles.sectionHeader}>
									Platforms
								</div>
								{[
									{ name: "Instagram", icon: INSTAGRAM_ICON, key: "instagram" },
									{ name: "TikTok", icon: TIKTOK_ICON, key: "tiktok" }
								].map(({ name, icon, key }) => (
									<button
										key={key}
										onClick={() => handlePlatformFilter(key)}
										className={`${filterStyles.filterOption} ${filterStyles.platformOption} ${
											selectedPlatforms.includes(key) ? filterStyles.filterOptionSelected : ''
										}`}
									>
										<div className={filterStyles.platformIcon}>
											{icon}
										</div>
										{name}
									</button>
								))}
							</div>

							<div className={filterStyles.divider} />

							{/* Status Section */}
							<div className={filterStyles.section}>
								<div className={filterStyles.sectionHeader}>
									Status
								</div>
								{[
									{ name: "Active", status: "active" },
									{ name: "Archive", status: "archive" }
								].map(({ name, status }) => (
									<button
										key={status}
										onClick={() => handleStatusFilter(name)}
										className={`${filterStyles.filterOption} ${filterStyles.statusOption} ${
											selectedStatus === name ? filterStyles.filterOptionSelected : ''
										}`}
									>
										<div className={`${filterStyles.statusIndicator} ${filterStyles[`statusIndicator${name}`]}`} />
										{name}
									</button>
								))}
							</div>

							{/* Creative Directors Section */}
							{creativeDirectors.length > 0 && (
								<>
									<div className={filterStyles.divider} />
									<div className={filterStyles.section}>
										<div className={filterStyles.sectionHeader}>
											Creative Director
										</div>
										{creativeDirectors.map((cd) => (
											<button
												key={cd.id}
												onClick={() => handleCreativeDirectorFilter(cd.id)}
												className={`${filterStyles.filterOption} ${
													selectedCdUserId === cd.id ? filterStyles.filterOptionSelected : ''
												}`}
											>
												{cd.pfp && (
													<img
														src={cd.pfp}
														alt={cd.name}
														style={{
															width: '20px',
															height: '20px',
															borderRadius: '50%',
															marginRight: '8px',
															objectFit: 'cover'
														}}
													/>
												)}
												{cd.name}
											</button>
										))}
									</div>
								</>
							)}
						</div>
					)}
				</div>
				<button 
					onClick={handleCreateCampaign}
					className="createButton"
				>
					Create Campaign
				</button>
			</div>

			{/* Campaigns Grid */}
			<div className={styles.campaignsGrid}>
				{filteredCampaigns.map((campaign) => (
					<div
						key={campaign.id}
						className={styles.campaignCard}
						onClick={() => handleCampaignClick(campaign.id)}
					>
						<div className={styles.campaignMeta}>
							<div className={styles.dates}>
								{formatDateRange(campaign.start_date, campaign.end_date)}
							</div>
							<div className={styles.metaRight}>
								<div className={styles.platformIcons}>
									{getPlatformIcons(campaign.platforms)}
								</div>
								<span className={`${styles.statusBadge} ${getStatusClass(campaign.status)}`}>
									{formatStatus(campaign.status)}
								</span>
							</div>
						</div>

						<img 
							src={campaign.img || DEFAULT_CAMPAIGN_IMAGE} 
							alt={campaign.name}
							className={styles.campaignImage}
						/>

						<div className={styles.campaignContent}>
							<h3 className={styles.campaignTitle}>{campaign.name}</h3>
							<p className={styles.campaignDescription}>{
								(campaign.description && campaign.description.length > 0) ? (
									(campaign.description.length > 100) ? (
										campaign.description.substring(0, 100) + "..."
									) : (
										campaign.description
									)
								) : "No Description"
							}</p>
							<div className={styles.campaignStats}>
								<div>
									<span className={styles.metricLabel}>{POSTS_ICON}Posts</span>
									<span className={styles.metricValue}>{(campaign.progress) ? `${campaign.progress.submitted} / ${campaign.progress.total}` : `${campaign.submitted}`}</span>
								</div>
								<div>
									<span className={styles.metricLabel}>{CREATORS_ICON}Creators</span>
									<span className={styles.metricValue}>{campaign.creator_count}</span>
								</div>
								<div>
									<span className={styles.metricLabel}>{MONEY_ICON}Budget</span>
									<span className={styles.metricValue}>${Math.round(campaign.budget ?? 0).toLocaleString()}</span>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Empty State */}
			{filteredCampaigns.length === 0 && (
				<EmptyView message={searchQuery ? "No campaigns match your search." : "No campaigns available."} />
			)}
		</div>
	);
};
