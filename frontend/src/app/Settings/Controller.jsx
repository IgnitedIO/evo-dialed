// Dependencies
import { useState, useEffect } from "react";

// Context Imports
import { useUsersContext } from "../../context/useUsersContext.js";

// API Imports
import { getProfileDetails, updateProfileEmail, updateProfileName, updateProfileLogo, updateProfilePhone } from "../../api/settings";
import { logoutUser } from "../../api/auth";

// Utility Imports
import { compressImage } from "../../utils/imageCompression.js";

// Component Imports
import LoadingCircleScreen from "../../ui/Components/LoadingCircle/LoadingCircleScreen.jsx";
import AdminInviteModal from "./components/AdminInviteModal.jsx";
import PhoneNumberModal from "./components/PhoneNumberModal.jsx";

// Style Imports
import styles from "./Settings.module.css";

// Settings Controller
export default function SettingsController() {
  const { user } = useUsersContext();

  // States
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneModalOptOutMode, setPhoneModalOptOutMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    pfp: null
  });

  // Load profile details on component mount
  const loadProfile = async () => {
    try {
      const response = await getProfileDetails();
      if (response.data?.data) {
        setProfile(response.data.data);
        setFormData({
          email: response.data.data.email || "",
          name: response.data.data.name || "",
          pfp: response.data.data.pfp || null
        });
      }
    } catch (err) {
      setError("Failed to load profile details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadProfile();
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image change
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file");
      return;
    }

    try {
      setError(null);
      // Compress image (max 500KB, max 800px width)
      const compressedBase64 = await compressImage(file, 500, 800);

      if (!compressedBase64) {
        setError("Image is too large. Please select a smaller image.");
        return;
      }

      // Upload to server
      const response = await updateProfileLogo(compressedBase64);

      if (response.status === 200) {
        // Update profile state with new image
        setProfile(prev => ({ ...prev, pfp: compressedBase64 }));
        setFormData(prev => ({ ...prev, pfp: compressedBase64 }));
        setSuccessMessage("Profile photo updated successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError("Failed to update profile image");
      console.error(err);
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.email !== profile.email) {
        await updateProfileEmail(formData.email);
      }
      if (formData.name !== profile.name) {
        await updateProfileName(formData.name);
      }
      setProfile(prev => ({
        ...prev,
        email: formData.email,
        name: formData.name
      }));
      setEditMode(false);
    } catch (err) {
      setError("Failed to update profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      window.location.reload();
    } catch (err) {
      setError("Failed to logout");
      console.error(err);
    }
  };

  // Handle admin invite success
  const handleAdminSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Handle phone success
  const handlePhoneSuccess = async (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
    // Reload profile to get updated phone number
    await loadProfile();
  };

  // Handle opening phone modal in different modes
  const openPhoneModal = (optOutMode = false) => {
    setPhoneModalOptOutMode(optOutMode);
    setShowPhoneModal(true);
  };

  const closePhoneModal = () => {
    setShowPhoneModal(false);
    setPhoneModalOptOutMode(false);
  };

  // Render
  if (loading && !profile) return <div className="p-4"><LoadingCircleScreen /></div>;
  return (
    <div className={styles.container}>
      <h1 className={styles.headerTitle}>Settings</h1>
      
      {error && <div className={styles.error}>{error}</div>}
      {successMessage && <div className={styles.success}>{successMessage}</div>}

      {/* Profile Image Section */}
      <div className={styles.sectionContainer}>
        <h2 className={styles.sectionTitle}>Profile Image</h2>
        <div className={styles.formSection}>
          <div className={styles.profileImageSection}>
            <label htmlFor="profileImage" style={{ cursor: 'pointer' }}>
              <img 
                src={profile?.pfp || "/defaults/u.webp"} 
                alt="Profile"
                className={styles.profileImage}
              />
            </label>
            <input
              type="file"
              id="profileImage"
              accept="image/*"
              onChange={handleImageChange}
              className={styles.fileInput}
            />
            <label htmlFor="profileImage" className={styles.fileInputLabel}>
              Update Photo
            </label>
          </div>
        </div>
      </div>

      {/* Profile Details Section */}
      <div className={styles.sectionContainer}>
        <h2 className={styles.sectionTitle}>Profile Details</h2>
        {editMode ? (
          <form onSubmit={handleSubmit}>
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <label className={styles.formSectionLabel}>Name</label>
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Enter your name"
              />
            </div>

            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <label className={styles.formSectionLabel}>Email Address</label>
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => setEditMode(false)}
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
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <label className={styles.formSectionLabel}>Name</label>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.descriptionText}>
                  {profile?.name || "Not set"}
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <label className={styles.formSectionLabel}>Email Address</label>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.descriptionText}>
                  {profile?.email}
                </div>
              </div>
            </div>

            <button
              onClick={() => setEditMode(true)}
              className={styles.editButton}
            >
              Edit Profile
            </button>
          </>
        )}
      </div>

      {/* Phone Number Section */}
      <div className={styles.sectionContainer}>
        <h2 className={styles.sectionTitle}>Phone Number</h2>
        <div className={styles.formSection}>
          {profile?.phone && (
            <div className={styles.detailItem} style={{ marginBottom: '16px' }}>
              <div className={styles.descriptionText}>
                {profile.phone}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => openPhoneModal(false)}
              className={styles.submitButton}
            >
              {profile?.phone ? "Update Phone" : "Add Phone"}
            </button>
            {profile?.phone && (
              <button
                onClick={() => openPhoneModal(true)}
                className={styles.deleteButton}
              >
                Opt Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className={styles.sectionContainer}>
        <h2 className={styles.sectionTitle}>Sign Out of Dialed</h2>
        <div className={styles.formSection}>
          <button
            onClick={handleLogout}
            className={styles.deleteButton}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Admin Management Section */}
      {(user.ut === "evo") && (
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Admin Management</h2>
          <div className={styles.formSection}>
            <button
              onClick={() => setShowAdminModal(true)}
              className={styles.submitButton}
            >
              Invite Admin User
            </button>
          </div>
        </div>
      )}

      {/* Admin Invite Modal */}
      <AdminInviteModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={handleAdminSuccess}
      />

      {/* Phone Number Modal */}
      <PhoneNumberModal
        isOpen={showPhoneModal}
        onClose={closePhoneModal}
        onSuccess={handlePhoneSuccess}
        currentPhone={profile?.phone}
        startInOptOutMode={phoneModalOptOutMode}
      />
    </div>
  );
}