import { useState } from "react";
import styles from "../MissionControl.module.css";

const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
};

const CommentThread = ({ comments, onAddComment, onDeleteComment, currentUserId }) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await onAddComment(text.trim());
    setText("");
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div>
      <div className={styles.commentList}>
        {(!comments || comments.length === 0) && (
          <div className={styles.emptyStage}>No comments yet</div>
        )}
        {comments && comments.map((item) => {
          if (item.is_system) {
            return (
              <div key={`sys-${item.id}`} className={styles.systemComment}>
                {item.content}
              </div>
            );
          }
          return (
            <div key={`comment-${item.id}`} className={styles.commentItem}>
              <div className={styles.commentAvatar}>{getInitials(item.user_name)}</div>
              <div className={styles.commentBody}>
                <div>
                  <span className={styles.commentAuthor}>{item.user_name}</span>
                  <span className={styles.commentTime}>{formatTime(item.created_ts)}</span>
                </div>
                <div className={styles.commentText}>{item.content}</div>
              </div>
              {item.user_id === currentUserId && (
                <button
                  onClick={() => onDeleteComment(item.id)}
                  style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 12 }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.commentInput}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          rows={1}
        />
        <button
          className={styles.commentSendBtn}
          onClick={handleSubmit}
          disabled={!text.trim() || sending}
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default CommentThread;
