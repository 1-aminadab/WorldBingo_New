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
import { triggerReportSync } from './src/sync/reportSyncService';
import { useReportSyncStore } from './src/sync/reportSyncStore';
import { CoinSyncService } from './src/services/coinSyncService';
import { apiClient } from './src/api/client/base';
import { useAuthStore } from './src/store/authStore';
import { logAppVersion } from './src/utils/appVersion';
import { useVersionStore } from './src/store/versionStore';
import { SyncIndicator } from './src/components/ui/SyncIndicator';
import './src/i18n';
import Orientation from 'react-native-orientation-locker';
import KeepAwake from 'react-native-keep-awake';
import { Immersive } from 'react-native-immersive';

const AppContent = () => {
  const { theme } = useTheme();
  
  if (!__DEV__) {
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    console.info = () => {};
    console.debug = () => {};
  }
  // Initialize Firebase Auth globally
  useFirebaseAuth();
  
  // Connect auth store to toast notifications
  useAuthToast();
  
  // Initialize sync services on app startup
  useEffect(() => {
    const initializeSyncServices = async () => {
      console.log('🚀 [App] Initializing sync services on startup...');
      
      // Log authentication token on app load
      console.log('🔑 [App] === AUTH TOKEN CHECK ON APP LOAD ===');
      try {
        await apiClient.ensureTokenLoaded();
        const token = apiClient.getAuthToken();
        if (token) {
          console.log('🔑 [App] Auth token available:', token.length > 0 ? 'YES' : 'NO');
          console.log('🔑 [App] Token length:', token.length, 'characters');
          console.log('🔑 [App] Token preview:', token.substring(0, 50) + '...');
          console.log('🔑 [App] Full token:', token);
        } else {
          console.log('🔑 [App] No auth token found');
        }
      } catch (error) {
        console.error('🔑 [App] Error checking auth token:', error);
      }
      console.log('🔑 [App] === END AUTH TOKEN CHECK ===');
      
      // Wait for auth state and UI to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 1. Initialize report sync
      console.log('🚀 [App] Initializing report sync...');
      const syncStore = useReportSyncStore.getState();
      if (syncStore.reports.length > 0) {
        console.log(`🎮 Found ${syncStore.reports.length} game reports to sync:`);
        syncStore.reports.forEach((report, index) => {
          console.log(`🎮 Game Report ${index + 1} (ID: ${report.id}): ${report.numberOfCards} cards, ${report.totalPayin} Birr payin, ${report.totalPayout} Birr payout`);
        });
      } else {
        console.log('🎮 No game reports pending sync');
      }
      
      // 2. Initialize coin sync (only if user is logged in)
      console.log('🚀 [App] Checking authentication for coin sync...');
      
      // Ensure auth token is loaded
      await apiClient.ensureTokenLoaded();
      
      // Wait additional time for auth store to be hydrated
      let authStore = useAuthStore.getState();
      let retryCount = 0;
      
      // Wait up to 2 more seconds for auth state to be ready
      while (retryCount < 4 && !authStore.isAuthenticated && !authStore.isGuest) {
        await new Promise(resolve => setTimeout(resolve, 500));
        authStore = useAuthStore.getState();
        retryCount++;
        console.log(`🚀 [App] Waiting for auth state... attempt ${retryCount}/4`);
      }
      
      const isAuthenticated = authStore.isAuthenticated && !authStore.isGuest;
      const hasToken = !!apiClient.getAuthToken();
      
      console.log('🚀 [App] Auth state check:', {
        isAuthenticated,
        isGuest: authStore.isGuest,
        hasToken,
        userId: authStore.getUserId()
      });
      
      try {
        // Run report sync always, coin sync only if authenticated
        const syncPromises = [triggerReportSync()];
        
        if (isAuthenticated) {
          console.log('🚀 [App] Adding coin sync to startup...');
          syncPromises.push(CoinSyncService.autoSync());
        } else {
          console.log('🚀 [App] Skipping coin sync - user not authenticated or in guest mode');
        }
        
        const syncResults = await Promise.allSettled(syncPromises);
        
        // Log report sync results
        const reportSyncResult = syncResults[0];
        if (reportSyncResult.status === 'fulfilled') {
          console.log('✅ [App] Report sync initialization completed');
        } else {
          console.error('❌ [App] Error during report sync initialization:', reportSyncResult.reason);
        }
        
        // Log coin sync results (if attempted)
        if (isAuthenticated && syncResults.length > 1) {
          const coinSyncResult = syncResults[1];
          if (coinSyncResult.status === 'fulfilled') {
            if (coinSyncResult.value) {
              console.log('✅ [App] Coin sync completed:', coinSyncResult.value.message);
              if (coinSyncResult.value.backendCoins > 0) {
                console.log(`💰 [App] Added ${coinSyncResult.value.backendCoins} coins from backend`);
              }
            } else {
              console.log('📡 [App] Coin sync skipped (offline or no auth)');
            }
          } else {
            console.error('❌ [App] Error during coin sync initialization:', coinSyncResult.reason);
          }
        } else if (!isAuthenticated) {
          console.log('📡 [App] Coin sync skipped - user not logged in');
        }
        
        // Log sync store state after sync attempts
        console.log('🚀 [App] Sync store state after sync attempts:');
        syncStore.logCurrentState();
        
      } catch (error) {
        console.error('❌ [App] Error during sync initialization:', error);
      }
    };

    // Delay sync to allow app to fully initialize, UI to render, and store rehydration to complete
    const timeoutId = setTimeout(() => {
      initializeSyncServices();
    }, 3000); // Reduced to 3 seconds with better auth state checking

    return () => clearTimeout(timeoutId);
  }, []);
  
  // Log app version on startup
  useEffect(() => {
    const handleAppStartup = () => {
      try {
        // Log current version
        logAppVersion();
      } catch (error) {
        console.error('❌ [VERSION] Error during startup version check:', error);
      }
    };
    
    handleAppStartup();
  }, []);
  
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
        <SyncIndicator />
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
