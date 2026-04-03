import styles from "../MissionControl.module.css";

const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const describeAction = (entry) => {
  if (entry.action === "status_change") {
    const actor = entry.is_automated ? "System" : (entry.user_name || "Unknown");
    return `${actor} moved campaign from ${entry.from_status} to ${entry.to_status}`;
  }
  if (entry.action === "pause") {
    return `${entry.user_name || "Unknown"} paused the campaign`;
  }
  return `${entry.user_name || "System"}: ${entry.action}`;
};

const ActivityLog = ({ entries }) => {
  if (!entries || entries.length === 0) {
    return <div className={styles.emptyStage}>No activity yet</div>;
  }

  return (
    <div>
      {entries.map((entry) => (
        <div key={`activity-${entry.id}`} className={styles.activityItem}>
          <span className={styles.activityDot} />
          <span>{describeAction(entry)}</span>
          <span style={{ marginLeft: "auto", flexShrink: 0 }}>{formatTime(entry.created_ts)}</span>
        </div>
      ))}
    </div>
  );
};

export default ActivityLog;
