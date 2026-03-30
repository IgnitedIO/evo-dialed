// Dependencies
import {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
import debounce from "just-debounce-it";

// API Imports
import { getCreatorsListCondensed } from "../../../../../api/internal";

// Style Imports
import styles from "../Details.module.css";

// Icon Imports
import { CHEVRON_DOWN_ICON, SEARCH_ICON, CLOSE_ICON } from "../../../../../assets/icons/svg";

// Constants
const PAGE_SIZE = 10;

// Creator Selector Component
export default function CreatorSelector({
  selectedCreator,
  onCreatorSelect,
  placeholder = "Select a creator...",
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownWidth, setDropdownWidth] = useState(undefined);
  const [dropdownTop, setDropdownTop] = useState(0);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const triggerRef = useRef(null);
  const loadingRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchAbortController = useRef(null);

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

  // Load creators function
  const loadCreators = async (search = "", pageNum = 1, append = false) => {
    // Cancel any pending requests
    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }
    searchAbortController.current = new AbortController();

    if (!append) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const response = await getCreatorsListCondensed(pageNum, PAGE_SIZE, "hltime", search);
      if (response.status === 200) {
        const responseData = response.data.data;
        
        if (append) {
          setCreators((prev) => [...prev, ...responseData.creators]);
        } else {
          setCreators(responseData.creators);
        }
        
        setPage(responseData.pagination.page);
        setHasMore(
          responseData.pagination.page < responseData.pagination.totalPages
        );
      } else {
        setError("Failed to load creators");
        setHasMore(false);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError("Error loading creators");
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue) => {
      setPage(1);
      setCreators([]);
      setHasMore(true);
      loadCreators(searchValue, 1, false);
    }, 300),
    []
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    setPage(1);
    setCreators([]);
    setHasMore(true);
    loadCreators("", 1, false);
    searchInputRef.current?.focus();
  };

  // Initialize display value when selectedCreator changes
  useEffect(() => {
    setDisplayValue(selectedCreator ? selectedCreator.name : "");
  }, [selectedCreator]);

  // Load first page on open
  useEffect(() => {
    if (modalOpen) {
      setCreators([]);
      setPage(1);
      setHasMore(true);
      setError(null);
      setSearchTerm("");
      loadCreators("", 1, false);
    }
  }, [modalOpen]);

  // Load more creators (pagination)
  const loadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    loadCreators(searchTerm, page + 1, true);
  }, [loadingMore, loading, hasMore, page, searchTerm]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!modalOpen || !hasMore || loadingMore) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    );
    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }
    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current);
      }
    };
  }, [modalOpen, hasMore, loadingMore, loadMore]);

  const handleCreatorSelect = (creator, e) => {
    if (e) e.stopPropagation();
    onCreatorSelect(creator);
    setDisplayValue(creator.name);
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
    
    // Clear selected creator if user is typing
    if (selectedCreator && value !== selectedCreator.name) {
      onCreatorSelect(null);
    }
    
    if (!modalOpen) {
      setModalOpen(true);
    }
    debouncedSearch(value);
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
      {/* Creator Selector Container */}
      <div
        className={styles.creatorSelectorContainer}
        ref={triggerRef}
      >
        <div className={styles.creatorSelectorDisplay}>
          <input
            type="text"
            value={displayValue}
            onChange={handleMainInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className={`${styles.creatorSelectorInput} ${
              displayValue
                ? styles.creatorSelectorSelectedText
                : styles.creatorSelectorPlaceholderText
            }`}
          />
          <div 
            className={`${styles.creatorSelectorChevronIcon} ${styles.creatorSelectorChevronButton}`}
            onClick={() => setModalOpen((open) => !open)}
          >
            {CHEVRON_DOWN_ICON}
          </div>
        </div>
        {/* Creator Selector Modal */}
        {modalOpen && (
          <div
            className={styles.creatorSelectorModalContent}
            style={{
              width: dropdownWidth,
              top: dropdownTop,
              left: dropdownLeft,
            }}
          >
            {/* Search Input in Dropdown */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className={styles.creatorSelectorSearchContainer}
            >
              <div className={styles.creatorSelectorSearchWrapper}>
                <div className={styles.creatorSelectorSearchIcon}>
                  {SEARCH_ICON}
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search creators..."
                  className={styles.creatorSelectorSearchInput}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className={styles.creatorSelectorClearButton}
                  >
                    {CLOSE_ICON}
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className={styles.creatorSelectorResultsContainer}>
              {loading ? (
                <div className={styles.creatorSelectorLoadingState}>
                  Loading creators...
                </div>
              ) : error ? (
                <div className={styles.creatorSelectorEmptyState}>{error}</div>
              ) : creators.length === 0 ? (
                <div className={styles.creatorSelectorEmptyState}>
                  {searchTerm ? `No creators found for "${searchTerm}"` : "No creators available"}
                </div>
              ) : (
                <>
                  {creators.map((creator) => (
                    <div
                      key={creator.id}
                      onClick={(e) => handleCreatorSelect(creator, e)}
                      className={styles.creatorSelectorOption}
                    >
                      {creator.name}
                    </div>
                  ))}
                  {/* Intersection target */}
                  {hasMore && (
                    <div
                      ref={loadingRef}
                      className={styles.creatorSelectorLoadingState}
                    >
                      {loadingMore ? (
                        <div className={styles.creatorSelectorSpinnerRow}>
                          <span className={styles.creatorSelectorSpinner}></span>
                          Loading more creators...
                        </div>
                      ) : (
                        <span className={styles.creatorSelectorLoadMoreText}>
                          Scroll down to load more
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
