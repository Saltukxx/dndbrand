/**
 * D&D Brand E-commerce - Storage Manager
 * Handles product data storage with export/import functionality
 */

class StorageManager {
  constructor() {
    this.localStorageKey = 'dndProducts';
    this.lastSyncKey = 'dndLastSync';
  }
  
  // Save products locally
  saveProducts(products) {
    localStorage.setItem(this.localStorageKey, JSON.stringify(products));
    localStorage.setItem(this.lastSyncKey, new Date().toISOString());
    return products;
  }
  
  // Get products from local storage
  getProducts() {
    const products = localStorage.getItem(this.localStorageKey);
    return products ? JSON.parse(products) : [];
  }
  
  // Export products to JSON file
  exportProducts() {
    const products = this.getProducts();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "dnd-products.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    return true;
  }
  
  // Import products from JSON file
  importProducts() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = event => {
          try {
            const products = JSON.parse(event.target.result);
            this.saveProducts(products);
            resolve(products);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.readAsText(file);
      };
      
      input.click();
    });
  }
  
  // Add a single product
  addProduct(product) {
    const products = this.getProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);
    
    if (existingIndex !== -1) {
      // Update existing product
      products[existingIndex] = product;
    } else {
      // Add new product
      products.push(product);
    }
    
    return this.saveProducts(products);
  }
  
  // Delete a product
  deleteProduct(productId) {
    const products = this.getProducts();
    const updatedProducts = products.filter(p => p.id !== productId);
    return this.saveProducts(updatedProducts);
  }
  
  // Get last sync time
  getLastSyncTime() {
    return localStorage.getItem(this.lastSyncKey);
  }
}

// Create and export instance
const storageManager = new StorageManager(); 