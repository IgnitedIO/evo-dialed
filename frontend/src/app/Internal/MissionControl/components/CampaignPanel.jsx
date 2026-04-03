import { useEffect, useState } from "react";
import styles from "../MissionControl.module.css";
import ProgressBar from "./ProgressBar";
import CommentThread from "./CommentThread";
import ActivityLog from "./ActivityLog";
import RenewalChecklist from "./RenewalChecklist";
import {
  getMCComments,
  addMCComment,
  deleteMCComment,
  getMCChecklist,
  updateMCChecklistItem,
  updateCampaignBoardStatus,
  pauseMCCampaign,
} from "../../../../api/internal";

const ALL_STAGES = ["onboarding", "active", "renewal", "renewed", "relaunch"];

const STATUS_LABEL = {
  onboarding: "Onboarding",
  active: "Active",
  renewal: "Up for Renewal",
  renewed: "Renewed",
  relaunch: "Relaunch",
  paused: "Paused",
};

const STATUS_CLASS = {
  active: styles.statusActive,
  onboarding: styles.statusOnboarding,
  renewal: styles.statusRenewal,
  renewed: styles.statusRenewed,
  relaunch: styles.statusRelaunch,
  paused: styles.statusPaused,
};

const formatNumber = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

const CampaignPanel = ({ campaign, onClose, onBoardRefresh }) => {
  const [tab, setTab] = useState("details");
  const [comments, setComments] = useState([]);
  const [checklist, setChecklist] = useState({ items: [], all_complete: false });
  const [loading, setLoading] = useState(false);

  // Load comments & checklist when campaign changes
  useEffect(() => {
    if (!campaign) return;
    loadComments();
    if (campaign.status === "renewed" || campaign.status === "relaunch") {
      loadChecklist();
    }
  }, [campaign?.id]);

  const loadComments = async () => {
    const resp = await getMCComments(campaign.id);
    if (resp.status === 200) setComments(resp.data);
  };

  const loadChecklist = async () => {
    const resp = await getMCChecklist(campaign.id);
    if (resp.status === 200) setChecklist(resp.data);
  };

  const handleAddComment = async (content) => {
    await addMCComment(campaign.id, content);
    await loadComments();
  };

  const handleDeleteComment = async (commentId) => {
    await deleteMCComment(campaign.id, commentId);
    await loadComments();
  };

  const handleToggleChecklist = async (itemId, isComplete) => {
    const resp = await updateMCChecklistItem(campaign.id, itemId, isComplete);
    if (resp.status === 200) {
      setChecklist((prev) => ({
        ...prev,
        all_complete: resp.data.all_complete,
        items: prev.items.map((i) =>
          i.id === itemId ? { ...i, is_complete: isComplete ? 1 : 0 } : i
        ),
      }));
    }
  };

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    const resp = await updateCampaignBoardStatus(campaign.id, newStatus);
    setLoading(false);
    if (resp.status === 200) {
      onBoardRefresh();
      onClose();
    }
  };

  const handlePause = async () => {
    setLoading(true);
    const resp = await pauseMCCampaign(campaign.id);
    setLoading(false);
    if (resp.status === 200) {
      onBoardRefresh();
      onClose();
    }
  };

  if (!campaign) return null;

  const moveTargets = ALL_STAGES.filter((s) => s !== campaign.status);
  const commentEntries = comments.filter((e) => e.type === "comment");
  const activityEntries = comments.filter((e) => e.type === "activity");

  return (
    <>
      <div className={styles.panelOverlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>{campaign.name}</span>
          <button className={styles.panelClose} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.panelBody}>
          {/* Status & Actions */}
          <div className={styles.panelSection}>
            <div className={styles.panelSectionTitle}>Status</div>
            <span className={`${styles.statusBadge} ${STATUS_CLASS[campaign.status] || ""}`}>
              {STATUS_LABEL[campaign.status] || campaign.status}
            </span>

            <div className={styles.panelActions}>
              <div className={styles.panelSectionTitle} style={{ marginTop: 12, marginBottom: 4 }}>Move to</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {moveTargets.map((s) => (
                  <button
                    key={s}
                    className={styles.actionBtn}
                    onClick={() => handleStatusChange(s)}
                    disabled={loading}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
              {campaign.status !== "paused" && (
                <button
                  className={styles.actionBtnDanger}
                  onClick={handlePause}
                  disabled={loading}
                  style={{ marginTop: 8 }}
                >
                  Pause Campaign
                </button>
              )}
              {campaign.status === "paused" && (
                <button
                  className={styles.actionBtn}
                  onClick={() => handleStatusChange("active")}
                  disabled={loading}
                  style={{ marginTop: 8 }}
                >
                  Resume Campaign
                </button>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className={styles.panelSection}>
            <div className={styles.panelSectionTitle}>Metrics</div>
            <div className={styles.cardMetrics}>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Posts</span>
                <span className={styles.metricValue}>
                  {campaign.posts.submitted} / {campaign.posts.expected}
                </span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Views</span>
                <span className={styles.metricValue}>{formatNumber(campaign.metrics.views)}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Likes</span>
                <span className={styles.metricValue}>{formatNumber(campaign.metrics.likes)}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Comments</span>
                <span className={styles.metricValue}>{formatNumber(campaign.metrics.comments)}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Shares</span>
                <span className={styles.metricValue}>{formatNumber(campaign.metrics.shares)}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Creators</span>
                <span className={styles.metricValue}>{campaign.creators}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Velocity</span>
                <span className={styles.metricValue}>{campaign.velocity} posts/day</span>
              </div>
            </div>
            <ProgressBar pct={campaign.progress.pct} color={campaign.progress.color} />
          </div>

          {/* Dates */}
          <div className={styles.panelSection}>
            <div className={styles.panelSectionTitle}>Dates</div>
            <div className={styles.cardMetrics}>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Start</span>
                <span className={styles.metricValue}>{formatDate(campaign.start_date)}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>End</span>
                <span className={styles.metricValue}>{formatDate(campaign.end_date)}</span>
              </div>
              <div className={styles.metricRow}>
                <span className={styles.metricLabel}>Est. Completion</span>
                <span className={styles.metricValue}>{formatDate(campaign.estimated_end_date)}</span>
              </div>
            </div>
          </div>

          {/* Renewal Checklist (only for renewed/relaunch) */}
          {(campaign.status === "renewed" || campaign.status === "relaunch") && (
            <div className={styles.panelSection}>
              <div className={styles.panelSectionTitle}>Renewal Checklist</div>
              <RenewalChecklist
                items={checklist.items}
                allComplete={checklist.all_complete}
                onToggle={handleToggleChecklist}
              />
            </div>
          )}

          {/* Tabs: Comments / Activity */}
          <div className={styles.panelSection}>
            <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
              <span
                className={styles.panelSectionTitle}
                style={{
                  cursor: "pointer",
                  color: tab === "details" ? "var(--main-hl, #C6620D)" : "#999",
                  borderBottom: tab === "details" ? "2px solid var(--main-hl, #C6620D)" : "none",
                  paddingBottom: 4,
                }}
                onClick={() => setTab("details")}
              >
                Comments
              </span>
              <span
                className={styles.panelSectionTitle}
                style={{
                  cursor: "pointer",
                  color: tab === "activity" ? "var(--main-hl, #C6620D)" : "#999",
                  borderBottom: tab === "activity" ? "2px solid var(--main-hl, #C6620D)" : "none",
                  paddingBottom: 4,
                }}
                onClick={() => setTab("activity")}
              >
                Activity
              </span>
            </div>

            {tab === "details" ? (
              <CommentThread
                comments={commentEntries}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
              />
            ) : (
              <ActivityLog entries={activityEntries} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CampaignPanel;
