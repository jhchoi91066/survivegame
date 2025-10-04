import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MenuScreen from './src/screens/MenuScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatsScreen from './src/screens/StatsScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import FlipMatchGame from './src/screens/FlipMatchGame';
import SequenceGame from './src/screens/SequenceGame';
import MathRushGame from './src/screens/MathRushGame';
import MergePuzzleGame from './src/screens/MergePuzzleGame';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AccessibilityProvider } from './src/contexts/AccessibilityContext';

export type RootStackParamList = {
  Menu: undefined;
  Settings: undefined;
  Stats: undefined;
  Achievements: undefined;
  FlipMatchGame: undefined;
  SequenceGame: undefined;
  MathRushGame: undefined;
  MergePuzzleGame: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AccessibilityProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Menu"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="Achievements" component={AchievementsScreen} />
            <Stack.Screen name="FlipMatchGame" component={FlipMatchGame} />
            <Stack.Screen name="SequenceGame" component={SequenceGame} />
            <Stack.Screen name="MathRushGame" component={MathRushGame} />
            <Stack.Screen name="MergePuzzleGame" component={MergePuzzleGame} />
          </Stack.Navigator>
          </NavigationContainer>
        </ErrorBoundary>
      </ThemeProvider>
    </AccessibilityProvider>
  );
}
