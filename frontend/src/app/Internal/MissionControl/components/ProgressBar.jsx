import styles from "../MissionControl.module.css";

const ProgressBar = ({ pct, color }) => {
  const colorClass =
    color === "green" ? styles.progressGreen :
    color === "yellow" ? styles.progressYellow :
    styles.progressRed;

  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${colorClass}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className={styles.progressLabel}>
        <span>{pct}% complete</span>
        <span>{color === "green" ? "On track" : color === "yellow" ? "Slightly behind" : "Behind"}</span>
      </div>
    </div>
  );
};

export default ProgressBar;
