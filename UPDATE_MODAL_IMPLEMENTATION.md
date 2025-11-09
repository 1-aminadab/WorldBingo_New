# Update Modal - APK Download & Installation Implementation

## Overview
This document describes the implementation of the APK download and installation feature in the UpdateModal component for World_Bingo app.

## Features Implemented

### 1. **APK Download**
- Downloads APK from: `https://storage.googleapis.com/bingo-app-console/app-release.apk`
- Uses `react-native-fs` library for file system operations
- Downloads to the device's Downloads folder
- Shows real-time download progress with animated progress bar
- Handles download errors gracefully

### 2. **APK Installation**
- Automatic installation trigger after download completes
- Supports Android 7.0+ (API 24+) using FileProvider
- Supports older Android versions using direct file:// URIs
- Handles permission requests for Android 8.0+ (REQUEST_INSTALL_PACKAGES)
- Fallback to manual installation instructions if automatic installation fails

## Files Created/Modified

### React Native Files

#### 1. `src/components/ui/UpdateModal.tsx`
- Complete rewrite with APK download and installation functionality
- Uses `react-native-fs` for downloading APK
- Integrated with native ApkInstaller module for installation
- Uses `useGameTheme` hook for theming
- Added storage permission handling
- Improved error handling and user feedback

#### 2. `src/utils/ApkInstaller.ts` (NEW)
- TypeScript interface for the native ApkInstaller module
- Wrapper function `installApk()` that handles permission checks
- Provides clean API for APK installation from React Native code

### Android Native Files

#### 3. `android/app/src/main/java/com/world_bingo/ApkInstallerModule.kt` (NEW)
- Native module that handles APK installation
- Methods:
  - `installApk(filePath)`: Triggers APK installation using Android Intent
  - `canInstallPackages()`: Checks if app has permission to install packages
  - `requestInstallPermission()`: Opens settings to grant install permission
- Uses FileProvider for Android 7.0+ compatibility

#### 4. `android/app/src/main/java/com/world_bingo/ApkInstallerPackage.kt` (NEW)
- React Native package that registers the ApkInstaller module

#### 5. `android/app/src/main/java/com/world_bingo/MainApplication.kt`
- Added `ApkInstallerPackage()` to the packages list

### Android Configuration Files

#### 6. `android/app/src/main/AndroidManifest.xml`
- Added permissions:
  - `WRITE_EXTERNAL_STORAGE` (for Android < 13)
  - `READ_EXTERNAL_STORAGE` (for Android < 13)
  - `REQUEST_INSTALL_PACKAGES` (for Android 8.0+)
- Added FileProvider configuration for secure file sharing

#### 7. `android/app/src/main/res/xml/file_paths.xml` (NEW)
- FileProvider configuration file
- Defines accessible paths for file sharing:
  - External Downloads directory
  - App's external files directory
  - App's cache directory

#### 8. `App.tsx`
- Added import for UpdateModal
- Integrated UpdateModal in the component tree
- Modal appears on app launch (for testing, can be disabled)

## Dependencies Added

```json
{
  "react-native-fs": "^2.20.0"
}
```

## How It Works

### Download Flow
1. User clicks "Update Now" button
2. App requests storage permissions (if needed)
3. Downloads APK to `{DownloadDirectoryPath}/WorldBingo-update.apk`
4. Shows progress bar with percentage
5. On completion, shows "Install Now" button

### Installation Flow
1. User clicks "Install Now" button
2. App checks if it has permission to install packages
3. If no permission (Android 8.0+):
   - Opens system settings to grant permission
   - Shows error message instructing user
4. If permission granted:
   - Uses FileProvider to get content:// URI (Android 7.0+)
   - Or uses file:// URI (older versions)
   - Launches Android's package installer
5. User follows Android system prompts to complete installation

## Permissions Required

### Runtime Permissions
- **WRITE_EXTERNAL_STORAGE**: Required on Android 6.0-12 to write to Downloads folder
- **REQUEST_INSTALL_PACKAGES**: Required on Android 8.0+ to install APKs

### Manifest Permissions
All permissions are declared in AndroidManifest.xml

## Testing Instructions

