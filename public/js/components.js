/**
 * DnD Brand E-commerce - Components Script
 * Handles loading of common components like header and footer
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Components script loaded');
    
    // Load header and footer components
    loadHeader();
    loadFooter();
    
    // Apply additional styling after a short delay to ensure components are loaded
    setTimeout(function() {
        fixHeaderStyling();
    }, 100);
});

/**
 * Loads the header component into the header-container element
 */
async function loadHeader() {
    console.log('Loading header...');
    const headerContainer = document.getElementById('header-container');
    console.log('Header container:', headerContainer);
    
    if (!headerContainer) {
        console.error('Header container not found!');
        return;
    }
    
    try {
        // Check if we're on the checkout page
        const isCheckoutPage = window.location.pathname.includes('checkout.html');
        // Check if we're on the account page
        const isAccountPage = window.location.pathname.includes('account.html');
        
        console.log('Is checkout page:', isCheckoutPage);
        console.log('Is account page:', isAccountPage);
        console.log('Current path:', window.location.pathname);
        
        // Special header for account page to prevent overlay issues
        if (isAccountPage) {
            const accountHeaderHTML = `
            <div class="account-page-header" style="
                background-color: #121212; 
                padding: 20px 0; 
                position: relative; 
                z-index: 100; 
                width: 100%;
                display: block;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            ">
                <div class="container" style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 90%;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 15px;
                ">
                    <div class="logo" style="
                        display: flex;
                        align-items: center;
                    ">
                        <a href="index.html" style="
                            display: flex;
                            align-items: center;
                            text-decoration: none;
                        ">
                            <img src="../images/WhatsApp_Image_2025-03-04_at_01.39.12_65330df1-removebg-preview.png" alt="DnD Brand Logo" class="logo-image" style="
                                height: 50px;
                                margin-right: 15px;
                                object-fit: contain;
                            ">
                            <h1 style="
                                font-size: 2.2rem;
                                font-weight: 700;
                                font-family: 'League Spartan', sans-serif;
                                color: #f5f5f5;
                                margin-bottom: 0;
                            ">DnD <span style="color: var(--secondary-color);">Brand</span></h1>
                        </a>
                    </div>
                    <nav style="
                        display: block;
                    ">
                        <ul style="
                            display: flex;
                            list-style: none;
                            margin: 0;
                            padding: 0;
                        ">
                            <li style="margin: 0 15px;"><a href="index.html" style="
                                font-size: 16px;
                                font-weight: 600;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                position: relative;
                                padding: 5px 0;
                                font-family: 'League Spartan', sans-serif;
                                color: #f5f5f5;
                                text-decoration: none;
                            ">Ana Sayfa</a></li>
                            <li style="margin: 0 15px;"><a href="shop.html" style="
                                font-size: 16px;
                                font-weight: 600;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                position: relative;
                                padding: 5px 0;
                                font-family: 'League Spartan', sans-serif;
                                color: #f5f5f5;
                                text-decoration: none;
                            ">Koleksiyon</a></li>
                            <li style="margin: 0 15px;"><a href="about.html" style="
                                font-size: 16px;
                                font-weight: 600;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                position: relative;
                                padding: 5px 0;
                                font-family: 'League Spartan', sans-serif;
                                color: #f5f5f5;
                                text-decoration: none;
                            ">Hakkımızda</a></li>
                            <li style="margin: 0 15px;"><a href="contact.html" style="
                                font-size: 16px;
                                font-weight: 600;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                position: relative;
                                padding: 5px 0;
                                font-family: 'League Spartan', sans-serif;
                                color: #f5f5f5;
                                text-decoration: none;
                            ">İletişim</a></li>
                        </ul>
                    </nav>
                    <div class="nav-icons" style="
                        display: flex;
                        align-items: center;
                    ">
                        <a href="search.html" class="search-icon" style="
                            margin-left: 20px;
                            font-size: 18px;
                            position: relative;
                            color: #f5f5f5;
                            text-decoration: none;
                        "><i class="fas fa-search"></i></a>
                        <a href="account.html" class="account-icon" style="
                            margin-left: 20px;
                            font-size: 18px;
                            position: relative;
                            color: #f5f5f5;
                            text-decoration: none;
                        "><i class="fas fa-user"></i></a>
                        <div class="cart-icon" style="
                            margin-left: 20px;
                            font-size: 18px;
                            position: relative;
                            color: #f5f5f5;
                            cursor: pointer;
                        ">
                            <i class="fas fa-shopping-bag"></i>
                            <span class="cart-label" style="margin-left: 5px;">Sepet</span>
                            <span class="cart-count" style="
                                position: absolute;
                                top: -8px;
                                right: -8px;
                                background-color: var(--secondary-color);
                                color: white;
                                font-size: 10px;
                                width: 18px;
                                height: 18px;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">0</span>
                        </div>
                    </div>
                    <div class="mobile-menu-btn" style="
                        display: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #f5f5f5;
                    ">
                        <i class="fas fa-bars"></i>
                    </div>
                </div>
            </div>
            `;
            
            // Set the HTML content
            headerContainer.innerHTML = accountHeaderHTML;
            console.log('Account header loaded successfully');
            
            // No need to fix styling as we've applied inline styles
            
            // Initialize header functionality
            initializeHeader();
            
            return;
        }
        
        // Create header HTML - simplified version for checkout page
        const headerHTML = isCheckoutPage ? `
        <header>
            <div class="container">
                <div class="logo">
                    <a href="index.html">
                        <img src="../images/WhatsApp_Image_2025-03-04_at_01.39.12_65330df1-removebg-preview.png" alt="DnD Brand Logo" class="logo-image">
                        <h1>DnD <span>Brand</span></h1>
                    </a>
                </div>
                <div class="checkout-header-right">
                    <div class="secure-checkout-badge">
                        <i class="fas fa-lock"></i> Güvenli Ödeme
                    </div>
                </div>
            </div>
        </header>
        ` : `
        <header>
            <div class="container">
                <div class="logo">
                    <a href="index.html">
                        <img src="../images/WhatsApp_Image_2025-03-04_at_01.39.12_65330df1-removebg-preview.png" alt="DnD Brand Logo" class="logo-image">
                        <h1>DnD <span>Brand</span></h1>
                    </a>
                </div>
                <nav>
                    <ul>
                        <li><a href="index.html">Ana Sayfa</a></li>
                        <li><a href="shop.html">Koleksiyon</a></li>
                        <li><a href="about.html">Hakkımızda</a></li>
                        <li><a href="contact.html">İletişim</a></li>
                    </ul>
                </nav>
                <div class="nav-icons">
                    <a href="search.html" class="search-icon"><i class="fas fa-search"></i></a>
                    <a href="account.html" class="account-icon"><i class="fas fa-user"></i></a>
                    <div class="cart-icon">
                        <i class="fas fa-shopping-bag"></i>
                        <span class="cart-label">Sepet</span>
                        <span class="cart-count">0</span>
                        
                        <div class="cart-preview">
                            <div class="cart-preview-header">
                                <h3>Sepetiniz</h3>
                                <span class="cart-preview-count">0 Ürün</span>
                            </div>
                            <div class="cart-preview-items">
                                <!-- Cart items will be added here by JavaScript -->
                                <div class="empty-cart-message">Sepetiniz boş</div>
                            </div>
                            <div class="cart-preview-footer">
                                <div class="cart-preview-total">
                                    <span>Toplam:</span>
                                    <span class="cart-preview-total-price">₺0.00</span>
                                </div>
                                <div class="cart-preview-actions">
                                    <a href="cart.html" class="view-cart">Sepeti Görüntüle</a>
                                    <a href="checkout.html" class="checkout">Ödeme</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mobile-menu-btn">
                    <i class="fas fa-bars"></i>
                </div>
            </div>
        </header>
        `;
        
        // Set the HTML content
        headerContainer.innerHTML = headerHTML;
        console.log('Header loaded successfully');
        
        // Fix header styling immediately after loading
        fixHeaderStyling();
        
        // Initialize header functionality
        initializeHeader();
    } catch (error) {
        console.error('Error loading header:', error);
    }
}

