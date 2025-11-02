import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { AuthStackParamList } from '../types';
import { SignUpLoginScreen } from '../screens/auth/SignUpLoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { OTPVerificationScreen } from '../screens/auth/OTPVerificationScreen';
import { ChangePasswordScreen } from '../screens/auth/ChangePasswordScreen';
import { useTheme } from '../components/ui/ThemeProvider';
import { useAuthStore } from '../store/authStore';
import { ScreenNames } from '../constants/ScreenNames';

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { pendingAuthScreen, setPendingAuthScreen } = useAuthStore();

  // Determine initial route based on pending auth screen
  const getInitialRouteName = () => {
    if (pendingAuthScreen === 'SignUp') {
      return ScreenNames.LOGIN_SIGNUP; // This maps to SignUpLoginScreen with isLogin: false
    } else if (pendingAuthScreen === 'Login') {
      return ScreenNames.LOGIN; // This maps to SignUpLoginScreen with isLogin: true
    }
    return ScreenNames.LOGIN; // Default to login
  };
  
  const initialRouteName = getInitialRouteName();

  // Clear pending auth screen when navigator mounts
  React.useEffect(() => {
    if (pendingAuthScreen) {
      setPendingAuthScreen(null);
    }
  }, []);

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontSize: theme.fontSize.lg,
          fontWeight: '600',
        },
        headerBackTitleVisible: false,
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
      <Stack.Screen 
        name={ScreenNames.LOGIN} 
        component={SignUpLoginScreen} 
        options={{ headerShown: false }}
        initialParams={{ isLogin: true }}
      />
      <Stack.Screen 
        name={ScreenNames.LOGIN_SIGNUP} 
        component={SignUpLoginScreen} 
        options={{ headerShown: false }}
        initialParams={{ isLogin: false }}
      />
      <Stack.Screen 
        name={ScreenNames.SIGN_UP} 
        component={SignUpScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ScreenNames.FORGOT_PASSWORD} 
        component={ForgotPasswordScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ScreenNames.OTP_VERIFICATION} 
        component={OTPVerificationScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name={ScreenNames.CHANGE_PASSWORD} 
        component={ChangePasswordScreen} 
        options={{ headerShown: false }}
      />
      {/** PhoneLogin test screen removed */}
    </Stack.Navigator>
  );
};