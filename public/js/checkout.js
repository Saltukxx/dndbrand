// DOM Elements
let cardHolderNameInput = document.getElementById('card-holder-name');
let cardNumberInput = document.getElementById('card-number');
let expiryMonthInput = document.getElementById('expiry-month');
let expiryYearInput = document.getElementById('expiry-year');
let cvvInput = document.getElementById('cvv');
let saveCardCheckbox = document.getElementById('save-card');
let use3DSecureCheckbox = document.getElementById('use-3d-secure');
let placeOrderBtn = document.getElementById('place-order-btn');
let paymentMethods = document.querySelectorAll('.payment-method');
let paymentForms = document.querySelectorAll('.payment-form');
let addressCards = document.querySelectorAll('.address-card');
let addAddressBtn = document.getElementById('add-address-btn');

// Make sure CONFIG is available
if (!window.CONFIG) {
    console.warn('CONFIG not found, using default values');
    window.CONFIG = {
        API_URL: 'https://your-deployed-backend-url.com/api',
        FEATURES: {
            ENABLE_CACHE: true,
            DEBUG_MODE: false,
            FORCE_HTTPS: true
        },
        SECURITY: {
            REQUIRE_HTTPS: true,
            HSTS_ENABLED: true
        }
    };
}

// Modals
const securePaymentModal = document.getElementById('secure-payment-modal');
const addressModal = document.getElementById('address-modal');
const paymentSuccessModal = document.getElementById('payment-success-modal');
const paymentErrorModal = document.getElementById('payment-error-modal');

// State Management
let selectedPaymentMethod = 'credit_card';
let selectedAddressId = null;
let currentOrder = null;
let processing = false;

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Checkout page initialized');
    
    // Make sure we're on the checkout page
    if (!document.querySelector('.checkout-content')) {
        console.error('Checkout content not found');
        return;
    }
    
    try {
        // Initialize elements after they're loaded
        initializeElements();
        
        // Create sample cart data for testing if none exists
        createSampleCartData();
        
        // Load data - first load order summary
        await loadOrderSummary();
        
        // Then load user addresses
        await loadUserAddresses();
        
        // Setup event listeners
        setupEventListeners();
        
        // Format card inputs
        formatCardInputs();
        
        console.log('Checkout page fully initialized');
    } catch (error) {
        console.error('Error initializing checkout page:', error);
    }
});

// Initialize elements after DOM is loaded
function initializeElements() {
    // Re-query DOM elements to ensure they're available
    const elements = {
        cardHolderNameInput: document.getElementById('card-holder-name'),
        cardNumberInput: document.getElementById('card-number'),
        expiryMonthInput: document.getElementById('expiry-month'),
        expiryYearInput: document.getElementById('expiry-year'),
        cvvInput: document.getElementById('cvv'),
        saveCardCheckbox: document.getElementById('save-card'),
        use3DSecureCheckbox: document.getElementById('use-3d-secure'),
        placeOrderBtn: document.getElementById('place-order-btn'),
        paymentMethods: document.querySelectorAll('.payment-method'),
        paymentForms: document.querySelectorAll('.payment-form'),
        addressCards: document.querySelectorAll('.address-card'),
        addAddressBtn: document.getElementById('add-address-btn')
    };
    
    // Update global variables
    if (elements.cardHolderNameInput) cardHolderNameInput = elements.cardHolderNameInput;
    if (elements.cardNumberInput) cardNumberInput = elements.cardNumberInput;
    if (elements.expiryMonthInput) expiryMonthInput = elements.expiryMonthInput;
    if (elements.expiryYearInput) expiryYearInput = elements.expiryYearInput;
    if (elements.cvvInput) cvvInput = elements.cvvInput;
    if (elements.saveCardCheckbox) saveCardCheckbox = elements.saveCardCheckbox;
    if (elements.use3DSecureCheckbox) use3DSecureCheckbox = elements.use3DSecureCheckbox;
    if (elements.placeOrderBtn) placeOrderBtn = elements.placeOrderBtn;
    if (elements.paymentMethods.length) paymentMethods = elements.paymentMethods;
    if (elements.paymentForms.length) paymentForms = elements.paymentForms;
    if (elements.addressCards.length) addressCards = elements.addressCards;
    if (elements.addAddressBtn) addAddressBtn = elements.addAddressBtn;
}

// Load user's saved addresses
async function loadUserAddresses(options = {}) {
    try {
        console.log('Loading user addresses', options);
        
        // Show loading indicator
        const container = document.getElementById('shipping-address-container');
        if (container) {
            const loadingElement = container.querySelector('.address-loading');
            if (loadingElement) loadingElement.style.display = 'block';
        }
        
        // Try to get addresses from localStorage first
        let addresses = localStorage.getItem('savedAddresses');
        addresses = addresses ? JSON.parse(addresses) : [];
        
        console.log('Addresses from localStorage:', addresses);
        
        // If no addresses in localStorage, try to get from server
        if (!addresses || addresses.length === 0) {
            try {
                addresses = await getAddressesFromServer();
                console.log('Addresses from server:', addresses);
                
                // Save to localStorage
                if (addresses && addresses.length > 0) {
                    localStorage.setItem('savedAddresses', JSON.stringify(addresses));
                }
            } catch (error) {
                console.error('Error getting addresses from server:', error);
                // Continue with empty addresses
                addresses = [];
            }
        }
        
        // If still no addresses and not after a deletion, create a sample address
        if ((!addresses || addresses.length === 0) && !options.afterDeletion) {
            console.log('No addresses found, creating sample address');
            addresses = createSampleAddress();
            
            // Save to localStorage
            localStorage.setItem('savedAddresses', JSON.stringify(addresses));
            
            // Try to save to server
            try {
                await saveAddressToServer(addresses[0]);
            } catch (serverError) {
                console.error('Error saving sample address to server:', serverError);
                // Continue with local sample address
            }
        }
        
        // Render addresses
        renderAddresses(addresses);
        
        // Setup address card listeners (renderAddresses already calls this, but call it again to be safe)
        setupAddressCardListeners();
        
        // Hide loading indicator
        if (container) {
            const loadingElement = container.querySelector('.address-loading');
            if (loadingElement) loadingElement.style.display = 'none';
        }
        
        return addresses;
    } catch (error) {
        console.error('Error loading user addresses:', error);
        
        // Hide loading indicator
        const container = document.getElementById('shipping-address-container');
        if (container) {
            const loadingElement = container.querySelector('.address-loading');
            if (loadingElement) loadingElement.style.display = 'none';
            
            // Show error message in container
            container.innerHTML = `
                <div class="address-error">
                    <p>Adresler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.</p>
                </div>
            `;
        }
        
        // Show error notification
        showError('Adresler yüklenirken bir hata oluştu');
        
        return [];
    }
}

// Create a sample address
function createSampleAddress() {
    const sampleAddress = {
        id: 'sample_address_' + Date.now(),
        title: 'Ev Adresim',
        fullName: 'Örnek Kullanıcı',
        phone: '05XX XXX XX XX',
        address: 'Örnek Mahallesi, Örnek Sokak No:1',
        city: 'İstanbul',
        district: 'Kadıköy',
        postalCode: '34000',
        country: 'Turkey',
        isDefault: true
    };
    
    return [sampleAddress];
}

