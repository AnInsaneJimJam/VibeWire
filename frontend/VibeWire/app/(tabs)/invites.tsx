import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const response = await inviteAPI.getInvites();
      setInvites(response.invites || []);
      setApprovalRequests(response.approvalRequests || []);
    } catch (error) {
      console.error('Error fetching invites:', error);
      Alert.alert('Error', 'Failed to fetch invites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteResponse = async (inviteId: string, response: 'accepted' | 'declined') => {
    try {
      await inviteAPI.respondToInvite(inviteId, response);
      setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
      Alert.alert('Success', `Invitation ${response} successfully!`);
    } catch (error) {
      console.error('Error responding to invite:', error);
      Alert.alert('Error', 'Failed to respond to invite. Please try again.');
    }
  };

  const handleApprovalResponse = async (inviteId: string, response: 'approved' | 'denied') => {
    try {
      await inviteAPI.respondToApproval(inviteId, response);
      setApprovalRequests((prev) => prev.filter((invite) => invite.id !== inviteId));
      Alert.alert('Success', `Approval request ${response} successfully!`);
    } catch (error) {
      console.error('Error responding to approval:', error);
      Alert.alert('Error', 'Failed to respond to approval. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Inbox</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00F0FF" />
          <Text style={styles.loadingText}>Fetching your vibes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        <Text style={styles.subtitle}>Manage invitations & approvals</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hangout Invites Section */}
        <Text style={styles.sectionTitle}>📅 Hangout Invites</Text>
        {invites.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>All caught up! No pending invites.</Text>
          </View>
        ) : (
          invites.map((invite) => (
            <View key={invite.id} style={styles.card}>
              <Text style={styles.cardTitle}>{invite.hangout?.title || 'Untitled Hangout'}</Text>
              <Text style={styles.cardSubtitle}>
                Hosted by <Text style={styles.boldText}>{invite.sender?.name || 'Unknown'}</Text>
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.acceptButton]}
                  onPress={() => handleInviteResponse(invite.id, 'accepted')}
                >
                  <Text style={styles.buttonText}>✓ Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.declineButton]}
                  onPress={() => handleInviteResponse(invite.id, 'declined')}
                >
                  <Text style={styles.buttonText}>✕ Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Approval Requests Section */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>🛡️ Approval Requests</Text>
        {approvalRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔒</Text>
            <Text style={styles.emptyText}>No pending approval requests.</Text>
          </View>
        ) : (
          approvalRequests.map((invite) => (
            <View key={invite.id} style={styles.card}>
              <Text style={styles.cardTitle}>Vibe Permission Required</Text>
              <Text style={styles.cardSubtitle}>
                Approve hangout invite for <Text style={styles.boldText}>{invite.sender?.name}</Text> to join your social network graph?
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.acceptButton]}
                  onPress={() => handleApprovalResponse(invite.id, 'approved')}
                >
                  <Text style={styles.buttonText}>✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.declineButton]}
                  onPress={() => handleApprovalResponse(invite.id, 'denied')}
                >
                  <Text style={styles.buttonText}>✕ Deny</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A36',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8EA8',
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8EA8',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8E8EA8',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  emptyCard: {
    backgroundColor: '#13132B',
    borderRadius: 16,
    padding: 32,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E3F',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8EA8',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#13132B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#222244',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#B2B2CC',
    marginBottom: 18,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: '#00F0FF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#00E676',
  },
  declineButton: {
    backgroundColor: '#FF2D8F',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
