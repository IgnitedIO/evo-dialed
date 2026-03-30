// Dependencies
import { useState, useEffect } from "react";
import heic2any from 'heic2any';

// Style Imports
import styles from "../Home.module.css";

// Component Imports
import PostPopup from "./PostPopup.jsx";

// Icon Imports
import { VIEWS_ICON, LIKES_ICON, COMMENTS_ICON, SHARE_ICON, INSTAGRAM_ICON, TIKTOK_ICON } from "../../../../assets/icons/svg.jsx";

// Helper Functions
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
const formatDate = (date) => {
	return new Date(date).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
};

// HEIC Image Component
const HEICImageComponent = ({
	src, alt,
	className
}) => {
	const [convertedUrl, setConvertedUrl] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		const convertImage = async () => {
			// console.log('HEICImageComponent received src:', src);
			
			try {
				// Check if URL contains .heic before any query parameters
				const isHeic = src?.toLowerCase().includes('.heic?') || src?.toLowerCase().endsWith('.heic');
				// console.log('Is HEIC image:', isHeic);
				
				if (!isHeic) {
					// console.log('Not a HEIC image, using original URL:', src);
					setConvertedUrl(src);
					setLoading(false);
					return;
				}

				// console.log('Attempting to convert HEIC image:', src);
				
				// Fetch the HEIC file
				const response = await fetch(src);
				// console.log('Fetch response status:', response.status);
				
				if (!response.ok) {
					throw new Error(`Failed to fetch image: ${response.status}`);
				}
				
				const blob = await response.blob();
				// console.log('Blob type:', blob.type);
				
				// Convert to JPEG
				const convertedBlob = await heic2any({
					blob,
					toType: "image/jpeg",
					quality: 0.8
				});
				
				// console.log('Conversion successful, blob type:', convertedBlob.type);
				
				// Create object URL
				const url = URL.createObjectURL(convertedBlob);
				setConvertedUrl(url);
			} catch (error) {
				console.error('Error in HEICImageComponent:', error);
				setError(true);
			} finally {
				setLoading(false);
			}
		};

		convertImage();

		// Cleanup object URL when component unmounts
		return () => {
			if (convertedUrl && convertedUrl.startsWith('blob:')) {
				URL.revokeObjectURL(convertedUrl);
			}
		};
	}, [src]);

	// console.log('HEICImageComponent render state:', { loading, error, convertedUrl }); // Debug log

	// if (loading) {
	// 	console.log('Rendering loading state'); // Debug log
	// 	return <div className={styles.imageLoading}>Loading image...</div>;
	// }
	// if (error || !convertedUrl) {
	// 	console.log('Rendering error state:', { error, convertedUrl }); // Debug log
	// 	return <div className={styles.imageError}>Failed to load image</div>;
	// }

	if (loading || error || !convertedUrl) return <></>;
	return <img src={convertedUrl} alt={alt} className={className} />;
};