/**
 * Fixes header styling issues
 */
function fixHeaderStyling() {
    console.log('Fixing header styling...');
    const header = document.querySelector('header');
    if (header) {
        // Check if we're on the account page or checkout page
        const isAccountPage = window.location.pathname.includes('account.html');
        const isCheckoutPage = window.location.pathname.includes('checkout.html');
        
        if (isAccountPage) {
            console.log('Applying account page header styles');
            header.style.position = 'relative';
            header.style.top = 'auto';
            header.style.left = 'auto';
            header.style.width = '100%';
            header.style.zIndex = '10';
            header.style.backgroundColor = 'rgba(15, 15, 15, 0.9)';
            
            // Force the header to be visible
            header.style.display = 'block';
            header.style.visibility = 'visible';
            header.style.opacity = '1';
            
            // Add a class for additional CSS targeting
            header.classList.add('account-header');
            
            // Ensure the container is properly styled
            const container = header.querySelector('.container');
            if (container) {
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.justifyContent = 'space-between';
            }
        } else if (isCheckoutPage) {
            console.log('Applying checkout page header styles');
            header.style.position = 'relative';
            header.style.top = 'auto';
            header.style.left = 'auto';
            header.style.width = '100%';
            header.style.zIndex = '3';
            header.style.backgroundColor = 'rgba(15, 15, 15, 0.9)';
            
            // Add a class for additional CSS targeting
            header.classList.add('checkout-header');
        }
        
        // Ensure the logo is properly styled
        const logo = header.querySelector('.logo');
        if (logo) {
            logo.style.display = 'flex';
            logo.style.alignItems = 'center';
        }
    }
}

