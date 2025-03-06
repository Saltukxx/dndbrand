/**
 * DnD Brand E-commerce - Account Page Functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize account page
    initializeAccount();
    
    // Initialize auth forms
    initializeAuthForms();
    
    // Initialize account tabs
    initializeAccountTabs();
    
    // Initialize address management
    initializeAddressManagement();
    
    // Initialize profile form
    initializeProfileForm();
    
    // Initialize password form
    initializePasswordForm();
    
    // Initialize logout button
    initializeLogoutButton();
});

// Initialize account page
function initializeAccount() {
    // Check if user is logged in
    const isLoggedIn = checkLoginStatus();
    
    // Show appropriate content based on login status
    if (isLoggedIn) {
        document.getElementById('auth-forms').style.display = 'none';
        document.querySelector('.account-logged').style.display = 'block';
        document.querySelectorAll('.account-tab').forEach(tab => {
            tab.style.display = 'none';
        });
        document.getElementById('dashboard-tab').style.display = 'block';
        document.querySelector('.account-sidebar').style.display = 'block';
        
        // Load user data
        loadUserData();
        
        // Load orders
        loadOrders();
        
        // Load addresses
        loadAddresses();
        
        // Load wishlist
        loadWishlist();
    } else {
        document.getElementById('auth-forms').style.display = 'block';
        document.querySelector('.account-logged').style.display = 'none';
        document.querySelectorAll('.account-tab').forEach(tab => {
            tab.style.display = 'none';
        });
        document.querySelector('.account-sidebar').style.display = 'none';
    }
}

// Check login status
function checkLoginStatus() {
    // In a real application, this would check if the user is logged in
    // For this example, we'll check if there's a user in localStorage
    const user = localStorage.getItem('user');
    return user ? true : false;
}

// Initialize auth forms
function initializeAuthForms() {
    const authTabs = document.querySelectorAll('.auth-tab');
    const authContents = document.querySelectorAll('.auth-tab-content');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const backToLoginLink = document.querySelector('.back-to-login');
    
    // Check if we need to show a specific tab based on URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const returnUrl = urlParams.get('returnUrl');
    
    // Store return URL in a hidden field if present
    if (returnUrl) {
        const returnUrlFields = document.querySelectorAll('.return-url-field');
        returnUrlFields.forEach(field => {
            field.value = returnUrl;
        });
    }
    
    // Switch to register tab if specified in URL
    if (action === 'register') {
        authTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === 'register');
        });
        authContents.forEach(content => {
            content.classList.toggle('active', content.id === 'register-tab-content');
        });
    }
    
    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            authContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab-content`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Show password toggle
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            button.innerHTML = type === 'password' ? '<i class="far fa-eye"></i>' : '<i class="far fa-eye-slash"></i>';
        });
    });
    
    // Forgot password link
    if (forgotPasswordLink && forgotPasswordForm) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-tab-content').classList.remove('active');
            forgotPasswordForm.classList.add('active');
        });
    }
    
    // Back to login link
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotPasswordForm.classList.remove('active');
            document.getElementById('login-tab-content').classList.add('active');
        });
    }
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Clear previous error messages
            clearFormErrors(loginForm);
            
            // Get form data
            const email = loginForm.querySelector('#login-email').value;
            const password = loginForm.querySelector('#login-password').value;
            const returnUrlField = loginForm.querySelector('.return-url-field');
            const returnUrl = returnUrlField ? returnUrlField.value : '';
            
            // Validate form
            let isValid = true;
            
            if (!email) {
                showFormError(loginForm.querySelector('#login-email'), 'E-posta adresi gerekli');
                isValid = false;
            } else if (!isValidEmail(email)) {
                showFormError(loginForm.querySelector('#login-email'), 'Geçerli bir e-posta adresi girin');
                isValid = false;
            }
            
            if (!password) {
                showFormError(loginForm.querySelector('#login-password'), 'Şifre gerekli');
                isValid = false;
            }
            
            if (!isValid) return;
            
            // Show loading state
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Giriş Yapılıyor...';
            
            try {
                // Simulate API call (replace with actual API call)
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Store token in localStorage (replace with actual token)
                localStorage.setItem('token', 'sample-token');
                localStorage.setItem('user', JSON.stringify({
                    id: '123',
                    name: 'Demo User',
                    email: email
                }));
                
                // Redirect to return URL or account page
                if (returnUrl) {
                    window.location.href = returnUrl;
                } else {
                    // Check if we're already on the account page
                    const currentPath = window.location.pathname;
                    if (currentPath.endsWith('account.html')) {
                        // We're already on the account page, just update the UI
                        document.getElementById('auth-forms').style.display = 'none';
                        document.querySelector('.account-logged').style.display = 'block';
                        document.querySelectorAll('.account-tab').forEach(tab => {
                            tab.style.display = 'none';
                        });
                        document.getElementById('dashboard-tab').style.display = 'block';
                        document.querySelector('.account-sidebar').style.display = 'block';
                        
                        // Load user data
                        loadUserData();
                        
                        // Load orders
                        loadOrders();
                        
                        // Load addresses
                        loadAddresses();
                        
                        // Load wishlist
                        loadWishlist();
                        
                        // Show success notification
                        showNotification('Giriş başarılı!', 'success');
                    } else {
                        // Navigate to the account page
                        window.location.href = 'account.html';
                    }
                }
            } catch (error) {
                // Show error message
                showFormError(loginForm, 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
                
                // Reset button
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }
    
    // Register form submission
    if (registerForm) {
        // Similar implementation as login form
        // ...
    }
}

// Helper function to validate email
function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Helper function to show form errors
function showFormError(element, message) {
    // If element is the form itself, show a general error
    if (element.tagName === 'FORM') {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error general-error';
        errorDiv.textContent = message;
        element.prepend(errorDiv);
        return;
    }
    
    // Otherwise, show error for a specific field
    const formGroup = element.closest('.form-group');
    if (formGroup) {
        const errorDiv = formGroup.querySelector('.field-error') || document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        
        if (!formGroup.querySelector('.field-error')) {
            formGroup.appendChild(errorDiv);
        }
        
        element.classList.add('is-invalid');
    }
}

// Helper function to clear form errors
function clearFormErrors(form) {
    // Clear general errors
    const generalErrors = form.querySelectorAll('.general-error');
    generalErrors.forEach(error => error.remove());
    
    // Clear field errors
    const fieldErrors = form.querySelectorAll('.field-error');
    fieldErrors.forEach(error => error.remove());
    
    // Remove invalid class from inputs
    const inputs = form.querySelectorAll('.is-invalid');
    inputs.forEach(input => input.classList.remove('is-invalid'));
}

// Initialize account tabs
function initializeAccountTabs() {
    const menuItems = document.querySelectorAll('.account-menu li');
    
    menuItems.forEach(item => {
        if (!item.getAttribute('data-tab')) return; // Skip logout button
        
        item.addEventListener('click', function() {
            // Remove active class from all menu items
            menuItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked menu item
            this.classList.add('active');
            
            // Hide all tabs
            document.querySelectorAll('.account-tab').forEach(tab => {
                tab.style.display = 'none';
            });
            
            // Show selected tab
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).style.display = 'block';
        });
    });
}

// Load user data
function loadUserData() {
    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('dndUser'));
    
    if (!user) return;
    
    // Update user name and email in sidebar
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-email').textContent = user.email;
    
    // Update dashboard name
    document.getElementById('dashboard-name').textContent = user.name;
    
    // Update profile form
    document.getElementById('profile-name').value = user.name;
    document.getElementById('profile-email').value = user.email;
    document.getElementById('profile-phone').value = user.phone || '';
    document.getElementById('profile-birth').value = user.birthDate || '';
    document.getElementById('profile-bio').value = user.bio || '';
}

// Initialize profile form
function initializeProfileForm() {
    const profileForm = document.getElementById('profile-form');
    
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get user from localStorage
            const user = JSON.parse(localStorage.getItem('dndUser'));
            
            if (!user) return;
            
            // Update user data
            user.name = document.getElementById('profile-name').value;
            user.email = document.getElementById('profile-email').value;
            user.phone = document.getElementById('profile-phone').value;
            user.birthDate = document.getElementById('profile-birth').value;
            user.bio = document.getElementById('profile-bio').value;
            
            // Save updated user to localStorage
            localStorage.setItem('dndUser', JSON.stringify(user));
            
            // Show notification
            showNotification('Profil bilgileriniz güncellendi', 'success');
            
            // Update user name and email in sidebar
            document.getElementById('user-name').textContent = user.name;
            document.getElementById('user-email').textContent = user.email;
            
            // Update dashboard name
            document.getElementById('dashboard-name').textContent = user.name;
        });
    }
}

// Initialize password form
function initializePasswordForm() {
    const passwordForm = document.getElementById('password-form');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                showNotification('Lütfen tüm alanları doldurun', 'error');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showNotification('Yeni şifreler eşleşmiyor', 'error');
                return;
            }
            
            // In a real application, this would send a request to the server
            // For this example, we'll just simulate a successful password change
            
            // Show notification
            showNotification('Şifreniz başarıyla değiştirildi', 'success');
            
            // Clear form
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        });
    }
}

// Initialize logout button
function initializeLogoutButton() {
    const logoutButton = document.querySelector('[data-tab="logout"]');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Remove user from localStorage
            localStorage.removeItem('dndUser');
            
            // Show notification
            showNotification('Çıkış yapıldı', 'success');
            
            // Reload page
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }
}

// Load orders
async function loadOrders() {
    try {
        // Show loading state
        const ordersList = document.getElementById('orders-list');
        const recentOrdersList = document.getElementById('recent-orders-list');
        
        ordersList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Siparişler yükleniyor...</div>';
        recentOrdersList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Siparişler yükleniyor...</div>';
        
        // Fetch orders from API
        const orders = await accountAPI.getOrders();
        
        // Update order count in dashboard
        document.getElementById('orders-count').textContent = orders.length;
        
        // Clear loading state
        ordersList.innerHTML = '';
        recentOrdersList.innerHTML = '';
        
        if (orders.length === 0) {
            // Show empty state
            ordersList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <p>Henüz bir sipariş vermediniz.</p>
                </div>
            `;
            
            recentOrdersList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <p>Henüz bir sipariş vermediniz.</p>
                </div>
            `;
        } else {
            // Create order elements
            orders.forEach(order => {
                const orderElement = createOrderElement(order);
                ordersList.appendChild(orderElement);
                
                // Add to recent orders if it's one of the 3 most recent
                if (orders.indexOf(order) < 3) {
                    const recentOrderElement = createOrderElement(order, true);
                    recentOrdersList.appendChild(recentOrderElement);
                }
            });
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        
        // Show error state
        document.getElementById('orders-list').innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <p>Siparişler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
            </div>
        `;
        
        document.getElementById('recent-orders-list').innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <p>Siparişler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
            </div>
        `;
    }
}

// Create order element
function createOrderElement(order, isRecent = false) {
    const orderElement = document.createElement('div');
    orderElement.className = `order-item ${isRecent ? 'recent-order' : ''}`;
    
    const orderHeader = document.createElement('div');
    orderHeader.className = 'order-header';
    
    const orderId = document.createElement('div');
    orderId.className = 'order-id';
    orderId.textContent = order.id;
    
    const orderDate = document.createElement('div');
    orderDate.className = 'order-date';
    orderDate.textContent = formatDate(order.date);
    
    const orderStatus = document.createElement('div');
    orderStatus.className = `order-status ${order.status}`;
    orderStatus.textContent = getStatusText(order.status);
    
    orderHeader.appendChild(orderId);
    orderHeader.appendChild(orderDate);
    orderHeader.appendChild(orderStatus);
    
    const orderProducts = document.createElement('div');
    orderProducts.className = 'order-products';
    
    order.products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'order-product';
        
        const productImage = document.createElement('div');
        productImage.className = 'order-product-image';
        
        const img = document.createElement('img');
        img.src = product.image;
        img.alt = product.name;
        
        productImage.appendChild(img);
        
        const productInfo = document.createElement('div');
        productInfo.className = 'order-product-info';
        
        const productName = document.createElement('h4');
        productName.textContent = product.name;
        
        const productDetails = document.createElement('p');
        productDetails.textContent = `${product.quantity} adet x ₺${product.price.toLocaleString('tr-TR')}`;
        
        productInfo.appendChild(productName);
        productInfo.appendChild(productDetails);
        
        productElement.appendChild(productImage);
        productElement.appendChild(productInfo);
        
        orderProducts.appendChild(productElement);
    });
    
    const orderFooter = document.createElement('div');
    orderFooter.className = 'order-footer';
    
    const orderTotal = document.createElement('div');
    orderTotal.className = 'order-total';
    orderTotal.textContent = `Toplam: ₺${order.total.toLocaleString('tr-TR')}`;
    
    const orderActions = document.createElement('div');
    orderActions.className = 'order-actions';
    
    const viewOrderLink = document.createElement('a');
    viewOrderLink.href = '#';
    viewOrderLink.className = 'btn btn-secondary';
    viewOrderLink.textContent = 'Sipariş Detayları';
    
    orderActions.appendChild(viewOrderLink);
    
    orderFooter.appendChild(orderTotal);
    orderFooter.appendChild(orderActions);
    
    orderElement.appendChild(orderHeader);
    orderElement.appendChild(orderProducts);
    orderElement.appendChild(orderFooter);
    
    return orderElement;
}

// Format date
function formatDate(date) {
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Get status text
function getStatusText(status) {
    switch (status) {
        case 'pending':
            return 'Beklemede';
        case 'processing':
            return 'İşleniyor';
        case 'shipped':
            return 'Kargoya Verildi';
        case 'delivered':
            return 'Teslim Edildi';
        case 'cancelled':
            return 'İptal Edildi';
        default:
            return status;
    }
}

// Load addresses
async function loadAddresses() {
    try {
        // Show loading state
        const addressesGrid = document.getElementById('addresses-grid');
        addressesGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Adresler yükleniyor...</div>';
        
        // Fetch addresses from API
        const addresses = await accountAPI.getAddresses();
        
        // Update address count in dashboard
        document.getElementById('addresses-count').textContent = addresses.length;
        
        // Clear loading state
        addressesGrid.innerHTML = '';
        
        if (addresses.length === 0) {
            // Show empty state
            addressesGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <p>Henüz bir adres eklemediniz.</p>
                </div>
            `;
        } else {
            // Create address elements
            addresses.forEach(address => {
                const addressElement = createAddressElement(address);
                addressesGrid.appendChild(addressElement);
            });
        }
    } catch (error) {
        console.error('Error loading addresses:', error);
        
        // Show error state
        document.getElementById('addresses-grid').innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <p>Adresler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
            </div>
        `;
    }
}

// Create address element
function createAddressElement(address) {
    const addressElement = document.createElement('div');
    addressElement.className = 'address-card';
    
    if (address.isDefault) {
        addressElement.classList.add('default');
    }
    
    // Handle different address formats
    const title = address.title || address.addressType || 'Adres';
    const name = address.name || '';
    const line = address.street || address.line || '';
    const city = address.city || '';
    const state = address.state || '';
    const postal = address.postalCode || address.postal || '';
    const country = address.country || 'Türkiye';
    const phone = address.phone || '';
    
    addressElement.innerHTML = `
        <div class="address-type">${title}</div>
        <div class="address-details">
            ${name ? `<p><strong>${name}</strong></p>` : ''}
            <p>${line}</p>
            <p>${city}${state ? `, ${state}` : ''} ${postal}</p>
            <p>${country}</p>
            ${phone ? `<p>${phone}</p>` : ''}
        </div>
        <div class="address-actions">
            <button class="edit-address" data-id="${address.id}">
                <i class="fas fa-edit"></i> Düzenle
            </button>
            <button class="delete-address" data-id="${address.id}">
                <i class="fas fa-trash"></i> Sil
            </button>
            ${!address.isDefault ? `
            <button class="set-default-address" data-id="${address.id}">
                <i class="fas fa-check-circle"></i> Varsayılan Yap
            </button>` : ''}
        </div>
    `;
    
    // Add event listeners
    const editButton = addressElement.querySelector('.edit-address');
    const deleteButton = addressElement.querySelector('.delete-address');
    
    editButton.addEventListener('click', function() {
        // Get address id
        const addressId = this.getAttribute('data-id');
        
        // Get address
        const address = addresses.find(a => a.id === addressId);
        
        if (!address) return;
        
        // Fill form
        document.getElementById('address-title').value = address.title;
        document.getElementById('address-name').value = address.name;
        document.getElementById('address-phone').value = address.phone;
        document.getElementById('address-city').value = address.city;
        document.getElementById('address-line').value = address.line;
        document.getElementById('address-postal').value = address.postal;
        document.getElementById('address-country').value = address.country;
        document.getElementById('address-default').checked = address.isDefault;
        
        // Show form
        document.getElementById('address-form-container').style.display = 'block';
        
        // Set form mode to edit
        document.getElementById('address-form').setAttribute('data-mode', 'edit');
        document.getElementById('address-form').setAttribute('data-id', addressId);
    });
    
    deleteButton.addEventListener('click', function() {
        // Get address id
        const addressId = this.getAttribute('data-id');
        
        // Get addresses from localStorage
        let addresses = JSON.parse(localStorage.getItem('dndAddresses')) || [];
        
        // Remove address
        addresses = addresses.filter(a => a.id !== addressId);
        
        // Save addresses to localStorage
        localStorage.setItem('dndAddresses', JSON.stringify(addresses));
        
        // Show notification
        showNotification('Adres silindi', 'success');
        
        // Reload addresses
        loadAddresses();
    });
    
    return addressElement;
}

// Initialize address management
function initializeAddressManagement() {
    const addAddressButton = document.getElementById('add-address-button');
    const cancelAddressButton = document.getElementById('cancel-address-button');
    const addressForm = document.getElementById('address-form');
    const addressFormContainer = document.getElementById('address-form-container');
    
    // Add address button
    if (addAddressButton) {
        addAddressButton.addEventListener('click', () => {
            // Reset form
            addressForm.reset();
            addressForm.removeAttribute('data-address-id');
            
            // Update form title
            const formTitle = addressFormContainer.querySelector('h3') || document.createElement('h3');
            formTitle.textContent = 'Yeni Adres Ekle';
            if (!addressFormContainer.querySelector('h3')) {
                addressFormContainer.insertBefore(formTitle, addressForm);
            }
            
            // Show form
            addressFormContainer.style.display = 'block';
            
            // Scroll to form
            addressFormContainer.scrollIntoView({ behavior: 'smooth' });
            
            // Remove any existing submit handlers
            const newAddressForm = addressForm.cloneNode(true);
            addressForm.parentNode.replaceChild(newAddressForm, addressForm);
            
            // Add submit handler for new address
            newAddressForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Get form data
                const formData = new FormData(newAddressForm);
                const addressData = {
                    addressType: 'shipping',
                    street: formData.get('line'),
                    city: formData.get('city'),
                    state: formData.get('city'), // Using city as state for Turkey
                    postalCode: formData.get('postal'),
                    country: formData.get('country'),
                    isDefault: formData.get('default') === 'on'
                };
                
                try {
                    // Show loading state
                    const submitButton = newAddressForm.querySelector('button[type="submit"]');
                    const originalButtonText = submitButton.textContent;
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kaydediliyor...';
                    
                    // Save address to server
                    await accountAPI.addAddress(addressData);
                    
                    // Hide form
                    addressFormContainer.style.display = 'none';
                    
                    // Reload addresses
                    await loadAddresses();
                    
                    // Show success notification
                    showNotification('Adres başarıyla eklendi.', 'success');
                } catch (error) {
                    console.error('Error adding address:', error);
                    
                    // Show error notification
                    showNotification('Adres eklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'error');
                    
                    // Reset button
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            });
        });
    }
    
    // Cancel button
    if (cancelAddressButton) {
        cancelAddressButton.addEventListener('click', () => {
            // Hide form
            addressFormContainer.style.display = 'none';
        });
    }
}

// Edit address
async function editAddress(addressId) {
    try {
        // Show loading state
        const addressElement = document.querySelector(`.address-card[data-address-id="${addressId}"]`);
        if (addressElement) {
            addressElement.classList.add('loading');
        }
        
        // Get addresses
        const addresses = await accountAPI.getAddresses();
        const address = addresses.find(a => a._id === addressId);
        
        if (!address) {
            throw new Error('Address not found');
        }
        
        // Get form elements
        const addressForm = document.getElementById('address-form');
        const addressFormContainer = document.getElementById('address-form-container');
        
        // Set form data
        addressForm.querySelector('#address-title').value = address.addressType === 'billing' ? 'Fatura Adresi' : 'Teslimat Adresi';
        addressForm.querySelector('#address-name').value = document.getElementById('user-name').textContent || '';
        addressForm.querySelector('#address-phone').value = '';
        addressForm.querySelector('#address-city').value = address.city;
        addressForm.querySelector('#address-line').value = address.street;
        addressForm.querySelector('#address-postal').value = address.postalCode;
        addressForm.querySelector('#address-country').value = address.country;
        addressForm.querySelector('#address-default').checked = address.isDefault;
        
        // Set address ID
        addressForm.setAttribute('data-address-id', addressId);
        
        // Update form title
        const formTitle = addressFormContainer.querySelector('h3') || document.createElement('h3');
        formTitle.textContent = 'Adresi Düzenle';
        if (!addressFormContainer.querySelector('h3')) {
            addressFormContainer.insertBefore(formTitle, addressForm);
        }
        
        // Show form
        addressFormContainer.style.display = 'block';
        
        // Scroll to form
        addressFormContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Remove loading state
        if (addressElement) {
            addressElement.classList.remove('loading');
        }
        
        // Remove any existing submit handlers
        const newAddressForm = addressForm.cloneNode(true);
        addressForm.parentNode.replaceChild(newAddressForm, addressForm);
        
        // Add submit handler for updating address
        newAddressForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(newAddressForm);
            const addressData = {
                addressType: 'shipping',
                street: formData.get('line'),
                city: formData.get('city'),
                state: formData.get('city'), // Using city as state for Turkey
                postalCode: formData.get('postal'),
                country: formData.get('country'),
                isDefault: formData.get('default') === 'on'
            };
            
            try {
                // Show loading state
                const submitButton = newAddressForm.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kaydediliyor...';
                
                // Update address on server
                await accountAPI.updateAddress(addressId, addressData);
                
                // Hide form
                addressFormContainer.style.display = 'none';
                
                // Reload addresses
                await loadAddresses();
                
                // Show success notification
                showNotification('Adres başarıyla güncellendi.', 'success');
            } catch (error) {
                console.error('Error updating address:', error);
                
                // Show error notification
                showNotification('Adres güncellenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'error');
                
                // Reset button
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    } catch (error) {
        console.error('Error editing address:', error);
        
        // Show error notification
        showNotification('Adres bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'error');
    }
}

// Delete address
async function deleteAddress(addressId) {
    try {
        // Confirm deletion
        if (!confirm('Bu adresi silmek istediğinizden emin misiniz?')) {
            return;
        }
        
        // Show loading state
        const addressElement = document.querySelector(`.address-card[data-address-id="${addressId}"]`);
        if (addressElement) {
            addressElement.classList.add('loading');
            addressElement.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Siliniyor...</div>';
        }
        
        // Delete address from server
        await accountAPI.deleteAddress(addressId);
        
        // Reload addresses
        await loadAddresses();
        
        // Show success notification
        showNotification('Adres başarıyla silindi.', 'success');
    } catch (error) {
        console.error('Error deleting address:', error);
        
        // Show error notification
        showNotification('Adres silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'error');
        
        // Reload addresses to reset UI
        await loadAddresses();
    }
}

// Set default address
async function setDefaultAddress(addressId) {
    try {
        // Show loading state
        const addressElement = document.querySelector(`.address-card[data-address-id="${addressId}"]`);
        if (addressElement) {
            addressElement.classList.add('loading');
        }
        
        // Get addresses
        const addresses = await accountAPI.getAddresses();
        const address = addresses.find(a => a._id === addressId);
        
        if (!address) {
            throw new Error('Address not found');
        }
        
        // Update address
        const updatedAddress = { ...address, isDefault: true };
        
        // Update address on server
        await accountAPI.updateAddress(addressId, updatedAddress);
        
        // Reload addresses
        await loadAddresses();
        
        // Show success notification
        showNotification('Varsayılan adres başarıyla güncellendi.', 'success');
    } catch (error) {
        console.error('Error setting default address:', error);
        
        // Show error notification
        showNotification('Varsayılan adres ayarlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'error');
        
        // Reload addresses to reset UI
        await loadAddresses();
    }
}

// Load wishlist
async function loadWishlist() {
    try {
        // Show loading state
        const wishlistGrid = document.getElementById('wishlist-grid');
        wishlistGrid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Favoriler yükleniyor...</div>';
        
        // Fetch wishlist from API
        const wishlistItems = await accountAPI.getWishlist();
        
        // Update wishlist count in dashboard
        document.getElementById('wishlist-count').textContent = wishlistItems.length;
        
        // Clear loading state
        wishlistGrid.innerHTML = '';
        
        if (wishlistItems.length === 0) {
            // Show empty state
            wishlistGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <p>Henüz bir ürünü favorilere eklemediniz.</p>
                </div>
            `;
        } else {
            // Create wishlist elements
            wishlistItems.forEach(item => {
                const wishlistElement = createWishlistElement(item);
                wishlistGrid.appendChild(wishlistElement);
            });
        }
    } catch (error) {
        console.error('Error loading wishlist:', error);
        
        // Show error state
        document.getElementById('wishlist-grid').innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <p>Favoriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
            </div>
        `;
    }
}

// Create wishlist element
function createWishlistElement(item) {
    const element = document.createElement('div');
    element.className = 'product-card';
    element.setAttribute('data-product-id', item._id);
    
    element.innerHTML = `
        <div class="product-image">
            <img src="${item.images[0] || '../images/product-placeholder.jpg'}" alt="${item.name}">
            <div class="product-actions">
                <button class="btn-icon remove-wishlist" title="Favorilerden Çıkar">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn-icon add-to-cart" title="Sepete Ekle">
                    <i class="fas fa-shopping-cart"></i>
                </button>
            </div>
        </div>
        <div class="product-info">
            <h3 class="product-title">${item.name}</h3>
            <div class="product-price">
                ${item.comparePrice > 0 ? `<span class="old-price">${item.comparePrice.toFixed(2)} TL</span>` : ''}
                <span class="current-price">${item.price.toFixed(2)} TL</span>
            </div>
        </div>
    `;
    
    // Add event listeners
    element.querySelector('.remove-wishlist').addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            // Show loading state
            element.classList.add('loading');
            
            // Remove from wishlist
            await accountAPI.removeFromWishlist(item._id);
            
            // Remove element with animation
            element.classList.add('removing');
            setTimeout(() => {
                element.remove();
                
                // Update count
                const count = document.querySelectorAll('#wishlist-grid .product-card').length;
                document.getElementById('wishlist-count').textContent = count;
                
                // Show empty state if no items left
                if (count === 0) {
                    document.getElementById('wishlist-grid').innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">
                                <i class="fas fa-heart"></i>
                            </div>
                            <p>Henüz bir ürünü favorilere eklemediniz.</p>
                        </div>
                    `;
                }
            }, 300);
            
            // Show success notification
            showNotification('Ürün favorilerden kaldırıldı.', 'success');
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            
            // Remove loading state
            element.classList.remove('loading');
            
            // Show error notification
            showNotification('Ürün favorilerden kaldırılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'error');
        }
    });
    
    element.querySelector('.add-to-cart').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Add to cart logic (you can implement this later)
        showNotification('Ürün sepete eklendi.', 'success');
    });
    
    // Make the whole card clickable to go to product page
    element.addEventListener('click', () => {
        window.location.href = `./product.html?id=${item._id}`;
    });
    
    return element;
}

// Show notification
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add notification to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        
        // Remove notification after animation
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
} 