// Dependencies
import { useEffect, useState } from "react";
import Popup from 'reactjs-popup';

// API Imports
import { getCreativeDirectors, assignCreativeDirector, removeCreativeDirector } from "../../../../../api/internal";

// Component Imports
import LoadingCircle from "../../../../../ui/Components/LoadingCircle/LoadingCircle.jsx";

// Style Imports
import styles from "../Details.module.css";

// Assign Creative Director Modal Component
export default function AssignCreativeDirectorModal({
	isOpen,
	campaignId,
	currentDirectorId,
	onClose,
	onSuccess
}) {
	// States
	const [availableDirectors, setAvailableDirectors] = useState([]);
	const [selectedDirectorId, setSelectedDirectorId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	// Load creative directors
	const loadCreativeDirectors = async () => {
		try {
			const response = await getCreativeDirectors();
			if (response.status === 200) {
				setAvailableDirectors(response.data.data);
			} else {
				setError("Failed to load creative directors");
			}
		} catch (err) {
			setError("Error loading creative directors");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isOpen) {
			loadCreativeDirectors();
			setSelectedDirectorId(currentDirectorId || null);
			setError(null);
		}
	}, [isOpen, campaignId, currentDirectorId]);

	// Handle director select
	const handleDirectorSelect = (directorId) => {
		if (selectedDirectorId === directorId) {
			// Deselect if clicking the same director
			setSelectedDirectorId(null);
		} else {
			setSelectedDirectorId(directorId);
		}
	};

	// Determine button text and action
	const getButtonConfig = () => {
		if (!currentDirectorId && selectedDirectorId) {
			return { text: "Assign", action: "assign" };
		} else if (currentDirectorId && !selectedDirectorId) {
			return { text: "Remove", action: "remove" };
		} else if (currentDirectorId && selectedDirectorId && currentDirectorId !== selectedDirectorId) {
			return { text: "Update", action: "update" };
		}
		return { text: "Assign", action: null, disabled: true };
	};

	// Handle submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		setSubmitting(true);
		setError(null);

		try {
			const buttonConfig = getButtonConfig();

			if (buttonConfig.action === "remove") {
				// Remove the creative director
				const response = await removeCreativeDirector(campaignId);
				if (response.status === 200) {
					onSuccess();
					onClose();
				} else {
					setError("Failed to remove creative director");
				}
			} else if (buttonConfig.action === "assign" || buttonConfig.action === "update") {
				// Assign or update the creative director
				const response = await assignCreativeDirector(campaignId, selectedDirectorId);
				if (response.status === 200) {
					onSuccess();
					onClose();
				} else {
					setError(response.data?.message || "Failed to assign creative director");
				}
			}
		} catch (err) {
			setError(err.response?.data?.message || "Error updating creative director");
		} finally {
			setSubmitting(false);
		}
	};

	const buttonConfig = getButtonConfig();

	return (
		<Popup
			open={isOpen}
			onClose={onClose}
			modal
			closeOnDocumentClick={false}
		>
			<div className={styles.modalContent}>
				<h3 className={styles.modalTitle}>Assign Creative Director</h3>
				{error && (
					<div className={styles.error}>{error}</div>
				)}
				<form onSubmit={handleSubmit} className={styles.addLinkForm}>
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
							{availableDirectors.map((director, index) => (
								<div
									key={director.id}
									onClick={() => handleDirectorSelect(director.id)}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "16px",
										padding: "16px",
										border: "1px solid var(--brd-light)",
										borderRadius: "5px",
										cursor: "pointer",
										background: "white",
										marginBottom: index === availableDirectors.length - 1 ? "15px" : "0",
										transition: "background-color 0.2s ease",
										width: "100%"
									}}
								>
									<div style={{
										display: "flex",
										alignItems: "center",
										gap: "12px",
										flex: 1
									}}>
										{director.pfp ? (
											<img
												src={director.pfp}
												alt={director.name}
												style={{
													width: "30px",
													height: "30px",
													borderRadius: "50%",
													objectFit: "cover"
												}}
											/>
										) : (
											<div style={{
												width: "30px",
												height: "30px",
												borderRadius: "50%",
												background: "#ddd",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontWeight: "600",
												color: "#666",
												fontSize: "14px"
											}}>
												{director.name.charAt(0).toUpperCase()}
											</div>
										)}
										<div>
											<div style={{
												fontFamily: "Geist",
												fontSize: "15px",
												fontWeight: "500",
												margin: 0,
												color: "#212529"
											}}>
												{director.name}
											</div>
											{currentDirectorId === director.id && (
												<div style={{
													fontFamily: "Geist",
													fontSize: "12px",
													color: "var(--main-hl)",
													margin: 0,
													lineHeight: "1.4"
												}}>
													Currently assigned
												</div>
											)}
										</div>
									</div>

									<div style={{
										width: "20px",
										height: "20px",
										border: "1px solid var(--brd-light)",
										borderRadius: "4px",
										background: selectedDirectorId === director.id ? "var(--main-hl)" : "white",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										color: "white",
										flexShrink: 0
									}}>
										{selectedDirectorId === director.id && "✓"}
									</div>
								</div>
							))}
							{availableDirectors.length === 0 && (
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
									No creative directors available
								</div>
							)}
						</div>
					)}
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
							disabled={submitting || buttonConfig.disabled}
							style={{
								opacity: buttonConfig.disabled ? 0.5 : 1,
								cursor: buttonConfig.disabled ? "not-allowed" : "pointer"
							}}
						>
							{submitting ? "Updating..." : buttonConfig.text}
						</button>
					</div>
				</form>
			</div>
		</Popup>
	);
}
