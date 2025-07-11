// gallery.js
import { appendLog } from "./bleManager.js";
import { 
  isCacheEnabled, 
  getApiEndpoint, 
  getApiEnvironment, 
  isDebugEnabled, 
  isDebugCardEnabled,
  debugLog 
} from "./config.js";
import { getCachedAnimation, getCachedHeader, preloadAssets } from "./cache.js";

window.selectedGifMeta = null; // Metadata global animasi terpilih
const gifPreviewCache = new Map(); // { [url]: HTMLImageElement }
const headerCache = new Map(); // { [url]: { text, size } }
const gifThumbCache = new Map(); // untuk thumbnail galeri
let galleryData = [];

// Enhanced cache system
const cacheStore = {
  gallery: new Map(),
  headers: new Map(),
  images: new Map(),
  metadata: new Map(),
  
  // Cache management
  clear() {
    this.gallery.clear();
    this.headers.clear();
    this.images.clear();
    this.metadata.clear();
  },
  
  // Get cache size
  size() {
    return this.gallery.size + this.headers.size + this.images.size + this.metadata.size;
  },
  
  // Set with TTL (time to live)
  set(store, key, value, ttl = 3600000) { // 1 hour default
    const item = {
      value,
      timestamp: Date.now(),
      ttl
    };
    this[store].set(key, item);
  },
  
  // Get with TTL check
  get(store, key) {
    const item = this[store].get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this[store].delete(key);
      return null;
    }
    
    return item.value;
  }
};

// Global variables for current user context
let currentSerialNumber = "";
let currentVendorCode = "";
let currentLicenseType = "00"; // Default to no license

// Export functions to update user context from other modules
export function updateUserContext(serialNumber, vendorCode, licenseType) {
  currentSerialNumber = serialNumber || "";
  currentVendorCode = vendorCode || "";
  currentLicenseType = licenseType || "00";

  // Refresh categories and gallery when context changes
  loadCategories();
  renderGallery("all");

  appendLog(`Context updated: SN=${currentSerialNumber}, Vendor=${currentVendorCode}, License=${currentLicenseType}`);
  
  // Reload gallery with new context filters
  const filters = {
    sn: currentSerialNumber,
    license: currentLicenseType,
    vendor: currentVendorCode
  };
  
  if (getApiEnvironment() === 'production') {
    loadGalleryData(filters);
  }
}

/**
 * Build API URL with filters for PHP endpoints
 */
