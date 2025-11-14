import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Linking } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { RootStackParamList } from '../types';
import { useTheme } from '../components/ui/ThemeProvider';
import { ScreenNames } from '../constants/ScreenNames';

const Stack = createStackNavigator<RootStackParamList>();

// Create a ref for navigation
export const navigationRef = React.createRef<any>();

// Deep linking configuration
const linking = {
  prefixes: [
    'worldbingo://',
    'https://worldbingo.app',
    'http://worldbingo.app',
  ],
  config: {
    screens: {
      [ScreenNames.AUTH]: {
        screens: {
          [ScreenNames.LOGIN]: ScreenNames.DL_LOGIN,
          [ScreenNames.SIGN_UP]: ScreenNames.DL_SIGNUP,
          [ScreenNames.FORGOT_PASSWORD]: ScreenNames.DL_FORGOT_PASSWORD,
          [ScreenNames.OTP_VERIFICATION]: ScreenNames.DL_OTP_VERIFICATION,
        },
      },
      [ScreenNames.MAIN]: {
        screens: {
          [ScreenNames.MAIN_TABS]: {
            screens: {
              [ScreenNames.HOME]: ScreenNames.DL_HOME,
              [ScreenNames.SETTINGS]: ScreenNames.DL_SETTINGS,
              [ScreenNames.PROFILE]: {
                screens: {
                  [ScreenNames.PROFILE_MAIN]: ScreenNames.DL_PROFILE_MAIN,
                  [ScreenNames.TRANSACTION_REPORT]: ScreenNames.DL_TRANSACTION_REPORT,
                  [ScreenNames.GAME_REPORT]: ScreenNames.DL_GAME_REPORT,
                  [ScreenNames.COMPREHENSIVE_REPORT]: ScreenNames.DL_COMPREHENSIVE_REPORT,
                  [ScreenNames.PAYMENT_WEBVIEW]: {
                    path: ScreenNames.DL_PAYMENT,
                    parse: {
                      returnUrl: (url: string) => url,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isGuest } = useAuthStore();
  const { theme } = useTheme();
  
  const canAccessMainApp = isAuthenticated || isGuest;

  const handleDeepLink = (url: string) => {
    console.log('🔗 Deep Link Received ====================================');
    console.log('URL:', url);
    console.log('Timestamp:', new Date().toISOString());
    console.log('========================================================');

    try {
      // Parse the URL
      const urlObj = new URL(url.replace('worldbingo://', 'https://worldbingo.app/'));
      const pathname = urlObj.pathname;
      const searchParams = urlObj.searchParams;

      console.log('Parsed URL:', { pathname, params: Object.fromEntries(searchParams) });

      // Handle payment deep links
      if (pathname.includes('payment') || url.includes('payment')) {
        const paymentSuccess = searchParams.get('payment_success') === 'true';
        const paymentCancelled = searchParams.get('payment_cancelled') === 'true';
        const paymentFailed = searchParams.get('payment_failed') === 'true';
        const amount = searchParams.get('amount');
        const transactionId = searchParams.get('transaction_id');
        const error = searchParams.get('error');

        let paymentStatus: 'success' | 'cancelled' | 'failed' | undefined;
        let message = '';

        if (paymentSuccess) {
          paymentStatus = 'success';
          message = `Payment successful! ${amount ? `Amount: ${amount}` : ''} ${transactionId ? `Transaction ID: ${transactionId}` : ''}`;
        } else if (paymentCancelled) {
          paymentStatus = 'cancelled';
          message = 'Payment was cancelled';
          console.log('🚫 Payment cancelled');
        } else if (paymentFailed) {
          paymentStatus = 'failed';
          message = error ? decodeURIComponent(error) : 'Payment failed';
          console.log('❌ Payment failed:', error);
        }

        // Navigate to profile screen with payment status after a short delay
        setTimeout(() => {
          if (navigationRef.current && paymentStatus) {
            console.log('📱 Navigating to Profile with status:', paymentStatus);
            
            // Navigate to the Profile tab
            navigationRef.current.navigate(ScreenNames.MAIN, {
              screen: ScreenNames.MAIN_TABS,
              params: {
                screen: ScreenNames.PROFILE,
                params: {
                  screen: ScreenNames.PROFILE_MAIN,
                  params: {
                    paymentStatus,
                    paymentMessage: message,
                    amount,
                    transactionId,
                  },
                },
              },
            });
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error parsing deep link:', error);
    }
  };

  React.useEffect(() => {
    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle deep links when app is launched from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onStateChange={(state) => {
        console.log('📱 Navigation State Changed:', state?.routes[state?.index || 0]?.name);
      }}
      theme={{
        dark: false,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.accent,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        {canAccessMainApp ? (
          <Stack.Screen name={ScreenNames.MAIN} component={MainNavigator} />
        ) : (
          <Stack.Screen name={ScreenNames.AUTH} component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};