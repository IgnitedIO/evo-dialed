// Dependencies
const { google } = require('googleapis');

// Initialize Google Drive client
function getDriveClient() {
    try {
        // Parse service account credentials from environment variable
        const credentials = JSON.parse(process.env.GDRIVE_SERVICE_ACCOUNT_KEYS || '{}');

        if (!credentials.client_email || !credentials.private_key) {
            console.warn('Google Drive credentials not available: Missing service account credentials');
            return null;
        }

        const auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/drive.file']
        });

        return google.drive({ version: 'v3', auth });
    } catch (error) {
        console.warn('Google Drive client initialization failed:', error.message);
        return null;
    }
}

/**
 * Find a folder by name within a parent folder
 * @param {object} drive - Google Drive client instance
 * @param {string} folderName - Name of the folder to find
 * @param {string} parentId - Parent folder ID (use 'root' for top level)
 * @returns {Promise<string|null>} Folder ID if found, null otherwise
 */
async function findFolder(drive, folderName, parentId = 'root') {
    try {
        const query = [
            `name='${folderName.replace(/'/g, "\\'")}'`,
            `mimeType='application/vnd.google-apps.folder'`,
            `'${parentId}' in parents`,
            'trashed=false'
        ].join(' and ');

        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        if (response.data.files && response.data.files.length > 0) {
            return response.data.files[0].id;
        }

        return null;
    } catch (error) {
        console.error(`Error finding folder '${folderName}':`, error.message);
        return null;
    }
}

/**
 * Create a folder in Google Drive
 * @param {object} drive - Google Drive client instance
 * @param {string} folderName - Name of the folder to create
 * @param {string} parentId - Parent folder ID (use 'root' for top level)
 * @returns {Promise<string|null>} Created folder ID or null on error
 */
async function createFolder(drive, folderName, parentId = 'root') {
    try {
        const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId]
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            fields: 'id',
            supportsAllDrives: true
        });

        console.log(`Created folder '${folderName}' with ID: ${response.data.id}`);
        return response.data.id;
    } catch (error) {
        console.error(`Error creating folder '${folderName}':`, error.message);
        return null;
    }
}

/**
 * Ensure a nested folder structure exists (creates folders only if they don't exist)
 * @param {object} drive - Google Drive client instance
 * @param {string[]} folderPath - Array of folder names representing the path (e.g., ['Folder 1', 'ABC123', 'TestSubfolder'])
 * @param {string} parentId - Starting parent folder ID (use 'root' for top level)
 * @returns {Promise<string|null>} ID of the final folder in the path or null on error
 */
async function ensureFolderPath(drive, folderPath, parentId = 'root') {
    let currentParentId = parentId;

    for (const folderName of folderPath) {
        // Check if folder exists
        let folderId = await findFolder(drive, folderName, currentParentId);

        // Create folder if it doesn't exist
        if (!folderId) {
            folderId = await createFolder(drive, folderName, currentParentId);
            if (!folderId) {
                console.error(`Failed to create folder: ${folderName}`);
                return null;
            }
        }

        currentParentId = folderId;
    }

    return currentParentId;
}

/**
 * Upload a file buffer to Google Drive from S3 or any other source
 * @param {Buffer} fileBuffer - File data as a buffer (e.g., from S3)
 * @param {string} fileName - Name to give the file in Google Drive
 * @param {string[]} folderPath - Array of folder names representing the path (e.g., ['Folder 1', 'ABC123', 'TestSubfolder', 'Tuesday'])
 * @param {string} mimeType - MIME type of the file (default: 'video/mp4')
 * @returns {Promise<{success: boolean, fileId?: string, webViewLink?: string, error?: string}>}
 */
async function gdrive_uploadFile(fileBuffer, fileName, folderPath, mimeType = 'video/mp4') {
    const drive = getDriveClient();

    if (!drive) {
        console.warn('Google Drive not initialized, skipping file upload');
        return { success: false, error: 'Google Drive not initialized' };
    }

    try {
        // Get the parent folder ID from environment variable (defaults to 'root')
        const startingParentId = process.env.GDRIVE_PARENT_FOLDER_ID || 'root';

        // Ensure folder structure exists
        const parentFolderId = await ensureFolderPath(drive, folderPath, startingParentId);

        if (!parentFolderId) {
            return { success: false, error: 'Failed to create/find folder structure' };
        }

        // Upload file from buffer
        const fileMetadata = {
            name: fileName,
            parents: [parentFolderId]
        };

        const { Readable } = require('stream');
        const bufferStream = Readable.from(fileBuffer);

        const media = {
            mimeType: mimeType,
            body: bufferStream
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink',
            supportsAllDrives: true
        });

        console.log(`Uploaded file '${fileName}' with ID: ${response.data.id}`);

        return {
            success: true,
            fileId: response.data.id,
            webViewLink: response.data.webViewLink,
            webContentLink: response.data.webContentLink
        };
    } catch (error) {
        console.error('Error uploading file buffer to Google Drive:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a file from Google Drive
 * @param {string} fileId - ID of the file to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function gdrive_deleteFile(fileId) {
    const drive = getDriveClient();

    if (!drive) {
        console.warn('Google Drive not initialized, skipping file deletion');
        return { success: false, error: 'Google Drive not initialized' };
    }

    try {
        await drive.files.delete({
            fileId: fileId
        });

        console.log(`Deleted file with ID: ${fileId}`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting file from Google Drive:', error.message);
        return { success: false, error: error.message };
    }
}

// Export functions
module.exports = {
    gdrive_uploadFile,
    gdrive_deleteFile
};
