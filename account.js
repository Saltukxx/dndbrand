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
        document.querySelectorAll('.account-tab').forEach(tab => {
            tab.style.display = 'none';
        });
        document.getElementById('dashboard-tab').style.display = 'block';
        
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
    const user = localStorage.getItem('dndUser');
    return user ? true : false;
}

// Initialize auth forms
function initializeAuthForms() {
    // Auth tabs
    const authTabs = document.querySelectorAll('.auth-tab');
    
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            authTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all forms
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            
            // Show selected form
            const formId = this.getAttribute('data-form');
            document.getElementById(`${formId}-form`).classList.add('active');
        });
    });
    
    // Login form
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                showNotification('Lütfen tüm alanları doldurun', 'error');
                return;
            }
            
            // In a real application, this would send a request to the server
            // For this example, we'll just simulate a successful login
            const user = {
                name: 'Demo Kullanıcı',
                email: email,
                phone: '',
                address: '',
                city: '',
                country: 'Türkiye',
                birthDate: '',
                gender: ''
            };
            
            // Save user to localStorage
            localStorage.setItem('dndUser', JSON.stringify(user));
            
            // Show notification
            showNotification('Giriş başarılı', 'success');
            
            // Reload page
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            if (!name || !email || !password || !confirmPassword) {
                showNotification('Lütfen tüm alanları doldurun', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showNotification('Şifreler eşleşmiyor', 'error');
                return;
            }
            
            // In a real application, this would send a request to the server
            // For this example, we'll just simulate a successful registration
            const user = {
                name: name,
                email: email,
                phone: '',
                address: '',
                city: '',
                country: 'Türkiye',
                birthDate: '',
                gender: ''
            };
            
            // Save user to localStorage
            localStorage.setItem('dndUser', JSON.stringify(user));
            
            // Show notification
            showNotification('Kayıt başarılı', 'success');
            
            // Reload page
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }
}

