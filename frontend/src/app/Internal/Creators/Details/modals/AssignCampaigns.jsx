// Dependencies
import { useState, useEffect } from 'react';
import Popup from 'reactjs-popup';

// API Imports
import { 
	getAvailableCampaigns,
	bulkAssignCampaigns,
} from "../../../../../api/internal.js";

// Style Imports
import campaignStyles from "../../../Campaigns/Details/Details.module.css";
import LoadingCircle from '../../../../../ui/Components/LoadingCircle/LoadingCircle.jsx';

// Icon Imports
import { INSTAGRAM_ICON, TIKTOK_ICON } from "../../../../../assets/icons/svg.jsx";

// Helper Functions
const getPlatformIcons = (platforms) => {
	const icons = [];
	if (platforms?.instagram) {
		icons.push(
			<div key="instagram" style={{ display: "flex", alignItems: "center" }}>
				{INSTAGRAM_ICON}
			</div>
		);
	}
	if (platforms?.tiktok) {
		icons.push(
			<div key="tiktok" style={{ display: "flex", alignItems: "center" }}>
				{TIKTOK_ICON}
			</div>
		);
	}
	return icons;
};

// Assign Campaigns Modal
export const AssignCampaignsModal = ({
	creatorId,
	isOpen, onClose, onSuccess
}) => {
	// States
	const [availableCampaigns, setAvailableCampaigns] = useState([]);
	const [selectedCampaigns, setSelectedCampaigns] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [currentPage, setCurrentPage] = useState('select'); // 'select' or 'assign'

	// Load available campaigns on mount
	const loadAvailableCampaigns = async () => {
		try {
			const response = await getAvailableCampaigns(creatorId);
			if (response.status === 200) {
				setAvailableCampaigns(response.data.data);
			} else {
				setError("Failed to load available campaigns");
			}
		} catch (err) {
			setError("Error loading available campaigns");
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		if (isOpen) {
			loadAvailableCampaigns();
			setCurrentPage('select'); // Reset to first page when opening
			setSelectedCampaigns({}); // Reset selections
		}
	}, [isOpen, creatorId]);

	// Handle campaign selection
	const handleCampaignSelect = (campaignId) => {
		setSelectedCampaigns(prev => {
			if (prev[campaignId]) {
				const { [campaignId]: _, ...rest } = prev;
				return rest;
			}
			return { ...prev, [campaignId]: { num_posts: 1 } };
		});
	};

	// Handle post count change
	const handlePostCountChange = (campaignId, count) => {
		setSelectedCampaigns(prev => ({
			...prev,
			[campaignId]: { ...prev[campaignId], num_posts: Math.max(1, parseInt(count) || 1) }
		}));
	};

	// Handle form submission
	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitting(true);
		try {
			const assignments = Object.entries(selectedCampaigns).map(([campaign_id, data]) => ({
				campaign_id,
				num_posts: data.num_posts
			}));

			const response = await bulkAssignCampaigns(creatorId, assignments);
			if (response.status === 200) {
				onSuccess();
				onClose();
			} else {
				setError("Failed to assign campaigns");
			}
		} catch (err) {
			setError("Error assigning campaigns");
		} finally {
			setSubmitting(false);
		}
	};

	// Render "select campaigns" page
	const renderSelectPage = () => (
		<>
			<h3 className={campaignStyles.modalTitle}>Select Campaigns</h3>
			{error && (
				<div className={campaignStyles.error}>{error}</div>
			)}
			<div className={campaignStyles.addLinkForm}>
				{loading ? (
					<div style={{ textAlign: "center", padding: "24px", color: "#667" }}>
						<LoadingCircle />
					</div>
				) : (
					<div style={{ 
						display: "flex", 
						flexDirection: "column", 
						gap: "10px",
						marginBottom: "24px" 
					}}>
						{availableCampaigns.map((campaign, index) => (
							<div 
								key={campaign.id}
								onClick={() => handleCampaignSelect(campaign.id)}
								style={{ 
									display: "flex",
									alignItems: "center",
									gap: "16px",
									padding: "16px",
									border: "1px solid var(--brd-light)",
									borderRadius: "5px",
									cursor: "pointer",
									background: selectedCampaigns[campaign.id] ? "var(--main-hl)10" : "white",
									marginBottom: index === availableCampaigns.length - 1 ? "15px" : "0",
									transition: "background-color 0.2s ease"
								}}
							>
								<div style={{ 
									width: "20px", 
									height: "20px", 
									border: "1px solid var(--brd-light)",
									borderRadius: "4px",
									background: selectedCampaigns[campaign.id] ? "var(--main-hl)" : "white",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "white"
								}}>
									{selectedCampaigns[campaign.id] && "✓"}
								</div>
								<div style={{ flex: 1 }}>
									<div style={{ 
										display: "flex",
										alignItems: "center",
										gap: "12px",
										marginBottom: "4px"
									}}>
										<h4 style={{ 
											fontFamily: "Geist",
											fontSize: "16px",
											fontWeight: "500",
											margin: 0,
											color: "#212529"
										}}>
											{campaign.name}
										</h4>
										<div style={{ 
											display: "flex", 
											gap: "8px",
											alignItems: "center"
										}}>
											{getPlatformIcons(campaign.platforms)}
										</div>
									</div>
									{/* <p style={{ 
										fontFamily: "Geist",
										fontSize: "14px",
										color: "#667",
										margin: 0,
										lineHeight: "1.4"
									}}>
										{campaign.description || "No description provided"}
									</p> */}
								</div>
							</div>
						))}
						{availableCampaigns.length === 0 && (
							<div style={{ 
								textAlign: "center", 
								padding: "24px", 
								color: "#667",
								background: "white",
								borderRadius: "5px",
								border: "1px solid var(--brd-light)",
								marginBottom: "15px",
								fontFamily: "Geist"
							}}>
								No campaigns available
							</div>
						)}
					</div>
				)}
				<div className={campaignStyles.modalActions}>
					<button
						type="button"
						onClick={onClose}
						className={campaignStyles.cancelButton}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => setCurrentPage('assign')}
						className={campaignStyles.submitButton}
						disabled={Object.keys(selectedCampaigns).length === 0}
						style={{
							opacity: Object.keys(selectedCampaigns).length === 0 ? 0.5 : 1,
							cursor: Object.keys(selectedCampaigns).length === 0 ? "not-allowed" : "pointer"
						}}
					>
						Next
					</button>
				</div>
			</div>
		</>
	);

	// Render "assign targets" page
	const renderAssignPage = () => (
		<>
			<h3 className={campaignStyles.modalTitle}>Assign Targets</h3>
			{error && (
				<div className={campaignStyles.error}>{error}</div>
			)}
			<form onSubmit={handleSubmit} className={campaignStyles.addLinkForm}>
				<div style={{ 
					display: "flex", 
					flexDirection: "column", 
					gap: "10px",
					marginBottom: "24px" 
				}}>
					{Object.entries(selectedCampaigns).map(([campaignId, data], index, array) => {
						const numericId = typeof campaignId === 'string' ? parseInt(campaignId, 10) : campaignId;
						const campaign = availableCampaigns.find(c => c.id === numericId);
						
						if (!campaign) {
							console.error(`Campaign not found for ID: ${campaignId}`);
							return null;
						}

						return (
							<div 
								key={campaignId}
								style={{ 
									padding: "16px",
									border: "1px solid var(--brd-light)",
									borderRadius: "5px",
									background: "white",
									marginBottom: index === array.length - 1 ? "15px" : "0"
								}}
							>
								<div style={{ 
									display: "flex",
									alignItems: "center",
									gap: "12px"
								}}>
									<h4 style={{ 
										fontFamily: "Geist",
										fontSize: "16px",
										fontWeight: "500",
										margin: 0,
										color: "#212529"
									}}>
										{campaign.name}
									</h4>
									<div style={{ 
										display: "flex", 
										gap: "8px",
										alignItems: "center"
									}}>
										{getPlatformIcons(campaign.platforms)}
									</div>
									<div style={{ 
										marginLeft: "auto",
										display: "flex",
										alignItems: "center",
										gap: "8px"
									}}>
										<span style={{ 
											fontFamily: "Geist",
											fontSize: "14px",
											color: "#495057"
										}}>
											# of Posts:
										</span>
										<input
											type="number"
											min="1"
											value={data.num_posts}
											onChange={(e) => handlePostCountChange(campaignId, e.target.value)}
											className={campaignStyles.formInput}
											style={{ 
												width: "80px",
												fontFamily: "Geist"
											}}
										/>
									</div>
								</div>
							</div>
						);
					})}
				</div>
				<div className={campaignStyles.modalActions}>
					<button
						type="button"
						onClick={() => setCurrentPage('select')}
						className={campaignStyles.cancelButton}
						disabled={submitting}
					>
						← Back
					</button>
					<button
						type="submit"
						className={campaignStyles.submitButton}
						disabled={submitting}
					>
						{submitting ? "Assigning..." : "Assign Campaigns"}
					</button>
				</div>
			</form>
		</>
	);

	// Render modal
	return (
		<Popup
			open={isOpen}
			onClose={onClose}
			modal
			closeOnDocumentClick={false}
		>
			<div className={campaignStyles.modalContent}>
				{currentPage === 'select' ? renderSelectPage() : renderAssignPage()}
			</div>
		</Popup>
	);
};