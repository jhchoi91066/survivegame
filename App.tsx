import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MenuScreen from './src/screens/MenuScreen';
import GameScreen from './src/screens/GameScreen';
import LevelSelectScreen from './src/screens/LevelSelectScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatsScreen from './src/screens/StatsScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';

export type RootStackParamList = {
  Menu: undefined;
  Game: { level?: number };
  LevelSelect: undefined;
  Settings: undefined;
  Stats: undefined;
  Achievements: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Menu"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="LevelSelect" component={LevelSelectScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
