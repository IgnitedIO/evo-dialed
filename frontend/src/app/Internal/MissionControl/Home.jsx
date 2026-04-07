// Dependencies
import { useEffect, useState, useMemo } from "react";

// API Imports
import { getMissionControlBoard } from "../../../api/internal";

// Component Imports
import GridView from "./components/GridView";
import CampaignPanel from "./components/CampaignPanel";
import LoadingCircleScreen from "../../../ui/Components/LoadingCircle/LoadingCircleScreen";

// Style Imports
import styles from "./MissionControl.module.css";

const STAGE_ORDER = ["onboarding", "active", "renewal", "renewed", "relaunch"];

export const InternalMissionControlHome = () => {
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [filterCD, setFilterCD] = useState("");
  const [filterProgress, setFilterProgress] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterPostPct, setFilterPostPct] = useState("");
  const [filterCreators, setFilterCreators] = useState("");
  const [sortBy, setSortBy] = useState("");

  // Track last-viewed timestamps per campaign (for notification badges)
  const [lastViewed, setLastViewed] = useState(() => {
    try {
      const saved = localStorage.getItem("mc_last_viewed");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  
  const loadBoard = async () => {
    try {
      const resp = await getMissionControlBoard();
      if (resp.status === 200) {
        setBoardData(resp.data);
        setError(null);
      } else {
        setError("Failed to load board data");
      }
    } catch (err) {
      setError("Error loading board data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoard();
  }, []);

  // Persist last-viewed to localStorage
  useEffect(() => {
    try { localStorage.setItem("mc_last_viewed", JSON.stringify(lastViewed)); }
    catch {}
  }, [lastViewed]);

  // Extract unique CDs for filter dropdown
  const allCDs = useMemo(() => {
    if (!boardData) return [];
    const cds = new Set();
    STAGE_ORDER.forEach((key) => {
      (boardData[key] || []).forEach((c) => {
        if (c.cd_name) cds.add(c.cd_name);
      });
    });
    return [...cds].sort();
  }, [boardData]);

  // Apply filters to board data
  const filteredBoard = useMemo(() => {
    if (!boardData) return null;

    const filterCampaigns = (campaigns) => {
      return campaigns.filter((c) => {
        if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterCD && c.cd_name !== filterCD) return false;
        if (filterProgress && c.progress.color !== filterProgress) return false;
        if (filterPlatform === "ig" && !c.supports_ig) return false;
        if (filterPlatform === "tt" && !c.supports_tt) return false;
        // Post % range
        if (filterPostPct) {
          const pct = c.progress.pct;
          if (filterPostPct === "0-25" && (pct < 0 || pct > 25)) return false;
          if (filterPostPct === "25-50" && (pct < 25 || pct > 50)) return false;
          if (filterPostPct === "50-75" && (pct < 50 || pct > 75)) return false;
          if (filterPostPct === "75-100" && (pct < 75 || pct > 100)) return false;
          if (filterPostPct === "100+" && pct < 100) return false;
        }
        // Creator count range
        if (filterCreators) {
          const count = c.creators || 0;
          if (filterCreators === "1-5" && (count < 1 || count > 5)) return false;
          if (filterCreators === "6-15" && (count < 6 || count > 15)) return false;
          if (filterCreators === "16+" && count < 16) return false;
        }
        return true;
      });
    };

    const sortCampaigns = (campaigns) => {
      if (!sortBy) return campaigns;
      return [...campaigns].sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "pct-asc") return a.progress.pct - b.progress.pct;
        if (sortBy === "pct-desc") return b.progress.pct - a.progress.pct;
        if (sortBy === "views") return (b.metrics.views || 0) - (a.metrics.views || 0);
        if (sortBy === "creators") return (b.creators || 0) - (a.creators || 0);
        if (sortBy === "end-date") {
          const aDate = a.estimated_end_date ? new Date(a.estimated_end_date) : new Date("9999-12-31");
          const bDate = b.estimated_end_date ? new Date(b.estimated_end_date) : new Date("9999-12-31");
          return aDate - bDate;
        }
        return 0;
      });
    };

    const result = {};
    STAGE_ORDER.forEach((key) => {
      let campaigns = filterCampaigns(boardData[key] || []);
      if (sortBy) {
        campaigns = sortCampaigns(campaigns);
      }
      result[key] = campaigns;
    });
    return result;
  }, [boardData, search, filterCD, filterProgress, filterPlatform, filterPostPct, filterCreators, sortBy]);

  const hasFilters = search || filterCD || filterProgress || filterPlatform || filterPostPct || filterCreators || sortBy;

  const clearFilters = () => {
    setSearch("");
    setFilterCD("");
    setFilterProgress("");
    setFilterPlatform("");
    setFilterPostPct("");
    setFilterCreators("");
    setSortBy("");
  };

  const handleCardClick = (campaign) => {
    setSelectedCampaign(campaign);
    // Mark as viewed — clears notification badge
    setLastViewed((prev) => ({ ...prev, [campaign.id]: new Date().toISOString() }));
  };

  const handlePanelClose = () => {
    setSelectedCampaign(null);
  };

  const handleBoardRefresh = async () => {
    await loadBoard();
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <LoadingCircleScreen />
      </div>
    );
  }

  if (error || !filteredBoard) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <span style={{ color: "#999" }}>{error || "No data"}</span>
        </div>
      </div>
    );
  }

  // Count total campaigns (unfiltered)
  const totalCampaigns = STAGE_ORDER.reduce(
    (sum, key) => sum + (boardData[key]?.length || 0), 0
  );
  const filteredTotal = STAGE_ORDER.reduce(
    (sum, key) => sum + (filteredBoard[key]?.length || 0), 0
  );
  const pausedCount = boardData.paused?.length || 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.title}>Mission Control</span>
        <div className={styles.headerRight}>
          <span style={{ fontSize: 13, color: "#999" }}>
            {hasFilters ? `${filteredTotal} of ` : ""}{totalCampaigns} campaign{totalCampaigns !== 1 ? "s" : ""}
            {pausedCount > 0 && ` · ${pausedCount} paused`}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterSearch}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.filterSearchInput}
          />
        </div>

        <select
          value={filterCD}
          onChange={(e) => setFilterCD(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All CDs</option>
          {allCDs.map((cd) => (
            <option key={cd} value={cd}>{cd}</option>
          ))}
        </select>

        <select
          value={filterProgress}
          onChange={(e) => setFilterProgress(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Progress</option>
          <option value="green">On Track</option>
          <option value="yellow">Slightly Behind</option>
          <option value="red">Behind</option>
        </select>

        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Platforms</option>
          <option value="ig">Instagram</option>
          <option value="tt">TikTok</option>
        </select>

        <select
          value={filterPostPct}
          onChange={(e) => setFilterPostPct(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Post %</option>
          <option value="0-25">0 – 25%</option>
          <option value="25-50">25 – 50%</option>
          <option value="50-75">50 – 75%</option>
          <option value="75-100">75 – 100%</option>
          <option value="100+">100%+</option>
        </select>

        <select
          value={filterCreators}
          onChange={(e) => setFilterCreators(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Creators</option>
          <option value="1-5">1 – 5</option>
          <option value="6-15">6 – 15</option>
          <option value="16+">16+</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Sort by</option>
          <option value="name">Name A–Z</option>
          <option value="pct-asc">Post % Low → High</option>
          <option value="pct-desc">Post % High → Low</option>
          <option value="views">Most Views</option>
          <option value="creators">Most Creators</option>
          <option value="end-date">Ending Soonest</option>
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className={styles.filterClearBtn}>
            Clear
          </button>
        )}
      </div>

      {/* Grid View */}
      <GridView
        boardData={filteredBoard}
        onCardClick={handleCardClick}
        lastViewed={lastViewed}
      />

      {selectedCampaign && (
        <CampaignPanel
          campaign={selectedCampaign}
          onClose={handlePanelClose}
          onBoardRefresh={handleBoardRefresh}
        />
      )}
    </div>
  );
};
