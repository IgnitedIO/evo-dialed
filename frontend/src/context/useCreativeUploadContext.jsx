import React, { createContext, useContext, useState, useCallback } from "react";

// Context
const CreativeUploadContext = createContext(null);

// Provider component
export function CreativeUploadProvider({ children }) {
	// State to track all active uploads
	// Each upload has: id, thumbnail, fileName, status ('uploading' | 'error')
	const [activeUploads, setActiveUploads] = useState([]);

	// Add a new upload to the queue
	const addUpload = useCallback((uploadId, thumbnail, fileName) => {
		setActiveUploads(prev => [
			...prev,
			{
				id: uploadId,
				thumbnail: thumbnail,
				fileName: fileName,
				status: 'uploading',
				timestamp: Date.now()
			}
		]);
	}, []);

	// Remove an upload from the queue (on success or error)
	const removeUpload = useCallback((uploadId) => {
		setActiveUploads(prev => prev.filter(upload => upload.id !== uploadId));
	}, []);

	// Mark an upload as having an error
	const markUploadError = useCallback((uploadId) => {
		setActiveUploads(prev => prev.map(upload =>
			upload.id === uploadId
				? { ...upload, status: 'error' }
				: upload
		));

		// Auto-remove after 5 seconds to show the error briefly
		setTimeout(() => {
			removeUpload(uploadId);
		}, 5000);
	}, [removeUpload]);

	// Get active upload count
	const getActiveUploadCount = useCallback(() => {
		return activeUploads.filter(u => u.status === 'uploading').length;
	}, [activeUploads]);

	// Get thumbnails for display (max 2)
	const getThumbnails = useCallback(() => {
		return activeUploads
			.filter(u => u.status === 'uploading' && u.thumbnail)
			.slice(0, 2)
			.map(u => u.thumbnail);
	}, [activeUploads]);

	// Context value
	const value = {
		activeUploads,
		addUpload,
		removeUpload,
		markUploadError,
		getActiveUploadCount,
		getThumbnails
	};

	return (
		<CreativeUploadContext.Provider value={value}>
			{children}
		</CreativeUploadContext.Provider>
	);
}

// Hook to use the context
export function useCreativeUploadContext() {
	const context = useContext(CreativeUploadContext);
	if (!context) {
		throw new Error("useCreativeUploadContext must be used within CreativeUploadProvider");
	}
	return context;
}