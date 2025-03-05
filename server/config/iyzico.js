const Iyzipay = require('iyzipay');

// Check if required environment variables are set
const apiKey = process.env.IYZICO_API_KEY || 'dummy_api_key';
const secretKey = process.env.IYZICO_SECRET_KEY || 'dummy_secret_key';

// Initialize Iyzipay configuration
let iyzipay;

try {
  iyzipay = new Iyzipay({
    apiKey: apiKey,
    secretKey: secretKey,
    uri: process.env.NODE_ENV === 'production' 
      ? 'https://api.iyzipay.com' 
      : 'https://sandbox-api.iyzipay.com'
  });
  
  console.log('Iyzipay payment integration initialized');
} catch (error) {
  console.warn('Warning: Iyzipay initialization failed:', error.message);
  console.warn('Payment functionality will be limited');
  
  // Create a dummy iyzipay object with methods that return errors
  iyzipay = {
    payment: {
      create: (data, callback) => {
        callback(new Error('Iyzipay not properly configured'), null);
      }
    },
    checkoutForm: {
      retrieve: (data, callback) => {
        callback(new Error('Iyzipay not properly configured'), null);
      }
    }
  };
}

module.exports = iyzipay; 