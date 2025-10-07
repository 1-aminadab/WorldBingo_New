import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useVersionStore, UpdateType } from '../../store/versionStore';
import { useGameTheme } from './ThemeProvider';
import { Download, X, AlertTriangle, CheckCircle, Pause } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface UpdateModalProps {
  visible: boolean;
  onClose?: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ visible, onClose }) => {
  const { theme } = useGameTheme();
  const {
    versionInfo,
    downloadProgress,
    startDownload,
    retryDownload,
    cancelDownload,
    completeDownload,
    installUpdate,
    uninstallApp,
    dismissUpdate,
  } = useVersionStore();

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!versionInfo) return null;

  const isForceUpdate = versionInfo.updateType === 'force';
  const isDownloading = downloadProgress.isDownloading;
  const isCompleted = downloadProgress.progress === 100;
  const hasError = downloadProgress.hasError;

  const handleDownload = () => {
    if (isCompleted) {
      // Handle app installation
      handleInstallUpdate();
    } else if (hasError) {
      retryDownload();
    } else {
      startDownload();
    }
  };

  const handleInstallUpdate = async () => {
    try {
      Alert.alert(
        'Install Update',
        'The update will be installed automatically. The system will navigate to the installation file.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Install',
            onPress: async () => {
              try {
                await installUpdate();
                Alert.alert(
                  'Installation Started',
                  'The installation process has been initiated. Please follow the system prompts to complete the installation.',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert(
                  'Installation Failed',
                  'Failed to start installation. Please try again or install manually.',
                  [{ text: 'OK' }]
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Installation error:', error);
    }
  };

  const handleUninstallApp = () => {
    Alert.alert(
      'Uninstall App',
      'This will open the app settings where you can uninstall the current version. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: async () => {
            try {
              await uninstallApp();
              Alert.alert(
                'Uninstall',
                'App settings have been opened. Please uninstall the current version from there.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert(
                'Uninstall Failed',
                'Failed to open app settings. Please uninstall manually from device settings.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (isForceUpdate) {
      Alert.alert(
        'Update Required',
        'This update is mandatory and cannot be cancelled.',
        [{ text: 'OK' }]
      );
    } else {
      cancelDownload();
    }
  };

  const handleClose = () => {
    if (isForceUpdate) {
      Alert.alert(
        'Update Required',
        'This update is mandatory. You must update to continue using the app.',
        [{ text: 'OK' }]
      );
    } else {
      dismissUpdate();
      onClose?.();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUpdateIcon = () => {
    if (isCompleted) return <CheckCircle size={32} color="#10B981" />;
    if (hasError) return <AlertTriangle size={32} color="#EF4444" />;
    if (isDownloading) return <Download size={32} color={theme.colors.primary} />;
    if (isForceUpdate) return <AlertTriangle size={32} color="#EF4444" />;
    return <Download size={32} color={theme.colors.primary} />;
  };

  const getUpdateTitle = () => {
    if (isCompleted) return 'Update Downloaded';
    if (hasError) return 'Download Failed';
    if (isDownloading) return 'Downloading Update';
    if (isForceUpdate) return 'Update Required';
    return 'Update Available';
  };

  const getUpdateDescription = () => {
    if (isCompleted) return 'The update has been downloaded successfully. Tap install to update the app.';
    if (hasError) return downloadProgress.errorMessage || 'The download failed. Please check your internet connection and try again.';
    if (isDownloading) return `Downloading version ${versionInfo.latestVersion}...`;
    if (isForceUpdate) return 'A critical update is available. You must update to continue using the app.';
    return `A new version (${versionInfo.latestVersion}) is available with improvements and bug fixes.`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[theme.colors.surface, theme.colors.background]}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                {getUpdateIcon()}
              </View>
              {!isForceUpdate && (
                <TouchableOpacity
                  onPress={handleClose}
                  style={[styles.closeButton, { backgroundColor: theme.colors.border }]}
                >
                  <X size={20} color={theme.colors.text} />
                </TouchableOpacity>
              )}
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {getUpdateTitle()}
              </Text>
              
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                {getUpdateDescription()}
              </Text>

              {/* Version Info */}
              <View style={[styles.versionInfo, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.versionRow}>
                  <Text style={[styles.versionLabel, { color: theme.colors.textSecondary }]}>
                    Current Version:
                  </Text>
                  <Text style={[styles.versionValue, { color: theme.colors.text }]}>
                    {versionInfo.currentVersion}
                  </Text>
                </View>
                <View style={styles.versionRow}>
                  <Text style={[styles.versionLabel, { color: theme.colors.textSecondary }]}>
                    Latest Version:
                  </Text>
                  <Text style={[styles.versionValue, { color: theme.colors.primary }]}>
                    {versionInfo.latestVersion}
                  </Text>
                </View>
                {versionInfo.fileSize && (
                  <View style={styles.versionRow}>
                    <Text style={[styles.versionLabel, { color: theme.colors.textSecondary }]}>
                      Size:
                    </Text>
                    <Text style={[styles.versionValue, { color: theme.colors.text }]}>
                      {formatFileSize(versionInfo.fileSize)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Release Notes */}
              {versionInfo.releaseNotes && (
                <View style={[styles.releaseNotes, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.releaseNotesTitle, { color: theme.colors.text }]}>
                    What's New
                  </Text>
                  <Text style={[styles.releaseNotesText, { color: theme.colors.textSecondary }]}>
                    {versionInfo.releaseNotes}
                  </Text>
                </View>
              )}

              {/* Download Progress */}
              {isDownloading && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressText, { color: theme.colors.text }]}>
                      Downloading... {Math.round(downloadProgress.progress)}%
                    </Text>
                    <Text style={[styles.progressSize, { color: theme.colors.textSecondary }]}>
                      {formatFileSize(downloadProgress.downloadedBytes)} / {formatFileSize(downloadProgress.totalBytes)}
                    </Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${downloadProgress.progress}%`,
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {isDownloading && downloadProgress.canCancel && (
                <TouchableOpacity
                  onPress={handleCancel}
                  style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                >
                  <Pause size={20} color={theme.colors.text} />
                  <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                onPress={handleDownload}
                style={[
                  styles.updateButton,
                  {
                    backgroundColor: isCompleted ? '#10B981' : hasError ? '#EF4444' : theme.colors.primary,
                    flex: (isDownloading && downloadProgress.canCancel) || isCompleted ? 0.7 : 1,
                  },
                ]}
              >
                <Download size={20} color="#fff" />
                <Text style={styles.updateButtonText}>
                  {isCompleted ? 'Install Update' : hasError ? 'Retry Download' : isDownloading ? 'Downloading...' : 'Update Now'}
                </Text>
              </TouchableOpacity>

              {isCompleted && (
                <TouchableOpacity
                  onPress={handleUninstallApp}
                  style={[styles.uninstallButton, { borderColor: '#EF4444' }]}
                >
                  <X size={20} color="#EF4444" />
                  <Text style={[styles.uninstallButtonText, { color: '#EF4444' }]}>
                    Uninstall
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Force Update Notice */}
            {isForceUpdate && (
              <View style={[styles.forceNotice, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <AlertTriangle size={16} color="#EF4444" />
                <Text style={[styles.forceNoticeText, { color: '#DC2626' }]}>
                  This update is mandatory and cannot be skipped.
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: height * 0.8,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  versionInfo: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  releaseNotes: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  releaseNotesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  releaseNotesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressSize: {
    fontSize: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  uninstallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    flex: 0.3,
  },
  uninstallButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  forceNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  forceNoticeText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});
