import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TransactionReport } from '../screens/reports/TransactionReport';
import { GameReport } from '../screens/reports/GameReport';
import ComprehensiveReportScreen from '../screens/reports/ComprehensiveReportScreen';
import { PaymentWebViewScreen } from '../screens/PaymentWebViewScreen';
import { ScreenNames } from '../constants/ScreenNames';
import { TAB_BAR_STYLES, TAB_BAR_LABEL_STYLES, TAB_BAR_COLORS } from '../utils/tabBarStyles';

const Stack = createStackNavigator();

export const ProfileTabNavigator: React.FC = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Ensure tab bar styling is maintained when navigating within Profile stack
    const unsubscribe = navigation.addListener('state', () => {
      // Force tab bar to maintain consistent styling
      const parentNavigation = navigation.getParent();
      if (parentNavigation) {
        parentNavigation.setOptions({
          tabBarStyle: TAB_BAR_STYLES.default,
          tabBarLabelStyle: TAB_BAR_LABEL_STYLES,
          tabBarActiveTintColor: TAB_BAR_COLORS.activeTintColor,
          tabBarInactiveTintColor: TAB_BAR_COLORS.inactiveTintColor,
        });
      }
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name={ScreenNames.PROFILE_MAIN} component={ProfileScreen} />
      <Stack.Screen name={ScreenNames.TRANSACTION_REPORT} component={TransactionReport} />
      <Stack.Screen name={ScreenNames.GAME_REPORT} component={GameReport} />
      <Stack.Screen name={ScreenNames.COMPREHENSIVE_REPORT} component={ComprehensiveReportScreen} />
      <Stack.Screen 
        name={ScreenNames.PAYMENT_WEBVIEW} 
        component={PaymentWebViewScreen}
        options={{
          gestureEnabled: false, // Prevent accidental swipe back during payment
        }}
      />
    </Stack.Navigator>
  );
}; 