// Show success message
function showSuccess(message) {
    // Create a success toast
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <div class="toast-content">
            <p>${message}</p>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Render addresses
function renderAddresses(addresses) {
    const container = document.getElementById('shipping-address-container');
    if (!container) {
        console.error('Shipping address container not found');
        return;
    }
    
    console.log('Rendering addresses:', addresses);
    
    // Clear container
    container.innerHTML = '';
    
    if (!addresses || addresses.length === 0) {
        container.innerHTML = '<p>Kayıtlı adresiniz bulunmamaktadır.</p>';
        return;
    }
    
    // Find default address
    const defaultAddress = addresses.find(addr => addr.isDefault);
    
    // If we have a default address, set it as selected
    if (defaultAddress) {
        selectedAddressId = defaultAddress.id;
    } else if (addresses.length > 0) {
        // Otherwise select the first address
        selectedAddressId = addresses[0].id;
    }
    
    console.log('Selected address ID:', selectedAddressId);
    
    // Create address cards
    addresses.forEach(address => {
        const isSelected = address.id === selectedAddressId;
        
        const addressCard = document.createElement('div');
        addressCard.className = `address-card ${isSelected ? 'selected' : ''}`;
        addressCard.dataset.id = address.id;
        
        addressCard.innerHTML = `
            <div class="address-card-header">
                <h3>${address.title || 'Adresim'}</h3>
                ${address.isDefault ? '<span class="default-badge">Varsayılan</span>' : ''}
            </div>
            <div class="address-card-body">
                <p>${address.street || address.address || ''}</p>
                <p>${address.state || address.district || ''}, ${address.city || ''}, ${address.postalCode || ''}</p>
                <p>${address.country || 'Turkey'}</p>
            </div>
            <div class="address-card-actions">
                <button class="btn btn-sm btn-secondary edit-address" data-id="${address.id}">
                    <i class="fas fa-edit"></i> Düzenle
                </button>
                <button class="btn btn-sm btn-danger delete-address" data-id="${address.id}">
                    <i class="fas fa-trash"></i> Sil
                </button>
            </div>
        `;
        
        container.appendChild(addressCard);
    });
    
    // Add event listeners to the newly created address cards
    setupAddressCardListeners();
}

// Setup address card event listeners
function setupAddressCardListeners() {
    console.log('Setting up address card listeners');
    const addressCards = document.querySelectorAll('.address-card');
    console.log('Found address cards:', addressCards.length);
    
    addressCards.forEach(card => {
        // Address selection
        card.addEventListener('click', function() {
            console.log('Address card clicked:', this.dataset.id);
            // Remove selected class from all cards
            addressCards.forEach(c => c.classList.remove('selected'));
            // Add selected class to clicked card
            this.classList.add('selected');
            // Update selected address ID
            selectedAddressId = this.dataset.id;
            console.log('Selected address ID:', selectedAddressId);
        });
        
        // Edit address button
        const editBtn = card.querySelector('.edit-address');
        if (editBtn) {
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card selection
                const addressId = this.dataset.id;
                console.log('Edit address clicked:', addressId);
                // Open edit address modal with address data
                openEditAddressModal(addressId);
            });
        }
        
        // Delete address button
        const deleteBtn = card.querySelector('.delete-address');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async function(e) {
                e.stopPropagation(); // Prevent card selection
                e.preventDefault(); // Prevent any default behavior
                
                const addressId = this.dataset.id;
                console.log('Delete address clicked:', addressId);
                
                // Confirm before deleting
                if (confirm('Bu adresi silmek istediğinizden emin misiniz?')) {
                    // Disable the button to prevent multiple clicks
                    this.disabled = true;
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Siliniyor...';
                    
                    try {
                        // Delete the address
                        const success = await deleteAddress(addressId);
                        
                        if (success) {
                            // Remove the card from the DOM directly for immediate feedback
                            card.style.opacity = '0';
                            setTimeout(() => {
                                card.remove();
                                
                                // If no addresses left, show message
                                const container = document.getElementById('shipping-address-container');
                                if (container && container.querySelectorAll('.address-card').length === 0) {
                                    container.innerHTML = '<p>Kayıtlı adresiniz bulunmamaktadır.</p>';
                                }
                            }, 300);
                        } else {
                            // Re-enable the button if deletion failed
                            this.disabled = false;
                            this.innerHTML = '<i class="fas fa-trash"></i> Sil';
                        }
                    } catch (error) {
                        console.error('Error in delete button handler:', error);
                        // Re-enable the button
                        this.disabled = false;
                        this.innerHTML = '<i class="fas fa-trash"></i> Sil';
                        showError('Adres silinirken bir hata oluştu');
                    }
                }
            });
        }
    });
}

// Open edit address modal
function openEditAddressModal(addressId) {
    try {
        console.log('Opening edit address modal for ID:', addressId);
        
        // Get addresses from local storage
        const addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
        const address = addresses.find(addr => addr.id === addressId);
        
        if (!address) {
            throw new Error('Address not found');
        }
        
        console.log('Found address to edit:', address);
        
        // Get the form
        const form = document.getElementById('address-form');
        if (!form) {
            throw new Error('Address form not found');
        }
        
        // Update modal title
        const modalTitle = document.querySelector('#address-modal .modal-header h2');
        if (modalTitle) modalTitle.textContent = 'Adresi Düzenle';
        
        // Store the address ID in the form
        form.dataset.addressId = addressId;
        
        // Populate form fields
        document.getElementById('address-title').value = address.title || '';
        document.getElementById('address-street').value = address.street || '';
        document.getElementById('address-city').value = address.city || '';
        document.getElementById('address-state').value = address.state || '';
        document.getElementById('address-postal-code').value = address.postalCode || '';
        document.getElementById('address-country').value = address.country || 'Turkey';
        document.getElementById('address-default').checked = address.isDefault || false;
        
        // Remove any existing submit handler
        const oldHandler = form._addressEditHandler;
        if (oldHandler) {
            form.removeEventListener('submit', oldHandler);
        }
        
        // Add submit handler for editing
        const submitHandler = async function(e) {
            e.preventDefault();
            console.log('Submitting address edit');
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Güncelleniyor...';
            }
            
            try {
                // Get form data
                const updatedAddress = {
                    id: addressId,
                    title: document.getElementById('address-title').value || 'Adresim',
                    street: document.getElementById('address-street').value || '',
                    city: document.getElementById('address-city').value || '',
                    state: document.getElementById('address-state').value || '',
                    postalCode: document.getElementById('address-postal-code').value || '',
                    country: document.getElementById('address-country').value || 'Turkey',
                    isDefault: document.getElementById('address-default').checked,
                    updatedAt: new Date().toISOString()
                };
                
                console.log('Updated address data:', updatedAddress);
                
                // Update address
                await updateAddress(updatedAddress);
                
                // Close modal
                const addressModal = document.getElementById('address-modal');
                if (addressModal) {
                    addressModal.style.display = 'none';
                }
                
                // Show success message
                showSuccess('Adres başarıyla güncellendi');
                
                // Reset form
                form.reset();
                delete form.dataset.addressId;
                
                // Reload addresses
                await loadUserAddresses();
            } catch (error) {
                console.error('Error updating address:', error);
                showError('Adres güncellenirken bir hata oluştu');
            } finally {
                // Reset button state
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Güncelle';
                }
            }
        };
        
        // Store handler reference for later removal
        form._addressEditHandler = submitHandler;
        
        // Add the event listener
        form.addEventListener('submit', submitHandler);
        
        // Change button text
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = 'Güncelle';
        }
        
        // Show modal
        const addressModal = document.getElementById('address-modal');
        if (addressModal) {
            addressModal.style.display = 'block';
        } else {
            console.error('Address modal not found');
        }
    } catch (error) {
        console.error('Error opening edit address modal:', error);
        showError('Adres bilgileri yüklenirken bir hata oluştu');
    }
}

