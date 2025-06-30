@echo off
echo 🏢 Building Hostel Management App for Release...
echo.

:: Get current date/time for version
set DATETIME=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
set DATETIME=%DATETIME: =0%

echo 📅 Version: %DATETIME%
echo.

:: Build the project
echo 🔨 Building project...
call ionic capacitor build android --prod

if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

:: Build APK
echo 📱 Building APK...
cd android
call gradlew assembleRelease

if errorlevel 1 (
    echo ❌ APK build failed!
    pause
    exit /b 1
)

:: Copy APK with version name
echo 📦 Preparing distribution file...
copy app\build\outputs\apk\release\app-release.apk ..\hostel-management-%DATETIME%.apk

if errorlevel 1 (
    echo ❌ Failed to copy APK!
    pause
    exit /b 1
)

cd ..

echo.
echo ✅ SUCCESS! APK ready for distribution:
echo 📁 File: hostel-management-%DATETIME%.apk
echo.
echo 📤 Next steps:
echo 1. Share this APK file with your team via WhatsApp/Email
echo 2. Or set up Firebase App Distribution for automatic updates
echo.
echo 💡 Tip: See FREE_DISTRIBUTION_GUIDE.md for better distribution methods
echo.
pause 