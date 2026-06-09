#!/bin/bash

# Ensure the script runs in the directory where it is located
cd "$(dirname "$0")"

echo "========================================================"
echo "Error404 Users - Automatic Setup Script"
echo "========================================================"

echo ""
echo "Installing dependencies for User Server..."
cd server || exit
npm install
echo "Creating .env for User Server..."
cat << 'EOF' > .env
PORT=5005
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/error404
JWT_SECRET=your_jwt_secret_here
PISTON_API_URL=https://emkc.org/api/v2/piston
NODE_ENV=development
EOF
cd ..

echo ""
echo "Installing dependencies for User Client..."
cd client || exit
npm install
echo "Creating .env for User Client..."
cat << 'EOF' > .env
VITE_API_URL=http://localhost:5005/api
EOF
cd ..

echo ""
echo "========================================================"
echo "Setup Complete!"
echo "Please update the generated .env files with your actual credentials."
echo "========================================================"
echo "Press [Enter] to exit..."
read -r
