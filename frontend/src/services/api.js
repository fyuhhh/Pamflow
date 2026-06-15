/**
 * API Service wrapper for fetch with JWT support
 * Uses the centralized API_URL from config.js
 */
import API_URL from '../config';

export const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  // Prepend API URL if endpoint doesn't start with http
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  let response = await fetch(url, config);
  
  if (response.status === 403 || response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_URL}/api/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('token', data.token);
          
          // Retry original request with new token
          config.headers['Authorization'] = `Bearer ${data.token}`;
          return fetch(url, config);
        }
      } catch (err) {
        console.error('Refresh token failed:', err);
      }
    }

    console.warn('[Auth] Token expired or invalid. Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
      window.location.href = '/';
    }
  }

  return response;
};