function buildApiUrl(endpoint, filters = {}) {
  const baseUrl = getApiEndpoint(endpoint);
  
  if (getApiEnvironment() === 'development') {
    return baseUrl; // JSON files don't support filters
  }
  
  // Build query string for PHP API
  const params = new URLSearchParams();
  
  if (filters.sn) params.append('sn', filters.sn);
  if (filters.license) params.append('license', filters.license);
  if (filters.vendor) params.append('vendor', filters.vendor);
  if (filters.category) params.append('category', filters.category);
  if (isDebugEnabled()) params.append('debug', 'true');
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Update debug card with current information
 */
function updateDebugCard(info) {
  if (!isDebugCardEnabled()) return;
  
  const debugCard = document.getElementById('debugCard');
  if (!debugCard) return;
  
  const timestamp = new Date().toLocaleTimeString();
  
  let debugHtml = `
    <div class="debug-header">
      <h4>Debug Info (${timestamp})</h4>
      <small>Environment: ${getApiEnvironment()}</small>
    </div>
    <div class="debug-content">
      <div><strong>Source:</strong> ${info.source}</div>
  `;
  
  if (info.data) {
    debugHtml += `<div><strong>Items:</strong> ${Array.isArray(info.data) ? info.data.length : 'N/A'}</div>`;
  }
  
  if (info.categories) {
    debugHtml += `<div><strong>Categories:</strong> ${info.categories.join(', ')}</div>`;
  }
  
  if (info.debug) {
    debugHtml += `
      <div><strong>Query Params:</strong></div>
      <div class="debug-params">
        ${Object.entries(info.debug.query_params || {}).map(([key, value]) => 
          `<span>${key}: ${value || 'none'}</span>`
        ).join('<br>')}
      </div>
    `;
  }
  
  if (info.error) {
    debugHtml += `<div class="debug-error"><strong>Error:</strong> ${info.error}</div>`;
  }
  
  debugHtml += '</div>';
  
  debugCard.innerHTML = debugHtml;
}

async function loadGalleryData(filters = {}) {
  try {
    // Show skeleton loader
    showSkeletonLoader();
    
    // Build API URL with filters
    const apiUrl = buildApiUrl('gallery', filters);
    debugLog('api', 'Loading gallery data from:', apiUrl);
    
    // Check cache first for basic gallery data (no filters)
    const cacheKey = Object.keys(filters).length === 0 ? 'main' : JSON.stringify(filters);
    const cachedData = cacheStore.get('gallery', cacheKey);
    
    if (cachedData && Object.keys(filters).length === 0) {
      galleryData = cachedData;
      loadCategories();
      renderGallery("all");
      hideSkeletonLoader();
      debugLog('cache', 'Gallery loaded from cache');
      appendLog("Gallery loaded from cache");
      updateDebugCard({ source: 'cache', data: galleryData });
      return;
    }
    
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`Failed to load gallery: ${res.status}`);
    
    const responseData = await res.json();
    debugLog('api', 'Gallery API response:', responseData);
    
    // Handle different response formats
    if (getApiEnvironment() === 'production' && responseData.success) {
      galleryData = responseData.data;
      updateDebugCard({ 
        source: 'api-php', 
        data: galleryData, 
        debug: responseData.debug,
        categories: responseData.categories 
      });
    } else {
      galleryData = responseData;
      updateDebugCard({ source: 'api-json', data: galleryData });
    }
    
    // Cache the data only if no filters applied
    if (Object.keys(filters).length === 0) {
      cacheStore.set('gallery', 'main', galleryData);
    }

    // Load categories and render gallery
    loadCategories();
    renderGallery("all");
    hideSkeletonLoader();
    
    // Preload assets in background for offline support
    if (isCacheEnabled()) {
      preloadAssets(galleryData).catch(err => 
        console.warn("Asset preloading failed:", err)
      );
    }
    
    debugLog('api', 'Gallery data loaded successfully', { count: galleryData.length });
    
  } catch (err) {
    hideSkeletonLoader();
    debugLog('api', 'Gallery loading failed:', err);
    appendLog("Gagal mengambil galeri: " + err.message);
    updateDebugCard({ source: 'error', error: err.message });
  }
}

function showSkeletonLoader() {
  const container = document.getElementById("galleryList");
  container.innerHTML = "";
  
  // Create skeleton items
  for (let i = 0; i < 8; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton-item";
    skeleton.innerHTML = `
      <div class="skeleton-image bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-full aspect-[4/3]"></div>
    `;
    container.appendChild(skeleton);
  }
}

function hideSkeletonLoader() {
  const skeletons = document.querySelectorAll(".skeleton-item");
  skeletons.forEach(skeleton => skeleton.remove());
}

/**
 * Check if user has access to animation based on license type
 */
function hasLicenseAccess(animationLicenseType) {
  if (!animationLicenseType) return true; // No license requirement

  const userLicense = parseInt(currentLicenseType) || 0;
  const reqLicense = parseInt(animationLicenseType) || 0;

  // License hierarchy: 03 (full) > 02 (standard) > 01 (basic)
  return userLicense >= reqLicense;
}

/**
 * Check if animation belongs to current user or vendor
 */
function isOwnedByUser(animation) {
  // Check if user owns this animation by serial number
  if (currentSerialNumber && animation.serialNumber === currentSerialNumber) {
    return true;
  }

  // Check if animation belongs to user's vendor
  if (currentVendorCode && animation.vendorCode === currentVendorCode) {
    return true;
  }

  return false;
}

