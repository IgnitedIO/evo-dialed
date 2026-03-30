// Dependencies
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// API Imports
import { getCampaigns } from "../../../api/creators";

// Component Imports
import LoadingCircleScreen from "../../../ui/Components/LoadingCircle/LoadingCircleScreen.jsx";
import { EmptyView } from "../../../ui/Components";

// Style Imports
import styles from "./Campaigns.module.css";

// Icon Imports
import { INSTAGRAM_ICON, TIKTOK_ICON } from "../../../assets/icons/svg";

// Helper Functions
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

// Creator Campaigns Home Controller
export const CreatorCampaignHome = () => {
	const navigate = useNavigate();

	// States
	const [campaigns, setCampaigns] = useState([]);
	const [filteredCampaigns, setFilteredCampaigns] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Load campaigns on component mount
	const fetchCampaigns = async () => {
		try {
			const response = await getCampaigns();
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
	useEffect(() => {
		fetchCampaigns();
	}, []);

	// Filter campaigns based on search query
	useEffect(() => {
		if (searchQuery.trim() === "") {
			setFilteredCampaigns(campaigns);
		} else {
			const filtered = campaigns.filter(campaign => 
				campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
			);
			setFilteredCampaigns(filtered);
		}
	}, [searchQuery, campaigns]);

	// Handle campaign click
	const handleCampaignClick = (campaignId) => {
		navigate(`/campaigns/${campaignId}`);
	};

	// Render
	if (loading) return <div className={styles.container}><LoadingCircleScreen /></div>;
	if (error) return <div className={styles.container}>{error}</div>;
	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h1 className={styles.title}>My Campaigns</h1>
				<input
					type="text"
					className={styles.searchBar}
					placeholder="Search campaigns..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>
			<div className={styles.campaignsGrid}>
				{filteredCampaigns.map((campaign) => (
					<div
						key={campaign.id}
						className={styles.campaignCard}
						onClick={() => handleCampaignClick(campaign.id)}
					>
						<div className={styles.campaignMeta}>
							<div className={styles.dates}>
								&nbsp;&nbsp;
								{formatDateRange(campaign.start_date, campaign.end_date)}
							</div>
							<div className={styles.metaRight}>
								<div className={styles.platformIcons}>
									{getPlatformIcons(campaign.platforms)}
								</div>
								<span className={`${styles.statusBadge} ${getStatusClass("active")}`}>
									{formatStatus("active")}
								</span>
							</div>
						</div>
						<img className={styles.campaignImage} src={campaign.img ?? "/defaults/cmp.webp"} alt={campaign.title} />
						<div className={styles.campaignContent}>
							<h2 className={styles.campaignTitle}>{campaign.name}</h2>
							{/* <p className={styles.campaignDescription}>{campaign.description}</p> */}
						</div>
					</div>
				))}
			</div>

			{filteredCampaigns.length === 0 && (
				<EmptyView message="No campaigns found." />
			)}
		</div>
	);
};
