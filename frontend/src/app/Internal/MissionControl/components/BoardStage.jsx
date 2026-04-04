import { Droppable, Draggable } from "@hello-pangea/dnd";
import styles from "../MissionControl.module.css";
import CampaignCard from "./CampaignCard";

const STAGE_CONFIG = {
  onboarding: {
    label: "Onboarding",
    color: "#3b82f6",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  renewal: {
    label: "Up for Renewal",
    color: "#f59e0b",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  renewed: {
    label: "Renewed",
    color: "#8b5cf6",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    ),
  },
  relaunch: {
    label: "Relaunch",
    color: "#06b6d4",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
      </svg>
    ),
  },
  paused: {
    label: "Paused",
    color: "#ef4444",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="4" width="4" height="16"/>
        <rect x="14" y="4" width="4" height="16"/>
      </svg>
    ),
  },
};

const BoardStage = ({ stageKey, campaigns, onCardClick, lastViewed }) => {
  const config = STAGE_CONFIG[stageKey] || { label: stageKey, color: "#6b7280", icon: null };

  return (
    <div className={styles.stage}>
      <div className={styles.stageHeader} style={{ borderTopColor: config.color }}>
        <div className={styles.stageHeaderLeft}>
          <span className={styles.stageIcon} style={{ background: config.color }}>
            {config.icon}
          </span>
          <span className={styles.stageTitle}>{config.label}</span>
        </div>
        <span className={styles.stageCount}>{campaigns.length}</span>
      </div>
      <Droppable droppableId={stageKey}>
        {(droppableProvided, droppableSnapshot) => (
          <div
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
            className={`${styles.stageCards} ${droppableSnapshot.isDraggingOver ? styles.stageCardsDragOver : ""}`}
          >
            {campaigns.length === 0 && !droppableSnapshot.isDraggingOver ? (
              <div className={styles.emptyStage}>
                <span className={styles.emptyStageIcon} style={{ color: config.color }}>
                  {config.icon}
                </span>
                <span>No campaigns</span>
              </div>
            ) : (
              campaigns.map((c, index) => (
                <Draggable key={c.id} draggableId={`campaign-${c.id}`} index={index}>
                  {(draggableProvided, draggableSnapshot) => (
                    <CampaignCard
                      campaign={c}
                      onClick={onCardClick}
                      isDragging={draggableSnapshot.isDragging}
                      provided={draggableProvided}
                      hasUnread={
                        c.latest_activity_ts &&
                        (!lastViewed[c.id] || new Date(c.latest_activity_ts) > new Date(lastViewed[c.id]))
                      }
                    />
                  )}
                </Draggable>
              ))
            )}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default BoardStage;
