import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';

// Infrastructure
import { queryClient } from './src/api/QueryClient';
import { useAuthStore } from './src/context/useAuthStore';
import { Colors } from './src/constants/Colors';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

// Temporary Home Screens (to be expanded in next phase)
import { View, Text, ActivityIndicator } from 'react-native';
const EditorHome = () => (
  <View style={{ flex: 1, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: Colors.white, fontSize: 24, fontWeight: 'bold' }}>Editor Dashboard</Text>
    <Text style={{ color: Colors.textSecondary, marginTop: 10 }}>Production Ready ✅</Text>
  </View>
);

const ClientHome = () => (
  <View style={{ flex: 1, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: Colors.white, fontSize: 24, fontWeight: 'bold' }}>Client Home</Text>
    <Text style={{ color: Colors.textSecondary, marginTop: 10 }}>Discovery Feed Soon 🎬</Text>
  </View>
);

const Stack = createNativeStackNavigator();

export default function App() {
  const { isAuthenticated, user, isLoading, initialize } = useAuthStore();

  React.useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.primary, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            {!isAuthenticated ? (
              // Auth Stack
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
              </>
            ) : (
              // Role-Based App Stack
              <>
                {user?.role === 'editor' ? (
                  <Stack.Screen name="EditorHome" component={EditorHome} />
                ) : (
                  <Stack.Screen name="ClientHome" component={ClientHome} />
                )}
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
