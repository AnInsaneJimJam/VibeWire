import { Dimensions, View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Modal, SafeAreaView, Alert, TextInput } from "react-native";
import { useState, useRef, useEffect } from "react";
import { Svg, Circle, Line, G } from "react-native-svg";
import { connectionAPI, hangoutAPI } from "../src/services/api";

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

interface Hangout {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  participants: Connection[];
  maxParticipants: number;
  createdBy: string;
}

interface GraphProps {
  userDetails: {
    name: string;
    image: string;
    userNumber: string;
  };
  existingHangouts?: Hangout[];
  onHangoutCreated?: (hangout: Hangout) => void;
  onConnectionAddedToHangout?: (
    hangoutId: string,
    connection: Connection
  ) => void;
}

interface NodePosition {
  x: number;
  y: number;
  connection?: Connection;
  isUser?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Global state to remember scroll position
const savedScrollPosition = { x: 0, y: 0, zoom: 1.3 };

export default function GraphScreen({
  userDetails,
  existingHangouts = [],
  onHangoutCreated,
  onConnectionAddedToHangout,
}: GraphProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] =
    useState<Connection | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showHangoutOptions, setShowHangoutOptions] = useState(false);
  const [showNewHangoutForm, setShowNewHangoutForm] = useState(false);
  const [showExistingHangouts, setShowExistingHangouts] = useState(false);
  const [showInviteMore, setShowInviteMore] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const graphData = await connectionAPI.getGraph();
        const firstDegree = graphData.firstDegree.map((c: any) => ({
          ...c,
          degree: 1,
        }));
        const secondDegree = graphData.secondDegree.map((c: any) => ({
          ...c,
          degree: 2,
        }));
        setConnections([...firstDegree, ...secondDegree]);
      } catch (error) {
        console.error("Error fetching graph data:", error);
        Alert.alert(
          "Error",
          "Failed to fetch connection graph. Please try again."
        );
      }
    };

    fetchGraphData();
  }, []);

  // New hangout form state
  const [hangoutTitle, setHangoutTitle] = useState("");
  const [hangoutDate, setHangoutDate] = useState("");
  const [hangoutTime, setHangoutTime] = useState("");
  const [hangoutVenue, setHangoutVenue] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("4");
  const [selectedParticipants, setSelectedParticipants] = useState<
    Connection[]
  >([]);
  const [currentHangout, setCurrentHangout] = useState<Hangout | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const horizontalScrollRef = useRef<ScrollView>(null);

  // Separate connections by degree
  const firstDegreeConnections = connections.filter((c) => c.degree === 1);
  const secondDegreeConnections = connections.filter((c) => c.degree === 2);

  // Graph dimensions - make it larger than screen for scrolling
  const graphWidth = Math.max(screenWidth * 2, 800);
  const graphHeight = Math.max(screenHeight * 1.5, 600);
  const centerX = graphWidth / 2;
  const centerY = graphHeight / 2;

  // Calculate positions for nodes
  const calculateNodePositions = (): NodePosition[] => {
    const positions: NodePosition[] = [];

    // User at center
    positions.push({
      x: centerX,
      y: centerY,
      isUser: true,
    });

    // First degree connections in a circle around user
    const firstDegreeRadius = 150;
    const firstDegreeAngleStep =
      (2 * Math.PI) / firstDegreeConnections.length;

    firstDegreeConnections.forEach((connection, index) => {
      const angle = index * firstDegreeAngleStep;
      positions.push({
        x: centerX + Math.cos(angle) * firstDegreeRadius,
        y: centerY + Math.sin(angle) * firstDegreeRadius,
        connection,
      });
    });

    // Second degree connections - positioned around their respective first degree connections
    const secondDegreeRadius = 120;
    let secondDegreeIndex = 0;

    firstDegreeConnections.forEach((firstDegreeConnection, firstIndex) => {
      // Get second degree connections that are connected through this first degree connection
      const relatedSecondDegree = secondDegreeConnections.slice(
        secondDegreeIndex,
        secondDegreeIndex +
          Math.ceil(
            secondDegreeConnections.length / firstDegreeConnections.length
          )
      );

      const firstDegreeAngle = firstIndex * firstDegreeAngleStep;
      const firstDegreeX =
        centerX + Math.cos(firstDegreeAngle) * firstDegreeRadius;
      const firstDegreeY =
        centerY + Math.sin(firstDegreeAngle) * firstDegreeRadius;

      relatedSecondDegree.forEach((connection, relatedIndex) => {
        const subAngle =
          relatedIndex * (Math.PI / 3) - Math.PI / 6; // Spread around first degree node
        positions.push({
          x:
            firstDegreeX +
            Math.cos(firstDegreeAngle + subAngle) * secondDegreeRadius,
          y:
            firstDegreeY +
            Math.sin(firstDegreeAngle + subAngle) * secondDegreeRadius,
          connection,
        });
      });

      secondDegreeIndex += relatedSecondDegree.length;
    });

    return positions;
  };

  const nodePositions = calculateNodePositions();

  // Initialize view position and zoom
  useEffect(() => {
    if (
      !isInitialized &&
      horizontalScrollRef.current &&
      scrollViewRef.current
    ) {
      const timer = setTimeout(() => {
        // Calculate position to center the user node
        const scrollX = Math.max(0, centerX - screenWidth / 2);
        const scrollY = Math.max(0, centerY - screenHeight / 2);

        // If we have saved position, use it; otherwise center on user
        const targetX =
          savedScrollPosition.x !== 0 ? savedScrollPosition.x : scrollX;
        const targetY =
          savedScrollPosition.y !== 0 ? savedScrollPosition.y : scrollY;
        const targetZoom = savedScrollPosition.zoom;

        // Set zoom first
        horizontalScrollRef.current?.setNativeProps({
          zoomScale: targetZoom,
        });

        // Then scroll to position
        horizontalScrollRef.current?.scrollTo({
          x: targetX,
          y: 0,
          animated: false,
        });

        scrollViewRef.current?.scrollTo({
          x: 0,
          y: targetY,
          animated: false,
        });

        setIsInitialized(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isInitialized, centerX, centerY]);

  // Save scroll position when component unmounts or user scrolls
  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    savedScrollPosition.y = contentOffset.y;
  };

  const handleHorizontalScroll = (event: any) => {
    const { contentOffset, zoomScale } = event.nativeEvent;
    savedScrollPosition.x = contentOffset.x;
    savedScrollPosition.zoom = zoomScale || savedScrollPosition.zoom;
  };

  const handleConnectionPress = (connection: Connection) => {
    setSelectedConnection(connection);
    setShowDetail(true);
  };

  const handlePlanHangout = (connection: Connection) => {
    setSelectedConnection(connection);
    setShowDetail(false);
    setShowHangoutOptions(true);
  };

  const handleChooseExistingHangout = () => {
    setShowHangoutOptions(false);
    setShowExistingHangouts(true);
  };

  const handleCreateNewHangout = () => {
    setShowHangoutOptions(false);
    setShowNewHangoutForm(true);
    if (selectedConnection) {
      setSelectedParticipants([selectedConnection]);
    }
  };

  const handleAddToExistingHangout = (hangout: Hangout) => {
    if (selectedConnection && onConnectionAddedToHangout) {
      onConnectionAddedToHangout(hangout.id, selectedConnection);
      Alert.alert(
        "Success!",
        `${selectedConnection.name} has been added to ${hangout.title}`
      );
      setShowExistingHangouts(false);
      resetForms();
    }
  };

  const handleCreateHangout = async () => {
    if (!hangoutTitle) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      await hangoutAPI.createHangout(
        hangoutTitle,
        selectedParticipants.map((p) => p.id)
      );
      Alert.alert("Success!", `Hangout "${hangoutTitle}" has been created!`);
      setShowNewHangoutForm(false);
      resetForms();
    } catch (error) {
      console.error("Error creating hangout:", error);
      Alert.alert("Error", "Failed to create hangout. Please try again.");
    }
  };

  const resetForms = () => {
    setSelectedConnection(null);
    setHangoutTitle("");
    setHangoutDate("");
    setHangoutTime("");
    setHangoutVenue("");
    setMaxParticipants("4");
    setSelectedParticipants([]);
    setCurrentHangout(null);
  };

  const toggleParticipant = (connection: Connection) => {
    setSelectedParticipants((prev) => {
      const isSelected = prev.find((p) => p.id === connection.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== connection.id);
      } else {
        return [...prev, connection];
      }
    });
  };

  const navigateToProfileScreen = () => {
    console.log("Navigate to profile screen");
  };

  const renderConnections = () => {
    const userPosition = nodePositions[0];
    const lines = [];

    // Draw lines from user to first degree connections
    nodePositions.slice(1).forEach((position, index) => {
      if (position.connection?.degree === 1) {
        lines.push(
          <Line
            key={`user-to-first-${index}`}
            x1={userPosition.x}
            y1={userPosition.y}
            x2={position.x}
            y2={position.y}
            stroke="#00D4FF"
            strokeWidth="2"
            opacity={0.6}
          />
        );
      }
    });

    // Draw lines from first degree to second degree connections
    const firstDegreePositions = nodePositions.filter(
      (p) => p.connection?.degree === 1
    );
    const secondDegreePositions = nodePositions.filter(
      (p) => p.connection?.degree === 2
    );

    firstDegreePositions.forEach((firstPos, firstIndex) => {
      const relatedSecondDegree = secondDegreePositions.slice(
        firstIndex *
          Math.ceil(
            secondDegreePositions.length / firstDegreePositions.length
          ),
        (firstIndex + 1) *
          Math.ceil(
            secondDegreePositions.length / firstDegreePositions.length
          )
      );

      relatedSecondDegree.forEach((secondPos, secondIndex) => {
        lines.push(
          <Line
            key={`first-to-second-${firstIndex}-${secondIndex}`}
            x1={firstPos.x}
            y1={firstPos.y}
            x2={secondPos.x}
            y2={secondPos.y}
            stroke="#FF6B9D"
            strokeWidth="1.5"
            opacity={0.4}
          />
        );
      });
    });

    return lines;
  };

  const renderNodes = () => {
    return nodePositions.map((position, index) => {
      const isUser = position.isUser;
      const connection = position.connection;
      const nodeSize = isUser ? 35 : 30;

      return (
        <G key={index}>
          <Circle
            cx={position.x}
            cy={position.y}
            r={nodeSize}
            fill={
              isUser
                ? "#00D4FF"
                : connection?.degree === 1
                ? "#FF6B9D"
                : "#FFD93D"
            }
            stroke="#FFFFFF"
            strokeWidth="3"
          />
        </G>
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: "#0F0F23" }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Connection Network</Text>
        <Text style={styles.subtitle}>Explore your connections</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: "#00D4FF" }]}
          />
          <Text style={styles.legendText}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: "#FF6B9D" }]}
          />
          <Text style={styles.legendText}>1st Degree</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: "#FFD93D" }]}
          />
          <Text style={styles.legendText}>2nd Degree</Text>
        </View>
      </View>

      {/* Scrollable Graph */}
      <ScrollView
        ref={horizontalScrollRef}
        style={styles.graphContainer}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        minimumZoomScale={0.5}
        maximumZoomScale={3}
        bouncesZoom={true}
        onScroll={handleHorizontalScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          width: graphWidth,
          height: graphHeight,
        }}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.verticalScroll}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            width: graphWidth,
            height: graphHeight,
          }}
        >
          {/* SVG Graph */}
          <Svg width={graphWidth} height={graphHeight} style={styles.svg}>
            {renderConnections()}
            {renderNodes()}
          </Svg>

          {/* Overlay nodes with profile images and names */}
          {nodePositions.map((position, index) => {
            const isUser = position.isUser;
            const connection = position.connection;
            const nodeSize = isUser ? 70 : 60;

            return (
              <TouchableOpacity
                key={`overlay-${index}`}
                style={[
                  styles.nodeOverlay,
                  {
                    left: position.x - nodeSize / 2,
                    top: position.y - nodeSize / 2,
                    width: nodeSize,
                    height: nodeSize,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  },
                ]}
                onPress={() => {
                  if (!isUser && connection) {
                    handleConnectionPress(connection);
                  }
                }}
                disabled={isUser}
              >
                <Image
                  source={{
                    uri: isUser ? userDetails.image : connection?.image,
                  }}
                  style={[
                    styles.nodeImage,
                    {
                      width: nodeSize - 10,
                      height: nodeSize - 10,
                      borderRadius: (nodeSize - 10) / 2,
                    },
                  ]}
                />
                <Text
                  style={[styles.nodeName, { fontSize: isUser ? 12 : 10 }]}
                >
                  {isUser
                    ? userDetails.name.split(" ")[0]
                    : connection?.name.split(" ")[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScrollView>

      {/* Connection Detail Modal */}
      <Modal
        visible={showDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetail(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Connection Details</Text>
            <TouchableOpacity onPress={() => setShowDetail(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedConnection && (
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.profileSection}>
                <Image
                  source={{ uri: selectedConnection.image }}
                  style={styles.modalProfileImage}
                />
                <Text style={styles.modalName}>
                  {selectedConnection.name}
                </Text>
                <Text style={styles.modalBio}>{selectedConnection.bio}</Text>

                {selectedConnection.degree === 2 && (
                  <View style={styles.mutualBadge}>
                    <Text style={styles.mutualText}>
                      {selectedConnection.mutualConnections} mutual
                      connections
                    </Text>
                  </View>
                )}
              </View>

              {(selectedConnection.course || selectedConnection.bhawan) && (
                <View style={styles.educationSection}>
                  <Text style={styles.sectionTitle}>📚 Education</Text>
                  {selectedConnection.course && (
                    <Text style={styles.educationText}>
                      {selectedConnection.course}
                    </Text>
                  )}
                  {selectedConnection.year && (
                    <Text style={styles.educationText}>
                      {selectedConnection.year}
                    </Text>
                  )}
                  {selectedConnection.bhawan && (
                    <Text style={styles.educationText}>
                      🏠 {selectedConnection.bhawan}
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={() => {
                    Alert.alert(
                      "Message",
                      `Opening chat with ${selectedConnection.name}`
                    );
                    setShowDetail(false);
                  }}
                >
                  <Text style={styles.messageButtonText}>💬 Send Message</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.hangoutButton}
                  onPress={() => handlePlanHangout(selectedConnection)}
                >
                  <Text style={styles.hangoutButtonText}>🎉 Plan Hangout</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Hangout Options Modal */}
      <Modal
        visible={showHangoutOptions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHangoutOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionsModal}>
            <Text style={styles.optionsTitle}>
              Plan Hangout with {selectedConnection?.name}
            </Text>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleChooseExistingHangout}
            >
              <Text style={styles.optionButtonText}>
                📅 Add to Existing Hangout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleCreateNewHangout}
            >
              <Text style={styles.optionButtonText}>
                ✨ Create New Hangout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowHangoutOptions(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Existing Hangouts Modal */}
      <Modal
        visible={showExistingHangouts}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExistingHangouts(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Existing Hangout</Text>
            <TouchableOpacity onPress={() => setShowExistingHangouts(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {existingHangouts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No existing hangouts found
                </Text>
                <TouchableOpacity
                  style={styles.createNewButton}
                  onPress={() => {
                    setShowExistingHangouts(false);
                    handleCreateNewHangout();
                  }}
                >
                  <Text style={styles.createNewButtonText}>
                    Create New Hangout
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              existingHangouts.map((hangout) => (
                <TouchableOpacity
                  key={hangout.id}
                  style={styles.hangoutCard}
                  onPress={() => handleAddToExistingHangout(hangout)}
                >
                  <Text style={styles.hangoutCardTitle}>{hangout.title}</Text>
                  <Text style={styles.hangoutCardDetails}>
                    {hangout.date} at {hangout.time}
                  </Text>
                  <Text style={styles.hangoutCardDetails}>
                    {hangout.venue}
                  </Text>
                  <Text style={styles.hangoutCardParticipants}>
                    {hangout.participants.length}/{hangout.maxParticipants}{" "}
                    participants
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* New Hangout Form Modal */}
      <Modal
        visible={showNewHangoutForm}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowNewHangoutForm(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Hangout</Text>
            <TouchableOpacity onPress={() => setShowNewHangoutForm(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
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
              <Text style={styles.formLabel}>Invited Participants</Text>
              <View style={styles.participantsList}>
                {selectedParticipants.map((participant) => (
                  <View key={participant.id} style={styles.participantChip}>
                    <Image
                      source={{ uri: participant.image }}
                      style={styles.participantImage}
                    />
                    <Text style={styles.participantName}>
                      {participant.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => toggleParticipant(participant)}
                      style={styles.removeParticipant}
                    >
                      <Text style={styles.removeParticipantText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.inviteMoreButton}
                onPress={() => setShowInviteMore(true)}
              >
                <Text style={styles.inviteMoreButtonText}>
                  + Invite More People
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.createHangoutButton}
              onPress={handleCreateHangout}
            >
              <Text style={styles.createHangoutButtonText}>
                Create Hangout
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Invite More People Modal */}
      <Modal
        visible={showInviteMore}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteMore(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invite More People</Text>
            <TouchableOpacity onPress={() => setShowInviteMore(false)}>
              <Text style={styles.closeButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {connections.map((connection) => {
              const isSelected = selectedParticipants.find(
                (p) => p.id === connection.id
              );
              return (
                <TouchableOpacity
                  key={connection.id}
                  style={[
                    styles.connectionItem,
                    isSelected && styles.selectedConnectionItem,
                  ]}
                  onPress={() => toggleParticipant(connection)}
                >
                  <Image
                    source={{ uri: connection.image }}
                    style={styles.connectionImage}
                  />
                  <View style={styles.connectionInfo}>
                    <Text style={styles.connectionName}>
                      {connection.name}
                    </Text>
                    <Text style={styles.connectionBio}>
                      {connection.bio}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkedBox,
                    ]}
                  >
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F0F0F0",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#636E72",
    textAlign: "center",
    marginTop: 4,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "rgba(187, 17, 17, 0.05)",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#F0F0F0",
    fontWeight: "500",
  },
  graphContainer: {
    flex: 1,
    backgroundColor: "#1A1A2E",
  },
  verticalScroll: {
    flex: 1,
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  nodeOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  nodeImage: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  nodeName: {
    color: "black",
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
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
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#6C5CE7",
    marginBottom: 16,
  },
  modalName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2D3436",
    textAlign: "center",
    marginBottom: 8,
  },
  modalBio: {
    fontSize: 16,
    color: "#636E72",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
  mutualBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mutualText: {
    fontSize: 12,
    color: "#1976D2",
    fontWeight: "600",
  },
  educationSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3436",
    marginBottom: 12,
  },
  educationText: {
    fontSize: 14,
    color: "#636E72",
    marginBottom: 6,
  },
  actionSection: {
    paddingVertical: 24,
    gap: 12,
  },
  messageButton: {
    backgroundColor: "#6C5CE7",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  messageButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  hangoutButton: {
    backgroundColor: "#00B894",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  hangoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Hangout Options Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3436",
    marginBottom: 24,
    textAlign: "center",
  },
  optionButton: {
    backgroundColor: "#6C5CE7",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
    alignItems: "center",
  },
  optionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#DDD",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#636E72",
    fontSize: 16,
    fontWeight: "600",
  },
  // Existing Hangouts Styles
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#636E72",
    marginBottom: 20,
  },
  createNewButton: {
    backgroundColor: "#6C5CE7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createNewButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  hangoutCard: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#6C5CE7",
  },
  hangoutCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3436",
    marginBottom: 8,
  },
  hangoutCardDetails: {
    fontSize: 14,
    color: "#636E72",
    marginBottom: 4,
  },
  hangoutCardParticipants: {
    fontSize: 12,
    color: "#00B894",
    fontWeight: "600",
    marginTop: 8,
  },
  // Form Styles
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
  participantImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  participantName: {
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
  // Invite More People Styles
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
});