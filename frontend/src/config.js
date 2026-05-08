/**
 * Dynamic API URL Configuration
 * 
 * Automatically detects the correct API URL based on the browser's current
 * hostname, eliminating the need to manually update .env when switching
 * WiFi networks or deploying to different environments.
 * 
 * How it works:
 * - In development (via `npm run dev` or `npm run preview`), Vite's built-in
 *   proxy forwards `/api`, `/uploads`, and `/socket.io` requests to the backend,
 *   so we use relative paths (empty string as base URL).
 * - In production builds served without the Vite proxy, we dynamically construct
 *   the API URL from the browser's current hostname + backend port (5005).
 * - If VITE_API_URL is set to a real domain (not a local IP), we honor it.
 */

const BACKEND_PORT = 5005;

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  // If a real domain/production URL is explicitly set, use it
  if (envUrl && !envUrl.includes('192.168.') && !envUrl.includes('127.0.0.1') && !envUrl.includes('localhost')) {
    return envUrl;
  }

  // In Vite dev/preview mode, the proxy handles routing — use relative paths
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    return '';
  }

  // Production build without proxy: dynamically resolve from current hostname
  // This works regardless of which IP/hostname the user accesses the app from
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:${BACKEND_PORT}`;
};

export const API_URL = getApiUrl();
export default API_URL;