// Initialize account tabs
function initializeAccountTabs() {
    const menuItems = document.querySelectorAll('.account-menu li');
    
    menuItems.forEach(item => {
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
    
    // Update profile form
    document.getElementById('profile-name').value = user.name;
    document.getElementById('profile-email').value = user.email;
    document.getElementById('profile-phone').value = user.phone || '';
    document.getElementById('profile-address').value = user.address || '';
    document.getElementById('profile-city').value = user.city || '';
    document.getElementById('profile-country').value = user.country || 'Türkiye';
    document.getElementById('profile-birth-date').value = user.birthDate || '';
    document.getElementById('profile-gender').value = user.gender || '';
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
            user.address = document.getElementById('profile-address').value;
            user.city = document.getElementById('profile-city').value;
            user.country = document.getElementById('profile-country').value;
            user.birthDate = document.getElementById('profile-birth-date').value;
            user.gender = document.getElementById('profile-gender').value;
            
            // Save user to localStorage
            localStorage.setItem('dndUser', JSON.stringify(user));
            
            // Update user name and email in sidebar
            document.getElementById('user-name').textContent = user.name;
            document.getElementById('user-email').textContent = user.email;
            
            // Show notification
            showNotification('Profil bilgileriniz güncellendi', 'success');
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
function loadOrders() {
    // In a real application, this would fetch orders from the server
    // For this example, we'll use dummy data
    const orders = [
        {
            id: 'ORD-1234',
            date: new Date(2023, 5, 15),
            status: 'delivered',
            total: 4999.99,
            products: [
                {
                    id: 1,
                    name: 'Premium Deri Ceket',
                    price: 4999.99,
                    quantity: 1,
                    image: 'images/product-1.jpg'
                }
            ]
        },
        {
            id: 'ORD-1235',
            date: new Date(2023, 6, 20),
            status: 'processing',
            total: 3499.99,
            products: [
                {
                    id: 2,
                    name: 'Slim Fit Pantolon',
                    price: 1499.99,
                    quantity: 1,
                    image: 'images/product-2.jpg'
                },
                {
                    id: 3,
                    name: 'Pamuk Gömlek',
                    price: 999.99,
                    quantity: 2,
                    image: 'images/product-3.jpg'
                }
            ]
        }
    ];
    
    // Update dashboard stats
    document.getElementById('orders-count').textContent = orders.length;
    
    // Calculate total spent
    const totalSpent = orders.reduce((total, order) => total + order.total, 0);
    document.getElementById('total-spent').textContent = `₺${totalSpent.toLocaleString('tr-TR')}`;
    
    // Update recent orders in dashboard
    const recentOrdersContainer = document.getElementById('recent-orders-container');
    
    if (recentOrdersContainer) {
        recentOrdersContainer.innerHTML = '';
        
        if (orders.length === 0) {
            recentOrdersContainer.innerHTML = '<div class="no-orders">Henüz siparişiniz bulunmamaktadır.</div>';
        } else {
            orders.slice(0, 2).forEach(order => {
                recentOrdersContainer.appendChild(createOrderElement(order));
            });
        }
    }
    
    // Update orders tab
    const ordersContainer = document.getElementById('orders-container');
    
    if (ordersContainer) {
        ordersContainer.innerHTML = '';
        
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<div class="no-orders">Henüz siparişiniz bulunmamaktadır.</div>';
        } else {
            orders.forEach(order => {
                ordersContainer.appendChild(createOrderElement(order));
            });
        }
    }
}

// Create order element
function createOrderElement(order) {
    const orderElement = document.createElement('div');
    orderElement.className = 'order-item';
    
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
function loadAddresses() {
    // In a real application, this would fetch addresses from the server
    // For this example, we'll use dummy data
    const addresses = [
        {
            id: 1,
            name: 'Ev Adresi',
            address: 'Yakutiye Mah. Cumhuriyet Cad. No: 123',
            city: 'Erzurum',
            country: 'Türkiye',
            phone: '0532 123 45 67',
            default: true
        },
        {
            id: 2,
            name: 'İş Adresi',
            address: 'Palandöken Mah. Atatürk Cad. No: 456',
            city: 'Erzurum',
            country: 'Türkiye',
            phone: '0532 123 45 67',
            default: false
        }
    ];
    
    // Update addresses tab
    const addressesContainer = document.getElementById('addresses-container');
    
    if (addressesContainer) {
        addressesContainer.innerHTML = '';
        
        if (addresses.length === 0) {
            addressesContainer.innerHTML = '<div class="no-addresses">Henüz adresiniz bulunmamaktadır.</div>';
        } else {
            addresses.forEach(address => {
                addressesContainer.appendChild(createAddressElement(address));
            });
        }
    }
}

// Create address element
function createAddressElement(address) {
    const addressElement = document.createElement('div');
    addressElement.className = 'address-card';
    
    if (address.default) {
        addressElement.classList.add('default');
    }
    
    const addressHeader = document.createElement('div');
    addressHeader.className = 'address-header';
    
    const addressName = document.createElement('h3');
    addressName.textContent = address.name;
    
    const addressDefault = document.createElement('span');
    addressDefault.className = 'default-badge';
    addressDefault.textContent = 'Varsayılan';
    
    addressHeader.appendChild(addressName);
    
    if (address.default) {
        addressHeader.appendChild(addressDefault);
    }
    
    const addressContent = document.createElement('div');
    addressContent.className = 'address-content';
    
    const addressText = document.createElement('p');
    addressText.textContent = address.address;
    
    const cityCountry = document.createElement('p');
    cityCountry.textContent = `${address.city}, ${address.country}`;
    
    const phone = document.createElement('p');
    phone.textContent = address.phone;
    
    addressContent.appendChild(addressText);
    addressContent.appendChild(cityCountry);
    addressContent.appendChild(phone);
    
    const addressActions = document.createElement('div');
    addressActions.className = 'address-actions';
    
    const editButton = document.createElement('button');
    editButton.className = 'btn btn-secondary';
    editButton.textContent = 'Düzenle';
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-danger';
    deleteButton.textContent = 'Sil';
    
    const setDefaultButton = document.createElement('button');
    setDefaultButton.className = 'btn btn-primary';
    setDefaultButton.textContent = 'Varsayılan Yap';
    
    addressActions.appendChild(editButton);
    addressActions.appendChild(deleteButton);
    
    if (!address.default) {
        addressActions.appendChild(setDefaultButton);
    }
    
    addressElement.appendChild(addressHeader);
    addressElement.appendChild(addressContent);
    addressElement.appendChild(addressActions);
    
    return addressElement;
}

// Initialize address management
function initializeAddressManagement() {
    const addAddressButton = document.getElementById('add-address-button');
    
    if (addAddressButton) {
        addAddressButton.addEventListener('click', function() {
            // In a real application, this would show a form to add a new address
            // For this example, we'll just show a notification
            showNotification('Bu özellik henüz aktif değil', 'info');
        });
    }
}

// Load wishlist
function loadWishlist() {
    // In a real application, this would fetch wishlist from the server
    // For this example, we'll use dummy data
    const wishlist = [
        {
            id: 1,
            name: 'Premium Deri Ceket',
            price: 4999.99,
            image: 'images/product-1.jpg'
        },
        {
            id: 2,
            name: 'Slim Fit Pantolon',
            price: 1499.99,
            image: 'images/product-2.jpg'
        },
        {
            id: 3,
            name: 'Pamuk Gömlek',
            price: 999.99,
            image: 'images/product-3.jpg'
        }
    ];
    
    // Update wishlist tab
    const wishlistContainer = document.getElementById('wishlist-container');
    
    if (wishlistContainer) {
        wishlistContainer.innerHTML = '';
        
        if (wishlist.length === 0) {
            wishlistContainer.innerHTML = '<div class="no-wishlist">Henüz favoriniz bulunmamaktadır.</div>';
        } else {
            const wishlistGrid = document.createElement('div');
            wishlistGrid.className = 'wishlist-grid';
            
            wishlist.forEach(item => {
                wishlistGrid.appendChild(createWishlistElement(item));
            });
            
            wishlistContainer.appendChild(wishlistGrid);
        }
    }
}

// Create wishlist element
function createWishlistElement(item) {
    const wishlistElement = document.createElement('div');
    wishlistElement.className = 'wishlist-card';
    
    const wishlistImage = document.createElement('div');
    wishlistImage.className = 'wishlist-image';
    
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    
    const removeButton = document.createElement('div');
    removeButton.className = 'remove-wishlist';
    removeButton.innerHTML = '<i class="fas fa-times"></i>';
    
    wishlistImage.appendChild(img);
    wishlistImage.appendChild(removeButton);
    
    const wishlistInfo = document.createElement('div');
    wishlistInfo.className = 'wishlist-info';
    
    const wishlistName = document.createElement('h3');
    wishlistName.textContent = item.name;
    
    const wishlistPrice = document.createElement('div');
    wishlistPrice.className = 'wishlist-price';
    wishlistPrice.textContent = `₺${item.price.toLocaleString('tr-TR')}`;
    
    const addToCartButton = document.createElement('button');
    addToCartButton.className = 'add-to-cart-button';
    addToCartButton.textContent = 'Sepete Ekle';
    
    wishlistInfo.appendChild(wishlistName);
    wishlistInfo.appendChild(wishlistPrice);
    wishlistInfo.appendChild(addToCartButton);
    
    wishlistElement.appendChild(wishlistImage);
    wishlistElement.appendChild(wishlistInfo);
    
    // Add event listeners
    removeButton.addEventListener('click', function() {
        // In a real application, this would remove the item from the wishlist
        // For this example, we'll just show a notification
        showNotification(`"${item.name}" favorilerden çıkarıldı`, 'success');
        wishlistElement.remove();
    });
    
    addToCartButton.addEventListener('click', function() {
        // In a real application, this would add the item to the cart
        // For this example, we'll just show a notification
        showNotification(`"${item.name}" sepete eklendi`, 'success');
    });
    
    return wishlistElement;
}

// Show notification
function showNotification(message, type) {
    // Check if notification function exists in script.js
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
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
} 