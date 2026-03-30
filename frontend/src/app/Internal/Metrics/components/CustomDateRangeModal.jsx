import React, { useState } from "react";
import Popup from "reactjs-popup";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./DateRangePicker.css";
import styles from "./customDateRangeModal.module.css";

export default function CustomDateRangeModal({
  isOpen,
  onClose,
  initialValue, // [startDate, endDate] array
  onApply, // Callback when apply is clicked with valid date range
  minDate = null,
  maxDate = null,
}) {
  const [selectedRange, setSelectedRange] = useState(initialValue || null);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleApply = () => {
    if (selectedRange && selectedRange[0] && selectedRange[1]) {
      onApply(selectedRange);
      onClose();
    }
  };

  const handleCancel = () => {
    // Reset to initial value
    setSelectedRange(initialValue || null);
    onClose();
  };

  const handleCalendarChange = (value) => {
    setSelectedRange(value);
  };

  return (
    <Popup
      open={isOpen}
      onClose={handleCancel}
      modal
      closeOnDocumentClick={false}
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Select Date Range</h3>
          <button 
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m7 7 5 5m0 0 5 5m-5-5 5-5m-5 5-5 5"/>
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.dateRangeDisplay}>
            <span className={styles.dateRangeLabel}>Selected Range:</span>
            <span className={styles.dateRangeValue}>
              {selectedRange && selectedRange[0] && selectedRange[1] 
                ? `${formatDate(selectedRange[0])} - ${formatDate(selectedRange[1])}`
                : 'Please select a date range'
              }
            </span>
          </div>

          <Calendar
            onChange={handleCalendarChange}
            value={selectedRange}
            selectRange={true}
            minDate={minDate}
            maxDate={maxDate || new Date()}
            prevLabel={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m15 19-7-7 7-7"/>
              </svg>
            }
            nextLabel={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m9 19 7-7-7-7"/>
              </svg>
            }
            prev2Label={null}
            next2Label={null}
            formatShortWeekday={(locale, date) => date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
            tileClassName={({ date, view }) => {
              if (!selectedRange || !selectedRange[0] || !selectedRange[1]) return '';
              
              const startTime = selectedRange[0].getTime();
              const endTime = selectedRange[1].getTime();
              const dateTime = date.getTime();
              
              if (dateTime === startTime || dateTime === endTime) {
                return 'date-range-picker-selected';
              }
              
              if (dateTime > startTime && dateTime < endTime) {
                return 'date-range-picker-in-range';
              }
              
              return '';
            }}
          />
          
          {/* <div className={styles.dateRangeHelp}>
            Click a date to start selection, then click another date to complete the range.
          </div> */}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!selectedRange || !selectedRange[0] || !selectedRange[1]}
            className={styles.applyButton}
          >
            Apply
          </button>
        </div>
      </div>
    </Popup>
  );
}