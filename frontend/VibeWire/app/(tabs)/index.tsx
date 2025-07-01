import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GraphScreen from '../Graph'; // Adjust the import path if necessary

export default function TabsIndex() {
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUserDetails({
            name: parsedUser.name,
            image: parsedUser.profileImage || 'https://via.placeholder.com/150', // Provide a fallback image
            userNumber: parsedUser.phoneNumber,
          });
        }
      } catch (error) {
        console.error("Failed to load user data from storage", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text>Loading your network...</Text>
      </View>
    );
  }

  if (!userDetails) {
    return (
      <View style={styles.container}>
        <Text>Could not load user details. Please try logging in again.</Text>
      </View>
    );
  }

  return <GraphScreen userDetails={userDetails} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
  },
});
