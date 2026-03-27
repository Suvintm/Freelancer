import React, { useRef } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, Platform, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../context/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

const TopNavbar = () => {
    const insets = useSafeAreaInsets();
    const { theme, isDarkMode, setThemeMode, themeMode } = useTheme();
    const { user } = useAuthStore();
    const navigation = useNavigation();
    const queryClient = useQueryClient();

    // Animation for refresh icon
    const spinValue = useRef(new Animated.Value(0)).current;

    // Logic: 
    // The user requested to exchange these logos
    const logoSource = isDarkMode 
        ? require('../../assets/darklogo.png') 
        : require('../../assets/lightlogo.png');

    const handleLogoPress = () => {
        navigation.navigate('Home');
    };

    const toggleTheme = () => {
        const nextMode = themeMode === 'light' ? 'dark' : 'light';
        setThemeMode(nextMode);
    };

    const handleRefresh = () => {
        // Start spin animation
        spinValue.setValue(0);
        Animated.timing(spinValue, {
            toValue: 1,
            duration: 800,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start();

        // High-performance refresh: Invalidate all queries to force refetch across all screens
        queryClient.invalidateQueries();
    };

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={[
            styles.container, 
            { paddingTop: Math.max(insets.top, 10), backgroundColor: theme.primary, borderBottomColor: theme.border }
        ]}>
            <View style={styles.content}>
                {/* Left Section: Menu & Theme Toggle */}
                <View style={styles.leftSection}>
                    <TouchableOpacity style={styles.iconButton}>
                        <MaterialCommunityIcons name="menu" size={24} color={theme.text} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
                        <MaterialCommunityIcons 
                            name={isDarkMode ? "weather-sunny" : "weather-night"} 
                            size={22} 
                            color={isDarkMode ? "#FDB813" : theme.text} 
                        />
                    </TouchableOpacity>
                </View>

                {/* Center: Adaptive Logo */}
                <TouchableOpacity onPress={handleLogoPress} style={styles.logoContainer}>
                    <Image 
                        source={logoSource} 
                        style={styles.logo} 
                        resizeMode="contain"
                    />
                </TouchableOpacity>

                {/* Right Section: Refresh, Notifications & Profile */}
                <View style={styles.rightSection}>
                    <TouchableOpacity onPress={handleRefresh} style={styles.iconButton}>
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <MaterialCommunityIcons name="refresh" size={24} color={theme.text} />
                        </Animated.View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconButton}>
                        <MaterialCommunityIcons name="bell-outline" size={24} color={theme.text} />
                        <View style={[styles.badge, { borderColor: theme.primary }]} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => navigation.navigate('Profile')}
                        style={styles.profileButton}
                    >
                        <Image 
                            source={{ uri: user?.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }} 
                            style={[styles.profilePic, { borderColor: theme.border }]}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderBottomWidth: 1,
        zIndex: 100,
    },
    content: {
        height: 56,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        flex: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 100,
        height: 35,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
    },
    profileButton: {
        marginLeft: 8,
    },
    profilePic: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        borderWidth: 2,
    }
});

export default TopNavbar;
