import { useState, useEffect } from "react"
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList, ActivityIndicator } from "react-native"
import * as ImagePicker from "expo-image-picker"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { userAPI, connectionAPI } from "../../src/services/api"
import { useAuth } from "../../src/context/AuthContext"

interface Connection {
  id: string
  name: string
  bio: string
  image: string
  degree: number
  mutualConnections?: number
  college?: string
  bhawan?: string
  year?: string
  course?: string
}

export default function ProfileScreen() {
  const { user: authUser, updateUser } = useAuth();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userConnections, setUserConnections] = useState<Connection[]>([])
  const [showConnections, setShowConnections] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showConnectionDetail, setShowConnectionDetail] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    image: "",
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const resolveImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) {
      return 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200';
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `http://192.168.29.208:3000/${imagePath}`;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const [user, connections] = await Promise.all([
            userAPI.getUserById(parsedUser.id),
            connectionAPI.getConnections(),
          ]);
          setUserDetails(user);
          // Set degree mapping and placeholder image fallback, deduplicating by ID
          const uniqueMap = new Map();
          (connections || []).forEach((c: any) => {
            if (c && c.id) {
              uniqueMap.set(c.id, c);
            }
          });
          const mappedConnections = Array.from(uniqueMap.values()).map((c: any) => ({
            ...c,
            image: resolveImageUrl(c.image)
          }));
          setUserConnections(mappedConnections);
          setEditForm({
            name: user.name || "",
            bio: user.bio || "",
            image: resolveImageUrl(user.profileImage),
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
  
  const handleInputChange = (field: string, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleConnectionPress = (connection: Connection) => {
    setSelectedConnection(connection)
    setShowConnectionDetail(true)
  }

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult.granted) {
      Alert.alert("Permission denied", "We need access to your camera roll to select a photo.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    })

    if (!result.canceled) {
      setEditForm((prev) => ({
        ...prev,
        image: result.assets[0].uri,
      }))
    }
  }

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert("Error", "Name cannot be empty")
      return
    }

    const updatedUser = {
      ...authUser,
      name: editForm.name,
      bio: editForm.bio,
      profileImage: editForm.image,
    }

    setUserDetails((prev: any) => ({
      ...prev,
      name: editForm.name,
      bio: editForm.bio,
      profileImage: editForm.image,
    }))
    
    await updateUser(updatedUser)

    setIsEditing(false)
    Alert.alert("Success", "Profile updated successfully!")
  }

  const handleChangePassword = () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all password fields")
      return
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match")
      return
    }

    Alert.alert("Success", "Password changed successfully!")
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setShowPasswordModal(false)
  }

  const renderConnection = ({ item }: { item: Connection }) => (
    <TouchableOpacity style={styles.connectionCard} onPress={() => handleConnectionPress(item)}>
      <Image source={{ uri: item.image }} style={styles.connectionAvatar} />
      <View style={styles.connectionInfo}>
        <Text style={styles.connectionName}>{item.name}</Text>
        <Text style={styles.connectionText}>{item.course || "B.Tech"}</Text>
        <Text style={styles.connectionText}>
          {item.bhawan || "Rajendra"} • {item.year || "3rd Year"}
        </Text>
        {item.degree === 2 && item.mutualConnections && (
          <Text style={styles.mutualText}>⚡ {item.mutualConnections} mutual connections</Text>
        )}
      </View>
      <View style={[styles.degreeIndicator, item.degree === 1 ? styles.firstDegree : styles.secondDegree]}>
        <Text style={styles.degreeText}>{item.degree}°</Text>
      </View>
    </TouchableOpacity>
  )

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00F0FF" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (!userDetails) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Could not load profile. Please try logging in again.</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vibe Profile</Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Details Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={isEditing ? pickImage : undefined} style={styles.avatarContainer}>
            <Image 
              source={{ uri: isEditing ? editForm.image : resolveImageUrl(userDetails.profileImage) }} 
              style={styles.profileAvatar} 
            />
            {isEditing && (
              <View style={styles.avatarEditOverlay}>
                <Text style={styles.avatarEditText}>📷</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.profileMeta}>
            {isEditing ? (
              <TextInput
                style={styles.nameInput}
                value={editForm.name}
                onChangeText={(text) => handleInputChange("name", text)}
                placeholder="Name"
                placeholderTextColor="#666"
              />
            ) : (
              <Text style={styles.profileName}>{userDetails.name}</Text>
            )}

            <Text style={styles.profileId}>ID: {userDetails.id}</Text>
            <Text style={styles.profilePhone}>{userDetails.phoneNumber}</Text>
          </View>

          <TouchableOpacity
            style={[styles.editButton, isEditing ? styles.saveModeButton : styles.editModeButton]}
            onPress={() => {
              if (isEditing) {
                handleSaveProfile()
              } else {
                setIsEditing(true)
              }
            }}
          >
            <Text style={styles.editButtonText}>{isEditing ? "💾 Save" : "✏️ Edit"}</Text>
          </TouchableOpacity>
        </View>

        {/* Bio Section */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>About Me</Text>
          {isEditing ? (
            <TextInput
              style={[styles.darkTextInput, styles.bioInput]}
              value={editForm.bio}
              onChangeText={(text) => handleInputChange("bio", text)}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
              maxLength={150}
            />
          ) : (
            <Text style={styles.bioText}>{userDetails.bio || "No bio set yet. Add a bio to share your vibe!"}</Text>
          )}
        </View>

        {/* Connections Count Section */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userConnections.length}</Text>
            <Text style={styles.statLabel}>Connections</Text>
          </View>
        </View>

        {!isEditing && (
          <View style={styles.actionsContainer}>
            {/* View Connections */}
            {userConnections.length > 0 ? (
              <TouchableOpacity style={[styles.actionButton, styles.connectionsBtn]} onPress={() => setShowConnections(true)}>
                <Text style={styles.connectionsBtnText}>👥 View Network ({userConnections.length})</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.noConnectionsBox}>
                <Text style={styles.noConnectionsText}>🔗 No connections yet. Explore the social graph to build your crew!</Text>
              </View>
            )}

            {/* Change Password */}
            <TouchableOpacity style={[styles.actionButton, styles.passwordBtn]} onPress={() => setShowPasswordModal(true)}>
              <Text style={styles.passwordBtnText}>🔒 Security Settings</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Connections List Modal */}
      <Modal visible={showConnections} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowConnections(false)}>
        <View style={styles.darkModal}>
          <View style={styles.darkModalHeader}>
            <Text style={styles.darkModalTitle}>My Social Network</Text>
            <TouchableOpacity onPress={() => setShowConnections(false)}>
              <Text style={styles.closeModalText}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={userConnections}
            renderItem={renderConnection}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalScrollContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No connections found.</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Connection Detail Modal */}
      <Modal
        visible={showConnectionDetail}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowConnectionDetail(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.glassModal}>
            {selectedConnection && (
              <>
                <Image source={{ uri: selectedConnection.image }} style={styles.detailAvatar} />
                <Text style={styles.detailName}>{selectedConnection.name}</Text>
                <Text style={styles.detailBio}>{selectedConnection.bio || "No bio yet."}</Text>

                {(selectedConnection.course || selectedConnection.bhawan) && (
                  <View style={styles.educationCard}>
                    <Text style={styles.educationTitle}>📚 Campus Info</Text>
                    {selectedConnection.course && <Text style={styles.educationText}>{selectedConnection.course}</Text>}
                    {(selectedConnection.bhawan || selectedConnection.year) && (
                      <Text style={styles.educationText}>
                        {selectedConnection.year || "3rd Year"} • {selectedConnection.bhawan || "Rajendra Bhawan"}
                      </Text>
                    )}
                  </View>
                )}

                {selectedConnection.degree === 2 && selectedConnection.mutualConnections && (
                  <Text style={styles.mutualLabel}>
                    ⚡ {selectedConnection.mutualConnections} mutual connections
                  </Text>
                )}

                <View style={styles.detailButtons}>
                  <TouchableOpacity 
                    style={[styles.modalBtn, styles.msgBtn]}
                    onPress={() => {
                      Alert.alert("Chat", "Direct messaging is loading...");
                      setShowConnectionDetail(false);
                    }}
                  >
                    <Text style={styles.msgBtnText}>💬 Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowConnectionDetail(false)}>
                    <Text style={styles.cancelBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal visible={showPasswordModal} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.darkModal}>
          <View style={styles.darkModalHeader}>
            <Text style={styles.darkModalTitle}>Change Password</Text>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.closeModalText}>✕</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Current Password</Text>
              <TextInput
                style={styles.darkTextInput}
                placeholder="••••••••"
                placeholderTextColor="#666"
                value={passwordForm.currentPassword}
                onChangeText={(text) => handlePasswordChange("currentPassword", text)}
                secureTextEntry
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>New Password</Text>
              <TextInput
                style={styles.darkTextInput}
                placeholder="At least 6 characters"
                placeholderTextColor="#666"
                value={passwordForm.newPassword}
                onChangeText={(text) => handlePasswordChange("newPassword", text)}
                secureTextEntry
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.darkTextInput}
                placeholder="Confirm new password"
                placeholderTextColor="#666"
                value={passwordForm.confirmPassword}
                onChangeText={(text) => handlePasswordChange("confirmPassword", text)}
                secureTextEntry
              />
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={handleChangePassword}>
              <Text style={styles.submitButtonText}>Change Password</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#B2B2CC",
    marginTop: 12,
  },
  errorText: {
    color: "#FF2D8F",
    fontWeight: "bold",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A36",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Profile Info Layout
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A36",
  },
  avatarContainer: {
    position: "relative",
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: "#00F0FF",
  },
  avatarEditOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#00F0FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEditText: {
    fontSize: 12,
  },
  profileMeta: {
    flex: 1,
    marginLeft: 18,
  },
  profileName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  nameInput: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    borderBottomWidth: 1.5,
    borderBottomColor: "#00F0FF",
    paddingBottom: 2,
  },
  profileId: {
    fontSize: 13,
    color: "#8E8EA8",
    marginTop: 4,
  },
  profilePhone: {
    fontSize: 13,
    color: "#8E8EA8",
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  editModeButton: {
    backgroundColor: "#1C1C3A",
    borderWidth: 1,
    borderColor: "#2E2E5F",
  },
  saveModeButton: {
    backgroundColor: "#00E676",
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  // Bio Card
  cardSection: {
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A36",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8E8EA8",
    marginBottom: 10,
  },
  bioText: {
    fontSize: 15,
    color: "#B2B2CC",
    lineHeight: 22,
  },
  bioInput: {
    height: 80,
    textAlignVertical: "top",
  },
  // Stats
  statsCard: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A36",
    alignItems: "center",
  },
  statBox: {
    alignItems: "center",
    backgroundColor: "#13132B",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderWidth: 1,
    borderColor: "#1E1E3F",
  },
  statNumber: {
    fontSize: 26,
    fontWeight: "900",
    color: "#00F0FF",
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8EA8",
    marginTop: 4,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  // Actions List
  actionsContainer: {
    paddingVertical: 24,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  connectionsBtn: {
    backgroundColor: "#FF2D8F",
  },
  connectionsBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  passwordBtn: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#2E2E5F",
  },
  passwordBtnText: {
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "700",
  },
  noConnectionsBox: {
    backgroundColor: "#13132B",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E1E3F",
    alignItems: "center",
  },
  noConnectionsText: {
    color: "#8E8EA8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  // Dark Modal
  darkModal: {
    flex: 1,
    backgroundColor: "#0A0A1C",
  },
  darkModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A36",
  },
  darkModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  closeModalText: {
    color: "#8E8EA8",
    fontSize: 20,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    color: "#8E8EA8",
    fontSize: 14,
  },
  // Connection Row Card
  connectionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#13132B",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1E1E3F",
  },
  connectionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  connectionInfo: {
    flex: 1,
    marginLeft: 14,
  },
  connectionName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  connectionText: {
    fontSize: 12,
    color: "#8E8EA8",
  },
  mutualText: {
    fontSize: 12,
    color: "#00F0FF",
    fontWeight: "600",
    marginTop: 4,
  },
  degreeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  firstDegree: {
    backgroundColor: "#FF2D8F",
  },
  secondDegree: {
    backgroundColor: "#FFB800",
  },
  degreeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  // Popups/Modals overlays
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3, 3, 10, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  glassModal: {
    backgroundColor: "#111126",
    borderRadius: 24,
    padding: 24,
    margin: 20,
    width: "85%",
    maxWidth: 320,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222240",
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#FF2D8F",
  },
  detailName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    textAlign: "center",
  },
  detailBio: {
    fontSize: 13,
    color: "#B2B2CC",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  educationCard: {
    backgroundColor: "#161633",
    padding: 12,
    borderRadius: 12,
    width: "100%",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#22224A",
  },
  educationTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  educationText: {
    fontSize: 12,
    color: "#8E8EA8",
    marginBottom: 2,
  },
  mutualLabel: {
    fontSize: 12,
    color: "#00F0FF",
    fontWeight: "700",
    marginBottom: 18,
  },
  detailButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  msgBtn: {
    backgroundColor: "#00F0FF",
  },
  msgBtnText: {
    color: "#0B0B1E",
    fontSize: 13,
    fontWeight: "700",
  },
  cancelBtn: {
    backgroundColor: "#1C1C3A",
    borderWidth: 1,
    borderColor: "#2E2E5F",
  },
  cancelBtnText: {
    color: "#8E8EA8",
    fontSize: 13,
    fontWeight: "600",
  },
  // Form modal
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8E8EA8",
    marginBottom: 8,
  },
  darkTextInput: {
    backgroundColor: "#13132B",
    borderWidth: 1.5,
    borderColor: "#1E1E3F",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: "#FFFFFF",
  },
  submitButton: {
    backgroundColor: "#00F0FF",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#0B0B1E",
    fontSize: 15,
    fontWeight: "700",
  },
})
