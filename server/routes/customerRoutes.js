const express = require('express');
const {
  registerCustomer,
  loginCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  addAddress,
  updateAddress,
  deleteAddress
} = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

router.route('/')
  .get(protect, authorize('admin'), getCustomers);

router.route('/:id')
  .get(protect, getCustomer)
  .put(protect, updateCustomer);

router.route('/:id/addresses')
  .post(protect, addAddress);

router.route('/:id/addresses/:addressId')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

module.exports = router; 