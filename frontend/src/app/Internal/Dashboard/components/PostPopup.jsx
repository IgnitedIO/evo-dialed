// Dependencies
import { useState } from "react";
import Popup from "reactjs-popup";
import { FaCheck, FaLink, FaExternalLinkAlt } from "react-icons/fa";

// Style Imports
import popupStyles from "./PostPopup.module.css";

// Post Popup Component
export default function PostPopup({
  trigger,
  postUrl,
  position = "center center",
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (postUrl) {
      try {
        await navigator.clipboard.writeText(postUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  const handleOpenPost = () => {
    if (postUrl) {
      window.open(postUrl, "_blank", "noopener,noreferrer");
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
        <button onClick={handleOpenPost} className={popupStyles.popupButton}>
          <FaExternalLinkAlt />
          Open Post
        </button>
      </div>
    </Popup>
  );
}