### Prerequisites
1. Dependencies are already installed via `yarn add react-native-fs`
2. Build the Android app: `cd android && ./gradlew clean && cd ..`
3. Run the app: `yarn android` or `npx react-native run-android`

### Test Scenarios

#### 1. Test Download
- Open the app (UpdateModal appears automatically)
- Click "Update Now"
- Verify download progress shows correctly
- Verify APK is downloaded to Downloads folder

#### 2. Test Installation (Android 8.0+)
- Complete download
- Click "Install Now"
- If first time: Grant "Install from Unknown Sources" permission
- Verify Android installer opens with the APK

#### 3. Test Installation (Android 7.0+)
- Verify FileProvider is used (no permission errors)
- Verify installation works smoothly

#### 4. Test Error Handling
- Disconnect internet and try download
- Verify error message appears
- Try installation without downloaded file
- Verify appropriate error message

## Configuration Options

### Testing Mode
In `UpdateModal.tsx`, you can control the test behavior:

```typescript
const forceShowForTesting = true; // Set to false in production
const isMandatoryUpdate = false; // Set to true to test mandatory updates
const latestVersion = '1.2.0'; // Change version for different scenarios
```

### Disabling Test Mode
To disable the modal from showing automatically:

```typescript
const forceShowForTesting = false;
```

Or remove the `<UpdateModal />` from `App.tsx` after testing.

## Known Limitations

1. **iOS Support**: APK installation is Android-only. iOS version would need completely different approach using App Store or TestFlight.

2. **Auto-Installation**: Cannot automatically install APK without user interaction due to Android security restrictions. User must click through system installer prompts.

3. **Background Downloads**: Downloads happen in foreground. For large files, consider implementing background download service.

4. **Download Resumption**: Currently, if download fails, it restarts from beginning. Consider implementing resume capability for large files.

## Troubleshooting

### FileProvider Error
If you get "Failed to find configured root" error:
- Verify `file_paths.xml` exists in `res/xml/`
- Verify FileProvider is declared in AndroidManifest.xml
- Check that authority matches package name

### Permission Denied Errors
- Ensure all permissions are in AndroidManifest.xml
- For Android 6.0+, ensure runtime permissions are requested
- For Android 8.0+, ensure user has granted "Install Unknown Apps" permission

### Module Not Found Error
If ApkInstaller module is not found:
- Verify `ApkInstallerPackage` is added to `MainApplication.kt`
- Rebuild the app completely: `cd android && ./gradlew clean && cd ..`
- Clear React Native cache: `npx react-native start --reset-cache`

### Build Errors
If you encounter build errors:
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Integration with Existing Update System

World_Bingo already has:
- `UpdateGuard` component
- Version checking system with `versionStore`

This new UpdateModal provides:
- Direct APK download functionality
- Automatic installation capability
- Better user experience with progress tracking

You can integrate both systems by:
1. Using `UpdateGuard` for version checking
2. Triggering the new `UpdateModal` when update is needed
3. Or use the new modal standalone (as currently implemented)

## Future Enhancements

1. **Background Downloads**: Implement using Android WorkManager
2. **Download Resumption**: Support pausing and resuming downloads
3. **Version Verification**: Verify APK signature before installation
4. **Automatic Version Checking**: Check for updates on app launch from backend API
5. **Delta Updates**: Only download changed parts of APK for faster updates
6. **Notification Support**: Show download progress in notification bar
7. **Integration with versionStore**: Connect with existing version management system

## Security Considerations

1. **HTTPS Only**: APK URL uses HTTPS
2. **Signature Verification**: Consider adding APK signature verification
3. **Secure Storage**: APK is stored in public Downloads folder - consider using app-specific directory for sensitive builds
4. **Permission Scope**: Uses scoped storage on Android 10+ for better security

## References

- [React Native FS Documentation](https://github.com/itinance/react-native-fs)
- [Android FileProvider Guide](https://developer.android.com/reference/androidx/core/content/FileProvider)
- [REQUEST_INSTALL_PACKAGES Permission](https://developer.android.com/reference/android/Manifest.permission#REQUEST_INSTALL_PACKAGES)
- [Lucide React Native Icons](https://lucide.dev/guide/packages/lucide-react-native)


