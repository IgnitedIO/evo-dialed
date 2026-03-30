import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper Functions

const removeEmojis = (text) => {
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]+/gu, '');
};

const formatPeriod = (period) => {
    // Handle custom date range object
    if (typeof period === 'object' && period.startDate && period.endDate) {
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        
        const formatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const startStr = startDate.toLocaleDateString('en-US', formatOptions);
        const endStr = endDate.toLocaleDateString('en-US', formatOptions);
        
        return `${startStr} to ${endStr}`;
    }
    
    // Handle predefined periods
    const periodMap = {
        '24h': 'Last 24 Hours',
        '7d': 'Last 7 Days',
        '30d': 'Last 30 Days',
        '60d': 'Last 60 Days',
        '90d': 'Last 90 Days',
        '6m': 'Last 6 Months',
        'ytd': 'Year to Date',
        'all': 'All Time',
        'custom': 'Custom Range' // Fallback if somehow period is just 'custom'
    };
    return periodMap[period] || period;
};

/**
 * Exports metrics dashboard data to PDF
 * @param {Object} data - The dashboard data to export
 * @param {string|Object} period - The time period of the data (string for predefined periods, object with startDate/endDate for custom)
 * @param {string} title - The title of the export (e.g. "Campaign Metrics", "Creator Metrics", etc.)
 */
