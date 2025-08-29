import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TransactionReport } from '../screens/reports/TransactionReport';
import { GameReport } from '../screens/reports/GameReport';
import { useTheme } from '../components/ui/ThemeProvider';

const Stack = createStackNavigator();

export const ProfileTabNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="TransactionReport" component={TransactionReport} />
      <Stack.Screen name="GameReport" component={GameReport} />
    </Stack.Navigator>
  );
}; 