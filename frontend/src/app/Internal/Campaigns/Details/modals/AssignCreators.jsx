// Dependencies
import { useEffect, useState } from "react";
import Popup from 'reactjs-popup';

// API Imports
import { getAvailableCreators, bulkAssignCreators } from "../../../../../api/internal";

// Component Imports
import LoadingCircle from "../../../../../ui/Components/LoadingCircle/LoadingCircle.jsx";

// Style Imports
import styles from "../Details.module.css";
import dashboardStyles from "../../../../Clients/Dashboard/Dashboard.module.css";

// Icon Imports
import { 
	INSTAGRAM_ICON, 
	TIKTOK_ICON,
} from "../../../../../assets/icons/svg";

// Helper Functions
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

// Assign Creators Modal Component
export default function AssignCreatorsModal({
	isOpen,
	campaignId,
	onClose,
	onSuccess
}) {
	// States
	const [availableCreators, setAvailableCreators] = useState([]);
	const [selectedCreators, setSelectedCreators] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [currentPage, setCurrentPage] = useState('select'); // 'select' or 'assign'

	// Load creators
	const loadAvailableCreators = async () => {
		try {
			const response = await getAvailableCreators(campaignId);
			if (response.status === 200) {
				// Ensure IDs are strings for consistent comparison
				const creators = response.data.data.creators.map(creator => ({
					...creator,
					id: String(creator.id)
				}));
				setAvailableCreators(creators);
				console.log('Loaded available creators:', creators);
			} else {
				setError("Failed to load available creators");
			}
		} catch (err) {
			setError("Error loading available creators");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isOpen) {
			loadAvailableCreators();
			setCurrentPage('select');
			setSelectedCreators({});
		}
	}, [isOpen, campaignId]);

	// Handle creator select
	const handleCreatorSelect = (creatorId) => {
		// Ensure creatorId is a string
		const stringId = String(creatorId);
		setSelectedCreators(prev => {
			if (prev[stringId]) {
				const { [stringId]: _, ...rest } = prev;
				return rest;
			}
			return { ...prev, [stringId]: { num_posts: 1 } };
		});
		console.log('Selected creators after update:', selectedCreators);
	};

	// Handle post count change
	const handlePostCountChange = (creatorId, count) => {
		setSelectedCreators(prev => ({
			...prev,
			[creatorId]: { ...prev[creatorId], num_posts: Math.max(1, parseInt(count) || 1) }
		}));
	};

	// Handle submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitting(true);
		try {
			const assignments = Object.entries(selectedCreators).map(([creator_id, data]) => ({
				creator_id,
				num_posts: data.num_posts
			}));
			const response = await bulkAssignCreators(campaignId, assignments);
			if (response.status === 200) {
				onSuccess();
				onClose();
			} else {
				setError("Failed to assign creators");
			}
		} catch (err) {
			setError("Error assigning creators");
		} finally {
			setSubmitting(false);
		}
	};

	const renderSelectPage = () => (
		<>
			<h3 className={styles.modalTitle}>Select Creators</h3>
			{error && (
				<div className={styles.error}>{error}</div>
			)}
			<div className={styles.addLinkForm}>
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
						{availableCreators.map((creator, index) => (
							<div 
								key={creator.id}
								onClick={() => handleCreatorSelect(creator.id)}
								style={{ 
									display: "flex",
									alignItems: "center",
									gap: "16px",
									padding: "16px",
									border: "1px solid var(--brd-light)",
									borderRadius: "5px",
									cursor: "pointer",
									background: selectedCreators[creator.id] ? "var(--main-hl)10" : "white",
									marginBottom: index === availableCreators.length - 1 ? "15px" : "0",
									transition: "background-color 0.2s ease",
									width: "100%"
								}}
							>
								<div style={{ 
									width: "20px", 
									height: "20px", 
									border: "1px solid var(--brd-light)",
									borderRadius: "4px",
									background: selectedCreators[creator.id] ? "var(--main-hl)" : "white",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "white",
									flexShrink: 0
								}}>
									{selectedCreators[creator.id] && "✓"}
								</div>
								<div style={{ 
									display: "flex",
									alignItems: "center",
									gap: "12px",
									flex: 1
								}}>
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
									<div>
										<div style={{ 
											fontFamily: "Geist",
											fontSize: "16px",
											fontWeight: "500",
											margin: 0,
											color: "#212529"
										}}>
											{creator.name || creator.email}
										</div>
										<div style={{ 
											fontFamily: "Geist",
											fontSize: "14px",
											color: "#667",
											margin: 0,
											lineHeight: "1.4"
										}}>
											{creator.email}
										</div>
									</div>
								</div>
								<div style={{ 
									display: "flex", 
									gap: "8px",
									alignItems: "center",
									marginLeft: "auto"
								}}>
									{getPlatformIcons(creator.platforms)}
								</div>
							</div>
						))}
						{availableCreators.length === 0 && (
							<div style={{ 
								fontFamily: "Geist",
								textAlign: "center", 
								padding: "24px", 
								color: "#667",
								background: "white",
								borderRadius: "5px",
								border: "1px solid var(--brd-light)",
								marginBottom: "15px"
							}}>
								No creators available
							</div>
						)}
					</div>
				)}
				<div className={styles.modalActions}>
					<button
						type="button"
						onClick={onClose}
						className={styles.cancelButton}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => setCurrentPage('assign')}
						className={styles.submitButton}
						disabled={Object.keys(selectedCreators).length === 0}
						style={{
							opacity: Object.keys(selectedCreators).length === 0 ? 0.5 : 1,
							cursor: Object.keys(selectedCreators).length === 0 ? "not-allowed" : "pointer"
						}}
					>
						Next
					</button>
				</div>
			</div>
		</>
	);

	const renderAssignPage = () => {
		console.log('Rendering assign page with:', {
			selectedCreators,
			availableCreators,
			selectedCreatorIds: Object.keys(selectedCreators)
		});

		return (
			<>
				<h3 className={styles.modalTitle}>Assign Targets</h3>
				{error && (
					<div className={styles.error}>{error}</div>
				)}
				<form onSubmit={handleSubmit} className={styles.addLinkForm}>
					<div style={{ 
						display: "flex", 
						flexDirection: "column", 
						gap: "10px",
						marginBottom: "24px" 
					}}>
						{Object.entries(selectedCreators).map(([creatorId, data], index, array) => {
							const creator = availableCreators.find(c => String(c.id) === String(creatorId));
							console.log('Looking for creator:', { creatorId, found: creator });
							
							if (!creator) {
								console.error(`Creator not found for ID: ${creatorId}`);
								return null;
							}

							return (
								<div 
									key={creatorId}
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
										gap: "12px",
										width: "100%"
									}}>
										<div style={{ 
											display: "flex", 
											alignItems: "center", 
											gap: "12px",
											flex: 1
										}}>
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
											<div style={{ 
												display: "flex", 
												alignItems: "center", 
												gap: "12px"
											}}>
												<div>
													<div style={{ 
														fontFamily: "Geist",
														fontSize: "16px",
														fontWeight: "500",
														margin: 0,
														color: "#212529"
													}}>
														{creator.name || creator.email}
													</div>
													<div style={{ 
														fontFamily: "Geist",
														fontSize: "14px",
														color: "#667",
														margin: 0,
														lineHeight: "1.4"
													}}>
														{creator.email}
													</div>
												</div>
												<div style={{ 
													display: "flex", 
													gap: "8px",
													alignItems: "center"
												}}>
													{getPlatformIcons(creator.platforms)}
												</div>
											</div>
										</div>
										<div style={{ 
											display: "flex",
											alignItems: "center",
											gap: "8px",
											marginLeft: "auto"
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
												onChange={(e) => handlePostCountChange(creatorId, e.target.value)}
												className={styles.formInput}
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
					<div className={styles.modalActions}>
						<button
							type="button"
							onClick={() => setCurrentPage('select')}
							className={styles.cancelButton}
							disabled={submitting}
						>
							← Back
						</button>
						<button
							type="submit"
							className={styles.submitButton}
							disabled={submitting}
						>
							{submitting ? "Assigning..." : "Assign Creators"}
						</button>
					</div>
				</form>
			</>
		);
	};

	return (
		<Popup
			open={isOpen}
			onClose={onClose}
			modal
			closeOnDocumentClick={false}
		>
			<div className={styles.modalContent}>
				{currentPage === 'select' ? renderSelectPage() : renderAssignPage()}
			</div>
		</Popup>
	);
}