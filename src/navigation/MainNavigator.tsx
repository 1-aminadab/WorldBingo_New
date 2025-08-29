import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ProfileTabNavigator } from './ProfileTabNavigator';
import { StarterScreen } from '../screens/StarterScreen';
import { GameScreen } from '../screens/game/GameScreen';
import PlayerCartelaSelectionScreen from '../screens/game/PlayerCartelaSelectionScreen';
import { GameSummaryScreen } from '../screens/game/GameSummaryScreen';
import { useTheme } from '../components/ui/ThemeProvider';
import { MainTabParamList, GameStackParamList, MainStackParamList } from '../types';
import { CardTypeEditorScreen } from '../screens/settings/CardTypeEditorScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const GameStack = createStackNavigator<GameStackParamList>();

// Tab Navigator for main screens (Home, Settings, Profile)
const MainTabNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        lazy: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          marginBottom: 42
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={StarterScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          headerShown: false,
          headerStyle: {
            backgroundColor: theme.colors.surface,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
          },
          headerTitle: 'Game Settings',
          
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>⚙️</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileTabNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Stack Navigator for game screens (no tabs)
const GameStackNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <GameStack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
        },
        headerBackTitleVisible: false,
        gestureEnabled: true,
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
      <GameStack.Screen
        name="Home"
        component={StarterScreen}
        options={{ headerShown: false }}
      />
      <GameStack.Screen
        name="PlayerCartelaSelection"
        component={PlayerCartelaSelectionScreen}
        options={{ headerShown: false }}
      />
      <GameStack.Screen 
        name="GamePlay" 
        component={GameScreen} 
        options={{ headerShown: false }}
      />
      <GameStack.Screen
        name="GameSummary"
        component={GameSummaryScreen}
        options={{ headerShown: true, title: 'Game Summary' }}
      />
    </GameStack.Navigator>
  );
};

// Main Navigator that combines both
export const MainNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <MainStack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
      <MainStack.Screen name="GameStack" component={GameStackNavigator} />
      <MainStack.Screen 
        name="CardTypeEditor" 
        component={CardTypeEditorScreen}
        options={{
          headerShown: true,
          headerTitle: 'Edit Card Types',
        }}
      />
    </MainStack.Navigator>
  );
};
