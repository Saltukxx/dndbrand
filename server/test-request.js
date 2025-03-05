const http = require('http');

console.log('Starting test request script...');

// Test the root endpoint
console.log('Testing root endpoint...');
http.get('http://localhost:5000/', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('BODY:', data);
    
    // After testing root, test the products endpoint
    testProductsEndpoint();
  });
}).on('error', (err) => {
  console.error('Error making request to root endpoint:', err.message);
  console.error('Full error:', err);
  
  // Try with IP address instead of localhost
  console.log('Trying with IP address 127.0.0.1 instead of localhost...');
  http.get('http://127.0.0.1:5000/', (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('BODY:', data);
      testProductsEndpoint('127.0.0.1');
    });
  }).on('error', (err) => {
    console.error('Error making request to 127.0.0.1:', err.message);
  });
});

function testProductsEndpoint(host = 'localhost') {
  console.log(`Testing products endpoint using ${host}...`);
  http.get(`http://${host}:5000/api/products`, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const products = JSON.parse(data);
        console.log(`Found ${products.length} products`);
        if (products.length > 0) {
          console.log('First product:', products[0].name);
        }
      } catch (e) {
        console.error('Error parsing JSON:', e.message);
        console.log('Raw data:', data);
      }
    });
  }).on('error', (err) => {
    console.error(`Error making request to products endpoint using ${host}:`, err.message);
  });
} 