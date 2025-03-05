# DnD Brand Server Deployment Guide

This guide will help you deploy the DnD Brand server to a cloud hosting service so that your website can work properly when accessed from any computer.

## Prerequisites

- A GitHub account
- A credit card (for some services, even for free tiers)
- Your DnD Brand codebase

## Option 1: Deploy to Render.com (Recommended for beginners)

Render.com offers a free tier for web services that's perfect for small projects.

### Step 1: Sign up for Render

1. Go to [render.com](https://render.com/) and sign up for an account
2. Verify your email address

### Step 2: Create a new Web Service

1. Click on "New" and select "Web Service"
2. Connect your GitHub repository or upload your code
3. Configure your service:
   - Name: `dndbrand-server`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server/final-server.js`
   - Plan: Free

### Step 3: Configure Environment Variables

1. In the Render dashboard, go to your web service
2. Click on "Environment" in the left sidebar
3. Add the following environment variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string for JWT tokens
   - Any other environment variables your app needs

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for the deployment to complete (this may take a few minutes)
3. Once deployed, Render will provide you with a URL like `https://dndbrand-server.onrender.com`

### Step 5: Update Your Config File

1. Open `public/js/config.js`
2. Update the API_URL to point to your Render URL:
   ```javascript
   API_URL: 'https://dndbrand-server.onrender.com/api',
   ```
3. Commit and push these changes to GitHub

## Option 2: Deploy to Heroku

Heroku is another popular platform for Node.js applications.

### Step 1: Sign up for Heroku

1. Go to [heroku.com](https://heroku.com/) and sign up for an account
2. Install the Heroku CLI on your computer

### Step 2: Prepare Your App for Heroku

1. Create a `Procfile` in the root of your project with the following content:
   ```
   web: node server/final-server.js
   ```

2. Make sure your server listens on the correct port:
   ```javascript
   const PORT = process.env.PORT || 8080;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

### Step 3: Deploy to Heroku

1. Open a terminal in your project directory
2. Run the following commands:
   ```
   heroku login
   heroku create dndbrand-server
   git push heroku master
   ```

3. Set up environment variables:
   ```
   heroku config:set MONGO_URI=your_mongo_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   ```

4. Open your app:
   ```
   heroku open
   ```

### Step 4: Update Your Config File

1. Open `public/js/config.js`
2. Update the API_URL to point to your Heroku URL:
   ```javascript
   API_URL: 'https://dndbrand-server.herokuapp.com/api',
   ```
3. Commit and push these changes to GitHub

## Option 3: Deploy to Railway.app

Railway is a modern platform that makes deployment simple.

### Step 1: Sign up for Railway

1. Go to [railway.app](https://railway.app/) and sign up with GitHub
2. Install the Railway CLI (optional)

### Step 2: Create a New Project

1. Click "New Project" and select "Deploy from GitHub repo"
2. Select your repository
3. Configure the deployment:
   - Root Directory: `/`
   - Start Command: `node server/final-server.js`

### Step 3: Add Environment Variables

1. Go to your project settings
2. Click on "Variables"
3. Add your environment variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string for JWT tokens

### Step 4: Deploy

1. Railway will automatically deploy your app
2. Once deployed, Railway will provide you with a URL

### Step 5: Update Your Config File

1. Open `public/js/config.js`
2. Update the API_URL to point to your Railway URL:
   ```javascript
   API_URL: 'https://your-railway-url.up.railway.app/api',
   ```
3. Commit and push these changes to GitHub

## Troubleshooting

### CORS Issues

If you're experiencing CORS issues, make sure your server has the correct CORS configuration:

```javascript
const cors = require('cors');

// Use CORS middleware with appropriate options
app.use(cors({
  origin: ['https://yourdomain.github.io', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

### Database Connection Issues

Make sure your MongoDB connection string is correct and that your IP address is whitelisted in MongoDB Atlas.

### File Upload Issues

For file uploads to work properly, you may need to configure your cloud provider to handle file storage. Consider using:

- Amazon S3
- Cloudinary
- Firebase Storage

## Need Help?

If you're still having issues, feel free to reach out for support:

- Create an issue on GitHub
- Contact us at support@dndbrand.com 