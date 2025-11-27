import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MenuScreen from '../screens/MenuScreen';
import StatsScreen from '../screens/StatsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FriendsScreen from '../screens/FriendsScreen';
import MultiplayerLobbyScreen from '../screens/MultiplayerLobbyScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import { BottomDock, TabType } from '../components/shared/BottomDock';
import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    const { user } = useAuth();

    return (
        <Tab.Navigator
            tabBar={({ state, navigation }) => {
                const currentRoute = state.routes[state.index];
                const currentTab = currentRoute.name as TabType;

                return (
                    <BottomDock
                        currentTab={currentTab}
                        onTabPress={(tab) => {
                            const protectedTabs: TabType[] = ['Profile', 'Friends', 'Multiplayer'];
                            if (protectedTabs.includes(tab) && !user) {
                                navigation.navigate('Login');
                            } else {
                                navigation.navigate(tab);
                            }
                        }}
                    />
                );
            }}
            screenOptions={{
                headerShown: false,
                tabBarStyle: { display: 'none' }, // Hide default tab bar
            }}
        >
            <Tab.Screen name="Menu" component={MenuScreen} />
            <Tab.Screen name="Stats" component={StatsScreen} />
            <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Tab.Screen name="Friends" component={FriendsScreen} />
            <Tab.Screen name="Multiplayer" component={MultiplayerLobbyScreen} />
            <Tab.Screen name="Achievements" component={AchievementsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;
