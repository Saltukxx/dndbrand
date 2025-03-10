/**
 * D&D Brand E-commerce - Components Script
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
        
        console.log('Is checkout page:', isCheckoutPage);
        console.log('Current path:', window.location.pathname);
        
        // Use simplified header for checkout page
        if (isCheckoutPage) {
            const checkoutHeaderHTML = `
            <header>
                <div class="container">
                    <div class="logo">
                        <a href="index.html">
                            <img src="../images/WhatsApp_Image_2025-03-04_at_01.39.12_65330df1-removebg-preview.png" alt="D&D Brand Logo" class="logo-image">
                            <h1>D&D <span>Brand</span></h1>
                        </a>
                    </div>
                    <div class="checkout-steps">
                        <div class="step active">
                            <span class="step-number">1</span>
                            <span class="step-name">Sepet</span>
                        </div>
                        <div class="step active">
                            <span class="step-number">2</span>
                            <span class="step-name">Teslimat</span>
                        </div>
                        <div class="step">
                            <span class="step-number">3</span>
                            <span class="step-name">Ödeme</span>
                        </div>
                        <div class="step">
                            <span class="step-number">4</span>
                            <span class="step-name">Onay</span>
                        </div>
                    </div>
                </div>
            </header>`;
            
            headerContainer.innerHTML = checkoutHeaderHTML;
        } else {
            // Standard header for all other pages
            const standardHeaderHTML = `
            <header>
                <div class="container">
                    <div class="logo">
                        <a href="./index.html">
                            <img src="../images/WhatsApp_Image_2025-03-04_at_01.39.12_65330df1-removebg-preview.png" alt="D&D Brand Logo" class="logo-image">
                            <h1>D&D <span>Brand</span></h1>
                        </a>
                    </div>
                    <nav>
                        <ul>
                            <li><a href="./index.html" class="nav-link">ANA SAYFA</a></li>
                            <li><a href="./shop.html" class="nav-link">KOLEKSİYON</a></li>
                            <li><a href="./about.html" class="nav-link">HAKKIMIZDA</a></li>
                            <li><a href="./contact.html" class="nav-link">İLETİŞİM</a></li>
                        </ul>
                    </nav>
                    <div class="nav-icons">
                        <a href="./search.html" class="search-icon"><i class="fas fa-search"></i></a>
                        <a href="./account.html" class="account-icon"><i class="fas fa-user"></i><span>HESABIM</span></a>
                        <a href="./cart.html" class="cart-icon">
                            <i class="fas fa-shopping-bag"></i>
                            <span>SEPET</span>
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
                                        <a href="./cart.html" class="view-cart">Sepeti Görüntüle</a>
                                        <a href="./checkout.html" class="checkout">Ödeme</a>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </header>`;
            
            headerContainer.innerHTML = standardHeaderHTML;
        }
        
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
                        <h3>D&D Brand</h3>
                        <p>Kaliteli ve şık giyim ürünleriyle tarzınızı yansıtın. D&D Brand, modern ve zamansız parçalarla gardırobunuzu yenilemeniz için burada.</p>
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
                            <li><a href="./index.html">Ana Sayfa</a></li>
                            <li><a href="./shop.html">Koleksiyon</a></li>
                            <li><a href="./about.html">Hakkımızda</a></li>
                            <li><a href="./contact.html">İletişim</a></li>
                            <li><a href="./blog.html">Blog</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-column">
                        <h3>Yardım</h3>
                        <ul>
                            <li><a href="./faq.html">Sıkça Sorulan Sorular</a></li>
                            <li><a href="./shipping.html">Kargo ve Teslimat</a></li>
                            <li><a href="./returns.html">İade ve Değişim</a></li>
                            <li><a href="./size-guide.html">Beden Rehberi</a></li>
                            <li><a href="./privacy.html">Gizlilik Politikası</a></li>
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
                    <p>&copy; 2023 D&D Brand. Tüm hakları saklıdır. | Tasarım: <a href="#">D&D Creative</a></p>
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