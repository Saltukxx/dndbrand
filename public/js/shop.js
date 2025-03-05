/**
 * DnD Brand E-commerce - Shop Page Functionality
 * Displays products from backend API on the shop page
 */

// API URL
// Make sure we're using the API URL from config.js
let API_URL;
if (window.CONFIG && window.CONFIG.API_URL) {
    API_URL = window.CONFIG.API_URL;
    console.log('Using API URL from config.js:', API_URL);
} else {
    API_URL = 'https://dndbrand-server.onrender.com/api';
    console.log('Config not found, using fallback API URL:', API_URL);
}

// Add these variables at the top of the file, after the existing variables
let autoRefreshInterval = null;
const REFRESH_INTERVAL = 60000; // Refresh every 60 seconds

document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let products = [];
    let filteredProducts = [];
    let currentPage = 1;
    const productsPerPage = 9;
    let priceRange = {
        min: 0,
        max: 5000
    };
    let activeFilters = {
        category: 'all',
        colors: [],
        sizes: [],
        priceMin: 0,
        priceMax: 10000,
        features: [] // Add features array to store active feature filters
    };
    let sortOption = 'default';

    // DOM Elements
    const productsContainer = document.getElementById('products-container');
    const productCount = document.getElementById('product-count');
    const pagination = document.getElementById('pagination');
    const sortSelect = document.getElementById('sort-by');
    const categoryLinks = document.querySelectorAll('.category-list a');
    const colorFilters = document.querySelectorAll('.color-filter input');
    const sizeFilters = document.querySelectorAll('.size-filter input');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const applyPriceFilterBtn = document.getElementById('apply-price-filter');
    const mobileFilterToggle = document.querySelector('.mobile-filter-toggle');
    const filterClose = document.querySelector('.filter-close');
    const shopSidebar = document.querySelector('.shop-sidebar');
    const filterOverlay = document.querySelector('.filter-overlay');

    // Initialize price slider
    const priceSlider = document.getElementById('price-slider');
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');

    if (priceSlider) {
        noUiSlider.create(priceSlider, {
            start: [0, 10000],
            connect: true,
            step: 100,
            range: {
                'min': 0,
                'max': 10000
            },
            format: {
                to: function(value) {
                    return Math.round(value);
                },
                from: function(value) {
                    return Number(value);
                }
            }
        });

        priceSlider.noUiSlider.on('update', function(values, handle) {
            if (handle === 0) {
                minPriceInput.value = values[0] + ' ₺';
            } else {
                maxPriceInput.value = values[1] + ' ₺';
            }
        });
    }

    // Initialize mobile filters
    function initMobileFilters() {
        if (mobileFilterToggle && shopSidebar) {
            mobileFilterToggle.addEventListener('click', function() {
                shopSidebar.classList.add('active');
                filterOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
            
            if (filterClose) {
                filterClose.addEventListener('click', function() {
                    shopSidebar.classList.remove('active');
                    filterOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
            
            if (filterOverlay) {
                filterOverlay.addEventListener('click', function() {
                    shopSidebar.classList.remove('active');
                    filterOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
        }
    }

    // Fetch products from API
    async function fetchProducts() {
        try {
            console.log('Fetching products from API...');
            console.log('API URL:', `${API_URL}/products`);
            
            // Add a timestamp to prevent caching
            const timestamp = new Date().getTime();
            
            // Add more debugging for CORS issues
            console.log('Making fetch request to:', `${API_URL}/products?_t=${timestamp}`);
            
            const response = await fetch(`${API_URL}/products?_t=${timestamp}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);
            
            if (!response.ok) {
                console.error('Error response:', response);
                throw new Error(`Ürünler yüklenirken bir hata oluştu. Status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Raw API response:', data);
            
            // Check if the response has a 'value' property (PowerShell format)
            if (data && data.value && Array.isArray(data.value)) {
                console.log(`Found ${data.value.length} products in the response (value property)`);
                return data.value;
            }
            
            // Check if the response has a 'products' property
            if (data && data.products && Array.isArray(data.products)) {
                console.log(`Found ${data.products.length} products in the response (products property)`);
                return data.products;
            }
            
            // Check if the response has a 'data' property
            if (data && data.data && Array.isArray(data.data)) {
                console.log(`Found ${data.data.length} products in the response (data property)`);
                return data.data;
            }
            
            // Check if the response has a 'results' property
            if (data && data.results && Array.isArray(data.results)) {
                console.log(`Found ${data.results.length} products in the response (results property)`);
                return data.results;
            }
            
            // If the response is an array directly
            if (Array.isArray(data)) {
                console.log(`Found ${data.length} products in the response (direct array)`);
                return data;
            }
            
            console.error('Could not find products in the response:', data);
            return [];
        } catch (error) {
            console.error('Error fetching products:', error);
            
            // Log more details about the error for debugging
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.error('This might be a CORS issue. Check that your API server allows requests from this origin.');
                console.error('Current origin:', window.location.origin);
            }
            
            // Return mock products for development/fallback
            console.log('Returning mock products as fallback');
            return getMockProducts();
        }
    }

    // Mock products for demo
    function getMockProducts() {
        return [
            {
                id: 1,
                name: 'Premium Pamuklu T-Shirt',
                category: 'men',
                price: 349.99,
                oldPrice: 499.99,
                image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['black', 'white', 'blue'],
                sizes: ['s', 'm', 'l', 'xl'],
                isNew: true,
                isSale: true
            },
            {
                id: 2,
                name: 'Slim Fit Denim Pantolon',
                category: 'men',
                price: 599.99,
                image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['blue', 'black'],
                sizes: ['s', 'm', 'l', 'xl', 'xxl'],
                isNew: false,
                isSale: false
            },
            {
                id: 3,
                name: 'Oversize Sweatshirt',
                category: 'women',
                price: 449.99,
                oldPrice: 599.99,
                image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['white', 'gray', 'black'],
                sizes: ['xs', 's', 'm', 'l'],
                isNew: false,
                isSale: true
            },
            {
                id: 4,
                name: 'Deri Ceket',
                category: 'women',
                price: 1299.99,
                image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['black', 'brown'],
                sizes: ['s', 'm', 'l'],
                isNew: true,
                isSale: false
            },
            {
                id: 5,
                name: 'Premium Deri Kemer',
                category: 'accessories',
                price: 249.99,
                image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['black', 'brown'],
                sizes: ['s', 'm', 'l'],
                isNew: false,
                isSale: false
            },
            {
                id: 6,
                name: 'Minimalist Saat',
                category: 'accessories',
                price: 899.99,
                oldPrice: 1199.99,
                image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['black', 'silver', 'gold'],
                sizes: [],
                isNew: false,
                isSale: true
            },
            {
                id: 7,
                name: 'Yün Palto',
                category: 'men',
                price: 1499.99,
                image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['gray', 'navy', 'black'],
                sizes: ['m', 'l', 'xl'],
                isNew: true,
                isSale: false
            },
            {
                id: 8,
                name: 'Yüksek Bel Jean',
                category: 'women',
                price: 499.99,
                image: 'https://images.unsplash.com/photo-1475180098004-ca77a66827be?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['blue', 'black'],
                sizes: ['xs', 's', 'm', 'l'],
                isNew: false,
                isSale: false
            },
            {
                id: 9,
                name: 'Güneş Gözlüğü',
                category: 'accessories',
                price: 349.99,
                oldPrice: 449.99,
                image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['black', 'brown', 'tortoise'],
                sizes: [],
                isNew: false,
                isSale: true
            },
            {
                id: 10,
                name: 'Spor Ayakkabı',
                category: 'men',
                price: 799.99,
                image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['white', 'black', 'gray'],
                sizes: ['40', '41', '42', '43', '44'],
                isNew: true,
                isSale: false
            },
            {
                id: 11,
                name: 'Midi Elbise',
                category: 'women',
                price: 699.99,
                oldPrice: 899.99,
                image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['red', 'black', 'navy'],
                sizes: ['xs', 's', 'm', 'l'],
                isNew: false,
                isSale: true
            },
            {
                id: 12,
                name: 'Deri Çanta',
                category: 'accessories',
                price: 1099.99,
                image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['black', 'brown', 'tan'],
                sizes: [],
                isNew: true,
                isSale: false
            }
        ];
    }

    // Initialize shop
    async function initShop() {
        // Show loading state
        showLoading(true);
        
        // Set default price range
        activeFilters.priceMin = 0;
        activeFilters.priceMax = 10000; // Increased from 5000 to 10000
        
        // Update price inputs
        if (minPriceInput) minPriceInput.value = activeFilters.priceMin;
        if (maxPriceInput) maxPriceInput.value = activeFilters.priceMax;
        
        // Fetch products
        products = await fetchProducts();
        
        // Apply initial filters
        applyFilters();
        
        // Render products
        renderProducts();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initialize mobile filters
        initMobileFilters();
        
        // Set up auto-refresh
        setupAutoRefresh();
        
        // Add refresh button
        addRefreshButton();
        
        // Hide loading state
        showLoading(false);
    }

    // Show/hide loading state
    function showLoading(show) {
        if (show) {
            // Create loading spinner
            const loadingSpinner = document.createElement('div');
            loadingSpinner.className = 'loading-spinner';
            loadingSpinner.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                <span>Ürünler yükleniyor...</span>
            `;
            
            // Add to products container
            productsContainer.innerHTML = '';
            productsContainer.appendChild(loadingSpinner);
        } else {
            // Remove loading spinner
            const loadingSpinner = document.querySelector('.loading-spinner');
            if (loadingSpinner) {
                loadingSpinner.remove();
            }
        }
    }

    // Apply filters to products
    function applyFilters() {
        console.log('Applying filters to products. Total products:', products.length);
        console.log('Active filters:', activeFilters);
        
        // Log all products for debugging
        products.forEach((product, index) => {
            console.log(`Product ${index + 1}:`, product);
        });
        
        // IMPORTANT: Start with all products and only filter if absolutely necessary
        filteredProducts = [...products];
        
        // Filter out products without a name (these are invalid)
        filteredProducts = filteredProducts.filter(product => {
            if (!product || !product.name) {
                console.log('Product filtered out due to missing name or invalid product object');
                return false;
            }
            return true;
        });
        
        console.log('After filtering invalid products:', filteredProducts.length);
        
        // Only apply category filter if a specific category is selected
        if (activeFilters.category !== 'all') {
            filteredProducts = filteredProducts.filter(product => {
                try {
                    // Map MongoDB categories to our frontend categories
                    const productCategory = mapCategory(product.category);
                    console.log(`Product: ${product.name}, Category: ${product.category}, Mapped Category: ${productCategory}`);
                    
                    if (productCategory !== activeFilters.category) {
                        console.log(`Product ${product.name} filtered out due to category mismatch: ${productCategory} !== ${activeFilters.category}`);
                        return false;
                    }
                    return true;
                } catch (error) {
                    console.error(`Error filtering by category for product ${product.name}:`, error);
                    // If there's an error, keep the product (be lenient)
                    return true;
                }
            });
            
            console.log('After category filtering:', filteredProducts.length);
        }
        
        // Apply price filter only if the price range is not the default
        if (activeFilters.priceMin > 0 || activeFilters.priceMax < 10000) {
            filteredProducts = filteredProducts.filter(product => {
                try {
                    const price = parseFloat(product.price);
                    if (isNaN(price)) {
                        console.log(`Product ${product.name} has invalid price: ${product.price}, treating as 0`);
                        // For products with invalid prices, only filter if min price is > 0
                        return activeFilters.priceMin <= 0;
                    } else if (price < activeFilters.priceMin || price > activeFilters.priceMax) {
                        console.log(`Product ${product.name} filtered out due to price: ${price} not in range ${activeFilters.priceMin}-${activeFilters.priceMax}`);
                        return false;
                    }
                    return true;
                } catch (error) {
                    console.error(`Error filtering by price for product ${product.name}:`, error);
                    // If there's an error, keep the product (be lenient)
                    return true;
                }
            });
            
            console.log('After price filtering:', filteredProducts.length);
        }
        
        // Apply color filter only if colors are selected
        if (activeFilters.colors.length > 0) {
            filteredProducts = filteredProducts.filter(product => {
                try {
                    // Handle both array and string formats for colors
                    let productColors = [];
                    let hasColorInfo = false;
                    
                    // Check if product has colors directly
                    if (Array.isArray(product.colors) && product.colors.length > 0) {
                        productColors = product.colors.map(c => typeof c === 'string' ? c.toLowerCase() : '');
                        hasColorInfo = true;
                    } else if (product.colors) {
                        productColors = [typeof product.colors === 'string' ? product.colors.toLowerCase() : ''];
                        hasColorInfo = true;
                    } 
                    // Check if product has variants with colors
                    else if (product.variants) {
                        // Handle both array and string formats for variants
                        const variants = Array.isArray(product.variants) ? product.variants : 
                                        (typeof product.variants === 'string' ? [] : [product.variants]);
                        
                        // Look for color variants
                        for (const variant of variants) {
                            if (variant && variant.name && variant.name.toLowerCase() === 'color' && Array.isArray(variant.options)) {
                                productColors = variant.options.map(option => 
                                    typeof option === 'string' ? option.toLowerCase() : '');
                                hasColorInfo = true;
                                break;
                            }
                        }
                    }
                    
                    console.log(`Product ${product.name} colors:`, productColors);
                    
                    // Only apply color filtering if the product has color information
                    if (hasColorInfo && productColors.length > 0) {
                        const hasMatchingColor = productColors.some(color => 
                            color && activeFilters.colors.includes(color.toLowerCase())
                        );
                        
                        if (!hasMatchingColor) {
                            console.log(`Product ${product.name} filtered out due to no matching colors: ${productColors}`);
                            return false;
                        }
                    } else {
                        console.log(`Product ${product.name} has no color information, skipping color filter`);
                    }
                    
                    return true;
                } catch (error) {
                    console.error(`Error filtering by color for product ${product.name}:`, error);
                    // If there's an error, keep the product (be lenient)
                    return true;
                }
            });
            
            console.log('After color filtering:', filteredProducts.length);
        }
        
        // Apply size filter only if sizes are selected
        if (activeFilters.sizes.length > 0) {
            filteredProducts = filteredProducts.filter(product => {
                try {
                    // Handle both array and string formats for sizes
                    let productSizes = [];
                    let hasSizeInfo = false;
                    
                    // Check if product has sizes directly
                    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
                        productSizes = product.sizes.map(s => typeof s === 'string' ? s.toLowerCase() : '');
                        hasSizeInfo = true;
                    } else if (product.sizes) {
                        productSizes = [typeof product.sizes === 'string' ? product.sizes.toLowerCase() : ''];
                        hasSizeInfo = true;
                    } 
                    // Check if product has variants with sizes
                    else if (product.variants) {
                        // Handle both array and string formats for variants
                        const variants = Array.isArray(product.variants) ? product.variants : 
                                        (typeof product.variants === 'string' ? [] : [product.variants]);
                        
                        // Look for size variants
                        for (const variant of variants) {
                            if (variant && variant.name && variant.name.toLowerCase() === 'size' && Array.isArray(variant.options)) {
                                productSizes = variant.options.map(option => 
                                    typeof option === 'string' ? option.toLowerCase() : '');
                                hasSizeInfo = true;
                                break;
                            }
                        }
                    }
                    
                    console.log(`Product ${product.name} sizes:`, productSizes);
                    
                    // Only apply size filtering if the product has size information
                    if (hasSizeInfo && productSizes.length > 0) {
                        const hasMatchingSize = productSizes.some(size => 
                            size && activeFilters.sizes.includes(size.toLowerCase())
                        );
                        
                        if (!hasMatchingSize) {
                            console.log(`Product ${product.name} filtered out due to no matching sizes: ${productSizes}`);
                            return false;
                        }
                    } else {
                        console.log(`Product ${product.name} has no size information, skipping size filter`);
                    }
                    
                    return true;
                } catch (error) {
                    console.error(`Error filtering by size for product ${product.name}:`, error);
                    // If there's an error, keep the product (be lenient)
                    return true;
                }
            });
            
            console.log('After size filtering:', filteredProducts.length);
        }
        
        // Apply feature filters if any are selected
        if (activeFilters.features.length > 0) {
            filteredProducts = filteredProducts.filter(product => {
                try {
                    // Check each selected feature
                    return activeFilters.features.some(feature => {
                        switch (feature) {
                            case 'new':
                                // Check if product is new (added in the last 7 days)
                                if (product.createdAt) {
                                    const createdDate = new Date(product.createdAt);
                                    const sevenDaysAgo = new Date();
                                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                                    return createdDate >= sevenDaysAgo;
                                }
                                return product.isNew === true;
                            case 'sale':
                                // Check if product is on sale
                                return product.onSale === true || 
                                       (product.discountPrice && product.discountPrice < product.price);
                            case 'featured':
                                // Check if product is featured
                                return product.featured === true;
                            default:
                                return false;
                        }
                    });
                } catch (error) {
                    console.error(`Error filtering by feature for product ${product.name}:`, error);
                    // If there's an error, keep the product (be lenient)
                    return true;
                }
            });
            
            console.log('After feature filtering:', filteredProducts.length);
        }
        
        console.log('Final filtered products:', filteredProducts.length);
        
        // Sort products
        sortProducts();
        
        // Update product count
        updateProductCount();
        
        // Reset pagination
        currentPage = 1;
    }

    // Map MongoDB categories to frontend categories
    function mapCategory(category) {
        console.log(`Mapping category: "${category}"`);
        
        // If category is undefined or null, return 'all'
        if (!category) {
            console.log('Category is undefined or null, mapping to "all"');
            return 'all';
        }
        
        // Convert to string if it's not already
        const categoryStr = String(category).toLowerCase().trim();
        
        // Map MongoDB categories to our frontend categories
        const categoryMap = {
            'erkek': 'men',
            'kadin': 'women',
            'kadın': 'women',
            'aksesuar': 'accessories',
            'ayakkabi': 'footwear',
            'ayakkabı': 'footwear',
            'canta': 'bags',
            'çanta': 'bags',
            'clothing': 'men',
            'giyim': 'men',
            'jewelry': 'accessories',
            'takı': 'accessories',
            'men': 'men',
            'women': 'women',
            'accessories': 'accessories',
            'footwear': 'footwear',
            'bags': 'bags',
            'deneme': 'men', // Add this for test products
            'test': 'men',   // Add this for test products
            'other': 'accessories',
            'diğer': 'accessories'
        };
        
        const mappedCategory = categoryMap[categoryStr] || 'all';
        console.log(`Mapped "${category}" to "${mappedCategory}"`);
        return mappedCategory;
    }

    // Sort products based on selected option
    function sortProducts() {
        switch (sortOption) {
            case 'price-low':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'newest':
                filteredProducts.sort((a, b) => {
                    // Sort by creation date if available
                    if (a.createdAt && b.createdAt) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    // Fall back to ID-based sorting
                    return b.id - a.id;
                });
                break;
            default:
                // Default sorting (featured first, then by ID)
                filteredProducts.sort((a, b) => {
                    // Featured products first
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    // Then sort by ID
                    return a.id - b.id;
                });
                break;
        }
    }

    // Update product count
    function updateProductCount() {
        if (productCount) {
            productCount.textContent = `${filteredProducts.length} / ${products.length}`;
            console.log(`Product count updated: ${filteredProducts.length} filtered out of ${products.length} total`);
        }
    }

    // Get product image
    function getProductImage(product) {
        // Default image if no image is available
        let productImage = '/img/no-image.jpg';
        
        try {
            // Check for images array with new format (objects with original and thumbnail)
            if (Array.isArray(product.images) && product.images.length > 0) {
                const firstImage = product.images[0];
                
                // Check if image is in the new format (object with thumbnail property)
                if (firstImage && typeof firstImage === 'object' && firstImage.thumbnail) {
                    productImage = firstImage.thumbnail;
                }
                // Check if it's the old format (string URL)
                else if (firstImage && typeof firstImage === 'string') {
                    productImage = firstImage;
                }
            } 
            // Check for single image string
            else if (typeof product.images === 'string' && product.images) {
                productImage = product.images;
            } 
            // Check for image property
            else if (product.image) {
                productImage = product.image;
            }
            
            // Check if image is a relative path and add base URL if needed
            if (productImage && !productImage.startsWith('http')) {
                // If it's an upload path, use it directly from the server root
                if (productImage.includes('/uploads/')) {
                    // Make sure we don't duplicate the /uploads/ part
                    if (productImage.startsWith('/api/uploads/')) {
                        productImage = productImage.replace('/api/uploads/', '/uploads/');
                    }
                    // Make sure the path starts with a slash
                    if (!productImage.startsWith('/')) {
                        productImage = '/' + productImage;
                    }
                } 
                // For other API paths, add the API_URL
                else if (!productImage.startsWith('/img/')) {
                    // Make sure the path starts with a slash
                    if (!productImage.startsWith('/')) {
                        productImage = '/' + productImage;
                    }
                    productImage = `${API_URL}${productImage}`;
                }
            }
            
            // For demo/testing, use placeholder images if the image path doesn't exist
            if (productImage === '/img/no-image.jpg' || 
                productImage === `${API_URL}/img/no-image.jpg` ||
                productImage === 'undefined' ||
                productImage === 'null') {
                // Use placeholder images based on product category
                const category = product.category ? product.category.toLowerCase() : '';
                if (category.includes('men') || category.includes('erkek')) {
                    productImage = 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
                } else if (category.includes('women') || category.includes('kadin') || category.includes('kadın')) {
                    productImage = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
                } else if (category.includes('accessories') || category.includes('aksesuar')) {
                    productImage = 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
                } else {
                    productImage = 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
                }
            }
            
            // For debugging
            console.log('Product image path:', productImage);
        } catch (error) {
            console.error(`Error processing image for product ${product.name}:`, error);
            productImage = 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
        }
        
        return productImage;
    }

    // Render products
    function renderProducts() {
        console.log('Rendering products. Total filtered products:', filteredProducts.length);
        
        // Clear products container
        productsContainer.innerHTML = '';
        
        // Calculate pagination
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = Math.min(startIndex + productsPerPage, filteredProducts.length);
        
        console.log(`Pagination: Page ${currentPage}/${totalPages}, showing products ${startIndex+1}-${endIndex}`);
        
        // Check if there are products to display
        if (filteredProducts.length === 0) {
            console.log('No products to display');
            // Show no products message
            productsContainer.innerHTML = `
                <div class="no-products">
                    <p><i class="fas fa-search"></i></p>
                    <p>Aradığınız kriterlere uygun ürün bulunamadı.</p>
                    <p>Lütfen filtrelerinizi değiştirerek tekrar deneyin.</p>
                </div>
            `;
            
            // Hide pagination
            pagination.innerHTML = '';
            return;
        }
        
        // Create product cards
        for (let i = startIndex; i < endIndex; i++) {
            try {
                const product = filteredProducts[i];
                console.log(`Rendering product ${i+1}/${endIndex}:`, product);
                
                // Skip invalid products
                if (!product || !product.name) {
                    console.warn('Skipping invalid product:', product);
                    continue;
                }
                
                // Get product ID (handle both MongoDB _id and mock data id)
                const productId = product._id || product.id || `unknown-${i}`;
                
                // Format price - handle invalid prices
                let price = '0,00';
                try {
                    const priceValue = parseFloat(product.price);
                    if (!isNaN(priceValue)) {
                        price = priceValue.toLocaleString('tr-TR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                    }
                } catch (error) {
                    console.error(`Error formatting price for product ${product.name}:`, error);
                }
                
                // Format old price if exists
                let oldPriceHtml = '';
                try {
                    if (product.comparePrice && parseFloat(product.comparePrice) > 0) {
                        const oldPrice = parseFloat(product.comparePrice).toLocaleString('tr-TR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                        oldPriceHtml = `<span class="old-price">${oldPrice} ₺</span>`;
                    } else if (product.oldPrice && parseFloat(product.oldPrice) > 0) {
                        const oldPrice = parseFloat(product.oldPrice).toLocaleString('tr-TR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                        oldPriceHtml = `<span class="old-price">${oldPrice} ₺</span>`;
                    }
                } catch (error) {
                    console.error(`Error formatting old price for product ${product.name}:`, error);
                }
                
                // Get product image using the helper function
                const productImage = getProductImage(product);
                
                // Get product category name
                let categoryName = 'Genel';
                try {
                    categoryName = getCategoryName(product.category);
                } catch (error) {
                    console.error(`Error getting category name for product ${product.name}:`, error);
                }
                
                // Check if product is new or on sale
                let productBadges = '';
                
                // Add featured badge if product is featured
                if (product.featured) {
                    productBadges += '<span class="product-badge featured">Öne Çıkan</span>';
                }
                
                // Add sale badge if product has a discount
                if (oldPriceHtml) {
                    productBadges += '<span class="product-badge sale">İndirim</span>';
                }
                
                // Add new badge if product is new (added in the last 7 days)
                if (product.createdAt) {
                    const createdDate = new Date(product.createdAt);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    
                    if (createdDate >= sevenDaysAgo) {
                        productBadges += '<span class="product-badge new">Yeni</span>';
                    }
                } else if (product.isNew) {
                    productBadges += '<span class="product-badge new">Yeni</span>';
                }
                
                // Create product card
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.setAttribute('data-id', productId);
                
                // Product HTML
                productCard.innerHTML = `
                    <div class="product-image">
                        ${productBadges}
                        <img src="${productImage}" alt="${product.name}" 
                             onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';">
                        <div class="product-overlay">
                            <a href="#" class="quick-view" data-id="${productId}">
                                <i class="fas fa-eye"></i>
                            </a>
                            <a href="#" class="add-to-cart" data-id="${productId}">
                                <i class="fas fa-shopping-cart"></i>
                            </a>
                            <a href="#" class="add-to-wishlist" data-id="${productId}">
                                <i class="fas fa-heart"></i>
                            </a>
                        </div>
                    </div>
                    <div class="product-info">
                        <h3><a href="product.html?id=${productId}">${product.name}</a></h3>
                        <p class="brand">${categoryName}</p>
                        <div class="price">
                            ${oldPriceHtml}
                            <span class="current-price">${price} ₺</span>
                        </div>
                    </div>
                `;
                
                // Add to products container
                productsContainer.appendChild(productCard);
            } catch (error) {
                console.error(`Error rendering product at index ${i}:`, error);
                // Continue to the next product if there's an error
                continue;
            }
        }
        
        // Render pagination
        renderPagination(totalPages);
        
        // Add event listeners to product actions
        addProductActionListeners();
    }

    // Render pagination
    function renderPagination(totalPages) {
        // Clear pagination container
        pagination.innerHTML = '';
        
        // Don't show pagination if only one page
        if (totalPages <= 1) {
            return;
        }
        
        // Previous page button
        if (currentPage > 1) {
            const prevButton = document.createElement('a');
            prevButton.href = '#';
            prevButton.className = 'prev';
            prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevButton.addEventListener('click', function(e) {
                e.preventDefault();
                currentPage--;
                renderProducts();
                // Scroll to top of products
                productsContainer.scrollIntoView({ behavior: 'smooth' });
            });
            pagination.appendChild(prevButton);
        }
        
        // Page numbers
        const maxPages = 5; // Maximum number of page links to show
        let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
        let endPage = Math.min(totalPages, startPage + maxPages - 1);
        
        // Adjust start page if end page is maxed out
        if (endPage === totalPages) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }
        
        // First page link if not in range
        if (startPage > 1) {
            const firstPage = document.createElement('a');
            firstPage.href = '#';
            firstPage.textContent = '1';
            firstPage.addEventListener('click', function(e) {
                e.preventDefault();
                currentPage = 1;
                renderProducts();
                productsContainer.scrollIntoView({ behavior: 'smooth' });
            });
            pagination.appendChild(firstPage);
            
            // Ellipsis if needed
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'ellipsis';
                ellipsis.textContent = '...';
                pagination.appendChild(ellipsis);
            }
        }
        
        // Page links
        for (let i = startPage; i <= endPage; i++) {
            const pageLink = document.createElement('a');
            pageLink.href = '#';
            pageLink.textContent = i;
            
            if (i === currentPage) {
                pageLink.className = 'active';
            }
            
            pageLink.addEventListener('click', function(e) {
                e.preventDefault();
                currentPage = i;
                renderProducts();
                productsContainer.scrollIntoView({ behavior: 'smooth' });
            });
            
            pagination.appendChild(pageLink);
        }
        
        // Ellipsis if needed
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'ellipsis';
            ellipsis.textContent = '...';
            pagination.appendChild(ellipsis);
        }
        
        // Last page link if not in range
        if (endPage < totalPages) {
            const lastPage = document.createElement('a');
            lastPage.href = '#';
            lastPage.textContent = totalPages;
            lastPage.addEventListener('click', function(e) {
                e.preventDefault();
                currentPage = totalPages;
                renderProducts();
                productsContainer.scrollIntoView({ behavior: 'smooth' });
            });
            pagination.appendChild(lastPage);
        }
        
        // Next page button
        if (currentPage < totalPages) {
            const nextButton = document.createElement('a');
            nextButton.href = '#';
            nextButton.className = 'next';
            nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextButton.addEventListener('click', function(e) {
                e.preventDefault();
                currentPage++;
                renderProducts();
                productsContainer.scrollIntoView({ behavior: 'smooth' });
            });
            pagination.appendChild(nextButton);
        }
    }

    // Get category name
    function getCategoryName(category) {
        // If category is undefined or null, return 'Diğer'
        if (!category) {
            return 'Diğer';
        }
        
        // Convert to string and lowercase for comparison
        const categoryStr = String(category).toLowerCase().trim();
        
        // Map categories to display names
        const categoryMap = {
            'men': 'Erkek',
            'erkek': 'Erkek',
            'women': 'Kadın',
            'kadin': 'Kadın',
            'kadın': 'Kadın',
            'accessories': 'Aksesuar',
            'aksesuar': 'Aksesuar',
            'footwear': 'Ayakkabı',
            'ayakkabi': 'Ayakkabı',
            'ayakkabı': 'Ayakkabı',
            'bags': 'Çanta',
            'canta': 'Çanta',
            'çanta': 'Çanta',
            'clothing': 'Giyim',
            'giyim': 'Giyim',
            'jewelry': 'Takı',
            'takı': 'Takı',
            'taki': 'Takı',
            'deneme': 'Test', // For test products
            'test': 'Test',   // For test products
            'other': 'Diğer',
            'diğer': 'Diğer',
            'all': 'Tümü'
        };
        
        // Return mapped category or capitalize the first letter of the category
        return categoryMap[categoryStr] || 
               (categoryStr.charAt(0).toUpperCase() + categoryStr.slice(1)) || 
               'Diğer';
    }

    // Add event listeners to product actions
    function addProductActionListeners() {
        // Quick view buttons
        const quickViewButtons = document.querySelectorAll('.quick-view');
        quickViewButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const productId = this.getAttribute('data-id');
                // Open quick view modal
                // This would typically call a function to show a modal with product details
                console.log('Quick view for product ID:', productId);
            });
        });
        
        // Add to cart buttons
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const productId = this.getAttribute('data-id');
                addToCart(productId, 1);
            });
        });
        
        // Add to wishlist buttons
        const addToWishlistButtons = document.querySelectorAll('.add-to-wishlist');
        addToWishlistButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const productId = this.getAttribute('data-id');
                addToWishlist(productId);
            });
        });
    }

    // Add product to cart
    function addToCart(productId, quantity) {
        // Get product - handle both MongoDB _id and regular id
        const product = products.find(p => (p._id === productId || p.id === parseInt(productId)));
        
        if (!product) {
            console.error('Product not found with ID:', productId);
            console.log('Available products:', products.map(p => ({ id: p.id, _id: p._id, name: p.name })));
            showNotification('Ürün bulunamadı.', 'error');
            return;
        }
        
        // Get cart from localStorage
        let cart = localStorage.getItem('dndCart');
        cart = cart ? JSON.parse(cart) : [];
        
        // Use _id if available, otherwise use id
        const id = product._id || product.id;
        
        // Check if product already in cart
        const existingItem = cart.find(item => (item.id === id || item.id === parseInt(productId)));
        
        if (existingItem) {
            // Update quantity
            existingItem.quantity += quantity;
        } else {
            // Add new item
            cart.push({
                id: id,
                name: product.name,
                price: product.price,
                image: getProductImage(product),
                quantity: quantity
            });
        }
        
        // Save cart to localStorage
        localStorage.setItem('dndCart', JSON.stringify(cart));
        
        // Update cart count
        updateCartCount();
        
        // Show notification
        showNotification('Ürün sepete eklendi.', 'success');
    }

    // Add product to wishlist
    function addToWishlist(productId) {
        // Get product - handle both MongoDB _id and regular id
        const product = products.find(p => (p._id === productId || p.id === parseInt(productId)));
        
        if (!product) {
            console.error('Product not found with ID:', productId);
            showNotification('Ürün bulunamadı.', 'error');
            return;
        }
        
        // Get wishlist from localStorage
        let wishlist = localStorage.getItem('dndWishlist');
        wishlist = wishlist ? JSON.parse(wishlist) : [];
        
        // Use _id if available, otherwise use id
        const id = product._id || product.id;
        
        // Check if product already in wishlist
        const existingItem = wishlist.find(item => (item.id === id || item.id === parseInt(productId)));
        
        if (existingItem) {
            // Show notification
            showNotification('Bu ürün zaten favorilerinizde.', 'info');
            return;
        }
        
        // Add to wishlist
        wishlist.push({
            id: id,
            name: product.name,
            price: product.price,
            image: getProductImage(product)
        });
        
        // Save wishlist to localStorage
        localStorage.setItem('dndWishlist', JSON.stringify(wishlist));
        
        // Show notification
        showNotification('Ürün favorilere eklendi.', 'success');
    }

    // Update cart count
    function updateCartCount() {
        const cartCountElements = document.querySelectorAll('.cart-count');
        
        if (cartCountElements.length === 0) return;
        
        // Get cart from localStorage
        let cart = localStorage.getItem('dndCart');
        cart = cart ? JSON.parse(cart) : [];
        
        // Calculate total quantity
        const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
        
        // Update cart count elements
        cartCountElements.forEach(element => {
            element.textContent = totalQuantity;
            
            // Show/hide based on quantity
            if (totalQuantity > 0) {
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        });
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.shop-notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `shop-notification ${type}`;
        
        // Set icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        
        // Set content
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Setup event listeners
    function setupEventListeners() {
        // Sort select
        if (sortSelect) {
            sortSelect.addEventListener('change', function() {
                sortOption = this.value;
                sortProducts();
                renderProducts();
            });
        }
        
        // Category links
        if (categoryLinks.length > 0) {
            categoryLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Remove active class from all links
                    categoryLinks.forEach(l => l.classList.remove('active'));
                    
                    // Add active class to clicked link
                    this.classList.add('active');
                    
                    // Update active filters
                    activeFilters.category = this.getAttribute('data-category');
                    
                    // Apply filters
                    applyFilters();
                    
                    // Render products
                    renderProducts();
                    
                    // Close mobile filters if open
                    if (window.innerWidth < 768 && shopSidebar.classList.contains('active')) {
                        shopSidebar.classList.remove('active');
                        filterOverlay.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                });
            });
        }
        
        // Color filters
        if (colorFilters.length > 0) {
            colorFilters.forEach(filter => {
                filter.addEventListener('change', function() {
                    // Update active filters
                    activeFilters.colors = Array.from(colorFilters)
                        .filter(f => f.checked)
                        .map(f => f.value);
                });
            });
        }
        
        // Size filters
        if (sizeFilters.length > 0) {
            sizeFilters.forEach(filter => {
                filter.addEventListener('change', function() {
                    // Update active filters
                    activeFilters.sizes = Array.from(sizeFilters)
                        .filter(f => f.checked)
                        .map(f => f.value);
                });
            });
        }
        
        // Apply price filter
        if (applyPriceFilterBtn && priceSlider) {
            applyPriceFilterBtn.addEventListener('click', function() {
                const values = priceSlider.noUiSlider.get();
                activeFilters.priceMin = parseInt(values[0]);
                activeFilters.priceMax = parseInt(values[1]);
                
                // Apply filters
                applyFilters();
                
                // Render products
                renderProducts();
                
                // Close mobile filters if open
                if (window.innerWidth < 768 && shopSidebar.classList.contains('active')) {
                    shopSidebar.classList.remove('active');
                    filterOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
        
        // Apply all filters
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', function() {
                // Apply filters
                applyFilters();
                
                // Render products
                renderProducts();
                
                // Close mobile filters if open
                if (window.innerWidth < 768 && shopSidebar.classList.contains('active')) {
                    shopSidebar.classList.remove('active');
                    filterOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
        
        // Reset filters
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', function() {
                // Reset all filters
                resetAllFilters();
                
                // Apply filters
                applyFilters();
                
                // Render products
                renderProducts();
                
                // Close mobile filters if open
                if (window.innerWidth < 768 && shopSidebar.classList.contains('active')) {
                    shopSidebar.classList.remove('active');
                    filterOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
        
        // Update cart count on page load
        updateCartCount();

        // Add event listener for page visibility changes
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                // Refresh products when page becomes visible again
                refreshProducts(false);
            }
        });

        // Feature filters (new, sale, featured)
        const featureFilters = document.querySelectorAll('input[data-feature]');
        if (featureFilters.length > 0) {
            featureFilters.forEach(filter => {
                filter.addEventListener('change', function() {
                    // Update active filters
                    activeFilters.features = Array.from(featureFilters)
                        .filter(f => f.checked)
                        .map(f => f.getAttribute('data-feature'));
                    
                    console.log('Active feature filters:', activeFilters.features);
                    
                    // Apply filters
                    applyFilters();
                    
                    // Render products
                    renderProducts();
                });
            });
        }
    }

    // Reset all filters
    function resetAllFilters() {
        // Reset category
        activeFilters.category = 'all';
        categoryLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-category') === 'all') {
                link.classList.add('active');
            }
        });
        
        // Reset colors
        activeFilters.colors = [];
        colorFilters.forEach(filter => {
            filter.checked = false;
        });
        
        // Reset sizes
        activeFilters.sizes = [];
        sizeFilters.forEach(filter => {
            filter.checked = false;
        });
        
        // Reset price
        if (priceSlider) {
            priceSlider.noUiSlider.set([0, 10000]);
            activeFilters.priceMin = 0;
            activeFilters.priceMax = 10000;
        }
        
        // Reset sort
        sortOption = 'featured';
        if (sortSelect) {
            sortSelect.value = sortOption;
        }
        
        // Reset features
        activeFilters.features = [];
        const featureFilters = document.querySelectorAll('input[data-feature]');
        featureFilters.forEach(filter => {
            filter.checked = false;
        });
    }

    // Add this function to handle product refresh
    async function refreshProducts(showLoading = false) {
        try {
            if (showLoading) {
                // Show loading state
                showLoading(true);
            }
            
            // Fetch fresh products from the server
            const freshProducts = await fetchProducts();
            
            // Check if we have new products
            const hasNewProducts = checkForNewProducts(products, freshProducts);
            
            // Update products array
            products = freshProducts;
            
            // Apply filters to the new products
            applyFilters();
            
            // Render the updated products
            renderProducts();
            
            if (hasNewProducts) {
                showNotification('Yeni ürünler eklendi!', 'success');
            }
            
            if (showLoading) {
                // Hide loading state
                showLoading(false);
            }
            
            return true;
        } catch (error) {
            console.error('Ürünler yenilenirken hata:', error);
            if (showLoading) {
                // Hide loading state
                showLoading(false);
            }
            return false;
        }
    }

    // Function to check if there are new products
    function checkForNewProducts(oldProducts, newProducts) {
        if (!oldProducts || !newProducts) return false;
        
        // Check if we have more products
        if (newProducts.length > oldProducts.length) {
            return true;
        }
        
        // Create a map of old product IDs for quick lookup
        const oldProductIds = new Set(oldProducts.map(p => p._id || p.id));
        
        // Check if any new product IDs don't exist in old products
        for (const newProduct of newProducts) {
            const newProductId = newProduct._id || newProduct.id;
            if (!oldProductIds.has(newProductId)) {
                return true;
            }
        }
        
        return false;
    }

    // Function to set up auto-refresh
    function setupAutoRefresh() {
        // Clear any existing interval
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }
        
        // Set up new interval
        autoRefreshInterval = setInterval(async () => {
            await refreshProducts(false);
        }, REFRESH_INTERVAL);
    }

    // Function to add refresh button
    function addRefreshButton() {
        const shopHeader = document.querySelector('.shop-header');
        if (!shopHeader) return;
        
        // Check if button already exists
        if (document.getElementById('refresh-products-btn')) return;
        
        // Create refresh button
        const refreshButton = document.createElement('button');
        refreshButton.id = 'refresh-products-btn';
        refreshButton.className = 'btn refresh-btn';
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Ürünleri Yenile';
        
        // Add click event
        refreshButton.addEventListener('click', async function() {
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yenileniyor...';
            
            await refreshProducts(true);
            
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-sync-alt"></i> Ürünleri Yenile';
        });
        
        // Add to shop header
        const sortContainer = shopHeader.querySelector('.sort-container');
        if (sortContainer) {
            sortContainer.insertBefore(refreshButton, sortContainer.firstChild);
        } else {
            shopHeader.appendChild(refreshButton);
        }
    }

    // Initialize shop
    initShop();
    
    // Update cart count on page load
    updateCartCount();
}); 