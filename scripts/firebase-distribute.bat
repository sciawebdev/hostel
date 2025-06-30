@echo off
echo 🔥 Firebase Distribution Script for Hostel Management App
echo ================================================================

echo.
echo 📱 Step 1: Building production APK...
echo ================================================================
call npm run build
if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo 🔨 Step 2: Generating Android APK...
echo ================================================================
call ionic capacitor build android --prod
if errorlevel 1 (
    echo ❌ Capacitor build failed!
    pause
    exit /b 1
)

cd android
call gradlew assembleRelease
if errorlevel 1 (
    echo ❌ Gradle build failed!
    pause
    exit /b 1
)
cd ..

echo.
echo 📤 Step 3: Distributing via Firebase...
echo ================================================================

set APK_PATH=android\app\build\outputs\apk\release\app-release-unsigned.apk
set APP_ID=1:43227706036:android:06904f5eeb32fdb618dde1

REM Replace with your actual employee emails (update these with real emails)
set TESTERS=sciawebdev@gmail.com

echo Distributing APK: %APK_PATH%
echo To testers: %TESTERS%

firebase appdistribution:distribute %APK_PATH% ^
  --app %APP_ID% ^
  --testers "%TESTERS%" ^
  --release-notes "Latest hostel management app update"

if errorlevel 1 (
    echo ❌ Firebase distribution failed!
    echo.
    echo 💡 Make sure you have:
    echo 1. Created Firebase project
    echo 2. Added Android app to Firebase
    echo 3. Updated APP_ID in this script
    echo 4. Logged into Firebase CLI: firebase login
    pause
    exit /b 1
)

echo.
echo ✅ Distribution Successful!
echo ================================================================
echo 📧 Your team will receive email invitations
echo 📱 They need to install "Firebase App Tester" from Play Store
echo 🔗 Check distribution dashboard: https://console.firebase.google.com/
echo.
pause 