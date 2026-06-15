import { API_URL } from '../config';

/**
 * Resolves an image source.
 * If it's a base64 string, returns it as is.
 * If it's a relative path (starting with /uploads), prepends the API_URL if necessary.
 */
export const getImageUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('data:')) return path;
  
  // If it's already an absolute URL, return it
  if (path.startsWith('http')) return path;

  // Prepend API_URL if it's a relative path starting with /
  if (path.startsWith('/')) {
    return `${API_URL}${path}`;
  }

  return path;
};
