@echo off
echo 🔥 Firebase CLI Setup for Hostel Management App
echo ================================================================

echo.
echo 📦 Step 1: Installing Firebase CLI...
echo ================================================================
npm install -g firebase-tools
if errorlevel 1 (
    echo ❌ Firebase CLI installation failed!
    echo 💡 Try running as administrator or use: npm install -g firebase-tools --force
    pause
    exit /b 1
)

echo.
echo 🔐 Step 2: Login to Firebase...
echo ================================================================
firebase login
if errorlevel 1 (
    echo ❌ Firebase login failed!
    pause
    exit /b 1
)

echo.
echo 🏗️ Step 3: Project Setup Instructions
echo ================================================================
echo 1. Go to Firebase Console: https://console.firebase.google.com/
echo 2. Create new project named: hostel-management
echo 3. Enable App Distribution in left sidebar
echo 4. Add Android app with package: com.sca.hostel
echo 5. Download google-services.json to android/app/ folder
echo 6. Update APP_ID in scripts/firebase-distribute.bat
echo.
echo ✅ Firebase CLI setup complete!
echo 📖 Next: Follow FIREBASE_SETUP_GUIDE.md for full setup
echo.
pause 