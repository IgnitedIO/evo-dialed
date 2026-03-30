/**
 * Compresses an image file to base64 with size limit
 * @param {File} file - The image file to compress
 * @param {number} maxSizeKB - Maximum size in KB (default 500KB)
 * @param {number} maxWidth - Maximum width in pixels (default 800)
 * @returns {Promise<string|null>} Base64 encoded image or null if failed
 */
export async function compressImage(file, maxSizeKB = 500, maxWidth = 800) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels until size is acceptable
        let quality = 0.9;
        let base64 = canvas.toDataURL('image/jpeg', quality);

        while (base64.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', quality);
        }

        // Check if still too large
        if (base64.length > maxSizeKB * 1024 * 1.37) {
          resolve(null);
        } else {
          resolve(base64);
        }
      };

      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };

    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
