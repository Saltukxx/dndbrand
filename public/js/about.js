/**
 * D&D Brand E-commerce - About Page Functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize contact form
    initializeContactForm();
    
    // Initialize animations
    initializeAnimations();
});

// Initialize contact form
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            // In a real application, this would send the data to a server
            console.log('Form submitted:', { name, email, subject, message });
            
            // Show success message
            showNotification('Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.', 'success');
            
            // Reset form
            contactForm.reset();
        });
    }
}

// Initialize animations
function initializeAnimations() {
    // Animate elements when they come into view
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.about-content, .value-item, .shipping-content, .social-item, .contact-item');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (elementPosition < screenPosition) {
                element.classList.add('animate');
            }
        });
    };
    
    // Add animation classes
    const style = document.createElement('style');
    style.textContent = `
        .about-content, .value-item, .shipping-content, .social-item, .contact-item {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .about-content.animate, .value-item.animate, .shipping-content.animate, .social-item.animate, .contact-item.animate {
            opacity: 1;
            transform: translateY(0);
        }
        
        .value-item:nth-child(1), .social-item:nth-child(1), .contact-item:nth-child(1) {
            transition-delay: 0.1s;
        }
        
        .value-item:nth-child(2), .social-item:nth-child(2), .contact-item:nth-child(2) {
            transition-delay: 0.2s;
        }
        
        .value-item:nth-child(3), .social-item:nth-child(3), .contact-item:nth-child(3) {
            transition-delay: 0.3s;
        }
        
        .value-item:nth-child(4), .social-item:nth-child(4), .contact-item:nth-child(4) {
            transition-delay: 0.4s;
        }
    `;
    document.head.appendChild(style);
    
    // Run on load
    animateOnScroll();
    
    // Run on scroll
    window.addEventListener('scroll', animateOnScroll);
} 