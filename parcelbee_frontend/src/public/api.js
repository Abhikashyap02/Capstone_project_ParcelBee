// API Configuration and Utility Functions for ParcelBee
// This file provides centralized API utilities used across the application

// Base URL for the backend API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Get authentication headers with JWT token
 * Checks both localStorage and sessionStorage for token
 * @returns {Object} Headers object with Content-Type and Authorization
 */
function getAuthHeaders() {
    // Check localStorage first (persistent), then sessionStorage (session-only)
    let token = localStorage.getItem('token');
    if (!token) {
        token = sessionStorage.getItem('token');
    }
    
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

/**
 * Get the stored authentication token
 * @returns {string|null} JWT token or null if not found
 */
function getToken() {
    let token = localStorage.getItem('token');
    if (!token) {
        token = sessionStorage.getItem('token');
    }
    return token;
}

/**
 * Store authentication token
 * @param {string} token - JWT token to store
 * @param {boolean} remember - If true, store in localStorage (persistent), else sessionStorage
 */
function setToken(token, remember = true) {
    if (remember) {
        localStorage.setItem('token', token);
        // Clear sessionStorage to avoid conflicts
        sessionStorage.removeItem('token');
    } else {
        sessionStorage.setItem('token', token);
        // Clear localStorage to avoid conflicts
        localStorage.removeItem('token');
    }
}

/**
 * Clear authentication token from both storage locations
 */
function clearToken() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
}

/**
 * Logout user - clears token and redirects to login page
 * @param {string} redirectUrl - Optional URL to redirect to (default: 'login.html')
 */
function logout(redirectUrl = 'login.html') {
    clearToken();
    window.location.href = redirectUrl;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists, false otherwise
 */
function isAuthenticated() {
    return getToken() !== null;
}

/**
 * Handle API errors consistently
 * @param {Response} response - Fetch API response object
 * @param {Object} data - Parsed JSON response data
 * @returns {Object} Error object with message and status
 */
async function handleApiError(response, data) {
    let errorMessage = 'An error occurred. Please try again.';
    
    if (response.status === 401) {
        // Unauthorized - token expired or invalid
        clearToken();
        errorMessage = 'Your session has expired. Please login again.';
        // Redirect to login after a short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    } else if (response.status === 403) {
        // Forbidden - user doesn't have permission
        errorMessage = data.error || 'You do not have permission to perform this action.';
    } else if (response.status === 404) {
        // Not found
        errorMessage = data.error || 'The requested resource was not found.';
    } else if (response.status === 400) {
        // Bad request - validation error
        errorMessage = data.error || 'Invalid request. Please check your input.';
    } else if (response.status >= 500) {
        // Server error
        errorMessage = data.error || 'Server error. Please try again later.';
    } else if (data && data.error) {
        errorMessage = data.error;
    }
    
    return {
        message: errorMessage,
        status: response.status
    };
}

/**
 * Check authentication and redirect to login if not authenticated
 * @param {boolean} redirect - If true, redirect to login page
 * @returns {boolean} True if authenticated, false otherwise
 */
function checkAuthAndRedirect(redirect = true) {
    if (!isAuthenticated()) {
        if (redirect) {
            window.location.href = 'login.html';
        }
        return false;
    }
    return true;
}

/**
 * Make a standardized API call with error handling
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options (method, body, etc.)
 * @param {boolean} requireAuth - Whether authentication is required (default: true)
 * @returns {Promise<Object>} Promise resolving to response data
 */
async function makeApiCall(endpoint, options = {}, requireAuth = true) {
    // Check authentication if required
    if (requireAuth && !isAuthenticated()) {
        throw new Error('Authentication required');
    }
    
    // Build full URL
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    // Merge headers
    const headers = requireAuth ? getAuthHeaders() : { 'Content-Type': 'application/json' };
    const mergedOptions = {
        ...options,
        headers: {
            ...headers,
            ...(options.headers || {})
        }
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        const data = await response.json();
        
        if (!response.ok) {
            const error = await handleApiError(response, data);
            throw new Error(error.message);
        }
        
        return data;
    } catch (error) {
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error. Please check your connection and ensure the backend server is running.');
        }
        throw error;
    }
}

// Export functions for use in other files
// Note: In a module system, use export. For now, these are global functions
if (typeof window !== 'undefined') {
    window.API = {
        BASE_URL: API_BASE_URL,
        getAuthHeaders,
        getToken,
        setToken,
        clearToken,
        isAuthenticated,
        handleApiError,
        checkAuthAndRedirect,
        makeApiCall,
        logout
    };
}
