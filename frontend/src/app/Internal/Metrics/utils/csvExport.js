/**
 * Format date to "Month Day Year" format
 * @param {string} dateStr - Date string in any format
 * @returns {string} Formatted date string
 */
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day} ${year}`;
};

/**
 * Convert array of data objects to CSV string
 * @param {Array} data - Array of data objects
 * @returns {string} CSV formatted string
 */
const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    // CSV headers
    const headers = ['Date', 'Views', 'Likes', 'Comments', 'Shares'];
    
    // Convert data to CSV rows
    const rows = data.map(item => {
        return [
            formatDate(item.date),
            item.views || 0,
            item.likes || 0,
            item.comments || 0,
            item.shares || 0
        ].join(',');
    });
    
    // Combine headers and rows
    return [headers.join(','), ...rows].join('\n');
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Name of the file to download
 */
const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
};

/**
 * Generate filename for CSV export
 * @param {string} campaignName - Campaign name (optional)
 * @param {string} creatorName - Creator name (optional)
 * @returns {string} Generated filename
 */
const generateFilename = (campaignName = null, creatorName = null) => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    let prefix = 'All_Metrics';
    if (campaignName) {
        // Clean campaign name for filename (remove special characters)
        prefix = campaignName.replace(/[^a-zA-Z0-9]/g, '_');
    } else if (creatorName) {
        // Clean creator name for filename
        prefix = creatorName.replace(/[^a-zA-Z0-9]/g, '_');
    }
    
    return `${prefix}_Metrics_${dateStr}.csv`;
};

/**
 * Export metrics data to CSV
 * @param {Array} data - Performance graph data
 * @param {string} campaignName - Campaign name (optional)
 * @param {string} creatorName - Creator name (optional)
 */
export const exportMetricsToCSV = (data, campaignName = null, creatorName = null) => {
    try {
        const csvContent = convertToCSV(data);
        const filename = generateFilename(campaignName, creatorName);
        downloadCSV(csvContent, filename);
        return { success: true };
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        return { success: false, error: error.message };
    }
};