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

## Production Setup Guide for DnD Brand

This guide will help you set up and run the DnD Brand e-commerce website.

### System Requirements

- Node.js (v14.x or newer)
- MongoDB (v4.4 or newer)
- npm (v6.x or newer)

### Quick Start

#### Using the Automatic Scripts (Recommended)

1. Clone the repository:
   ```
   git clone https://github.com/saltukxx/dndbrand.git
   cd dndbrand
   ```

2. Run the start script:
   - **Windows**: Double-click on `start.bat` or run it from the command line
   - **Linux/Mac**: Run `./start.sh` (you may need to make it executable with `chmod +x start.sh`)

3. Access the frontend at: http://localhost:3000

#### Manual Setup

1. Clone the repository:
   ```
   git clone https://github.com/saltukxx/dndbrand.git
   cd dndbrand
   ```

2. Install dependencies:
   ```
   npm install --legacy-peer-deps
   ```

3. Create necessary directories:
   ```
   mkdir -p logs
   ```

4. Set up environment variables:
   ```
   cp server/config/production.env.example server/config/.env
   ```
   And edit `.env` with your MongoDB connection string and other settings

5. Run the database setup script:
   ```
   node server/scripts/setup-db.js
   ```

6. Start the server:
   ```
   npm start
   ```

7. Access the frontend at: http://localhost:3000

### Production Deployment

For production deployment, use the production server:

```
npm run server:prod         # Linux/Mac
npm run server:prod:win     # Windows
```

### Features

- **Secure API**: Authentication with JWT, secure endpoints with authorization
- **Image Storage**: Uses MongoDB GridFS for reliable image storage
- **CORS Handling**: Configured for proper security in production
- **Caching**: Optimized with in-memory cache for frequently accessed data
- **Logging**: Comprehensive logging system with Winston
- **Database Performance**: Optimized with proper indexes
- **Rate Limiting**: Protection against brute force attacks

### Codebase Structure

- `/server` - Backend API code
  - `/controllers` - Business logic for API endpoints
  - `/middleware` - Authentication, error handling, etc.
  - `/models` - Database models
  - `/routes` - API route definitions
  - `/config` - Configuration files
  - `/utils` - Utility functions
  - `/scripts` - Setup and maintenance scripts

- `/public` - Frontend assets
  - `/html` - HTML templates
  - `/css` - Stylesheets
  - `/js` - JavaScript files
  - `/images` - Static images

### Environment Variables

See `server/config/production.env.example` for all available configuration options.

### Logs

Logs are stored in the `/logs` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

### Contributing

Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for contribution guidelines.

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