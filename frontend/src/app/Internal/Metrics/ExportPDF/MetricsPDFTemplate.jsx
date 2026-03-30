import React from 'react';
import { createRoot } from 'react-dom/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FaTiktok, FaInstagram } from 'react-icons/fa';
import { VIEWS_ICON, LIKES_ICON, COMMENTS_ICON, SHARE_ICON, POSTS_ICON, RATE_ICON, TIKTOK_ICON, INSTAGRAM_ICON } from "../../../../assets/icons/svg.jsx";

// Import the same styles used in the dashboard
import styles from "../Home.module.css";
import dashboardStyles from "../../Dashboard/Home.module.css";

// Helper function (same as in Home.jsx)
const formatNumber = (num) => {
    console.log("NUM = ", num);
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

// Helper to create icon with proper size
const SizedIcon = ({ icon, size = 25 }) => {
    return (
        <div style={{ 
            width: 'auto', 
            height: `${size}px`, 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {React.cloneElement(icon, { 
                style: { 
                    width: 'auto', 
                    height: '100%' 
                } 
            })}
        </div>
    );
};

// Helper component for images with error handling
const SafeImage = ({ src, alt, fallbackSrc, ...props }) => {
    const [imgSrc, setImgSrc] = React.useState(src);
    const [hasError, setHasError] = React.useState(false);

    const handleError = () => {
        if (!hasError && fallbackSrc && imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
            setHasError(true);
        } else {
            // If fallback also fails or no fallback, show placeholder
            setImgSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMCAyNkMyMy4zMTM3IDI2IDI2IDIzLjMxMzcgMjYgMjBDMjYgMTYuNjg2MyAyMy4zMTM3IDE0IDIwIDE0QzE2LjY4NjMgMTQgMTQgMTYuNjg2MyAxNCAyMEMxNCAyMy4zMTM3IDE2LjY4NjMgMjYgMjAgMjZaIiBmaWxsPSIjQ0NDQ0NDIi8+Cjwvc3ZnPgo=');
        }
    };

    return (
        <img 
            src={imgSrc} 
            alt={alt} 
            onError={handleError}
            {...props}
        />
    );
};

// Helper to create a metric card
const MetricCard = ({ icon, title, value }) => (
    <div style={{
        padding: '25px',
        border: '1px solid var(--brd-light)',
        borderRadius: '8px',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    }}>
        {/* Title with icon */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        }}>
            <SizedIcon icon={icon} />
            <div style={{
                fontFamily: 'Geist, sans-serif',
                fontSize: '15px',
                fontWeight: '400',
                color: '#667'
            }}>{title}</div>
        </div>

        {/* Value (main metric) */}
        <div style={{
            fontFamily: 'Geist, sans-serif',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#000'
        }}>{value}</div>
    </div>
);

const MetricsPDFTemplate = ({ data, period, title }) => {
    const { metrics, performance, creatorPerformance, contentPerformance } = data;

    return (
        <div style={{ 
            width: '100%', 
            padding: '20px', 
            background: 'white',
            fontFamily: 'Geist, sans-serif',
            fontSize: '14px',
            color: '#333'
        }}>
            {/* Header */}
            <div data-section="header" style={{ 
                marginBottom: '32px',
                borderBottom: '1px solid var(--brd-light)',
                paddingBottom: '16px'
            }}>
                <h1 style={{ 
                    fontSize: '28px', 
                    margin: 0,
                    fontFamily: 'Geist, sans-serif',
                    fontWeight: 'bold'
                }}>{title}</h1>
                <div style={{ 
                    fontSize: '14px',
                    color: '#666',
                    marginTop: '8px'
                }}>
                    Period: {period}
                </div>
            </div>

            {/* Metrics Grid */}
            <div data-section="metrics" style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(2, 1fr)", 
                gap: "16px",
                marginBottom: "32px",
                pageBreakAfter: 'always'
            }}>
                <MetricCard
                    icon={POSTS_ICON}
                    title="Total Posts"
                    value={formatNumber(metrics.total_posts)}
                />
                <MetricCard
                    icon={INSTAGRAM_ICON}
                    title="Total Instagram Posts"
                    value={formatNumber(metrics.ig_total_posts)}
                />
                <MetricCard
                    icon={TIKTOK_ICON}
                    title="Total TikTok Posts"
                    value={formatNumber(metrics.tt_total_posts)}
                />
                <MetricCard
                    icon={VIEWS_ICON}
                    title="Total Views"
                    value={formatNumber(metrics.total_views)}
                />
                <MetricCard
                    icon={LIKES_ICON}
                    title="Total Likes"
                    value={formatNumber(metrics.total_likes)}
                />
                <MetricCard
                    icon={COMMENTS_ICON}
                    title="Total Comments"
                    value={formatNumber(metrics.total_comments)}
                />
                <MetricCard
                    icon={SHARE_ICON}
                    title="Total Shares"
                    value={formatNumber(metrics.total_shares)}
                />
                <MetricCard
                    icon={RATE_ICON}
                    title="Engagement Rate"
                    value={`${(metrics.engagement_rate * 100).toFixed(2)}%`}
                />
            </div>

            {/* Performance Graph */}
            <div data-section="performance" style={{ 
                marginBottom: "32px",
                pageBreakAfter: 'always'
            }}>
                <h2 style={{ 
                    fontSize: "20px", 
                    marginBottom: "16px", 
                    fontWeight: "500",
                    fontFamily: 'Geist, sans-serif'
                }}>Performance</h2>
                <div style={{ 
                    background: "white", 
                    borderRadius: "8px", 
                    border: "1px solid var(--brd-light)", 
                    padding: "24px",
                    height: '400px'
                }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performance || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                                formatter={(value, name) => [formatNumber(value), name]}
                                labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            />
                            <Line type="monotone" dataKey="views" name="Views" stroke="#ff5c5c" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="likes" name="Likes" stroke="#1abc9c" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="comments" name="Comments" stroke="#34495e" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="shares" name="Shares" stroke="#f1c40f" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Creator Performance */}
            <div data-section="creators" style={{ 
                marginBottom: "32px",
                pageBreakAfter: 'always'
            }}>
                <h2 style={{ 
                    fontSize: "20px", 
                    marginBottom: "16px", 
                    fontWeight: "500",
                    fontFamily: 'Geist, sans-serif'
                }}>Top Creators</h2>
                <div style={{ display: 'grid', gap: '16px' }}>
                    {creatorPerformance.slice(0, 5).map((creator) => (
                        <div key={creator.id} style={{
                            background: 'white',
                            borderRadius: '8px',
                            border: '1px solid var(--brd-light)',
                            padding: '16px'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px',
                                marginBottom: '12px'
                            }}>
                                <SafeImage 
                                    src={creator.profile_img || "/defaults/u.webp"} 
                                    alt={creator.name}
                                    fallbackSrc="/defaults/u.webp"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <div>
                                    <h3 style={{ 
                                        margin: 0, 
                                        fontSize: '16px',
                                        fontFamily: 'Geist, sans-serif'
                                    }}>{creator.name}</h3>
                                    {creator.social && (
                                        <div style={{ 
                                            fontSize: '12px', 
                                            color: '#666',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <SafeImage 
                                                src={creator.social.pfp ?? "/defaults/u.webp"} 
                                                alt={`${creator.name}'s social profile`}
                                                fallbackSrc="/defaults/u.webp"
                                                style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    borderRadius: '50%'
                                                }}
                                            />
                                            <span>@{creator.social.handle}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '12px'
                            }}>
                                <div>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        color: '#666',
                                        fontSize: '12px'
                                    }}>
                                        <SizedIcon icon={VIEWS_ICON} size={16} />
                                        Views
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                        {formatNumber(creator.total_views)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        color: '#666',
                                        fontSize: '12px'
                                    }}>
                                        <SizedIcon icon={LIKES_ICON} size={16} />
                                        Likes
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                        {formatNumber(creator.total_likes)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        color: '#666',
                                        fontSize: '12px'
                                    }}>
                                        <SizedIcon icon={COMMENTS_ICON} size={16} />
                                        Comments
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                        {formatNumber(creator.total_comments)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        color: '#666',
                                        fontSize: '12px'
                                    }}>
                                        <SizedIcon icon={SHARE_ICON} size={16} />
                                        Shares
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                        {formatNumber(creator.total_shares)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Performance */}
            <div data-section="content" style={{ marginBottom: "32px" }}>
                <h2 style={{ 
                    fontSize: "20px", 
                    marginBottom: "16px", 
                    fontWeight: "500",
                    fontFamily: 'Geist, sans-serif'
                }}>Top Content</h2>
                <div style={{ display: 'grid', gap: '16px' }}>
                    {contentPerformance.slice(0, 5).map((post) => (
                        <div key={post.id} style={{
                            background: 'white',
                            borderRadius: '8px',
                            border: '1px solid var(--brd-light)',
                            padding: '16px'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                gap: '12px',
                                marginBottom: '12px'
                            }}>
                                <SafeImage 
                                    src={post.thumbnail || "/defaults/post.webp"} 
                                    alt="Post thumbnail"
                                    fallbackSrc="/defaults/post.webp"
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '8px',
                                        objectFit: 'cover'
                                    }}
                                />
                                <div>
                                    <h3 style={{ 
                                        margin: 0, 
                                        fontSize: '16px',
                                        fontFamily: 'Geist, sans-serif'
                                    }}>{post.campaign_name || 'Post'}</h3>
                                    <p style={{ 
                                        fontSize: '14px',
                                        color: '#666',
                                        marginTop: '8px'
                                    }}>{post.caption}</p>
                                </div>
                            </div>
                            <div style={{ 
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '12px'
                            }}>
                                <div>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        color: '#666',
                                        fontSize: '12px'
                                    }}>
                                        <SizedIcon icon={VIEWS_ICON} size={16} />
                                        Views
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                        {formatNumber(post.views)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        color: '#666',
                                        fontSize: '12px'
                                    }}>
                                        <SizedIcon icon={LIKES_ICON} size={16} />
                                        Likes
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                        {formatNumber(post.likes)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        color: '#666',
                                        fontSize: '12px'
                                    }}>
                                        <SizedIcon icon={COMMENTS_ICON} size={16} />
                                        Comments
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                        {formatNumber(post.comments)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        color: '#666',
                                        fontSize: '12px'
                                    }}>
                                        <SizedIcon icon={SHARE_ICON} size={16} />
                                        Shares
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                        {formatNumber(post.shares)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Helper function to render the template to a div for PDF generation
export const renderTemplateToDiv = (data, period, title) => {
    const div = document.createElement('div');
    div.style.width = '1200px'; // Fixed width for PDF
    div.style.position = 'absolute';
    div.style.left = '-9999px';
    document.body.appendChild(div);

    // Add font stylesheet
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Transducer Wide:wght@400;500;700&display=swap');
    `;
    div.appendChild(styleSheet);

    const root = createRoot(div);
    root.render(
        <MetricsPDFTemplate 
            data={data} 
            period={period} 
            title={title} 
        />
    );

    return div;
}; 