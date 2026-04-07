import { useState, useMemo } from "react";

const STAGE_CONFIG = {
  onboarding: {
    label: "Onboarding",
    color: "#00c875",
  },
  active: {
    label: "Active Campaigns",
    color: "#00c875",
  },
  renewal: {
    label: "Up for Renewal",
    color: "#fdab3d",
  },
  renewed: {
    label: "Renewed",
    color: "#a25ddc",
  },
  relaunch: {
    label: "Relaunch",
    color: "#00d2d2",
  },
};

const STAGE_ORDER = ["onboarding", "active", "renewal", "renewed", "relaunch"];

// Color mappings for status columns
const CLIENT_STATUS = {
  "TOP TIER": "#00c875",
  "LOWER TIER": "#9cd326",
};

// Campaign stage status
const CAMPAIGN_STAGE = {
  "Onboarding": "#a25ddc",
  "Active": "#00c875",
  "Renewal": "#fdab3d",
  "Renewed": "#579bfc",
  "Relaunch": "#00d2d2",
  "Paused": "#c4c4c4",
};

// Health/progress status
const HEALTH_STATUS = {
  "On Track": "#00c875",
  "Ahead": "#9cd326",
  "Needs Help": "#fdab3d",
  "Behind": "#ff642e",
  "URGENT": "#e2445c",
};

const CAMPAIGN_POSITION = {
  "1st": "#00c875",
  "2nd": "#9cd326",
  "3rd": "#cab641",
  "4th": "#fdab3d",
  "5th": "#ff642e",
  "6th": "#e2445c",
};

const CONTRACT_LENGTH = {
  "1 month": "#ff158a",
  "2 months": "#fdab3d",
  "3 months": "#00c875",
  "4 months": "#579bfc",
  "6 months": "#a25ddc",
};

const DELIVERABLES_COLOR = "#0086c0";

// Format helpers
const formatNumber = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Get campaign position based on progress
const getCampaignPosition = (pct) => {
  if (pct >= 90) return "1st";
  if (pct >= 75) return "2nd";
  if (pct >= 60) return "3rd";
  if (pct >= 45) return "4th";
  if (pct >= 30) return "5th";
  return "6th";
};

// Get contract length from dates
const getContractLength = (startDate, endDate) => {
  if (!endDate) return "";
  const start = startDate ? new Date(startDate) : new Date();
  const end = new Date(endDate);
  const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
  if (months <= 1) return "1 month";
  if (months <= 2) return "2 months";
  if (months <= 3) return "3 months";
  if (months <= 4) return "4 months";
  return "6 months";
};

// Get campaign stage (what phase it's in)
const getCampaignStage = (campaign) => {
  const stageMap = {
    onboarding: "Onboarding",
    active: "Active",
    renewal: "Renewal",
    renewed: "Renewed",
    relaunch: "Relaunch",
  };
  return stageMap[campaign.status] || "Active";
};

// Get health status (how it's performing)
const getHealthStatus = (campaign) => {
  if (campaign.progress.color === "green") {
    return campaign.progress.pct >= 80 ? "Ahead" : "On Track";
  }
  if (campaign.progress.color === "yellow") {
    return campaign.progress.pct >= 40 ? "Needs Help" : "Behind";
  }
  if (campaign.progress.color === "red") return "URGENT";
  return "On Track";
};

// Get view progress color based on percentage of target
const getViewProgressColor = (pct) => {
  if (pct === null) return "gray";
  if (pct >= 100) return "green";
  if (pct >= 75) return "green";
  if (pct >= 50) return "yellow";
  return "red";
};

// Progress cell with value display (for Posts and Views)
const ProgressWithValueCell = ({ current, target, color, formatFn = (v) => v }) => {
  const pct = target ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const colors = { green: "#00c875", yellow: "#fdab3d", red: "#e2445c", gray: "#c4c4c4" };
  const bgColor = colors[color] || "#c4c4c4";

  return (
    <td style={{ padding: "8px 10px", borderBottom: "1px solid #e6e9ef" }}>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: bgColor }}>{formatFn(current)}</span>
        <span style={{ color: "#c4c4c4", fontSize: 12 }}> / {formatFn(target || 0)}</span>
      </div>
      <div style={{
        height: 4,
        background: "#e6e9ef",
        borderRadius: 2,
        overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: bgColor,
          borderRadius: 2,
        }} />
      </div>
    </td>
  );
};

