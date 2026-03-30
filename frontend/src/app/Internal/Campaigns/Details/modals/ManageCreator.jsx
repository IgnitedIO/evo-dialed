// Dependencies
import { useState, useEffect } from "react";
import Popup from 'reactjs-popup';

// API Imports
import { bulkAssignCreators, removeCreatorFromCampaign, reassignCreatorHandle } from "../../../../../api/internal";

// Component Imports
import CreatorSelector from "./CreatorSelector";

// Style Imports
import styles from "../Details.module.css";
import creatorModalStyles from "../../CreatorModals.module.css";

// Manage Creator Modal Component
export default function ManageCreatorModal({
	isOpen,
	onClose,
	creator,
	campaignId,
	onSuccess
}) {
	// States
	const [numPosts, setNumPosts] = useState(creator?.num_posts || 1);
	const [error, setError] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [removing, setRemoving] = useState(false);
	const [selectedNewCreator, setSelectedNewCreator] = useState(null);

	useEffect(() => {
		setSelectedNewCreator({
			id: creator?.creator?.id,
			name: creator?.creator?.name
		});

		setNumPosts(creator?.num_posts || 1);
	}, [creator]);

	// Handle submit
	const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (selectedNewCreator && selectedNewCreator.id !== creator.creator?.id) {
        const reassignResponse = await reassignCreatorHandle(
          creator.account?.handle,
          selectedNewCreator.id
        );
        if (reassignResponse.status !== 200) {
          setError("Failed to reassign creator handle");
          return;
        }
      }

      		// Update the post count assignment
		const response = await bulkAssignCreators(campaignId, [
			{
				creator_id: selectedNewCreator ? selectedNewCreator.id : creator?.creator?.id,
				handle: creator?.account?.handle,
				platform: creator?.account?.platform === 'ig' ? 'instagram' : 'tiktok',
				num_posts: numPosts,
				frequency: creator?.frequency || 'daily'
			},
		]);

		if (response.status === 200) {
			const updatedCreator = {
				...creator,
				creator: selectedNewCreator,
				num_posts: numPosts
			};
			onSuccess(updatedCreator);
			onClose();
		} else {
			setError("Failed to update creator assignment");
		}
    } catch (err) {
      setError("Error updating creator assignment");
    } finally {
      setSubmitting(false);
    }
  };

	// Handle remove
	const handleRemove = async () => {
		if (!window.confirm("Are you sure you want to remove this creator from the campaign? This action cannot be undone.")) {
			return;
		}

		setRemoving(true);
		try {
			const response = await removeCreatorFromCampaign(campaignId, creator.creator.id, creator.id);
			if (response.status === 200) {
				onSuccess();
				onClose();
			} else {
				setError("Failed to remove creator from campaign");
			}
		} catch (err) {
			setError("Error removing creator from campaign");
		} finally {
			setRemoving(false);
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
				<h3 className={styles.modalTitle}>Manage Creator</h3>
				{error && (
					<div className={styles.error}>{error}</div>
				)}
				<form onSubmit={handleSubmit} className={styles.addLinkForm}>
					<div className={styles.formGroup}>
						<label className={styles.formLabel}># of Posts</label>
						<input
							type="number"
							min="1"
							value={numPosts}
							onChange={(e) => setNumPosts(Math.max(1, parseInt(e.target.value) || 1))}
							className={styles.formInput}
						/>
					</div>

					<div className={creatorModalStyles.reassignSection}>
						<h4 className={creatorModalStyles.reassignHeader}>
							Reassign Handle
						</h4>
						<p className={creatorModalStyles.reassignDescription}>
							Reassign this handle to a different creator. This will update all associated submissions and campaign data.
						</p>
						<div className={creatorModalStyles.reassignForm}>
							<div className={styles.formGroup}>
								<label className={styles.formLabel}>New Creator</label>
								<CreatorSelector
									selectedCreator={selectedNewCreator}
									onCreatorSelect={setSelectedNewCreator}
									placeholder="Select a new creator (optional)..."
								/>
							</div>
						</div>
					</div>

					<div className={creatorModalStyles.removeSection}>
						<h4 className={creatorModalStyles.removeHeader}>
							Remove from Campaign
						</h4>
						<p className={creatorModalStyles.removeDescription}>
							Removing from campaign will delete all associated data including submission tracking.
						</p>
						<button
							type="button"
							onClick={handleRemove}
							disabled={removing}
							className={creatorModalStyles.removeButton}
						>
							{removing ? "Removing..." : "Continue"}
						</button>
					</div>

					<div className={styles.modalActions}>
						<button
							type="button"
							onClick={onClose}
							className={styles.cancelButton}
							disabled={submitting || removing}
						>
							Cancel
						</button>
						<button
							type="submit"
							className={styles.submitButton}
							disabled={submitting || removing}
						>
							{submitting ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</form>
			</div>
		</Popup>
	);
};
