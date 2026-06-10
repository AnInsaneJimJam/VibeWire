import { useState, useEffect } from "react"
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Modal, SafeAreaView, Alert, TextInput, FlatList, Dimensions, ActivityIndicator } from "react-native"
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
        
        // Add defaults for images
        const mappedHangouts = (hangoutsData || []).map((h: any) => ({
          ...h,
          participants: (h.participants || []).map((p: any) => ({
            ...p,
            image: p.image || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'
          }))
        }));

        const mappedConnections = (connectionsData || []).map((c: any) => ({
          ...c,
          image: c.image || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'
        }));

        setHangouts(mappedHangouts)
        setConnections(mappedConnections)
        setError(null)
      } catch (err) {
        setError("Failed to fetch hangouts. Please pull to refresh.")
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
        return "#00F0FF" // Cyan
      case "ongoing":
        return "#00E676" // Neon Green
      case "completed":
        return "#8E8EA8" // Muted Gray
      default:
        return "#00F0FF"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming":
        return "⚡"
      case "ongoing":
        return "🔴"
      case "completed":
        return "✓"
      default:
        return "⚡"
    }
  }

  const handleCreateHangout = async () => {
    if (!hangoutTitle || !hangoutDate || !hangoutTime || !hangoutVenue) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    try {
      const hangoutData = {
        title: hangoutTitle,
        date: hangoutDate,
        time: hangoutTime,
        venue: hangoutVenue,
        description: hangoutDescription,
        maxParticipants: Number.parseInt(maxParticipants),
        participantIds: selectedParticipants.map((p) => parseInt(p.id, 10)),
      }
      await hangoutAPI.createHangout(hangoutData)
      
      // Refresh hangouts
      const hangoutsData = await hangoutAPI.getHangouts()
      const mapped = (hangoutsData || []).map((h: any) => ({
        ...h,
        participants: (h.participants || []).map((p: any) => ({
          ...p,
          image: p.image || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'
        }))
      }));
      setHangouts(mapped)
      Alert.alert("Success!", `Hangout "${hangoutTitle}" has been created!`)
      resetForm()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating hangout:', error)
      Alert.alert("Error", "Failed to create hangout. Please try again.")
    }
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
          const currentUser: Connection = {
            id: "current_user",
            name: "You",
            bio: "Current user",
            image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
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

  const renderHangoutCard = ({ item }: { item: Hangout }) => {
    const isSlotsFull = item.participants.length >= item.maxParticipants;
    
    return (
      <TouchableOpacity
        style={styles.hangoutCard}
        onPress={() => {
          setSelectedHangout(item)
          setShowDetailModal(true)
        }}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardTime}>📅 {item.date} • {item.time}</Text>
            <Text style={styles.cardVenue}>📍 {item.venue}</Text>
            <Text style={styles.cardHost}>👤 Host: {item.hostName || "Host"}</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusIcon(item.status)} {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBottom}>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description || "No details provided."}
          </Text>

          <View style={styles.attendeesSection}>
            <View style={styles.attendeeAvatars}>
              {item.participants.slice(0, 4).map((participant, index) => (
                <Image
                  key={participant.id}
                  source={{ uri: participant.image }}
                  style={[styles.attendeeAvatar, { marginLeft: index > 0 ? -10 : 0 }]}
                />
              ))}
              {item.participants.length > 4 && (
                <View style={[styles.attendeeAvatar, styles.moreAvatars, { marginLeft: -10 }]}>
                  <Text style={styles.moreAvatarsText}>+{item.participants.length - 4}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.slotProgressText, isSlotsFull && styles.slotsFullText]}>
              {item.participants.length} / {item.maxParticipants} slots
            </Text>
          </View>
        </View>

        {item.status === "upcoming" && item.createdBy !== "USR123456" && (
          <TouchableOpacity style={[styles.cardBtn, styles.joinBtn]} onPress={() => handleJoinHangout(item)}>
            <Text style={styles.joinBtnText}>Join Hangout</Text>
          </TouchableOpacity>
        )}

        {item.createdBy === "USR123456" && item.pendingRequests && item.pendingRequests.length > 0 && (
          <TouchableOpacity
            style={[styles.cardBtn, styles.pendingBtn]}
            onPress={() => {
              setSelectedHangout(item)
              setShowApprovalModal(true)
            }}
          >
            <Text style={styles.pendingBtnText}>
              ⚡ {item.pendingRequests.length} Pending Approval{item.pendingRequests.length > 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    )
  }

  const renderFilterButton = (filter: typeof activeFilter, label: string) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        style={[styles.filterTab, isActive && styles.activeFilterTab]}
        onPress={() => setActiveFilter(filter)}
      >
        <Text style={[styles.filterTabText, isActive && styles.activeFilterTabText]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Crew Hangouts</Text>
          <TouchableOpacity style={styles.headerCreateBtn} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.headerCreateBtnText}>+ Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {renderFilterButton("all", "All Events")}
          {renderFilterButton("upcoming", "Soon ⚡")}
          {renderFilterButton("ongoing", "Live 🔴")}
          {renderFilterButton("completed", "Past ✓")}
        </ScrollView>
      </View>

      {/* Hangouts List */}
      {loading ? (
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" color="#00F0FF" />
          <Text style={styles.loadingText}>Synchronizing Hangouts...</Text>
        </View>
      ) : error ? (
        <View style={[styles.container, styles.center, { padding: 30 }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filteredHangouts.length === 0 ? (
        <ScrollView contentContainerStyle={[styles.container, styles.center, { paddingBottom: 100 }]}>
          <Text style={styles.emptyIcon}>🎭</Text>
          <Text style={styles.emptyText}>No hangouts scheduled in this filter.</Text>
          <TouchableOpacity style={[styles.cardBtn, styles.joinBtn, { paddingHorizontal: 24, marginTop: 16 }]} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.joinBtnText}>Schedule First Hangout</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredHangouts}
          renderItem={renderHangoutCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.darkModal}>
          <View style={styles.darkModalHeader}>
            <Text style={styles.darkModalTitle}>Hangout Details</Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Text style={styles.closeModalText}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedHangout && (
            <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>{selectedHangout.title}</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailText}>📅 {selectedHangout.date} • {selectedHangout.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailText}>📍 {selectedHangout.venue}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailText}>👤 Hosted by {selectedHangout.hostName}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionHeading}>Details</Text>
                <Text style={styles.descriptionText}>{selectedHangout.description || "No description provided."}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionHeading}>Crew Joined ({selectedHangout.participants.length})</Text>
                {selectedHangout.participants.map((participant) => (
                  <View key={participant.id} style={styles.participantItem}>
                    <Image source={{ uri: participant.image }} style={styles.participantAvatar} />
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{participant.name}</Text>
                      <Text style={styles.participantBio} numberOfLines={1}>{participant.bio || "No bio yet."}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {selectedHangout.status === "upcoming" && selectedHangout.createdBy !== "USR123456" && (
                <TouchableOpacity style={[styles.cardBtn, styles.joinBtn, { marginVertical: 24 }]} onPress={() => handleJoinHangout(selectedHangout)}>
                  <Text style={styles.joinBtnText}>Send Request to Join</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Create Hangout Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.darkModal}>
          <View style={styles.darkModalHeader}>
            <Text style={styles.darkModalTitle}>Schedule Hangout</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.closeModalText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={styles.darkTextInput}
                value={hangoutTitle}
                onChangeText={setHangoutTitle}
                placeholder="e.g. Chai Session, Hack Night"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date *</Text>
              <TextInput
                style={styles.darkTextInput}
                value={hangoutDate}
                onChangeText={setHangoutDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Time *</Text>
              <TextInput
                style={styles.darkTextInput}
                value={hangoutTime}
                onChangeText={setHangoutTime}
                placeholder="HH:MM"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Venue *</Text>
              <TextInput
                style={styles.darkTextInput}
                value={hangoutVenue}
                onChangeText={setHangoutVenue}
                placeholder="e.g. MAC Cafeteria, Nescafe Kiosk"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.darkTextInput, styles.textArea]}
                value={hangoutDescription}
                onChangeText={setHangoutDescription}
                placeholder="Details about the hangout..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Max Crew Size</Text>
              <TextInput
                style={styles.darkTextInput}
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                keyboardType="numeric"
                placeholder="4"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Selected Crew to Invite</Text>
              <View style={styles.chipList}>
                {selectedParticipants.map((p) => (
                  <View key={p.id} style={styles.chip}>
                    <Image source={{ uri: p.image }} style={styles.chipAvatar} />
                    <Text style={styles.chipText}>{p.name.split(" ")[0]}</Text>
                    <TouchableOpacity onPress={() => toggleParticipant(p)} style={styles.removeChip}>
                      <Text style={styles.removeChipText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.dashedAddBtn} onPress={() => setShowInviteModal(true)}>
                <Text style={styles.dashedAddBtnText}>+ Select Connections to Invite</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.cardBtn, styles.joinBtn, styles.submitBtn]} onPress={handleCreateHangout}>
              <Text style={styles.joinBtnText}>Schedule Hangout</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Invite Selection Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.darkModal}>
          <View style={styles.darkModalHeader}>
            <Text style={styles.darkModalTitle}>Invite Network</Text>
            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
              <Text style={styles.closeModalText}>Done</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={connections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalScrollContent}
            renderItem={({ item }) => {
              const isSelected = selectedParticipants.some((p) => p.id === item.id);
              return (
                <TouchableOpacity
                  style={[styles.inviteRow, isSelected && styles.selectedInviteRow]}
                  onPress={() => toggleParticipant(item)}
                >
                  <Image source={{ uri: item.image }} style={styles.inviteAvatar} />
                  <View style={styles.inviteInfo}>
                    <Text style={styles.inviteName}>{item.name}</Text>
                    <Text style={styles.inviteBio} numberOfLines={1}>{item.bio || "No bio yet."}</Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                    {isSelected && <Text style={styles.checkmarkIcon}>✓</Text>}
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        </View>
      </Modal>

      {/* Approval Requests Modal */}
      <Modal
        visible={showApprovalModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={styles.darkModal}>
          <View style={styles.darkModalHeader}>
            <Text style={styles.darkModalTitle}>Pending Approvals</Text>
            <TouchableOpacity onPress={() => setShowApprovalModal(false)}>
              <Text style={styles.closeModalText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollContent}>
            {selectedHangout?.pendingRequests?.map((request) => (
              <View key={request.id} style={styles.pendingRow}>
                <Image source={{ uri: request.image }} style={styles.pendingAvatar} />
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingName}>{request.name}</Text>
                  <Text style={styles.pendingBio} numberOfLines={1}>{request.bio || "Wants to join."}</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApproveRequest(selectedHangout.id, request)}
                  >
                    <Text style={styles.actionBtnText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleRejectRequest(selectedHangout.id, request)}
                  >
                    <Text style={styles.actionBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
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
    color: "#8E8EA8",
    marginTop: 12,
  },
  errorText: {
    color: "#FF2D8F",
    fontWeight: "bold",
    textAlign: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A36",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  headerCreateBtn: {
    backgroundColor: "#FF2D8F",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  headerCreateBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  // Filter tabs
  filterBarContainer: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#13132B",
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#161633",
    borderWidth: 1,
    borderColor: "#22224A",
  },
  activeFilterTab: {
    backgroundColor: "transparent",
    borderColor: "#00F0FF",
  },
  filterTabText: {
    color: "#8E8EA8",
    fontSize: 12,
    fontWeight: "700",
  },
  activeFilterTabText: {
    color: "#00F0FF",
  },
  // Cards List
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  hangoutCard: {
    backgroundColor: "#13132B",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#222244",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardMeta: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  cardTime: {
    fontSize: 13,
    color: "#B2B2CC",
    marginBottom: 4,
  },
  cardVenue: {
    fontSize: 13,
    color: "#B2B2CC",
    marginBottom: 4,
  },
  cardHost: {
    fontSize: 12,
    color: "#8E8EA8",
  },
  statusBadge: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#1A1A36",
    marginVertical: 14,
  },
  cardBottom: {
    gap: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: "#8E8EA8",
    lineHeight: 20,
  },
  attendeesSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  attendeeAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  attendeeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#13132B",
  },
  moreAvatars: {
    backgroundColor: "#22224A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#13132B",
  },
  moreAvatarsText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  slotProgressText: {
    fontSize: 12,
    color: "#00F0FF",
    fontWeight: "700",
  },
  slotsFullText: {
    color: "#FF2D8F",
  },
  // Buttons
  cardBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  joinBtn: {
    backgroundColor: "#00F0FF",
  },
  joinBtnText: {
    color: "#0B0B1E",
    fontSize: 14,
    fontWeight: "700",
  },
  pendingBtn: {
    backgroundColor: "#FFB800",
  },
  pendingBtnText: {
    color: "#0B0B1E",
    fontSize: 14,
    fontWeight: "700",
  },
  // Empty State
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: "#8E8EA8",
    fontSize: 15,
    textAlign: "center",
  },
  // Modal design
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
    paddingVertical: 16,
  },
  detailSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#13132B",
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  detailRow: {
    marginVertical: 4,
  },
  detailText: {
    fontSize: 15,
    color: "#B2B2CC",
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8E8EA8",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  descriptionText: {
    fontSize: 14,
    color: "#B2B2CC",
    lineHeight: 22,
  },
  // Participant Row
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#13132B",
  },
  participantAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  participantName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  participantBio: {
    fontSize: 12,
    color: "#8E8EA8",
  },
  // Form elements
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
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  submitBtn: {
    marginBottom: 40,
  },
  // Chips
  chipList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E3F",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2E2E5F",
  },
  chipAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  chipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  removeChip: {
    marginLeft: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeChipText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  dashedAddBtn: {
    borderWidth: 1.5,
    borderColor: "#FF2D8F",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(255, 45, 143, 0.03)",
  },
  dashedAddBtnText: {
    color: "#FF2D8F",
    fontSize: 13,
    fontWeight: "700",
  },
  // Invite selecting row
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#13132B",
  },
  selectedInviteRow: {
    backgroundColor: "rgba(255, 45, 143, 0.03)",
  },
  inviteAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 3,
  },
  inviteBio: {
    fontSize: 12,
    color: "#7E7E9A",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#222240",
    alignItems: "center",
    justifyContent: "center",
  },
  checkedBox: {
    backgroundColor: "#FF2D8F",
    borderColor: "#FF2D8F",
  },
  checkmarkIcon: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  // Approving
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#13132B",
  },
  pendingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  pendingBio: {
    fontSize: 12,
    color: "#8E8EA8",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  approveBtn: {
    backgroundColor: "#00E676",
  },
  rejectBtn: {
    backgroundColor: "#FF2D8F",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
})
