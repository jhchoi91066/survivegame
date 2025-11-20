import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassViewProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    border?: boolean;
    gradient?: boolean;
}

export const GlassView: React.FC<GlassViewProps> = ({
    children,
    style,
    intensity = 20,
    tint = 'dark',
    border = true,
    gradient = true,
}) => {
    // Web fallback since expo-blur might have issues on some web environments or for consistency
    if (Platform.OS === 'web') {
        return (
            <View style={[styles.webContainer, border && styles.border, style]}>
                {gradient && (
                    <LinearGradient
                        colors={tint === 'dark' ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
                        style={StyleSheet.absoluteFill}
                    />
                )}
                {children}
            </View>
        );
    }

    return (
        <View style={[styles.container, style]}>
            <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
            {gradient && (
                <LinearGradient
                    colors={tint === 'dark' ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'] : ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.2)']}
                    style={StyleSheet.absoluteFill}
                />
            )}
            <View style={[styles.content, border && styles.border]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        position: 'relative',
    },
    webContainer: {
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'rgba(30, 41, 59, 0.7)', // Fallback for dark mode web
        backdropFilter: 'blur(10px)', // CSS standard blur for web
    } as ViewStyle,
    content: {
        flex: 1,
    },
    border: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16, // Default radius, can be overridden by style
    },
});
