// Dependencies
import React from 'react';
import Popup from 'reactjs-popup';

// Icon Imports
import { CHECK_ICON } from "../../../assets/icons/svg.jsx";

// Style Imports
import styles from './shareLinkModal.module.css';

// Share Link Modal Component
const ShareLinkModal = ({
    isOpen,
    onClose,
    shareLink,
    copied,
    onCopyLink
}) => {
    return (
        <Popup
            open={isOpen}
            onClose={onClose}
            modal
            closeOnDocumentClick={false}
        >
            <div className={styles.modalContent}>
                <h3 className={styles.modalTitle}>Share Metrics</h3>
                
                <div className={styles.addLinkForm}>
                    <p className={styles.modalDescription}>
                        Anyone with this link can view this campaign's metrics:
                    </p>

                    <div className={styles.linkDisplay}>
                        {shareLink || 'Loading...'}
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
                            type="button"
                            onClick={onCopyLink}
                            className={styles.submitButton}
                        >
                            {(copied) ? <>
                                {CHECK_ICON}
                                Copied!
                            </> : <>
                                Copy Link
                            </>}
                        </button>
                    </div>
                </div>
            </div>
        </Popup>
    );
};

export default ShareLinkModal;