import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  StatusBar,
  Platform,
  PermissionsAndroid,
  Linking,
  ImageBackground,
} from 'react-native';
import { Download, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useGameTheme } from './ThemeProvider';
import RNFS from 'react-native-fs';
import { installApk, installApkWithConflictHandling, getPackageInfo, uninstallCurrentApp } from '../../utils/ApkInstaller';
import { useVersionStore } from '../../store/versionStore';
import { fileApiService } from '../../api/services';
import { getAppVersion, isUpdateNeeded, logAppVersion } from '../../utils/appVersion';

interface UpdateModalProps {
  onClose?: () => void;
}

interface UpdateInfo {
  title: string;
  description: string;
  version: string;
  apk: string;
  forced: boolean;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ onClose }) => {
  // Get current app version from package.json (bundled with app)
  const localVersion = getAppVersion();
  const forceShowForTesting = false; // Set to false in production
  
  const [showModal, setShowModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isInstallReady, setIsInstallReady] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { theme } = useGameTheme();
  const { width, height } = Dimensions.get('window');
  const { dismissUpdateModal, completeUpdate, clearVersionCache } = useVersionStore();
  
  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(300)).current; // Start from bottom
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Fetch update information from API
  const fetchUpdateInfo = async (): Promise<UpdateInfo | null> => {
    try {
      console.log('🔍 [UPDATE] Starting to fetch update info from backend...');
      console.log('🔍 [UPDATE] URL:', 'https://storage.googleapis.com/bingo-app-console/app-release.json');
      
      const response = await fetch('https://storage.googleapis.com/bingo-app-console/app-release.json');
      
      console.log('🔍 [UPDATE] Response status:', response.status);
      console.log('🔍 [UPDATE] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: UpdateInfo = await response.json();
      
      console.log('✅ [UPDATE] Fetched update info successfully:', data);
      console.log('✅ [UPDATE] APK URL from backend:', data.apk);
      console.log('✅ [UPDATE] Version:', data.version);
      console.log('✅ [UPDATE] Forced update:', data.forced);
      
      return data;
    } catch (error) {
      console.error('❌ [UPDATE] Failed to fetch update info:', error);
      setError('Failed to check for updates');
      return null;
    }
  };

  // Log app version info on component mount
  React.useEffect(() => {
    logAppVersion();
  }, []);

  // Check for updates using fetched data
  const checkForUpdates = async () => {
    console.log('🚀 [UPDATE] Starting update check process...');
    console.log('🚀 [UPDATE] Local app version:', localVersion);
    console.log('🚀 [UPDATE] Force show for testing:', forceShowForTesting);
    
    setIsLoading(true);
    const updateData = await fetchUpdateInfo();
    
    if (!updateData) {
      console.log('❌ [UPDATE] No update data received, stopping update check');
      setIsLoading(false);
      return;
    }
    
    console.log('📦 [UPDATE] Setting update info in state:', updateData);
    setUpdateInfo(updateData);
    
    // For testing UI - always show modal when forceShowForTesting is true
    if (forceShowForTesting) {
      console.log('🧪 [UPDATE] Force showing modal for testing');
      setShowModal(true);
      showModalWithAnimation();
      setIsLoading(false);
      return;
    }
    
    const needsUpdate = isUpdateNeeded(updateData.version);
    
    if (needsUpdate) {
      // Update needed - show modal
      console.log('✅ [UPDATE] Update needed, showing modal');
      setShowModal(true);
      showModalWithAnimation();
    } else {
      console.log('ℹ️ [UPDATE] No update needed - app is up to date');
    }
    
    setIsLoading(false);
    console.log('🏁 [UPDATE] Update check process completed');
  };

  // Show modal with animations
  const showModalWithAnimation = () => {
    
    // Animate modal entrance from bottom
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalTranslateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Hide modal with animations - prevent hiding for forced updates
  const hideModalWithAnimation = () => {
    // Never hide forced update modal
    if (updateInfo?.forced) {
      console.log('🔒 [MODAL] Cannot hide forced update modal');
      return;
    }
    
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModal(false);
      setIsDownloading(false);
      setDownloadProgress(0);
      setIsInstallReady(false);
    });
  };

  useEffect(() => {
    // Check for updates when component mounts (app launch)
    checkForUpdates();
  }, []);

  // Check if app was actually updated (for forced updates)
  useEffect(() => {
    if (updateInfo?.forced && showModal) {
      const checkIfUpdated = () => {
        const currentAppVersion = getAppVersion();
        console.log('🔍 [VERSION CHECK] Current app version:', currentAppVersion);
        console.log('🔍 [VERSION CHECK] Required version:', updateInfo.version);
        
        // Only hide modal if the current version is greater than or equal to required version
        if (!isUpdateNeeded(updateInfo.version)) {
          console.log('✅ [VERSION CHECK] App has been updated successfully - allowing modal to close');
          setShowModal(false);
          completeUpdate();
          clearVersionCache();
        } else {
          console.log('⏳ [VERSION CHECK] App still needs update - keeping modal open');
        }
      };

      // Check immediately and then every 2 seconds
      checkIfUpdated();
      const interval = setInterval(checkIfUpdated, 2000);
      
      return () => clearInterval(interval);
    }
  }, [updateInfo, showModal, completeUpdate, clearVersionCache]);

  const [downloadedFilePath, setDownloadedFilePath] = useState<string>('');

  // Request storage permissions (Android 6.0+)
  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      if (Platform.Version >= 33) {
        // Android 13+ doesn't need storage permission for app-specific directory
        return true;
      } else if (Platform.Version >= 23) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to download updates',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

  // Download APK file with comprehensive logging
  const handleUpdate = async () => {
    console.log('🚀 [UPDATE] ===== STARTING UPDATE DOWNLOAD PROCESS =====');
    
    if (!updateInfo?.apk) {
      console.log('❌ [UPDATE] No APK URL available in updateInfo:', updateInfo);
      Alert.alert('Error', 'Download URL not available');
      return;
    }

    console.log('📦 [UPDATE] Update info:', updateInfo);
    console.log('📦 [UPDATE] APK URL:', updateInfo.apk);

    try {
      console.log('🔐 [UPDATE] Requesting storage permissions...');
      
      // Request permissions first
      const hasPermission = await requestStoragePermission();
      console.log('🔐 [UPDATE] Storage permission granted:', hasPermission);
      
      if (!hasPermission) {
        console.log('❌ [UPDATE] Storage permission denied');
        Alert.alert(
          'Permission Denied',
          'Storage permission is required to download the update.',
        );
        return;
      }

      console.log('📥 [UPDATE] Starting download process...');
      console.log('📥 [UPDATE] Setting UI state: downloading=true, progress=0');
      
      setIsDownloading(true);
      setDownloadProgress(0);
      progressWidth.setValue(0);

      // Use RNFS for reliable React Native download with progress tracking
      console.log('🔽 [UPDATE] Starting RNFS download (simple approach)...');
      
      // Try multiple download paths to find one that works
      // Prioritize app internal directories where we have guaranteed write access
      const possiblePaths = [
        RNFS.DocumentDirectoryPath,  // App's internal document directory (most reliable)
        RNFS.CachesDirectoryPath,    // App's cache directory  
        RNFS.ExternalDirectoryPath,  // App's external directory
        RNFS.DownloadDirectoryPath,  // System download directory (least reliable)
      ];

      console.log('🔽 [UPDATE] Checking available download paths:', possiblePaths);

      let downloadDir = null;
      for (const path of possiblePaths) {
        try {
          if (path && path !== null && path !== undefined) {
            console.log(`🔍 [UPDATE] Testing path: ${path}`);
            
            const dirExists = await RNFS.exists(path);
            console.log(`🔽 [UPDATE] Path ${path} exists: ${dirExists}`);
            
            if (!dirExists) {
              console.log(`🔽 [UPDATE] Creating directory: ${path}`);
              await RNFS.mkdir(path);
              console.log(`✅ [UPDATE] Directory created successfully: ${path}`);
            }
            
            // Test write access with a unique filename
            const testFile = `${path}/test-write-${Date.now()}.tmp`;
            console.log(`🧪 [UPDATE] Testing write access with file: ${testFile}`);
            
            await RNFS.writeFile(testFile, 'test-content', 'utf8');
            console.log(`✅ [UPDATE] Write test successful`);
            
            await RNFS.unlink(testFile);
            console.log(`✅ [UPDATE] Cleanup successful`);
            
            downloadDir = path;
            console.log(`✅ [UPDATE] Using download directory: ${downloadDir}`);
            break;
          } else {
            console.log(`❌ [UPDATE] Path is null/undefined: ${path}`);
          }
        } catch (error) {
          console.log(`❌ [UPDATE] Path ${path} not accessible:`, error.message);
          console.log(`❌ [UPDATE] Full error:`, error);
        }
      }

      if (!downloadDir) {
        throw new Error('No accessible download directory found');
      }
      
      // Define download path
      const downloadDest = `${downloadDir}/WorldBingo-update.apk`;
      console.log('🔽 [UPDATE] Final download destination:', downloadDest);
      
      // Delete old APK if exists
      const fileExists = await RNFS.exists(downloadDest);
      console.log('🔽 [UPDATE] File exists at destination:', fileExists);
      
      if (fileExists) {
        console.log('🔽 [UPDATE] Removing existing file...');
        await RNFS.unlink(downloadDest);
      }

      // Skip backend logging for now to avoid fetch issues
      console.log('📊 [UPDATE] Skipping backend logging to avoid fetch issues...');
      console.log('📊 [UPDATE] Download details for manual logging:', {
        url: updateInfo.apk,
        filename: `WorldBingo-${updateInfo.version}.apk`,
        timestamp: new Date().toISOString(),
      });

      // Download options for RNFS
      const downloadOptions = {
        fromUrl: updateInfo.apk,
        toFile: downloadDest,
        background: true,
        discretionary: true,
        progress: (res: any) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          const clampedProgress = Math.min(progress, 100);
          
          console.log(`📥 [UPDATE] RNFS Download progress: ${clampedProgress.toFixed(1)}% (${(res.bytesWritten / (1024 * 1024)).toFixed(2)}MB / ${(res.contentLength / (1024 * 1024)).toFixed(2)}MB)`);
          
          setDownloadProgress(clampedProgress);
          
          // Animate progress bar
          Animated.timing(progressWidth, {
            toValue: clampedProgress,
            duration: 100,
            useNativeDriver: false,
          }).start();
        },
      };

      console.log('🔽 [UPDATE] Starting RNFS download with options:', downloadOptions);

      // Start download using RNFS
      console.log('🚀 [UPDATE] Starting RNFS download...');
      const result = await RNFS.downloadFile(downloadOptions).promise;

      console.log('🔽 [UPDATE] RNFS download result:', result);
      console.log('🔽 [UPDATE] Result status code:', result.statusCode);
      console.log('🔽 [UPDATE] Result job ID:', result.jobId);
      console.log('🔽 [UPDATE] Result bytes written:', result.bytesWritten);

      if (result.statusCode === 200) {
        console.log('✅ [UPDATE] Download completed successfully:', downloadDest);
        
        // Ensure progress is at 100%
        setDownloadProgress(100);
        Animated.timing(progressWidth, {
          toValue: 100,
          duration: 300,
          useNativeDriver: false,
        }).start();

        // Get file stats
        const fileStats = await RNFS.stat(downloadDest);
        console.log('📊 [UPDATE] Downloaded file stats:', {
          path: downloadDest,
          size: `${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`,
          version: updateInfo.version,
        });

        // Use FileProvider for installation directly from internal storage
        console.log('📱 [UPDATE] Using direct installation from internal storage with FileProvider...');
        console.log('📱 [UPDATE] Installation path:', downloadDest);
        
        setDownloadedFilePath(downloadDest);
        setIsDownloading(false);
        setIsInstallReady(true);
      } else {
        throw new Error(`Download failed with status code: ${result.statusCode}`);
      }

    } catch (error: any) {
      console.error('❌ APK download error:', error);
      setIsDownloading(false);
      
      // Reset progress bar
      setDownloadProgress(0);
      progressWidth.setValue(0);
      
      Alert.alert(
        'Download Failed',
        `Failed to download the update: ${error.message || 'Unknown error'}. Please check your internet connection and try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleInstall = async () => {
    try {
      if (Platform.OS !== 'android') {
        Alert.alert('Not Supported', 'APK installation is only available on Android.');
        return;
      }

      if (!downloadedFilePath) {
        Alert.alert('Error', 'No file downloaded to install.');
        return;
      }

      console.log('📱 [INSTALL] Installing APK from:', downloadedFilePath);

      // Check if file exists
      const fileExists = await RNFS.exists(downloadedFilePath);
      if (!fileExists) {
        Alert.alert('Error', 'Downloaded file not found. Please try downloading again.');
        return;
      }

      // Get current package info for debugging (optional)
      try {
        const packageInfo = await getPackageInfo();
        console.log('📱 [INSTALL] Current app info:', packageInfo);
      } catch (e) {
        console.log('📱 [INSTALL] Could not get package info (non-critical):', e.message);
      }

      // Try direct installation first
      console.log('📱 [INSTALL] Attempting direct installation...');
      await installApk(downloadedFilePath);
      
      // For forced updates, NEVER close the modal - only close for non-forced updates
      if (!updateInfo?.forced) {
        setTimeout(() => {
          hideModalWithAnimation();
          completeUpdate(); // Mark update as completed to hide floating button
          
          // Clear any cached version data to ensure fresh version check on next app launch
          clearVersionCache();
          console.log('✅ [INSTALL] Installation triggered successfully');
          console.log('✅ [INSTALL] Version cache cleared for fresh detection on restart');
          console.log('✅ [INSTALL] Update will be effective after app restart');
          
          onClose?.();
        }, 500);
      } else {
        console.log('🔒 [INSTALL] Forced update - keeping modal open until app restarts');
        // For forced updates, the modal will only close when the app restarts with the new version
        // The UpdateGuard will check the version and hide the modal only if version is updated
      }

    } catch (error: any) {
      console.error('❌ [INSTALL] Installation error:', error);
      
      // For forced updates, NEVER close the modal even on error
      if (updateInfo?.forced) {
        console.log('🔒 [INSTALL] Forced update installation failed - keeping modal open');
      }
      
      // Check for common installation issues
      const errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.includes('conflict') || 
          errorMessage.includes('existing package') ||
          errorMessage.includes('signatures do not match') ||
          errorMessage.includes('version') ||
          errorMessage.includes('incompatible')) {
        // Package conflict or version incompatibility issue
        Alert.alert(
          'Installation Conflict',
          updateInfo?.forced 
            ? 'Cannot install because of a version or compatibility conflict. You must resolve this to continue using the app.\n\nThis usually happens when:\n• App was installed from a different source\n• Different signing keys are used\n• Version incompatibility\n\nSolutions:'
            : 'Cannot install because of a version or compatibility conflict.\n\nThis usually happens when:\n• App was installed from a different source\n• Different signing keys are used\n• Version incompatibility\n\nSolutions:',
          [
            {
              text: 'Uninstall & Reinstall',
              onPress: () => handleUninstallAndReinstall(),
            },
            {
              text: 'Manual Install Guide',
              onPress: () => showManualInstallInstructions(),
            },
            ...(updateInfo?.forced ? [] : [{ text: 'Cancel', style: 'cancel' as const }])
          ]
        );
      } else if (errorMessage.includes('permission')) {
        // Permission issue
        Alert.alert(
          'Permission Required',
          updateInfo?.forced 
            ? 'Permission to install apps is required to continue using the app. Please grant permission and try again.'
            : 'Please grant permission to install apps from unknown sources, then try again.',
          [{ text: 'OK' }]
        );
      } else {
        // Generic installation error
        Alert.alert(
          'Installation Failed',
          updateInfo?.forced
            ? `Critical update installation failed. You must install this update to continue using the app.\n\nError: ${errorMessage}\n\nPlease try the manual installation method.`
            : `Could not install the update automatically.\n\nError: ${errorMessage}\n\nYou can install manually using the downloaded APK file.`,
          [
            {
              text: 'Manual Install Guide',
              onPress: () => showManualInstallInstructions(),
            },
            ...(updateInfo?.forced ? [] : [{ text: 'OK' }])
          ]
        );
      }
    }
  };

  const handleUninstallAndReinstall = () => {
    Alert.alert(
      'Uninstall Current App',
      'This will uninstall the current version of the app. After uninstalling, you can manually install the new APK from your Downloads folder.\n\nNote: You will lose any unsaved data.',
      [
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: async () => {
            try {
              await uninstallCurrentApp();
            } catch (error) {
              console.error('Uninstall failed:', error);
              showManualInstallInstructions();
            }
          },
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const showManualInstallInstructions = () => {
    Alert.alert(
      'Manual Installation Guide',
      `Follow these steps to install manually:\n\n1. Go to Settings > Apps > World Bingo\n2. Tap "Uninstall" to remove current version\n3. Open your file manager\n4. Navigate to the downloaded APK file\n5. Tap the APK file to install\n\n📁 File saved at:\n${downloadedFilePath}`,
      [
        {
          text: 'Try Opening File',
          onPress: () => openDownloadsFolder(),
        },
        { text: 'Got It' }
      ]
    );
  };

  const openDownloadsFolder = async () => {
    try {
      // Try to open file manager to Downloads folder
      await Linking.openURL('content://com.android.externalstorage.documents/root/primary/Download');
    } catch (e) {
      console.log('Could not open file manager:', e);
      // Fallback - try to open the file directly
      try {
        await Linking.openURL(`file://${downloadedFilePath}`);
      } catch (e2) {
        console.log('Could not open file directly:', e2);
      }
    }
  };

  const handleLater = () => {
    if (!updateInfo?.forced) {
      hideModalWithAnimation();
      dismissUpdateModal(); // Hide modal but keep update available for floating button
      onClose?.();
    }
    // For forced updates, do nothing - modal cannot be closed
  };

  // Helper function to view download logs (for debugging)
  const viewDownloadLogs = async () => {
    try {
      const logsResponse = await fileApiService.getDownloadLogs({
        limit: 10, // Get last 10 downloads
      });
      
      if (logsResponse.success && logsResponse.data?.logs) {
        console.log('📋 Recent download logs:', logsResponse.data.logs);
        console.log('📊 Download statistics:', fileApiService.getDownloadStatistics());
        
        // You could show this in a modal or export it
        Alert.alert(
          'Download Logs',
          `Found ${logsResponse.data.logs.length} recent downloads. Check console for details.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to get download logs:', error);
    }
  };

  // Test function for APK download (for development/testing)
  const testApkDownload = async () => {
    const testUrl = 'https://storage.googleapis.com/bingo-app-console/app-release.apk';
    
    try {
      console.log('🧪 Testing APK download with logging...');
      
      const downloadResponse = await fileApiService.downloadFile({
        url: testUrl,
        filename: 'test-download.apk',
        onProgress: (progress: number, downloadedBytes: number, totalBytes: number) => {
          console.log(`🧪 Test progress: ${progress.toFixed(1)}% (${(downloadedBytes / (1024 * 1024)).toFixed(2)}MB / ${(totalBytes / (1024 * 1024)).toFixed(2)}MB)`);
        },
      });
      
      if (downloadResponse.success) {
        console.log('✅ Test download successful:', downloadResponse);
        
        // Show download statistics
        const stats = fileApiService.getDownloadStatistics();
        console.log('📊 Download statistics after test:', stats);
        
        Alert.alert(
          'Test Successful',
          `APK download test completed successfully!\n\nFile size: ${(downloadResponse.data?.file?.size || 0 / (1024 * 1024)).toFixed(2)} MB\n\nCheck console for detailed logs.`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(downloadResponse.message || 'Test download failed');
      }
    } catch (error: any) {
      console.error('❌ Test download failed:', error);
      Alert.alert(
        'Test Failed',
        `APK download test failed: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  if (!showModal || !updateInfo) return null;

  return (
    <Modal
      visible={showModal}
      transparent
      statusBarTranslucent
      onRequestClose={updateInfo?.forced ? () => {} : handleLater}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.8)" barStyle="light-content" />
      
      {/* Fullscreen background with image */}
      <ImageBackground 
        source={require('../../assets/images/update-available-bg.jpg')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        }}
        resizeMode="cover"
      >
        <Animated.View 
          style={[
            {
              flex: 1,
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingBottom: 50,
            },
            { opacity: overlayOpacity }
          ]}
        >
          {/* Modal content without card background */}
          <Animated.View
            style={[
              {
                width: '100%',
                maxWidth: 380,
                overflow: 'hidden',
              },
              {
                opacity: modalOpacity,
                transform: [{ translateY: modalTranslateY }],
              },
            ]}
        >
            {/* Header with download icon */}
            <View
              style={{
                paddingVertical: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
          >
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Download size={48} color="white" />
            </View>
          </View>

            {/* Modal content */}
            <View style={{
              paddingHorizontal: 32,
              paddingTop: 24,
              paddingBottom: 40,
              alignItems: 'center',
            }}>
              {/* Title */}
              <Text style={{
                fontSize: 26,
                fontWeight: 'bold',
                color: '#ffffff',
                textAlign: 'center',
                marginBottom: 16,
                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
                lineHeight: 32,
              }}>
              {updateInfo?.forced ? 'Required Update' : (updateInfo?.title || 'Update Available')}
            </Text>

              {/* Description */}
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.85)',
                textAlign: 'center',
                lineHeight: 24,
                marginBottom: 32,
                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
                paddingHorizontal: 8,
              }}>
              {updateInfo?.description || (updateInfo?.forced 
                ? 'This update contains critical security improvements and is required to continue using the app.'
                : 'A new version is available with exciting features, improvements, and bug fixes.')
              }
            </Text>

            {/* Download progress */}
            {isDownloading && (
              <View style={{
                alignSelf: 'stretch',
                marginBottom: 24,
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: 15,
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: 16,
                  textAlign: 'center',
                  textShadowColor: 'rgba(0, 0, 0, 0.8)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}>
                  Downloading update... {Math.round(downloadProgress)}%
                </Text>
                <View style={{
                  alignSelf: 'stretch',
                }}>
                  <View style={{
                    height: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}>
                    <Animated.View
                      style={{
                        height: '100%',
                        backgroundColor: '#7BC4FF',
                        borderRadius: 8,
                        shadowColor: '#7BC4FF',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 4,
                        elevation: 4,
                        width: progressWidth.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                          extrapolate: 'clamp',
                        }),
                      }}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Success state */}
            {isInstallReady && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 24,
                backgroundColor: '#f0f9f0',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
              }}>
                <CheckCircle size={24} color="#4caf50" />
                <Text style={{
                  fontSize: 15,
                  color: '#4caf50',
                  fontWeight: '600',
                  marginLeft: 8,
                }}>
                  Download completed successfully!
                </Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={{
              alignSelf: 'stretch',
              gap: 12,
            }}>
              {isInstallReady ? (
                <TouchableOpacity
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    shadowColor: theme.colors.primary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 12,
                  }}
                  onPress={handleInstall}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      backgroundColor: '#2563eb', // Beautiful blue color
                      paddingVertical: 16,
                      paddingHorizontal: 24,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <AlertCircle size={20} color="white" />
                    <Text style={{
                      color: 'white',
                      fontSize: 17,
                      fontWeight: 'bold',
                    }}>Install Now</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={{
                      borderRadius: 24,
                      overflow: 'hidden',
                      shadowColor: '#1d4ed8',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.5,
                      shadowRadius: 16,
                      elevation: 16,
                      opacity: isDownloading ? 0.7 : 1,
                      width: '100%',
                    }}
                    onPress={handleUpdate}
                    disabled={isDownloading}
                    activeOpacity={0.8}
                  >
                    <View
                      style={{
                        backgroundColor: isDownloading ? '#64748b' : '#1d4ed8',
                        paddingVertical: 18,
                        paddingHorizontal: 32,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Shine effect overlay */}
                      <View
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: -50,
                          width: 50,
                          height: '100%',
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                          transform: [{ skewX: '-20deg' }],
                        }}
                      />
                      <View
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }}
                      />
                      <Text style={{
                        color: 'white',
                        fontSize: 18,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}>
                        {isDownloading ? 'Downloading...' : 'Update Now!'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {!updateInfo?.forced && !isDownloading && (
                    <TouchableOpacity
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        alignItems: 'center',
                      }}
                      onPress={handleLater}
                      activeOpacity={0.8}
                    >
                      <Text style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: 16,
                        fontWeight: '600',
                      }}>Later</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </ImageBackground>
    </Modal>
  );
};

export default UpdateModal;
