import styles from "../MissionControl.module.css";
import ProgressBar from "./ProgressBar";

const formatNumber = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const CampaignCard = ({ campaign, onClick, isDragging, provided, hasUnread }) => {
  const dragProps = provided
    ? { ref: provided.innerRef, ...provided.draggableProps, ...provided.dragHandleProps }
    : {};

  const viewPct = campaign.target_views
    ? Math.round((campaign.metrics.views / campaign.target_views) * 100)
    : null;

  return (
    <div
      {...dragProps}
      className={`${styles.card} ${isDragging ? styles.cardDragging : ""}`}
      onClick={() => onClick(campaign)}
    >
      {/* Header: name + badges */}
      <div className={styles.cardHeader}>
        <div className={styles.cardNameRow}>
          <span className={styles.cardName}>{campaign.name}</span>
          {hasUnread && <span className={styles.unreadDot} />}
        </div>
        <div className={styles.cardBadges}>
          {campaign.cd_name && <span className={styles.cdBadge}>{campaign.cd_name}</span>}
          {campaign.comment_count > 0 && (
            <span className={styles.commentBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {campaign.comment_count}
            </span>
          )}
        </div>
      </div>

      {/* Platform tags */}
      <div className={styles.platformTags}>
        {campaign.supports_ig ? <span className={styles.platformTag}>IG</span> : null}
        {campaign.supports_tt ? <span className={styles.platformTag}>TT</span> : null}
      </div>

      {/* Metrics grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCell}>
          <span className={styles.metricCellLabel}>Posts</span>
          <span className={styles.metricCellValue}>
            {campaign.posts.submitted}<span className={styles.metricCellDenom}>/{campaign.posts.expected}</span>
          </span>
        </div>
        <div className={styles.metricCell}>
          <span className={styles.metricCellLabel}>Views</span>
          <span className={styles.metricCellValue}>
            {formatNumber(campaign.metrics.views)}
            {campaign.target_views && (
              <span className={styles.metricCellDenom}>/{formatNumber(campaign.target_views)}</span>
            )}
          </span>
        </div>
        <div className={styles.metricCell}>
          <span className={styles.metricCellLabel}>Post %</span>
          <span className={`${styles.metricCellValue} ${styles[`metricColor_${campaign.progress.color}`]}`}>
            {campaign.progress.pct}%
          </span>
        </div>
        <div className={styles.metricCell}>
          <span className={styles.metricCellLabel}>View %</span>
          <span className={`${styles.metricCellValue} ${viewPct !== null ? styles[`metricColor_${viewPct >= 100 ? 'green' : viewPct >= 50 ? 'yellow' : 'red'}`] : ''}`}>
            {viewPct !== null ? `${viewPct}%` : "\u2014"}
          </span>
        </div>
      </div>

      {/* Engagement row */}
      <div className={styles.engagementRow}>
        <span className={styles.engagementItem} title="Likes">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          {formatNumber(campaign.metrics.likes)}
        </span>
        <span className={styles.engagementItem} title="Comments">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          {formatNumber(campaign.metrics.comments)}
        </span>
        <span className={styles.engagementItem} title="Shares">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
          {formatNumber(campaign.metrics.shares)}
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar pct={campaign.progress.pct} color={campaign.progress.color} />

      {/* Footer */}
      <div className={styles.cardFooter}>
        <span>{campaign.creators} creator{campaign.creators !== 1 ? "s" : ""}</span>
        <span className={styles.estDate}>
          Est. {formatDate(campaign.estimated_end_date)}
        </span>
      </div>
    </div>
  );
};

export default CampaignCard;
