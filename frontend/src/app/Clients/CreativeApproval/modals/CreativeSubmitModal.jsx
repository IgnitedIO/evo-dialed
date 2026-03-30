// Dependencies
import { useState, useEffect } from "react";

// API Imports
import { generateCreativeUploadUrl, submitCreative, resubmitCreative } from "../../../../api/creators";
import { http } from "../../../../api/http";

// Component Imports
import CampaignSelector from "../components/CampaignSelector";

// Context Imports
import { useCreativeUploadContext } from "../../../../context/useCreativeUploadContext";

// Style Imports
import styles from "../styles/CreativeDetailsModal.module.css";

// Icon Imports
import { INSTAGRAM_ICON, TIKTOK_ICON } from "../../../../assets/icons/svg";

// Helper Functions
const generateThumbnail = (file) => {
	return new Promise((resolve, reject) => {
		const isVideo = file.type.startsWith('video/');

		// Safari-safe timeout - don't let thumbnail generation block submission
		const timeout = setTimeout(() => {
			console.warn('Thumbnail generation timed out, continuing without thumbnail');
			resolve(null);
		}, 5000);

		const cleanupAndResolve = (result) => {
			clearTimeout(timeout);
			resolve(result);
		};

		if (isVideo) {
			// Generate video thumbnail
			const video = document.createElement('video');
			video.preload = 'metadata';
			video.muted = true;
			video.playsInline = true;
			video.crossOrigin = 'anonymous'; // Safari compatibility

			let blobUrl = null;

			video.onloadeddata = () => {
				video.currentTime = 1; // Seek to 1 second
			};

			video.onseeked = () => {
				try {
					const canvas = document.createElement('canvas');
					canvas.width = 320;
					canvas.height = (video.videoHeight / video.videoWidth) * 320;

					const ctx = canvas.getContext('2d');
					ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

					canvas.toBlob((blob) => {
						if (blobUrl) URL.revokeObjectURL(blobUrl);
						if (blob) {
							const reader = new FileReader();
							reader.onloadend = () => {
								const base64 = reader.result.split(',')[1];
								cleanupAndResolve(base64);
							};
							reader.onerror = () => cleanupAndResolve(null);
							reader.readAsDataURL(blob);
						} else {
							cleanupAndResolve(null);
						}
					}, 'image/jpeg', 0.8);
				} catch (err) {
					console.error('Video thumbnail error:', err);
					if (blobUrl) URL.revokeObjectURL(blobUrl);
					cleanupAndResolve(null);
				}
			};

			video.onerror = (err) => {
				console.error('Video load error:', err);
				if (blobUrl) URL.revokeObjectURL(blobUrl);
				cleanupAndResolve(null);
			};

			blobUrl = URL.createObjectURL(file);
			video.src = blobUrl;
			video.load(); // Explicitly load for Safari
		} else {
			// Generate image thumbnail
			const img = new Image();
			let blobUrl = null;

			img.onload = () => {
				try {
					const canvas = document.createElement('canvas');
					const maxWidth = 320;
					const scale = maxWidth / img.width;
					canvas.width = maxWidth;
					canvas.height = img.height * scale;

					const ctx = canvas.getContext('2d');
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

					canvas.toBlob((blob) => {
						if (blobUrl) URL.revokeObjectURL(blobUrl);
						if (blob) {
							const reader = new FileReader();
							reader.onloadend = () => {
								const base64 = reader.result.split(',')[1];
								cleanupAndResolve(base64);
							};
							reader.onerror = () => cleanupAndResolve(null);
							reader.readAsDataURL(blob);
						} else {
							cleanupAndResolve(null);
						}
					}, 'image/jpeg', 0.8);
				} catch (err) {
					console.error('Image thumbnail error:', err);
					if (blobUrl) URL.revokeObjectURL(blobUrl);
					cleanupAndResolve(null);
				}
			};

			img.onerror = (err) => {
				console.error('Image load error:', err);
				if (blobUrl) URL.revokeObjectURL(blobUrl);
				cleanupAndResolve(null);
			};

			blobUrl = URL.createObjectURL(file);
			img.src = blobUrl;
		}
	});
};

