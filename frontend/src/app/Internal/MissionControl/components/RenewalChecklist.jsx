import styles from "../MissionControl.module.css";

const formatTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const RenewalChecklist = ({ items, allComplete, onToggle }) => {
  if (!items || items.length === 0) {
    return <div className={styles.emptyStage}>No checklist items</div>;
  }

  return (
    <div>
      {items.map((item) => (
        <div key={item.id} className={styles.checklistItem}>
          <input
            type="checkbox"
            checked={!!item.is_complete}
            onChange={() => onToggle(item.id, !item.is_complete)}
          />
          <span className={item.is_complete ? styles.checklistComplete : ""}>
            {item.label}
          </span>
          {item.is_complete && item.completed_by_name && (
            <span className={styles.checklistMeta}>
              {item.completed_by_name} · {formatTime(item.completed_ts)}
            </span>
          )}
        </div>
      ))}
      {allComplete && (
        <div style={{ marginTop: 12, fontSize: 12, color: "#2e7d32", fontWeight: 600 }}>
          All items complete — ready to relaunch
        </div>
      )}
    </div>
  );
};

export default RenewalChecklist;
