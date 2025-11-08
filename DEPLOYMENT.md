# World Bingo - Deployment Guide

## 🚀 Quick Start

To build and install the app without package conflicts:

```bash
npm run deploy
```

This single command will:
- ✅ Increment the app version automatically
- ✅ Clean previous builds
- ✅ Build a new APK
- ✅ Uninstall any existing version cleanly
- ✅ Install the new version
- ✅ Launch the app

## 📋 Available Commands

### Version Management
```bash
npm run version:patch    # 1.0.1 → 1.0.2
npm run version:minor    # 1.0.1 → 1.1.0  
npm run version:major    # 1.0.1 → 2.0.0
```

### Building
```bash
npm run build:android          # Build APK
npm run build:android:clean    # Clean build + Build APK
```

### Installation
```bash
npm run install:clean      # Clean install existing APK
npm run install:android    # Build + Clean install
npm run deploy            # Version + Build + Clean install
```

## 🔧 How Package Conflicts Are Fixed

### 1. **Unique Version Codes**
Each build generates a unique version code using:
- Major version × 100,000,000
- Minor version × 1,000,000  
- Patch version × 10,000
- Build timestamp (ensures uniqueness)

### 2. **Consistent Signing**
Both debug and release builds use the same keystore to prevent signature conflicts.

### 3. **Clean Installation Process**
The install script:
1. Uninstalls any existing version
2. Clears package manager cache
3. Installs the new version
4. Handles installation failures gracefully

### 4. **Build Metadata**
Each APK includes:
- Build timestamp
- Git commit hash
- Unique version identifiers

## 🛠️ Troubleshooting Installation Issues

### Issue: "App not installed - Package conflicts with existing package"
**Solution:** Use `npm run deploy` instead of manual installation.

### Issue: "Installation failed - Insufficient storage"
**Solution:** 
```bash
# Check available space
adb shell df /data

# Clear some space and retry
npm run install:clean
```

### Issue: "Package appears to be corrupt"
**Solution:**
```bash
# Clean rebuild
npm run build:android:clean
npm run install:clean
```

### Issue: "Installation failed - Unknown reason"
**Solution:**
```bash
# Force uninstall and retry
adb shell pm uninstall --user 0 com.world_bingo
adb shell pm uninstall com.world_bingo
npm run deploy
```

## 📱 Device Requirements

- Android device with USB debugging enabled
- ADB (Android Debug Bridge) installed
- Device connected via USB or network

## 🔍 Verification

After successful installation:
1. ✅ App launches without errors
2. ✅ Version number updated in app
3. ✅ No "package conflict" errors
4. ✅ Settings and data preserved (if upgrading)

## 🏗️ For Production

For production releases:
1. Generate a proper release keystore
2. Update signing config in `android/app/build.gradle`
3. Set environment variables for keystore passwords
4. Use `npm run build:android:clean` for final build

## 📋 Technical Details

### Version Code Formula
```
versionCode = (major * 100000000) + (minor * 1000000) + (patch * 10000) + timestamp
```

### Files Modified
- `android/app/build.gradle` - Version management and signing
- `package.json` - Build scripts
- `scripts/install-clean.sh` - Clean installation process
- `scripts/build-and-install.sh` - Complete deployment process

This system ensures that every build can be installed cleanly without package conflicts.