export const exportMetricsToPDF = async (data, period, title = "Dashboard Metrics") => {
    try {
        const { metrics, performance, creatorPerformance, contentPerformance } = data;

        // Create PDF with proper dimensions
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20; // mm
        const contentWidth = pageWidth - (margin * 2);

        // Helper function to safely add image to PDF with fallback
        const addImageToPDF = async (imageSrc, x, y, width, height, fallbackText = 'Image') => {
            try {
                // For data URLs (base64), skip validation and add directly
                if (imageSrc.startsWith('data:')) {
                    const format = imageSrc.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
                    pdf.addImage(imageSrc, format, x, y, width, height);
                    return true;
                }

                // For external URLs, try to validate first
                const img = new Image();
                img.crossOrigin = 'anonymous';

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imageSrc;
                });

                // If image loads successfully, add it to PDF
                pdf.addImage(imageSrc, 'PNG', x, y, width, height);
                return true;
            } catch (error) {
                console.warn(`Failed to add image to PDF (${imageSrc.substring(0, 50)}...), using fallback:`, error.message);

                // Use appropriate default image based on fallbackText
                let defaultImage;
                if (fallbackText === 'Thumbnail') {
                    defaultImage = '/defaults/cmp.webp';
                } else if (fallbackText === 'Profile') {
                    defaultImage = '/defaults/u.webp';
                } else {
                    defaultImage = '/defaults/u.webp'; // Generic fallback
                }

                try {
                    // Try to add the default image
                    pdf.addImage(defaultImage, 'PNG', x, y, width, height);
                    return true;
                } catch (fallbackError) {
                    console.warn(`Default image also failed, using placeholder:`, fallbackError.message);

                    // Final fallback: Add a placeholder rectangle with text
                    pdf.setFillColor(240, 240, 240);
                    pdf.rect(x, y, width, height, 'F');
                    pdf.setFontSize(8);
                    pdf.setTextColor(100, 100, 100);
                    pdf.text(fallbackText, x + 2, y + height / 2);
                    return false;
                }
            }
        };

        // Helper function to format week dates
        const formatWeekDates = (weekStart, weekEnd) => {
            const startDate = new Date(weekStart);
            const endDate = new Date(weekEnd);
            
            const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
            const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
            const startDay = startDate.getDate();
            const endDay = endDate.getDate();
            
            if (startMonth === endMonth) {
                return `${startMonth} ${startDay} - ${endDay}`;
            } else {
                return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
            }
        };

        // Helper function to format numbers
        const formatNumber = (num) => {
            if (num === undefined || num === null) return '0';
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1) + 'M';
            }
            if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'K';
            }
            return num.toString();
        };


        // Helper function to add a page number
        const addPageNumber = (pageNum, totalPages) => {
            pdf.setFontSize(10);
            pdf.setTextColor("#E3E3DB");
            pdf.text(
                `Page ${pageNum} of ${totalPages}`,
                pageWidth - margin - 30,
                pageHeight - 10
            );
        };

        // Helper function to add SVG icon to PDF
        const addSVGIcon = (pdf, x, y, svgPath, color = '#000000', size = 12) => {
            pdf.setFillColor(color);
            pdf.setDrawColor(color);
            pdf.path(svgPath, 'F'); // 'F' means fill the path
        };

        // SVG paths for platform icons
        const PLATFORM_ICONS = {
            ig: {
                path: 'M2 2h20v20H2V2zm14 9.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01',
                color: '#D82E72',
                viewBox: { width: 24, height: 24 }
            },
            tt: {
                path: 'M8.45 19.79c.16-1.29.69-2.02 1.69-2.76 1.43-1.01 3.22-.44 3.22-.44v-3.38c.43-.01.87.01 1.3.08v4.34s-1.79-.57-3.22.44c-1 .74-1.53 1.47-1.69 2.76 0 .7.13 1.62.73 2.42-.15-.08-.3-.16-.46-.26-1.34-.9-1.58-2.25-1.57-3.2zm13.58-12.81c-.98-1.08-1.36-2.17-1.49-2.93h1.24s-.25 2.01 1.55 3.98l.03.03c-.49-.31-.93-.67-1.32-1.07zm5.96 3.06v4.26s-1.58-.06-2.75-.36c-1.63-.42-2.68-1.05-2.68-1.05s-.72-.45-.78-.49v8.79c0 .49-.13 1.71-.54 2.73-.53 1.33-1.36 2.21-1.51 2.39 0 0-1 1.18-2.77 1.98-1.59.72-2.99.7-3.41.72 0 0-2.42.1-4.59-1.32-.47-.31-.91-.66-1.31-1.05l.01.01c2.17 1.41 4.59 1.32 4.59 1.32.42-.02 1.82 0 3.41-.72 1.76-.8 2.77-1.98 2.77-1.98.15-.18.98-1.05 1.51-2.39.41-1.02.54-2.24.54-2.73v-8.79c.06.03.78.49.78.49s1.05.64 2.68 1.05c1.17.3 2.75.36 2.75.36v-3.34c.54.12 1 .15 1.3.12z',
                color: '#000000',
                viewBox: { width: 32, height: 32 }
            }
        };

        // Helper function to draw platform pill
        const drawPlatformPill = (pdf, x, y, platform) => {
            const text = platform === 'ig' ? 'Instagram' : 'TikTok';
            pdf.setFontSize(9); // Larger font size
            const textWidth = pdf.getTextWidth(text);
            const width = textWidth + 8; // Add padding
            const height = 8; // Taller pill

            // Set colors based on platform
            if (platform === 'ig') {
                pdf.setFillColor(216, 46, 114); // Instagram pink
            } else if (platform === 'tt') {
                pdf.setFillColor("#30EBE3"); // TikTok black
            }

            // Draw pill shape (rounded rectangle)
            pdf.roundedRect(x, y, width, height, 4, 4, 'F');

            // Add platform text in white
            if (platform === 'ig') {
                pdf.setTextColor("#E3E3DB"); // White text
            } else if (platform === 'tt') {
                pdf.setTextColor("#000000"); // Black text
            }
            pdf.text(text, x + 4, y + height - 3);

            return width; // Return width for spacing
        };

        // PAGE 1: Metrics
        // Add background color
        pdf.setFillColor("#000000");
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        // Add title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor("#E3E3DB");
        pdf.text(title, margin, margin);

        // Add period
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor("#E3E3DB");
        pdf.text(formatPeriod(period), margin, margin + 10);

        // Add metrics in a grid
        const metricsList = [
            { label: 'Total Posts', value: formatNumber(metrics.total_posts) },
            { label: 'Total Instagram Posts', value: formatNumber(metrics.ig_total_posts) },
            { label: 'Total TikTok Posts', value: formatNumber(metrics.tt_total_posts) },
            { label: 'Total Views', value: formatNumber(metrics.total_views) },
            { label: 'Total Likes', value: formatNumber(metrics.total_likes) },
            { label: 'Total Comments', value: formatNumber(metrics.total_comments) },
            { label: 'Total Shares', value: formatNumber(metrics.total_shares) },
            { label: 'Engagement Rate', value: `${(metrics.engagement_rate * 100).toFixed(1)}%` }
        ];

        const cardWidth = (contentWidth - 5) / 2; // Reduced gap from 10 to 5
        const cardHeight = 25;
        let currentX = margin;
        let currentY = margin + 20;

        metricsList.forEach((metric, index) => {
            // Draw card border
            pdf.setDrawColor("#E3E3DB");
            pdf.roundedRect(currentX, currentY, cardWidth, cardHeight, 2, 2);

            // Add label
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
            pdf.setTextColor("#E3E3DB");
            pdf.text(metric.label, currentX + 5, currentY + 8);

            // Add value
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.setTextColor("#E3E3DB");
            pdf.text(metric.value, currentX + 5, currentY + 18);

            // Move to next position
            currentX += cardWidth + 5; // Reduced gap from 10 to 5
            if (index % 2 === 1) {
                currentX = margin;
                currentY += cardHeight + 5; // Reduced gap from 10 to 5
            }
        });

        // Add logo
        const logoWidth = 80;
        const logoHeight = 60;
        const logoX = (pageWidth - logoWidth) / 2;
        const logoY = margin + 185;
        await addImageToPDF("/img/EvoLogo-MoonWhite4.png", logoX, logoY, logoWidth, logoHeight, 'Logo');

        // PAGE 2: Weekly Breakdown (CONDITIONAL - controlled by includeWeeklyBreakdown flag)
        const includeWeeklyBreakdown = data.weeklyBreakdown && data.weeklyBreakdown.length > 0;
        
        if (includeWeeklyBreakdown) {
            pdf.addPage();

            // Add background color
            pdf.setFillColor("#000000");
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');

            // Add title
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(20);
            pdf.setTextColor("#E3E3DB");
            pdf.text('Weekly Breakdown', margin, margin);

            // Add weeklyBreakdown data
            const weeklyData = data.weeklyBreakdown;
            
            // Table dimensions
            const tableStartY = margin + 12;
            const rowHeight = 12;
            const headerHeight = 12;
            
            const weekColWidth = 32;
            const viewsColWidth = 19;
            const likesColWidth = 18;
            const commentsColWidth = 29;
            const sharesColWidth = 22;
            const postsColWidth = 19;
            const engagementColWidth = 25;
            
            // Draw table header
            pdf.setFillColor("#333333");
            pdf.rect(margin, tableStartY, contentWidth, headerHeight, 'F');
            
            // Header text
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12);
            pdf.setTextColor("#E3E3DB");
            
            let currentX = margin + 2;
            pdf.text('Week', currentX, tableStartY + 8);
            currentX += weekColWidth;
            pdf.text('Views', currentX, tableStartY + 8);
            currentX += viewsColWidth;
            pdf.text('Likes', currentX, tableStartY + 8);
            currentX += likesColWidth;
            pdf.text('Comments', currentX, tableStartY + 8);
            currentX += commentsColWidth;
            pdf.text('Shares', currentX, tableStartY + 8);
            currentX += sharesColWidth;
            pdf.text('Posts', currentX, tableStartY + 8);
            currentX += postsColWidth;
            pdf.text('Engagement', currentX, tableStartY + 8);
            
            // Draw data rows
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(11);
            
            weeklyData.forEach((week, index) => {
                const rowY = tableStartY + headerHeight + (index * rowHeight);
                
                // Alternate row colours
                if (index % 2 === 0) {
                    pdf.setFillColor("#1a1a1a");
                } else {
                    pdf.setFillColor("#000000");
                }
                pdf.rect(margin, rowY, contentWidth, rowHeight, 'F');
                
                // Draw row border
                pdf.setDrawColor("#E3E3DB");
                pdf.setLineWidth(0.2);
                pdf.line(margin, rowY, margin + contentWidth, rowY);
                
                let currentX = margin + 2;
                let textY = rowY + 8;
                
                // Metrics
                pdf.setTextColor("#E3E3DB");
                pdf.text(formatWeekDates(week.week_start, week.week_end), currentX, textY);
                currentX += weekColWidth;
                
                pdf.text(formatNumber(week.cumulative_views), currentX, textY);
                currentX += viewsColWidth;
                
                pdf.text(formatNumber(week.cumulative_likes), currentX, textY);
                currentX += likesColWidth;
                
                pdf.text(formatNumber(week.cumulative_comments), currentX, textY);
                currentX += commentsColWidth;
                
                pdf.text(formatNumber(week.cumulative_shares), currentX, textY);
                currentX += sharesColWidth;
                
                pdf.text(formatNumber(week.cumulative_posts), currentX, textY);
                currentX += postsColWidth;
                
                const engagementRate = week.cumulative_engagement_rate ? 
                    `${(week.cumulative_engagement_rate * 100).toFixed(1)}%` : '0%';
                pdf.text(engagementRate, currentX, textY);
            });
            
            // Draw final border
            pdf.setDrawColor("#E3E3DB");
            pdf.setLineWidth(0.2);
            pdf.line(margin, tableStartY + headerHeight + (weeklyData.length * rowHeight), 
                    margin + contentWidth, tableStartY + headerHeight + (weeklyData.length * rowHeight));
        } // End of includeWeeklyBreakdown conditional

        // NEXT PAGE: Performance Graph (PAGE 2 if no weekly breakdown, PAGE 3 if weekly breakdown included)
        pdf.addPage();

        // Add background color
        pdf.setFillColor("#000000");
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        // Add title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor("#E3E3DB");
        pdf.text('Performance', margin, margin);

        // Add performance graph
        try {
            const performanceGraphElement = document.getElementById('performance-graph');
            
            if (performanceGraphElement) {
                const canvas = await html2canvas(performanceGraphElement, {
                    backgroundColor: null,
                    useCORS: true,
                    allowTaint: true,
                    imageTimeout: 10000,
                    logging: false,
                    scale: 2
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.9);

                await addImageToPDF(imgData, margin, margin, contentWidth, 100, 'Chart');
            } else {
                throw new Error('Performance graph element not found in DOM');
            }

            // Chart Legend
            const legendY = margin + 105;
            const legendX = margin + 16;
            const legendSpacing = 38;
            const legendItems = [
                { color: '#ff5c5c', label: 'Views' },
                { color: '#1abc9c', label: 'Likes' },
                { color: '#34495e', label: 'Comments' },
                { color: '#f1c40f', label: 'Shares' }
            ];
            legendItems.forEach((item, i) => {
                pdf.setDrawColor(item.color);
                pdf.setLineWidth(2);
                pdf.line(legendX + i * legendSpacing, legendY, legendX + 12 + i * legendSpacing, legendY);
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(10);
                pdf.setTextColor('#E3E3DB');
                pdf.text(item.label, legendX + 15 + i * legendSpacing, legendY + 1);
            });

        } catch (err) {
            console.warn('Chart capture failed:', err.message);
            // Fallback: Add placeholder for chart
            pdf.setFillColor(240, 240, 240);
            pdf.rect(margin, margin + 15, contentWidth, 80, 'F');
            pdf.setFontSize(12);
            pdf.setTextColor(100, 100, 100);
            pdf.text('Performance chart could not be captured', margin + 10, margin + 55);
        }

        // NEXT PAGE: Top Creators (PAGE 3+ if no weekly breakdown, PAGE 4+ if weekly breakdown included)
        pdf.addPage();

        // Add background color
        pdf.setFillColor("#000000");
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        // Add title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor("#E3E3DB");
        pdf.text('Top Creators', margin, margin);

        currentY = margin + 15;
        for (let index = 0; index < Math.min(creatorPerformance.length, 5); index++) {
            const creator = creatorPerformance[index];

            // Check if we need a new page
            if (currentY > pageHeight - margin) {
                pdf.addPage();

                // Add background color
                pdf.setFillColor("#000000");
                pdf.rect(0, 0, pageWidth, pageHeight, 'F');

                currentY = margin;
            }

            // Draw card border
            const cardHeight = 35;
            pdf.setDrawColor("#E3E3DB");
            pdf.setLineWidth(0.3);
            pdf.roundedRect(margin, currentY, contentWidth, cardHeight, 2, 2);

            let y = currentY + 9;
            let x = margin + 5;

            // Creator Info + pill
            let currentPillX = x - 1;

            creator.platforms.forEach(platform => {
                const pillWidth = drawPlatformPill(
                    pdf,
                    currentPillX,
                    y - 6,
                    platform
                );

                currentPillX += pillWidth + 2;
            });

            // Use safe image function for profile pictures
            await addImageToPDF(creator.social?.pfp ?? "/defaults/u.webp", currentPillX, y - 6, 8, 8, 'Profile');
            pdf.setTextColor("#E3E3DB");
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(11.5);
            pdf.text(`@${creator.social?.handle || ''}`, currentPillX + 12, y - 1);

            const userName = creator.name || 'Unknown User';
            const userNameWidth = pdf.getTextWidth(userName);
            await addImageToPDF(creator.profile_img ?? "/defaults/u.webp", margin + contentWidth - 13, y - 6, 8, 8, 'Profile');
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
            pdf.setTextColor("#E3E3DB");
            pdf.text(userName, margin + contentWidth - userNameWidth - 15, y - 1);

            // Metrics
            const metrics = [
                { label: 'Views', value: formatNumber(creator.total_views) },
                { label: 'Likes', value: formatNumber(creator.total_likes) },
                { label: 'Comments', value: formatNumber(creator.total_comments) },
                { label: 'Shares', value: formatNumber(creator.total_shares) }
            ];
            const metricStartX = x;
            const metricY = y + 12;
            const metricWidth = 32;
            metrics.forEach((metric, i) => {
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(12);
                pdf.setTextColor("#E3E3DB");
                pdf.text(metric.label, metricStartX + i * metricWidth, metricY);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(15);
                pdf.setTextColor("#E3E3DB");
                pdf.text(metric.value, metricStartX + i * metricWidth, metricY + 7);
            });

            currentY += cardHeight + 8;
        }

        // NEXT PAGE: Top Content (PAGE 4+ if no weekly breakdown, PAGE 5+ if weekly breakdown included)
        pdf.addPage();

        // Add background color
        pdf.setFillColor("#000000");
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        // Add title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(20);
        pdf.text('Top Content', margin, margin);

        currentY = margin + 15;
        for (let index = 0; index < Math.min(contentPerformance.length, 5); index++) {
            const post = contentPerformance[index];

            // Check if we need a new page
            if (currentY > pageHeight - margin - 50) {
                pdf.addPage();

                // Add background color
                pdf.setFillColor("#000000");
                pdf.rect(0, 0, pageWidth, pageHeight, 'F');
                currentY = margin;
            }

            // Card border
            const cardHeight = 64;
            pdf.setDrawColor("#E3E3DB");
            pdf.setLineWidth(0.3);
            pdf.roundedRect(margin, currentY, contentWidth, cardHeight, 2, 2);

            let y = currentY + 9;
            let x = margin + 5;

            // Creator Info
            await addImageToPDF(post.creator_pfp ?? "/defaults/u.webp", x, y - 6, 8, 8, 'Profile');
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
            pdf.setTextColor("#E3E3DB");
            pdf.text(post.user_name || 'Unknown User', x + 10, y - 1);
            const handleText = `@${post.creator_handle || ''}`;
            const handleTextWidth = pdf.getTextWidth(handleText);
            await addImageToPDF(post.user_pfp ?? "/defaults/u.webp", margin + contentWidth - handleTextWidth - 15, y - 6, 8, 8, 'Profile');
            pdf.text(handleText, margin + contentWidth - handleTextWidth - 5, y - 1);

            // Horizontal line
            pdf.setDrawColor("#E3E3DB");
            pdf.setLineWidth(0.3);
            pdf.line(margin + 3, y + 4, margin + contentWidth - 3, y + 4);

            // Campaign Name & Platform
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(11);
            pdf.setTextColor("#E3E3DB");
            pdf.text(post.campaign_name || 'Post', x, y + 11);

            let xCoordinate;
            if (post.creator_platform === 'ig') {
                xCoordinate = margin + contentWidth - 25;
            } else if (post.creator_platform === 'tt') {
                xCoordinate = margin + contentWidth - 20;
            }

            const pillWidth = drawPlatformPill(
                pdf,
                xCoordinate,
                y + 6,
                post.creator_platform
            );

            // Thumbnail
            pdf.setDrawColor("#E3E3DB");
            pdf.rect(x, y + 15, 18, 18);
            pdf.setFontSize(7);
            pdf.setTextColor("#E3E3DB");
            if (post.thumbnail) {
                await addImageToPDF(post.thumbnail, x, y + 15, 18, 18, 'Thumbnail');
            }

            // Caption
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12.5);
            pdf.setTextColor("#E3E3DB");
            if (post.caption) {
                const maxCaptionWidth = contentWidth - 35;
                let caption = post.caption;
                let truncated = false;

                caption = removeEmojis(caption);

                while (pdf.getTextWidth(caption) > maxCaptionWidth && caption.length > 0) {
                    caption = caption.slice(0, -1);
                    truncated = true;
                }
                if (truncated && caption.length > 3) {
                    caption = caption.slice(0, -3) + '...';
                }
                pdf.text(caption, x + 22, y + 21);
            }

            // Date
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor("#E3E3DB");
            const date = post.post_ts ? new Date(post.post_ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
            pdf.text(date, x + 22, y + 28);

            // Horizontal line
            pdf.setDrawColor("#E3E3DB");
            pdf.setLineWidth(0.3);
            pdf.line(margin + 3, y + 37, margin + contentWidth - 3, y + 37);

            // Metrics
            const metrics = [
                { label: 'Views', value: formatNumber(post.views) },
                { label: 'Likes', value: formatNumber(post.likes) },
                { label: 'Comments', value: formatNumber(post.comments) },
                { label: 'Shares', value: formatNumber(post.shares) }
            ];
            const metricStartX = x;
            const metricY = y + 44;
            const metricWidth = 32;
            metrics.forEach((metric, i) => {
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(12);
                pdf.setTextColor("#E3E3DB");
                pdf.text(metric.label, metricStartX + i * metricWidth, metricY);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(15);
                pdf.setTextColor("#E3E3DB");
                pdf.text(metric.value, metricStartX + i * metricWidth, metricY + 7);
            });

            currentY += cardHeight + 8;
        }

        // Update total pages and add final page number
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            addPageNumber(i, totalPages);
        }

        // Save the PDF
        // Use 'custom' for filename when period is an object (custom date range)
        const periodForFilename = typeof period === 'object' ? 'custom' : period;
        pdf.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${periodForFilename}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}; 