/**
 * Filter gallery data based on current user context
 */
function getFilteredGalleryData() {
  return galleryData.filter(item => {
    // Always show animations without any restrictions
    if (!item.licenseType && !item.serialNumber && !item.vendorCode) {
      return true;
    }

    // Show if user has proper license access
    if (item.licenseType && !hasLicenseAccess(item.licenseType)) {
      return false;
    }

    // Show if owned by user or vendor
    if (item.serialNumber || item.vendorCode) {
      return isOwnedByUser(item);
    }

    return true;
  });
}

/**
 * Load and populate categories dropdown from filtered gallery data
 */
function loadCategories() {
  const categoryFilter = document.getElementById('categoryFilter');
  if (!categoryFilter) return;

  // Get filtered data based on user context
  const filteredData = getFilteredGalleryData();

  // Get unique categories from filtered gallery data
  const uniqueCategories = [...new Set(filteredData.map(item => item.category))];

  // Sort categories alphabetically
  uniqueCategories.sort();

  // Clear existing options except the default "Semua Kategori"
  categoryFilter.innerHTML = '<option value="all">Semua Kategori</option>';

  // Add category options
  uniqueCategories.forEach(category => {
    if (category && category.trim() !== '') {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    }
  });

  // Add special "Customer Request" category if user has owned animations
  const hasOwnedAnimations = currentSerialNumber && filteredData.some(item => 
    item.serialNumber === currentSerialNumber
  );

  if (hasOwnedAnimations) {
    const customerOption = document.createElement('option');
    customerOption.value = 'Customer Request';
    customerOption.textContent = 'Customer Request (Milik Anda)';
    categoryFilter.appendChild(customerOption);
  }
}

function renderGallery(filter = "all") {
  const container = document.getElementById("galleryList");
  container.innerHTML = "";

  // Get filtered data based on user context (license, ownership)
  const contextFilteredData = getFilteredGalleryData();

  // Apply category filter only
  const filtered = contextFilteredData.filter((item) => {
    // Category filter
    let categoryMatch = true;
    if (filter === "Customer Request") {
      // Show only animations owned by current user
      categoryMatch = item.category === "Customer Request" || 
                     (currentSerialNumber && item.serialNumber === currentSerialNumber);
    } else if (filter !== "all") {
      categoryMatch = item.category === filter;
    }

    return categoryMatch;
  });

  // Create placeholder buttons first for better UX
  filtered.forEach((gif, index) => {
    const placeholder = createPlaceholderButton(gif);
    container.appendChild(placeholder);
    
    // Lazy load images with delay
    setTimeout(() => {
      lazyLoadImage(gif, placeholder);
    }, index * 50); // Staggered loading
  });
}

function createPlaceholderButton(gif) {
  const btn = document.createElement("button");
  btn.className = "focus:outline-none";
  btn.innerHTML = `
    <div class="rounded shadow w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
      <i class="fas fa-image text-gray-400 text-2xl"></i>
    </div>
  `;
  return btn;
}

async function lazyLoadImage(gif, placeholder) {
  const src = gif.image;
  
  try {
    // Use new IndexedDB cache system
    const cachedSrc = await getCachedAnimation(src);
    
    if (cachedSrc) {
      const btn = createGifButton(gif, cachedSrc);
      placeholder.replaceWith(btn);
    } else {
      // Show error state if can't load
      placeholder.innerHTML = `
        <div class="rounded shadow w-full aspect-[4/3] bg-red-100 dark:bg-red-900 flex items-center justify-center">
          <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
        </div>
      `;
    }
  } catch (error) {
    console.warn(`Failed to load animation: ${src}`, error);
    placeholder.innerHTML = `
      <div class="rounded shadow w-full aspect-[4/3] bg-red-100 dark:bg-red-900 flex items-center justify-center">
        <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
      </div>
    `;
  }
}

