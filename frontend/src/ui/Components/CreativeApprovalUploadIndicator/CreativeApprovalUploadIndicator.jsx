// Component Imports
import LoadingCircleVarSize from "../LoadingCircle/LoadingCircleVariable";

// Style Import
import styles from "./CreativeApprovalUploadIndicator.module.css";

// Functional Component
export default function CreativeApprovalUploadIndicator({
    count = 0,
    thumbnails = [],
}) {
    // Render
    return (
        <div className={styles.container}>
            <div className={styles.thumbnails}>
                {(thumbnails.slice(0,2)).map((thumbnail, idx) => (
                    <img className={styles.thumbnail} src={thumbnail} alt="Thumbnail" key={`crvapprv-uplind-thumbidx-${idx}`} />
                ))}
            </div>
            <p className={styles.count}>Uploading {count} creative{(count > 1) ? 's' : ''}...</p>
            <div className={styles.loadingContainer}>
                <LoadingCircleVarSize width="35px" height="35px" />
            </div>
        </div>
    );
}