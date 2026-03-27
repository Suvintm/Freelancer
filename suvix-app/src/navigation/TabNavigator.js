import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/Colors';

import TopNavbar from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';

// Screens
import ExploreScreen from '../screens/ExploreScreen';
import NearbyScreen from '../screens/NearbyScreen';
import ReelsScreen from '../screens/ReelsScreen';
import JobsScreen from '../screens/JobsScreen';
import ChatsScreen from '../screens/ChatsScreen';
import { useAuthStore } from '../context/useAuthStore';

// Temporary Dashboard components (matching App.js placeholders)
const DummyHome = () => {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: theme.text, fontSize: 24, fontWeight: 'bold' }}>SuviX Home</Text>
      <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Production Ready ✅</Text>
    </View>
  );
};

const DummyProfile = () => {
    const { theme } = useTheme();
    return (
      <View style={{ flex: 1, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.text, fontSize: 24, fontWeight: 'bold' }}>User Profile</Text>
        <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Settings & Portfolio Soon</Text>
      </View>
    );
};

const Tab = createBottomTabNavigator();

/**
 * Custom Center Button for Reels (Floating Effect)
 */
const CustomTabBarButton = ({ children, onPress }) => {
  const { isDarkMode } = useTheme();
  return (
    <TouchableOpacity
      style={styles.centerButtonContainer}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.centerButton, { backgroundColor: isDarkMode ? '#000000' : '#11111A' }]}>
        {children}
      </View>
    </TouchableOpacity>
  );
};

const TabNavigator = () => {
  const { user } = useAuthStore();
  const { theme, isDarkMode } = useTheme();

  const activeColor = isDarkMode ? '#FFFFFF' : '#000000';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => <TopNavbar />,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: [
            styles.tabBar, 
            { 
              backgroundColor: isDarkMode ? '#000000' : '#FFFFFF', 
              borderTopColor: theme.border,
              height: Platform.OS === 'ios' ? 88 : 70, 
            }
        ],
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: theme.textSecondary,
        detachInactiveScreens: true,
        lazy: true,
        freezeOnBlur: true,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={DummyHome} 
        options={{
          tabBarLabel: ({ focused }) => focused ? <Text style={[styles.tabBarLabel, { color: activeColor }]}>Home</Text> : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen} 
        options={{
          headerShown: false,
          tabBarLabel: ({ focused }) => focused ? <Text style={[styles.tabBarLabel, { color: activeColor }]}>Explore</Text> : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "search" : "search-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Nearby" 
        component={NearbyScreen} 
        options={{
          headerShown: false,
          tabBarLabel: ({ focused }) => focused ? <Text style={[styles.tabBarLabel, { color: activeColor }]}>Nearby</Text> : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "location" : "location-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Reels" 
        component={ReelsScreen} 
        options={{
          tabBarLabel: ({ focused }) => focused ? <Text style={[styles.tabBarLabel, { color: activeColor, marginTop: 40 }]}>Reels</Text> : null,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="movie-play" size={32} color={color} />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tab.Screen 
        name="Jobs" 
        component={JobsScreen} 
        options={{
          tabBarLabel: ({ focused }) => focused ? <Text style={[styles.tabBarLabel, { color: activeColor }]}>Jobs</Text> : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatsScreen} 
        options={{
          tabBarLabel: ({ focused }) => focused ? <Text style={[styles.tabBarLabel, { color: activeColor }]}>Chats</Text> : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={DummyProfile} 
        options={{
          tabBarLabel: ({ focused }) => focused ? <Text style={[styles.tabBarLabel, { color: activeColor }]}>Profile</Text> : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 0,
  },
  centerButtonContainer: {
    top: -12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default TabNavigator;
