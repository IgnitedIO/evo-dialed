import { useState, useEffect } from "react";
import { getIntegrations, connectPlatform, disconnectIntegration } from "../../../api/creators";
import styles from "./Integrations.module.css";
import LoadingCircleScreen from "../../../ui/Components/LoadingCircle/LoadingCircleScreen.jsx";

export const IntegrationsHome = () => {
	// Responsibilities:
	// - Display all integrations
	// - Ability to search integrations with searchbar
	// - Ability to remove integrations
	// - Ability to add new integrations

	const [integrations, setIntegrations] = useState([]);
	const [filteredIntegrations, setFilteredIntegrations] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [selectedPlatform, setSelectedPlatform] = useState(null);
	const [connectionData, setConnectionData] = useState({});
	const [isConnecting, setIsConnecting] = useState(false);
	const [isDisconnecting, setIsDisconnecting] = useState(false);

	// Available platforms for connection
	const availablePlatforms = [
		{ id: "instagram", name: "Instagram", icon: "https://via.placeholder.com/40" },
		{ id: "tiktok", name: "TikTok", icon: "https://via.placeholder.com/40" },
		{ id: "youtube", name: "YouTube", icon: "https://via.placeholder.com/40" },
	];

	useEffect(() => {
		fetchIntegrations();
	}, []);

	useEffect(() => {
		if (searchQuery.trim() === "") {
			setFilteredIntegrations(integrations);
		} else {
			const filtered = integrations.filter(integration =>
				integration.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
				integration.account_name.toLowerCase().includes(searchQuery.toLowerCase())
			);
			setFilteredIntegrations(filtered);
		}
	}, [searchQuery, integrations]);

	const fetchIntegrations = async () => {
		try {
			const response = await getIntegrations();
			if (response.status === 200) {
				setIntegrations(response.data);
				setFilteredIntegrations(response.data);
			} else {
				setError("Failed to load integrations");
			}
		} catch (err) {
			setError("Error loading integrations");
		} finally {
			setLoading(false);
		}
	};

	const handleConnect = (platform) => {
		setSelectedPlatform(platform);
		setConnectionData({});
	};

	const handleDisconnect = async (connectionId) => {
		if (!window.confirm("Are you sure you want to disconnect this integration?")) {
			return;
		}

		setIsDisconnecting(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await disconnectIntegration(connectionId);
			if (response.status === 200) {
				setSuccess("Integration disconnected successfully");
				await fetchIntegrations();
			} else {
				setError("Failed to disconnect integration");
			}
		} catch (err) {
			setError("Error disconnecting integration");
		} finally {
			setIsDisconnecting(false);
		}
	};

	const handleConnectionSubmit = async (e) => {
		e.preventDefault();
		if (!selectedPlatform) return;

		setIsConnecting(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await connectPlatform(selectedPlatform.id, connectionData);
			if (response.status === 200) {
				setSuccess("Platform connected successfully");
				setSelectedPlatform(null);
				await fetchIntegrations();
			} else {
				setError("Failed to connect platform");
			}
		} catch (err) {
			setError("Error connecting platform");
		} finally {
			setIsConnecting(false);
		}
	};

	const handleModalClose = () => {
		setSelectedPlatform(null);
		setConnectionData({});
		setError(null);
	};

	if (loading) return <div className={styles.container}><LoadingCircleScreen /></div>;

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h1 className={styles.title}>Platform Integrations</h1>
				<input
					type="text"
					className={styles.searchBar}
					placeholder="Search integrations..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>

			{error && <div className={styles.errorMessage}>{error}</div>}
			{success && <div className={styles.successMessage}>{success}</div>}

			<div className={styles.integrationsGrid}>
				{availablePlatforms.map((platform) => {
					const integration = integrations.find(i => i.platform === platform.id);
					const isConnected = !!integration;

					return (
						<div
							key={platform.id}
							className={`${styles.integrationCard} ${
								isConnected ? styles.connected : styles.disconnected
							}`}
						>
							{isConnecting && platform.id === selectedPlatform?.id && (
								<div className={styles.loadingOverlay}>Connecting...</div>
							)}
							{isDisconnecting && integration?.id === isDisconnecting && (
								<div className={styles.loadingOverlay}>Disconnecting...</div>
							)}

							<div className={styles.integrationHeader}>
								<img
									src={platform.icon}
									alt={platform.name}
									className={styles.platformIcon}
								/>
								<span className={styles.platformName}>{platform.name}</span>
								<span
									className={`${styles.platformStatus} ${
										isConnected ? styles.statusConnected : styles.statusDisconnected
									}`}
								>
									{isConnected ? "Connected" : "Disconnected"}
								</span>
							</div>

							{isConnected ? (
								<>
									<div className={styles.integrationDetails}>
										<div className={styles.accountInfo}>
											Account: {integration.account_name}
										</div>
										<div className={styles.lastSync}>
											Last synced: {new Date(integration.last_sync).toLocaleDateString()}
										</div>
									</div>
									<div className={styles.actionButtons}>
										<button
											className={styles.disconnectButton}
											onClick={() => handleDisconnect(integration.id)}
											disabled={isDisconnecting}
										>
											Disconnect
										</button>
									</div>
								</>
							) : (
								<div className={styles.actionButtons}>
									<button
										className={styles.connectButton}
										onClick={() => handleConnect(platform)}
										disabled={isConnecting}
									>
										Connect
									</button>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{selectedPlatform && (
				<div className={styles.modal}>
					<div className={styles.modalContent}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>Connect {selectedPlatform.name}</h2>
							<p className={styles.modalDescription}>
								Enter your {selectedPlatform.name} credentials to connect your account.
							</p>
						</div>

						<form onSubmit={handleConnectionSubmit} className={styles.modalForm}>
							<div className={styles.formGroup}>
								<label className={styles.formLabel}>Username</label>
								<input
									type="text"
									className={styles.formInput}
									value={connectionData.username || ""}
									onChange={(e) =>
										setConnectionData({ ...connectionData, username: e.target.value })
									}
									required
								/>
							</div>

							<div className={styles.formGroup}>
								<label className={styles.formLabel}>Password</label>
								<input
									type="password"
									className={styles.formInput}
									value={connectionData.password || ""}
									onChange={(e) =>
										setConnectionData({ ...connectionData, password: e.target.value })
									}
									required
								/>
							</div>

							<div className={styles.modalActions}>
								<button
									type="button"
									className={`${styles.modalButton} ${styles.secondary}`}
									onClick={handleModalClose}
								>
									Cancel
								</button>
								<button
									type="submit"
									className={`${styles.modalButton} ${styles.primary}`}
									disabled={isConnecting}
								>
									{isConnecting ? "Connecting..." : "Connect"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};
