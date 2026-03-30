// Dependencies
import { INSTAGRAM_ICON, TIKTOK_ICON } from "../../../../../assets/icons/svg";

// Style Imports
import styles from "../Details.module.css";

// Helper Functions
const getFilterButtonText = (platformFilters, dateFilter) => {
    const parts = [];
    if (platformFilters.instagram || platformFilters.tiktok) {
        const platforms = [];
        if (platformFilters.instagram) platforms.push("Instagram");
        if (platformFilters.tiktok) platforms.push("TikTok");
        parts.push(platforms.join(", "));
    }
    if (dateFilter !== "all") {
        parts.push(dateFilter === "24h" ? "Last 24h" :
                  dateFilter === "7d" ? "Last 7d" :
                  dateFilter === "30d" ? "Last 30d" : "Last 90d");
    }
    // return parts.length > 0 ? `Filter (${parts.join(", ")})` : "Filter";
    return (parts.length > 0) ? `Filter (${parts.length})` : "Filter";
};

// Posts Filter Menu Component
export const PostsFilterMenu = ({ 
    platformFilters, 
    setPlatformFilters, 
    dateFilter, 
    setDateFilter,
    isOpen,
    onOpenChange
}) => {
    // Toggle platform filter
    const togglePlatformFilter = (platform) => {
        setPlatformFilters(prev => ({
            ...prev,
            [platform]: !prev[platform]
        }));
    };

    // Render
    return (
        <div style={{ position: "relative" }}>
            <button 
                onClick={() => onOpenChange(!isOpen)}
                className={styles.filterButton}
            >
                {getFilterButtonText(platformFilters, dateFilter)}
                <span className={`${styles.dropdownArrow} ${isOpen ? styles.dropdownArrowOpen : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m19 9-7 7-7-7"/>
                    </svg>
                </span>
            </button>
            {isOpen && (
                <div className={styles.dropdownContainer}>
                    {/* Platforms Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            Platforms
                        </div>
                        {[
                            { name: "Instagram", icon: INSTAGRAM_ICON, key: "instagram" },
                            { name: "TikTok", icon: TIKTOK_ICON, key: "tiktok" }
                        ].map(({ name, icon, key }) => (
                            <button
                                key={key}
                                onClick={() => togglePlatformFilter(key)}
                                className={`${styles.filterOption} ${styles.platformOption} ${
                                    platformFilters[key] ? styles.filterOptionSelected : ''
                                }`}
                            >
                                <div className={styles.platformIcon}>
                                    {icon}
                                </div>
                                {name}
                            </button>
                        ))}
                    </div>

                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            Date Posted
                        </div>
                        {[
                            { id: "all", label: "All" },
                            { id: "24h", label: "Last 24h" },
                            { id: "7d", label: "Last 7d" },
                            { id: "30d", label: "Last 30d" },
                            { id: "90d", label: "Last 90d" }
                        ].map(({ id, label }) => (
                            <button
                                key={id}
                                onClick={() => {
                                    setDateFilter(id);
                                    onOpenChange(false);
                                }}
                                className={`${styles.filterOption} ${
                                    dateFilter === id ? styles.filterOptionSelected : ''
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}; 