// Dependencies
import { useState, useEffect } from "react";

// Component Imports
import AssignCreatorsModal from "../modals/AssignCreators";
import ManageCreatorModal from "../modals/ManageCreator";
import AddCreatorsModal from "../modals/AddCreators";
import PostsModal from "../modals/PostsModal";
import CreatorCalendar from "../components/CreatorCalendar";

// Style Imports
import styles from "../Details.module.css";
import dashboardStyles from "../../../Dashboard/Home.module.css";
import metricsStyles from "../../../Metrics/Home.module.css";

// Icon Imports
import { 
	INSTAGRAM_ICON, 
	TIKTOK_ICON,
	POSTS_ICON
} from "../../../../../assets/icons/svg";
import { FaTiktok, FaInstagram } from 'react-icons/fa';

// API Imports
import { getCreatorDailyPosts, getPostsOnDate } from "../../../../../api/internal";

// Helper Functions
// const calculateAssignedPosts = (creator) => {
// 	if (!creator.start_date || !creator.end_date || !creator.frequency || !creator.num_posts) {
// 		return creator.num_posts || 0;
// 	}

// 	const startDate = new Date(creator.start_date);
// 	const endDate = new Date(creator.end_date);
// 	const today = new Date();
	
// 	// Use the minimum of today and end date
// 	const effectiveEndDate = endDate < today ? endDate : today;
	
// 	// Calculate days between dates (inclusive)
// 	const daysDiff = Math.ceil((effectiveEndDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
	
// 	// Ensure we don't count negative days (if start date is in the future)
// 	const validDaysDiff = Math.max(0, daysDiff);
	
// 	// Calculate posts based on frequency
// 	switch (creator.frequency.toLowerCase()) {
// 		case 'daily':
// 			return creator.num_posts * validDaysDiff;
// 		case 'weekly':
// 			return creator.num_posts * Math.ceil(validDaysDiff / 7);
// 		case 'monthly':
// 			return creator.num_posts * Math.ceil(validDaysDiff / 30);
// 		default:
// 			return creator.num_posts;
// 	}
// };

const getPlatformIcons = (platforms) => {
	const icons = [];
	if (platforms?.instagram) {
		icons.push(
			<div key="instagram" className={dashboardStyles.platformIcon}>
				{INSTAGRAM_ICON}
			</div>
		);
	}
	if (platforms?.tiktok) {
		icons.push(
			<div key="tiktok" className={dashboardStyles.platformIcon}>
				{TIKTOK_ICON}
			</div>
		);
	}
	return icons;
};

