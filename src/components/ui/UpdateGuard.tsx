import React, { useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { useVersionStore } from '../../store/versionStore';
import { useGameTheme } from './ThemeProvider';
import { UpdateModal } from './UpdateModal';
import { FloatingUpdateButton } from './FloatingUpdateButton';
import { AlertTriangle } from 'lucide-react-native';

interface UpdateGuardProps {
  children: React.ReactNode;
}

export const UpdateGuard: React.FC<UpdateGuardProps> = ({ children }) => {
  const { theme } = useGameTheme();
  const { versionInfo, isUpdateAvailable, isUpdateDismissed, checkForUpdates } = useVersionStore();

  const isForceUpdate = versionInfo?.updateType === 'force';
  const shouldShowFloatingButton = isUpdateAvailable && !isForceUpdate;

  useEffect(() => {
    // Check for updates when component mounts
    checkForUpdates();

    // Handle back button for force updates
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isForceUpdate && isUpdateAvailable) {
        // Prevent back button from working during force update
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isForceUpdate, isUpdateAvailable, checkForUpdates]);

  // Show update modal if update is available and not dismissed (only for initial show)
  if (isUpdateAvailable && versionInfo && !isUpdateDismissed) {
    return (
      <>
        {isForceUpdate && (
          <View style={[styles.forceUpdateOverlay, { backgroundColor: theme.colors.background }]}>
            <View style={styles.forceUpdateContent}>
              <AlertTriangle size={48} color="#EF4444" />
              <Text style={[styles.forceUpdateTitle, { color: theme.colors.text }]}>
                Update Required
              </Text>
              <Text style={[styles.forceUpdateMessage, { color: theme.colors.textSecondary }]}>
                A critical update is available. Please update to continue using the app.
              </Text>
            </View>
          </View>
        )}
        <UpdateModal visible={isUpdateAvailable} />
        {/* Always show floating button when update is available */}
        {shouldShowFloatingButton && (
          <FloatingUpdateButton visible={shouldShowFloatingButton} />
        )}
      </>
    );
  }

  return (
    <>
      {children}
      {/* Always show floating button when update is available */}
      {shouldShowFloatingButton && (
        <FloatingUpdateButton visible={shouldShowFloatingButton} />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  forceUpdateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  forceUpdateContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  forceUpdateTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  forceUpdateMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
