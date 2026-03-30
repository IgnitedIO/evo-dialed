// Dependencies
import { useState, useEffect } from "react";

// API Imports
import { getCreatorCreativeDetails, deleteCreative } from "../../../../api/creators";

// Component Imports
import LoadingCircle from "../../../../ui/Components/LoadingCircle/LoadingCircle";

// Style Imports
import styles from "../styles/CreativeDetailsModal.module.css";

// Icon Imports
import { TIKTOK_ICON, INSTAGRAM_ICON } from "../../../../assets/icons/svg";

// Helper Functions
const formatDate = (dateString) => {
	if (!dateString) return "Not set";
	const date = new Date(dateString);
	const currentYear = new Date().getFullYear();

	const month = date.toLocaleString('default', { month: 'short' });
	const day = date.getDate();
	const year = date.getFullYear() !== currentYear ? ` ${date.getFullYear()}` : '';

	const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

	return `${time} on ${month} ${day}${year}`;
};

// Modal Component
export default function CreativeDetailsModal({
    creativeId,
    onResubmit,
    onDelete,
    onClose,
}) {
	// States
	const [creative, setCreative] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [actionLoading, setActionLoading] = useState(false);

	// Load creative details on mount (or id change)
	const loadCreativeDetails = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await getCreatorCreativeDetails(creativeId);
			if (response.status === 200) setCreative(response.data.data);
			else setError("Failed to load creative details");

		} catch (err) {
			console.error("Error loading creative details:", err);
			setError("Error loading creative details");
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		loadCreativeDetails();
	}, [creativeId]);

    // Handle resubmit
    async function handleResubmit() {
		if (actionLoading) return;
		if (!onResubmit) {
			console.error('onResubmit handler not provided');
			return;
		}
		if (!creative || !creative.campaign) {
			console.error('Creative or campaign data not loaded');
			return;
		}

		// Get campaign platforms from creative
		const campaignPlatforms = [];
		if (creative.campaign.supports_ig) campaignPlatforms.push('ig');
		if (creative.campaign.supports_tt) campaignPlatforms.push('tt');

		console.log('Calling onResubmit with:', {
			creativeId,
			campaign: {
				id: creative.campaign.id,
				name: creative.campaign.name,
				platforms: campaignPlatforms
			}
		});

		onResubmit(creativeId, {
			id: creative.campaign.id,
			name: creative.campaign.name,
			platforms: campaignPlatforms
		});

		onClose();
    }

    // Handle delete
    async function handleDelete() {
		if (actionLoading) return;

		if (!window.confirm("Are you sure you want to delete this creative? This action cannot be undone.")) {
			return;
		}

		try {
			setActionLoading(true);
			const response = await deleteCreative(creativeId);

			if (response.status === 200) {
				if (onDelete) {
					onDelete(creativeId);
				}
				onClose();
			} else {
				setError("Failed to delete creative");
			}
		} catch (err) {
			console.error("Error deleting creative:", err);
			setError("Error deleting creative");
		} finally {
			setActionLoading(false);
		}
    }

	// Handle backdrop click
	const handleBackdropClick = (e) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

    // Render
	return (
		<div className={styles.modalBackdrop} onClick={handleBackdropClick}>
			<div className={styles.modalContent}>
				{/* Header */}
				<div className={styles.modalHeader}>
					<h2 className={styles.modalTitle}>Creative Details</h2>
					<button className={styles.closeButton} onClick={onClose}>
						×
					</button>
				</div>

				{/* Body */}
				<div className={styles.modalBody}>
					{loading && (
						<div className={styles.loadingContainer}>
							<LoadingCircle />
						</div>
					)}

					{error && (
						<div className={styles.errorMessage}>
							{error}
						</div>
					)}

					{creative && !loading && (
						<>
							{/* Creative Media */}
							<div className={styles.mediaContainer}>
								{creative.content_type === "vid" ? (
									<video
										src={creative.s3_url}
										controls
										className={styles.mediaContent}
									/>
								) : (
									<img
										src={creative.s3_url}
										alt="Creative content"
										className={styles.mediaContent}
									/>
								)}
							</div>

							{/* Creative Info */}
							<div className={styles.infoSection}>
								<div className={`${styles.infoCard} ${styles.row}`}>
									<span className={styles.infoCardLabel}>Status</span>
									<span
										className={`${styles.statusBadge} ${
											styles[`statusBadge${creative.status.charAt(0).toUpperCase() + creative.status.slice(1)}`]
										}`}
									>
										{creative.status.charAt(0).toUpperCase() + creative.status.slice(1)}
									</span>
								</div>

								{creative.caption && (
									<div className={styles.infoCard}>
										<span className={styles.infoCardLabel}>Caption</span>
										<p className={styles.caption}>{creative.caption}</p>
									</div>
								)}

								{creative.creator_notes && (
									<div className={styles.infoCard}>
										<span className={styles.infoCardLabel}>Notes</span>
										<p className={styles.notes}>{creative.creator_notes}</p>
									</div>
								)}

								{creative.feedback_notes && (
									<div className={styles.infoCard}>
										<span className={styles.infoCardLabel}>Feedback</span>
										<p className={styles.feedbackNotes}>{creative.feedback_notes}</p>
									</div>
								)}

								<div className={`${styles.infoCard} ${styles.row}`}>
									<span className={styles.infoCardLabel}>Platform</span>
									<span className={styles.platformBadge}>
										{(creative.platform === "tt") && <>
											{TIKTOK_ICON}
											TikTok
										</>}
										{(creative.platform === "ig") && <>
											{INSTAGRAM_ICON}
											Instagram
										</>}
									</span>
								</div>

								<div className={styles.infoCard}>
									<span className={styles.infoCardLabel}>Campaign</span>
									<span className={styles.campaignName}>{creative.campaign.name}</span>
								</div>

								<div className={`${styles.infoCard} ${styles.row}`}>
									<span className={styles.infoCardLabel}>Content Type</span>
									<span>
										{(creative.content_type === "vid") ? <>
											<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>
											Video
										</> : <>
											<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/></svg>
											Image
										</>}
									</span>
								</div>

								<div className={`${styles.infoCard} ${styles.row}`}>
									<span className={styles.infoCardLabel}>Version</span>
									<span>{creative.version}</span>
								</div>

								<div className={`${styles.infoCard} ${styles.row}`}>
									<span className={styles.infoCardLabel}>Submitted</span>
									<span>{formatDate(creative.created_ts)}</span>
								</div>

								{/* {creative.reviewer_name && (
									<div className={`${styles.infoCard} ${styles.row}`}>
										<span className={styles.infoCardLabel}>Reviewed by</span>
										<span>{creative.reviewer_name}</span>
									</div>
								)}

								{creative.reviewed_ts && (
									<div className={`${styles.infoCard} ${styles.row}`}>
										<span className={styles.infoCardLabel}>Reviewed</span>
										<span>{new Date(creative.reviewed_ts).toLocaleString()}</span>
									</div>
								)} */}

								{/* {creative.previous_version && (
									<div className={`${styles.infoCard} ${styles.row}`}>
										<span className={styles.infoCardLabel}>Previous Version</span>
										<span>
											Version {creative.previous_version.version} -{" "}
											{creative.previous_version.status}
										</span>
									</div>
								)} */}
							</div>

							{/* Actions - Only show for rejected creatives */}
							{(creative.status === "rejected") && (
								<div className={styles.actionsSection}>
									<button
										className={styles.deleteButton}
										onClick={handleDelete}
										disabled={actionLoading}
									>
										{actionLoading ? "Deleting..." : "Delete"}
									</button>
									<button
										className={styles.resubmitButton}
										onClick={handleResubmit}
										disabled={actionLoading}
									>
										Resubmit
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}