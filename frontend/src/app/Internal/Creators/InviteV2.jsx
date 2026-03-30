// Dependencies
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// API Imports
import { manuallyInviteCreator } from "../../../api/internal";

// Style Imports
import styles from "../../Clients/Dashboard/Dashboard.module.css";

// Main Component
export const InternalCreatorInviteV2 = () => {
	const navigate = useNavigate();

	// Data States
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");

	// UI States
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);

	// Submission handlers
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const response = await manuallyInviteCreator(name, email, phone);

			if (response.status === 200) {
				// Navigate back to creators list
				navigate("/team/creators");
			} else {
				setError("Failed to send invitation");
			}
		} catch (err) {
			setError(err.response?.data || "Error sending invitation");
		} finally {
			setLoading(false);
		}
	};

	// Render
	return (
		<div style={{ width: "100%", maxWidth: "1000px", margin: "40px auto 0 auto" }}>
			<div className={styles.header}>
				<h1 className={styles.title}>Invite Creator</h1>
			</div>

			<form onSubmit={handleSubmit} style={{ width: "100%", margin: "40px 0 0 0" }}>
				{error && (
					<div style={{ 
						color: "#dc3545", 
						background: "#f8d7da", 
						padding: "12px", 
						borderRadius: "8px", 
						marginBottom: "35px" 
					}}>
						{error}
					</div>
				)}

				<div style={{ marginBottom: "30px" }}>
					<label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
						Creator Name
					</label>
					<input
						type="text"
						value={name}
						required
						onChange={(e) => setName(e.target.value)}
						placeholder="Enter the creator's name"
						style={{
							width: "100%",
							padding: "12px",
							border: "1px solid var(--brd-light)",
							borderRadius: "8px",
							fontSize: "15px",
							backgroundColor: "white",
						}}
					/>
				</div>

				<div style={{ marginBottom: "30px" }}>

				<label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
						Email Address
					</label>
					<input
						type="text"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						placeholder="Enter the creator's email"
						style={{
							width: "100%",
							padding: "12px",
							border: "1px solid var(--brd-light)",
							borderRadius: "8px",
							fontSize: "15px",
							backgroundColor: "white",
						}}
					/>
				</div>

				<div style={{ marginBottom: "35px" }}>
					<label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
						Phone Number (Optional)
					</label>
					<input
						type="tel"
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
						placeholder="Enter the creator's phone number"
						style={{
							width: "100%",
							padding: "12px",
							border: "1px solid var(--brd-light)",
							borderRadius: "8px",
							fontSize: "15px",
							backgroundColor: "white",
						}}
					/>
				</div>

				<div style={{ display: "flex", gap: "16px", justifyContent: "space-between", marginTop: "35px" }}>
					<button
						type="button"
						onClick={() => navigate("/team/creators")}
						style={{
							padding: "12px 20px",
							background: "white",
							color: "#667",
							border: "1px solid var(--brd-light)",
							borderRadius: "8px",
							fontSize: "15px",
							cursor: "pointer",
							whiteSpace: "nowrap"
						}}
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={loading}
						style={{
							opacity: loading ? 0.7 : 1,
							padding: "12px 24px",
							background: "var(--main-hl)",
							color: "white",
							border: "none",
							borderRadius: "8px",
							fontSize: "15px",
							cursor: "pointer",
							whiteSpace: "nowrap"
						}}
					>
						{loading ? "Sending Invitation..." : "Send Invitation"}
					</button>
				</div>
			</form>
		</div>
	);
}; 