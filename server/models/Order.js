const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        name: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1']
        },
        variant: {
          type: String,
          default: ''
        },
        image: {
          type: String,
          default: ''
        }
      }
    ],
    shippingAddress: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      postalCode: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true,
        default: 'Turkey'
      }
    },
    billingAddress: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      postalCode: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true,
        default: 'Turkey'
      }
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['credit_card', 'bank_transfer', 'cash_on_delivery']
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    subtotal: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      required: true
    },
    shippingCost: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    notes: {
      type: String
    },
    trackingNumber: {
      type: String
    },
    // Payment details from payment provider
    paymentDetails: {
      paymentId: {
        type: String
      },
      conversationId: {
        type: String
      },
      paymentMethod: {
        type: String
      },
      paymentProvider: {
        type: String,
        default: 'iyzico'
      },
      paymentDate: {
        type: Date
      },
      lastFourDigits: {
        type: String
      },
      cardType: {
        type: String
      }
    },
    // Refund details if order is refunded
    refundDetails: {
      refundId: {
        type: String
      },
      refundAmount: {
        type: Number
      },
      refundReason: {
        type: String
      },
      refundDate: {
        type: Date
      }
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for better performance
OrderSchema.index({ user: 1 });
OrderSchema.index({ customer: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'items.product': 1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });

// Generate order number before saving
OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `DND-${year}${month}${day}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema); 