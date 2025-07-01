import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import api, { userAPI } from '../src/services/api';

import { useAuth } from '../src/context/AuthContext';

interface Connection {
  id: string;
  name: string;
  bio: string;
  profileImage: string;
  bhawan: string;
  year: string;
  course: string;
}

export default function ConnectionsScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const { name, phoneNumber, bio, profileImage } = params;
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await userAPI.getAllUsers();
        setConnections(users.filter(u => u.id !== user.id));
      } catch (error) {
        console.error('Error fetching users:', error);
        Alert.alert('Error', 'Failed to fetch users. Please try again.');
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  const toggleConnection = (connectionId: string) => {
    setSelectedConnections(prev => {
      if (prev.includes(connectionId)) {
        // Remove connection
        return prev.filter(id => id !== connectionId);
      } else {
        // Add connection (max 8)
        if (prev.length >= 8) {
          Alert.alert('Limit Reached', 'You can select up to 8 connections only.');
          return prev;
        }
        return [...prev, connectionId];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedConnections.length === 0) {
      Alert.alert('Select Connections', 'Please select at least 1 connection to continue.');
      return;
    }

    try {
      // POST selected connection IDs to backend
      await api.post('/api/connections', {
        friendIds: selectedConnections.map(id => parseInt(id, 10)),
      });
      // On success, go to home
      router.replace('/(tabs)/');
    } catch (error) {
      console.error('Error saving connections:', error);
      Alert.alert('Error', 'Failed to save connections. Please try again.');
    }
  };

  const ConnectionCard = ({ connection }: { connection: Connection }) => {
    const isSelected = selectedConnections.includes(connection.id);
    
    return (
      <TouchableOpacity 
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => toggleConnection(connection.id)}
      >
        <View style={styles.cardContent}>
          <Image source={{ uri: connection.profileImage }} style={styles.profileImage} />
          
          <View style={styles.connectionInfo}>
            <Text style={styles.connectionName}>{connection.name}</Text>
            <Text style={styles.connectionDetails}>{connection.course}</Text>
            <Text style={styles.connectionDetails}>{connection.bhawan} • {connection.year}</Text>
            <Text style={styles.connectionBio} numberOfLines={2}>{connection.bio}</Text>
          </View>
          
          <View style={[styles.checkmark, isSelected && styles.selectedCheckmark]}>
            {isSelected && <Text style={styles.checkmarkText}>✓</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Connect with People</Text>
        <Text style={styles.subtitle}>Choose up to 8 connections to start building your network</Text>
      </View>

      {/* Selection Counter */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {selectedConnections.length}/8 selected
        </Text>
        {selectedConnections.length > 0 && (
          <Text style={styles.minText}>Minimum 1 required</Text>
        )}
      </View>

      {/* Connections List */}
      <ScrollView style={styles.connectionsList} showsVerticalScrollIndicator={false}>
        {connections.map((connection) => (
          <ConnectionCard key={connection.id} connection={connection} />
        ))}
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[
            styles.continueButton, 
            selectedConnections.length === 0 && styles.disabledButton
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            Continue ({selectedConnections.length})
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 24,
    color: '#6C5CE7',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#636E72',
    lineHeight: 22,
  },
  counterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  minText: {
    fontSize: 14,
    color: '#636E72',
  },
  connectionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#6C5CE7',
    backgroundColor: '#F5F3FF',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  connectionDetails: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 2,
  },
  connectionBio: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
    lineHeight: 18,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectedCheckmark: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  continueButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#B2B2B2',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});