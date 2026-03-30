// Dependencies
import { useEffect, useState } from "react";
import Popup from 'reactjs-popup';

// API Imports
import { bulkAssignCreators, getCreatorPreview } from "../../../../../api/internal";

// Style Imports
import styles from "../Details.module.css";
import dashboardStyles from "../../../../Clients/Dashboard/Dashboard.module.css";

// Component Imports
import CreatorSelector from "./CreatorSelector";

// Icon Imports
import { 
	INSTAGRAM_ICON, 
	TIKTOK_ICON,
	PLUS_ICON,
	TRASH_ICON,
	EDIT_ICON
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

// Add Creators Modal Component
export default function AddCreatorsModal({
	isOpen,
	campaignId,
	campaign,
	onClose,
	onSuccess
}) {
	// States
	const [selectedCreator, setSelectedCreator] = useState(null);
	const [accounts, setAccounts] = useState([]);
	const [currentPage, setCurrentPage] = useState(0);
	const [editingAccountIndex, setEditingAccountIndex] = useState(null);
	const [currentAccount, setCurrentAccount] = useState({ handle: "", platform: "", num_posts: 1, frequency: "daily" });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [previewData, setPreviewData] = useState(null);
	const [previewLoading, setPreviewLoading] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setSelectedCreator(null);
			setAccounts([]);
			setCurrentPage(0);
			setEditingAccountIndex(null);
			setCurrentAccount({ handle: "", platform: "", num_posts: 1, frequency: "daily" });
			setPreviewData(null);
			setPreviewLoading(false);
		}
	}, [isOpen]);

	// Handle account changes
	const handleAccountChange = (field, value) => {
		if (field === "handle") value = value.replace(/@/g, ""); // Remove all @ symbols from handle
		setCurrentAccount(prev => ({ ...prev, [field]: value }));
	};

	// Add/Update account
	const handleSaveAccount = async () => {
		if (!currentAccount.handle || !currentAccount.platform || currentAccount.num_posts < 1) {
			setError("Please fill in all account details");
			return;
		}

		// If editing, directly update without preview
		if (editingAccountIndex !== null) {
			setAccounts(prev => {
				const newAccounts = [...prev];
				newAccounts[editingAccountIndex] = currentAccount;
				return newAccounts;
			});

			// Reset and go back to main page
			setCurrentAccount({ handle: "", platform: "", num_posts: 1, frequency: "daily" });
			setEditingAccountIndex(null);
			setCurrentPage(0);
			return;
		}

		setPreviewLoading(true);
		setError(null);
		
		try {
			const response = await getCreatorPreview(currentAccount.handle, currentAccount.platform);
			if (response.status === 200) {
				setPreviewData(response.data.data);
				setCurrentPage(2); // Go to preview page
			} else {
				setError("Failed to fetch account preview");
			}
		} catch (err) {
			setError("Error fetching account preview");
		} finally {
			setPreviewLoading(false);
		}
	};

	// Confirm preview and add account
	const confirmPreview = () => {
		setAccounts(prev => [...prev, currentAccount]);

		// Reset and go back to main page
		setCurrentAccount({ handle: "", platform: "", num_posts: 1, frequency: "daily" });
		setEditingAccountIndex(null);
		setPreviewData(null);
		setCurrentPage(0);
	};

	// Reject preview and go back to form
	const rejectPreview = () => {
		setPreviewData(null);
		setCurrentPage(1);
	};

	// Remove account
	const removeAccount = (index) => {
		setAccounts(prev => prev.filter((_, i) => i !== index));
	};

	// Edit account
	const editAccount = (index) => {
		setCurrentAccount(accounts[index]);
		setEditingAccountIndex(index);
		setCurrentPage(1);
		setPreviewData(null); // Clear any existing preview data
	};

	// Add new account
	const addNewAccount = () => {
		setCurrentAccount({ handle: "", platform: "", num_posts: 1, frequency: "daily" });
		setEditingAccountIndex(null);
		setCurrentPage(1);
	};

	// Handle submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!selectedCreator) {
			setError("Please select a creator");
			return;
		}

		if (accounts.length === 0) {
			setError("Please add at least one account");
			return;
		}

		setSubmitting(true);
		try {
			const assignments = accounts.map(account => ({
				creator_id: selectedCreator.id,
				handle: account.handle,
				platform: account.platform,
				num_posts: account.num_posts,
				frequency: account.frequency
			}));

			const response = await bulkAssignCreators(campaignId, assignments);
			if (response.status === 200) {
				onSuccess();
				onClose();
			} else {
				setError("Failed to assign creator");
			}
		} catch (err) {
			setError("Error assigning creator");
		} finally {
			setSubmitting(false);
		}
	};

	// Get allowed platforms for this campaign
	const allowedPlatforms = [
		...(campaign?.supports_ig ? [{ value: "instagram", label: "Instagram", icon: INSTAGRAM_ICON }] : []),
		...(campaign?.supports_tt ? [{ value: "tiktok", label: "TikTok", icon: TIKTOK_ICON }] : [])
	];

	// Render main page (page 0)
	const renderMainPage = () => (
		<>
			<h3 className={styles.modalTitle}>Add Creator Accounts</h3>
			{error && (
				<div className={styles.error}>{error}</div>
			)}
			<form onSubmit={handleSubmit} className={styles.addLinkForm}>
				{/* Creator Selection */}
				<div className={styles.formGroup}>
					<label className={styles.formLabel}>Creator *</label>
					<CreatorSelector
						selectedCreator={selectedCreator}
						onCreatorSelect={setSelectedCreator}
					/>
				</div>

				{/* Accounts List */}
				<div className={styles.formGroup}>
					<label className={styles.formLabel}>Accounts</label>
					<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
						{accounts.map((account, index) => (
							<div 
								key={index}
								style={{
									padding: "12px 16px",
									border: "1px solid var(--brd-light)",
									borderRadius: "8px",
									background: "white",
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between"
								}}
							>
								<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
									<div style={{ 
										display: "flex", 
										alignItems: "center", 
										gap: "8px",
										// minWidth: "120px"
									}}>
										{getPlatformIcons({ [account.platform]: true })}
										<span style={{ 
											fontFamily: "Geist",
											fontSize: "14px",
											color: "#495057"
										}}>
											@{account.handle}
										</span>
									</div>
									<div style={{ 
										fontFamily: "Geist",
										display: "flex", 
										alignItems: "center", 
										gap: "8px",
										color: "#667",
										fontSize: "14px"
									}}>
										<span>{account.num_posts} {account.num_posts === 1 ? "post" : "posts"}</span>
										<span>•</span>
										<span style={{ textTransform: "capitalize" }}>{account.frequency}</span>
									</div>
								</div>
								<div style={{ display: "flex", gap: "8px" }}>
									<button
										type="button"
										onClick={() => editAccount(index)}
										style={{
											background: "none",
											border: "none",
											color: "#495057",
											cursor: "pointer",
											padding: "4px"
										}}
									>
										{EDIT_ICON}
									</button>
									<button
										type="button"
										onClick={() => removeAccount(index)}
										style={{
											background: "none",
											border: "none",
											color: "#dc3545",
											cursor: "pointer",
											padding: "4px"
										}}
									>
										{TRASH_ICON}
									</button>
								</div>
							</div>
						))}

						<button
							type="button"
							onClick={addNewAccount}
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "8px",
								padding: "12px",
								background: "white",
								border: "1px dashed var(--brd-light)",
								borderRadius: "8px",
								color: "#495057",
								cursor: "pointer",
								width: "100%",
								fontFamily: "Geist"
							}}
						>
							{PLUS_ICON}
							Add Account
						</button>
					</div>
				</div>

				<div className={styles.modalActions}>
					<button
						type="button"
						onClick={onClose}
						className={styles.cancelButton}
						disabled={submitting}
					>
						Cancel
					</button>
					<button
						type="submit"
						className={styles.submitButton}
						disabled={submitting}
					>
						{submitting ? "Adding..." : "Add Creator"}
					</button>
				</div>
			</form>
		</>
	);

	// Render account form page (page 1)
	const renderAccountForm = () => (
		<>
			<h3 className={styles.modalTitle}>
				{editingAccountIndex !== null ? "Edit Account" : "Add Account"}
			</h3>
			{error && (
				<div className={styles.error}>{error}</div>
			)}
			<form onSubmit={(e) => {
				e.preventDefault();
				handleSaveAccount();
			}} className={styles.addLinkForm}>
				<div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
					<div style={{ flex: 1 }}>
						<label className={styles.formLabel}>Handle *</label>
						<input
							type="text"
							value={currentAccount.handle}
							onChange={(e) => handleAccountChange("handle", e.target.value)}
							required
							className={styles.formInput}
							placeholder="username"
						/>
					</div>
					<div style={{ flex: 1 }}>
						<label className={styles.formLabel}>Platform *</label>
						<select
							value={currentAccount.platform}
							onChange={(e) => handleAccountChange("platform", e.target.value)}
							required
							className={styles.formInput}
						>
							<option value="">Select platform...</option>
							{allowedPlatforms.map(platform => (
								<option key={platform.value} value={platform.value}>
									{platform.label}
								</option>
							))}
						</select>
					</div>
				</div>

				<div style={{ display: "flex", gap: "12px" }}>
					<div style={{ flex: 1 }}>
						<label className={styles.formLabel}>Posts *</label>
						<input
							type="number"
							min="1"
							value={currentAccount.num_posts}
							onChange={(e) => handleAccountChange("num_posts", parseInt(e.target.value) || 1)}
							required
							className={styles.formInput}
						/>
					</div>
					<div style={{ flex: 1 }}>
						<label className={styles.formLabel}>Frequency *</label>
						<select
							value={currentAccount.frequency}
							onChange={(e) => handleAccountChange("frequency", e.target.value)}
							required
							className={styles.formInput}
						>
							<option value="daily">Daily</option>
							<option value="weekly">Weekly</option>
							<option value="monthly">Monthly</option>
						</select>
					</div>
				</div>

				<div className={styles.modalActions}>
					<button
						type="button"
						onClick={() => {
							setCurrentPage(0);
							setEditingAccountIndex(null);
							setCurrentAccount({ handle: "", platform: "", num_posts: 1, frequency: "daily" });
						}}
						className={styles.cancelButton}
					>
						← Back
					</button>
					<button
						type="submit"
						className={styles.submitButton}
						disabled={previewLoading}
					>
						{previewLoading ? "Loading..." : (editingAccountIndex !== null ? "Save Changes" : "Preview Account")}
					</button>
				</div>
			</form>
		</>
	);

	// Render preview page (page 2)
	const renderPreviewPage = () => (
		<>
			<h3 className={styles.modalTitle}>Is this the right account?</h3>
			{error && (
				<div className={styles.error}>{error}</div>
			)}
			{previewData && (
				<div style={{
					padding: "25px",
					border: "1px solid var(--brd-light)",
					borderRadius: "12px",
					background: "white",
					marginBottom: "20px"
				}}>
					<div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
						<img 
							src={previewData.pfp ?? "/defaults/u.webp"} 
							alt="Profile" 
							style={{
								width: "60px",
								height: "60px",
								borderRadius: "50%",
								objectFit: "cover"
							}}
						/>
						<div>
							<div style={{
								fontFamily: "Geist",
								fontSize: "18px",
								fontWeight: "600",
								color: "#212529",
								marginBottom: "2px"
							}}>
								{previewData.display_name || `@${previewData.handle}`}
							</div>
							<div style={{
								fontFamily: "Geist",
								fontSize: "15px",
								color: "#6c757d",
								display: "flex",
								alignItems: "center",
								gap: "4px"
							}}>
								{getPlatformIcons({ [previewData.platform]: true })}
								<span>@{previewData.handle}</span>
								{/* {previewData.is_private && (
									<span style={{ color: "#dc3545" }}>• Private</span>
								)} */}
							</div>
						</div>
					</div>

					{previewData.bio && (
						<div style={{
							fontFamily: "Geist",
							fontSize: "15px",
							color: "#495057",
							marginBottom: "16px",
							lineHeight: "1.5",
							whiteSpace: "pre-wrap"
						}}>
							{previewData.bio}
						</div>
					)}

					<div style={{
						display: "flex",
						gap: "24px",
						padding: "16px",
						background: "#f8f9fa",
						borderRadius: "8px"
					}}>
						<div>
							<div style={{
								fontFamily: "Geist",
								fontSize: "20px",
								fontWeight: "600",
								color: "#212529"
							}}>
								{previewData.num_posts?.toLocaleString() || "N/A"}
							</div>
							<div style={{
								fontFamily: "Geist",
								fontSize: "12px",
								color: "#6c757d",
								textTransform: "uppercase"
							}}>
								Posts
							</div>
						</div>
						<div>
							<div style={{
								fontFamily: "Geist",
								fontSize: "20px",
								fontWeight: "600",
								color: "#212529"
							}}>
								{previewData.followers?.toLocaleString() || "N/A"}
							</div>
							<div style={{
								fontFamily: "Geist",
								fontSize: "12px",
								color: "#6c757d",
								textTransform: "uppercase"
							}}>
								Followers
							</div>
						</div>
						<div>
							<div style={{
								fontFamily: "Geist",
								fontSize: "20px",
								fontWeight: "600",
								color: "#212529"
							}}>
								{previewData.following?.toLocaleString() || "N/A"}
							</div>
							<div style={{
								fontFamily: "Geist",
								fontSize: "12px",
								color: "#6c757d",
								textTransform: "uppercase"
							}}>
								Following
							</div>
						</div>
					</div>
				</div>
			)}

			<div className={styles.modalActions}>
				<button
					type="button"
					onClick={rejectPreview}
					className={styles.cancelButton}
				>
					Back
				</button>
				<button
					type="button"
					onClick={confirmPreview}
					className={styles.submitButton}
				>
					Yes, continue
				</button>
			</div>
		</>
	);

	return (
		<Popup
			open={isOpen}
			onClose={onClose}
			modal
			closeOnDocumentClick={false}
		>
			<div className={styles.modalContent}>
				{currentPage === 0 ? renderMainPage() : currentPage === 1 ? renderAccountForm() : renderPreviewPage()}
			</div>
		</Popup>
	);
}