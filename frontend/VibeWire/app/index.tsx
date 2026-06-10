import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth state to be loaded from storage

    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/welcome');
    }
  }, [isAuthenticated, loading]);

  // Show a plain spinner while auth state loads (usually < 100ms)
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6C5CE7" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
