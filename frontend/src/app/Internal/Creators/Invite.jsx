import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCreatorAccount } from "../../../api/internal";
import styles from "../../Clients/Dashboard/Dashboard.module.css";

export const InternalCreatorInvite = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		name: "" // Optional name field
	});
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const response = await createCreatorAccount({
				email: formData.email,
				password: formData.password,
				name: formData.name || null // Only send name if provided
			});

			if (response.status === 200) {
				// Navigate back to creators list
				navigate("/team/creators");
			} else {
				setError("Failed to invite creator");
			}
		} catch (err) {
			setError(err.response?.data || "Error inviting creator");
		} finally {
			setLoading(false);
		}
	};

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

				<div style={{ marginBottom: "35px" }}>
					<label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
						Email Address *
					</label>
					<input
						type="email"
						name="email"
						value={formData.email}
						onChange={handleInputChange}
						required
						placeholder="creator@example.com"
						style={{
							width: "100%",
							padding: "12px",
							border: "1px solid var(--brd-light)",
							borderRadius: "8px",
							fontSize: "15px",
						}}
					/>
				</div>

				<div style={{ marginBottom: "35px" }}>
					<label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
						Password *
					</label>
					<p style={{ 
						marginTop: "4px", 
						fontSize: "14px", 
						color: "#667",
						marginBottom: "12px"
					}}>
						This will be the creator's initial password. They can change it after logging in.
					</p>
					<input
						type="password"
						name="password"
						value={formData.password}
						onChange={handleInputChange}
						required
						minLength={8}
						placeholder="Minimum 8 characters"
						style={{
							width: "100%",
							padding: "12px",
							border: "1px solid var(--brd-light)",
							borderRadius: "8px",
							fontSize: "15px"
						}}
					/>
				</div>

				<div style={{ marginBottom: "35px" }}>
					<label style={{ display: "block", fontWeight: "500" }}>
						Name (Optional)
					</label>
					<p style={{ 
						marginTop: "4px", 
						fontSize: "14px", 
						color: "#667",
						marginBottom: "12px"
					}}>
						If not provided, the email address will be used as the creator's name.
					</p>
					<input
						type="text"
						name="name"
						value={formData.name}
						onChange={handleInputChange}
						placeholder="Creator's display name"
						style={{
							width: "100%",
							padding: "12px",
							border: "1px solid var(--brd-light)",
							borderRadius: "8px",
							fontSize: "15px",
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
						{loading ? "Inviting..." : "Invite Creator"}
					</button>
				</div>
			</form>
		</div>
	);
};
