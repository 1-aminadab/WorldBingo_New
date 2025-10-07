/**
 * World Bingo App
 * A mobile Bingo game with voice calling and animated slot machine
 *
 * @format
 */

import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar, Platform } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/components/ui/ThemeProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useSettingsStore } from './src/store/settingsStore';
import { audioService } from './src/services/audioService';
import { UpdateGuard } from './src/components/ui/UpdateGuard';
import { VersionTestButton } from './src/components/ui/VersionTestButton';
import { useFirebaseAuth } from './src/hooks/useFirebaseAuth';
import './src/i18n';
import Orientation from 'react-native-orientation-locker';

const AppContent = () => {
  const { theme } = useTheme();
  
  // Initialize Firebase Auth globally
  useFirebaseAuth();
  
  return (
    <>
      <StatusBar
        backgroundColor={theme.colors.primary}
        barStyle="light-content"
        translucent={false}
        hidden={false}
      />
      <SafeAreaView style={{ flex: 1 }}> 
        <AppNavigator />
        <VersionTestButton />
      </SafeAreaView>
    </>
  );
};

function App() {
  const { appLanguage } = useSettingsStore();

  useEffect(() => {
    // Initialize any global settings or services here
    Orientation.lockToPortrait(); // Lock to portrait

    // Initialize audio service on app startup
    audioService.initialize();
    
    console.log('🎵 App: Audio service initialized on app startup');
  }, []);

  useEffect(() => {
    // Hide navigation bar on Android using StatusBar API
    if (Platform.OS === 'android') {
      // Enable immersive mode to hide system navigation
      StatusBar.setHidden(false, 'slide');
      // You can also set StatusBar.setHidden(true, 'slide') to hide status bar completely
    }
  }, []);
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1}}>
        <ThemeProvider>
          <UpdateGuard>
            <AppContent />
          </UpdateGuard>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default App;
