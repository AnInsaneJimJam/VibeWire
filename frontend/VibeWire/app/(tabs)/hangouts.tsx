"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  SafeAreaView,
  Alert,
  TextInput,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native"
import { hangoutAPI } from "../../src/services/api"
import { userAPI } from "../../src/services/api"

interface Connection {
  id: string
  name: string
  bio: string
  image: string
  degree: 1 | 2
  mutualConnections?: number
  college?: string
  bhawan?: string
  year?: string
  course?: string
}

interface Hangout {
  id: string
  title: string
  date: string
  time: string
  venue: string
  participants: Connection[]
  maxParticipants: number
  createdBy: string
  hostName: string
  status: "upcoming" | "ongoing" | "completed"
  description?: string
  pendingRequests?: Connection[]
}

const { width: screenWidth } = Dimensions.get("window")

export default function Hangouts() {
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "ongoing" | "completed">("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedHangout, setSelectedHangout] = useState<Hangout | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  // Form state for creating new hangout
  const [hangoutTitle, setHangoutTitle] = useState("")
  const [hangoutDate, setHangoutDate] = useState("")
  const [hangoutTime, setHangoutTime] = useState("")
  const [hangoutVenue, setHangoutVenue] = useState("")
  const [hangoutDescription, setHangoutDescription] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("4")
  const [selectedParticipants, setSelectedParticipants] = useState<Connection[]>([])

  const [hangouts, setHangouts] = useState<Hangout[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [hangoutsData, connectionsData] = await Promise.all([
          hangoutAPI.getHangouts(),
          userAPI.getAllUsers(),
        ])
        setHangouts(hangoutsData)
        setConnections(connectionsData)
        setError(null)
      } catch (err) {
        setError("Failed to fetch data. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])


  const filteredHangouts = hangouts.filter((hangout) => activeFilter === "all" || hangout.status === activeFilter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "#6C5CE7"
      case "ongoing":
        return "#00B894"
      case "completed":
        return "#636E72"
      default:
        return "#6C5CE7"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming":
        return "📅"
      case "ongoing":
        return "🔴"
      case "completed":
        return "✅"
      default:
        return "📅"
    }
  }

  const handleCreateHangout = () => {
    if (!hangoutTitle || !hangoutDate || !hangoutTime || !hangoutVenue) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    const newHangout: Hangout = {
      id: Date.now().toString(),
      title: hangoutTitle,
      date: hangoutDate,
      time: hangoutTime,
      venue: hangoutVenue,
      description: hangoutDescription,
      participants: selectedParticipants,
      maxParticipants: Number.parseInt(maxParticipants),
      createdBy: "USR123456",
      hostName: "You",
      status: "upcoming",
      pendingRequests: [],
    }

    setHangouts((prev) => [newHangout, ...prev])
    Alert.alert("Success!", `Hangout "${hangoutTitle}" has been created!`)
    resetForm()
    setShowCreateModal(false)
  }

  const resetForm = () => {
    setHangoutTitle("")
    setHangoutDate("")
    setHangoutTime("")
    setHangoutVenue("")
    setHangoutDescription("")
    setMaxParticipants("4")
    setSelectedParticipants([])
  }

  const toggleParticipant = (connection: Connection) => {
    setSelectedParticipants((prev) => {
      const isSelected = prev.find((p) => p.id === connection.id)
      if (isSelected) {
        return prev.filter((p) => p.id !== connection.id)
      } else {
        return [...prev, connection]
      }
    })
  }

  const handleApproveRequest = (hangoutId: string, connection: Connection) => {
    setHangouts((prev) =>
      prev.map((hangout) => {
        if (hangout.id === hangoutId) {
          return {
            ...hangout,
            participants: [...hangout.participants, connection],
            pendingRequests: hangout.pendingRequests?.filter((req) => req.id !== connection.id) || [],
          }
        }
        return hangout
      }),
    )
    Alert.alert("Approved!", `${connection.name} has been added to the hangout.`)
  }

  const handleRejectRequest = (hangoutId: string, connection: Connection) => {
    setHangouts((prev) =>
      prev.map((hangout) => {
        if (hangout.id === hangoutId) {
          return {
            ...hangout,
            pendingRequests: hangout.pendingRequests?.filter((req) => req.id !== connection.id) || [],
          }
        }
        return hangout
      }),
    )
    Alert.alert("Rejected", `${connection.name}'s request has been declined.`)
  }

  const handleJoinHangout = (hangout: Hangout) => {
    if (hangout.participants.length >= hangout.maxParticipants) {
      Alert.alert("Full", "This hangout is already full!")
      return
    }

    Alert.alert("Request to Join", `Send a request to join "${hangout.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send Request",
        onPress: () => {
          // Add to pending requests (mock current user)
          const currentUser: Connection = {
            id: "current_user",
            name: "You",
            bio: "Current user",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
            degree: 1,
          }

          setHangouts((prev) =>
            prev.map((h) => {
              if (h.id === hangout.id) {
                return {
                  ...h,
                  pendingRequests: [...(h.pendingRequests || []), currentUser],
                }
              }
              return h
            }),
          )

          Alert.alert("Request Sent!", `Your request to join "${hangout.title}" has been sent to the host.`)
        },
      },
    ])
  }

  const renderHangoutCard = ({ item }: { item: Hangout }) => (
    <TouchableOpacity
      style={styles.hangoutCard}
      onPress={() => {
        setSelectedHangout(item)
        setShowDetailModal(true)
      }}
    >
      <View style={styles.hangoutHeader}>
        <View style={styles.hangoutTitleRow}>
          <Text style={styles.hangoutTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>
              {getStatusIcon(item.status)} {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.hangoutDate}>
          {item.date} at {item.time}
        </Text>
        <Text style={styles.hangoutVenue}>📍 {item.venue}</Text>
        <Text style={styles.hangoutHost}>👤 Hosted by {item.hostName}</Text>
      </View>

      <View style={styles.hangoutDetails}>
        <Text style={styles.hangoutDescription} numberOfLines={2}>
          {item.description || "No description provided"}
        </Text>

        <View style={styles.participantsSection}>
          <View style={styles.participantImages}>
            {item.participants.slice(0, 3).map((participant, index) => (
              <Image
                key={participant.id}
                source={{ uri: participant.image }}
                style={[styles.participantImage, { marginLeft: index > 0 ? -8 : 0 }]}
              />
            ))}
            {item.participants.length > 3 && (
              <View style={[styles.participantImage, styles.moreParticipants, { marginLeft: -8 }]}>
                <Text style={styles.moreParticipantsText}>+{item.participants.length - 3}</Text>
              </View>
            )}
          </View>
          <Text style={styles.participantCount}>
            {item.participants.length}/{item.maxParticipants} joined
          </Text>
        </View>
      </View>

      {item.status === "upcoming" && item.createdBy !== "USR123456" && (
        <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinHangout(item)}>
          <Text style={styles.joinButtonText}>Join Hangout</Text>
        </TouchableOpacity>
      )}

      {item.createdBy === "USR123456" && item.pendingRequests && item.pendingRequests.length > 0 && (
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => {
            setSelectedHangout(item)
            setShowApprovalModal(true)
          }}
        >
          <Text style={styles.approveButtonText}>
            {item.pendingRequests.length} Pending Request{item.pendingRequests.length > 1 ? "s" : ""}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )

  const renderFilterButton = (filter: typeof activeFilter, label: string) => (
    <TouchableOpacity
      style={[styles.filterButton, activeFilter === filter && styles.activeFilterButton]}
      onPress={() => setActiveFilter(filter)}
    >
      <Text style={[styles.filterButtonText, activeFilter === filter && styles.activeFilterButtonText]}>{label}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Hangouts</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.createButtonText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {renderFilterButton("all", "All")}
        {renderFilterButton("upcoming", "Soon")}
        {renderFilterButton("ongoing", "Live")}
        {renderFilterButton("completed", "Past")}
      </ScrollView>

      {/* Hangouts List */}
      {loading ? (
        <ActivityIndicator size="large" color="#6C5CE7" style={{ flex: 1 }} />
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHangouts}
          renderItem={renderHangoutCard}
          keyExtractor={(item) => item.id}
          style={styles.hangoutsList}
          contentContainerStyle={styles.hanloutsListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No hangouts found</Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={() => setShowCreateModal(true)}>
                <Text style={styles.emptyStateButtonText}>Create Your First Hangout</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create Hangout Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Hangout</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Hangout Title *</Text>
              <TextInput
                style={styles.textInput}
                value={hangoutTitle}
                onChangeText={setHangoutTitle}
                placeholder="e.g., Study Session, Movie Night"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Date *</Text>
              <TextInput
                style={styles.textInput}
                value={hangoutDate}
                onChangeText={setHangoutDate}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Time *</Text>
              <TextInput
                style={styles.textInput}
                value={hangoutTime}
                onChangeText={setHangoutTime}
                placeholder="HH:MM AM/PM"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Venue *</Text>
              <TextInput
                style={styles.textInput}
                value={hangoutVenue}
                onChangeText={setHangoutVenue}
                placeholder="e.g., Library, Cafe, Park"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={hangoutDescription}
                onChangeText={setHangoutDescription}
                placeholder="Tell people what this hangout is about..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Maximum Participants</Text>
              <TextInput
                style={styles.textInput}
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                placeholder="4"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Invite People</Text>
              <View style={styles.participantsList}>
                {selectedParticipants.map((participant) => (
                  <View key={participant.id} style={styles.participantChip}>
                    <Image source={{ uri: participant.image }} style={styles.participantChipImage} />
                    <Text style={styles.participantChipName}>{participant.name}</Text>
                    <TouchableOpacity onPress={() => toggleParticipant(participant)} style={styles.removeParticipant}>
                      <Text style={styles.removeParticipantText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.inviteMoreButton} onPress={() => setShowInviteModal(true)}>
                <Text style={styles.inviteMoreButtonText}>+ Invite People</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.createHangoutButton} onPress={handleCreateHangout}>
              <Text style={styles.createHangoutButtonText}>Create Hangout</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Hangout Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Hangout Details</Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedHangout && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>{selectedHangout.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(selectedHangout.status), alignSelf: "flex-start" },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusIcon(selectedHangout.status)} {selectedHangout.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>📅 Date & Time</Text>
                <Text style={styles.detailText}>
                  {selectedHangout.date} at {selectedHangout.time}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>📍 Venue</Text>
                <Text style={styles.detailText}>{selectedHangout.venue}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>👤 Host</Text>
                <Text style={styles.detailText}>{selectedHangout.hostName}</Text>
              </View>

              {selectedHangout.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>📝 Description</Text>
                  <Text style={styles.detailText}>{selectedHangout.description}</Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>
                  👥 Participants ({selectedHangout.participants.length}/{selectedHangout.maxParticipants})
                </Text>
                {selectedHangout.participants.map((participant) => (
                  <View key={participant.id} style={styles.participantItem}>
                    <Image source={{ uri: participant.image }} style={styles.participantItemImage} />
                    <View style={styles.participantItemInfo}>
                      <Text style={styles.participantItemName}>{participant.name}</Text>
                      <Text style={styles.participantItemBio}>{participant.bio}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {selectedHangout.createdBy === "USR123456" &&
                selectedHangout.pendingRequests &&
                selectedHangout.pendingRequests.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>
                      ⏳ Pending Requests ({selectedHangout.pendingRequests.length})
                    </Text>
                    {selectedHangout.pendingRequests.map((request) => (
                      <View key={request.id} style={styles.pendingRequestItem}>
                        <Image source={{ uri: request.image }} style={styles.participantItemImage} />
                        <View style={styles.participantItemInfo}>
                          <Text style={styles.participantItemName}>{request.name}</Text>
                          <Text style={styles.participantItemBio}>{request.bio}</Text>
                        </View>
                        <View style={styles.approvalButtons}>
                          <TouchableOpacity
                            style={styles.approveBtn}
                            onPress={() => handleApproveRequest(selectedHangout.id, request)}
                          >
                            <Text style={styles.approveBtnText}>✓</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => handleRejectRequest(selectedHangout.id, request)}
                          >
                            <Text style={styles.rejectBtnText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

              {selectedHangout.status === "upcoming" && selectedHangout.createdBy !== "USR123456" && (
                <TouchableOpacity style={styles.joinDetailButton} onPress={() => handleJoinHangout(selectedHangout)}>
                  <Text style={styles.joinDetailButtonText}>Join This Hangout</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Invite People Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invite People</Text>
            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
              <Text style={styles.closeButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionHeader}>1st Degree Connections</Text>
            {connections
              .filter((connection) => connection.degree === 1)
              .map((connection) => {
                const isSelected = selectedParticipants.find((p) => p.id === connection.id)
                return (
                  <TouchableOpacity
                    key={connection.id}
                    style={[styles.connectionItem, isSelected && styles.selectedConnectionItem]}
                    onPress={() => toggleParticipant(connection)}
                  >
                    <Image source={{ uri: connection.image }} style={styles.connectionImage} />
                    <View style={styles.connectionInfo}>
                      <Text style={styles.connectionName}>{connection.name}</Text>
                      <Text style={styles.connectionBio}>{connection.bio}</Text>
                    </View>
                    <View style={[styles.degreeIndicator, styles.firstDegree]}>
                      <Text style={styles.degreeText}>1°</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                )
              })}

            <Text style={styles.sectionHeader}>2nd Degree Connections</Text>
            {connections
              .filter((connection) => connection.degree === 2)
              .map((connection) => {
                const isSelected = selectedParticipants.find((p) => p.id === connection.id)
                return (
                  <TouchableOpacity
                    key={connection.id}
                    style={[styles.connectionItem, isSelected && styles.selectedConnectionItem]}
                    onPress={() => toggleParticipant(connection)}
                  >
                    <Image source={{ uri: connection.image }} style={styles.connectionImage} />
                    <View style={styles.connectionInfo}>
                      <Text style={styles.connectionName}>{connection.name}</Text>
                      <Text style={styles.connectionBio}>{connection.bio}</Text>
                      {connection.mutualConnections && (
                        <Text style={styles.mutualConnectionsText}>
                          {connection.mutualConnections} mutual connections
                        </Text>
                      )}
                    </View>
                    <View style={[styles.degreeIndicator, styles.secondDegree]}>
                      <Text style={styles.degreeText}>2°</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                )
              })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D3436",
  },
  createButton: {
    backgroundColor: "#6C5CE7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  filterContainer: {
    backgroundColor: "#F8F9FA",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  activeFilterButton: {
    backgroundColor: "#6C5CE7",
    borderColor: "#6C5CE7",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#636E72",
    fontWeight: "500",
  },
  activeFilterButtonText: {
    color: "#FFFFFF",
  },
  hangoutsList: {
    flex: 1,
  },
  hanloutsListContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  hangoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hangoutHeader: {
    marginBottom: 12,
  },
  hangoutTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  hangoutTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3436",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  hangoutDate: {
    fontSize: 14,
    color: "#636E72",
    marginBottom: 4,
  },
  hangoutVenue: {
    fontSize: 14,
    color: "#636E72",
  },
  hangoutHost: {
    fontSize: 14,
    color: "#6C5CE7",
    fontWeight: "500",
    marginTop: 2,
  },
  hangoutDetails: {
    marginBottom: 12,
  },
  hangoutDescription: {
    fontSize: 14,
    color: "#636E72",
    lineHeight: 20,
    marginBottom: 12,
  },
  participantsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  participantImages: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  moreParticipants: {
    backgroundColor: "#6C5CE7",
    justifyContent: "center",
    alignItems: "center",
  },
  moreParticipantsText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  participantCount: {
    fontSize: 12,
    color: "#636E72",
    fontWeight: "500",
  },
  joinButton: {
    backgroundColor: "#00B894",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#636E72",
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: "#6C5CE7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3436",
  },
  closeButton: {
    fontSize: 18,
    color: "#636E72",
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2D3436",
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  participantsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  participantChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  participantChipImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  participantChipName: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "500",
  },
  removeParticipant: {
    marginLeft: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF5252",
    alignItems: "center",
    justifyContent: "center",
  },
  removeParticipantText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  inviteMoreButton: {
    backgroundColor: "#F0F0F0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderStyle: "dashed",
  },
  inviteMoreButtonText: {
    color: "#6C5CE7",
    fontSize: 14,
    fontWeight: "600",
  },
  createHangoutButton: {
    backgroundColor: "#00B894",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 24,
  },
  createHangoutButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  detailSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D3436",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: "#636E72",
    lineHeight: 22,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  participantItemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  participantItemInfo: {
    flex: 1,
  },
  participantItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
  },
  participantItemBio: {
    fontSize: 14,
    color: "#636E72",
    marginTop: 2,
  },
  joinDetailButton: {
    backgroundColor: "#00B894",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 24,
  },
  joinDetailButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  connectionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  selectedConnectionItem: {
    backgroundColor: "#E3F2FD",
  },
  connectionImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 4,
  },
  connectionBio: {
    fontSize: 14,
    color: "#636E72",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#DDD",
    alignItems: "center",
    justifyContent: "center",
  },
  checkedBox: {
    backgroundColor: "#6C5CE7",
    borderColor: "#6C5CE7",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  approveButton: {
    backgroundColor: "#FFD93D",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  approveButtonText: {
    color: "#2D3436",
    fontSize: 12,
    fontWeight: "600",
  },
  pendingRequestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  approvalButtons: {
    flexDirection: "row",
    gap: 8,
  },
  approveBtn: {
    backgroundColor: "#00B894",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    backgroundColor: "#FF5252",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  approveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  rejectBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3436",
    marginVertical: 16,
    marginHorizontal: 16,
  },
  degreeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  firstDegree: {
    backgroundColor: "#00B894",
  },
  secondDegree: {
    backgroundColor: "#FDCB6E",
  },
  degreeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  mutualConnectionsText: {
    fontSize: 12,
    color: "#6C5CE7",
    marginTop: 2,
  },
})