// Creators Tab Component
export default function CreatorsTab({
	campaign,
	onUpdate
}) {
	// States
	const [showAddModal, setShowAddModal] = useState(false);
	const [showAssignModal, setShowAssignModal] = useState(false);
	const [showManageModal, setShowManageModal] = useState(false);
	const [selectedCreator, setSelectedCreator] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredCreators, setFilteredCreators] = useState(campaign.assignments || []);
	const [showCalendarModal, setShowCalendarModal] = useState(false);
	const [dailyPosts, setDailyPosts] = useState([]);
	const [showPostsModal, setShowPostsModal] = useState(false);
	const [selectedDate, setSelectedDate] = useState(null);
	const [datePosts, setDatePosts] = useState([]);
	const [loadingPosts, setLoadingPosts] = useState(false);

	// Handle search
	useEffect(() => {
		if (!searchQuery.trim()) {
			setFilteredCreators(campaign.assignments || []);
			return;
		}
		const filtered = (campaign.assignments || []).filter(creator =>
			creator.account?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			creator.account?.handle?.toLowerCase().includes(searchQuery.toLowerCase())
		);
		setFilteredCreators(filtered);
	}, [searchQuery, campaign.assignments]);

	// Handle creator click
	const handleCreatorClick = async (creator) => {
		setSelectedCreator(creator);
		setShowCalendarModal(true);
		try {
			const dailyPosts = await getCreatorDailyPosts(creator.id, campaign.id);
			setDailyPosts(dailyPosts);
		} catch (err) {
			console.error('Failed to fetch daily posts', err);
		}
	};

	// Handle date click
	const handleDateClick = async (date, creatorId, campaignId) => {
		setSelectedDate(date);
		setLoadingPosts(true);
		setShowPostsModal(true);
		
		try {
			const posts = await getPostsOnDate(creatorId, date, campaignId);
			setDatePosts(posts);
		} catch (err) {
			console.error('Failed to fetch posts for date', err);
			setDatePosts([]);
		} finally {
			setLoadingPosts(false);
		}
	};

	// Render
	return (
		<div>
			<div className={styles.creatorsHeader}>
				<input
					type="text"
					className={styles.searchBar}
					placeholder="Search creators..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				{/* <button
					onClick={() => setShowAssignModal(true)}
					className={styles.assignCreatorsButton}
				>
					Assign Creators
				</button> */}
				<button
					onClick={() => setShowAddModal(true)}
					// className={styles.addAccountsButton}
					className="createButton"
				>
					Add Accounts
				</button>
			</div>

			{/* Creators List */}
			<div className={metricsStyles.creatorPerformanceList}>
        {filteredCreators.map((creator) => {
          return (
            <div
              key={creator.id}
              className={`${metricsStyles.creatorCard} ${styles.creatorCardClickable}`}
              onClick={() => handleCreatorClick(creator)}
            >
              <div className={metricsStyles.creatorHeader}>
                <img
                  src={creator.account.pfp || "/defaults/u.webp"}
                  alt={creator.account.display_name || creator.account.handle}
                  className={metricsStyles.creatorProfileImage}
                />
                <h3 className={metricsStyles.creatorName}>
                  {creator.account.display_name || creator.account.handle}
                </h3>
                <div className={metricsStyles.creatorSocialInfo}>
                  <img
                    src={creator.account.pfp || "/defaults/u.webp"}
                    alt={`${
                      creator.account.display_name || creator.account.handle
                    }'s social profile`}
                    className={metricsStyles.creatorSocialPfp}
                  />
                  <span className={metricsStyles.creatorHandle}>
                    @{creator.account.handle}
                  </span>
                </div>
                <div className={metricsStyles.platformIcons}>
                  {creator.account.platform == "ig" && (
                    <FaInstagram style={{ color: "#E1306C" }} />
                  )}
                  {creator.account.platform == "tt" && (
                    <FaTiktok style={{ color: "#000000" }} />
                  )}
                </div>
              </div>
              <div
                className={`${dashboardStyles.postMetricsGrid} ${dashboardStyles.autogrid}`}
              >
                <div>
                  <span className={dashboardStyles.metricLabel}>
                    {POSTS_ICON}Posted
                  </span>
                  <span className={dashboardStyles.metricValue}>
                    {creator.submitted}
                  </span>
                </div>
                <div>
                  <span className={dashboardStyles.metricLabel}>
                    {POSTS_ICON}Assigned
                  </span>
                  <span className={dashboardStyles.metricValue}>
                    {creator.total_assigned_posts}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {(!filteredCreators || filteredCreators.length === 0) && (
          <div className={metricsStyles.noDataMessage}>
            {searchQuery
              ? "No creators match your search"
              : "No creators assigned"}
          </div>
        )}
      </div>

			<AssignCreatorsModal
				isOpen={showAssignModal}
				onClose={() => setShowAssignModal(false)}
				campaignId={campaign.id}
				onSuccess={onUpdate}
			/>

			<AddCreatorsModal
				isOpen={showAddModal}
				onClose={() => setShowAddModal(false)}
				campaignId={campaign.id}
				campaign={campaign}
				onSuccess={onUpdate}
			/>

			<ManageCreatorModal
				isOpen={showManageModal}
				onClose={() => {
					setShowManageModal(false);
					setSelectedCreator(null);
				}}
				creator={selectedCreator}
				campaignId={campaign.id}
				onSuccess={(updatedCreator) => {
					onUpdate();
				
					// Update the local state immediately if we have updated creator data
					if (updatedCreator && selectedCreator) {
						setFilteredCreators(prevCreators => 
							prevCreators.map(creator => 
								creator.id === selectedCreator.id ? updatedCreator : creator
							)
						);
					} else {
						setSearchQuery("");
						setFilteredCreators(campaign.assignments || []);
					}
				}}
			/>

			{showCalendarModal && selectedCreator && (
        <div
          className={styles.calendarModalOverlay}
          onClick={() => {
            setShowCalendarModal(false);
            setSelectedCreator(null);
          }}
        >
          <div
            className={styles.calendarModalContent}
            onClick={(e) => e.stopPropagation()}
          >
			<div className={styles.calendarModalHeader}>
				<h2 className={styles.calendarModalTitle}>
				{selectedCreator.account.display_name || selectedCreator.account.handle}'s Posts
				</h2>
				<button
					className={styles.calendarModalCloseButton}
					onClick={() => {
						setShowCalendarModal(false);
						setSelectedCreator(null);
					}}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
						<path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m7 7 5 5m0 0 5 5m-5-5 5-5m-5 5-5 5"/>
					</svg>
				</button>
			</div>
			<CreatorCalendar
				startDate={campaign.start_date}
				endDate={campaign.end_date}
				dailyPosts={dailyPosts}
				frequency={selectedCreator.frequency}
				num_posts={selectedCreator.num_posts}
				total_assigned_posts={selectedCreator.total_assigned_posts}
				onDateClick={handleDateClick}
				creatorId={selectedCreator.id}
				campaignId={campaign.id}
            />
            <div className={styles.calendarModalActions}>
              <button
                onClick={() => {
                  setShowCalendarModal(false);
                  setShowManageModal(true);
                }}
                className={styles.manageButton}
              >
                Manage
              </button>
            </div>
          </div>
        </div>
      )}
			{/* Posts Modal */}
			<PostsModal
				isOpen={showPostsModal}
				onClose={() => {
					setShowPostsModal(false);
					setSelectedDate(null);
					setDatePosts([]);
				}}
				selectedDate={selectedDate}
				posts={datePosts}
				loading={loadingPosts}
			/>
		</div>
	);
};