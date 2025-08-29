/**
 * World Bingo App
 * A mobile Bingo game with voice calling and animated slot machine
 *
 * @format
 */

import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/components/ui/ThemeProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useSettingsStore } from './src/store/settingsStore';
import { audioManager } from './src/utils/audioManager';
import './src/i18n';

function App() {
  const { appLanguage } = useSettingsStore();

  useEffect(() => {
    // Initialize any global settings or services here
    
    // Test audio files after a delay
    setTimeout(() => {
      console.log('Testing audio files...');
      //audioManager.testAudioFiles();
    }, 3000);
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1}}>
        <ThemeProvider>
          <SafeAreaView style={{ flex: 1 }}> 

        
          <StatusBar
            backgroundColor="transparent"
            barStyle="light-content"
            translucent
          />
          <AppNavigator />  
          </SafeAreaView>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default App;
