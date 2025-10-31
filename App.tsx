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
import { ToastProvider } from './src/components/ui/Toast/ToastProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { audioService } from './src/services/audioService';
import { UpdateGuard } from './src/components/ui/UpdateGuard';
import { VersionTestButton } from './src/components/ui/VersionTestButton';
import UpdateModal from './src/components/ui/UpdateModal';
import { useFirebaseAuth } from './src/hooks/useFirebaseAuth';
import { useAuthToast } from './src/hooks/useAuthToast';
import { useReportInitialization } from './src/hooks/useReportInitialization';
import './src/i18n';
import Orientation from 'react-native-orientation-locker';
import KeepAwake from 'react-native-keep-awake';
import { Immersive } from 'react-native-immersive';

const AppContent = () => {
  const { theme } = useTheme();
  
  // Initialize Firebase Auth globally
  useFirebaseAuth();
  
  // Connect auth store to toast notifications
  useAuthToast();
  
  // Initialize report data on app start
  useReportInitialization();
  
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
        {/* Update Modal for APK installation */}
        <UpdateModal onClose={() => console.log('Update modal closed')} />
      </SafeAreaView>
    </>
  );
};

function App() {

  useEffect(() => {
    // Initialize any global settings or services here
    Orientation.lockToPortrait(); // Lock to portrait

    // Keep screen awake for game app
    KeepAwake.activate();

    // Initialize audio service on app startup
    audioService.initialize();
    
    console.log('🎵 App: Audio service initialized on app startup');
    console.log('📱 App: Screen timeout disabled - keeping screen awake');

    return () => {
      // Cleanup: allow screen to sleep when app is unmounted
      KeepAwake.deactivate();
    };
  }, []);

  useEffect(() => {
    // Enable immersive mode to hide navigation bar and allow swipe gestures
    if (Platform.OS === 'android') {
      // Hide navigation bar and enable immersive mode for swipe gestures
      Immersive.on();
      console.log('📱 App: Immersive mode enabled - navigation bar hidden');
    }

    return () => {
      // Cleanup: restore navigation bar when app is unmounted
      if (Platform.OS === 'android') {
        Immersive.off();
      }
    };
  }, []);
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1}}>
        <ThemeProvider>
          <ToastProvider>
            <UpdateGuard>
              <AppContent />
            </UpdateGuard>
          </ToastProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default App;
