import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MenuScreen from './src/screens/MenuScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatsScreen from './src/screens/StatsScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import FriendComparisonScreen from './src/screens/FriendComparisonScreen';
import MultiplayerLobbyScreen from './src/screens/MultiplayerLobbyScreen';
import MultiplayerGameScreen from './src/screens/MultiplayerGameScreen';
import FlipMatchGame from './src/screens/FlipMatchGame';
import MathRushGame from './src/screens/MathRushGame';
import SpatialMemoryGame from './src/screens/SpatialMemoryGame';
import StroopTestGame from './src/screens/StroopTestGame';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AccessibilityProvider } from './src/contexts/AccessibilityContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { syncGameRecords } from './src/utils/cloudSync';

export type RootStackParamList = {
  Menu: undefined;
  Login: undefined;
  Profile: undefined;
  Settings: undefined;
  Stats: undefined;
  Achievements: undefined;
  Leaderboard: undefined;
  Friends: undefined;
  FriendComparison: { friendId: string; friendUsername: string; };
  MultiplayerLobby: undefined;
  MultiplayerGame: { roomId: string; gameType: string; difficulty?: string; };
  FlipMatchGame: undefined;
  MathRushGame: undefined;
  SpatialMemoryGame: undefined;
  StroopTestGame: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { user } = useAuth();

  useEffect(() => {
    const autoSync = async () => {
      if (user) {
        try {
          const result = await syncGameRecords();
          if (result.success) {
            console.log('Auto-sync completed');
          }
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    };
    autoSync();
  }, [user]);

  return (
    <View style={styles.webContainer}>
      <View style={styles.appContainer}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Menu" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="Achievements" component={AchievementsScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Friends" component={FriendsScreen} />
            <Stack.Screen name="FriendComparison" component={FriendComparisonScreen} />
            <Stack.Screen name="MultiplayerLobby" component={MultiplayerLobbyScreen} />
            <Stack.Screen name="MultiplayerGame" component={MultiplayerGameScreen} />
            <Stack.Screen name="FlipMatchGame" component={FlipMatchGame} />
            <Stack.Screen name="MathRushGame" component={MathRushGame} />
            <Stack.Screen name="SpatialMemoryGame" component={SpatialMemoryGame} />
            <Stack.Screen name="StroopTestGame" component={StroopTestGame} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    ...Platform.select({ web: { alignItems: 'center', justifyContent: 'center' } }),
  },
  appContainer: {
    ...Platform.select({
      web: {
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        overflow: 'auto',
      },
      default: { flex: 1, width: '100%' },
    }),
  },
});

export default function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <AppNavigator />
          </ErrorBoundary>
        </ThemeProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}
