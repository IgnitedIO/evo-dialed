// Dependencies
import { useState, useEffect, useRef } from "react";

// API Imports
import { getCreativeDetails, approveCreative, rejectCreative } from "../../../../api/internal";

// Component Imports
import LoadingCircle from "../../../../ui/Components/LoadingCircle/LoadingCircle";

// Style Imports
import styles from "./DetailsModal.module.css";

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

// Creative Approval Details Modal Component
export default function CreativeApprovalDetailsModal({
	creativeId,
	onClose,
	onStatusUpdate, // Callback when status changes: (creativeId, newStatus) => void
}) {
	// States
	const [creative, setCreative] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [actionLoading, setActionLoading] = useState(false);

	// Rejection states
	const [showRejectForm, setShowRejectForm] = useState(false);
	const [showApproveForm, setShowApproveForm] = useState(false);
	const [rejectionNotes, setRejectionNotes] = useState("");
	const rejectFormRef = useRef(null);

	// Load creative details
	useEffect(() => {
		loadCreativeDetails();
	}, [creativeId]);

	const loadCreativeDetails = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await getCreativeDetails(creativeId);

			if (response.status === 200) {
				setCreative(response.data.data);
			} else {
				setError("Failed to load creative details");
			}
		} catch (err) {
			console.error("Error loading creative details:", err);
			setError("Error loading creative details");
		} finally {
			setLoading(false);
		}
	};

	// Handle approve
	const handleApprove = async () => {
		if (actionLoading || rejectionNotes.trim().length === 0) return;

		try {
			setActionLoading(true);
			const response = await approveCreative(creativeId, rejectionNotes.trim());

			if (response.status === 200) {
				// Update local state
				setCreative((prev) => ({ ...prev, status: "approved", feedback_notes: rejectionNotes.trim() }));
				// Notify parent
				if (onStatusUpdate) onStatusUpdate(creativeId, "approved");
				// Close modal after short delay
				setTimeout(() => {
					onClose();
				}, 500);
			} else {
				setError("Failed to approve creative");
			}
		} catch (err) {
			console.error("Error approving creative:", err);
			setError("Error approving creative");
		} finally {
			setActionLoading(false);
		}
	};

	// Handle reject
	const handleReject = async () => {
		if (actionLoading || rejectionNotes.trim().length === 0) return;

		try {
			setActionLoading(true);
			const response = await rejectCreative(creativeId, rejectionNotes.trim());

			if (response.status === 200) {
				// Update local state
				setCreative((prev) => ({ ...prev, status: "rejected", feedback_notes: rejectionNotes.trim() }));
				// Notify parent
				if (onStatusUpdate) {
					onStatusUpdate(creativeId, "rejected");
				}
				// Close modal after short delay
				setTimeout(() => {
					onClose();
				}, 500);
			} else {
				setError("Failed to reject creative");
			}
		} catch (err) {
			console.error("Error rejecting creative:", err);
			setError("Error rejecting creative");
		} finally {
			setActionLoading(false);
		}
	};

	// Handle backdrop click
	const handleBackdropClick = (e) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<div className={styles.modalBackdrop} onClick={handleBackdropClick}>
			<div className={styles.modalContent}>
				{/* Header */}
				<div className={styles.modalHeader}>
					{/* <h2 className={styles.modalTitle}>Creative Details</h2> */}
					<div className={styles.modalLeft}>
						<button className={styles.closeButton} onClick={onClose}>
							×
						</button>
					</div>
					{(!loading && creative) && <>
						<div className={styles.modalCenter}>
							<div className={styles.creatorInfo}>
								<img
									src={creative.creator.pfp ?? "/defaults/u.webp"}
									alt={creative.creator.name}
									className={styles.creatorPfp}
								/>
								<span>{creative.creator.name}</span>
							</div>
						</div>
						<div className={styles.modalRight}>
							<button
								className={styles.rejectButton}
								onClick={() => {
									setShowRejectForm(true);
									setTimeout(() => {
										rejectFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
									}, 100);
								}}
								disabled={actionLoading}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x-icon lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
							</button>
							<button
								className={styles.approveButton}
								onClick={() => {
									setShowApproveForm(true);
									setTimeout(() => {
										rejectFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
									}, 100);
								}}
								disabled={actionLoading}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
							</button>
						</div>
					</>}
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

								{/* <div className={`${styles.infoCard} ${styles.row}`}>
									<span className={styles.infoCardLabel}>Creator</span>
									<div className={styles.creatorInfo}>
										<img
											src={creative.creator.pfp ?? "/defaults/u.webp"}
											alt={creative.creator.name}
											className={styles.creatorPfp}
										/>
										<span>{creative.creator.name}</span>
									</div>
								</div> */}

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

								<div className={`${styles.infoCard} ${styles.campaign}`}>
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

								{creative.reviewer_name && (
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
								)}

								{creative.previous_version && (
									<div className={`${styles.infoCard} ${styles.row}`}>
										<span className={styles.infoCardLabel}>Previous Version</span>
										<span>
											Version {creative.previous_version.version} -{" "}
											{creative.previous_version.status}
										</span>
									</div>
								)}
							</div>

							{/* Actions */}
							{(creative.status === "pending") && (
								<div className={styles.actionsSection}>
									{(!showApproveForm) ? (
										<>
										</>
									) : (
										<div className={styles.rejectForm} ref={rejectFormRef}>
											<label className={styles.rejectLabel}>
												Feedback Notes (Optional)
											</label>
											<textarea
												className={styles.rejectTextarea}
												value={rejectionNotes}
												onChange={(e) => setRejectionNotes(e.target.value)}
												placeholder="Provide any additional feedback for the creator..."
												rows={4}
											/>
											<div className={styles.rejectFormActions}>
												<button
													className={styles.cancelButton}
													onClick={() => {
														setShowApproveForm(false);
														setRejectionNotes("");
													}}
													disabled={actionLoading}
												>
													Cancel
												</button>
												<button
													className={styles.submitApproveButton}
													onClick={handleApprove}
													disabled={actionLoading || rejectionNotes.trim().length === 0}
												>
													{actionLoading ? "Approving..." : "Submit Approval"}
												</button>
											</div>
										</div>
									)}
									{(!showRejectForm) ? (
										<>
											{/* <button
												className={styles.approveButton}
												onClick={handleApprove}
												disabled={actionLoading}
											>
												{actionLoading ? "Approving..." : "Approve"}
											</button>
											<button
												className={styles.rejectButton}
												onClick={() => setShowRejectForm(true)}
												disabled={actionLoading}
											>
												Reject
											</button> */}
										</>
									) : (
										<div className={styles.rejectForm} ref={rejectFormRef}>
											<label className={styles.rejectLabel}>
												Rejection Notes
											</label>
											<textarea
												className={styles.rejectTextarea}
												value={rejectionNotes}
												onChange={(e) => setRejectionNotes(e.target.value)}
												placeholder="Provide feedback for the creator..."
												rows={4}
											/>
											<div className={styles.rejectFormActions}>
												<button
													className={styles.cancelButton}
													onClick={() => {
														setShowRejectForm(false);
														setRejectionNotes("");
													}}
													disabled={actionLoading}
												>
													Cancel
												</button>
												<button
													className={styles.submitRejectButton}
													onClick={handleReject}
													disabled={actionLoading || rejectionNotes.trim().length === 0}
												>
													{actionLoading ? "Rejecting..." : "Submit Rejection"}
												</button>
											</div>
										</div>
									)}
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
