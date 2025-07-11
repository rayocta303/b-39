// config.js
// Konfigurasi global untuk cache
let useCache = true;

// API Configuration
const API_CONFIG = {
  // Environment setting: 'development' uses JSON, 'production' uses PHP
  environment: 'development', // 'development' | 'production'
  
  // Base URLs for different environments
  baseUrls: {
    development: './api',
    production: './api'
  },
  
  // API endpoints
  endpoints: {
    development: {
      gallery: '/gallery.json',
      vendors: '/vendors.json'
    },
    production: {
      gallery: '/gallery.php',
      vendors: '/vendors.php'
    }
  },
  
  // Debug settings
  debug: {
    enabled: false, // Global debug flag
    showApiCalls: false, // Log API calls
    showCacheInfo: false, // Log cache operations
    showFilterInfo: false, // Log filtering operations
    showDebugCard: false // Show debug card in UI
  }
};

/**
 * Aktifkan atau nonaktifkan cache
 * @param {boolean} status - true untuk aktif, false untuk nonaktif
 */
export function setCacheEnabled(status) {
  useCache = status === true;
}

/**
 * Cek apakah cache sedang diaktifkan
 * @returns {boolean}
 */
export function isCacheEnabled() {
  return useCache;
}

/**
 * Get API configuration
 * @returns {object}
 */
export function getApiConfig() {
  return API_CONFIG;
}

/**
 * Get current API base URL
 * @returns {string}
 */
export function getApiBaseUrl() {
  return API_CONFIG.baseUrls[API_CONFIG.environment];
}

/**
 * Get API endpoint for current environment
 * @param {string} endpointName - 'gallery' or 'vendors'
 * @returns {string}
 */
export function getApiEndpoint(endpointName) {
  const endpoint = API_CONFIG.endpoints[API_CONFIG.environment][endpointName];
  return getApiBaseUrl() + endpoint;
}

/**
 * Set API environment
 * @param {'development'|'production'} env
 */
export function setApiEnvironment(env) {
  if (env === 'development' || env === 'production') {
    API_CONFIG.environment = env;
  }
}

/**
 * Get current API environment
 * @returns {string}
 */
export function getApiEnvironment() {
  return API_CONFIG.environment;
}

/**
 * Enable or disable debug mode
 * @param {boolean} enabled
 */
export function setDebugEnabled(enabled) {
  API_CONFIG.debug.enabled = enabled === true;
}

/**
 * Check if debug mode is enabled
 * @returns {boolean}
 */
export function isDebugEnabled() {
  return API_CONFIG.debug.enabled;
}

/**
 * Enable or disable debug card
 * @param {boolean} enabled
 */
export function setDebugCardEnabled(enabled) {
  API_CONFIG.debug.showDebugCard = enabled === true;
  
  // Show/hide debug card in UI
  const debugCard = document.getElementById('debugCard');
  if (debugCard) {
    debugCard.style.display = enabled ? 'block' : 'none';
  }
}

/**
 * Check if debug card is enabled
 * @returns {boolean}
 */
export function isDebugCardEnabled() {
  return API_CONFIG.debug.showDebugCard;
}

/**
 * Get debug configuration
 * @returns {object}
 */
export function getDebugConfig() {
  return API_CONFIG.debug;
}

/**
 * Set specific debug option
 * @param {string} option - Debug option name
 * @param {boolean} enabled - Enable/disable
 */
export function setDebugOption(option, enabled) {
  if (API_CONFIG.debug.hasOwnProperty(option)) {
    API_CONFIG.debug[option] = enabled === true;
  }
}

/**
 * Log debug message if debug is enabled
 * @param {string} type - Debug type (api, cache, filter)
 * @param {string} message - Debug message
 * @param {any} data - Additional data
 */
export function debugLog(type, message, data = null) {
  if (!API_CONFIG.debug.enabled) return;
  
  const shouldLog = {
    api: API_CONFIG.debug.showApiCalls,
    cache: API_CONFIG.debug.showCacheInfo,
    filter: API_CONFIG.debug.showFilterInfo
  };
  
  if (shouldLog[type]) {
    console.log(`[DEBUG-${type.toUpperCase()}]`, message, data || '');
  }
}
