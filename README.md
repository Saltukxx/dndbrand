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
- CORS-enabled for cross-domain communication

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
├── public/                 # Frontend files
│   ├── html/               # HTML pages
│   │   ├── index.html      # Main homepage
│   │   ├── shop.html       # Shop page
│   │   ├── product.html    # Product detail page
│   │   ├── cart.html       # Shopping cart
│   │   ├── account.html    # Customer account page
│   │   ├── admin.html      # Admin dashboard
│   │   └── admin-login.html # Admin login page
│   ├── css/                # CSS styles
│   ├── js/                 # JavaScript files
│   ├── images/             # Image assets
│   └── assets/             # Other assets
├── server/                 # Backend server
│   ├── production-server.js # Production server
│   ├── cors-config.js      # CORS configuration
│   ├── config/             # Configuration files
│   ├── models/             # MongoDB models
│   ├── controllers/        # API controllers
│   ├── routes/             # API routes
│   ├── middleware/         # Middleware functions
│   └── uploads/            # Uploaded files
├── server.js               # Local development server
├── package.json            # Project dependencies
├── start.bat               # Windows startup script
├── start.sh                # Unix/Linux/Mac startup script
└── README.md               # Project documentation
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/saltukxx/dndbrand.git
   cd dndbrand
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the `server/config` directory:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/dndbrand
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   CORS_ORIGIN=https://dndbrand.com,https://www.dndbrand.com,http://localhost:3000
   ```

4. Start the local development server:
   ```
   npm start
   ```

5. Open the website in your browser:
   ```
   http://localhost:3000
   ```

## Running in Production

To run the production server:

### On Windows:
```
npm run server:prod:win
```

### On Unix/Linux/Mac:
```
npm run server:prod
```

## Admin Access

A default admin user is created when the server starts:

- Email: admin@dndbrand.com
- Password: admin123

Please change these credentials in production.

## API Endpoints

### Authentication
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
- `GET /api/admin/customers` - Get all customers (admin only)
- `GET /api/customers/:id` - Get single customer
- `PUT /api/customers/:id` - Update customer

### Orders
- `POST /api/orders` - Create new order
- `GET /api/admin/orders` - Get all orders (admin only)
- `GET /api/admin/orders/recent` - Get recent orders (admin only)
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status (admin only)
- `GET /api/orders/customer/:customerId` - Get customer orders

### Admin Dashboard
- `GET /api/admin/stats` - Get dashboard statistics (admin only)

## CORS Configuration

The server is configured to allow requests from the following origins:
- https://dndbrand.com
- https://www.dndbrand.com
- http://localhost:3000

If you need to add more origins, update the `CORS_ORIGIN` environment variable or modify the `server/cors-config.js` file.

## Local Development

For local development, the project includes a proxy server that forwards API requests to the production server. This helps avoid CORS issues during development.

To use the local proxy:
1. Start the local server: `npm start`
2. Access the website at: `http://localhost:3000`
3. API requests will be proxied through: `http://localhost:3000/api-proxy/`

## License

This project is licensed under the MIT License. See the LICENSE file for details. 