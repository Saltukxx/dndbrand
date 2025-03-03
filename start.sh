#!/bin/bash

echo "Starting DnD Brand E-commerce Application..."
echo

echo "Installing dependencies..."
npm run install:all
echo

echo "Starting server..."
npm run dev:server &
SERVER_PID=$!
echo

echo "Opening application in browser..."
sleep 5
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:5000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:5000
fi
echo

echo "DnD Brand E-commerce Application is now running!"
echo "Server: http://localhost:5000/api"
echo "Frontend: http://localhost:5000"
echo
echo "Press Ctrl+C to stop the server"

# Wait for user to press Ctrl+C
trap "kill $SERVER_PID; exit" INT
wait $SERVER_PID 