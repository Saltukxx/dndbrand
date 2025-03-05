const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  databaseURL: "https://your-app.firebaseio.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Save products to Firebase
function saveProductsToFirebase(products) {
  return db.ref('products').set(products);
}

// Get products from Firebase
function getProductsFromFirebase() {
  return db.ref('products').once('value').then(snapshot => {
    return snapshot.val() || [];
  });
} 