// Modal Component
export default function CreativeSubmitModal({
    onSubmit,
    onClose,
    config = null, // { mode: 'resubmit', creativeId: number, campaign: { id, name, platforms } }
}) {
	// Upload context
	const { addUpload, removeUpload, markUploadError } = useCreativeUploadContext();

	// UI States
	const [error, setError] = useState(null);
	const [actionLoading, setActionLoading] = useState(false);

	// Data States
	const [creativeFile, setCreativeFile] = useState(null);
	const [campaignSelected, setCampaignSelected] = useState(config?.campaign || null);
	const [platformSelected, setPlatformSelected] = useState(
		config?.campaign?.platforms?.length === 1 ? config.campaign.platforms[0] : null
	);
	const [caption, setCaption] = useState("");
	const [creatorNotes, setCreatorNotes] = useState("");

	// Mode
	const isResubmit = config?.mode === 'resubmit';
	const creativeIdToResubmit = config?.creativeId;

	// Reset form after submission
	const resetForm = () => {
		setCreativeFile(null);
		setCaption("");
		setCreatorNotes("");
		setError(null);
		setActionLoading(false);
		// Only reset campaign/platform if not in resubmit mode
		if (!isResubmit) {
			setCampaignSelected(null);
			setPlatformSelected(null);
		}
	};

	// Reset on mount (when modal opens) - ensures fresh state for new submissions
	useEffect(() => {
		// Only reset if not in resubmit mode and no config provided
		if (!config) {
			setCreativeFile(null);
			setCaption("");
			setCreatorNotes("");
			setError(null);
			setActionLoading(false);
			setCampaignSelected(null);
			setPlatformSelected(null);
		}
	}, []); // Empty dependency array = run once on mount

	// Handle campaign selection
	const handleCampaignSelect = (campaign) => {
		setCampaignSelected(campaign);
		// Auto-select platform if only one is available
		if (campaign.platforms.length === 1) {
			setPlatformSelected(campaign.platforms[0]);
		} else {
			setPlatformSelected(null);
		}
	};

    // Handle submit - now processes in background
    async function handleSubmit() {
		if (actionLoading) return;

		// Validation
		if (!creativeFile) {
			setError("Please select a file to upload");
			return;
		}
		if (!campaignSelected) {
			setError("Please select a campaign");
			return;
		}
		if (!platformSelected) {
			setError("Please select a platform");
			return;
		}
		if (!caption.trim()) {
			setError("Please enter a caption");
			return;
		}

		// Don't block the UI - we'll process in background
		setError(null);

		// Generate a unique upload ID
		const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		// Start generating thumbnail immediately (but don't await)
		const thumbnailPromise = generateThumbnail(creativeFile);

		// Generate display thumbnail for the indicator (await the same thumbnail and add data URL prefix)
		const thumbnailBase64 = await thumbnailPromise;
		const displayThumbnail = thumbnailBase64 ? `data:image/jpeg;base64,${thumbnailBase64}` : null;

		// Add to upload queue with display thumbnail
		addUpload(uploadId, displayThumbnail, creativeFile.name);

		// Reset form state for next use
		resetForm();

		// Close modal immediately
		onClose();

		// Continue processing in background
		processUploadInBackground(
			uploadId,
			creativeFile,
			thumbnailPromise,
			campaignSelected,
			platformSelected,
			caption.trim(),
			creatorNotes.trim(),
			isResubmit,
			creativeIdToResubmit,
			onSubmit,
			removeUpload,
			markUploadError
		);
    }

    // Background upload processor
    async function processUploadInBackground(
		uploadId,
		file,
		thumbnailPromise,
		campaign,
		platform,
		caption,
		creatorNotes,
		isResubmit,
		creativeIdToResubmit,
		onSubmitCallback,
		removeUpload,
		markUploadError
    ) {
		try {
			// Determine content type (img or vid)
			const contentType = file.type.startsWith('video/') ? 'vid' : 'img';

			// Wait for thumbnail to be generated
			const thumbnailBase64 = await thumbnailPromise;

			// Step 1: Get presigned upload URL
			const uploadUrlResponse = await generateCreativeUploadUrl(
				campaign.id,
				file.name,
				file.size,
				file.type
			);

			if (uploadUrlResponse.status !== 200) {
				console.error("Failed to generate upload URL");
				markUploadError(uploadId);
				return;
			}

			const { upload_url, s3_key } = uploadUrlResponse.data.data;

			// Step 2: Upload file to S3
			const uploadResponse = await http.put(upload_url, file, {
				headers: {
					'Content-Type': file.type,
				},
			});

			if (uploadResponse.status !== 200) {
				console.error("Failed to upload file to S3");
				markUploadError(uploadId);
				return;
			}

			// Step 3: Submit or Resubmit creative
			let submitResponse;
			if (isResubmit) {
				submitResponse = await resubmitCreative(
					creativeIdToResubmit,
					s3_key,
					contentType,
					platform,
					caption,
					creatorNotes,
					thumbnailBase64
				);
			} else {
				submitResponse = await submitCreative(
					campaign.id,
					s3_key,
					contentType,
					platform,
					caption,
					creatorNotes,
					thumbnailBase64
				);
			}

			if (submitResponse.status !== 200) {
				console.error(isResubmit ? "Failed to resubmit creative" : "Failed to submit creative");
				markUploadError(uploadId);
				return;
			}

			// Success - remove from upload queue
			removeUpload(uploadId);

			// Call parent callback if provided
			if (onSubmitCallback) {
				onSubmitCallback(submitResponse.data.data.creative_id);
			}

		} catch (err) {
			console.error("Error submitting creative:", err);
			markUploadError(uploadId);
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
					<h2 className={styles.modalTitle}>
						{(isResubmit) ? 'Resubmit Creative' : 'Submit Creative'}
					</h2>
					<button className={styles.closeButton} onClick={onClose}>
						×
					</button>
				</div>

				{/* Body */}
				<div className={styles.modalBody}>
					{(error) && (
						<div className={styles.errorMessage}>
							{error}
						</div>
					)}

					{/* File Input */}
					<div className={styles.inputSection}>
						<input id="creative-file-input" className={styles.fileInputReal} type="file" accept="image/*, video/*" onChange={(e) => setCreativeFile(e.target.files[0])} />
						<button className={styles.fileInput} onClick={() => {
							document.getElementById("creative-file-input").click()
						}}>
							{(creativeFile) ? <>
								{creativeFile.name}<br/><br/><span>Click to edit</span>
							</> : <>
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>
								<br/>
								Upload Creative
							</>}
						</button>
					</div>
					
					{/* Campaign Picker */}
					<div className={styles.inputSection}>
						<p>Select Campaign</p>
						{isResubmit ? (
							<div style={{
								padding: "12px 16px",
								border: "1px solid var(--brd-light)",
								borderRadius: "8px",
								background: "#f8f9fa",
								fontFamily: "Geist",
								fontSize: "14px",
								color: "#495057"
							}}>
								{campaignSelected.name}
							</div>
						) : (
							<CampaignSelector
								selectedCampaign={campaignSelected}
								onCampaignSelect={handleCampaignSelect}
								placeholder="Select a campaign..."
							/>
						)}
					</div>

					{/* Platform Picker (if campaign supports multiple platforms) */}
					{(campaignSelected !== null && campaignSelected.platforms.length > 1) &&
						<div className={styles.inputSection}>
							<p>Select Platform</p>
							<div style={{
								display: "flex",
								gap: "12px",
								margin: "0",
							}}>
								{campaignSelected.platforms.includes("ig") && (
									<button
										onClick={() => setPlatformSelected("ig")}
										className={`${styles.platformButton} ${(platformSelected === "ig") ? styles.platformButtonActive : ""}`}
									>
										{INSTAGRAM_ICON}
										Instagram
									</button>
								)}
								{campaignSelected.platforms.includes("tt") && (
									<button
										onClick={() => setPlatformSelected("tt")}
										className={`${styles.platformButton} ${(platformSelected === "tt") ? styles.platformButtonActive : ""}`}
									>
										{TIKTOK_ICON}
										TikTok
									</button>
								)}
							</div>
						</div>
					}

					{/* Caption */}
					<div className={styles.inputSection}>
						<p>Caption</p>
						<textarea className={styles.captionTextarea} placeholder="Enter your caption here..." value={caption} onChange={(e) => setCaption(e.target.value)} />
					</div>

					{/* Notes */}
					<div className={styles.inputSection}>
						<p>Notes (Optional)</p>
						<textarea className={styles.notesTextarea} placeholder="Enter your notes here..." value={creatorNotes} onChange={(e) => setCreatorNotes(e.target.value)} />
					</div>

					{/* Actions */}
					<div className={styles.actionsSection}>
						<button
							className={styles.cancelButton}
							onClick={onClose}
							disabled={actionLoading}
						>
							Cancel
						</button>
						<button
							className={`${styles.submitButton} ${(!creativeFile || !caption.trim() || !campaignSelected || !platformSelected) ? styles.hidden : ""}`}
							onClick={handleSubmit}
							disabled={
								actionLoading ||
								!creativeFile ||
								!caption.trim() ||
								!campaignSelected ||
								!platformSelected
							}
						>
							{actionLoading
								? (isResubmit ? "Resubmitting..." : "Submitting...")
								: (isResubmit ? "Resubmit" : "Submit")
							}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}