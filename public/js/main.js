// Add animation observer to handle fade-in effects
document.addEventListener('DOMContentLoaded', function() {
    // Enable animations
    const animateElements = document.querySelectorAll('.fade-in');
    
    if ('IntersectionObserver' in window) {
        const animationObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Reset the animation to make it run
                    const element = entry.target;
                    element.style.animationName = 'none';
                    element.offsetHeight; // Trigger reflow
                    element.style.animationName = '';
                    
                    // Stop observing after animation is triggered
                    observer.unobserve(element);
                }
            });
        }, {
            threshold: 0.1 // Trigger when at least 10% of the element is visible
        });
        
        animateElements.forEach(element => {
            animationObserver.observe(element);
        });
    } else {
        // Fallback for browsers that don't support Intersection Observer
        animateElements.forEach(element => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navbarItems = document.querySelector('.navbar-items');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navbarItems.classList.toggle('active');
        });
    }
    
    // ... existing code ...
}); 