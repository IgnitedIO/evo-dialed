import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCampaignDetails, submitToCampaign, getAvailablePostsToSubmit } from "../../../api/creators";
import styles from "./Campaigns.module.css";
import LoadingCircleScreen from "../../../ui/Components/LoadingCircle/LoadingCircleScreen.jsx";

export const CreatorCampaignSubmit = () => {
	// Responsibilities:
	// - Load available submissions
	// - Select subset of submissions to submit to campaign, in array (see backend/routes/creators/campaigns/controller.js)
	// - Submit selected submissions to campaign, useNavigate back to campaign details page once complete

	const { campaignId } = useParams();
	const navigate = useNavigate();
	const [campaign, setCampaign] = useState(null);
	const [submissions, setSubmissions] = useState([]);
	const [selectedSubmissions, setSelectedSubmissions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch both campaign details and available posts in parallel
				const [campaignResponse, postsResponse] = await Promise.all([
					getCampaignDetails(campaignId),
					getAvailablePostsToSubmit(campaignId)
				]);

				if (campaignResponse.status === 200 && postsResponse.status === 200) {
					setCampaign(campaignResponse.data);
					setSubmissions(postsResponse.data);
				} else {
					setError("Failed to load campaign data");
				}
			} catch (err) {
				setError("Error loading data");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [campaignId]);

	const handleSubmissionSelect = (submissionId) => {
		setSelectedSubmissions(prev => {
			if (prev.includes(submissionId)) {
				return prev.filter(id => id !== submissionId);
			} else {
				return [...prev, submissionId];
			}
		});
	};

	const handleSubmit = async () => {
		if (selectedSubmissions.length === 0) {
			setError("Please select at least one submission");
			return;
		}

		setSubmitting(true);
		setError(null);

		try {
			const response = await submitToCampaign(campaignId, {
				submission_ids: selectedSubmissions
			});

			if (response.status === 200) {
				setSuccess(true);
				setTimeout(() => {
					navigate(`/campaigns/${campaignId}`);
				}, 2000);
			} else {
				setError("Failed to submit content");
			}
		} catch (err) {
			setError("Error submitting content");
		} finally {
			setSubmitting(false);
		}
	};

	const handleBackClick = () => {
		navigate(`/campaigns/${campaignId}`);
	};

	if (loading) return <div className={styles.container}><LoadingCircleScreen /></div>;
	if (error && !submitting) return <div className={styles.container}>{error}</div>;
	if (!campaign) return <div className={styles.container}>Campaign not found</div>;

	return (
		<div className={styles.container}>
			<button className={styles.backButton} onClick={handleBackClick}>
				← Back to Campaign Details
			</button>

			<div className={styles.detailsContainer}>
				<h1 className={styles.detailsTitle}>Submit Content for {campaign.title}</h1>
				
				{success ? (
					<div className={styles.successMessage}>
						Content submitted successfully! Redirecting...
					</div>
				) : (
					<>
						<p>Select the content you want to submit for this campaign:</p>

						{submissions.length === 0 ? (
							<div className={styles.errorMessage}>
								No available posts to submit. Please create content first.
							</div>
						) : (
							<div className={styles.submissionsGrid}>
								{submissions.map((submission) => (
									<div
										key={submission.id}
										className={`${styles.submissionCard} ${
											selectedSubmissions.includes(submission.id) ? styles.selected : ""
										}`}
										onClick={() => handleSubmissionSelect(submission.id)}
									>
										<input
											type="checkbox"
											className={styles.submissionCheckbox}
											checked={selectedSubmissions.includes(submission.id)}
											onChange={() => handleSubmissionSelect(submission.id)}
										/>
										<img
											src={submission.media_url || "https://via.placeholder.com/300x200"}
											alt={submission.title}
											className={styles.submissionPreview}
										/>
										<h3 className={styles.submissionTitle}>{submission.title}</h3>
										<div className={styles.submissionMeta}>
											<span>{submission.platform}</span>
											<span>{new Date(submission.created_at).toLocaleDateString()}</span>
										</div>
									</div>
								))}
							</div>
						)}

						{error && <div className={styles.errorMessage}>{error}</div>}

						<button
							className={styles.submitButton}
							onClick={handleSubmit}
							disabled={submitting || selectedSubmissions.length === 0 || submissions.length === 0}
						>
							{submitting ? "Submitting..." : "Submit Selected Content"}
						</button>
					</>
				)}
			</div>
		</div>
	);
};
