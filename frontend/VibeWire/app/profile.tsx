import React, { useState } from 'react';
import GraphScreen from './Graph'; 
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

interface Connection {
  id: string;
  name: string;
  bio: string;
  image: string;
  degree: 1 | 2;
  mutualConnections?: number;
  college?: string;
  bhawan?: string;
  year?: string;
  course?: string;
}

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showConnections, setShowConnections] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConnectionDetail, setShowConnectionDetail] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Get user data from route params (passed from signup/OTP verification)
  const params = useLocalSearchParams();
  
  const [userDetails, setUserDetails] = useState({
    name: params?.name || 'User Name',
    phoneNumber: params?.phoneNumber || 'Phone Number',
    bio: params?.bio || 'No bio provided',
    image: params?.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    userNumber: `USR${Math.floor(100000 + Math.random() * 900000)}`, // Generate unique user number
    connectionsCount: 0 // Start with 0 connections for new user
  });

  const [editForm, setEditForm] = useState({
    name: userDetails.name,
    bio: userDetails.bio,
    image: userDetails.image,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

 // Mock connections data - IIT Roorkee students from different bhawans
  const connections: Connection[] = [
    {
      id: '1',
      name: 'Arjun Sharma',
      bio: 'Computer Science student passionate about AI and Machine Learning',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
      degree: 1,
      bhawan: 'Rajiv Bhawan',
      year: '3rd Year',
      course: 'B.Tech Computer Science'
    },
    {
      id: '2',
      name: 'Priya Patel',
      bio: 'Electronics Engineering student, loves robotics and innovation',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b2f31dd1?w=80&h=80&fit=crop&crop=face',
      degree: 1,
      bhawan: 'Aravali Bhawan',
      year: '2nd Year',
      course: 'B.Tech Electronics'
    },
    {
      id: '3',
      name: 'Rohit Gupta',
      bio: 'Mechanical Engineering student with interest in automotive design',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
      degree: 2,
      mutualConnections: 3,
      bhawan: 'Jawahar Bhawan',
      year: '1st Year',
      course: 'B.Tech Mechanical'
    },
    {
      id: '4',
      name: 'Sneha Reddy',
      bio: 'Chemical Engineering student aspiring to work in sustainable energy',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
      degree: 1,
      bhawan: 'Govind Bhawan',
      year: '4th Year',
      course: 'B.Tech Chemical'
    },
    {
      id: '5',
      name: 'Vikram Singh',
      bio: 'Civil Engineering student, interested in infrastructure development',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
      degree: 2,
      mutualConnections: 7,
      bhawan: 'Ravindra Bhawan',
      year: '3rd Year',
      course: 'B.Tech Civil'
    },
    {
      id: '6',
      name: 'Ananya Iyer',
      bio: 'Architecture student with passion for sustainable design',
      image: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=80&h=80&fit=crop&crop=face',
      degree: 1,
      bhawan: 'Rajendra Bhawan',
      year: '2nd Year',
      course: 'B.Arch'
    },
    {
      id: '7',
      name: 'Kartik Agarwal',
      bio: 'Metallurgy Engineering student interested in materials science',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face',
      degree: 2,
      mutualConnections: 2,
      bhawan: 'Rajiv Bhawan',
      year: '3rd Year',
      course: 'B.Tech Metallurgy'
    },
    {
      id: '8',
      name: 'Kavya Nair',
      bio: 'Biotechnology student passionate about genetic engineering research',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face',
      degree: 1,
      bhawan: 'Aravali Bhawan',
      year: '2nd Year',
      course: 'B.Tech Biotechnology'
    },
    {
      id: '9',
      name: 'Aaditya Mehta',
      bio: 'Electrical Engineering student working on renewable energy projects',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
      degree: 1,
      bhawan: 'Jawahar Bhawan',
      year: '4th Year',
      course: 'B.Tech Electrical'
    },
    {
      id: '10',
      name: 'Riya Sharma',
      bio: 'Production Engineering student interested in automation and robotics',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b2f31dd1?w=80&h=80&fit=crop&crop=face',
      degree: 2,
      mutualConnections: 5,
      bhawan: 'Govind Bhawan',
      year: '1st Year',
      course: 'B.Tech Production'
    }
  ];

  const firstDegreeConnections = connections.filter(c => c.degree === 1);
  const secondDegreeConnections = connections.filter(c => c.degree === 2);

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConnectionPress = (connection: Connection) => {
    setSelectedConnection(connection);
    setShowConnectionDetail(true);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission denied', 'We need access to your camera roll to select a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setEditForm(prev => ({
        ...prev,
        image: result.assets[0].uri
      }));
    }
  };

  const handleSaveProfile = () => {
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    
    setUserDetails(prev => ({
      ...prev,
      name: editForm.name,
      bio: editForm.bio,
      image: editForm.image,
    }));
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleChangePassword = () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    // Here you would typically make an API call to change password
    Alert.alert('Success', 'Password changed successfully!');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordModal(false);
  };

  const renderConnection = ({ item }: { item: Connection }) => (
    <TouchableOpacity 
      style={styles.connectionItem}
      onPress={() => handleConnectionPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.connectionImage} />
      <View style={styles.connectionInfo}>
        <Text style={styles.connectionName}>{item.name}</Text>
        {item.degree === 2 && (
          <Text style={styles.mutualConnections}>
            {item.mutualConnections} mutual connections
          </Text>
        )}
      </View>
      <View style={[styles.degreeIndicator, item.degree === 1 ? styles.firstDegree : styles.secondDegree]}>
        <Text style={styles.degreeText}>{item.degree}°</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'map':
  return (
    <GraphScreen 
      userDetails={userDetails} 
      connections={connections} 
    />
  );
      case 'messages':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabTitle}>Messages</Text>
            <Text style={styles.tabSubtitle}>No messages yet</Text>
          </View>
        );
      case 'profile':
      default:
        return (
          <ScrollView style={styles.profileContent} showsVerticalScrollIndicator={false}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <TouchableOpacity onPress={isEditing ? pickImage : undefined}>
                <Image 
                  source={{ uri: isEditing ? editForm.image : userDetails.image }} 
                  style={styles.profileImage} 
                />
                {isEditing && (
                  <View style={styles.editImageOverlay}>
                    <Text style={styles.editImageText}>📷</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <View style={styles.profileInfo}>
                {isEditing ? (
                  <TextInput
                    style={styles.editNameInput}
                    value={editForm.name}
                    onChangeText={(text) => handleInputChange('name', text)}
                    placeholder="Enter your name"
                  />
                ) : (
                  <Text style={styles.profileName}>{userDetails.name}</Text>
                )}
                
                <Text style={styles.userNumber}>ID: {userDetails.userNumber}</Text>
                <Text style={styles.phoneNumber}>{userDetails.phoneNumber}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  if (isEditing) {
                    handleSaveProfile();
                  } else {
                    setIsEditing(true);
                  }
                }}
              >
                <Text style={styles.editButtonText}>
                  {isEditing ? '💾 Save' : '✏️ Edit'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bio Section */}
            <View style={styles.bioSection}>
              <Text style={styles.sectionTitle}>Bio</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={editForm.bio}
                  onChangeText={(text) => handleInputChange('bio', text)}
                  placeholder="Tell us about yourself..."
                  multiline
                  numberOfLines={3}
                  maxLength={150}
                />
              ) : (
                <Text style={styles.bioText}>{userDetails.bio || 'No bio available'}</Text>
              )}
            </View>

            {/* Stats Section */}
            <View style={styles.statsSection}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{connections.length}</Text>
                <Text style={styles.statLabel}>Connections</Text>
              </View>
            </View>

            {!isEditing && (
              <>
                {/* Change Password Button */}
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setShowPasswordModal(true)}
                >
                  <Text style={styles.actionButtonText}>🔒 Change Password</Text>
                </TouchableOpacity>

                {/* View Connections Button */}
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setShowConnections(true)}
                >
                  <Text style={styles.actionButtonText}>👥 View All Connections</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>VibeWire</Text>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {renderTabContent()}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'map' && styles.activeNavItem]}
          onPress={() => setActiveTab('map')}
        >
          <Text style={[styles.navIcon, activeTab === 'map' && styles.activeNavIcon]}>🗺️</Text>
          <Text style={[styles.navLabel, activeTab === 'map' && styles.activeNavLabel]}>Map</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'messages' && styles.activeNavItem]}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[styles.navIcon, activeTab === 'messages' && styles.activeNavIcon]}>💬</Text>
          <Text style={[styles.navLabel, activeTab === 'messages' && styles.activeNavLabel]}>Messages</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'profile' && styles.activeNavItem]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.navIcon, activeTab === 'profile' && styles.activeNavIcon]}>👤</Text>
          <Text style={[styles.navLabel, activeTab === 'profile' && styles.activeNavLabel]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Connections Modal */}
      <Modal
        visible={showConnections}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Connections</Text>
            <TouchableOpacity onPress={() => setShowConnections(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.connectionsContent}>
            <Text style={styles.connectionsSectionTitle}>
              First Degree ({firstDegreeConnections.length})
            </Text>
            <FlatList
              data={firstDegreeConnections}
              renderItem={renderConnection}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
            
            <Text style={styles.connectionsSectionTitle}>
              Second Degree ({secondDegreeConnections.length})
            </Text>
            <FlatList
              data={secondDegreeConnections}
              renderItem={renderConnection}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Connection Detail Modal */}
      <Modal
        visible={showConnectionDetail}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowConnectionDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.connectionDetailModal}>
            {selectedConnection && (
              <>
                <Image 
                  source={{ uri: selectedConnection.image }} 
                  style={styles.detailProfileImage} 
                />
                <Text style={styles.detailName}>{selectedConnection.name}</Text>
                <Text style={styles.detailBio}>{selectedConnection.bio}</Text>
                {selectedConnection.college && (
                  <View style={styles.educationInfo}>
                    <Text style={styles.educationLabel}>📚 Education</Text>
                    <Text style={styles.educationText}>{selectedConnection.course}</Text>
                    <Text style={styles.educationText}>{selectedConnection.year} • {selectedConnection.college}</Text>
                  </View>
                )}
                {selectedConnection.degree === 2 && (
                  <Text style={styles.mutualConnectionsDetail}>
                    {selectedConnection.mutualConnections} mutual connections
                  </Text>
                )}
                <View style={styles.detailButtons}>
                  <TouchableOpacity style={styles.connectButton}>
                    <Text style={styles.connectButtonText}>💬 Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.closeDetailButton}
                    onPress={() => setShowConnectionDetail(false)}
                  >
                    <Text style={styles.closeDetailButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.passwordForm}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChangeText={(text) => handlePasswordChange('currentPassword', text)}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChangeText={(text) => handlePasswordChange('newPassword', text)}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChangeText={(text) => handlePasswordChange('confirmPassword', text)}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleChangePassword}
            >
              <Text style={styles.saveButtonText}>Change Password</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C5CE7',
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  tabSubtitle: {
    fontSize: 16,
    color: '#636E72',
  },
  profileContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#6C5CE7',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageText: {
    fontSize: 12,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  editNameInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    borderBottomWidth: 1,
    borderBottomColor: '#6C5CE7',
    paddingBottom: 4,
  },
  userNumber: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#6C5CE7',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bioSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    color: '#636E72',
    lineHeight: 24,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C5CE7',
  },
  statLabel: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: '#F8F7FF',
    borderRadius: 12,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeNavIcon: {
    fontSize: 22,
  },
  navLabel: {
    fontSize: 12,
    color: '#636E72',
  },
  activeNavLabel: {
    color: '#6C5CE7',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  closeButton: {
    fontSize: 20,
    color: '#636E72',
    padding: 4,
  },
  connectionsContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  connectionsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginVertical: 16,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  connectionImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  connectionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  mutualConnections: {
    fontSize: 12,
    color: '#6C5CE7',
    marginTop: 2,
  },
  degreeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstDegree: {
    backgroundColor: '#00B894',
  },
  secondDegree: {
    backgroundColor: '#FDCB6E',
  },
  degreeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionDetailModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 300,
  },
  detailProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#6C5CE7',
  },
  detailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  detailBio: {
    fontSize: 16,
    color: '#636E72',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  educationInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  educationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  educationText: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 4,
  },
  mutualConnectionsDetail: {
    fontSize: 14,
    color: '#6C5CE7',
    marginBottom: 20,
    fontWeight: '500',
  },
  detailButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  connectButton: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeDetailButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  closeDetailButtonText: {
    color: '#636E72',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordForm: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  saveButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});