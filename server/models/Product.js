const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters']
    },
    sku: {
      type: String,
      unique: true,
      trim: true,
      default: function() {
        // Generate a SKU with format DND-XX-NNN where XX is category code and NNN is random number
        const categoryCode = this.category ? this.category.substring(0, 2).toUpperCase() : 'PR';
        const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit number between 100-999
        return `DND-${categoryCode}-${randomNum}`;
      }
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price must be positive']
    },
    comparePrice: {
      type: Number,
      default: 0
    },
    images: {
      type: [String],
      default: []
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['clothing', 'accessories', 'footwear', 'jewelry', 'other']
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'draft'
    },
    inventory: {
      type: Number,
      required: [true, 'Please add inventory quantity'],
      min: [0, 'Inventory cannot be negative']
    },
    variants: {
      type: [
        {
          name: String,
          options: [String]
        }
      ],
      default: []
    },
    weight: {
      type: Number,
      default: 0
    },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 }
    },
    featured: {
      type: Boolean,
      default: false
    },
    onSale: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Product', ProductSchema); 