function createGifButton(gif, imgSrc) {
  const btn = document.createElement("button");
  btn.className = "focus:outline-none";

  btn.innerHTML = `
    <img
      src="${imgSrc}"
      alt="${gif.name}"
      title="${gif.name}"
      class="rounded shadow hover:scale-105 transition w-full aspect-[4/3] object-cover"
    >
  `;

  btn.addEventListener("click", async () => {
    window.selectedGifMeta = gif;
    appendLog(`Animasi dipilih: ${gif.name}`);
    document.getElementById("selectedAnimationTitle").innerText = gif.name;

    try {
      const [leftRes, rightRes] = await Promise.all([
        fetch(gif.headerLeft),
        fetch(gif.headerRight),
      ]);
      const [leftText, rightText] = await Promise.all([
        leftRes.text(),
        rightRes.text(),
      ]);

      document.getElementById("uploadHeaderContentLeft").value = leftText;
      document.getElementById("uploadHeaderContentRight").value = rightText;

      const fileInput = document.getElementById("uploadFileName");
      if (fileInput) fileInput.value = gif.name;

      const currentSide =
        document.querySelector('input[name="uploadSide"]:checked')?.value ||
        "LEFT";
      updatePreviewGif(gif, currentSide);

      appendLog(`Header kiri & kanan untuk "${gif.name}" telah dimuat.`);
      closeGalleryModal();
    } catch (err) {
      appendLog("Gagal memuat file header: " + err.message);
    }
  });

  return btn;
}

export async function selectGif(gif, isDefault = false) {
  window.selectedGifMeta = gif;
  if (!isDefault) appendLog(`Animasi dipilih: ${gif.name}`);
  updateMarquee(gif.name);

  const fileInput = document.getElementById("uploadFileName");
  if (fileInput) fileInput.value = gif.name;

  const currentSide =
    document.querySelector('input[name="uploadSide"]:checked')?.value || "LEFT";
  updatePreviewGif(gif, currentSide);

  // Update debug info
  updateDebugInfo();

  let leftText = "",
    rightText = "",
    leftSize = 0,
    rightSize = 0;

  try {
    const [leftRes, rightRes] = await Promise.all([
      fetch(gif.headerLeft, { cache: "no-store" }),
      fetch(gif.headerRight, { cache: "no-store" }),
    ]);

    // LEFT
    if (leftRes.ok) {
      const url = gif.headerLeft;
      const text = await leftRes.text();
      const size = new TextEncoder().encode(text).length;

      if (
        isCacheEnabled() &&
        headerCache.has(url) &&
        headerCache.get(url).size === size
      ) {
        leftText = headerCache.get(url).text;
      } else {
        leftText = text;
        headerCache.set(url, { text, size });
      }
      leftSize = size;
      document.getElementById("uploadHeaderContentLeft").value = leftText;
    } else {
      document.getElementById("uploadHeaderContentLeft").value = "";
      if (!isDefault) appendLog("Header kiri tidak ditemukan.");
    }

    // RIGHT
    if (rightRes.ok) {
      const url = gif.headerRight;
      const text = await rightRes.text();
      const size = new TextEncoder().encode(text).length;

      if (
        isCacheEnabled() &&
        headerCache.has(url) &&
        headerCache.get(url).size === size
      ) {
        rightText = headerCache.get(url).text;
      } else {
        rightText = text;
        headerCache.set(url, { text, size });
      }
      rightSize = size;
      document.getElementById("uploadHeaderContentRight").value = rightText;
    } else {
      document.getElementById("uploadHeaderContentRight").value = "";
      if (!isDefault) appendLog("Header kanan tidak ditemukan.");
    }

    if (!isDefault && (leftRes.ok || rightRes.ok)) {
      appendLog(`Header untuk "${gif.name}" telah dimuat.`);
      appendLog(
        `Size Header: Kiri = ${leftSize} bytes, Kanan = ${rightSize} bytes`
      );
    }
  } catch (err) {
    if (!isDefault) appendLog("Gagal memuat file header: " + err.message);
  }
}

