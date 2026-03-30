// Dependencies
import { useState, useEffect } from "react";

// API Imports
import {
	addCampaignLink,
	updateCampaignLink,
	removeCampaignLink
} from "../../../../../api/internal";

// Style Imports
import styles from "../Details.module.css";

// Component Imports
import AddLinkModal from "../modals/AddResource";

// Icon Imports
import {
	EXTERNAL_LINK_ICON,
	TRASH_ICON
} from "../../../../../assets/icons/svg";

// Resources Tab Component
export default function ResourcesTab({
	campaign,
	onUpdate
}) {
	// States
	const [error, setError] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [filteredResources, setFilteredResources] = useState(campaign.links);
	const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);

	// Handle search
	useEffect(() => {
		if (searchQuery.trim() === "") {
			setFilteredResources(campaign.links);
		} else {
			const filtered = campaign.links.filter(link => 
				link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(link.description && link.description.toLowerCase().includes(searchQuery.toLowerCase()))
			);
			setFilteredResources(filtered);
		}
	}, [searchQuery, campaign.links]);

	// Handle add resource
	const handleAddResource = async (newResource) => {
		try {
			const response = await addCampaignLink(campaign.id, newResource);
			if (response.status === 200) {
				// Immediately update the local state with the new resource
				const newResourceWithId = { ...newResource, id: response.data.data.id };
				setFilteredResources(prev => [...prev, newResourceWithId]);
				onUpdate(); // Still call onUpdate to ensure backend sync
				return response;
			}
		} catch (err) {
			setError("Failed to add resource");
			throw err;
		}
	};

	// Handle update resource
	const handleUpdateResource = async (resourceId, key, value) => {
		try {
			const response = await updateCampaignLink(campaign.id, resourceId, { [key]: value });
			if (response.status === 200) {
				onUpdate();
			}
		} catch (err) {
			setError("Failed to update resource");
		}
	};

	// Handle remove resource
	const handleRemoveResource = async (resourceId) => {
		try {
			const response = await removeCampaignLink(campaign.id, resourceId);
			if (response.status === 200) {
				onUpdate();
			}
		} catch (err) {
			setError("Failed to remove resource");
		}
	};

	// Render
	return (
		<div>
			<div className={styles.resourcesHeader}>
				<input
					type="text"
					className={styles.searchBar}
					placeholder="Search resources..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				<button
					onClick={() => setIsAddResourceModalOpen(true)}
					className={styles.addResourceButton}
				>
					Add Resource
				</button>
			</div>

			{error && (
				<div className={styles.error}>{error}</div>
			)}

			<AddLinkModal
				isOpen={isAddResourceModalOpen}
				onClose={() => setIsAddResourceModalOpen(false)}
				onAddLink={handleAddResource}
			/>

			{/* Resources List */}
			<div className={styles.resourcesList}>
				{filteredResources.map((resource) => (
					<div
						key={resource.url}
						className={styles.resourceCard}
					>
						<div className={styles.resourceCardContent}>
							<div className={styles.resourceHeader}>
								<h3 className={styles.resourceTitle}>
									{resource.title}
								</h3>
								<div className={styles.resourceActions}>
									<a
										href={resource.url}
										target="_blank"
										rel="noopener noreferrer"
										className={styles.externalLinkButton}
										title="Open resource"
									>
										{EXTERNAL_LINK_ICON}
									</a>
									<button
										onClick={() => handleRemoveResource(resource.url)}
										className={styles.removeButton}
										title="Remove resource"
									>
										{TRASH_ICON}
									</button>
								</div>
							</div>
							<p className={styles.resourceDescription}>
								{resource.description || "No description provided"}
							</p>
						</div>
					</div>
				))}
				{filteredResources.length === 0 && (
					<p className={styles.emptyResources}>
						{searchQuery ? "No resources found matching your search." : "No resources added yet"}
					</p>
				)}
			</div>
		</div>
	);
};