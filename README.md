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

# DnD Brand E-commerce Website

This is the frontend for the DnD Brand e-commerce website.

## Running the Website Locally

There are two ways to run the website locally:

### Method 1: Using the Node.js Server (Recommended)

This method avoids CORS issues by serving the website from a proper web server.

1. Make sure you have Node.js installed on your computer
2. Open a terminal/command prompt in the project directory
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open your browser and navigate to:
   ```
   http://localhost:3000/html/index.html
   ```

### Method 2: Using the File System (May Encounter CORS Issues)

If you open the HTML files directly from your file system, you may encounter CORS issues when trying to fetch data from the API. The website will still work, but it will use mock data instead of real data from the API.

1. Navigate to the `public/html` directory
2. Open `index.html` in your web browser

## CORS Issues

If you're experiencing CORS issues:

1. The website has been configured to automatically use mock data when running from a `file://` origin
2. For development, use the Node.js server method described above
3. If you need to access the real API data, you must run the website from a proper web server

## API Configuration

The API URL is configured in `public/js/config.js`. By default, it points to the production API:

```javascript
API_URL: 'https://dndbrand-server.onrender.com/api'
```

For local development with a local API server, you can uncomment the development URL:

```javascript
// API_URL: 'http://localhost:8080/api'
``` 