# DnD Brand E-commerce Deployment Guide

This guide provides step-by-step instructions for deploying the DnD Brand E-commerce website to a production environment.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database (can be hosted on MongoDB Atlas or self-hosted)
- A web server (Nginx, Apache) or cloud platform (Render, Heroku, Vercel, etc.)
- Domain name (optional but recommended)

## Deployment Options

### Option 1: Deploy to Render.com (Recommended)

Render.com provides a simple way to deploy both the frontend and backend of your application.

#### Backend Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `dndbrand-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/production-server.js`
   - **Environment Variables**:
     - `PORT`: `10000` (Render will expose this port)
     - `NODE_ENV`: `production`
     - `MONGO_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A secure random string
     - `JWT_EXPIRE`: `30d`
     - `CORS_ORIGIN`: `https://dndbrand.com,https://www.dndbrand.com`

4. Click "Create Web Service"

#### Frontend Deployment

1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `dndbrand`
   - **Build Command**: `npm install`
   - **Publish Directory**: `public`
   - **Environment Variables**:
     - `API_URL`: The URL of your backend service (e.g., `https://dndbrand-server.onrender.com/api`)

4. Click "Create Static Site"
5. Configure your custom domain in the Render dashboard

### Option 2: Self-Hosted Deployment

#### Backend Deployment

1. Set up a server with Node.js installed
2. Clone your repository:
   ```
   git clone https://github.com/saltukxx/dndbrand.git
   cd dndbrand
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the `server/config` directory with your production settings:
   ```
   PORT=3000
   NODE_ENV=production
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_random_string
   JWT_EXPIRE=30d
   CORS_ORIGIN=https://dndbrand.com,https://www.dndbrand.com
   ```

5. Start the production server:
   ```
   npm run server:prod
   ```

6. Set up a process manager like PM2 to keep the server running:
   ```
   npm install -g pm2
   pm2 start server/production-server.js --name dndbrand
   pm2 save
   pm2 startup
   ```

#### Frontend Deployment

1. Set up a web server like Nginx
2. Configure Nginx to serve the static files from the `public` directory
3. Configure Nginx to proxy API requests to the Node.js server

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name dndbrand.com www.dndbrand.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name dndbrand.com www.dndbrand.com;

    # SSL configuration
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    # Serve static files
    root /path/to/dndbrand/public;
    index html/index.html;

    # Handle clean URLs
    location / {
        try_files $uri $uri/ /html/index.html;
    }

    # Proxy API requests to the Node.js server
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Post-Deployment Steps

1. **Change default admin credentials**:
   - Log in with the default admin credentials
   - Go to the admin settings page
   - Change the password to a secure one

2. **Set up SSL/TLS**:
   - If not using a platform that provides SSL, set up Let's Encrypt
   - Ensure all traffic is redirected to HTTPS

3. **Set up monitoring**:
   - Consider using a service like UptimeRobot to monitor your website
   - Set up error logging with a service like Sentry

4. **Set up backups**:
   - Configure regular backups of your MongoDB database
   - Set up a backup strategy for uploaded files

5. **Test the website**:
   - Test all functionality on the live site
   - Test on different devices and browsers
   - Check for any CORS issues

## Troubleshooting

### CORS Issues

If you're experiencing CORS issues:

1. Check that the `CORS_ORIGIN` environment variable includes all necessary domains
2. Verify that the CORS middleware is correctly configured in `server/production-server.js`
3. Check the browser console for specific CORS error messages

### Database Connection Issues

If the server can't connect to the database:

1. Verify that the MongoDB connection string is correct
2. Check if the MongoDB server is running and accessible
3. Check if there are any network restrictions preventing the connection

### Static Files Not Loading

If static files (CSS, JS, images) are not loading:

1. Check the browser console for 404 errors
2. Verify that the files exist in the correct location
3. Check the web server configuration for correct paths

## Continuous Deployment

For continuous deployment:

1. Set up a CI/CD pipeline with GitHub Actions or similar
2. Configure automatic deployment to your hosting platform
3. Set up automated tests to run before deployment

## Need Help?

If you encounter any issues during deployment, please:

1. Check the server logs for error messages
2. Consult the documentation for your hosting platform
3. Reach out to the development team for assistance 