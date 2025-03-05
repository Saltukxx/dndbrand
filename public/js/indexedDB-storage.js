const dbName = 'dndBrandDB';
const storeName = 'products';
const version = 1;

// Open database
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    
    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = e => resolve(e.target.result);
    request.onerror = e => reject(e.target.error);
  });
}

// Save products to IndexedDB
async function saveProductsToIndexedDB(products) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  // Clear existing products
  store.clear();
  
  // Add new products
  products.forEach(product => {
    store.add(product);
  });
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = e => reject(e.target.error);
  });
}

// Get products from IndexedDB
async function getProductsFromIndexedDB() {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = e => reject(e.target.error);
  });
} 