import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./DateRangePicker.css";

// Icon imports
import { LEFT_ARROW_ICON, RIGHT_ARROW_ICON } from "../../../../assets/icons/svg.jsx";

export default function DateRangePicker({
  value, // [startDate, endDate] array
  onChange, // Callback when date range changes
  minDate = null,
  maxDate = null,
}) {
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="date-range-picker-container">
      <div className="date-range-display">
        <span className="date-range-label">Date Range:</span>
        <span className="date-range-value">
          {value && value[0] && value[1] 
            ? `${formatDate(value[0])} - ${formatDate(value[1])}`
            : 'Select dates'
          }
        </span>
      </div>
      
      <Calendar
        onChange={onChange}
        value={value}
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
          if (!value || !value[0] || !value[1]) return '';
          
          const startTime = value[0].getTime();
          const endTime = value[1].getTime();
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
      
      <div className="date-range-help">
        Click a date to start selection, then click another date to complete the range.
      </div>
    </div>
  );
}