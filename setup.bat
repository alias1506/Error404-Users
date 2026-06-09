@echo off
cd /d "%~dp0"

echo ========================================================
echo Error404 Users - Automatic Setup Script
echo ========================================================

echo.
echo Installing dependencies for User Server...
cd server
call npm install
echo Creating .env for User Server...
(
echo PORT=5005
echo MONGO_URI=mongodb+srv://^<username^>:^<password^>@cluster.mongodb.net/error404
echo JWT_SECRET=your_jwt_secret_here
echo PISTON_API_URL=https://emkc.org/api/v2/piston
echo NODE_ENV=development
) > .env
cd ..

echo.
echo Installing dependencies for User Client...
cd client
call npm install
echo Creating .env for User Client...
(
echo VITE_API_URL=http://localhost:5005/api
) > .env
cd ..

echo.
echo ========================================================
echo Setup Complete! 
echo Please update the generated .env files with your actual credentials.
echo ========================================================
pause
