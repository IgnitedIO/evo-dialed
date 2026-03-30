// Dependencies
const { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Initialize S3 client
const s3Client = new S3Client({
	region: process.env.S3_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
	}
});
const S3_BUCKET = process.env.S3_BUCKET;

// Constants
const DEFAULT_PRESIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

/**
 * Generate a presigned URL for S3 object download
 * @param {string} s3Key - S3 key/path of the object
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string>} Presigned URL
 */
async function s3_getPresignedUrl(s3Key, expiresIn = DEFAULT_PRESIGNED_URL_EXPIRY) {
	try {
		const command = new GetObjectCommand({
			Bucket: S3_BUCKET,
			Key: s3Key
		});

		const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
		return presignedUrl;
	} catch (error) {
		console.error('Failed to generate presigned URL:', error);
		throw error;
	}
}

/**
 * Delete an object from S3
 * @param {string} s3Key - S3 key/path of the object to delete
 * @returns {Promise<boolean>} Success status
 */
async function s3_deleteObject(s3Key) {
	try {
		const command = new DeleteObjectCommand({
			Bucket: S3_BUCKET,
			Key: s3Key
		});

		await s3Client.send(command);
		console.log(`Successfully deleted S3 object: ${s3Key}`);
		return true;
	} catch (error) {
		console.error(`Failed to delete S3 object ${s3Key}:`, error);
		return false;
	}
}

/**
 * Check if an S3 key exists and is accessible
 * @param {string} s3Key - S3 key/path to check
 * @returns {Promise<boolean>} True if exists and accessible
 */
async function s3_objectExists(s3Key) {
	try {
		const command = new GetObjectCommand({
			Bucket: S3_BUCKET,
			Key: s3Key
		});

		await s3Client.send(command);
		return true;
	} catch (error) {
		if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
			return false;
		}
		console.error(`Error checking S3 object ${s3Key}:`, error);
		return false;
	}
}

/**
 * Download an S3 object as a buffer
 * @param {string} s3Key - S3 key/path of the object
 * @returns {Promise<Buffer>} File data as buffer
 */
async function s3_getFileBuffer(s3Key) {
	try {
		const command = new GetObjectCommand({
			Bucket: S3_BUCKET,
			Key: s3Key
		});

		const response = await s3Client.send(command);

		// Convert stream to buffer
		const chunks = [];
		for await (const chunk of response.Body) {
			chunks.push(chunk);
		}

		return Buffer.concat(chunks);
	} catch (error) {
		console.error(`Failed to download S3 object ${s3Key}:`, error);
		throw error;
	}
}

/**
 * Generate a presigned URL for S3 object upload
 * @param {number} userId - User ID
 * @param {number} campaignId - Campaign ID
 * @param {string} fileName - Original file name
 * @param {number} fileSize - File size in bytes
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<{uploadUrl: string, s3Key: string}>} Presigned upload URL and S3 key
 */
async function s3_generateUploadUrl(userId, campaignId, fileName, fileSize, contentType) {
	try {
		// Validate file size (50MB limit for images, 500MB for videos)
		const maxSize = contentType.startsWith('video/') ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
		if (fileSize > maxSize) {
			throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
		}

		// Generate S3 key with timestamp and user/campaign info
		const timestamp = Date.now();
		const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
		const s3Key = `creative-approval/${userId}/${campaignId}/${timestamp}-${sanitizedFileName}`;

		// Create PutObjectCommand
		const command = new PutObjectCommand({
			Bucket: S3_BUCKET,
			Key: s3Key,
			ContentType: contentType,
			ContentLength: fileSize
		});

		// Generate presigned URL (1 hour expiration)
		const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

		return { uploadUrl, s3Key };
	} catch (error) {
		console.error('Failed to generate upload URL:', error);
		throw error;
	}
}

// Export functions
module.exports = {
	s3_getPresignedUrl,
	s3_getFileBuffer,
	s3_deleteObject,
	s3_objectExists,
	s3_generateUploadUrl
};
