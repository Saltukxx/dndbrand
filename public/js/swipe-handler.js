/**
 * Banner Swipe Handler
 * Enables swipe functionality for banner sliders on both desktop and mobile
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeBannerSwipe();
});

function initializeBannerSwipe() {
    const bannerSliders = document.querySelectorAll('.banner-slider');
    
    bannerSliders.forEach(slider => {
        // Get all slides and dots
        const slides = slider.querySelectorAll('.banner-slide');
        const dots = slider.querySelectorAll('.banner-dot');
        
        if (slides.length <= 1) return; // No need for swipe with only one slide
        
        // Variables to track touch/mouse events
        let startX, moveX, currentIndex = 0;
        let isDragging = false;
        
        // Show the first slide
        showSlide(currentIndex);
        
        // Add event listeners for touch devices
        slider.addEventListener('touchstart', handleTouchStart, { passive: true });
        slider.addEventListener('touchmove', handleTouchMove, { passive: true });
        slider.addEventListener('touchend', handleTouchEnd);
        
        // Add event listeners for desktop
        slider.addEventListener('mousedown', handleMouseDown);
        slider.addEventListener('mousemove', handleMouseMove);
        slider.addEventListener('mouseup', handleMouseUp);
        slider.addEventListener('mouseleave', handleMouseUp);
        
        // Add event listeners for dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentIndex = index;
                showSlide(currentIndex);
            });
        });
        
        // Touch event handlers
        function handleTouchStart(e) {
            startX = e.touches[0].clientX;
            isDragging = true;
        }
        
        function handleTouchMove(e) {
            if (!isDragging) return;
            moveX = e.touches[0].clientX;
        }
        
        function handleTouchEnd() {
            if (!isDragging) return;
            
            const diffX = startX - moveX;
            
            // If significant swipe detected (more than 50px)
            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - next slide
                    currentIndex = (currentIndex + 1) % slides.length;
                } else {
                    // Swipe right - previous slide
                    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
                }
                
                showSlide(currentIndex);
            }
            
            isDragging = false;
        }
        
        // Mouse event handlers
        function handleMouseDown(e) {
            e.preventDefault();
            startX = e.clientX;
            isDragging = true;
            slider.style.cursor = 'grabbing';
        }
        
        function handleMouseMove(e) {
            if (!isDragging) return;
            moveX = e.clientX;
        }
        
        function handleMouseUp() {
            if (!isDragging) return;
            
            const diffX = startX - moveX;
            
            // If significant swipe detected (more than 50px)
            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - next slide
                    currentIndex = (currentIndex + 1) % slides.length;
                } else {
                    // Swipe right - previous slide
                    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
                }
                
                showSlide(currentIndex);
            }
            
            isDragging = false;
            slider.style.cursor = 'grab';
        }
        
        // Show slide and update active dot
        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
                slide.style.display = i === index ? 'block' : 'none';
            });
            
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }
        
        // Auto-rotate slides every 5 seconds
        setInterval(() => {
            if (!isDragging) { // Don't auto-advance during user interaction
                currentIndex = (currentIndex + 1) % slides.length;
                showSlide(currentIndex);
            }
        }, 5000);
    });
    
    // Mobile specific handling for horizontal scroll sliders
    const mobileSliders = document.querySelectorAll('.mobile-banner-slider');
    
    mobileSliders.forEach(slider => {
        const slides = slider.querySelectorAll('.banner-slide');
        const dots = document.querySelectorAll('.banner-dot');
        
        if (slides.length <= 1) return;
        
        // Update dots on scroll
        slider.addEventListener('scroll', () => {
            const scrollPosition = slider.scrollLeft;
            const slideWidth = slides[0].offsetWidth;
            
            // Calculate which slide is most visible
            const index = Math.round(scrollPosition / slideWidth);
            
            // Update active dot
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        });
        
        // Add click events to dots for mobile
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                const slideWidth = slides[0].offsetWidth;
                slider.scrollTo({
                    left: index * slideWidth,
                    behavior: 'smooth'
                });
            });
        });
    });
} 