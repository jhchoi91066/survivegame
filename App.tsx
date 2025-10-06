import React, { useEffect } from 'react';
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
import FlipMatchGame from './src/screens/FlipMatchGame';
import SequenceGame from './src/screens/SequenceGame';
import MathRushGame from './src/screens/MathRushGame';
import MergePuzzleGame from './src/screens/MergePuzzleGame';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AccessibilityProvider } from './src/contexts/AccessibilityContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { processUploadQueue } from './src/utils/cloudSync';

export type RootStackParamList = {
  Menu: undefined;
  Login: undefined;
  Profile: undefined;
  Settings: undefined;
  Stats: undefined;
  Achievements: undefined;
  Leaderboard: undefined;
  Friends: undefined;
  FriendComparison: {
    friendId: string;
    friendUsername: string;
  };
  FlipMatchGame: undefined;
  SequenceGame: undefined;
  MathRushGame: undefined;
  MergePuzzleGame: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { user } = useAuth();

  // Auto-sync on app start (process upload queue)
  useEffect(() => {
    const autoSync = async () => {
      if (user) {
        try {
          await processUploadQueue();
          console.log('Auto-sync completed');
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    };

    autoSync();
  }, [user]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Menu"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="Friends" component={FriendsScreen} />
        <Stack.Screen name="FriendComparison" component={FriendComparisonScreen} />
        <Stack.Screen name="FlipMatchGame" component={FlipMatchGame} />
        <Stack.Screen name="SequenceGame" component={SequenceGame} />
        <Stack.Screen name="MathRushGame" component={MathRushGame} />
        <Stack.Screen name="MergePuzzleGame" component={MergePuzzleGame} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

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
