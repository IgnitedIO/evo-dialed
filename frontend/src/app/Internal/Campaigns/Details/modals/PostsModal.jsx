import React from "react";
import { FaTiktok, FaInstagram } from "react-icons/fa";
import PostPopup from "../../../Dashboard/components/PostPopup";
import LoadingCircle from "../../../../../ui/Components/LoadingCircle/LoadingCircle";
import styles from "../Details.module.css";

// Helper Functions
const formatDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Posts Modal Component
export default function PostsModal({
  isOpen,
  onClose,
  selectedDate,
  posts,
  loading,
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.postsModalOverlay} onClick={onClose}>
      <div
        className={styles.postsModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.postsModalHeader}>
          <button className={styles.postsModalCloseButton} onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m7 7 5 5m0 0 5 5m-5-5 5-5m-5 5-5 5"/>
            </svg>
          </button>
          <h2 className={styles.postsModalTitle}>
            Posts for {formatDate(selectedDate)}
          </h2>
        </div>

        {loading ? (
          <div className={styles.postsModalLoading}><LoadingCircle /></div>
        ) : posts.length > 0 ? (
          <div className={styles.postsModalPostsList}>
            {posts.map((post, index) => {
              return (
                <PostPopup
                  trigger={
                    <div key={index} className={styles.postsModalPostCard}>
                      <div className={styles.postsModalPostHeader}>
                        <div className={styles.postsModalPostInfo}>
                          <img
                            src={post.pfp ?? "/defaults/u.webp"}
                            alt={`${post.display_name || post.handle} profile`}
                            className={styles.postsModalProfileImage}
                          />
                          <span className={styles.postsModalHandle}>
                            @{post.handle}
                          </span>
                        </div>
                        <div className={styles.postsModalTimestamp}>
                          <span className={styles.postsModalTime}>
                            {formatTime(post.post_ts)}
                          </span>
                          {post.platform === "ig" && (
                            <FaInstagram style={{ color: "#E1306C" }} />
                          )}
                          {post.platform === "tt" && (
                            <FaTiktok style={{ color: "#000000" }} />
                          )}
                        </div>
                      </div>

                      {post.caption && (
                        <p className={styles.postsModalCaption}>
                          {post.caption.length > 100
                            ? `${post.caption.substring(0, 100)}...`
                            : post.caption}
                        </p>
                      )}
                    </div>
                  }
                  postUrl={post.post_url}
                  position="right center"
                />
              );
            })}
          </div>
        ) : (
          <div className={styles.postsModalEmpty}>
            No posts found for this date.
          </div>
        )}
      </div>
    </div>
  );
}
