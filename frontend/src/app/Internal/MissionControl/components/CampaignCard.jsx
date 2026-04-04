import styles from "../MissionControl.module.css";
import ProgressBar from "./ProgressBar";

// Platform icons
const InstagramIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

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
        {!!campaign.supports_ig && (
          <span className={`${styles.platformTag} ${styles.platformIG}`}>
            <InstagramIcon /> Instagram
          </span>
        )}
        {!!campaign.supports_tt && (
          <span className={`${styles.platformTag} ${styles.platformTT}`}>
            <TikTokIcon /> TikTok
          </span>
        )}
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
