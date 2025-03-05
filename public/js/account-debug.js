/**
 * Debug script for account page
 */

console.log('Account debug script loaded');

// Check localStorage
console.log('localStorage contents:', localStorage);

// Check if user is logged in
const user = JSON.parse(localStorage.getItem('user') || 'null');
console.log('User:', user);

// Check DOM elements
console.log('Header container:', document.getElementById('header-container'));
console.log('Account section:', document.querySelector('.account-section'));
console.log('Auth forms:', document.getElementById('auth-forms'));
console.log('Account logged:', document.querySelector('.account-logged'));

/**
 * Emergency fix for header overlay issues
 * This function applies aggressive styling to fix z-index and positioning issues
 */
const emergencyFix = function() {
    console.log('Applying emergency fixes');
    
    // Don't modify the header since we're now using a completely different header with inline styles
    
    // Make sure account section is visible and has proper z-index
    const accountSection = document.querySelector('.account-section');
    if (accountSection) {
        accountSection.style.position = 'relative';
        accountSection.style.zIndex = '20';
        accountSection.style.marginTop = '0';
        accountSection.style.flex = '1';
        console.log('Fixed account section');
    }
    
    // Make sure all images don't overlay incorrectly
    const images = document.querySelectorAll('img:not(.logo-image)');
    images.forEach(img => {
        img.style.position = 'relative';
        img.style.zIndex = '1';
    });
    console.log('Fixed images');
    
    // Make sure debug buttons are visible
    const debugButtons = document.getElementById('debug-buttons');
    if (debugButtons) {
        debugButtons.style.position = 'fixed';
        debugButtons.style.bottom = '20px';
        debugButtons.style.right = '20px';
        debugButtons.style.zIndex = '9999';
    }
    
    console.log('Emergency fixes applied');
};

// Apply emergency fixes when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, applying emergency fixes');
    setTimeout(emergencyFix, 500); // Delay to ensure all components are loaded
});

/**
 * Function to manually set the user login state for testing
 * @param {boolean} isLoggedIn - Whether to set the user as logged in or out
 */
function setLoginState(isLoggedIn) {
    if (isLoggedIn) {
        // Set user data in localStorage
        const testUser = {
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
            phone: '555-123-4567',
            birthDate: '01/01/1990'
        };
        
        localStorage.setItem('user', JSON.stringify(testUser));
        localStorage.setItem('token', 'test-token-12345');
        
        console.log('Set user as logged in:', testUser);
        
        // Reload the page to apply changes
        window.location.reload();
    } else {
        // Remove user data from localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        console.log('Set user as logged out');
        
        // Reload the page to apply changes
        window.location.reload();
    }
}

// Create testing interface
document.addEventListener('DOMContentLoaded', function() {
    // Create debug buttons container if it doesn't exist
    let debugButtons = document.getElementById('debug-buttons');
    
    if (!debugButtons) {
        debugButtons = document.createElement('div');
        debugButtons.id = 'debug-buttons';
        debugButtons.style.position = 'fixed';
        debugButtons.style.bottom = '20px';
        debugButtons.style.right = '20px';
        debugButtons.style.zIndex = '9999';
        debugButtons.style.display = 'flex';
        debugButtons.style.flexDirection = 'column';
        debugButtons.style.gap = '10px';
        document.body.appendChild(debugButtons);
    }
    
    // Create login button
    const loginButton = document.createElement('button');
    loginButton.textContent = 'Set Logged In';
    loginButton.style.padding = '10px 15px';
    loginButton.style.backgroundColor = '#4CAF50';
    loginButton.style.color = 'white';
    loginButton.style.border = 'none';
    loginButton.style.borderRadius = '4px';
    loginButton.style.cursor = 'pointer';
    loginButton.style.fontWeight = 'bold';
    loginButton.addEventListener('click', function() {
        setLoginState(true);
    });
    
    // Create logout button
    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Set Logged Out';
    logoutButton.style.padding = '10px 15px';
    logoutButton.style.backgroundColor = '#f44336';
    logoutButton.style.color = 'white';
    logoutButton.style.border = 'none';
    logoutButton.style.borderRadius = '4px';
    logoutButton.style.cursor = 'pointer';
    logoutButton.style.fontWeight = 'bold';
    logoutButton.addEventListener('click', function() {
        setLoginState(false);
    });
    
    // Add buttons to container
    debugButtons.appendChild(loginButton);
    debugButtons.appendChild(logoutButton);
    
    console.log('Debug buttons added');
}); 