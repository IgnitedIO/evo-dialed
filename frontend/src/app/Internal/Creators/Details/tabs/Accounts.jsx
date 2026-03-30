// Dependencies
import { useState, useEffect } from 'react';

// Style Imports
import styles from "../Details.module.css";
import dashboardStyles from "../../../../Clients/Dashboard/Dashboard.module.css";

// Icon Imports
import { INSTAGRAM_ICON, TIKTOK_ICON, EXTERNAL_LINK_ICON } from "../../../../../assets/icons/svg.jsx";

// Creator Accounts Tab
export const AccountsTab = ({
	creator
}) => {
	// States
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredAccounts, setFilteredAccounts] = useState(creator.accounts || []);

	// Filter accounts based on search query
	useEffect(() => {
		if (!searchQuery.trim()) {
			setFilteredAccounts(creator.accounts || []);
			return;
		}

		const filtered = (creator.accounts || []).filter(account =>
			account.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
			account.name.toLowerCase().includes(searchQuery.toLowerCase())
		);
		setFilteredAccounts(filtered);
	}, [searchQuery, creator.accounts]);

	// Render
	return (
		<div>
			<div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
				<input
					type="text"
					className={styles.searchBar}
					placeholder="Search accounts..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			<div className={dashboardStyles.campaignsGrid}>
				{filteredAccounts.map((account) => (
					<div
						key={account.handle}
						className={dashboardStyles.campaignCard}
					>
						<div className={dashboardStyles.campaignMeta}>
							<div className={dashboardStyles.platformIcons}>
								{account.platform === 'ig' ? 
									<div className={dashboardStyles.platformIcon}>
										{INSTAGRAM_ICON}
									</div> :
									<div className={dashboardStyles.platformIcon}>
										{TIKTOK_ICON}
									</div>
								}
							</div>
							<div className={dashboardStyles.metaRight}>
								<a 
									href={account.url}
									target="_blank"
									rel="noopener noreferrer"
									className={dashboardStyles.externalLink}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "4px",
										color: "#667",
										textDecoration: "none",
										height: "35px",
										width: "35px",
										border: "1px solid var(--brd-light)",
										borderRadius: "5px",
										display: "flex",
										alignItems: "center",
										justifyContent: "center"
									}}
								>
									{EXTERNAL_LINK_ICON}
								</a>
							</div>
						</div>

						<img 
							src={account.pfp || "/defaults/u.webp"} 
							alt={account.name}
							className={dashboardStyles.creatorImage}
							style={{
								margin: "-20px auto 0 auto"
							}}
						/>

						<div className={dashboardStyles.campaignContent} style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
						}}>
							<h3 className={dashboardStyles.campaignTitle}>{account.name}</h3>
							<p className={dashboardStyles.campaignDescription}>@{account.handle}</p>
							{/* <div className={dashboardStyles.campaignStats} style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center"
							}}>
								<div style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center"
								}}>
									<span className={dashboardStyles.metricLabel}>{POSTS_ICON}Posts</span>
									<span className={dashboardStyles.metricValue}>{formatNumber(account.num_posts)}</span>
								</div>
							</div> */}
						</div>
					</div>
				))}
				{(!filteredAccounts || filteredAccounts.length === 0) && (
					<div style={{ 
						textAlign: "center", 
						padding: "48px", 
						color: "#667",
						background: "white",
						borderRadius: "8px",
						border: "1px solid var(--brd-light)"
					}}>
						{searchQuery ? "No accounts match your search" : "No accounts found"}
					</div>
				)}
			</div>
		</div>
	);
};