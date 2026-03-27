import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import API_BASE_URL from './src/config/api';

export default function App() {
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    // Create a timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      console.log("Attempting to connect to:", `${API_BASE_URL}/reels/feed?limit=1`);
      const response = await fetch(`${API_BASE_URL}/reels/feed?limit=1`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      console.log("Response received:", data);
      
      if (data.success) {
        Alert.alert("Success!", "SuviX App connected to SuviX Backend. Reels Discovery is live! 🎬");
      } else {
        Alert.alert("Partial Success", "Backend reached, but feed returned an issue.");
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        Alert.alert("Connection Timeout", "The server took too long to respond. Check if your backend is overloaded or if 10.0.2.2 is correct.");
      } else {
        console.error("Connection Error:", error);
        Alert.alert("Connection Failed", `Error: ${error.message}\n\nMake sure your server is running on port 5051 and bound to 0.0.0.0 or localhost.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#000000']}
        style={styles.background}
      >
        <SafeAreaView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.brandTitle}>SuviX</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>BETA v1.0</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.heroSub}>Happy Rama Navami ✨</Text>
            <Text style={styles.heroTitle}>The World Is Ready</Text>
            <Text style={styles.heroDescription}>
              Building the next generation of creative freedom. Your journey from Web to Mobile starts today.
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.button}
              onPress={testConnection}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Checking Pulse..." : "Connect to Discovery Engine"}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.versionInfo}>
              Endpoint: {API_BASE_URL}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  hero: {
    marginTop: 40,
  },
  heroSub: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#f8fafc',
    lineHeight: 56,
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 18,
    color: '#94a3b8',
    lineHeight: 28,
  },
  footer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  versionInfo: {
    marginTop: 16,
    color: '#475569',
    fontSize: 12,
  }
});
