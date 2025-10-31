# App Icon Setup Guide

This guide will help you set up the app icon using your `world-Bingo-Logo.png` file.

## Current Logo File
- **Source**: `src/assets/images/world-Bingo-Logo.png`
- **Description**: A vibrant, colorful logo featuring "WORLD BINGO" text with a globe, bingo card, and money elements

## Required Icon Sizes

### Android Icons
The following icon files need to be generated and placed in the respective folders:

| Folder | File | Size |
|--------|------|------|
| `android/app/src/main/res/mipmap-mdpi/` | `ic_launcher.png` | 48x48px |
| `android/app/src/main/res/mipmap-mdpi/` | `ic_launcher_round.png` | 48x48px |
| `android/app/src/main/res/mipmap-hdpi/` | `ic_launcher.png` | 72x72px |
| `android/app/src/main/res/mipmap-hdpi/` | `ic_launcher_round.png` | 72x72px |
| `android/app/src/main/res/mipmap-xhdpi/` | `ic_launcher.png` | 96x96px |
| `android/app/src/main/res/mipmap-xhdpi/` | `ic_launcher_round.png` | 96x96px |
| `android/app/src/main/res/mipmap-xxhdpi/` | `ic_launcher.png` | 144x144px |
| `android/app/src/main/res/mipmap-xxhdpi/` | `ic_launcher_round.png` | 144x144px |
| `android/app/src/main/res/mipmap-xxxhdpi/` | `ic_launcher.png` | 192x192px |
| `android/app/src/main/res/mipmap-xxxhdpi/` | `ic_launcher_round.png` | 192x192px |

### iOS Icons
The following icon files need to be generated and placed in `ios/World_Bingo/Images.xcassets/AppIcon.appiconset/`:

| Name | Size |
|------|------|
| `20x20@2x` | 40x40px |
| `20x20@3x` | 60x60px |
| `29x29@2x` | 58x58px |
| `29x29@3x` | 87x87px |
| `40x40@2x` | 80x80px |
| `40x40@3x` | 120x120px |
| `60x60@2x` | 120x120px |
| `60x60@3x` | 180x180px |
| `1024x1024@1x` | 1024x1024px |

## Generation Methods

### Method 1: Online Tools (Recommended)
1. **AppIcon.co**: https://appicon.co/
   - Upload your `world-Bingo-Logo.png`
   - Select both Android and iOS
   - Download the generated icons
   - Extract and place in the correct folders

2. **Icon Kitchen**: https://icon.kitchen/
   - Upload your logo
   - Generate for both platforms
   - Download and extract

### Method 2: Command Line (if ImageMagick is installed)
```bash
# Install ImageMagick first: brew install imagemagick (on macOS)

# Generate Android icons
mkdir -p android/app/src/main/res/mipmap-mdpi
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi

# Generate different sizes
convert src/assets/images/world-Bingo-Logo.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert src/assets/images/world-Bingo-Logo.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
convert src/assets/images/world-Bingo-Logo.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert src/assets/images/world-Bingo-Logo.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
convert src/assets/images/world-Bingo-Logo.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert src/assets/images/world-Bingo-Logo.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
convert src/assets/images/world-Bingo-Logo.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert src/assets/images/world-Bingo-Logo.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
convert src/assets/images/world-Bingo-Logo.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
convert src/assets/images/world-Bingo-Logo.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

# Generate iOS icons
mkdir -p ios/World_Bingo/Images.xcassets/AppIcon.appiconset
convert src/assets/images/world-Bingo-Logo.png -resize 40x40 ios/World_Bingo/Images.xcassets/AppIcon.appiconset/20x20@2x.png
convert src/assets/images/world-Bingo-Logo.png -resize 60x60 ios/World_Bingo/Images.xcassets/AppIcon.appiconset/20x20@3x.png
convert src/assets/images/world-Bingo-Logo.png -resize 58x58 ios/World_Bingo/Images.xcassets/AppIcon.appiconset/29x29@2x.png
convert src/assets/images/world-Bingo-Logo.png -resize 87x87 ios/World_Bingo/Images.xcassets/AppIcon.appiconset/29x29@3x.png
convert src/assets/images/world-Bingo-Logo.png -resize 80x80 ios/World_Bingo/Images.xcassets/AppIcon.appiconset/40x40@2x.png
convert src/assets/images/world-Bingo-Logo.png -resize 120x120 ios/World_Bingo/Images.xcassets/AppIcon.appiconset/40x40@3x.png
convert src/assets/images/world-Bingo-Logo.png -resize 120x120 ios/World_Bingo/Images.xcassets/AppIcon.appiconset/60x60@2x.png
convert src/assets/images/world-Bingo-Logo.png -resize 180x180 ios/World_Bingo/Images.xcassets/AppIcon.appiconset/60x60@3x.png
convert src/assets/images/world-Bingo-Logo.png -resize 1024x1024 ios/World_Bingo/Images.xcassets/AppIcon.appiconset/1024x1024@1x.png
```

## After Generating Icons

1. **Clean and Rebuild**: After adding the new icons, clean and rebuild your project:
   ```bash
   # For Android
   cd android && ./gradlew clean && cd ..
   npx react-native run-android
   
   # For iOS
   cd ios && xcodebuild clean && cd ..
   npx react-native run-ios
   ```

2. **Verify**: Check that the new icons appear in:
   - Android: App drawer and home screen
   - iOS: Home screen and app switcher

## Notes
- Make sure the logo is square or can be cropped to square format
- The logo should work well at small sizes (48x48px)
- Consider the background color and contrast for visibility
- Test on both light and dark themes if applicable

## Current Status
✅ Logo file identified: `src/assets/images/world-Bingo-Logo.png`  
⏳ Icons need to be generated and placed in the correct folders  
⏳ Project needs to be rebuilt to apply changes
