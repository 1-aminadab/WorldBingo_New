#!/bin/bash

# App Icon Generation Script using macOS sips
# This script generates all required app icons from world-Bingo-Logo.png

echo "🎨 Generating app icons from world-Bingo-Logo.png..."

# Check if source file exists
SOURCE_FILE="src/assets/images/world-Bingo-Logo.png"
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Error: Source file $SOURCE_FILE not found!"
    exit 1
fi

echo "✅ Source file found: $SOURCE_FILE"

# Create directories if they don't exist
echo "📁 Creating directories..."
mkdir -p android/app/src/main/res/mipmap-mdpi
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi
mkdir -p ios/World_Bingo/Images.xcassets/AppIcon.appiconset

echo "📱 Generating Android icons..."

# Android icons
sips -z 48 48 "$SOURCE_FILE" --out android/app/src/main/res/mipmap-mdpi/ic_launcher.png
sips -z 48 48 "$SOURCE_FILE" --out android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png

sips -z 72 72 "$SOURCE_FILE" --out android/app/src/main/res/mipmap-hdpi/ic_launcher.png
sips -z 72 72 "$SOURCE_FILE" --out android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png

sips -z 96 96 "$SOURCE_FILE" --out android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
sips -z 96 96 "$SOURCE_FILE" --out android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png

sips -z 144 144 "$SOURCE_FILE" --out android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
sips -z 144 144 "$SOURCE_FILE" --out android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png

sips -z 192 192 "$SOURCE_FILE" --out android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
sips -z 192 192 "$SOURCE_FILE" --out android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

echo "🍎 Generating iOS icons..."

# iOS icons
sips -z 40 40 "$SOURCE_FILE" --out ios/World_Bingo/Images.xcassets/AppIcon.appiconset/20x20@2x.png
sips -z 60 60 "$SOURCE_FILE" --out ios/World_Bingo/Images.xcassets/AppIcon.appiconset/20x20@3x.png
sips -z 58 58 "$SOURCE_FILE" --out ios/World_Bingo/Images.xcassets/AppIcon.appiconset/29x29@2x.png
sips -z 87 87 "$SOURCE_FILE" --out ios/World_Bingo/Images.xcassets/AppIcon.appiconset/29x29@3x.png
sips -z 80 80 "$SOURCE_FILE" --out ios/World_Bingo/Images.xcassets/AppIcon.appiconset/40x40@2x.png
sips -z 120 120 "$SOURCE_FILE" --out ios/World_Bingo/Images.xcassets/AppIcon.appiconset/40x40@3x.png
sips -z 120 120 "$SOURCE_FILE" --out ios/World_Bingo/Images.xcassets/AppIcon.appiconset/60x60@2x.png
sips -z 180 180 "$SOURCE_FILE" --out ios/World_Bingo/Images.xcassets/AppIcon.appiconset/60x60@3x.png
sips -z 1024 1024 "$SOURCE_FILE" --out ios/World_Bingo/Images.xcassets/AppIcon.appiconset/1024x1024@1x.png

echo "✅ All app icons generated successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Clean and rebuild your project:"
echo "   - Android: cd android && ./gradlew clean && cd .. && npx react-native run-android"
echo "   - iOS: cd ios && xcodebuild clean && cd .. && npx react-native run-ios"
echo ""
echo "2. Verify the new icons appear in:"
echo "   - Android: App drawer and home screen"
echo "   - iOS: Home screen and app switcher"
echo ""
echo "🎉 Your World Bingo app now has the custom logo as its icon!"
