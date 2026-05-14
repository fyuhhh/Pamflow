const fs = require('fs');
const path = require('path');
const crypto = require('crypto');


/**
 * Saves a base64 string as a file.
 * @param {string} base64Data - The base64 string (can include data:image/png;base64, prefix)
 * @param {string} subFolder - Subfolder inside uploads (e.g., 'assets', 'tasks')
 * @returns {string|null} - The relative URL path to the saved file or null if failed
 */
const saveBase64Image = (base64Data, subFolder = 'misc') => {
  if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:image')) {
    return base64Data; // Return as is if not a base64 image string
  }

  try {
    const uploadsDir = path.join(__dirname, '../../uploads', subFolder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Extract format and actual base64 content
    const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Data;
    }

    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);


    fs.writeFileSync(filePath, buffer);

    // Return the relative URL path
    return `/uploads/${subFolder}/${fileName}`;
  } catch (error) {
    console.error(`[FileHelper] Error saving base64 image to ${subFolder}:`, error.message);
    return base64Data; // Fallback to original if saving fails
  }
};

/**
 * Recursively scans an object/array and replaces base64 strings with file paths.
 */
const processBase64InObject = (obj, subFolder = 'tasks') => {
  if (!obj) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => processBase64InObject(item, subFolder));
  }

  if (typeof obj === 'object') {
    const newObj = { ...obj };
    for (const key in newObj) {
      if (typeof newObj[key] === 'string' && newObj[key].startsWith('data:image')) {
        newObj[key] = saveBase64Image(newObj[key], subFolder);
      } else if (typeof newObj[key] === 'object') {
        newObj[key] = processBase64InObject(newObj[key], subFolder);
      }
    }
    return newObj;
  }

  return obj;
};

module.exports = {
  saveBase64Image,
  processBase64InObject
};
