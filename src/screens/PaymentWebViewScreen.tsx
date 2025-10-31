import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../components/ui/ThemeProvider';
import { useAuthStore } from '../store/authStore';
import { setTabBarVisibility, restoreTabBar } from '../utils/tabBarStyles';

const PAYMENT_BASE_URL = 'https://payment.myworldbingo.com/';

type PaymentWebViewScreenRouteProp = RouteProp<
  { PaymentWebView: { returnUrl?: string } },
  'PaymentWebView'
>;

export const PaymentWebViewScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<PaymentWebViewScreenRouteProp>();
  const { theme, isDark } = useTheme();
  const webViewRef = useRef<WebView>(null);
  
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // Get user ID from auth store
  const userId = useAuthStore((state) => state.getUserId());
  
  // Construct payment URL with user ID
  const paymentUrl = `${PAYMENT_BASE_URL}${userId}`

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setTabBarVisibility(navigation, false);

      return () => {
        // Show tab bar again when leaving
        restoreTabBar(navigation);
      };
    }, [navigation])
  );

  console.log('💳 Payment WebView Initialized ====================================');
  console.log('User ID:', userId);
  console.log('Payment URL:', paymentUrl);
  console.log('Return URL:', route.params?.returnUrl);
  console.log('================================================================');

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);

    console.log('🌐 WebView Navigation:', {
      url: navState.url,
      title: navState.title,
      loading: navState.loading,
      canGoBack: navState.canGoBack,
    });
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      console.log('📨 Message from WebView:', data);

      // Handle different message types from the web page
      switch (data.type) {
        case 'payment_success':
          console.log('✅ Payment Success:', data);
          Alert.alert(
            'Payment Successful',
            `Transaction completed successfully!\nAmount: ${data.amount || 'N/A'}`,
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
          break;

        case 'payment_failed':
          console.log('❌ Payment Failed:', data);
          Alert.alert(
            'Payment Failed',
            data.message || 'Payment was not completed. Please try again.',
            [{ text: 'OK' }]
          );
          break;

        case 'payment_cancelled':
          console.log('🚫 Payment Cancelled:', data);
          Alert.alert(
            'Payment Cancelled',
            'You have cancelled the payment.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
          break;

        case 'close_webview':
          console.log('🔙 Closing WebView:', data);
          navigation.goBack();
          break;

        default:
          console.log('ℹ️ Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handleLoadStart = () => {
    console.log('⏳ WebView loading started');
    setLoading(true);
  };

  const handleLoadEnd = () => {
    console.log('✅ WebView loading completed');
    setLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebView error:', nativeEvent);
    
    Alert.alert(
      'Error Loading Page',
      'Failed to load the payment page. Please check your internet connection and try again.',
      [
        { text: 'Retry', onPress: () => webViewRef.current?.reload() },
        { text: 'Cancel', onPress: () => navigation.goBack() },
      ]
    );
  };

  const handleGoBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      navigation.goBack();
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Exit Payment',
      'Are you sure you want to exit? Any unsaved progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => navigation.goBack(), style: 'destructive' },
      ]
    );
  };

  const handleRefresh = () => {
    webViewRef.current?.reload();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        backgroundColor={theme.colors.surface} 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
      />

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading payment page...
          </Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        style={styles.webView}
        // Allow the web page to send messages to the app
        injectedJavaScript={`
          // Expose a function for the web page to communicate with the app
          window.ReactNativeWebView = {
            postMessage: function(data) {
              window.ReactNativeWebView.postMessage(JSON.stringify(data));
            }
          };
          true; // Required for injection
        `}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  webView: {
    flex: 1,
  },
});



