// Dependencies
import styles from "../Details.module.css";

// Helper Functions
const getSortButtonText = (sortBy) => {
    const option = POST_SORT_OPTIONS.find(opt => opt.id === sortBy);
    return option ? `${option.label}` : "Sort";
};

// Constants
const POST_SORT_OPTIONS = [
    { id: "most_views", label: "Most Views" },
    { id: "most_likes", label: "Most Likes" },
    { id: "most_comments", label: "Most Comments" },
    { id: "most_shares", label: "Most Shares" },
    { id: "most_recent", label: "Most Recent" },
    { id: "oldest", label: "Oldest" }
];

// Posts Sort Menu Component
export const PostsSortMenu = ({
    sortBy, 
    setSortBy,
    isOpen,
    onOpenChange
}) => {
    // Render
    return (
        <div style={{ position: "relative" }}>
            <button 
                onClick={() => onOpenChange(!isOpen)}
                className={styles.filterButton}
                style={{ background: "white", color: "black", border: "1px solid var(--brd-light)" }}
            >
                {getSortButtonText(sortBy)}
                <span className={`${styles.dropdownArrow} ${isOpen ? styles.dropdownArrowOpen : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m19 9-7 7-7-7"/>
                    </svg>
                </span>
            </button>
            {isOpen && (
                <div className={styles.dropdownContainer}>
                    {POST_SORT_OPTIONS.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => {
                                setSortBy(option.id);
                                onOpenChange(false);
                            }}
                            className={`${styles.filterOption} ${
                                sortBy === option.id ? styles.filterOptionSelected : ''
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}; 