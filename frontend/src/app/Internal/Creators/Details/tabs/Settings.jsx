// Dependencies
import { useState, useEffect } from 'react';

// API Imports
import {
	getCreatorConnectedAccounts,
	kickCreator,
	sendCreatorInviteEmail,
	updateCreatorDetails,
} from "../../../../../api/internal";

// Component Imports
import FieldEditor from "../../Components/FieldEditor";
import LoadingCircle from "../../../../../ui/Components/LoadingCircle/LoadingCircle.jsx";

// Hook Imports
import { useFieldEditor } from "../hooks/useFieldEditor";

// Style Imports
import styles from "../Details.module.css";

// Icon Imports
import { INSTAGRAM_ICON, TIKTOK_ICON } from "../../../../../assets/icons/svg.jsx";

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

// Creator Settings Tab
export const SettingsTab = ({
	creator,
	onUpdate
}) => {
	// States
	const [error, setError] = useState(null);
	const [connectedAccounts, setConnectedAccounts] = useState([]);
	const [loadingAccounts, setLoadingAccounts] = useState(true);

	// Modal States
	const [showInviteConfirm, setShowInviteConfirm] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	
	// Use custom hook for field editing
	const {
		editingField,
		fieldValues,
		validationErrors,
		saving,
		handleEdit,
		handleCancel,
		handleValueChange,
		handleSave,
		validateEmail,
		validateName
	} = useFieldEditor(creator, onUpdate);

	// Load connected accounts
	const loadConnectedAccounts = async () => {
		try {
			const response = await getCreatorConnectedAccounts(creator.id);
			if (response.status === 200) setConnectedAccounts(response.data.data);
			else setError("Failed to load connected accounts");
		} catch (err) {
			setError("Error loading connected accounts");
		} finally {
			setLoadingAccounts(false);
		}
	};
	useEffect(() => {
		loadConnectedAccounts();
	}, [creator.id]);

	// Handle invite creator
	const handleInviteCreator = async () => {
		try {
			const response = await sendCreatorInviteEmail(creator.id);
			if (response.status === 200) setShowInviteConfirm(false);
			else setError("Failed to send invite email");
		} catch (err) {
			setError("Error sending invite email");
		}
	};

	// Handle remove creator
	const handleKickCreator = async () => {
		try {
			const response = await kickCreator(creator.id);
			if (response.status === 200) {
				window.location.href = "/team/creators";
			} else {
				setError("Failed to remove creator");
			}
		} catch (err) {
			setError("Error removing creator");
		}
	};

	// Render settings form
	return (
		<div>
			{error && (
				<div className={styles.error}>{error}</div>
			)}

			<div className={styles.settingsForm}>
				<div className={styles.formSection}>
					<FieldEditor
						fieldName="email"
						label="Email"
						currentValue={creator.email}
						type="email"
						placeholder="Enter email address"
						validator={validateEmail}
						updateFunction={updateCreatorDetails}
						emptyMessage="No email set"
						isEditing={editingField === "email"}
						fieldValue={fieldValues.email}
						validationError={validationErrors.email}
						saving={saving}
						onEdit={handleEdit}
						onCancel={handleCancel}
						onSave={handleSave}
						onValueChange={handleValueChange}
					/>
				</div>

				<div className={styles.formSection}>
					<FieldEditor
						fieldName="name"
						label="Name"
						currentValue={creator.name}
						type="text"
						placeholder="Enter creator name"
						validator={validateName}
						updateFunction={updateCreatorDetails}
						emptyMessage="No name set"
						isEditing={editingField === "name"}
						fieldValue={fieldValues.name}
						validationError={validationErrors.name}
						saving={saving}
						onEdit={handleEdit}
						onCancel={handleCancel}
						onSave={handleSave}
						onValueChange={handleValueChange}
					/>
				</div>

				<div className={styles.formSection}>
					<FieldEditor
						fieldName="phone"
						label="Phone"
						currentValue={creator.phone}
						type="tel"
						placeholder="Enter phone number"
						updateFunction={updateCreatorDetails}
						emptyMessage="No phone set"
						isEditing={editingField === "phone"}
						fieldValue={fieldValues.phone}
						validationError={validationErrors.phone}
						saving={saving}
						onEdit={handleEdit}
						onCancel={handleCancel}
						onSave={handleSave}
						onValueChange={handleValueChange}
					/>
				</div>

				<div className={styles.formSection}>
					<div className={styles.formSectionHeader}>
						<label className={styles.formSectionLabel}>Joined</label>
					</div>
					<div className={styles.descriptionText}>
						{formatDate(creator.created_ts)}
					</div>
				</div>

				{/* Connected Accounts Section */}
				<div className={styles.formSection}>
					<div className={styles.formSectionHeader}>
						<label className={styles.formSectionLabel}>Socials</label>
					</div>
					{loadingAccounts ? (
						<div className={styles.descriptionText}>
							<LoadingCircle />
						</div>
					) : connectedAccounts.length > 0 ? (
						<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
							{connectedAccounts.map((account) => (
								<div 
									key={account.id}
									className={styles.descriptionText}
									style={{ margin: 0 }}
								>
									<div style={{
										display: "flex",
										alignItems: "center",
										gap: "16px"
									}}>
										<img 
											src={(account.profile_picture) ? account.profile_picture : "/defaults/u.webp"} 
											alt={account.display_name}
											style={{
												width: "50px",
												height: "50px",
												borderRadius: "50%",
												border: "1px solid var(--brd-light)",
												objectFit: "cover"
											}}
										/>
										<div>
											<div style={{ fontWeight: "bold", fontSize: "16px" }}>
												{account.display_name}
											</div>
											<div style={{ fontSize: "15px", color: "#667", display: "flex", gap: "4px" }}>
												{account.username}&nbsp;&nbsp;•&nbsp;&nbsp;{<>
													{(account.platform_name === "Instagram") &&
														<>{INSTAGRAM_ICON} Instagram</>
													}
													{(account.platform_name === "TikTok") &&
														<>{TIKTOK_ICON} TikTok</>
													}
												</>}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className={styles.descriptionText}>
							<div style={{ color: "#667" }}>
								No socials connected yet.
							</div>
						</div>
					)}
				</div>

				{/* Actions */}
				<div className={styles.actions}>
					<h3 className={styles.actionsTitle}>Actions</h3>
					<button
						onClick={() => setShowInviteConfirm(true)}
						className={styles.inviteButton}
					>
						Send Invite Email
					</button>
				</div>

				{/* Danger Zone */}
				<div className={styles.dangerZone}>
					<h3 className={styles.dangerZoneTitle}>Danger Zone</h3>
					<button
						onClick={() => setShowDeleteConfirm(true)}
						className={styles.deleteButton}
					>
						Remove Creator
					</button>
				</div>

				{/* Invite Confirmation Modal */}
				{showInviteConfirm && (
					<div className={styles.modalOverlay}>
						<div className={styles.modalContent}>
							<h3 className={styles.modalTitle}>Invite Creator</h3>
							<p className={styles.modalMessage}>
								Are you sure you want to send this creator an invite email to Dialed?
							</p>
							<div className={styles.modalActions}>
								<button
									onClick={() => setShowInviteConfirm(false)}
									className={styles.cancelButton}
								>
									Cancel
								</button>
								<button
									onClick={handleInviteCreator}
									className={styles.submitButton}
								>
									Yes, send
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Delete Confirmation Modal */}
				{showDeleteConfirm && (
					<div className={styles.modalOverlay}>
						<div className={styles.modalContent}>
							<h3 className={styles.modalTitle}>Remove Creator</h3>
							<p className={styles.modalMessage}>
								Are you sure you want to remove this creator from Dialed? This action cannot be undone. All creator data will be permanently deleted.
							</p>
							<div className={styles.modalActions}>
								<button
									onClick={() => setShowDeleteConfirm(false)}
									className={styles.cancelButton}
								>
									Cancel
								</button>
								<button
									onClick={handleKickCreator}
									className={styles.deleteButton}
								>
									Yes, remove
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};