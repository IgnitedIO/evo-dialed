import { useState, useEffect } from "react";
import { updateProfilePhone } from "../../../api/settings";
import styles from "../Settings.module.css";

export default function PhoneNumberModal({ isOpen, onClose, onSuccess, currentPhone, startInOptOutMode = false }) {
  const [formData, setFormData] = useState({
    phone: currentPhone || "",
    consent: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [optOut, setOptOut] = useState(startInOptOutMode);

  const isAddMode = !currentPhone;

  // Sync optOut state with prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setOptOut(startInOptOutMode);
    }
  }, [isOpen, startInOptOutMode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleOptOut = async () => {
    setLoading(true);
    setError(null);

    try {
      await updateProfilePhone("");
      onSuccess?.("Phone number removed successfully!");
      onClose();
    } catch (err) {
      setError(err.response?.data || "Failed to remove phone number");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateProfilePhone(formData.phone);

      // Reset form
      setFormData({
        phone: "",
        consent: false,
      });

      onSuccess?.(isAddMode ? "Phone number added successfully!" : "Phone number updated successfully!");
      onClose();
    } catch (err) {
      setError(err.response?.data || "Failed to update phone number");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        phone: currentPhone || "",
        consent: false,
      });
      setError(null);
      setOptOut(startInOptOutMode);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isAddMode ? "Add Phone Number" : "Update Phone Number"}
          </h2>
          <button
            onClick={handleClose}
            className={styles.modalCloseButton}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {!isAddMode && optOut ? (
          <div>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              We will immediately remove your phone number from Dialed and stop sending all notifications to your phone number.
            </p>
            <div className={styles.formActions}>
              <button
                type="button"
                onClick={handleClose}
                className={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleOptOut}
                className={styles.deleteButton}
                disabled={loading}
              >
                {loading ? "Removing..." : "Confirm"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <label className={styles.formSectionLabel}>
                  Phone Number <span style={{ color: 'var(--main-hl)' }}>*</span>
                </label>
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div className={styles.formSection}>
              <label
                className={`${styles.consentCheckbox} ${formData.consent ? styles.consentCheckboxActive : ''}`}
              >
                <input
                  type="checkbox"
                  name="consent"
                  checked={formData.consent}
                  onChange={handleInputChange}
                  style={{ marginTop: '4px' }}
                  required
                />
                <span className={styles.consentCheckboxText}>
                  I consent to receive notification messages to this phone number for creatives submitted to Dialed.
                </span>
              </label>
            </div>

            <div className={styles.formActions}>
              {!isAddMode && (
                <button
                  type="button"
                  onClick={() => setOptOut(true)}
                  className={styles.deleteButton}
                  disabled={loading}
                  style={{ marginRight: 'auto' }}
                >
                  Opt Out
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || !formData.consent}
              >
                {loading ? "Saving..." : isAddMode ? "Add Phone Number" : "Update Phone Number"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