// Instagram Image Component
const InstagramImageComponent = ({
	src, alt,
	className
}) => {
	const [imageUrl, setImageUrl] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	const fetchImage = async () => {
		try {
			const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(src)}`);
			if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
			const data = await response.json();
			if (!data.contents) throw new Error('No image content received');
			setImageUrl(data.contents);

		} catch (error) {
			console.error('Error in InstagramImageComponent:', error);
			setError(true);
			
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		fetchImage();
		// Cleanup object URL when component unmounts
		return () => {
			if (imageUrl && imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
		};
	}, [src]);

	if (loading || error || !imageUrl) return <></>;
	return <img src={imageUrl} alt={alt} className={className} />;
};

// Post Card Component
export default function CampaignPostCard({
	postId,
	creatorUserPfp,
	creatorUserName,
	creatorSocialPfp,
	creatorSocialHandle,
	creatorSocialDisplayName,
	campaignName,
	postPlatform,
	postThumbnail,
	postCaption,
	postTs,
	postSubmitTs,
	postViews,
	postLikes,
	postComments,
	postShares,
	postUrl,
	showCampaignName = true,
	showCreatorUserAccount = true,
}) {
	return (
		<PostPopup 
			trigger={(<div key={postId} className={styles.postCard}>
				<div className={styles.postContent}>
					{/* Creator Info */}
					<div className={styles.creatorInfo}>
						{/* User Info */}
						{(showCreatorUserAccount) && (
							<div className={styles.userInfo}>
								<img 
									src={creatorUserPfp || "/defaults/u.webp"} 
									alt={creatorUserName || "User"}
									className={styles.userPfp}
								/>
								<span className={styles.userName}>
									{creatorUserName || "Unknown User"}
								</span>
							</div>
						)}
	
						{/* Social Account Info */}
						<div className={styles.socialInfo}>
							<img 
								// src={creatorSocialPfp || "/defaults/u.webp"} 
								src="/defaults/u.webp"
								alt={creatorSocialHandle}
								className={styles.socialPfp}
							/>
							<span className={styles.socialHandle}>
								@{creatorSocialHandle}
							</span>
						</div>

						{(!showCreatorUserAccount) && (
							<div className={styles.platformBadge}>
								{(postPlatform === 'ig') && <>{INSTAGRAM_ICON} Instagram</>}
								{(postPlatform === 'tt') && <>{TIKTOK_ICON} TikTok</>}
								&nbsp;&nbsp;
							</div>
						)}
					</div>
	
					{/* Campaign and Platform Info */}
					{(showCampaignName) &&
						<div className={styles.postHeader}>
							<h3 className={styles.postTitle}>
								{campaignName || ""}
							</h3>
							{(showCreatorUserAccount) && (
								<div className={styles.platformBadge}>
									{(postPlatform === 'ig') && <>{INSTAGRAM_ICON} Instagram</>}
									{(postPlatform === 'tt') && <>{TIKTOK_ICON} TikTok</>}
								</div>
							)}
						</div>
					}
	
					{/* Post Content */}
					<div className={styles.postMain}>
						{postThumbnail && (
							postPlatform === 'tt' ? (
								<HEICImageComponent 
									src={postThumbnail} 
									alt="Post thumbnail"
									className={styles.postThumbnail}
								/>
							) : (
								<InstagramImageComponent 
									src={postThumbnail}
									alt="Post thumbnail"
									className={styles.postThumbnail}
								/>
							)
						)}
						<div className={styles.postDetails}>
							{postCaption && (
								<p className={styles.postCaption}>{postCaption}</p>
							)}
							<div className={styles.postDate}>
								{(!showCampaignName) &&
									<div className={styles.platformBadge}>
										{(postPlatform === 'ig') && <>{INSTAGRAM_ICON} Instagram</>}
										{(postPlatform === 'tt') && <>{TIKTOK_ICON} TikTok</>}
									</div>
								}
								•&nbsp;&nbsp;&nbsp;
								{formatDate(postTs)}
							</div>
						</div>
					</div>
	
					{/* Metrics Grid */}
					<div className={styles.postMetricsGrid} style={{
						borderTop: "1px solid #e9ecef",
						paddingTop: "20px",
						marginTop: "20px",
					}}>
						<div>
							<span className={styles.metricLabel}>{VIEWS_ICON}Views</span>
							<span className={styles.metricValue}>{formatNumber(postViews)}</span>
						</div>
						<div>
							<span className={styles.metricLabel}>{LIKES_ICON}Likes</span>
							<span className={styles.metricValue}>{formatNumber(postLikes)}</span>
						</div>
						<div>
							<span className={styles.metricLabel}>{COMMENTS_ICON}Comments</span>
							<span className={styles.metricValue}>{formatNumber(postComments)}</span>
						</div>
						<div>
							<span className={styles.metricLabel}>{SHARE_ICON}Shares</span>
							<span className={styles.metricValue}>{formatNumber(postShares)}</span>
						</div>
					</div>
				</div>
			</div>)}
			postUrl={postUrl}
		/>
	);
}