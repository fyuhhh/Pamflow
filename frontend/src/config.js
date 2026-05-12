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

  // If we are accessing the app through a proxy (like Vite dev/preview server)
  // or a reverse proxy (Nginx), use relative paths to let the proxy handle it.
  // We assume we're behind a proxy if the current port isn't the backend port.
  if (window.location.port && window.location.port !== String(BACKEND_PORT)) {
    return '';
  }

  // In Vite dev mode, always use relative paths
  if (import.meta.env.DEV) {
    return '';
  }

  // Fallback: resolve from current hostname
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:${BACKEND_PORT}`;
};

export const API_URL = getApiUrl();
export default API_URL;
