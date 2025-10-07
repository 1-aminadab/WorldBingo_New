import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useVersionStore, VersionInfo } from '../../store/versionStore';
import { useGameTheme } from './ThemeProvider';
import { Download, RefreshCw } from 'lucide-react-native';

export const VersionTestButton: React.FC = () => {
  const { theme } = useGameTheme();
  const { setVersionInfo, checkForUpdates, isCheckingForUpdates } = useVersionStore();

  const simulateRecommendedUpdate = () => {
    const mockVersionInfo: VersionInfo = {
      currentVersion: '1.0.0',
      latestVersion: '1.1.0',
      updateType: 'recommended',
      releaseNotes: '• New BINGO patterns added\n• Improved voice calling\n• Bug fixes and performance improvements\n• Enhanced UI animations',
      downloadUrl: 'https://example.com/update.apk',
      fileSize: 25 * 1024 * 1024, // 25MB
    };
    
    setVersionInfo(mockVersionInfo);
  };

  const simulateForceUpdate = () => {
    const mockVersionInfo: VersionInfo = {
      currentVersion: '1.0.0',
      latestVersion: '1.2.0',
      updateType: 'force',
      releaseNotes: '• Critical security updates\n• New game modes\n• Performance optimizations\n• UI improvements',
      downloadUrl: 'https://example.com/update.apk',
      fileSize: 30 * 1024 * 1024, // 30MB
    };
    
    setVersionInfo(mockVersionInfo);
  };

  const showTestOptions = () => {
    Alert.alert(
      'Version Update Test',
      'Choose an update type to test:',
      [
        {
          text: 'Recommended Update',
          onPress: simulateRecommendedUpdate,
        },
        {
          text: 'Force Update',
          onPress: simulateForceUpdate,
        },
        {
          text: 'Check Real Updates',
          onPress: checkForUpdates,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={showTestOptions}
        style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
        disabled={isCheckingForUpdates}
      >
        {isCheckingForUpdates ? (
          <RefreshCw size={20} color="#fff" />
        ) : (
          <Download size={20} color="#fff" />
        )}
        <Text style={styles.testButtonText}>
          {isCheckingForUpdates ? 'Checking...' : 'Test Updates'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    display:'none'
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
