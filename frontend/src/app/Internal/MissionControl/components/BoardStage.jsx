import { Droppable, Draggable } from "@hello-pangea/dnd";
import styles from "../MissionControl.module.css";
import CampaignCard from "./CampaignCard";

const STAGE_LABELS = {
  onboarding: "Onboarding",
  active: "Active",
  renewal: "Up for Renewal",
  renewed: "Renewed",
  relaunch: "Relaunch",
  paused: "Paused",
};

const BoardStage = ({ stageKey, campaigns, onCardClick, lastViewed }) => {
  return (
    <div className={styles.stage}>
      <div className={styles.stageHeader}>
        <span className={styles.stageTitle}>{STAGE_LABELS[stageKey] || stageKey}</span>
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
              <div className={styles.emptyStage}>No campaigns</div>
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
