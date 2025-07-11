// Global variables
let galleryData = [];
let filteredGalleryData = [];

/**
 * Load gallery data from JSON file
 */
async function loadGalleryData() {
    try {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const galleryContainer = document.getElementById('galleryContainer');
        const noResults = document.getElementById('noResults');
        
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        galleryContainer.innerHTML = '';
        noResults.style.display = 'none';
        
        const response = await fetch('api/gallery.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        galleryData = data;
        filteredGalleryData = [...galleryData]; // Initialize filtered data
        
        // Hide loading indicator
        loadingIndicator.style.display = 'none';
        
        // Load categories and render gallery
        loadCategories();
        renderGallery();
        
    } catch (error) {
        console.error('Error loading gallery data:', error);
        const loadingIndicator = document.getElementById('loadingIndicator');
        const galleryContainer = document.getElementById('galleryContainer');
        
        loadingIndicator.style.display = 'none';
        galleryContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <h4>Error Loading Gallery</h4>
                    <p>Unable to load gallery data: ${error.message}</p>
                </div>
            </div>
        `;
    }
}

/**
 * Load and populate categories dropdown from filtered gallery data
 */
function loadCategories() {
    const categoryFilter = document.getElementById('categoryFilter');
    
    // Get unique categories from filtered gallery data
    const uniqueCategories = [...new Set(filteredGalleryData.map(item => item.category))];
    
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
}

/**
 * Render gallery items based on filters
 */
function renderGallery(filter = "all") {
    const galleryContainer = document.getElementById('galleryContainer');
    const noResults = document.getElementById('noResults');
    
    // Get filter values
    const categoryFilter = filter;
    
    // Filter gallery data
    let filteredItems = galleryData.filter(item => {
        // Category filter
        if (categoryFilter !== "all" && item.category !== categoryFilter) {
            return false;
        }
        
        return true;
    });
    
    // Update filtered gallery data for category loading
    filteredGalleryData = filteredItems;
    
    // Clear container
    galleryContainer.innerHTML = '';
    
    // Show no results message if no items found
    if (filteredItems.length === 0) {
        noResults.style.display = 'block';
        return;
    } else {
        noResults.style.display = 'none';
    }
    
    // Render items
    filteredItems.forEach(item => {
        const galleryItem = createGalleryItem(item);
        galleryContainer.appendChild(galleryItem);
    });
}

/**
 * Create gallery item HTML element
 */
function createGalleryItem(item) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3 mb-4';
    
    col.innerHTML = `
        <div class="card h-100">
            <img src="${item.image}" class="card-img-top" alt="${item.name}" style="height: 200px; object-fit: cover;">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${item.name}</h5>
                <p class="card-text"><strong>Category:</strong> ${item.category}</p>
                <div class="card-text">
                    <div class="row">
                        <div class="col-6"><strong>Left:</strong> ${item.headerLeft}</div>
                        <div class="col-6"><strong>Right:</strong> ${item.headerRight}</div>
                    </div>
                </div>
                ${item.vendorCode ? `<p class="card-text"><small class="text-muted">Vendor: ${item.vendorCode}</small></p>` : ''}
                ${item.licenseType ? `<p class="card-text"><small class="text-muted">License: ${item.licenseType}</small></p>` : ''}
                ${item.serialNumber ? `<p class="card-text"><small class="text-muted">Serial: ${item.serialNumber}</small></p>` : ''}
            </div>
        </div>
    `;
    
    return col;
}

/**
 * Utility function to get unique values from array
 */
function getUniqueValues(array, key) {
    return [...new Set(array.map(item => item[key]).filter(value => value && value.trim() !== ''))];
}

/**
 * Initialize gallery on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    loadGalleryData();
});
