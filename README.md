# DnD Brand E-commerce

A full-stack e-commerce website for DnD Brand with admin panel, product management, customer accounts, and order processing.

## Features

- Responsive frontend design
- Admin panel for product and order management
- Customer registration and accounts
- Shopping cart and checkout
- Product catalog with filtering and search
- Order tracking
- Backend API with MongoDB database

## Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)
- Responsive Design

### Backend
- Node.js
- Express
- MongoDB
- JWT Authentication
- RESTful API

## Project Structure

```
dndbrand/
├── index.html              # Main homepage
├── shop.html               # Shop page
├── product.html            # Product detail page
├── cart.html               # Shopping cart
├── account.html            # Customer account page
├── admin.html              # Admin dashboard
├── admin-login.html        # Admin login page
├── styles.css              # Main styles
├── shop.css                # Shop page styles
├── product.css             # Product page styles
├── cart.css                # Cart page styles
├── account.css             # Account page styles
├── admin.css               # Admin panel styles
├── index.js                # Main JavaScript
├── shop.js                 # Shop page JavaScript
├── product.js              # Product page JavaScript
├── cart.js                 # Cart page JavaScript
├── account.js              # Account page JavaScript
├── admin.js                # Admin panel JavaScript
├── server/                 # Backend server
│   ├── server.js           # Main server file
│   ├── config/             # Configuration files
│   ├── models/             # MongoDB models
│   ├── controllers/        # API controllers
│   ├── routes/             # API routes
│   ├── middleware/         # Middleware functions
│   └── uploads/            # Uploaded files
└── uploads/                # Product images
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/dndbrand.git
   cd dndbrand
   ```

2. Install frontend dependencies:
   ```
   npm install
   ```

3. Install backend dependencies:
   ```
   cd server
   npm install
   ```

4. Create a `.env` file in the `server/config` directory:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/dndbrand
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   ```

5. Start the backend server:
   ```
   npm run dev
   ```

6. Open the frontend in your browser:
   ```
   http://localhost:5000
   ```

## Admin Access

A default admin user is created when the server starts:

- Email: admin@dndbrand.com
- Password: admin123

Please change these credentials in production.

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

## License

This project is licensed under the MIT License. 