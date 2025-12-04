import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FriendComparisonScreen from './src/screens/FriendComparisonScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
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
import { ToastProvider } from './src/components/ToastProvider';

export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Settings: undefined;
  FriendComparison: { friendId: string; friendUsername: string; };
  MultiplayerGame: { roomId: string; gameType: string; difficulty?: string; isCreator?: boolean; };
  FlipMatchGame: { multiplayerRoomId?: string; difficulty?: string; } | undefined;
  MathRushGame: { multiplayerRoomId?: string; difficulty?: string; } | undefined;
  SpatialMemoryGame: { multiplayerRoomId?: string; difficulty?: string; } | undefined;
  StroopTestGame: { multiplayerRoomId?: string; difficulty?: string; } | undefined;
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
          <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="FriendComparison" component={FriendComparisonScreen} />
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
      } as any,
      default: { flex: 1, width: '100%' },
    }),
  },
});



export default function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <ThemeProvider>
          <SafeAreaProvider>
            <ErrorBoundary>
              <AppNavigator />
              <ToastProvider />
            </ErrorBoundary>
          </SafeAreaProvider>
        </ThemeProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}
