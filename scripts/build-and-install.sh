#!/bin/bash

# Build and Install Script with Version Management
# This script automatically increments version and ensures clean installation

set -e

echo "🚀 Starting build and install process..."

# Increment patch version automatically
echo "📈 Incrementing version..."
npm run version:patch

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "📦 New version: $NEW_VERSION"

# Clean any previous builds
echo "🧹 Cleaning previous builds..."
cd android
./gradlew clean
cd ..

# Build the APK
echo "🔨 Building APK..."
npm run build:android

# Install with clean process
echo "📱 Installing APK with clean process..."
npm run install:clean

echo "🎉 Build and installation complete!"
echo "📋 Version: $NEW_VERSION"
echo "📱 App should be running on your device"