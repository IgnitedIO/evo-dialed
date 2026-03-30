// Dependencies
import { useState } from "react";
import { debounce } from "lodash";

// API Imports
import { updateCampaignSettings } from "../../../../../api/internal";

// Style Imports
import styles from "../Details.module.css";

// Icon Imports
import {
	INSTAGRAM_ICON,
	TIKTOK_ICON,
} from "../../../../../assets/icons/svg";

// Component Imports
import ImagePicker from "../../../../../components/ImagePicker";
import AssignCreativeDirectorModal from "../modals/AssignCreativeDirector";

// Helper Components
const SaveIndicator = ({ status }) => {
	if (!status) return null;
	return (
		<span className={`${styles.saveIndicator} ${status === "saved" ? styles.saveIndicatorSaved : styles.saveIndicatorSaving}`}>
			{status === "saving" ? "Saving..." : "Saved"}
		</span>
	);
};

// Settings Tab Component
export default function SettingsTab({
	campaign,
	onUpdate
}) {
	// States
	const [settings, setSettings] = useState({
		name: campaign.name,
		description: campaign.description,
		supports_ig: campaign.supports_ig,
		supports_tt: campaign.supports_tt,
		status: campaign.status || "active",
		start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().slice(0, 16) : "",
		end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().slice(0, 16) : ""
	});
	const [originalDates, setOriginalDates] = useState({
		start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().slice(0, 16) : "",
		end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().slice(0, 16) : ""
	});
	const [error, setError] = useState(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [saveStatus, setSaveStatus] = useState({ name: null, description: null, status: null, img: null });
	const [savingDates, setSavingDates] = useState(false);
	const [showAssignDirectorModal, setShowAssignDirectorModal] = useState(false);

	// Create debounced update functions for text fields
	const debouncedUpdate = debounce(async (key, value) => {
		setSaveStatus(prev => ({ ...prev, [key]: "saving" }));
		try {
			const response = await updateCampaignSettings(campaign.id, key, value);
			if (response.status === 200) {
				onUpdate();
				setSaveStatus(prev => ({ ...prev, [key]: "saved" }));
				// Clear the saved status after 2 seconds
				setTimeout(() => {
					setSaveStatus(prev => ({ ...prev, [key]: null }));
				}, 2000);
			} else {
				setError(`Failed to update ${key}`);
				setSaveStatus(prev => ({ ...prev, [key]: null }));
			}
		} catch (err) {
			setError(`Failed to update ${key}`);
			setSaveStatus(prev => ({ ...prev, [key]: null }));
		}
	}, 500);

	// Handle setting change
	const handleSettingChange = (key, value) => {
		setSettings(prev => ({ ...prev, [key]: value }));
		if (key === "name" || key === "description") {
			debouncedUpdate(key, value);
		}
	};

	// Handle saving dates
	const handleSaveDates = async () => {
		setSavingDates(true);
		setError(null);
		
		try {
			// Update start date if changed
			if (settings.start_date !== originalDates.start_date) {
				const response = await updateCampaignSettings(campaign.id, "start_date", settings.start_date);
				if (response.status !== 200) {
					throw new Error("Failed to update start date");
				}
			}
			
			// Update end date if changed
			if (settings.end_date !== originalDates.end_date) {
				const response = await updateCampaignSettings(campaign.id, "end_date", settings.end_date);
				if (response.status !== 200) {
					throw new Error("Failed to update end date");
				}
			}
			
			// Update original dates to reflect the saved state
			setOriginalDates({
				start_date: settings.start_date,
				end_date: settings.end_date
			});
			
			onUpdate();
		} catch (err) {
			setError(err.message || "Failed to update dates");
		} finally {
			setSavingDates(false);
		}
	};

	// Check if dates have changed
	const datesHaveChanged = () => {
		return settings.start_date !== originalDates.start_date || 
		       settings.end_date !== originalDates.end_date;
	};

	// Handle platform change
	const handlePlatformChange = async (platform, value) => {
		// Prevent unchecking if it's the last platform
		if (!value && !settings.supports_ig && !settings.supports_tt) {
			setError("At least one platform must be selected");
			return;
		}

		setError(null);
		setSettings(prev => ({ ...prev, [platform]: value }));
		
		try {
			const response = await updateCampaignSettings(campaign.id, platform, value);
			if (response.status === 200) {
				onUpdate();
			} else {
				setError(`Failed to update ${platform}`);
				// Revert the change on failure
				setSettings(prev => ({ ...prev, [platform]: !value }));
			}
		} catch (err) {
			setError(`Failed to update ${platform}`);
			// Revert the change on failure
			setSettings(prev => ({ ...prev, [platform]: !value }));
		}
	};

	// Handle status change
	const handleStatusChange = async (newStatus) => {
		setError(null);
		setSaveStatus(prev => ({ ...prev, status: "saving" }));
		
		try {
			const response = await updateCampaignSettings(campaign.id, "status", newStatus);
			if (response.status === 200) {
				setSettings(prev => ({ ...prev, status: newStatus }));
				onUpdate();
				setSaveStatus(prev => ({ ...prev, status: "saved" }));
				setTimeout(() => {
					setSaveStatus(prev => ({ ...prev, status: null }));
				}, 2000);
			} else {
				setError("Failed to update campaign status");
				setSaveStatus(prev => ({ ...prev, status: null }));
			}
		} catch (err) {
			setError("Failed to update campaign status");
			setSaveStatus(prev => ({ ...prev, status: null }));
		}
	};

	// Handle delete campaign
	const handleDeleteCampaign = async () => {
		try {
			const response = await updateCampaignSettings(campaign.id, "delete", true);
			if (response.status === 200) {
				window.location.href = "/team/campaigns";
			} else {
				setError("Failed to delete campaign");
			}
		} catch (err) {
			setError("Failed to delete campaign");
		}
	};

	// Handle image update
	const handleImageUpdate = async (base64Image) => {
		setError(null);
		setSaveStatus(prev => ({ ...prev, img: "saving" }));

		try {
			const response = await updateCampaignSettings(campaign.id, "img", base64Image);
			if (response.status === 200) {
				onUpdate();
				setSaveStatus(prev => ({ ...prev, img: "saved" }));
				setTimeout(() => {
					setSaveStatus(prev => ({ ...prev, img: null }));
				}, 2000);
			} else {
				setError("Failed to update campaign image");
				setSaveStatus(prev => ({ ...prev, img: null }));
			}
		} catch (err) {
			setError("Failed to update campaign image");
			setSaveStatus(prev => ({ ...prev, img: null }));
		}
	};

	// Render
	return (
		<div>
			{/* <h2 className={styles.settingsHeader}>Campaign Settings</h2> */}
			{error && (
				<div className={styles.error}>{error}</div>
			)}
			<div className={styles.settingsForm}>
				<div className={styles.formSection}>
					<div className={styles.formSectionHeader}>
						<label className={styles.formSectionLabel}>Assigned Creative Director</label>
					</div>
					{(campaign.creative_director) ? (
						<div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#fff", border: "1px solid var(--brd-light)", borderRadius: "8px" }}>
							{(campaign.creative_director.pfp) ? (
								<img
									src={campaign.creative_director.pfp}
									alt={campaign.creative_director.name}
									style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
								/>
							) : (
								<div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "#ddd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "600", color: "#666" }}>
									{campaign.creative_director.name.charAt(0).toUpperCase()}
								</div>
							)}
							<div style={{ flex: 1 }}>
								<div style={{ fontWeight: "500", fontSize: "15px" }}>{campaign.creative_director.name}</div>
							</div>
							<button
								type="button"
								onClick={() => setShowAssignDirectorModal(true)}
								className={styles.editButton}
								style={{ fontSize: "14px", fontWeight: "500", textDecoration: "underline", color: "var(--main-hl)", padding: "10px 12px", fontWeight: "500", fontSize: "15px", border: "none", borderRadius: "8px", cursor: "pointer" }}
							>
								Edit
							</button>
						</div>
					) : (
						<button
							type="button"
							onClick={() => setShowAssignDirectorModal(true)}
							className={styles.submitButton}
							style={{ width: "100%" }}
						>
							Assign Creative Director
						</button>
					)}
				</div>

				<div className={styles.formSection}>

					<div className={styles.formSectionHeader}>
						<label className={styles.formSectionLabel}>Campaign Name</label>
						<SaveIndicator status={saveStatus.name} />
					</div>
					<input
						type="text"
						value={settings.name}
						onChange={(e) => handleSettingChange("name", e.target.value)}
						className={styles.formInput}
					/>
				</div>

				<div className={styles.formSection}>
					<div className={styles.formSectionHeader}>
						<label className={styles.formSectionLabel}>Description</label>
						<SaveIndicator status={saveStatus.description} />
					</div>
					<textarea
						value={settings.description}
						onChange={(e) => handleSettingChange("description", e.target.value)}
						className={styles.formTextarea}
					/>
				</div>

				<div className={styles.formSection}>
					<div className={styles.formSectionHeader}>
						<label className={styles.formSectionLabel}>Campaign Image</label>
						<SaveIndicator status={saveStatus.img} />
					</div>
					<ImagePicker
						id="campaign-image-picker-settings"
						onUpdate={handleImageUpdate}
					/>
				</div>

				<div className={styles.formSection}>
					<div className={styles.formSectionHeader}>
						<label className={styles.formSectionLabel}>Campaign Dates</label>
					</div>
					<div style={{ display: "flex", gap: "30px" }}>
						<div style={{ flex: 1 }}>
							<label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
								Start Date
							</label>
							<input
								type="datetime-local"
								value={settings.start_date}
								onChange={(e) => handleSettingChange("start_date", e.target.value)}
								className={styles.formInput}
								style={{ width: "100%" }}
							/>
						</div>
						<div style={{ flex: 1 }}>
							<label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
								End Date
							</label>
							<input
								type="datetime-local"
								value={settings.end_date}
								onChange={(e) => handleSettingChange("end_date", e.target.value)}
								className={styles.formInput}
								style={{ width: "100%" }}
							/>
						</div>
					</div>
					{datesHaveChanged() && (
						<button 
							className={styles.saveButton} 
							onClick={handleSaveDates}
							disabled={savingDates}
						>
							{savingDates ? "Saving..." : "Save Date Changes"}
						</button>
					)}
				</div>

				<div className={styles.platformsSection}>
					<label className={styles.platformsLabel}>Platforms</label>
					<div className={styles.platformsList}>
						<button
							type="button"
							className={`${styles.platformButton} ${settings.supports_ig ? styles.platformButtonActive : ''}`}
							onClick={() => handlePlatformChange("supports_ig", !settings.supports_ig)}
						>
							{INSTAGRAM_ICON}Instagram
						</button>
						<button
							type="button"
							className={`${styles.platformButton} ${settings.supports_tt ? styles.platformButtonActive : ''}`}
							onClick={() => handlePlatformChange("supports_tt", !settings.supports_tt)}
						>
							{TIKTOK_ICON}TikTok
						</button>
					</div>
				</div>

				<div className={styles.formSection}>
					<div className={styles.formSectionHeader}>
						<label className={styles.formSectionLabel}>Campaign Status</label>
						<SaveIndicator status={saveStatus.status} />
					</div>
					<div className={styles.switchRow}>
						<label className={styles.switchLabel}>
							<input
								type="checkbox"
								checked={settings.status === "active"}
								onChange={e => handleStatusChange(e.target.checked ? "active" : "archive")}
								className={styles.switchInput}
							/>
							<span className={styles.switchSlider}></span>
						</label>
						<span className={styles.switchStateText}>
							{settings.status === "active" ? "Active" : "Archived"}
						</span>
					</div>
				</div>

				<div className={styles.dangerZone}>
					<h3 className={styles.dangerZoneTitle}>Danger Zone</h3>
					<button
						onClick={() => setShowDeleteConfirm(true)}
						className={styles.deleteButton}
					>
						Delete Campaign
					</button>
				</div>

				{/* Delete Confirmation Modal */}
				{showDeleteConfirm && (
					<div className={styles.modalOverlay}>
						<div className={styles.modalContent}>
							<h3 className={styles.modalTitle}>Delete Campaign</h3>
							<p className={styles.modalMessage}>
								Are you sure you want to delete this campaign? This action cannot be undone.
							</p>
							<div className={styles.modalActions}>
								<button
									onClick={() => setShowDeleteConfirm(false)}
									className={styles.cancelButton}
								>
									Cancel
								</button>
								<button
									onClick={handleDeleteCampaign}
									className={styles.deleteButton}
								>
									Delete
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Assign Creative Director Modal */}
				<AssignCreativeDirectorModal
					isOpen={showAssignDirectorModal}
					campaignId={campaign.id}
					currentDirectorId={campaign.creative_director?.id}
					onClose={() => setShowAssignDirectorModal(false)}
					onSuccess={onUpdate}
				/>
			</div>
		</div>
	);
}