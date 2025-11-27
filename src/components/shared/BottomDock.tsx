import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { GlassView } from './GlassView';
import { useTheme } from '../../contexts/ThemeContext';
import { Gamepad2, BarChart2, Trophy, User, Users, Swords, Medal } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { hapticPatterns } from '../../utils/haptics';

export type TabType = 'Menu' | 'Stats' | 'Leaderboard' | 'Friends' | 'Multiplayer' | 'Achievements' | 'Profile';

interface BottomDockProps {
    currentTab: TabType;
    onTabPress: (tab: TabType) => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({ currentTab, onTabPress }) => {
    const { theme, themeMode } = useTheme();

    const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
        { id: 'Menu', label: 'Play', icon: Gamepad2 },
        { id: 'Stats', label: 'Stats', icon: BarChart2 },
        { id: 'Leaderboard', label: 'Rank', icon: Trophy },
        { id: 'Friends', label: 'Friends', icon: Users },
        { id: 'Multiplayer', label: 'Match', icon: Swords },
        { id: 'Achievements', label: 'Awards', icon: Medal },
        { id: 'Profile', label: 'Profile', icon: User },
    ];

    return (
        <View style={styles.container}>
            <GlassView
                style={styles.dock}
                intensity={30}
                tint={themeMode === 'dark' ? 'dark' : 'light'}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {tabs.map((tab) => (
                        <DockItem
                            key={tab.id}
                            item={tab}
                            isActive={currentTab === tab.id}
                            onPress={() => {
                                hapticPatterns.buttonPress();
                                onTabPress(tab.id);
                            }}
                            theme={theme}
                        />
                    ))}
                </ScrollView>
            </GlassView>
        </View>
    );
};

interface DockItemProps {
    item: { id: TabType; label: string; icon: React.ElementType };
    isActive: boolean;
    onPress: () => void;
    theme: any;
}

const DockItem: React.FC<DockItemProps> = ({ item, isActive, onPress, theme }) => {
    const Icon = item.icon;
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const activeIndicatorStyle = useAnimatedStyle(() => ({
        opacity: withTiming(isActive ? 1 : 0),
        transform: [{ scale: withSpring(isActive ? 1 : 0) }],
    }));

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => { scale.value = withSpring(0.9); }}
            onPressOut={() => { scale.value = withSpring(1); }}
            style={styles.itemContainer}
        >
            <Animated.View style={[styles.itemContent, animatedStyle]}>
                <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                    <Icon
                        size={24}
                        color={isActive ? '#fff' : theme.colors.textSecondary}
                    />
                </View>
                <Text style={[
                    styles.label,
                    { color: isActive ? theme.colors.primary : theme.colors.textSecondary }
                ]}>
                    {item.label}
                </Text>
                <Animated.View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary }, activeIndicatorStyle]} />
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 100,
    },
    dock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 30,
        width: '100%',
        maxWidth: 500, // Increased max width
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        gap: 4,
    },
    itemContainer: {
        width: 60, // Fixed width for items
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemContent: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    iconContainer: {
        padding: 8,
        borderRadius: 16,
    },
    activeIconContainer: {
        backgroundColor: '#4f46e5', // Indigo-600 equivalent
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        transform: [{ translateY: -4 }],
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -8,
        width: 4,
        height: 4,
        borderRadius: 2,
    },
});
