// Dependencies
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

// API Imports
import { getPublicCampaignDetails } from "../../../api/public";

// Component Imports
import { InternalMetricsHome } from "../../Internal/Metrics/Home";

// Style Imports
import styles from "../../Internal/Metrics/Home.module.css";


// Public Campaign Metrics Page
export const PublicCampaignMetrics = () => {
	const { shareHash } = useParams();
	const [campaignId, setCampaignId] = useState(null);
	const [campaignName, setCampaignName] = useState(null);

	// Load campaign details when page loads
	const loadCampaignData = async () => {
		try {
			const response = await getPublicCampaignDetails(shareHash);
			if (response.status === 200) {
				setCampaignId(response.data.data.campaign_id);
				setCampaignName(response.data.data.name);
				document.title = `${response.data.data.name} Metrics | Dialed`;
			}
		} catch (error) {
			console.error('Error loading campaign data for title:', error);
		}
	};
	useEffect(() => {
		if (shareHash) loadCampaignData();
		// Cleanup: Reset title when component unmounts
		return () => {
			document.title = 'Dialed';
		};
	}, [shareHash]);

	return (
		<div className={styles.publicContainer}>
			<img 
				src="/img/evo_small_2.webp" 
				alt="Dialed" 
				style={{ 
					display: 'block', 
					margin: '-10px auto 70px auto', 
					width: 'auto', 
					height: '70px' 
				}} 
			/>
			{(campaignId !== null) && (
				<InternalMetricsHome 
					campaignId={campaignId}
					usePublicApi={true}
					hideShareButton={true}
					pageTitle={campaignName}
				/>
			)}
		</div>
	);
};
