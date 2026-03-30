import { useState } from "react";
import { inviteAdmin } from "../../../api/internal";
import styles from "../Settings.module.css";

export default function AdminInviteModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await inviteAdmin(
        formData.email,
        formData.password,
        formData.displayName,
        null
      );

      // Reset form
      setFormData({
        email: "",
        password: "",
        displayName: "",
      });

      onSuccess?.("Admin account created successfully!");
      onClose();
    } catch (err) {
      setError(err.response?.data || "Failed to create admin account");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        email: "",
        password: "",
        displayName: "",
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Invite Admin User</h2>
          <button
            onClick={handleClose}
            className={styles.modalCloseButton}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formSection}>
            <div className={styles.formSectionHeader}>
              <label className={styles.formSectionLabel}>Name *</label>
            </div>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter name"
              required
            />
          </div>

          <div className={styles.formSection}>
            <div className={styles.formSectionHeader}>
              <label className={styles.formSectionLabel}>Email Address *</label>
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className={styles.formSection}>
            <div className={styles.formSectionHeader}>
              <label className={styles.formSectionLabel}>Password *</label>
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Enter password"
              required
              minLength={8}
            />
          </div>

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
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Admin Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
