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
import { ScreenNames } from '../constants/ScreenNames';
import { CardTypeEditorScreen } from '../screens/settings/CardTypeEditorScreen';
import { BingoCardsScreen } from '../screens/BingoCardsScreen';
import { TAB_BAR_STYLES, TAB_BAR_LABEL_STYLES, TAB_BAR_COLORS } from '../utils/tabBarStyles';
import { SyncIndicator } from '../components/ui/SyncIndicator';

const Tab = createBottomTabNavigator<MainTabParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const GameStack = createStackNavigator<GameStackParamList>();

// Tab Navigator for main screens (Home, Settings, Profile)
const MainTabNavigator: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tab.Navigator
        initialRouteName={ScreenNames.HOME}
        backBehavior="initialRoute"
        screenOptions={{
          headerShown: false,
          lazy: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: TAB_BAR_STYLES.default,
          tabBarLabelStyle: TAB_BAR_LABEL_STYLES,
          tabBarActiveTintColor: TAB_BAR_COLORS.activeTintColor,
          tabBarInactiveTintColor: TAB_BAR_COLORS.inactiveTintColor,
        }}
      >
      <Tab.Screen 
        name={ScreenNames.HOME} 
        component={StarterScreen}
        options={{
          tabBarLabel: 'Game',
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
              <Gamepad2 size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name={ScreenNames.SETTINGS} 
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
        name={ScreenNames.PROFILE} 
        component={ProfileTabNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Profile',
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
              <User size={24} color={color} />
            </View>
          ),
        }}
      />
      </Tab.Navigator>
      <SyncIndicator />
    </>
  );
};

// Stack Navigator for game screens (no tabs)
const GameStackNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <GameStack.Navigator
      initialRouteName={ScreenNames.HOME}
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
      <GameStack.Screen
        name={ScreenNames.HOME}
        component={StarterScreen}
        options={{ headerShown: false }}
      />
      <GameStack.Screen
        name={ScreenNames.PLAYER_CARTELA_SELECTION}
        component={PlayerCartelaSelectionScreen}
        options={{ headerShown: false }}
      />
      <GameStack.Screen 
        name={ScreenNames.GAME_PLAY} 
        component={GameScreen} 
        options={{ headerShown: false }}
      />
      <GameStack.Screen 
        name={ScreenNames.SINGLE_PLAYER_GAME} 
        component={SinglePlayerGameScreen} 
        options={{ headerShown: false }}
      />
      <GameStack.Screen
        name={ScreenNames.GAME_SUMMARY}
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
      initialRouteName={ScreenNames.MAIN_TABS}
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainStack.Screen name={ScreenNames.MAIN_TABS} component={MainTabNavigator} />
      <MainStack.Screen name={ScreenNames.GAME_STACK} component={GameStackNavigator} />
      <MainStack.Screen 
        name={ScreenNames.CARD_TYPE_EDITOR} 
        component={CardTypeEditorScreen}
        options={{
          headerShown: true,
          headerTitle: 'Edit Card Types',
        }}
      />
      <MainStack.Screen 
        name={ScreenNames.BINGO_CARDS} 
        component={BingoCardsScreen}
        options={{
          headerShown: false,
        }}
      />
    </MainStack.Navigator>
  );
};
