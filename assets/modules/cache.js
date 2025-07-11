// cache.js - Advanced caching system using IndexedDB
class CacheManager {
  constructor() {
    this.dbName = 'BLEUploaderCache';
    this.dbVersion = 1;
    this.db = null;
    this.stores = {
      animations: 'animations',
      headers: 'headers',
      metadata: 'metadata'
    };
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains(this.stores.animations)) {
          const animStore = db.createObjectStore(this.stores.animations, { keyPath: 'url' });
          animStore.createIndex('lastModified', 'lastModified', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(this.stores.headers)) {
          const headerStore = db.createObjectStore(this.stores.headers, { keyPath: 'url' });
          headerStore.createIndex('lastModified', 'lastModified', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(this.stores.metadata)) {
          db.createObjectStore(this.stores.metadata, { keyPath: 'key' });
        }
      };
    });
  }

  async checkServerFile(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return {
        exists: response.ok,
        lastModified: response.headers.get('Last-Modified'),
        size: response.headers.get('Content-Length')
      };
    } catch (error) {
      console.warn('Failed to check server file:', url, error);
      return { exists: false };
    }
  }

  async getCachedFile(url, store) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(url);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async setCachedFile(url, data, store) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      
      const cacheEntry = {
        url,
        data,
        lastModified: new Date().toISOString(),
        timestamp: Date.now()
      };
      
      const request = objectStore.put(cacheEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFile(url, type = 'animation') {
    const store = type === 'header' ? this.stores.headers : this.stores.animations;
    
    try {
      // Check cache first
      const cached = await this.getCachedFile(url, store);
      const serverInfo = await this.checkServerFile(url);
      
      // If file doesn't exist on server, return cached if available
      if (!serverInfo.exists) {
        return cached ? cached.data : null;
      }
      
      // If cached and server file hasn't changed, return cached
      if (cached && serverInfo.lastModified && 
          cached.lastModified === serverInfo.lastModified) {
        return cached.data;
      }
      
      // Fetch from server and cache
      const response = await fetch(url);
      if (!response.ok) {
        return cached ? cached.data : null;
      }
      
      let data;
      if (type === 'header') {
        data = await response.text();
      } else {
        // For animations, convert to blob URL
        const blob = await response.blob();
        data = URL.createObjectURL(blob);
      }
      
      // Cache the new data
      await this.setCachedFile(url, data, store);
      return data;
      
    } catch (error) {
      console.warn('Cache error for', url, error);
      // Fallback to cached version if available
      const cached = await this.getCachedFile(url, store);
      return cached ? cached.data : null;
    }
  }

  async preloadGalleryAssets(galleryData) {
    const loadPromises = [];
    
    galleryData.forEach(item => {
      // Preload animation
      if (item.image) {
        loadPromises.push(this.getFile(item.image, 'animation'));
      }
      
      // Preload headers
      if (item.headerLeft) {
        loadPromises.push(this.getFile(item.headerLeft, 'header'));
      }
      if (item.headerRight) {
        loadPromises.push(this.getFile(item.headerRight, 'header'));
      }
    });
    
    // Load in chunks to avoid overwhelming the browser
    const chunkSize = 5;
    for (let i = 0; i < loadPromises.length; i += chunkSize) {
      const chunk = loadPromises.slice(i, i + chunkSize);
      await Promise.allSettled(chunk);
    }
  }

  async clearCache() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([
        this.stores.animations, 
        this.stores.headers, 
        this.stores.metadata
      ], 'readwrite');
      
      const promises = [
        transaction.objectStore(this.stores.animations).clear(),
        transaction.objectStore(this.stores.headers).clear(),
        transaction.objectStore(this.stores.metadata).clear()
      ];
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCacheSize() {
    let totalSize = 0;
    const stores = [this.stores.animations, this.stores.headers];
    
    for (const store of stores) {
      const transaction = this.db.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.getAll();
      
      await new Promise((resolve) => {
        request.onsuccess = () => {
          request.result.forEach(item => {
            if (item.data) {
              totalSize += new Blob([item.data]).size;
            }
          });
          resolve();
        };
      });
    }
    
    return totalSize;
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// Initialize cache when module loads
cacheManager.init().catch(console.error);

// Export convenience functions
export async function getCachedAnimation(url) {
  return await cacheManager.getFile(url, 'animation');
}

export async function getCachedHeader(url) {
  return await cacheManager.getFile(url, 'header');
}

export async function preloadAssets(galleryData) {
  return await cacheManager.preloadGalleryAssets(galleryData);
}

export async function clearAllCache() {
  return await cacheManager.clearCache();
}