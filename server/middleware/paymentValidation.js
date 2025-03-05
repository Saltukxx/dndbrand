const { check } = require('express-validator');

// Validate payment initialization request
exports.validatePaymentInit = [
  check('cardHolderName')
    .notEmpty()
    .withMessage('Card holder name is required')
    .isString()
    .withMessage('Card holder name must be a string')
    .isLength({ min: 3, max: 100 })
    .withMessage('Card holder name must be between 3 and 100 characters'),
  
  check('cardNumber')
    .notEmpty()
    .withMessage('Card number is required')
    .isString()
    .withMessage('Card number must be a string')
    .matches(/^[0-9]{16}$/)
    .withMessage('Card number must be 16 digits'),
  
  check('expireMonth')
    .notEmpty()
    .withMessage('Expiration month is required')
    .isString()
    .withMessage('Expiration month must be a string')
    .matches(/^(0[1-9]|1[0-2])$/)
    .withMessage('Expiration month must be between 01 and 12'),
  
  check('expireYear')
    .notEmpty()
    .withMessage('Expiration year is required')
    .isString()
    .withMessage('Expiration year must be a string')
    .matches(/^[0-9]{2}$/)
    .withMessage('Expiration year must be 2 digits'),
  
  check('cvc')
    .notEmpty()
    .withMessage('CVC is required')
    .isString()
    .withMessage('CVC must be a string')
    .matches(/^[0-9]{3,4}$/)
    .withMessage('CVC must be 3 or 4 digits'),
  
  check('registerCard')
    .optional()
    .isBoolean()
    .withMessage('Register card must be a boolean')
];

// Validate refund request
exports.validateRefund = [
  check('refundAmount')
    .optional()
    .isNumeric()
    .withMessage('Refund amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0'),
  
  check('refundReason')
    .optional()
    .isString()
    .withMessage('Refund reason must be a string')
    .isLength({ min: 3, max: 200 })
    .withMessage('Refund reason must be between 3 and 200 characters')
]; 