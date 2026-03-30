// Dependencies
import {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";

// API Imports
import { getCampaignsSimple } from "../../../../api/creators";

// Style Imports
import styles from "../styles/CampaignSelector.module.css";

// Icon Imports
import { CHEVRON_DOWN_ICON, SEARCH_ICON, CLOSE_ICON, INSTAGRAM_ICON, TIKTOK_ICON } from "../../../../assets/icons/svg";

// Campaign Selector Component
export default function CampaignSelector({
  selectedCampaign,
  onCampaignSelect,
  placeholder = "Select a campaign...",
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownWidth, setDropdownWidth] = useState(undefined);
  const [dropdownTop, setDropdownTop] = useState(0);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Set dropdown position/width
  useLayoutEffect(() => {
    if (modalOpen && triggerRef.current) {
      setDropdownWidth(triggerRef.current.offsetWidth);
      setDropdownTop(triggerRef.current.offsetHeight);
      setDropdownLeft(0);
    }
  }, [modalOpen]);

  // Focus search input when modal opens
  useEffect(() => {
    if (modalOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [modalOpen]);

  // Load campaigns function
  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getCampaignsSimple();
      if (response.status === 200) {
        const campaignsList = response.data.data || [];
        setCampaigns(campaignsList);
        setFilteredCampaigns(campaignsList);
      } else {
        setError("Failed to load campaigns");
      }
    } catch (err) {
      setError("Error loading campaigns");
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Filter campaigns based on search
    if (value.trim() === "") {
      setFilteredCampaigns(campaigns);
    } else {
      const filtered = campaigns.filter(campaign =>
        campaign.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCampaigns(filtered);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    setFilteredCampaigns(campaigns);
    searchInputRef.current?.focus();
  };

  // Initialize display value when selectedCampaign changes
  useEffect(() => {
    setDisplayValue(selectedCampaign ? selectedCampaign.name : "");
  }, [selectedCampaign]);

  // Load campaigns on open
  useEffect(() => {
    if (modalOpen) {
      setError(null);
      setSearchTerm("");
      loadCampaigns();
    }
  }, [modalOpen]);

  const handleCampaignSelect = (campaign, e) => {
    if (e) e.stopPropagation();
    onCampaignSelect(campaign);
    setDisplayValue(campaign.name);
    setModalOpen(false);
  };

  // Handle focus on the input (open dropdown)
  const handleInputFocus = () => {
    setModalOpen(true);
  };

  // Handle input change when typing in main input
  const handleMainInputChange = (e) => {
    const value = e.target.value;
    setDisplayValue(value);
    setSearchTerm(value);

    // Clear selected campaign if user is typing
    if (selectedCampaign && value !== selectedCampaign.name) {
      onCampaignSelect(null);
    }

    if (!modalOpen) {
      setModalOpen(true);
    }

    // Filter campaigns based on input
    if (value.trim() === "") {
      setFilteredCampaigns(campaigns);
    } else {
      const filtered = campaigns.filter(campaign =>
        campaign.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCampaigns(filtered);
    }
  };

  // Handle click outside to close dropdown
  const handleClickOutside = useCallback((event) => {
    if (triggerRef.current && !triggerRef.current.contains(event.target)) {
      setModalOpen(false);
    }
  }, []);

  useEffect(() => {
    if (modalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modalOpen, handleClickOutside]);

  return (
    <>
      {/* Campaign Selector Container */}
      <div
        className={styles.campaignSelectorContainer}
        ref={triggerRef}
      >
        <div className={styles.campaignSelectorDisplay}>
          <input
            type="text"
            value={displayValue}
            onChange={handleMainInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className={`${styles.campaignSelectorInput} ${
              displayValue
                ? styles.campaignSelectorSelectedText
                : styles.campaignSelectorPlaceholderText
            }`}
          />
          <div
            className={`${styles.campaignSelectorChevronIcon} ${styles.campaignSelectorChevronButton}`}
            onClick={() => setModalOpen((open) => !open)}
          >
            {CHEVRON_DOWN_ICON}
          </div>
        </div>
        {/* Campaign Selector Modal */}
        {modalOpen && (
          <div
            className={styles.campaignSelectorModalContent}
            style={{
              width: dropdownWidth,
              top: dropdownTop,
              left: dropdownLeft,
            }}
          >
            {/* Search Input in Dropdown */}
            <div
              onClick={(e) => e.stopPropagation()}
              className={styles.campaignSelectorSearchContainer}
            >
              <div className={styles.campaignSelectorSearchWrapper}>
                <div className={styles.campaignSelectorSearchIcon}>
                  {SEARCH_ICON}
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search campaigns..."
                  className={styles.campaignSelectorSearchInput}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className={styles.campaignSelectorClearButton}
                  >
                    {CLOSE_ICON}
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className={styles.campaignSelectorResultsContainer}>
              {loading ? (
                <div className={styles.campaignSelectorLoadingState}>
                  Loading campaigns...
                </div>
              ) : error ? (
                <div className={styles.campaignSelectorEmptyState}>{error}</div>
              ) : filteredCampaigns.length === 0 ? (
                <div className={styles.campaignSelectorEmptyState}>
                  {searchTerm ? `No campaigns found for "${searchTerm}"` : "No campaigns available"}
                </div>
              ) : (
                <>
                  {filteredCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      onClick={(e) => handleCampaignSelect(campaign, e)}
                      className={styles.campaignSelectorOption}
                    >
                      <div style={{ flex: 1 }}>{campaign.name}</div>
                      <div style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
                        {campaign.platforms.includes("ig") && (
                          <span>
                            {INSTAGRAM_ICON}
                          </span>
                        )}
                        {campaign.platforms.includes("tt") && (
                          <span>
                            {TIKTOK_ICON}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
