const crypto = require('crypto-js');

/**
 * Generate a unique conversation ID for Iyzico transactions
 * @returns {string} Unique conversation ID
 */
const generateConversationId = () => {
  return `DND_${Date.now()}_${crypto.lib.WordArray.random(8).toString()}`;
};

/**
 * Format price for Iyzico (convert to string with 2 decimal places)
 * @param {number} price - Price to format
 * @returns {string} Formatted price
 */
const formatPrice = (price) => {
  return price.toFixed(2);
};

/**
 * Create basket items array for Iyzico
 * @param {Array} orderItems - Order items from the database
 * @returns {Array} Formatted basket items for Iyzico
 */
const createBasketItems = (orderItems) => {
  return orderItems.map((item, index) => ({
    id: item.product.toString(),
    name: item.name,
    category1: 'DND Brand Products',
    itemType: 'PHYSICAL',
    price: formatPrice(item.price * item.quantity)
  }));
};

/**
 * Create buyer info object for Iyzico
 * @param {Object} customer - Customer from the database
 * @param {Object} billingAddress - Billing address from the order
 * @returns {Object} Formatted buyer info for Iyzico
 */
const createBuyerInfo = (customer, billingAddress) => {
  return {
    id: customer._id.toString(),
    name: customer.firstName,
    surname: customer.lastName,
    gsmNumber: customer.phone || '+905000000000',
    email: customer.email,
    identityNumber: '11111111111', // Required by Iyzico, use a placeholder
    registrationAddress: `${billingAddress.street}, ${billingAddress.city}, ${billingAddress.state}`,
    city: billingAddress.city,
    country: billingAddress.country,
    zipCode: billingAddress.postalCode
  };
};

/**
 * Create shipping and billing address objects for Iyzico
 * @param {Object} address - Address from the order
 * @param {Object} customer - Customer from the database
 * @param {string} addressType - Type of address ('shipping' or 'billing')
 * @returns {Object} Formatted address for Iyzico
 */
const createAddressInfo = (address, customer, addressType) => {
  return {
    address: `${address.street}, ${address.city}, ${address.state}`,
    zipCode: address.postalCode,
    contactName: `${customer.firstName} ${customer.lastName}`,
    city: address.city,
    country: address.country
  };
};

/**
 * Validate callback hash from Iyzico to prevent tampering
 * @param {Object} params - Parameters from Iyzico callback
 * @param {string} secretKey - Iyzico secret key
 * @returns {boolean} Whether the hash is valid
 */
const validateIyzicoCallback = (params, secretKey) => {
  if (!params.paymentId || !params.conversationId || !params.status || !params.conversationData || !params.hash) {
    return false;
  }

  // Create hash with the same algorithm as Iyzico
  const hashStr = `${params.paymentId}${params.conversationId}${params.status}${params.conversationData}${secretKey}`;
  const hash = crypto.HmacSHA256(hashStr, secretKey).toString(crypto.enc.Base64);

  // Compare the hash with the one from Iyzico
  return hash === params.hash;
};

module.exports = {
  generateConversationId,
  formatPrice,
  createBasketItems,
  createBuyerInfo,
  createAddressInfo,
  validateIyzicoCallback
}; 