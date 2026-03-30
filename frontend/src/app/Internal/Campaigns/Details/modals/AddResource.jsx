// Dependencies
import { useState } from "react";
import Popup from 'reactjs-popup';

// Style Imports
import styles from "../Details.module.css";

// Add Link Modal Component
export default function AddLinkModal({
	isOpen,
	onClose,
	onAddLink
}) {
	// States
	const [newLink, setNewLink] = useState({ url: "", title: "", description: "" });
	const [error, setError] = useState(null);

	// Handle submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const response = await onAddLink(newLink);
			if (response.status === 200) {
				setNewLink({ url: "", title: "", description: "" });
				onClose();
			}
		} catch (err) {
			setError("Failed to add link");
		}
	};

	// Render
	return (
		<Popup
			open={isOpen}
			onClose={onClose}
			modal
			closeOnDocumentClick={false}
		>
			<div className={styles.modalContent}>
				<h3 className={styles.modalTitle}>Add New Link</h3>
				{error && (
					<div className={styles.error}>{error}</div>
				)}
				<form onSubmit={handleSubmit} className={styles.addLinkForm}>
					<div className={styles.formGroup}>
						<label className={styles.formLabel}>URL *</label>
						<input
							type="url"
							value={newLink.url}
							onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
							required
							className={styles.formInput}
						/>
					</div>
					<div className={styles.formGroup}>
						<label className={styles.formLabel}>Title *</label>
						<input
							type="text"
							value={newLink.title}
							onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
							required
							className={styles.formInput}
						/>
					</div>
					<div className={styles.formGroup}>
						<label className={styles.formLabel}>Description</label>
						<textarea
							value={newLink.description}
							onChange={(e) => setNewLink(prev => ({ ...prev, description: e.target.value }))}
							className={styles.formTextarea}
						/>
					</div>
					<div className={styles.modalActions}>
						<button
							type="button"
							onClick={onClose}
							className={styles.cancelButton}
						>
							Cancel
						</button>
						<button
							type="submit"
							className={styles.submitButton}
						>
							Add Link
						</button>
					</div>
				</form>
			</div>
		</Popup>
	);
};