// Delete address from server
async function deleteAddressFromServer(addressId) {
    try {
        console.log('Deleting address from server:', addressId);
        
        // API endpoint - Use CONFIG.API_URL instead of hardcoded URL
        const url = `${CONFIG.API_URL}/addresses/${addressId}`;
        
        // Get user token
        const token = localStorage.getItem('token');
        
        try {
            // Send request
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            // Check response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error deleting address');
            }
            
            // Parse response
            const data = await response.json();
            console.log('Address deleted successfully:', data);
            
            return data;
        } catch (fetchError) {
            console.warn('Server connection failed, deleting from localStorage only:', fetchError);
            
            // Delete from localStorage as fallback
            let savedAddresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
            savedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
            localStorage.setItem('savedAddresses', JSON.stringify(savedAddresses));
            
            return { success: true, message: 'Address deleted from localStorage only' };
        }
    } catch (error) {
        console.error('Error deleting address from server:', error);
        throw error;
    }
}

// Delete address
async function deleteAddress(addressId) {
    try {
        console.log('Deleting address:', addressId);
        
        // Get addresses from localStorage
        let addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
        
        // Find the address index
        const addressIndex = addresses.findIndex(addr => addr.id === addressId);
        if (addressIndex === -1) {
            throw new Error('Address not found');
        }
        
        // Check if this is the default address
        const isDefault = addresses[addressIndex].isDefault;
        
        // Remove the address
        addresses.splice(addressIndex, 1);
        
        // If the deleted address was the default and we have other addresses,
        // set the first one as default
        if (isDefault && addresses.length > 0) {
            addresses[0].isDefault = true;
        }
        
        // Save to localStorage
        localStorage.setItem('savedAddresses', JSON.stringify(addresses));
        
        // Try to delete from server
        await deleteAddressFromServer(addressId);
        
        // Update UI - Force a complete refresh of the address container
        const container = document.getElementById('shipping-address-container');
        if (container) {
            // Clear the container first
            container.innerHTML = '';
            
            if (addresses.length === 0) {
                // If no addresses left, show a message
                container.innerHTML = '<p>Kayıtlı adresiniz bulunmamaktadır.</p>';
            } else {
                // Render the updated addresses
                renderAddresses(addresses);
                setupAddressCardListeners();
            }
        }
        
        // Show success message
        showSuccess('Adres başarıyla silindi');
        
        return true;
    } catch (error) {
        console.error('Error deleting address:', error);
        showError('Adres silinirken bir hata oluştu');
        
        // Reload addresses to ensure UI is in sync with data, but don't create sample address
        await loadUserAddresses({ afterDeletion: true });
        
        return false;
    }
}

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Show login prompt instead of immediate redirect
        showLoginPrompt();
        return false;
    }
    return true;
}