// Update preview GIF sesuai sisi
function updatePreviewGif(gif, side = "LEFT") {
  const imgEl = document.getElementById("gifPreviewImage");
  if (!imgEl || !gif) return;

  const src = gif.imagePreview || gif.image;

  if (gifPreviewCache.has(src)) {
    console.log(`[CACHE] Menggunakan gambar dari cache: ${src}`);
    imgEl.src = gifPreviewCache.get(src);
  } else {
    console.log(`[FETCH] Memuat gambar baru: ${src}`);
    const preloadImg = new Image();
    preloadImg.onload = () => {
      gifPreviewCache.set(src, preloadImg.src); // ← simpan URL, bukan elemen
      imgEl.src = preloadImg.src;
    };
    preloadImg.onerror = () => {
      console.warn(`Gagal memuat gambar: ${src}`);
    };
    preloadImg.src = src;
  }

  imgEl.style.transform = side === "RIGHT" ? "scaleX(-1)" : "scaleX(1)";
}

// Saat radio kiri/kanan diubah → ubah preview gif
document.querySelectorAll('input[name="uploadSide"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const side = radio.value;
    if (window.selectedGifMeta) {
      updatePreviewGif(window.selectedGifMeta, side);
    }
  });
});

// Modal controls
function openGalleryModal() {
  document.getElementById("galleryModal")?.classList.remove("hidden");
}
function closeGalleryModal() {
  document.getElementById("galleryModal")?.classList.add("hidden");
}

document.getElementById("openGalleryBtn")?.addEventListener("click", () => {
  renderGallery("all");
  openGalleryModal();
});
document
  .getElementById("closeGalleryBtn")
  ?.addEventListener("click", closeGalleryModal);

document.getElementById("categoryFilter")?.addEventListener("change", (e) => {
  renderGallery(e.target.value);
});


// Load animasi pertama saat halaman dimuat, tanpa log
document.addEventListener("DOMContentLoaded", () => {
  const defaultGif = galleryData[0];
  if (defaultGif) {
    selectGif(defaultGif, true); // true → agar tidak log
  }
});

// SELECTED TITLE
function updateMarquee(titleText) {
  const container = document.getElementById("selectedAnimationTitle");
  if (!container) return;

  container.innerHTML = "";

  const span = document.createElement("span");
  span.textContent = titleText.toUpperCase();
  span.className = "inline-block";
  container.appendChild(span);

  requestAnimationFrame(() => {
    const isOverflowing = span.scrollWidth > container.clientWidth;
    if (isOverflowing) {
      span.classList.add("animate-marquee");
    } else {
      span.classList.remove("animate-marquee");
    }
  });
}

// Debug Info Functions
function updateDebugInfo() {
  // Update device info
  updateDeviceDebugInfo();
  
  // Update gallery context
  updateGalleryContextDebugInfo();
  
  // Update file info
  updateFileDebugInfo();
  
  // Update selected data
  updateSelectedDataDebugInfo();
  
  // Update gif preview
  updateGifPreviewDebugInfo();
}

function updateDeviceDebugInfo() {
  const deviceInfo = {
    serial: currentSerialNumber || 'Not connected',
    license: currentLicenseType || 'Unknown',
    licenseName: getLicenseName(currentLicenseType),
    vendor: currentVendorCode || 'Not detected',
    vendorName: getVendorName(currentVendorCode),
    connection: window.isBLEConnected ? window.isBLEConnected() ? 'Connected' : 'Disconnected' : 'Disconnected',
    type: 'BLE Device',
    firmware: '-',
    lastResponse: window.lastBLEResponse || '-',
    responseTime: window.lastResponseTime || '-'
  };

  document.getElementById('deviceSerial').textContent = deviceInfo.serial;
  document.getElementById('deviceLicense').textContent = deviceInfo.license;
  document.getElementById('deviceLicenseName').textContent = deviceInfo.licenseName;
  document.getElementById('deviceVendor').textContent = deviceInfo.vendor;
  document.getElementById('deviceVendorName').textContent = deviceInfo.vendorName;
  document.getElementById('deviceConnection').textContent = deviceInfo.connection;
  document.getElementById('deviceConnection').className = `ml-2 ${deviceInfo.connection === 'Connected' ? 'text-green-500' : 'text-red-500'}`;
  document.getElementById('deviceType').textContent = deviceInfo.type;
  document.getElementById('deviceFirmware').textContent = deviceInfo.firmware;
  document.getElementById('deviceLastResponse').textContent = deviceInfo.lastResponse;
  document.getElementById('deviceResponseTime').textContent = deviceInfo.responseTime;
}

