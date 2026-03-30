/**
 * Convert UTC timestamp to EST/EDT date string
 * @param {string|Date} utcTimestamp - UTC timestamp
 * @returns {string} Date string in YYYY-MM-DD format in EST/EDT
 */
function convertUTCToESTDate(utcTimestamp) {
    const utcDate = new Date(utcTimestamp);
    
    // Get the date in EST/EDT by using the timezone offset
    const estDate = new Date(utcDate.toLocaleString("en-US", {
        timeZone: "America/New_York"
    }));
    
    // Format as YYYY-MM-DD
    const year = estDate.getFullYear();
    const month = String(estDate.getMonth() + 1).padStart(2, '0');
    const day = String(estDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Check if a UTC timestamp falls on a specific EST/EDT date
 * @param {string|Date} utcTimestamp - UTC timestamp
 * @param {string} targetDate - Target date in YYYY-MM-DD format
 * @returns {boolean} True if the timestamp falls on the target date in EST/EDT
 */
function isTimestampOnESTDate(utcTimestamp, targetDate) {
    const estDateString = convertUTCToESTDate(utcTimestamp);
    return estDateString === targetDate;
}

/**
 * Convert Unix timestamp to Eastern time datetime string
 * @param {number} unixTimestamp - Unix timestamp in seconds
 * @returns {string} Datetime string in YYYY-MM-DD HH:MM:SS format in Eastern time
 */
function convertUnixToEasternDateTime(unixTimestamp) {
    if (!unixTimestamp) return null;
    
    // Convert Unix timestamp (seconds) to milliseconds
    const utcDate = new Date(unixTimestamp * 1000);
    
    // Convert to Eastern time
    const easternDate = new Date(utcDate.toLocaleString("en-US", {
        timeZone: "America/New_York"
    }));
    
    // Format as YYYY-MM-DD HH:MM:SS
    const year = easternDate.getFullYear();
    const month = String(easternDate.getMonth() + 1).padStart(2, '0');
    const day = String(easternDate.getDate()).padStart(2, '0');
    const hours = String(easternDate.getHours()).padStart(2, '0');
    const minutes = String(easternDate.getMinutes()).padStart(2, '0');
    const seconds = String(easternDate.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = {
    convertUTCToESTDate,
    isTimestampOnESTDate,
    convertUnixToEasternDateTime
}; 