/**
 * Initializes header functionality
 */
function initializeHeader() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const closeMenuBtn = document.querySelector('.close-menu');
    
    if (mobileMenuBtn && mobileMenu && mobileMenuOverlay && closeMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.add('active');
            mobileMenuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        closeMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            mobileMenuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        mobileMenuOverlay.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            mobileMenuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Cart preview toggle
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', function(e) {
            if (e.target.closest('.cart-preview')) {
                return;
            }
            
            this.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.cart-icon') && cartIcon.classList.contains('active')) {
                cartIcon.classList.remove('active');
            }
        });
    }
}

/**
 * Loads the footer component into the footer-container element
 */
async function loadFooter() {
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) return;
    
    try {
        // Create footer HTML
        const footerHTML = `
        <footer>
            <div class="container">
                <div class="footer-content">
                    <div class="footer-column">
                        <h3>DnD Brand</h3>
                        <p>Kaliteli ve şık giyim ürünleriyle tarzınızı yansıtın. DnD Brand, modern ve zamansız parçalarla gardırobunuzu yenilemeniz için burada.</p>
                        <div class="social-icons">
                            <a href="#"><i class="fab fa-facebook-f"></i></a>
                            <a href="#"><i class="fab fa-twitter"></i></a>
                            <a href="#"><i class="fab fa-instagram"></i></a>
                            <a href="#"><i class="fab fa-pinterest"></i></a>
                        </div>
                    </div>
                    
                    <div class="footer-column">
                        <h3>Hızlı Linkler</h3>
                        <ul>
                            <li><a href="index.html">Ana Sayfa</a></li>
                            <li><a href="shop.html">Koleksiyon</a></li>
                            <li><a href="about.html">Hakkımızda</a></li>
                            <li><a href="contact.html">İletişim</a></li>
                            <li><a href="blog.html">Blog</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-column">
                        <h3>Yardım</h3>
                        <ul>
                            <li><a href="faq.html">Sıkça Sorulan Sorular</a></li>
                            <li><a href="shipping.html">Kargo ve Teslimat</a></li>
                            <li><a href="returns.html">İade ve Değişim</a></li>
                            <li><a href="size-guide.html">Beden Rehberi</a></li>
                            <li><a href="privacy.html">Gizlilik Politikası</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-column">
                        <h3>İletişim</h3>
                        <ul>
                            <li><i class="fas fa-map-marker-alt"></i> Bağdat Caddesi No:123, Kadıköy, İstanbul</li>
                            <li><i class="fas fa-phone"></i> +90 (212) 123 45 67</li>
                            <li><i class="fas fa-envelope"></i> info@dndbrand.com</li>
                            <li><i class="fas fa-clock"></i> Pazartesi - Cumartesi: 10:00 - 20:00</li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer-bottom">
                    <p>&copy; 2023 DnD Brand. Tüm hakları saklıdır. | Tasarım: <a href="#">DnD Creative</a></p>
                </div>
            </div>
        </footer>

        <!-- WhatsApp Float Button -->
        <a href="https://wa.me/905373058528?text=Merhaba%20DnD%20Brand,%20" class="whatsapp-float pulse" target="_blank">
            <i class="fab fa-whatsapp"></i>
        </a>
        `;
        
        // Insert footer HTML
        footerContainer.innerHTML = footerHTML;
        
    } catch (error) {
        console.error('Error loading footer:', error);
    }
} 