// Percentage cell with color
const PercentageCell = ({ pct, color }) => {
  const colors = { green: "#00c875", yellow: "#fdab3d", red: "#e2445c", gray: "#c4c4c4" };
  const bgColor = colors[color] || "#c4c4c4";

  if (pct === null || pct === undefined) {
    return (
      <td style={{ padding: "10px 8px", borderBottom: "1px solid #e6e9ef", textAlign: "center", color: "#c4c4c4" }}>
        -
      </td>
    );
  }

  return (
    <td style={{ padding: "10px 8px", borderBottom: "1px solid #e6e9ef", textAlign: "center" }}>
      <span style={{ fontWeight: 700, fontSize: 13, color: bgColor }}>{pct}%</span>
    </td>
  );
};

// Colored cell component
const ColorCell = ({ value, colorMap, defaultColor }) => {
  if (!value) return <td style={{ padding: 0, borderBottom: "1px solid #e6e9ef" }}><div style={{ padding: "10px 12px", textAlign: "center", color: "#c4c4c4" }}>-</div></td>;

  const bgColor = colorMap?.[value] || defaultColor || "#c4c4c4";
  return (
    <td style={{ padding: 0, borderBottom: "1px solid #e6e9ef" }}>
      <div style={{
        background: bgColor,
        color: "#fff",
        padding: "10px 12px",
        textAlign: "center",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}>
        {value}
      </div>
    </td>
  );
};

// Avatar component
const Avatar = ({ name, size = 28 }) => {
  if (!name) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px dashed #c4c4c4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="#c4c4c4" strokeWidth="2">
          <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>
        </svg>
      </div>
    );
  }

  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const colors = ["#ff642e", "#00c875", "#579bfc", "#a25ddc", "#fdab3d", "#ff158a", "#9cd326", "#00d2d2"];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: colors[colorIndex],
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 600,
      }}
      title={name}
    >
      {initials}
    </div>
  );
};

// Checkbox component
const Checkbox = ({ checked, indeterminate, onClick, color }) => (
  <div
    onClick={onClick}
    style={{
      width: 16,
      height: 16,
      border: `2px solid ${checked || indeterminate ? (color || "#0073ea") : "#c4c4c4"}`,
      borderRadius: 3,
      background: checked ? (color || "#0073ea") : indeterminate ? `${color || "#0073ea"}40` : "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      flexShrink: 0,
    }}
  >
    {(checked || indeterminate) && (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    )}
  </div>
);

// Comments badge
const CommentsBadge = ({ count }) => {
  if (!count) return null;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 2,
      padding: "2px 6px",
      background: "#579bfc",
      borderRadius: 10,
      color: "#fff",
      fontSize: 10,
      fontWeight: 600,
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      {count}
    </div>
  );
};

