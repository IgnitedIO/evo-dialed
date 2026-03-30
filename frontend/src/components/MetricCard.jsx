import React from 'react';
import styles from './MetricCard.module.css';

export const MetricCard = ({
  icon,
  title,
  value,
  prevValue = null,
  formatValue = (v) => v,
  period,
  showChange = true,
  large = false,
  medium = false
}) => {
  
  const calculateChange = () => {
    // Don't show change if showChange is false
    if (!showChange) return null;
    
    // Don't show change for "all" period
    if (period === "all") return null;
    
    // If both values are 0, show 0% change
    if (value === 0 && prevValue === 0) return 0;
    
    // If previous value is 0 but current is not, show infinity
    if (prevValue === 0 && value !== 0) return Infinity;
    
    // If previous value is null/undefined, show infinity for positive current value
    if (!prevValue) {
      return value > 0 ? Infinity : null;
    }
    
    const change = ((value - prevValue) / prevValue) * 100;
    return isNaN(change) ? Infinity : change;
  };

  const change = calculateChange();
  const formattedValue = formatValue(value);
  
  const getFormattedChange = () => {
    if (change === null) return null;
    if (change === Infinity) return "+∞%";
    if (change === 0) return "+0%";
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const formattedChange = getFormattedChange();

  const getChangeClassName = () => {
    if (change === Infinity || change > 0) return styles.changePositive;
    if (change < 0) return styles.changeNegative;
    return styles.changeNeutral;
  };

  // Render
  if (large) {
    return (
      <div className={styles.largeCard}>
        <h3 className={styles.value}>
          {formattedValue}
        </h3>
        <h3 className={styles.title}>
          {icon}
          {title}
        </h3>
      </div>
    )
  }
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>
        {icon}
        {title}
      </h3>
      <div className={styles.valueRow}>
        <div className={styles.value}>
          {formattedValue}
        </div>
        {(prevValue !== null && formattedChange) && (
          <div className={`${styles.change} ${getChangeClassName()}`}>
            {formattedChange}
          </div>
        )}
      </div>
    </div>
  );
}; 