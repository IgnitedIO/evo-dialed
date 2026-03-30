// Dependencies
import { useState } from "react";
import Popup from "reactjs-popup";
import { FaCheck, FaLink, FaExternalLinkAlt } from "react-icons/fa";

// Style Imports
import popupStyles from "./PostPopup.module.css";

// Creator Popup Component
export default function CreatorPopup({
  trigger,
  platform,
  username,
  position = "center center",
}) {
  const [copied, setCopied] = useState(false);

  // Construct the profile URL based on platform
  const getProfileUrl = () => {
    if (!platform || !username) return null;
    
    if (platform === "ig") {
      return `https://www.instagram.com/${username}`;
    } else if (platform === "tt") {
      return `https://www.tiktok.com/@${username}`;
    }
    return null;
  };

  const profileUrl = getProfileUrl();

  const handleCopyLink = async () => {
    if (profileUrl) {
      try {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  const handleOpenProfile = () => {
    if (profileUrl) {
      window.open(profileUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Popup
      trigger={trigger}
      position={position}
      on="click"
      closeOnDocumentClick
      overlayStyle={{ background: "transparent", zIndex: 2001 }}
      contentStyle={{ zIndex: 2001 }}
      className={popupStyles.popupContent}
      arrow={false}
    >
      <div className={popupStyles.popupButtonsContainer}>
        <button onClick={handleCopyLink} className={popupStyles.popupButton}>
          {copied ? <FaCheck style={{ color: "#28a745" }} /> : <FaLink />}
          {copied ? "Copied!" : "Copy Link"}
        </button>
        <button onClick={handleOpenProfile} className={popupStyles.popupButton}>
          <FaExternalLinkAlt />
          Open Profile
        </button>
      </div>
    </Popup>
  );
}