function updateGalleryContextDebugInfo() {
  const contextInfo = {
    serial: currentSerialNumber || '-',
    vendor: currentVendorCode || '-',
    license: currentLicenseType || '-',
    category: document.getElementById('categoryFilter')?.value || 'All',
    total: galleryData.length,
    filtered: getFilteredGalleryData().length
  };

  document.getElementById('contextSerial').textContent = contextInfo.serial;
  document.getElementById('contextVendor').textContent = contextInfo.vendor;
  document.getElementById('contextLicense').textContent = contextInfo.license;
  document.getElementById('contextCategory').textContent = contextInfo.category;
  document.getElementById('contextTotal').textContent = contextInfo.total;
  document.getElementById('contextFiltered').textContent = contextInfo.filtered;
}

function updateFileDebugInfo() {
  const fileInfo = document.getElementById('fileInfo');
  
  if (!window.selectedGifMeta) {
    fileInfo.innerHTML = '<p class="text-gray-600 dark:text-gray-400">No file selected</p>';
    return;
  }

  const gif = window.selectedGifMeta;
  const leftContent = document.getElementById("uploadHeaderContentLeft")?.value || '';
  const rightContent = document.getElementById("uploadHeaderContentRight")?.value || '';
  
  fileInfo.innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div><strong>Name:</strong> ${gif.name}</div>
          <div><strong>Image:</strong> ${gif.image}</div>
          <div><strong>Left Header:</strong> ${gif.headerLeft}</div>
          <div><strong>Right Header:</strong> ${gif.headerRight}</div>
          <div><strong>Left Size:</strong> ${new TextEncoder().encode(leftContent).length} bytes</div>
          <div><strong>Right Size:</strong> ${new TextEncoder().encode(rightContent).length} bytes</div>
          <div><strong>Cache Status:</strong> ${cacheStore.size()} items</div>
        </div>
      </div>
      
      <!-- Header Preview Section -->
      <div class="border-t pt-4 mt-4">
        <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-3">Header Preview</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Left Header Preview -->
          <div>
            <h5 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Left Header Content</h5>
            <div class="bg-gray-50 dark:bg-gray-600 p-3 rounded border max-h-32 overflow-y-auto">
              <pre class="text-xs font-mono text-gray-700 dark:text-gray-200 whitespace-pre-wrap">${leftContent ? leftContent.substring(0, 500) + (leftContent.length > 500 ? '...' : '') : 'No content'}</pre>
            </div>
          </div>
          
          <!-- Right Header Preview -->
          <div>
            <h5 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Right Header Content</h5>
            <div class="bg-gray-50 dark:bg-gray-600 p-3 rounded border max-h-32 overflow-y-auto">
              <pre class="text-xs font-mono text-gray-700 dark:text-gray-200 whitespace-pre-wrap">${rightContent ? rightContent.substring(0, 500) + (rightContent.length > 500 ? '...' : '') : 'No content'}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateSelectedDataDebugInfo() {
  const selectedData = document.getElementById('selectedData');
  
  if (!window.selectedGifMeta) {
    selectedData.innerHTML = '<p class="text-gray-600 dark:text-gray-400">No data selected</p>';
    return;
  }

  const gif = window.selectedGifMeta;
  const selectedSide = document.querySelector('input[name="uploadSide"]:checked')?.value || 'LEFT';
  
  selectedData.innerHTML = `
    <div class="space-y-2 text-sm">
      <div><strong>Animation:</strong> ${gif.name}</div>
      <div><strong>Category:</strong> ${gif.category}</div>
      <div><strong>Selected Side:</strong> ${selectedSide}</div>
      <div><strong>License Type:</strong> ${gif.licenseType || 'None'}</div>
      <div><strong>Serial Number:</strong> ${gif.serialNumber || 'None'}</div>
      <div><strong>Vendor Code:</strong> ${gif.vendorCode || 'None'}</div>
      <div><strong>Access Status:</strong> ${hasLicenseAccess(gif.licenseType) ? 'Allowed' : 'Denied'}</div>
      <div><strong>Ownership:</strong> ${isOwnedByUser(gif) ? 'Owned' : 'Public'}</div>
    </div>
  `;
}

function updateGifPreviewDebugInfo() {
  const gifPreview = document.getElementById('gifPreview');
  
  if (!window.selectedGifMeta) {
    gifPreview.innerHTML = '<p class="text-gray-600 dark:text-gray-400 text-sm">No GIF selected</p>';
    return;
  }

  const gif = window.selectedGifMeta;
  const selectedSide = document.querySelector('input[name="uploadSide"]:checked')?.value || 'LEFT';
  
  gifPreview.innerHTML = `
    <div class="space-y-2">
      <img src="${gif.image}" alt="${gif.name}" class="max-w-full h-32 object-contain mx-auto rounded" 
           style="transform: ${selectedSide === 'RIGHT' ? 'scaleX(-1)' : 'scaleX(1)'}">
      <div class="text-sm">
        <div><strong>Image:</strong> ${gif.image}</div>
        <div><strong>Side:</strong> ${selectedSide}</div>
        <div><strong>Transform:</strong> ${selectedSide === 'RIGHT' ? 'Flipped' : 'Normal'}</div>
      </div>
    </div>
  `;
}

function getLicenseName(licenseType) {
  const licenses = {
    '00': 'No License',
    '01': 'Basic License',
    '02': 'Standard License',
    '03': 'Full License'
  };
  return licenses[licenseType] || 'Unknown';
}

function getVendorName(vendorCode) {
  // This would typically come from the vendors API
  const vendors = {
    'XYZ': 'XYZ Electronics',
    'BILED': 'Lampu Biled Indonesia',
    'GENERIC': 'Lampubiled.id Official'
  };
  return vendors[vendorCode] || 'Unknown Vendor';
}

// Toggle debug panel
document.getElementById('toggleDebugBtn')?.addEventListener('click', () => {
  const debugContent = document.getElementById('debugContent');
  const debugToggleIcon = document.getElementById('debugToggleIcon');
  const debugToggleText = document.getElementById('debugToggleText');

  if (debugContent.classList.contains('hidden')) {
    debugContent.classList.remove('hidden');
    debugToggleIcon.className = 'fas fa-chevron-up mr-1';
    debugToggleText.textContent = 'Minimize';
    updateDebugInfo();
  } else {
    debugContent.classList.add('hidden');
    debugToggleIcon.className = 'fas fa-chevron-down mr-1';
    debugToggleText.textContent = 'Show Debug';
  }
});

// Add keyboard shortcut for debug toggle (Ctrl+D)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'd') {
    e.preventDefault();
    document.getElementById('toggleDebugBtn')?.click();
  }
});

// Update debug info when upload side changes
document.querySelectorAll('input[name="uploadSide"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    updateDebugInfo();
  });
});

// Load Data Gallery
document.addEventListener("DOMContentLoaded", async () => {
  await loadGalleryData();
  // Jika ingin langsung pilih default (tanpa log)
  if (galleryData.length > 0) {
    selectGif(galleryData[0], true);
  }
});