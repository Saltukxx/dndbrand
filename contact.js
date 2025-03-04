/**
 * DnD Brand E-commerce - Contact Page Script
 * Handles contact page specific functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize map
    initializeMap();
    
    // Initialize contact form
    initializeContactForm();
    
    // Initialize FAQ accordion
    initializeFAQ();
    
    // Initialize scroll animations
    initializeScrollAnimations();
    
    // Initialize WhatsApp button animation
    initializeWhatsAppButton();
});

/**
 * Initialize Leaflet map
 */
function initializeMap() {
    const mapElement = document.getElementById('map');
    
    if (mapElement) {
        // Istanbul coordinates (Kadıköy)
        const lat = 40.9917;
        const lng = 29.0320;
        
        // Create map
        const map = L.map('map').setView([lat, lng], 15);
        
        // Add dark theme map tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);
        
        // Custom marker icon
        const customIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        
        // Add marker
        const marker = L.marker([lat, lng], {icon: customIcon}).addTo(map);
        
        // Add popup
        marker.bindPopup("<strong>DnD Brand</strong><br>Bağdat Caddesi No: 123<br>Kadıköy, İstanbul").openPopup();
    }
}

/**
 * Initialize contact form with validation and submission
 */
function initializeContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const formValues = Object.fromEntries(formData.entries());
            
            // Validate form
            if (validateForm(formValues)) {
                // Simulate form submission
                submitForm(formValues);
            }
        });
    }
}

/**
 * Validate form fields
 * @param {Object} formData - Form data object
 * @returns {Boolean} - Validation result
 */
function validateForm(formData) {
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Reset previous error messages
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(el => el.remove());
    
    // Validate name
    if (!formData.name || formData.name.trim() === '') {
        showError('name', 'Lütfen adınızı ve soyadınızı giriniz');
        isValid = false;
    }
    
    // Validate email
    if (!formData.email || !emailRegex.test(formData.email)) {
        showError('email', 'Lütfen geçerli bir e-posta adresi giriniz');
        isValid = false;
    }
    
    // Validate message
    if (!formData.message || formData.message.trim() === '') {
        showError('message', 'Lütfen mesajınızı giriniz');
        isValid = false;
    }
    
    // Validate privacy checkbox
    if (!formData.privacy) {
        showError('privacy', 'Devam etmek için onaylamanız gerekmektedir');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Show error message for a form field
 * @param {String} fieldId - Field ID
 * @param {String} message - Error message
 */
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.textContent = message;
    errorElement.style.color = '#ff6b6b';
    errorElement.style.fontSize = '0.85rem';
    errorElement.style.marginTop = '5px';
    
    field.parentNode.appendChild(errorElement);
    field.style.borderColor = '#ff6b6b';
    
    // Remove error styling on input
    field.addEventListener('input', function() {
        field.style.borderColor = '';
        const error = field.parentNode.querySelector('.form-error');
        if (error) {
            error.remove();
        }
    });
}

/**
 * Submit form data
 * @param {Object} formData - Form data object
 */
function submitForm(formData) {
    // Show loading state
    const submitButton = document.querySelector('#contact-form button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Gönderiliyor...';
    
    // Simulate API call
    setTimeout(() => {
        // Reset form
        document.getElementById('contact-form').reset();
        
        // Show success message
        showNotification('Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.', 'success');
        
        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }, 1500);
}

/**
 * Initialize FAQ accordion functionality
 */
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close other open items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    const icon = otherItem.querySelector('.faq-toggle i');
                    icon.className = 'fas fa-plus';
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
            
            // Toggle icon
            const icon = item.querySelector('.faq-toggle i');
            if (item.classList.contains('active')) {
                icon.className = 'fas fa-minus';
            } else {
                icon.className = 'fas fa-plus';
            }
        });
    });
}

/**
 * Initialize scroll animations for page elements
 */
function initializeScrollAnimations() {
    // Elements to animate
    const elements = [
        { selector: '.contact-hero h1', animation: 'fade-in', delay: 0 },
        { selector: '.contact-hero p', animation: 'fade-in', delay: 200 },
        { selector: '.contact-card', animation: 'fade-in', delay: 100, stagger: true },
        { selector: '.form-container', animation: 'slide-in-left', delay: 0 },
        { selector: '.map-container', animation: 'slide-in-right', delay: 0 },
        { selector: '.faq-section h2', animation: 'fade-in', delay: 0 },
        { selector: '.faq-item', animation: 'fade-in', delay: 100, stagger: true }
    ];
    
    // Add animation classes
    elements.forEach(item => {
        const elems = document.querySelectorAll(item.selector);
        
        elems.forEach((el, index) => {
            el.classList.add(item.animation);
            
            // Add delay for staggered animations
            if (item.stagger) {
                el.style.transitionDelay = `${item.delay + (index * 100)}ms`;
            } else {
                el.style.transitionDelay = `${item.delay}ms`;
            }
        });
    });
    
    // Function to check if element is in viewport
    const isInViewport = (el) => {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85 &&
            rect.bottom >= 0
        );
    };
    
    // Function to handle scroll animations
    const handleScrollAnimations = () => {
        const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
        
        animatedElements.forEach(el => {
            if (isInViewport(el)) {
                el.classList.add('active');
            }
        });
    };
    
    // Initial check
    handleScrollAnimations();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScrollAnimations);
}

/**
 * Show notification message
 * @param {String} message - Notification message
 * @param {String} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'info') {
    // Check if notification container exists
    let notificationContainer = document.querySelector('.notification-container');
    
    // Create container if it doesn't exist
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        </div>
        <div class="notification-content">
            <p>${message}</p>
        </div>
        <div class="notification-close">
            <i class="fas fa-times"></i>
        </div>
    `;
    
    // Style notification
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.background = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
    notification.style.color = '#fff';
    notification.style.padding = '15px';
    notification.style.borderRadius = '5px';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.transform = 'translateX(120%)';
    notification.style.transition = 'transform 0.3s ease';
    
    // Add notification to container
    notificationContainer.appendChild(notification);
    
    // Animate notification
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.marginLeft = '10px';
    
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(120%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 5000);
}

/**
 * Initialize WhatsApp button animation
 */
function initializeWhatsAppButton() {
    const whatsappFloat = document.querySelector('.whatsapp-float');
    
    if (whatsappFloat) {
        // Show tooltip initially
        whatsappFloat.classList.add('show-tooltip');
        
        // Hide tooltip after 5 seconds
        setTimeout(() => {
            whatsappFloat.classList.remove('show-tooltip');
        }, 5000);
        
        // Make button always visible
        whatsappFloat.style.opacity = '1';
        whatsappFloat.style.transform = 'scale(1)';
    }
} 