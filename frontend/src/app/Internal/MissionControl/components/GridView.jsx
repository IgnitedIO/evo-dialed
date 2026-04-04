import { useState } from "react";
import CampaignCard from "./CampaignCard";

const STAGE_CONFIG = {
  onboarding: {
    label: "Onboarding",
    color: "#3b82f6",
    gradientFrom: "#eff6ff",
    gradientTo: "#dbeafe",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
  },
  active: {
    label: "Active",
    color: "#22c55e",
    gradientFrom: "#f0fdf4",
    gradientTo: "#dcfce7",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  renewal: {
    label: "Up for Renewal",
    color: "#f59e0b",
    gradientFrom: "#fffbeb",
    gradientTo: "#fef3c7",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  renewed: {
    label: "Renewed",
    color: "#8b5cf6",
    gradientFrom: "#faf5ff",
    gradientTo: "#f3e8ff",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    ),
  },
  relaunch: {
    label: "Relaunch",
    color: "#06b6d4",
    gradientFrom: "#ecfeff",
    gradientTo: "#cffafe",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
      </svg>
    ),
  },
};

const STAGE_ORDER = ["onboarding", "active", "renewal", "renewed", "relaunch"];
const OVERVIEW_LIMIT = 12;
const PER_PAGE = 25;

const GridView = ({ boardData, onCardClick, lastViewed }) => {
  const [activeStage, setActiveStage] = useState(null);
  const [page, setPage] = useState(1);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const handleStageClick = (stageKey) => {
    setActiveStage(stageKey);
    setPage(1);
  };

  const handleBack = () => {
    setActiveStage(null);
    setPage(1);
  };

  // Shared styles
  const containerStyle = {
    flex: 1,
    overflowY: "auto",
    paddingBottom: 32,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 14,
  };

  const buttonBase = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "'DM Sans', -apple-system, sans-serif",
    fontSize: 13,
    fontWeight: 500,
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  // Detail view
  if (activeStage) {
    const config = STAGE_CONFIG[activeStage];
    const campaigns = boardData[activeStage] || [];
    const totalPages = Math.ceil(campaigns.length / PER_PAGE);
    const paginated = campaigns.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
      <div style={containerStyle}>
        {/* Breadcrumb header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 20px",
          background: `linear-gradient(135deg, ${config.gradientFrom} 0%, ${config.gradientTo} 100%)`,
          borderRadius: 16,
          border: `1px solid ${config.color}22`,
        }}>
          <button
            onClick={handleBack}
            onMouseEnter={() => setHoveredBtn("back")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              ...buttonBase,
              padding: "8px 14px",
              borderRadius: 10,
              background: hoveredBtn === "back" ? "#fff" : "rgba(255,255,255,0.7)",
              color: "#374151",
              boxShadow: hoveredBtn === "back"
                ? "0 4px 12px rgba(0,0,0,0.1)"
                : "0 1px 3px rgba(0,0,0,0.05)",
              transform: hoveredBtn === "back" ? "translateY(-1px)" : "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 10,
              background: config.color,
              color: "#fff",
              boxShadow: `0 4px 12px ${config.color}40`,
            }}>
              {config.icon}
            </div>
            <div>
              <h2 style={{
                fontFamily: "'DM Sans', -apple-system, sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#111827",
                margin: 0,
                letterSpacing: "-0.02em",
              }}>
                {config.label}
              </h2>
              <span style={{
                fontFamily: "'DM Sans', -apple-system, sans-serif",
                fontSize: 13,
                color: "#6b7280",
              }}>
                {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Cards grid */}
        {campaigns.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#fafafa",
            borderRadius: 16,
            border: "1px dashed #e5e7eb",
          }}>
            <div style={{ color: config.color, marginBottom: 12, opacity: 0.5 }}>
              {config.icon}
            </div>
            <p style={{
              fontFamily: "'DM Sans', -apple-system, sans-serif",
              fontSize: 15,
              color: "#9ca3af",
              margin: 0,
            }}>
              No campaigns in {config.label.toLowerCase()}
            </p>
          </div>
        ) : (
          <>
            <div style={gridStyle}>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "20px 0",
              }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  onMouseEnter={() => page > 1 && setHoveredBtn("prev")}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    ...buttonBase,
                    padding: "10px 18px",
                    borderRadius: 10,
                    background: hoveredBtn === "prev" && page > 1 ? "#f3f4f6" : "#fff",
                    color: page <= 1 ? "#d1d5db" : "#374151",
                    border: "1px solid #e5e7eb",
                    opacity: page <= 1 ? 0.6 : 1,
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Previous
                </button>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  background: "#f9fafb",
                  borderRadius: 8,
                }}>
                  <span style={{
                    fontFamily: "'DM Sans', -apple-system, sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#111827",
                  }}>
                    {page}
                  </span>
                  <span style={{
                    fontFamily: "'DM Sans', -apple-system, sans-serif",
                    fontSize: 13,
                    color: "#9ca3af",
                  }}>
                    of {totalPages}
                  </span>
                </div>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  onMouseEnter={() => page < totalPages && setHoveredBtn("next")}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    ...buttonBase,
                    padding: "10px 18px",
                    borderRadius: 10,
                    background: hoveredBtn === "next" && page < totalPages ? "#f3f4f6" : "#fff",
                    color: page >= totalPages ? "#d1d5db" : "#374151",
                    border: "1px solid #e5e7eb",
                    opacity: page >= totalPages ? 0.6 : 1,
                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

  // Overview - all stages
  return (
    <div style={containerStyle}>
      {STAGE_ORDER.map((stageKey) => {
        const config = STAGE_CONFIG[stageKey];
        const campaigns = boardData[stageKey] || [];
        const preview = campaigns.slice(0, OVERVIEW_LIMIT);
        const remaining = campaigns.length - OVERVIEW_LIMIT;
        const isHovered = hoveredSection === stageKey;

        return (
          <section
            key={stageKey}
            style={{
              borderRadius: 16,
              background: "#fff",
              border: "1px solid #e5e7eb",
              boxShadow: isHovered
                ? "0 8px 30px rgba(0,0,0,0.08)"
                : "0 1px 3px rgba(0,0,0,0.04)",
              transition: "all 0.25s ease",
            }}
          >
            {/* Section header */}
            <div
              onClick={() => handleStageClick(stageKey)}
              onMouseEnter={() => setHoveredSection(stageKey)}
              onMouseLeave={() => setHoveredSection(null)}
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                background: isHovered
                  ? `linear-gradient(135deg, ${config.gradientFrom} 0%, ${config.gradientTo} 100%)`
                  : "transparent",
                transition: "all 0.25s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: isHovered ? config.color : `${config.color}15`,
                  color: isHovered ? "#fff" : config.color,
                  transition: "all 0.25s ease",
                  boxShadow: isHovered ? `0 4px 12px ${config.color}40` : "none",
                }}>
                  {config.icon}
                </div>
                <div>
                  <h3 style={{
                    fontFamily: "'DM Sans', -apple-system, sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#111827",
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}>
                    {config.label}
                  </h3>
                  <span style={{
                    fontFamily: "'DM Sans', -apple-system, sans-serif",
                    fontSize: 12,
                    color: "#9ca3af",
                  }}>
                    {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 8,
                background: isHovered ? "rgba(255,255,255,0.8)" : "transparent",
                transition: "all 0.2s ease",
              }}>
                <span style={{
                  fontFamily: "'DM Sans', -apple-system, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: isHovered ? config.color : "#9ca3af",
                  transition: "color 0.2s ease",
                }}>
                  View all
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isHovered ? config.color : "#9ca3af"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transition: "all 0.2s ease", transform: isHovered ? "translateX(2px)" : "none" }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>

            {/* Cards or empty state */}
            {campaigns.length === 0 ? (
              <div style={{
                padding: "32px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                background: "#fafafa",
                borderTop: "1px dashed #e5e7eb",
              }}>
                <div style={{ color: config.color, opacity: 0.3 }}>
                  {config.icon}
                </div>
                <span style={{
                  fontFamily: "'DM Sans', -apple-system, sans-serif",
                  fontSize: 13,
                  color: "#9ca3af",
                }}>
                  No campaigns yet
                </span>
              </div>
            ) : (
              <div style={{ padding: "4px 16px 16px" }}>
                <div style={gridStyle}>
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
                    onMouseEnter={() => setHoveredBtn(`more-${stageKey}`)}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      width: "100%",
                      marginTop: 16,
                      padding: "14px 20px",
                      border: hoveredBtn === `more-${stageKey}`
                        ? `2px solid ${config.color}`
                        : "2px dashed #e5e7eb",
                      borderRadius: 12,
                      background: hoveredBtn === `more-${stageKey}`
                        ? `${config.gradientFrom}`
                        : "transparent",
                      fontFamily: "'DM Sans', -apple-system, sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: hoveredBtn === `more-${stageKey}` ? config.color : "#6b7280",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span>View all {campaigns.length} campaigns</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      style={{
                        transition: "transform 0.2s ease",
                        transform: hoveredBtn === `more-${stageKey}` ? "translateX(3px)" : "none",
                      }}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default GridView;
