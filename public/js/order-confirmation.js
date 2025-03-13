// DOM Elements
const orderNumberElement = document.getElementById('order-number');
const orderDateElement = document.getElementById('order-date');
const paymentMethodElement = document.getElementById('payment-method');
const orderStatusElement = document.getElementById('order-status');
const shippingAddressElement = document.getElementById('shipping-address');
const billingAddressElement = document.getElementById('billing-address');
const orderItemsContainer = document.getElementById('order-items-container');
const subtotalElement = document.getElementById('subtotal');
const taxElement = document.getElementById('tax');
const shippingElement = document.getElementById('shipping');
const totalElement = document.getElementById('total');

// State
let order = null;

// Get API URL from config
let apiBaseUrl = '/api';
if (window.CONFIG) {
    if (window.CONFIG.API_BASE_URL) {
        apiBaseUrl = `${window.CONFIG.API_BASE_URL}/api`;
        console.log('Using API_BASE_URL from config.js:', apiBaseUrl);
    } else if (window.CONFIG.API_URL) {
        apiBaseUrl = window.CONFIG.API_URL;
        console.log('Using legacy API_URL from config.js:', apiBaseUrl);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Order confirmation page initialized');
    
    // Load header and footer
    await loadComponents();
    
    // Get order ID from URL
    const orderId = getOrderIdFromUrl();
    
    if (!orderId) {
        showError('Order ID not found in URL');
        return;
    }
    
    // Load order details
    await loadOrderDetails(orderId);
});

// Load header and footer components
async function loadComponents() {
    try {
        // Load header
        const headerResponse = await fetch('../html/header-template.html');
        const headerHtml = await headerResponse.text();
        document.getElementById('header-container').innerHTML = headerHtml;
        
        // Initialize header functionality if needed
        if (typeof initializeHeader === 'function') {
            initializeHeader();
        }
        
        // Load footer (assuming you have a footer component)
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            const footerResponse = await fetch('../html/footer-template.html');
            const footerHtml = await footerResponse.text();
            footerContainer.innerHTML = footerHtml;
        }
    } catch (error) {
        console.error('Error loading components:', error);
    }
}

// Get order ID from URL query parameters
function getOrderIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('orderId');
}

// Load order details from the server
async function loadOrderDetails(orderId) {
    try {
        // Show loading state
        showLoading(true);
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
            window.location.href = 'login.html?redirect=order-confirmation.html?orderId=' + orderId;
            return;
        }
        
        // Fetch order details from API
        const response = await fetch(`${apiBaseUrl}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }
        
        const data = await response.json();
        order = data.data;
        
        // Render order details
        renderOrderDetails();
        
        // Hide loading state
        showLoading(false);
    } catch (error) {
        console.error('Error loading order details:', error);
        showError('Failed to load order details. Please try again later.');
        showLoading(false);
    }
}

// Render order details on the page
function renderOrderDetails() {
    if (!order) return;
    
    // Basic order info
    orderNumberElement.textContent = order.orderNumber;
    orderDateElement.textContent = formatDate(order.createdAt);
    paymentMethodElement.textContent = formatPaymentMethod(order.paymentMethod);
    orderStatusElement.textContent = formatOrderStatus(order.orderStatus);
    
    // Addresses
    shippingAddressElement.innerHTML = formatAddress(order.shippingAddress);
    billingAddressElement.innerHTML = formatAddress(order.billingAddress);
    
    // Order items
    renderOrderItems();
    
    // Order summary
    subtotalElement.textContent = formatPrice(order.subtotal);
    taxElement.textContent = formatPrice(order.tax);
    shippingElement.textContent = formatPrice(order.shippingCost);
    totalElement.textContent = formatPrice(order.total);
}

// Render order items
function renderOrderItems() {
    if (!order || !order.items || !order.items.length) {
        orderItemsContainer.innerHTML = '<p>No items found in this order.</p>';
        return;
    }
    
    // Clear loading spinner
    orderItemsContainer.innerHTML = '';
    
    // Create HTML for each item
    order.items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        
        const imageUrl = item.image || '../images/placeholder.jpg';
        
        itemElement.innerHTML = `
            <img src="${imageUrl}" alt="${item.name}" class="item-image">
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                ${item.variant ? `<div class="item-variant">Variant: ${item.variant}</div>` : ''}
                <div class="item-price">${formatPrice(item.price)}</div>
            </div>
            <div class="item-quantity">Quantity: ${item.quantity}</div>
        `;
        
        orderItemsContainer.appendChild(itemElement);
    });
}

// Format address for display
function formatAddress(address) {
    if (!address) return 'Address not available';
    
    return `
        <p>${address.street}</p>
        <p>${address.city}, ${address.state} ${address.postalCode}</p>
        <p>${address.country}</p>
    `;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format payment method for display
function formatPaymentMethod(method) {
    const methods = {
        'credit_card': 'Kredi Kartı',
        'bank_transfer': 'Banka Havalesi',
        'cash_on_delivery': 'Kapıda Ödeme'
    };
    
    return methods[method] || method;
}

// Format order status for display
function formatOrderStatus(status) {
    const statuses = {
        'pending': 'Beklemede',
        'processing': 'İşleniyor',
        'shipped': 'Kargoya Verildi',
        'delivered': 'Teslim Edildi',
        'cancelled': 'İptal Edildi'
    };
    
    return statuses[status] || status;
}

// Format price for display
function formatPrice(price) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(price);
}

// Show/hide loading state
function showLoading(isLoading) {
    // Implement loading state if needed
    // For now, we're using the loading text in the HTML
}

// Show error message
function showError(message) {
    // You can implement a more sophisticated error display
    alert(message);
} 