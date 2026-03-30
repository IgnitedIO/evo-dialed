import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCampaign } from "../../../api/internal";
import styles from "../../Clients/Dashboard/Dashboard.module.css";
import ImagePicker from "../../../components/ImagePicker";

export const InternalCampaignCreate = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		supports_ig: false,
		supports_tt: false,
		img: null,
		start_date: "",
		end_date: "",
		status: "active",
		budget: ""
	});
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);

	const handleInputChange = (e) => {
		const { name, value, type, checked, files } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: type === "checkbox" ? checked : type === "file" ? files[0] : value
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const response = await createCampaign({
				name: formData.name,
				description: formData.description,
				supports_ig: formData.supports_ig,
				supports_tt: formData.supports_tt,
				img: formData.img,
				start_date: formData.start_date || undefined,
				end_date: formData.end_date || undefined,
				status: formData.status,
				budget: formData.budget ? Number(formData.budget) : undefined
			});

			if (response.status === 200) {
				// Navigate to the new campaign's details page
				navigate(`/team/campaigns/${response.data.data}/overview`);
			} else {
				setError("Failed to create campaign");
			}
		} catch (err) {
			setError("Error creating campaign");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ width: "100%", maxWidth: "1000px", margin: "40px auto 0 auto" }}>
			<div className={styles.header}>
				<h1 className={styles.title}>Create Campaign</h1>
			</div>

			<form onSubmit={handleSubmit} style={{ width: "100%", margin: "40px 0 0 0" }}>
				{error && (
					<div style={{ 
						color: "#dc3545", 
						background: "#f8d7da", 
						padding: "12px", 
						borderRadius: "8px", 
						marginBottom: "24px" 
					}}>
						{error}
					</div>
				)}

				<div style={{ marginBottom: "24px" }}>
					<label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
						Campaign Name *
					</label>
					<input
						type="text"
						name="name"
						value={formData.name}
						onChange={handleInputChange}
						required
						style={{
							width: "100%",
							padding: "12px",
							border: "1px solid var(--brd-light)",
							borderRadius: "8px",
							fontSize: "14px",
							backgroundColor: "#fff"
						}}
					/>
				</div>

				<div style={{ marginBottom: "24px" }}>
					<label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
						Description
					</label>
					<textarea
						name="description"
						value={formData.description}
						onChange={handleInputChange}
						rows={4}
						style={{
							width: "100%",
							padding: "12px",
							border: "1px solid var(--brd-light)",
							borderRadius: "8px",
							fontSize: "14px",
							resize: "vertical",
							backgroundColor: "#fff"
						}}
					/>
				</div>

				<div style={{ marginBottom: "24px" }}>
					<label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
						Campaign Image
					</label>
					<ImagePicker 
						id="campaign-image-picker"
						onUpdate={(base64Image) => {
							setFormData(prev => ({
								...prev,
								img: base64Image
							}));
						}}
					/>
				</div>

				<div style={{ marginBottom: "24px" }}>
					<label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
						Campaign Status
					</label>
					<select
						name="status"
						value={formData.status}
						onChange={handleInputChange}
						style={{
							width: "100%",
							padding: "12px",
							border: "1px solid var(--brd-light)",
							borderRadius: "8px",
							fontSize: "14px",
							backgroundColor: "#fff"
						}}
					>
						<option value="active">Active</option>
						<option value="draft">Draft</option>
						<option value="archive">Archive</option>
						<option value="complete">Complete</option>
					</select>
				</div>

				<div style={{ marginBottom: "24px" }}>
					<label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
						Campaign Budget
					</label>
					<input
						type="number"
						name="budget"
						value={formData.budget}
						onChange={handleInputChange}
						min="0"
						step="0.01"
						style={{
							width: "100%",
							padding: "12px",
							border: "1px solid var(--brd-light)",
							borderRadius: "8px",
							fontSize: "14px",
							backgroundColor: "#fff"
						}}
					/>
				</div>

				<div style={{ marginBottom: "24px" }}>
					<label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
						Campaign Dates
					</label>
					<div style={{ display: "flex", gap: "30px" }}>
						<div style={{ flex: 1 }}>
							<label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
								Start Date
							</label>
							<input
								type="datetime-local"
								name="start_date"
								value={formData.start_date}
								onChange={handleInputChange}
								style={{
									width: "100%",
									padding: "12px",
									border: "1px solid var(--brd-light)",
									borderRadius: "8px",
									fontSize: "14px",
									backgroundColor: "#fff"
								}}
							/>
						</div>
						<div style={{ flex: 1 }}>
							<label style={{ display: "block", marginBottom: "8px", fontWeight: "500", fontSize: "14px" }}>
								End Date
							</label>
							<input
								type="datetime-local"
								name="end_date"
								value={formData.end_date}
								onChange={handleInputChange}
								style={{
									width: "100%",
									padding: "12px",
									border: "1px solid var(--brd-light)",
									borderRadius: "8px",
									fontSize: "14px",
									backgroundColor: "#fff"
								}}
							/>
						</div>
					</div>
				</div>

				<div style={{ marginBottom: "24px" }}>
					<label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
						Supported Platforms
					</label>
					<div style={{ display: "flex", gap: "24px" }}>
						<label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
							<input
								type="checkbox"
								name="supports_ig"
								checked={formData.supports_ig}
								onChange={handleInputChange}
							/>
							Instagram
						</label>
						<label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
							<input
								type="checkbox"
								name="supports_tt"
								checked={formData.supports_tt}
								onChange={handleInputChange}
							/>
							TikTok
						</label>
					</div>
				</div>

				<div style={{ display: "flex", gap: "16px", justifyContent: "space-between", marginTop: "35px", marginBottom: "40px" }}>
					<button
						type="button"
						onClick={() => navigate("/team/campaigns")}
						style={{
							padding: "12px 20px",
							background: "white",
							color: "#667",
							border: "1px solid var(--brd-light)",
							borderRadius: "8px",
							fontSize: "15px",
							cursor: "pointer",
							whiteSpace: "nowrap",
							backgroundColor: "#fff"
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
							backgroundColor: "var(--main-hl)",
							color: "white",
							border: "none",
							borderRadius: "8px",
							fontSize: "15px",
							cursor: "pointer",
							whiteSpace: "nowrap",
						}}
					>
						{loading ? "Creating..." : "Create Campaign"}
					</button>
				</div>
			</form>
		</div>
	);
};