// Show login prompt
function showLoginPrompt() {
    // Create a modal to prompt user to login
    const loginPromptHTML = `
        <div id="login-prompt-modal" class="modal" style="display: block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Giriş Yapın</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="login-prompt-icon">
                        <i class="fas fa-user-lock"></i>
                    </div>
                    <h3>Ödeme için giriş yapmanız gerekiyor</h3>
                    <p>Ödeme işlemine devam etmek için lütfen hesabınıza giriş yapın veya yeni bir hesap oluşturun.</p>
                    <div class="modal-actions">
                        <a href="account.html?action=login&returnUrl=${encodeURIComponent(window.location.href)}" class="btn btn-primary">Giriş Yap</a>
                        <a href="account.html?action=register&returnUrl=${encodeURIComponent(window.location.href)}" class="btn btn-secondary">Kayıt Ol</a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to the page
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = loginPromptHTML;
    document.body.appendChild(modalContainer);
    
    // Add event listener to close button
    const closeBtn = document.querySelector('#login-prompt-modal .close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('login-prompt-modal').remove();
        });
    }
}

// Load Order Summary with improved cart data handling
async function loadOrderSummary() {
    try {
        console.log('Loading order summary');
        
        // Show loading indicator
        const loadingElement = document.querySelector('.order-loading');
        if (loadingElement) loadingElement.style.display = 'block';
        
        // Get cart from localStorage
        let cart = localStorage.getItem('cart');
        cart = cart ? JSON.parse(cart) : [];
        
        // Migrate legacy cart data if needed
        if (!cart.length) {
            const existingCart = localStorage.getItem('dndCart');
            if (existingCart) {
                try {
                    const oldCart = JSON.parse(existingCart);
                    if (oldCart && oldCart.length) {
                        cart = oldCart;
                        localStorage.setItem('cart', JSON.stringify(cart));
                        localStorage.removeItem('dndCart');
                    }
                } catch (e) {
                    console.error('Error migrating old cart data:', e);
                }
            }
        }
        
        console.log('Cart items loaded for order summary:', cart);
        
        // Ensure consistency by updating both storage locations
        if (cart && cart.length > 0) {
            localStorage.setItem('cart', JSON.stringify(cart));
            localStorage.setItem('dndCart', JSON.stringify(cart));
        }
        
        if (!cart || cart.length === 0) {
            console.warn('No cart items found');
            
            // Show empty cart message
            const orderItems = document.querySelector('.order-items');
            if (orderItems) {
                orderItems.innerHTML = `
                    <div class="empty-order">
                        <div class="empty-order-icon">
                            <i class="fas fa-shopping-bag"></i>
                        </div>
                        <h3>Sepetiniz Boş</h3>
                        <p>Ödeme işlemine devam etmek için sepetinize ürün ekleyin.</p>
                        <a href="shop.html" class="btn">Alışverişe Devam Et</a>
                    </div>
                `;
            }
            
            // Set zero values for totals
            document.getElementById('subtotal').textContent = '0.00 TL';
            document.getElementById('tax').textContent = '0.00 TL';
            document.getElementById('shipping').textContent = '25.00 TL';
            document.getElementById('total').textContent = '25.00 TL';
            
            // Hide loading indicator
            if (loadingElement) loadingElement.style.display = 'none';
            
            // Disable place order button
            const placeOrderBtn = document.getElementById('place-order-btn');
            if (placeOrderBtn) {
                placeOrderBtn.disabled = true;
                placeOrderBtn.classList.add('disabled');
            }
            
            return;
        }
        
        // Validate cart items to ensure they have required properties
        const validatedCart = cart.filter(item => {
            if (!item || typeof item !== 'object') return false;
            if (!item.id) return false;
            if (typeof item.price === 'undefined' || item.price === null) return false;
            if (!item.name) return false;
            return true;
        });
        
        if (validatedCart.length !== cart.length) {
            console.warn(`Filtered out ${cart.length - validatedCart.length} invalid cart items`);
            cart = validatedCart;
            
            // Update storage with validated cart
            localStorage.setItem('cart', JSON.stringify(cart));
            localStorage.setItem('dndCart', JSON.stringify(cart));
        }
        
        // Calculate totals
        let subtotal = 0;
        cart.forEach(item => {
            // Ensure price is treated as a number
            const itemPrice = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 1;
            subtotal += itemPrice * quantity;
            console.log(`Item: ${item.name}, Price: ${itemPrice}, Quantity: ${quantity}, Subtotal: ${subtotal}`);
        });
        
        const tax = subtotal * 0.18; // 18% tax
        const shipping = subtotal > 500 ? 0 : 25; // Free shipping over 500 TL
        const total = subtotal + tax + shipping;
        
        console.log(`Order totals - Subtotal: ${subtotal}, Tax: ${tax}, Shipping: ${shipping}, Total: ${total}`);
        
        // Update order summary in UI
        document.getElementById('subtotal').textContent = `${subtotal.toFixed(2)} TL`;
        document.getElementById('tax').textContent = `${tax.toFixed(2)} TL`;
        document.getElementById('shipping').textContent = shipping > 0 ? `${shipping.toFixed(2)} TL` : 'Ücretsiz';
        document.getElementById('total').textContent = `${total.toFixed(2)} TL`;
        
        // Render order items
        renderOrderItems(cart);
        
        // Store current order data for later use
        currentOrder = {
            items: cart,
            subtotal: subtotal,
            tax: tax,
            shipping: shipping,
            total: total,
            paymentMethod: selectedPaymentMethod,
            addressId: selectedAddressId
        };
        
        // Enable place order button if items exist
        const placeOrderBtn = document.getElementById('place-order-btn');
        if (placeOrderBtn && cart.length > 0) {
            placeOrderBtn.disabled = false;
            placeOrderBtn.classList.remove('disabled');
        }
        
        // Hide loading indicator
        if (loadingElement) loadingElement.style.display = 'none';
    } catch (error) {
        console.error('Error loading order summary:', error);
        
        // Show error message
        const orderItems = document.querySelector('.order-items');
        if (orderItems) {
            orderItems.innerHTML = `
                <div class="order-error">
                    <div class="order-error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Bir hata oluştu</h3>
                    <p>Sepet bilgileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.</p>
                    <p class="error-details">${error.message}</p>
                    <button class="btn reload-btn">Tekrar Dene</button>
                </div>
            `;
            
            // Add reload button functionality
            const reloadBtn = orderItems.querySelector('.reload-btn');
            if (reloadBtn) {
                reloadBtn.addEventListener('click', () => {
                    loadOrderSummary();
                });
            }
        }
        
        // Hide loading indicator
        const loadingElement = document.querySelector('.order-loading');
        if (loadingElement) loadingElement.style.display = 'none';
    }
}

// Render order items
function renderOrderItems(items) {
    try {
        console.log('Rendering order items:', items);
        
        // Get container
        const container = document.getElementById('order-items');
        if (!container) {
            console.error('Order items container not found');
            return;
        }
        
        // Clear container (except loading indicator)
        const loadingElement = container.querySelector('.order-loading');
        container.innerHTML = '';
        if (loadingElement) container.appendChild(loadingElement);
        
        // Hide loading indicator
        if (loadingElement) loadingElement.style.display = 'none';
        
        // Check if there are items
        if (!items || items.length === 0) {
            const emptyElement = document.createElement('div');
            emptyElement.className = 'empty-order';
            emptyElement.innerHTML = '<p>Sepetinizde ürün bulunmamaktadır.</p>';
            container.appendChild(emptyElement);
            return;
        }
        
        // Add items
        items.forEach(item => {
            try {
                // Validate item
                if (!item || !item.name) {
                    console.error('Invalid item:', item);
                    return;
                }
                
                // Get price
                let price = 0;
                if (typeof item.price === 'number') {
                    price = item.price;
                } else if (typeof item.price === 'string') {
                    price = parseFloat(item.price.replace(/[^\d.-]/g, ''));
                }
                
                if (isNaN(price)) {
                    console.error('Invalid price for item:', item);
                    return; // Skip this item
                }
                
                const formattedPrice = price.toFixed(2);
                const quantity = parseInt(item.quantity) || 1;
                const totalPrice = (price * quantity).toFixed(2);
                
                // Get image
                const image = item.image || '../images/products/placeholder.jpg';
                
                // Create item element
                const itemElement = document.createElement('div');
                itemElement.className = 'order-item';
                
                itemElement.innerHTML = `
                    <div class="order-item-image">
                        <img src="${image}" alt="${item.name}" onerror="this.src='../images/products/placeholder.jpg'">
                    </div>
                    <div class="order-item-details">
                        <h4>${item.name}</h4>
                        <p class="order-item-variant">${item.variant || ''}</p>
                        <p class="order-item-price">${formattedPrice} TL x ${quantity}</p>
                        <p class="order-item-total">${totalPrice} TL</p>
                    </div>
                `;
                
                container.appendChild(itemElement);
            } catch (error) {
                console.error('Error rendering order item:', error, item);
            }
        });
    } catch (error) {
        console.error('Error rendering order items:', error);
    }
}

// Create sample cart data for testing
function createSampleCartData() {
    // Check if cart data already exists
    const existingCart = localStorage.getItem('cart');
    if (existingCart) {
        try {
            const parsedCart = JSON.parse(existingCart);
            if (parsedCart && parsedCart.length > 0) {
                console.log('Using existing cart data:', parsedCart);
                return parsedCart;
            }
        } catch (error) {
            console.error('Error parsing existing cart data:', error);
            // Continue to create sample data if parsing fails
        }
    }
    
    console.log('Creating sample cart data');
    
    // Sample cart items
    const sampleCartItems = [
        {
            id: 'sample_product_1',
            name: 'Premium Leather Jacket',
            price: 4999.99,
            quantity: 1,
            image: '../images/products/leather-jacket.jpg'
        },
        {
            id: 'sample_product_2',
            name: 'Designer T-Shirt',
            price: 799.99,
            quantity: 2,
            image: '../images/products/tshirt.jpg'
        }
    ];
    
    // Update cart in localStorage
    localStorage.setItem('cart', JSON.stringify(sampleCartItems));
    console.log('Sample cart loaded successfully');
    
    return sampleCartItems;
}

// Setup Event Listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Payment method selection
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            // Remove active class from all methods
            paymentMethods.forEach(m => m.classList.remove('active'));
            
            // Add active class to selected method
            this.classList.add('active');
            
            // Get payment method
            selectedPaymentMethod = this.getAttribute('data-method');
            console.log('Selected payment method:', selectedPaymentMethod);
            
            // Hide all payment forms
            paymentForms.forEach(form => {
                form.classList.remove('active');
                form.style.display = 'none';
            });
            
            // Show selected payment form
            const selectedForm = document.getElementById(`${selectedPaymentMethod}-form`);
            if (selectedForm) {
                selectedForm.classList.add('active');
                selectedForm.style.display = 'block';
            }
        });
    });
    
    // Add address button
    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', function() {
            // Show address modal
            const addressModal = document.getElementById('address-modal');
            if (addressModal) {
                addressModal.style.display = 'block';
            }
        });
    }
    
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get parent modal
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Address form submission
    const addressForm = document.getElementById('address-form');
    if (addressForm) {
        addressForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveAddress();
        });
    }
    
    // Place order button
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', async function() {
            console.log('Place order button clicked');
            
            // Check if already processing
            if (processing) {
                console.log('Already processing order');
                return;
            }
            
            // Validate order
            if (!validateOrder()) {
                return;
            }
            
            // Place order
            await placeOrder();
        });
    }
    
    // Card input formatting
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function() {
            formatCardNumber(this);
            validateCardNumber();
        });
    }
    
    if (expiryMonthInput) {
        expiryMonthInput.addEventListener('input', function() {
            formatExpiryMonth(this);
            validateExpiryMonth();
        });
    }
    
    if (expiryYearInput) {
        expiryYearInput.addEventListener('input', function() {
            formatExpiryYear(this);
            validateExpiryYear();
        });
    }
    
    if (cvvInput) {
        cvvInput.addEventListener('input', function() {
            formatCVV(this);
            validateCVV();
        });
    }
    
    console.log('Event listeners set up');
}

// Format Card Inputs
function formatCardInputs() {
    // Card Number Formatting
    cardNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(.{4})/g, '$1 ').trim();
        e.target.value = value;
    });

    // Expiry Date Formatting
    expiryMonthInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) value = value.slice(0, 2);
        e.target.value = value;
    });

    expiryYearInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) value = value.slice(0, 2);
        e.target.value = value;
    });

    // CVV Formatting
    cvvInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);
        e.target.value = value;
    });
}

// Validation Functions
function validateCardHolderName() {
    const value = cardHolderNameInput.value.trim();
    const isValid = value.length >= 3 && /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(value);
    showValidationError('card-holder-name', isValid, 'Geçerli bir isim giriniz');
    return isValid;
}

function validateCardNumber() {
    const value = cardNumberInput.value.replace(/\s/g, '');
    
    // Basic validation for length
    if (!/^[0-9]{16}$/.test(value)) {
        showValidationError('card-number', false, '16 haneli kart numarası giriniz');
        return false;
    }
    
    // Luhn algorithm for credit card validation
    let sum = 0;
    let shouldDouble = false;
    
    // Loop through values starting from the rightmost digit
    for (let i = value.length - 1; i >= 0; i--) {
        let digit = parseInt(value.charAt(i));

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }
    
    const isValid = (sum % 10) === 0;
    showValidationError('card-number', isValid, 'Geçersiz kart numarası');
    
    // Update card type icon
    updateCardTypeIcon(value);
    
    return isValid;
}

function updateCardTypeIcon(cardNumber) {
    const visa = document.querySelector('.card-icons .fa-cc-visa');
    const mastercard = document.querySelector('.card-icons .fa-cc-mastercard');
    const amex = document.querySelector('.card-icons .fa-cc-amex');
    
    // Reset all
    visa.style.opacity = '0.3';
    mastercard.style.opacity = '0.3';
    amex.style.opacity = '0.3';
    
    // Detect card type
    if (/^4/.test(cardNumber)) {
        visa.style.opacity = '1';
    } else if (/^5[1-5]/.test(cardNumber)) {
        mastercard.style.opacity = '1';
    } else if (/^3[47]/.test(cardNumber)) {
        amex.style.opacity = '1';
    }
}

function validateExpiryMonth() {
    const value = expiryMonthInput.value;
    const isValid = /^(0[1-9]|1[0-2])$/.test(value);
    
    // Check if month is valid
    if (!isValid) {
        showValidationError('expiry-date', false, 'Geçerli bir ay giriniz (01-12)');
        return false;
    }
    
    // If year is also filled, check if the date is in the future
    if (expiryYearInput.value) {
        return validateExpiryDate();
    }
    
    showValidationError('expiry-date', true);
    return true;
}

function validateExpiryYear() {
    const value = expiryYearInput.value;
    const currentYear = new Date().getFullYear() % 100;
    const isValid = /^[0-9]{2}$/.test(value) && parseInt(value) >= currentYear;
    
    if (!isValid) {
        showValidationError('expiry-date', false, 'Geçerli bir yıl giriniz');
        return false;
    }
    
    // If month is also filled, check if the date is in the future
    if (expiryMonthInput.value) {
        return validateExpiryDate();
    }
    
    showValidationError('expiry-date', true);
    return true;
}

function validateExpiryDate() {
    const month = parseInt(expiryMonthInput.value);
    const year = parseInt(expiryYearInput.value);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = currentDate.getFullYear() % 100;
    
    const isValid = (year > currentYear) || (year === currentYear && month >= currentMonth);
    
    showValidationError('expiry-date', isValid, 'Kartınızın son kullanma tarihi geçmiş');
    return isValid;
}

function validateCVV() {
    const value = cvvInput.value;
    const isValid = /^[0-9]{3,4}$/.test(value);
    showValidationError('cvv', isValid, 'Geçerli bir CVV giriniz');
    return isValid;
}

function showValidationError(fieldId, isValid, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId) || 
                         document.getElementById(`${fieldId}-month`) || 
                         document.getElementById(`${fieldId}-year`);
    
    if (!isValid) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        if (inputElement) {
            inputElement.classList.add('is-invalid');
        }
    } else {
        errorElement.style.display = 'none';
        if (inputElement) {
            inputElement.classList.remove('is-invalid');
            inputElement.classList.add('is-valid');
        }
    }
}

// Handle Place Order
async function handlePlaceOrder() {
    if (processing) return;
    
    // Validate address selection
    if (!selectedAddressId) {
        showError('Lütfen bir teslimat adresi seçin');
        
        // Scroll to address section
        const addressContainer = document.getElementById('shipping-address-container');
        if (addressContainer) {
            addressContainer.scrollIntoView({ behavior: 'smooth' });
        }
        return;
    }

    // Process based on selected payment method
    if (selectedPaymentMethod === 'credit_card') {
        // Validate all credit card fields at once
        const isCardHolderValid = validateCardHolderName();
        const isCardNumberValid = validateCardNumber();
        const isExpiryMonthValid = validateExpiryMonth();
        const isExpiryYearValid = validateExpiryYear();
        const isCVVValid = validateCVV();
        
        // Check if all validations passed
        if (!(isCardHolderValid && isCardNumberValid && isExpiryMonthValid && 
              isExpiryYearValid && isCVVValid)) {
            
            // Find the first invalid field and scroll to it
            let firstInvalidField = null;
            if (!isCardHolderValid) firstInvalidField = cardHolderNameInput;
            else if (!isCardNumberValid) firstInvalidField = cardNumberInput;
            else if (!isExpiryMonthValid) firstInvalidField = expiryMonthInput;
            else if (!isExpiryYearValid) firstInvalidField = expiryYearInput;
            else if (!isCVVValid) firstInvalidField = cvvInput;
            
            if (firstInvalidField) {
                firstInvalidField.focus();
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            showError('Lütfen kart bilgilerini doğru şekilde giriniz');
            return;
        }
        
        // Process credit card payment
        await processCreditCardPayment();
    } else if (selectedPaymentMethod === 'bank_transfer') {
        await processBankTransfer();
    } else if (selectedPaymentMethod === 'cash_on_delivery') {
        await processCashOnDelivery();
    }
}

// Process Credit Card Payment
async function processCreditCardPayment() {
    processing = true;
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';

    try {
        // For demo purposes, simulate a payment process
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if 3D Secure is enabled
        if (use3DSecureCheckbox && use3DSecureCheckbox.checked) {
            // Show 3D Secure modal
            securePaymentModal.style.display = 'block';
            
            // Simulate 3D Secure process
            const threeDsContainer = document.getElementById('threeds-container');
            if (threeDsContainer) {
                threeDsContainer.innerHTML = `
                    <div class="threeds-frame">
                        <div class="bank-logo">
                            <img src="../images/banks/generic-bank.png" alt="Bank" />
                        </div>
                        <h3>3D Secure Doğrulama</h3>
                        <p>Güvenli ödeme için doğrulama kodunu giriniz.</p>
                        <div class="form-group">
                            <label for="threeds-code">SMS Kodu</label>
                            <input type="text" id="threeds-code" class="form-control" placeholder="SMS ile gelen kodu giriniz" maxlength="6">
                        </div>
                        <button id="threeds-submit" class="btn btn-primary">Doğrula</button>
                    </div>
                `;
                
                // Add event listener to 3D Secure submit button
                const threeDsSubmit = document.getElementById('threeds-submit');
                if (threeDsSubmit) {
                    threeDsSubmit.addEventListener('click', async () => {
                        // Simulate 3D Secure verification
                        threeDsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Doğrulanıyor...</div>';
                        
                        // Simulate processing time
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        
                        // Close 3D Secure modal
                        securePaymentModal.style.display = 'none';
                        
                        // Show success
                        showPaymentSuccess({
                            orderNumber: 'ORD-' + Math.floor(100000 + Math.random() * 900000)
                        });
                    });
                }
            }
        } else {
            // Direct payment without 3D Secure
            showPaymentSuccess({
                orderNumber: 'ORD-' + Math.floor(100000 + Math.random() * 900000)
            });
        }
    } catch (error) {
        console.error('Payment error:', error);
        showPaymentError('Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
        processing = false;
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = '<i class="fas fa-lock"></i> Siparişi Tamamla';
    }
}

// Process Bank Transfer
async function processBankTransfer() {
    processing = true;
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';

    try {
        // For demo purposes, simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show success
        showPaymentSuccess({
            orderNumber: 'ORD-' + Math.floor(100000 + Math.random() * 900000)
        });
    } catch (error) {
        console.error('Bank transfer error:', error);
        showPaymentError('Havale/EFT siparişi oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
        processing = false;
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = '<i class="fas fa-lock"></i> Siparişi Tamamla';
    }
}

// Process Cash on Delivery
async function processCashOnDelivery() {
    processing = true;
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';

    try {
        // For demo purposes, simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show success
        showPaymentSuccess({
            orderNumber: 'ORD-' + Math.floor(100000 + Math.random() * 900000)
        });
    } catch (error) {
        console.error('Cash on delivery error:', error);
        showPaymentError('Kapıda ödeme siparişi oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
        processing = false;
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = '<i class="fas fa-lock"></i> Siparişi Tamamla';
    }
}

// Show Payment Success
function showPaymentSuccess(data) {
    // Update order number in success modal
    const orderNumberElement = document.getElementById('success-order-number');
    if (orderNumberElement) {
        orderNumberElement.textContent = data.orderNumber;
    }
    
    // Show success modal
    paymentSuccessModal.style.display = 'block';
    
    // Clear cart data from local storage
    localStorage.removeItem('cart');
    
    // Get the order ID
    const orderId = currentOrder ? currentOrder._id : null;
    
    // Redirect to order confirmation page after 3 seconds
    setTimeout(() => {
        if (orderId) {
            window.location.href = `order-confirmation.html?orderId=${orderId}`;
        } else {
            // Fallback to account page if order ID is not available
            window.location.href = 'account.html?tab=orders';
        }
    }, 3000);
}

// Show Payment Error
function showPaymentError(message) {
    // Update error message in error modal
    const errorMessageElement = document.getElementById('payment-error-message');
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
    }
    
    // Show error modal
    paymentErrorModal.style.display = 'block';
    
    // Reset processing state
    processing = false;
    if (placeOrderBtn) {
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = '<i class="fas fa-lock"></i> Siparişi Tamamla';
    }
}

// Show Error Message
function showError(message) {
    // Create an error toast
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-exclamation-circle"></i>
        </div>
        <div class="toast-content">
            <p>${message}</p>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Save address to server
async function saveAddressToServer(address) {
    try {
        console.log('Saving address to server:', address);
        
        // API endpoint - Use CONFIG.API_URL instead of hardcoded URL
        const url = `${CONFIG.API_URL}/addresses`;
        
        // Get user token
        const token = localStorage.getItem('token');
        
        try {
            // Send request
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(address)
            });
            
            // Check response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error saving address');
            }
            
            // Parse response
            const data = await response.json();
            console.log('Address saved successfully:', data);
            
            return data;
        } catch (fetchError) {
            console.warn('Server connection failed, saving to localStorage only:', fetchError);
            
            // Save to localStorage as fallback
            let savedAddresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
            
            // Check if address already exists
            const existingIndex = savedAddresses.findIndex(a => a.id === address.id);
            if (existingIndex >= 0) {
                savedAddresses[existingIndex] = address;
            } else {
                savedAddresses.push(address);
            }
            
            localStorage.setItem('savedAddresses', JSON.stringify(savedAddresses));
            return address;
        }
    } catch (error) {
        console.error('Error saving address to server:', error);
        throw error;
    }
}

// Get addresses from server
async function getAddressesFromServer() {
    try {
        console.log('Getting addresses from server');
        
        // API endpoint - Use CONFIG.API_URL instead of hardcoded URL
        const url = `${CONFIG.API_URL}/addresses`;
        
        // Get user token
        const token = localStorage.getItem('token');
        
        try {
            // Send request
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            // Check response
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error getting addresses');
            }
            
            // Parse response
            const data = await response.json();
            console.log('Addresses from server:', data);
            
            // Also save to localStorage for offline access
            localStorage.setItem('savedAddresses', JSON.stringify(data));
            
            return data;
        } catch (fetchError) {
            console.warn('Server connection failed, using localStorage addresses:', fetchError);
            
            // Fallback to localStorage
            const savedAddresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
            return savedAddresses;
        }
    } catch (error) {
        console.error('Error getting addresses from server:', error);
        // Return empty array instead of throwing to prevent cascading errors
        return [];
    }
}

// Update address on server
async function updateAddressOnServer(addressData) {
    try {
        console.log('Updating address on server:', addressData);
        
        // Get user token for authentication
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('User not authenticated, updating in localStorage only');
            // Update in localStorage
            updateAddressInLocalStorage(addressData);
            return addressData;
        }
        
        try {
            // API endpoint for updating address
            const apiUrl = `${CONFIG.API_URL}/addresses/${addressData.id}`;
            
            // Make API request
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(addressData)
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Address updated on server:', result);
            
            // Also update in localStorage
            updateAddressInLocalStorage(addressData);
            
            return result;
        } catch (fetchError) {
            console.warn('Server connection failed, updating in localStorage only:', fetchError);
            // Update in localStorage as fallback
            updateAddressInLocalStorage(addressData);
            return addressData;
        }
    } catch (error) {
        console.error('Error updating address on server:', error);
        return false;
    }
}

// Helper function to update address in localStorage
function updateAddressInLocalStorage(addressData) {
    // Get saved addresses
    let savedAddresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
    
    // Find and update the address
    const index = savedAddresses.findIndex(addr => addr.id === addressData.id);
    if (index !== -1) {
        savedAddresses[index] = addressData;
    } else {
        savedAddresses.push(addressData);
    }
    
    // Save back to localStorage
    localStorage.setItem('savedAddresses', JSON.stringify(savedAddresses));
    console.log('Address updated in localStorage:', addressData);
}

// Update address
async function updateAddress(addressData) {
    try {
        console.log('Updating address:', addressData);
        
        // Get addresses from localStorage
        let addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
        
        // Find the address index
        const addressIndex = addresses.findIndex(addr => addr.id === addressData.id);
        if (addressIndex === -1) {
            throw new Error('Address not found');
        }
        
        // If this address is being set as default, update all others
        if (addressData.isDefault) {
            addresses.forEach(addr => addr.isDefault = false);
        }
        
        // Update the address
        addresses[addressIndex] = {
            ...addresses[addressIndex],
            ...addressData,
            updatedAt: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('savedAddresses', JSON.stringify(addresses));
        
        // Try to update on server
        const serverResult = await updateAddressOnServer(addresses[addressIndex]);
        console.log('Server update result:', serverResult);
        
        // Reload addresses from server or use the local ones
        try {
            const serverAddresses = await getAddressesFromServer();
            if (serverAddresses && serverAddresses.length > 0) {
                addresses = serverAddresses;
                localStorage.setItem('savedAddresses', JSON.stringify(addresses));
            }
        } catch (serverError) {
            console.warn('Could not fetch addresses from server after update, using local data', serverError);
        }
        
        // Render addresses
        renderAddresses(addresses);
        setupAddressCardListeners();
        
        // Show success message
        showSuccess('Adres başarıyla güncellendi');
        
        return true;
    } catch (error) {
        console.error('Error updating address:', error);
        showError('Adres güncellenirken bir hata oluştu');
        return false;
    }
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateCardHolderName,
        validateCardNumber,
        validateExpiryMonth,
        validateExpiryYear,
        validateCVV
    };
}

// Debug function to help diagnose issues
function debugCheckout() {
    console.log('=== CHECKOUT DEBUG INFO ===');
    
    // Check cart data
    const cartData = localStorage.getItem('cart');
    console.log('Cart data exists:', !!cartData);
    if (cartData) {
        try {
            const parsedCart = JSON.parse(cartData);
            console.log('Cart items count:', parsedCart.length);
            console.log('Cart items:', parsedCart);
        } catch (e) {
            console.error('Error parsing cart data:', e);
        }
    }
    
    // Check address data
    const addressData = localStorage.getItem('savedAddresses');
    console.log('Address data exists:', !!addressData);
    if (addressData) {
        try {
            const parsedAddresses = JSON.parse(addressData);
            console.log('Addresses count:', parsedAddresses.length);
            console.log('Addresses:', parsedAddresses);
        } catch (e) {
            console.error('Error parsing address data:', e);
        }
    }
    
    // Check DOM elements
    console.log('Shipping container exists:', !!document.getElementById('shipping-address-container'));
    console.log('Order items container exists:', !!document.getElementById('order-items'));
    console.log('Address modal exists:', !!document.getElementById('address-modal'));
    
    // Check selected address
    console.log('Selected address ID:', selectedAddressId);
    
    console.log('=== END DEBUG INFO ===');
}

// Call debug on page load
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to let other initialization happen
    setTimeout(debugCheckout, 1000);
});

// Place order with improved validation, error handling, and feedback
async function placeOrder() {
    // Disable the place order button to prevent multiple submissions
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (!placeOrderBtn) return;
    
    // Check if already processing
    if (placeOrderBtn.disabled) {
        showError('Sipariş işlemi zaten devam ediyor, lütfen bekleyin.');
        return;
    }
    
    // Show processing state
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sipariş İşleniyor...';
    
    try {
        // Validate if cart has items
        const cart = localStorage.getItem('cart');
        if (!cart || JSON.parse(cart).length === 0) {
            showError('Sepetiniz boş. Sipariş verebilmek için sepetinize ürün ekleyin.');
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = 'Sipariş Ver';
            return;
        }
        
        // Get selected address
        const selectedAddressId = document.querySelector('input[name="delivery-address"]:checked')?.value;
        if (!selectedAddressId) {
            showError('Lütfen bir teslimat adresi seçin veya yeni bir adres ekleyin.');
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = 'Sipariş Ver';
            return;
        }
        
        // Get selected payment method
        const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
        if (!selectedPaymentMethod) {
            showError('Lütfen bir ödeme yöntemi seçin.');
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = 'Sipariş Ver';
            return;
        }
        
        // Validate order data
        if (!validateOrder()) {
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = 'Sipariş Ver';
            return;
        }
        
        // Create order object
        const order = {
            customer: {
                name: document.getElementById('name')?.value || 'Misafir',
                email: document.getElementById('email')?.value || 'guest@example.com',
                phone: document.getElementById('phone')?.value || ''
            },
            addressId: selectedAddressId,
            paymentMethod: selectedPaymentMethod,
            items: JSON.parse(cart),
            status: 'pending',
            notes: document.getElementById('order-notes')?.value || '',
            createdAt: new Date().toISOString()
        };
        
        // Calculate totals
        const { subtotal, discount, tax, shipping, total } = calculateTotals(order.items);
        order.totals = { subtotal, discount, tax, shipping, total };
        
        // Process based on payment method
        if (selectedPaymentMethod === 'credit_card') {
            // Process credit card payment first
            const paymentResult = await processCreditCardPayment();
            if (!paymentResult.success) {
                showError(paymentResult.message || 'Ödeme işlemi başarısız oldu.');
                placeOrderBtn.disabled = false;
                placeOrderBtn.innerHTML = 'Sipariş Ver';
                return;
            }
            
            // Add payment info to order
            order.payment = {
                method: 'credit_card',
                transactionId: paymentResult.transactionId,
                status: 'completed'
            };
        } else if (selectedPaymentMethod === 'bank_transfer') {
            order.payment = {
                method: 'bank_transfer',
                status: 'pending'
            };
        } else if (selectedPaymentMethod === 'cash_on_delivery') {
            order.payment = {
                method: 'cash_on_delivery',
                status: 'pending'
            };
        }
        
        // Save order to server
        const response = await saveOrderToServer(order);
        
        if (!response.success) {
            showError(response.message || 'Siparişiniz kaydedilirken bir hata oluştu.');
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = 'Sipariş Ver';
            return;
        }
        
        // Clear cart
        localStorage.removeItem('cart');
        
        // Show success message
        showPaymentSuccess({
            orderId: response.orderId || 'ORD-' + Date.now(),
            total: total
        });
        
        // Redirect to order confirmation page after a delay
        setTimeout(() => {
            window.location.href = `order-confirmation.html?id=${response.orderId}`;
        }, 3000);
        
    } catch (error) {
        console.error('Error placing order:', error);
        showError('Sipariş işlemi sırasında beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        
        // Reset button
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = 'Sipariş Ver';
    }
}

// Save order to server
async function saveOrderToServer(order) {
    try {
        console.log('Saving order to server:', order);
        
        // Get user token
        const token = localStorage.getItem('token');
        
        // API endpoint - Use CONFIG.API_URL instead of hardcoded URL
        const url = `${CONFIG.API_URL}/orders`;
        
        // Send request
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(order)
        });
        
        // Check response
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error saving order');
        }
        
        // Parse response
        const data = await response.json();
        console.log('Order saved successfully:', data);
        
        return data;
    } catch (error) {
        console.error('Error saving order to server:', error);
        throw error;
    }
}

// Validate order
function validateOrder() {
    console.log('Validating order');
    
    // Check if cart is empty
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!cart || cart.length === 0) {
        showError('Sepetinizde ürün bulunmamaktadır');
        return false;
    }
    
    // Check if address is selected
    if (!selectedAddressId) {
        showError('Lütfen bir teslimat adresi seçin');
        return false;
    }
    
    // Check payment method
    if (!selectedPaymentMethod) {
        showError('Lütfen bir ödeme yöntemi seçin');
        return false;
    }
    
    // Validate payment method specific fields
    if (selectedPaymentMethod === 'credit_card') {
        // Validate credit card fields
        if (!validateCardNumber()) {
            showError('Lütfen geçerli bir kart numarası girin');
            return false;
        }
        
        if (!validateCardHolderName()) {
            showError('Lütfen kart sahibinin adını girin');
            return false;
        }
        
        if (!validateExpiryDate()) {
            showError('Lütfen geçerli bir son kullanma tarihi girin');
            return false;
        }
        
        if (!validateCVV()) {
            showError('Lütfen geçerli bir CVV kodu girin');
            return false;
        }
    } else if (selectedPaymentMethod === 'bank_transfer') {
        // No validation needed for bank transfer
    } else if (selectedPaymentMethod === 'cash_on_delivery') {
        // No validation needed for cash on delivery
    }
    
    console.log('Order validation successful');
    return true;
}

// Save address
async function saveAddress() {
    try {
        console.log('Saving address');
        
        // Get form
        const form = document.getElementById('address-form');
        if (!form) {
            throw new Error('Address form not found');
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kaydediliyor...';
        }
        
        // Get form data with null checks
        const titleElement = document.getElementById('address-title');
        const fullNameElement = document.getElementById('address-fullname');
        const phoneElement = document.getElementById('address-phone');
        const streetElement = document.getElementById('address-street');
        const cityElement = document.getElementById('address-city');
        const stateElement = document.getElementById('address-state');
        const postalCodeElement = document.getElementById('address-postal-code');
        const countryElement = document.getElementById('address-country');
        const defaultElement = document.getElementById('address-default');
        
        // Check if all required elements exist
        if (!titleElement || !fullNameElement || !phoneElement || !streetElement || 
            !cityElement || !stateElement || !postalCodeElement || !countryElement) {
            console.error('One or more form elements not found', {
                titleElement, fullNameElement, phoneElement, streetElement,
                cityElement, stateElement, postalCodeElement, countryElement
            });
            showError('Form alanları bulunamadı. Lütfen sayfayı yenileyin.');
            
            // Reset button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Kaydet';
            }
            
            return;
        }
        
        const addressData = {
            id: form.getAttribute('data-address-id') || 'addr_' + Date.now(),
            title: titleElement.value || 'Adresim',
            fullName: fullNameElement.value || '',
            phone: phoneElement.value || '',
            street: streetElement.value || '',
            city: cityElement.value || '',
            state: stateElement.value || '',
            postalCode: postalCodeElement.value || '',
            country: countryElement.value || 'Turkey',
            isDefault: defaultElement ? defaultElement.checked : false
        };
        
        console.log('Address data:', addressData);
        
        // Validate required fields
        if (!addressData.fullName || !addressData.phone || !addressData.street || !addressData.city) {
            showError('Lütfen gerekli alanları doldurun');
            
            // Reset button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Kaydet';
            }
            
            return;
        }
        
        // Get existing addresses
        let addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
        
        // Check if editing existing address
        const isEditing = form.hasAttribute('data-address-id');
        
        if (isEditing) {
            // Find address index
            const addressIndex = addresses.findIndex(addr => addr.id === addressData.id);
            
            if (addressIndex !== -1) {
                // Update address
                addresses[addressIndex] = addressData;
            } else {
                // Address not found, add as new
                addresses.push(addressData);
            }
        } else {
            // If this is set as default, update other addresses
            if (addressData.isDefault) {
                addresses.forEach(addr => {
                    addr.isDefault = false;
                });
            }
            
            // Add new address
            addresses.push(addressData);
        }
        
        // Save to localStorage
        localStorage.setItem('savedAddresses', JSON.stringify(addresses));
        
        // Try to save to server
        try {
            const serverResponse = await saveAddressToServer(addressData);
            console.log('Server response for address save:', serverResponse);
            
            // If server returned an updated address (with server-generated ID), update local storage
            if (serverResponse && serverResponse.id && serverResponse.id !== addressData.id) {
                // Update the ID in our addresses array
                const updatedAddresses = addresses.map(addr => 
                    addr.id === addressData.id ? {...addr, id: serverResponse.id} : addr
                );
                localStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
                addresses = updatedAddresses;
            }
        } catch (error) {
            console.error('Error saving address to server:', error);
            // Continue with local address
        }
        
        // Clear the shipping address container before rendering
        const container = document.getElementById('shipping-address-container');
        if (container) {
            container.innerHTML = '';
        }
        
        // Render addresses
        renderAddresses(addresses);
        
        // Setup address card listeners
        setupAddressCardListeners();
        
        // Close modal
        const addressModal = document.getElementById('address-modal');
        if (addressModal) {
            addressModal.style.display = 'none';
        }
        
        // Show success message
        showSuccess(isEditing ? 'Adres başarıyla güncellendi' : 'Adres başarıyla eklendi');
        
        // Reset form
        form.reset();
        form.removeAttribute('data-address-id');
        
        return addressData;
    } catch (error) {
        console.error('Error saving address:', error);
        showError('Adres kaydedilirken bir hata oluştu');
        
        // Reset button
        const submitBtn = document.querySelector('#address-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Kaydet';
        }
        
        return null;
    }
} 