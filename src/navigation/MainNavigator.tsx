import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Gamepad2, Settings, User } from 'lucide-react-native';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ProfileTabNavigator } from './ProfileTabNavigator';
import { StarterScreen } from '../screens/StarterScreen';
import { GameScreen } from '../screens/game/GameScreen';
import { SinglePlayerGameScreen } from '../screens/game/SinglePlayerGameScreen';
import PlayerCartelaSelectionScreen from '../screens/game/PlayerCartelaSelectionScreen';
import { GameSummaryScreen } from '../screens/game/GameSummaryScreen';
import { useTheme } from '../components/ui/ThemeProvider';
import { MainTabParamList, GameStackParamList, MainStackParamList } from '../types';
import { CardTypeEditorScreen } from '../screens/settings/CardTypeEditorScreen';
import { BingoCardsScreen } from '../screens/BingoCardsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const GameStack = createStackNavigator<GameStackParamList>();

// Tab Navigator for main screens (Home, Settings, Profile)
const MainTabNavigator: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        lazy: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#2C2C2E',
          borderTopWidth: 0,
          paddingBottom: Math.max(insets.bottom, 4),
          paddingTop: 4,
          height: 50 + Math.max(insets.bottom, 4),
          borderRadius: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={StarterScreen}
        options={{
          tabBarLabel: 'Game',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              backgroundColor: focused ? 'rgba(0, 123, 255, 0.51)' : 'transparent',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 4,
              minWidth: 36,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Gamepad2 size={24} color={color} />
            </View>
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
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              backgroundColor: focused ? 'rgba(0, 123, 255, 0.77)' : 'transparent',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 4,
              minWidth: 36,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Settings size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileTabNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              backgroundColor: focused ? 'rgba(0, 123, 255, 0.54)' : 'transparent',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 4,
              minWidth: 36,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <User size={24} color={color} />
            </View>
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
        name="SinglePlayerGame" 
        component={SinglePlayerGameScreen} 
        options={{ headerShown: false }}
      />
      <GameStack.Screen
        name="GameSummary"
        component={GameSummaryScreen}
        options={{ headerShown: false, title: 'Game Summary' }}
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
      <MainStack.Screen 
        name="BingoCards" 
        component={BingoCardsScreen}
        options={{
          headerShown: false,
        }}
      />
    </MainStack.Navigator>
  );
};
