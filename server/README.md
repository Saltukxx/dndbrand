# DnD Brand Server

This is the backend server for the DnD Brand e-commerce application.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher) or MongoDB Atlas account

## Setup

1. Make sure you have Node.js installed on your system
2. Configure your MongoDB connection in the `.env` file
3. Install dependencies by running `npm install` in the server directory

## Running the Server

### Using the Batch File (Windows)

The easiest way to start the server on Windows is to double-click the `start-server.bat` file.

### Using Command Line

Navigate to the server directory and run:

```bash
node api-server.js
```

## Available Servers

The project includes several server scripts for different purposes:

- `api-server.js`: Main API server with CORS support and test page
- `server.js`: Original server with all features
- `debug-server.js`: Server with additional logging for debugging
- `diagnose-server.js`: Diagnostic tool to check system and server configuration
- `test-local-request.js`: Script to test server connectivity
- `test-connection.js`: Script to test MongoDB connectivity

## Testing the API

Once the server is running, you can test the API using the built-in test page:

1. Start the server using one of the methods above
2. Open a web browser and navigate to `http://localhost:5000/test`
3. Use the buttons on the test page to make requests to different endpoints

## Troubleshooting

If you encounter issues:

### Connection Issues

- Make sure MongoDB is running and accessible
- Check that the MongoDB connection string in your `.env` file is correct
- Verify that port 5000 is not being used by another application
- Check if your firewall is blocking connections to port 5000

### Database Issues

- Run `node test-connection.js` to test the MongoDB connection
- Check MongoDB Atlas IP whitelist if using Atlas
- Verify that your database user has the correct permissions

### Server Issues

- Run `node diagnose-server.js` for a comprehensive diagnostic report
- Check the console for error messages
- Make sure all required dependencies are installed

## API Endpoints

- `GET /`: Root endpoint, returns a simple message
- `GET /api/products`: Returns all products
- `GET /api/customers`: Returns all customers
- `GET /api/users`: Returns all users

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited. 