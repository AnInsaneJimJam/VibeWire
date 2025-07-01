import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { inviteAPI } from '../../src/services/api';

interface Invite {
  id: string;
  hangout: {
    title: string;
  };
  sender: {
    name: string;
  };
  status: string;
}

export default function InvitesScreen() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<Invite[]>([]);

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const response = await inviteAPI.getInvites();
        setInvites(response.invites);
        setApprovalRequests(response.approvalRequests);
      } catch (error) {
        console.error('Error fetching invites:', error);
        Alert.alert('Error', 'Failed to fetch invites. Please try again.');
      }
    };

    fetchInvites();
  }, []);

  const handleInviteResponse = async (inviteId: string, response: 'accepted' | 'declined') => {
    try {
      await inviteAPI.respondToInvite(inviteId, response);
      // Refresh the list of invites
      const updatedInvites = invites.filter((invite) => invite.id !== inviteId);
      setInvites(updatedInvites);
    } catch (error) {
      console.error('Error responding to invite:', error);
      Alert.alert('Error', 'Failed to respond to invite. Please try again.');
    }
  };

  const handleApprovalResponse = async (inviteId: string, response: 'approved' | 'denied') => {
    try {
      await inviteAPI.respondToApproval(inviteId, response);
      // Refresh the list of approval requests
      const updatedApprovalRequests = approvalRequests.filter((invite) => invite.id !== inviteId);
      setApprovalRequests(updatedApprovalRequests);
    } catch (error) {
      console.error('Error responding to approval:', error);
      Alert.alert('Error', 'Failed to respond to approval. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Hangout Invites</Text>
      {invites.map((invite) => (
        <View key={invite.id} style={styles.card}>
          <Text style={styles.cardTitle}>{invite.hangout.title}</Text>
          <Text style={styles.cardSubtitle}>From: {invite.sender.name}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={() => handleInviteResponse(invite.id, 'accepted')}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={() => handleInviteResponse(invite.id, 'declined')}
            >
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={styles.title}>Approval Requests</Text>
      {approvalRequests.map((invite) => (
        <View key={invite.id} style={styles.card}>
          <Text style={styles.cardTitle}>
            Approve hangout invite for {invite.sender.name} to connect with your friend?
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={() => handleApprovalResponse(invite.id, 'approved')}
            >
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={() => handleApprovalResponse(invite.id, 'denied')}
            >
              <Text style={styles.buttonText}>Deny</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  declineButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
