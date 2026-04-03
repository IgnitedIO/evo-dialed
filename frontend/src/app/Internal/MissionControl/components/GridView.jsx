import { useState } from "react";
import CampaignCard from "./CampaignCard";

const STAGE_LABELS = {
  onboarding: "Onboarding",
  active: "Active",
  renewal: "Up for Renewal",
  renewed: "Renewed",
  relaunch: "Relaunch",
};

const STAGE_COLORS = {
  onboarding: "#1565c0",
  active: "#2e7d32",
  renewal: "#e65100",
  renewed: "#7b1fa2",
  relaunch: "#00838f",
};

const STAGE_ORDER = ["onboarding", "active", "renewal", "renewed", "relaunch"];
const OVERVIEW_LIMIT = 6;
const PER_PAGE = 25;

const font = "Geist, sans-serif";

const GridView = ({ boardData, onCardClick, lastViewed }) => {
  const [activeStage, setActiveStage] = useState(null);
  const [page, setPage] = useState(1);
  const [hovered, setHovered] = useState(null);

  const handleStageClick = (stageKey) => {
    setActiveStage(stageKey);
    setPage(1);
  };

  const handleBack = () => {
    setActiveStage(null);
    setPage(1);
  };

  // Detail view — single category with pagination
  if (activeStage) {
    const campaigns = boardData[activeStage] || [];
    const totalPages = Math.ceil(campaigns.length / PER_PAGE);
    const paginated = campaigns.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 8, flexShrink: 0 }}>
          <button
            onClick={handleBack}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", border: "1px solid #e6e6e6", borderRadius: 8,
              background: "#FDFDFC", fontFamily: font, fontSize: 13, fontWeight: 500,
              color: "#666", cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All Categories
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: font, fontSize: 18, fontWeight: 600 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS[activeStage], flexShrink: 0 }} />
            <span>{STAGE_LABELS[activeStage] || activeStage}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#999", background: "#f0f0f0", padding: "2px 8px", borderRadius: 10 }}>
              {campaigns.length}
            </span>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, fontFamily: font, fontSize: 14, color: "#bbb" }}>
            No campaigns in this stage
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {paginated.map((c) => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  onClick={onCardClick}
                  isDragging={false}
                  provided={null}
                  hasUnread={
                    c.latest_activity_ts &&
                    (!lastViewed[c.id] || new Date(c.latest_activity_ts) > new Date(lastViewed[c.id]))
                  }
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "16px 0 0", flexShrink: 0 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", border: "1px solid #e6e6e6", borderRadius: 8,
                    background: "#FDFDFC", fontFamily: font, fontSize: 13, fontWeight: 500,
                    color: "#666", cursor: page <= 1 ? "not-allowed" : "pointer",
                    opacity: page <= 1 ? 0.4 : 1,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Prev
                </button>
                <span style={{ fontFamily: font, fontSize: 13, fontWeight: 500, color: "#999" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", border: "1px solid #e6e6e6", borderRadius: 8,
                    background: "#FDFDFC", fontFamily: font, fontSize: 13, fontWeight: 500,
                    color: "#666", cursor: page >= totalPages ? "not-allowed" : "pointer",
                    opacity: page >= totalPages ? 0.4 : 1,
                  }}
                >
                  Next
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Overview — each category shows header + preview grid of cards
  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {STAGE_ORDER.map((stageKey) => {
        const campaigns = boardData[stageKey] || [];
        const preview = campaigns.slice(0, OVERVIEW_LIMIT);
        const remaining = campaigns.length - OVERVIEW_LIMIT;
        const isHovered = hovered === stageKey;

        return (
          <div
            key={stageKey}
            style={{
              border: "1px solid #e6e6e6",
              borderRadius: 12,
              background: "#FDFDFC",
            }}
          >
            {/* Clickable header */}
            <div
              onClick={() => handleStageClick(stageKey)}
              onMouseEnter={() => setHovered(stageKey)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                userSelect: "none",
                borderRadius: 12,
                background: isHovered ? "#FAFAF8" : "transparent",
                transition: "background 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS[stageKey], flexShrink: 0 }} />
                <span style={{ fontFamily: font, fontSize: 15, fontWeight: 600 }}>
                  {STAGE_LABELS[stageKey] || stageKey}
                </span>
                <span style={{ fontFamily: font, fontSize: 12, fontWeight: 500, color: "#999", background: "#f0f0f0", padding: "2px 8px", borderRadius: 10 }}>
                  {campaigns.length}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: isHovered ? "#999" : "#ccc", transition: "color 0.15s ease" }}>
                {campaigns.length > 0 && (
                  <span style={{ fontFamily: font, fontSize: 12, fontWeight: 500, color: isHovered ? "#C6620D" : "#999", transition: "color 0.15s ease" }}>
                    View all
                  </span>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>

            {/* Cards or empty state */}
            {campaigns.length === 0 ? (
              <div style={{ padding: "4px 20px 20px", fontFamily: font, fontSize: 13, color: "#bbb" }}>
                No campaigns
              </div>
            ) : (
              <div style={{ padding: "0 16px 16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {preview.map((c) => (
                    <CampaignCard
                      key={c.id}
                      campaign={c}
                      onClick={onCardClick}
                      isDragging={false}
                      provided={null}
                      hasUnread={
                        c.latest_activity_ts &&
                        (!lastViewed[c.id] || new Date(c.latest_activity_ts) > new Date(lastViewed[c.id]))
                      }
                    />
                  ))}
                </div>
                {remaining > 0 && (
                  <button
                    onClick={() => handleStageClick(stageKey)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 6, width: "100%", marginTop: 12, padding: 10,
                      border: "1px dashed #e6e6e6", borderRadius: 8,
                      background: "transparent", fontFamily: font, fontSize: 13,
                      fontWeight: 500, color: "#888", cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#C6620D"; e.currentTarget.style.borderColor = "#C6620D"; e.currentTarget.style.background = "#FAFAF8"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "#e6e6e6"; e.currentTarget.style.background = "transparent"; }}
                  >
                    View all {campaigns.length} campaigns
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GridView;