const GridView = ({ boardData, onCardClick, lastViewed }) => {
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [hoveredRow, setHoveredRow] = useState(null);

  const toggleGroup = (stageKey) => {
    setCollapsedGroups(prev => ({ ...prev, [stageKey]: !prev[stageKey] }));
  };

  const toggleRowSelection = (id, e) => {
    e.stopPropagation();
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleGroupSelection = (stageKey, campaigns, e) => {
    e.stopPropagation();
    const ids = campaigns.map(c => c.id);
    const allSelected = ids.every(id => selectedRows.has(id));
    setSelectedRows(prev => {
      const next = new Set(prev);
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  // Summary stats per group
  const groupStats = useMemo(() => {
    const stats = {};
    STAGE_ORDER.forEach(stageKey => {
      const campaigns = boardData[stageKey] || [];
      stats[stageKey] = {
        green: campaigns.filter(c => c.progress?.color === "green").length,
        yellow: campaigns.filter(c => c.progress?.color === "yellow").length,
        red: campaigns.filter(c => c.progress?.color === "red").length,
        totalDeliverables: campaigns.reduce((sum, c) => sum + (c.posts?.expected || 0), 0),
        totalViews: campaigns.reduce((sum, c) => sum + (c.metrics?.views || 0), 0),
      };
    });
    return stats;
  }, [boardData]);

  return (
    <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", background: "#fff", borderRadius: 8, border: "1px solid #e6e9ef" }}>
      {STAGE_ORDER.map((stageKey) => {
        const config = STAGE_CONFIG[stageKey];
        const campaigns = boardData[stageKey] || [];
        const isCollapsed = collapsedGroups[stageKey];
        const allSelected = campaigns.length > 0 && campaigns.every(c => selectedRows.has(c.id));
        const someSelected = campaigns.some(c => selectedRows.has(c.id));
        const stats = groupStats[stageKey];

        return (
          <div key={stageKey}>
            {/* Group Header */}
            <div
              onClick={() => toggleGroup(stageKey)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "#fff",
                borderBottom: "1px solid #e6e9ef",
                cursor: "pointer",
                userSelect: "none",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <Checkbox
                checked={allSelected}
                indeterminate={!allSelected && someSelected}
                onClick={(e) => toggleGroupSelection(stageKey, campaigns, e)}
                color={config.color}
              />
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2"
                style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              <span style={{ fontSize: 15, fontWeight: 600, color: config.color }}>{config.label}</span>
              <span style={{ fontSize: 12, color: "#676879" }}>{campaigns.length}</span>

              {/* Status summary dots */}
              <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
                {stats.green > 0 && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#676879" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00c875" }}/> {stats.green}
                  </span>
                )}
                {stats.yellow > 0 && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#676879" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fdab3d" }}/> {stats.yellow}
                  </span>
                )}
                {stats.red > 0 && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#676879" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#e2445c" }}/> {stats.red}
                  </span>
                )}
              </div>
            </div>

            {/* Table */}
            {!isCollapsed && campaigns.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 1600, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f5f6f8" }}>
                      <th style={{ width: 40, padding: "10px 8px", borderBottom: "1px solid #d0d4e4", textAlign: "center" }}></th>
                      <th style={{ width: 220, padding: "10px 12px", borderBottom: "1px solid #d0d4e4", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#676879" }}>Name</th>
                      <th style={{ width: 100, padding: "10px 8px", borderBottom: "1px solid #d0d4e4", textAlign: "center", fontSize: 12, fontWeight: 500, color: "#676879" }}>Client Status</th>
                      <th style={{ width: 100, padding: "10px 8px", borderBottom: "1px solid #d0d4e4", textAlign: "center", fontSize: 12, fontWeight: 500, color: "#676879" }}>Stage</th>
                      <th style={{ width: 100, padding: "10px 8px", borderBottom: "1px solid #d0d4e4", textAlign: "center", fontSize: 12, fontWeight: 500, color: "#676879" }}>Health</th>
                      <th style={{ width: 70, padding: "10px 8px", borderBottom: "1px solid #d0d4e4", textAlign: "center", fontSize: 12, fontWeight: 500, color: "#676879" }}>Campaign</th>
                      <th style={{ width: 100, padding: "10px 8px", borderBottom: "1px solid #d0d4e4", textAlign: "center", fontSize: 12, fontWeight: 500, color: "#676879" }}>Contract Length</th>
                      <th style={{ width: 100, padding: "10px 8px", borderBottom: "1px solid #d0d4e4", textAlign: "center", fontSize: 12, fontWeight: 500, color: "#676879" }}>Deliverables</th>
                      <th style={{ width: 120, padding: "10px 8px", borderBottom: "1px solid #d0d4e4", textAlign: "center", fontSize: 12, fontWeight: 500, color: "#676879" }}>Posts</th>
                      <th style={{ width: 60, padding: "10px 8px", borderBottom: "1px solid #d0d4e4", textAlign: "center", fontSize: 12, fontWeight: 500, color: "#676879" }}>Post %</th>
                      <th style={{ width: 130, padding: "10px 8px", borderBottom: "1px solid #d0d4e4", textAlign: "center", fontSize: 12, fontWeight: 500, color: "#676879" }}>Views</th>
                      <th style={{ width: 60, padding: "10px 8px", borderBottom: "1px solid #d0d4e4", textAlign: "center", fontSize: 12, fontWeight: 500, color: "#676879" }}>View %</th>
                      <th style={{ width: 80, padding: "10px 8px", borderBottom: "1px solid #d0d4e4", textAlign: "center", fontSize: 12, fontWeight: 500, color: "#676879" }}>Est End Date</th>
                      <th style={{ width: 50, padding: "10px 8px", borderBottom: "1px solid #d0d4e4", textAlign: "center", fontSize: 12, fontWeight: 500, color: "#676879" }}>Operator</th>
                      <th style={{ width: 50, padding: "10px 8px", borderBottom: "1px solid #d0d4e4", textAlign: "center", fontSize: 12, fontWeight: 500, color: "#676879" }}>Lead CS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => {
                      const isSelected = selectedRows.has(campaign.id);
                      const isHovered = hoveredRow === campaign.id;
                      const hasUnread = campaign.latest_activity_ts && (!lastViewed[campaign.id] || new Date(campaign.latest_activity_ts) > new Date(lastViewed[campaign.id]));

                      const clientStatus = campaign.target_views >= 100000 ? "TOP TIER" : "LOWER TIER";
                      const campaignStage = getCampaignStage(campaign);
                      const healthStatus = getHealthStatus(campaign);
                      const campaignPosition = getCampaignPosition(campaign.progress.pct);
                      const contractLength = getContractLength(campaign.created_at, campaign.estimated_end_date);

                      return (
                        <tr
                          key={campaign.id}
                          onClick={() => onCardClick(campaign)}
                          onMouseEnter={() => setHoveredRow(campaign.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{
                            background: isSelected ? "#e5f4ff" : isHovered ? "#f5f6f8" : "#fff",
                            cursor: "pointer",
                            borderLeft: `4px solid ${config.color}`,
                          }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid #e6e9ef", textAlign: "center" }}>
                            <Checkbox checked={isSelected} onClick={(e) => toggleRowSelection(campaign.id, e)} />
                          </td>

                          {/* Name */}
                          <td style={{ padding: "10px 12px", borderBottom: "1px solid #e6e9ef" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#c4c4c4" strokeWidth="2" style={{ flexShrink: 0 }}>
                                <polyline points="9 18 15 12 9 6"/>
                              </svg>
                              <span style={{ fontWeight: 600, color: "#323338", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {campaign.name}
                              </span>
                              {hasUnread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#e2445c", flexShrink: 0 }}/>}
                              {campaign.creators > 0 && (
                                <span style={{ fontSize: 11, color: "#676879", background: "#f5f6f8", padding: "2px 6px", borderRadius: 10 }}>
                                  {campaign.creators}
                                </span>
                              )}
                              <CommentsBadge count={campaign.comment_count} />
                            </div>
                          </td>

                          {/* Client Status */}
                          <ColorCell value={clientStatus} colorMap={CLIENT_STATUS} />

                          {/* Stage */}
                          <ColorCell value={campaignStage} colorMap={CAMPAIGN_STAGE} />

                          {/* Health */}
                          <ColorCell value={healthStatus} colorMap={HEALTH_STATUS} />

                          {/* Campaign Position */}
                          <ColorCell value={campaignPosition} colorMap={CAMPAIGN_POSITION} />

                          {/* Contract Length */}
                          <ColorCell value={contractLength} colorMap={CONTRACT_LENGTH} />

                          {/* Deliverables */}
                          <ColorCell value={campaign.posts?.expected || "-"} defaultColor={DELIVERABLES_COLOR} />

                          {/* Posts with progress bar */}
                          <ProgressWithValueCell
                            current={campaign.posts?.submitted || 0}
                            target={campaign.posts?.expected || 0}
                            color={campaign.progress.color}
                          />

                          {/* Post % */}
                          <PercentageCell pct={campaign.progress.pct} color={campaign.progress.color} />

                          {/* Views with progress bar */}
                          {(() => {
                            const viewPct = campaign.target_views
                              ? Math.round((campaign.metrics?.views || 0) / campaign.target_views * 100)
                              : null;
                            const viewColor = getViewProgressColor(viewPct);
                            return (
                              <ProgressWithValueCell
                                current={campaign.metrics?.views || 0}
                                target={campaign.target_views}
                                color={viewColor}
                                formatFn={formatNumber}
                              />
                            );
                          })()}

                          {/* View % */}
                          {(() => {
                            const viewPct = campaign.target_views
                              ? Math.round((campaign.metrics?.views || 0) / campaign.target_views * 100)
                              : null;
                            const viewColor = getViewProgressColor(viewPct);
                            return <PercentageCell pct={viewPct} color={viewColor} />;
                          })()}

                          {/* Est End Date */}
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid #e6e9ef", textAlign: "center", fontSize: 13, color: "#676879" }}>
                            {formatDate(campaign.estimated_end_date)}
                          </td>

                          {/* Operator */}
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid #e6e9ef", textAlign: "center" }}>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                              <Avatar name={campaign.cd_name} size={28} />
                            </div>
                          </td>

                          {/* Lead CS */}
                          <td style={{ padding: "10px 8px", borderBottom: "1px solid #e6e9ef", textAlign: "center" }}>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                              <Avatar name={null} size={28} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary Row */}
            {!isCollapsed && campaigns.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #e6e9ef", background: "#fafbfc", gap: 8 }}>
                <div style={{ width: 40 }} />
                <div style={{ width: 220 }} />
                {/* Status summary bars */}
                <div style={{ width: 100, display: "flex", gap: 2, justifyContent: "center" }}>
                  {stats.green > 0 && <div style={{ width: stats.green * 8, height: 8, background: "#00c875", borderRadius: 2 }} />}
                  {stats.yellow > 0 && <div style={{ width: stats.yellow * 8, height: 8, background: "#fdab3d", borderRadius: 2 }} />}
                  {stats.red > 0 && <div style={{ width: stats.red * 8, height: 8, background: "#e2445c", borderRadius: 2 }} />}
                </div>
                <div style={{ flex: 1, display: "flex", gap: 16, paddingLeft: 20, fontSize: 11, color: "#676879" }}>
                  <span><strong>{stats.totalDeliverables.toLocaleString()}</strong> deliverables</span>
                  <span><strong>{formatNumber(stats.totalViews)}</strong> views</span>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isCollapsed && campaigns.length === 0 && (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "#676879", fontSize: 13, borderBottom: "1px solid #e6e9ef" }}>
                No campaigns in {config.label.toLowerCase()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GridView;
