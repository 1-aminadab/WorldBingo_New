#!/bin/bash

# Clean APK Installation Script
# This script ensures clean installation by removing any existing version first

set -e

PACKAGE_NAME="com.world_bingo"
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

echo "🧹 Starting clean APK installation process..."

# Check if APK file exists
if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK file not found at: $APK_PATH"
    echo "📦 Building APK first..."
    cd android && ./gradlew assembleRelease
    cd ..
fi

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ No Android device/emulator connected"
    echo "📱 Please connect an Android device or start an emulator"
    exit 1
fi

echo "📱 Device connected successfully"

# Uninstall existing app (ignore errors if not installed)
echo "🗑️  Uninstalling existing app..."
adb uninstall $PACKAGE_NAME 2>/dev/null || echo "ℹ️  No existing app found"

# Clear any cached data
echo "🧹 Clearing package manager cache..."
adb shell pm clear $PACKAGE_NAME 2>/dev/null || true

# Install new APK
echo "📦 Installing new APK..."
if adb install -r "$APK_PATH"; then
    echo "✅ APK installed successfully!"
    echo "🚀 App package: $PACKAGE_NAME"
    
    # Launch the app
    echo "🚀 Launching app..."
    adb shell monkey -p $PACKAGE_NAME -c android.intent.category.LAUNCHER 1
    
    echo "🎉 Installation complete!"
else
    echo "❌ APK installation failed"
    echo "🔍 Checking for common issues..."
    
    # Check available space
    AVAILABLE_SPACE=$(adb shell df /data | tail -1 | awk '{print $4}')
    echo "💾 Available space: ${AVAILABLE_SPACE}K"
    
    # Check if package is still installed
    if adb shell pm list packages | grep -q $PACKAGE_NAME; then
        echo "⚠️  Package still exists, trying force uninstall..."
        adb shell pm uninstall --user 0 $PACKAGE_NAME 2>/dev/null || true
        adb shell pm uninstall $PACKAGE_NAME 2>/dev/null || true
        
        echo "🔄 Retrying installation..."
        if adb install -r "$APK_PATH"; then
            echo "✅ APK installed successfully after cleanup!"
        else
            echo "❌ Installation failed even after cleanup"
            exit 1
        fi
    else
        exit 1
    fi
fi

echo "📋 Installation summary:"
echo "   Package: $PACKAGE_NAME"
echo "   APK: $APK_PATH"
echo "   Status: ✅ Installed"