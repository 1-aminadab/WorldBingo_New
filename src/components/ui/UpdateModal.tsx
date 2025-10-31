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
import { installApk } from '../../utils/ApkInstaller';
import { useVersionStore } from '../../store/versionStore';

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
  // Get current app version (you might want to get this from your app config)
  const localVersion = '1.0.0';
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
  const { dismissUpdateModal, completeUpdate } = useVersionStore();
  
  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(300)).current; // Start from bottom
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Fetch update information from API
  const fetchUpdateInfo = async (): Promise<UpdateInfo | null> => {
    try {
      const response = await fetch('https://storage.googleapis.com/bingo-app-console/app-release.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: UpdateInfo = await response.json();
      console.log('Fetched update info:', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch update info:', error);
      setError('Failed to check for updates');
      return null;
    }
  };

  // Version comparison logic
  const compareVersions = (current: string, latest: string): number => {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (currentPart < latestPart) return -1;
      if (currentPart > latestPart) return 1;
    }
    return 0;
  };

  // Check for updates using fetched data
  const checkForUpdates = async () => {
    setIsLoading(true);
    const updateData = await fetchUpdateInfo();
    
    if (!updateData) {
      setIsLoading(false);
      return;
    }
    
    setUpdateInfo(updateData);
    
    // For testing UI - always show modal when forceShowForTesting is true
    if (forceShowForTesting) {
      setShowModal(true);
      showModalWithAnimation();
      setIsLoading(false);
      return;
    }
    
    const versionComparison = compareVersions(localVersion, updateData.version);
    
    if (versionComparison < 0) {
      // Update needed - show modal
      setShowModal(true);
      showModalWithAnimation();
    }
    
    setIsLoading(false);
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

  // Hide modal with animations
  const hideModalWithAnimation = () => {
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

  // Download APK file
  const handleUpdate = async () => {
    if (!updateInfo?.apk) {
      Alert.alert('Error', 'Download URL not available');
      return;
    }

    try {
      // Request permissions first
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Storage permission is required to download the update.',
        );
        return;
      }

      setIsDownloading(true);
      setDownloadProgress(0);
      progressWidth.setValue(0);

      // Define download path
      const downloadDest = `${RNFS.DownloadDirectoryPath}/WorldBingo-update.apk`;
      
      // Delete old APK if exists
      const fileExists = await RNFS.exists(downloadDest);
      if (fileExists) {
        await RNFS.unlink(downloadDest);
      }

      // Download options
      const options = {
        fromUrl: updateInfo.apk,
        toFile: downloadDest,
        background: true,
        discretionary: true,
        progress: (res: any) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          const clampedProgress = Math.min(progress, 100);
          
          setDownloadProgress(clampedProgress);
          
          // Animate progress bar
          Animated.timing(progressWidth, {
            toValue: clampedProgress,
            duration: 100,
            useNativeDriver: false,
          }).start();
        },
      };

      // Start download
      const result = await RNFS.downloadFile(options).promise;

      if (result.statusCode === 200) {
        console.log('Download completed successfully:', downloadDest);
        setDownloadedFilePath(downloadDest);
        setIsDownloading(false);
        setIsInstallReady(true);
      } else {
        throw new Error(`Download failed with status code: ${result.statusCode}`);
      }

    } catch (error) {
      console.error('Download error:', error);
      setIsDownloading(false);
      Alert.alert(
        'Download Failed',
        'Failed to download the update. Please check your internet connection and try again.',
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

      console.log('Installing APK from:', downloadedFilePath);

      // Check if file exists
      const fileExists = await RNFS.exists(downloadedFilePath);
      if (!fileExists) {
        Alert.alert('Error', 'Downloaded file not found. Please try downloading again.');
        return;
      }

      // Use the native module to install the APK
      await installApk(downloadedFilePath);
      
      // Close modal after triggering install and mark update as completed
      setTimeout(() => {
        hideModalWithAnimation();
        completeUpdate(); // Mark update as completed to hide floating button
        onClose?.();
      }, 500);

    } catch (error: any) {
      console.error('Installation error:', error);
      
      // Check if it's a permission error
      if (error.message && error.message.includes('permission')) {
        Alert.alert(
          'Permission Required',
          error.message,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Installation Error',
          'Could not start installation. Please manually install the APK from your Downloads folder (WorldBingo-update.apk).',
          [
            {
              text: 'Open Downloads',
              onPress: async () => {
                try {
                  // Try to open file manager to Downloads folder
                  await Linking.openURL('content://com.android.externalstorage.documents/root/primary/Download');
                } catch (e) {
                  console.log('Could not open file manager:', e);
                }
              }
            },
            { text: 'OK' }
          ]
        );
      }
    }
  };

  const handleLater = () => {
    if (!updateInfo?.forced) {
      hideModalWithAnimation();
      dismissUpdateModal(); // Hide modal but keep update available for floating button
      onClose?.();
    }
  };

  if (!showModal || !updateInfo) return null;

  return (
    <Modal
      visible={showModal}
      transparent
      statusBarTranslucent
      onRequestClose={!updateInfo?.forced ? handleLater : undefined}
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
