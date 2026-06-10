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
        // Mapped fallback profile image
        const mappedUsers = (users || []).map((u: any) => ({
          ...u,
          profileImage: u.profileImage || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'
        }));
        setConnections(mappedUsers.filter((u: any) => u.id !== user?.id));
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
        return prev.filter(id => id !== connectionId);
      } else {
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
      await api.post('/api/connections', {
        friendIds: selectedConnections.map(id => parseInt(id, 10)),
      });
      router.replace('/(tabs)');

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
            <Text style={styles.connectionDetails}>{connection.course || "B.Tech"}</Text>
            <Text style={styles.connectionDetails}>{connection.bhawan || "Rajendra"} • {connection.year || "3rd Year"}</Text>
            <Text style={styles.connectionBio} numberOfLines={2}>{connection.bio || "No bio yet."}</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
      
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
          disabled={selectedConnections.length === 0}
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
    backgroundColor: '#0F0F23',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1C1C3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2E2E5F',
  },
  backButtonText: {
    fontSize: 20,
    color: '#00F0FF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8EA8',
    lineHeight: 22,
  },
  counterContainer: {
    paddingHorizontal: 24,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00F0FF',
  },
  minText: {
    fontSize: 12,
    color: '#8E8EA8',
  },
  connectionsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#13132B',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#FF2D8F',
    backgroundColor: '#18122B',
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
    marginRight: 14,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  connectionDetails: {
    fontSize: 12,
    color: '#8E8EA8',
    marginBottom: 2,
  },
  connectionBio: {
    fontSize: 12,
    color: '#8E8EA8',
    marginTop: 4,
    lineHeight: 16,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#222240',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectedCheckmark: {
    backgroundColor: '#FF2D8F',
    borderColor: '#FF2D8F',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#0F0F23',
    borderTopWidth: 1,
    borderTopColor: '#1A1A36',
  },
  continueButton: {
    backgroundColor: '#FF2D8F',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF2D8F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#66163E',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});