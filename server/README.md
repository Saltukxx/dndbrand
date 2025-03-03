# DnD Brand E-commerce Backend

This is the backend API for the DnD Brand E-commerce website. It provides endpoints for managing products, customers, orders, and user authentication.

## Features

- User authentication (admin)
- Customer registration and authentication
- Product management
- Order processing
- File uploads for product images

## Tech Stack

- Node.js
- Express
- MongoDB
- JWT Authentication
- Multer for file uploads

## Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the `config` directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/dndbrand
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   ```

3. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/users/register` - Register a new admin user
- `POST /api/users/login` - Login admin user
- `GET /api/users/me` - Get current user

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Customers

- `POST /api/customers/register` - Register a new customer
- `POST /api/customers/login` - Login customer
- `GET /api/customers` - Get all customers (admin only)
- `GET /api/customers/:id` - Get single customer
- `PUT /api/customers/:id` - Update customer
- `POST /api/customers/:id/addresses` - Add customer address

### Orders

- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders (admin only)
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status (admin only)
- `GET /api/orders/customer/:customerId` - Get customer orders

### Uploads

- `POST /api/upload` - Upload product images (admin only)

## Default Admin User

A default admin user is created when the server starts:

- Email: admin@dndbrand.com
- Password: admin123

Please change these credentials in production. 