// config.js
// Konfigurasi global untuk cache
let useCache = true;

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
