const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const crypto = require('crypto');


/**
 * Saves a base64 string as a file.
 * @param {string} base64Data - The base64 string (can include data:image/png;base64, prefix)
 * @param {string} subFolder - Subfolder inside uploads (e.g., 'assets', 'tasks')
 * @returns {Promise<string|null>} - The relative URL path to the saved file or null if failed
 */
const saveBase64Media = async (base64Data, subFolder = 'misc') => {
  if (!base64Data || typeof base64Data !== 'string') {
    return base64Data;
  }

  const isImage = base64Data.startsWith('data:image');
  const isVideo = base64Data.startsWith('data:video');

  if (!isImage && !isVideo) {
    return base64Data; // Return as is if not a base64 media string
  }

  try {
    const uploadsDir = path.join(__dirname, '../../uploads', subFolder);
    if (!fs.existsSync(uploadsDir)) {
      await fsPromises.mkdir(uploadsDir, { recursive: true });
    }

    // Extract format and actual base64 content
    const regex = isImage 
      ? /^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/ 
      : /^data:video\/([a-zA-Z0-9+;=]+);base64,(.+)$/;
    const matches = base64Data.match(regex);
    if (!matches || matches.length !== 3) {
      return base64Data;
    }

    let extension = matches[1].split(';')[0];
    if (extension === 'jpeg') {
      extension = 'jpg';
    } else if (extension === 'quicktime') {
      extension = 'mov';
    }
    
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);

    await fsPromises.writeFile(filePath, buffer);

    // Return the relative URL path
    return `/uploads/${subFolder}/${fileName}`;
  } catch (error) {
    console.error(`[FileHelper] Error saving base64 media to ${subFolder}:`, error.message);
    return base64Data; // Fallback to original if saving fails
  }
};

/**
 * Recursively scans an object/array and replaces base64 strings with file paths asynchronously.
 */
const processBase64InObject = async (obj, subFolder = 'tasks') => {
  if (!obj) return obj;

  if (Array.isArray(obj)) {
    const promises = obj.map(item => processBase64InObject(item, subFolder));
    return Promise.all(promises);
  }

  if (typeof obj === 'object') {
    const newObj = { ...obj };
    for (const key in newObj) {
      const val = newObj[key];
      const isMedia = typeof val === 'string' && (val.startsWith('data:image') || val.startsWith('data:video'));
      if (isMedia) {
        newObj[key] = await saveBase64Media(val, subFolder);
      } else if (typeof val === 'object') {
        newObj[key] = await processBase64InObject(val, subFolder);
      }
    }
    return newObj;
  }

  return obj;
};

module.exports = {
  saveBase64Image: saveBase64Media, // maintain backward compatibility/export name
  processBase64InObject
};
