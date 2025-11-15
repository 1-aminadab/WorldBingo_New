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
import { LoadingAnimation } from '../components/ui/LoadingAnimation';

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
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [webViewLoaded, setWebViewLoaded] = useState(false);

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
        // Clean up loading timeout if it exists
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
      };
    }, [navigation, loadingTimeout])
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
          // Navigate back to profile with success status
          (navigation as any).navigate('ProfileMain', {
            paymentStatus: 'success',
            paymentMessage: 'Transaction completed successfully!',
            amount: data.amount || null,
            transactionId: data.transactionId || 'TXN_UNKNOWN'
          });
          break;

        case 'payment_failed':
          console.log('❌ Payment Failed:', data);
          // Navigate back to profile with failed status
          (navigation as any).navigate('ProfileMain', {
            paymentStatus: 'failed',
            paymentMessage: data.message || 'Payment was not completed. Please try again.',
            amount: data.amount || null,
            transactionId: data.transactionId || null
          });
          break;

        case 'payment_cancelled':
          console.log('🚫 Payment Cancelled:', data);
          // Navigate back to profile with cancelled status
          (navigation as any).navigate('ProfileMain', {
            paymentStatus: 'cancelled',
            paymentMessage: 'Payment was cancelled',
            amount: data.amount || null,
            transactionId: data.transactionId || null
          });
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
    
    // Only show loading for initial load, not subsequent navigations after webview is loaded
    if (!webViewLoaded) {
      setLoading(true);
      
      // Clear any existing timeout
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      
      // Set a timeout to handle cases where the page takes too long to load
      const timeout = setTimeout(() => {
        console.log('⏰ Loading timeout reached');
        setLoading(false);
        
        // Navigate back to profile with timeout error
        (navigation as any).navigate('ProfileMain', {
          paymentStatus: 'failed',
          paymentMessage: 'Payment page took too long to load. Please check your internet connection and try again.',
          amount: null,
          transactionId: null
        });
      }, 30000); // 30 second timeout
      
      setLoadingTimeout(timeout);
    }
  };

  const handleLoadEnd = () => {
    console.log('✅ WebView loading completed');
    setLoading(false);
    setWebViewLoaded(true);
    
    // Clear the loading timeout since loading completed successfully
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebView error:', nativeEvent);
    
    // Only handle errors for initial load, ignore errors after webview is loaded
    if (!webViewLoaded) {
      // Stop loading immediately when error occurs
      setLoading(false);
      
      // Navigate back to profile with error parameters
      setTimeout(() => {
        (navigation as any).navigate('ProfileMain', {
          paymentStatus: 'failed',
          paymentMessage: 'Failed to load the payment page. Please check your internet connection and try again.',
          amount: null,
          transactionId: null
        });
      }, 100);
    }
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

      {/* Loading Animation - only show during initial load, not after webview is loaded */}
      <LoadingAnimation
        visible={loading && !webViewLoaded}
        message="Loading payment page..."
        size="medium"
        overlay={true}
        backgroundColor="rgba(28, 42, 89, 0.9)"
        textColor={theme.colors.text}
      />

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
  webView: {
    flex: 1,
  },
});



