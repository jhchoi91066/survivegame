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
import ConnectFlowGame from './src/screens/ConnectFlowGame';
import ErrorBoundary from './src/components/ErrorBoundary';

export type RootStackParamList = {
  Menu: undefined;
  Settings: undefined;
  Stats: undefined;
  Achievements: undefined;
  FlipMatchGame: undefined;
  SequenceGame: undefined;
  MathRushGame: undefined;
  ConnectFlowGame: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
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
          <Stack.Screen name="ConnectFlowGame" component={ConnectFlowGame} />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
