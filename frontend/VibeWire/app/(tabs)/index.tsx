import { Dimensions, View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Modal, SafeAreaView, Alert, TextInput, ActivityIndicator } from "react-native";
import { useState, useRef, useEffect } from "react";
import { Svg, Circle, Line, G, Image as SvgImage, Rect, Text as SvgText, ClipPath, Defs, Pattern } from "react-native-svg";
import { connectionAPI, hangoutAPI } from "../../src/services/api";
import { useAuth } from "../../src/context/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

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
const savedScrollPosition = { x: 0, y: 0, zoom: 1.2 };

export default function GraphScreen({
  existingHangouts = [],
  onHangoutCreated,
  onConnectionAddedToHangout,
}: GraphProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showHangoutOptions, setShowHangoutOptions] = useState(false);
  const [showNewHangoutForm, setShowNewHangoutForm] = useState(false);
  const [showExistingHangouts, setShowExistingHangouts] = useState(false);
  const [showInviteMore, setShowInviteMore] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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
    const fetchGraphData = async () => {
      try {
        const graphData = await connectionAPI.getGraph();
        const firstDegree = (graphData.firstDegree || []).map((c: any) => ({
          ...c,
          degree: 1,
        }));
        const secondDegree = (graphData.secondDegree || []).map((c: any) => ({
          ...c,
          degree: 2,
        }));
        
        // Deduplicate connections by ID (preferring 1st degree connections)
        const uniqueGraphMap = new Map();
        secondDegree.forEach((c: any) => {
          if (c && c.id) uniqueGraphMap.set(c.id, c);
        });
        firstDegree.forEach((c: any) => {
          if (c && c.id) uniqueGraphMap.set(c.id, c);
        });
        
        setConnections(Array.from(uniqueGraphMap.values()));
        setLinks(graphData.links || []);
      } catch (error) {
        console.error("Error fetching graph data:", error);
        Alert.alert(
          "Error",
          "Failed to fetch connection graph. Please try again."
        );
      } finally {
        setIsLoading(false);
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
  const [selectedParticipants, setSelectedParticipants] = useState<Connection[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const horizontalScrollViewRef = useRef<ScrollView>(null);

  // Separate connections by degree
  const firstDegreeConnections = connections.filter((c) => c.degree === 1);
  const secondDegreeConnections = connections.filter((c) => c.degree === 2);

  // Graph dimensions
  const graphWidth = Math.max(screenWidth * 2.2, 1000);
  const graphHeight = Math.max(screenHeight * 1.6, 900);
  const centerX = graphWidth / 2;
  const centerY = graphHeight / 2;

  // Calculate positions for nodes dynamically based on friendships
  const calculateNodePositions = (): NodePosition[] => {
    const positions: NodePosition[] = [];
    const coordsMap: { [id: string]: { x: number; y: number } } = {};

    // 1. User at center
    positions.push({
      x: centerX,
      y: centerY,
      isUser: true,
    });
    coordsMap['user'] = { x: centerX, y: centerY };

    // 2. First degree connections in a circle around user
    const firstDegreeRadius = 180;
    const firstDegreeAngleStep = (2 * Math.PI) / (firstDegreeConnections.length || 1);

    firstDegreeConnections.forEach((connection, index) => {
      const angle = index * firstDegreeAngleStep;
      const x = centerX + Math.cos(angle) * firstDegreeRadius;
      const y = centerY + Math.sin(angle) * firstDegreeRadius;
      positions.push({
        x,
        y,
        connection,
      });
      coordsMap[String(connection.id)] = { x, y };
    });

    // 3. Second degree connections grouped around their first-degree links
    // Map second-degree friend ID -> list of first-degree friend IDs connecting them
    const fofConnectionsMap: { [fofId: string]: string[] } = {};
    links.forEach(link => {
      const src = String(link.source);
      const tgt = String(link.target);
      const isSrcFirst = firstDegreeConnections.some(c => String(c.id) === src);
      const isTgtSecond = secondDegreeConnections.some(c => String(c.id) === tgt);
      const isTgtFirst = firstDegreeConnections.some(c => String(c.id) === tgt);
      const isSrcSecond = secondDegreeConnections.some(c => String(c.id) === src);

      if (isSrcFirst && isTgtSecond) {
        if (!fofConnectionsMap[tgt]) fofConnectionsMap[tgt] = [];
        fofConnectionsMap[tgt].push(src);
      } else if (isSrcSecond && isTgtFirst) {
        if (!fofConnectionsMap[src]) fofConnectionsMap[src] = [];
        fofConnectionsMap[src].push(tgt);
      }
    });

    // Track placed count around each first-degree node
    const placedCountMap: { [friendId: string]: number } = {};
    firstDegreeConnections.forEach(c => {
      placedCountMap[String(c.id)] = 0;
    });

    const secondDegreeRadius = 120;
    
    secondDegreeConnections.forEach((connection, index) => {
      const connId = String(connection.id);
      const parentIds = fofConnectionsMap[connId] || [];
      
      let parentId = parentIds[0];
      // Fallback parent if no connection links exist
      if (!parentId && firstDegreeConnections.length > 0) {
        parentId = String(firstDegreeConnections[index % firstDegreeConnections.length].id);
      }

      if (parentId && coordsMap[parentId]) {
        const parentCoords = coordsMap[parentId];
        const parentIndex = firstDegreeConnections.findIndex(c => String(c.id) === parentId);
        const parentAngle = parentIndex * firstDegreeAngleStep;
        
        const count = placedCountMap[parentId] || 0;
        placedCountMap[parentId] = count + 1;

        // Fan out outwards away from center
        const fanAngle = 0.55; 
        const subAngle = (count - 1) * fanAngle; 
        const finalAngle = parentAngle + subAngle;

        const x = parentCoords.x + Math.cos(finalAngle) * secondDegreeRadius;
        const y = parentCoords.y + Math.sin(finalAngle) * secondDegreeRadius;

        positions.push({
          x,
          y,
          connection,
        });
        coordsMap[connId] = { x, y };
      } else {
        // Outer ring placement fallback
        const angle = index * ((2 * Math.PI) / (secondDegreeConnections.length || 1));
        const x = centerX + Math.cos(angle) * (firstDegreeRadius + secondDegreeRadius);
        const y = centerY + Math.sin(angle) * (firstDegreeRadius + secondDegreeRadius);
        positions.push({
          x,
          y,
          connection,
        });
        coordsMap[connId] = { x, y };
      }
    });

    return positions;
  };

  const nodePositions = calculateNodePositions();

  // Initialize view position and zoom
  useEffect(() => {
    if (!isInitialized && scrollViewRef.current && horizontalScrollViewRef.current) {
      const timer = setTimeout(() => {
        const scrollX = Math.max(0, centerX - screenWidth / 2);
        const scrollY = Math.max(0, centerY - screenHeight / 2);

        const targetX = savedScrollPosition.x !== 0 ? savedScrollPosition.x : scrollX;
        const targetY = savedScrollPosition.y !== 0 ? savedScrollPosition.y : scrollY;
        const targetZoom = savedScrollPosition.zoom;

        horizontalScrollViewRef.current?.setNativeProps({
          zoomScale: targetZoom,
        });

        scrollViewRef.current?.scrollTo({
          y: targetY,
          animated: false,
        });

        horizontalScrollViewRef.current?.scrollTo({
          x: targetX,
          animated: false,
        });

        setIsInitialized(true);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isInitialized, centerX, centerY]);

  const handleVerticalScroll = (event: any) => {
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
    if (!hangoutTitle || !hangoutDate || !hangoutTime || !hangoutVenue) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const hangoutData = {
      title: hangoutTitle,
      date: hangoutDate,
      time: hangoutTime,
      venue: hangoutVenue,
      description: "",
      maxParticipants: parseInt(maxParticipants, 10),
      participantIds: selectedParticipants.map((p) => parseInt(p.id, 10)),
    };

    try {
      await hangoutAPI.createHangout(hangoutData);
      Alert.alert("Success!", `Hangout "${hangoutTitle}" has been created!`);
      setShowNewHangoutForm(false);
      resetForms();
      if (onHangoutCreated) {
        onHangoutCreated(hangoutData as any);
      }
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

  const renderConnections = () => {
    const userPosition = nodePositions[0];
    const lines: React.ReactElement[] = [];


    // 1. Draw solid glowing cyan lines from user to 1st degree
    nodePositions.slice(1).forEach((position, index) => {
      if (position.connection?.degree === 1) {
        lines.push(
          <G key={`user-to-first-${index}`}>
            <Line
              x1={userPosition.x}
              y1={userPosition.y}
              x2={position.x}
              y2={position.y}
              stroke="#00F0FF"
              strokeWidth="6"
              opacity={0.12}
            />
            <Line
              x1={userPosition.x}
              y1={userPosition.y}
              x2={position.x}
              y2={position.y}
              stroke="#00F0FF"
              strokeWidth="2.5"
              opacity={0.65}
            />
          </G>
        );
      }
    });

    // 2. Draw dashed glowing pink lines between 1st degree and 2nd degree
    links.forEach((link, idx) => {
      const srcId = String(link.source);
      const tgtId = String(link.target);
      
      const srcPos = nodePositions.find(p => p.connection && String(p.connection.id) === srcId);
      const tgtPos = nodePositions.find(p => p.connection && String(p.connection.id) === tgtId);
      
      if (srcPos && tgtPos) {
        lines.push(
          <G key={`link-${srcId}-${tgtId}-${idx}`}>
            <Line
              x1={srcPos.x}
              y1={srcPos.y}
              x2={tgtPos.x}
              y2={tgtPos.y}
              stroke="#FF2D8F"
              strokeWidth="4.5"
              opacity={0.1}
            />
            <Line
              x1={srcPos.x}
              y1={srcPos.y}
              x2={tgtPos.x}
              y2={tgtPos.y}
              stroke="#FF2D8F"
              strokeWidth="1.5"
              strokeDasharray="4, 3"
              opacity={0.55}
            />
          </G>
        );
      }
    });

    return lines;
  };

  const renderNodes = () => {
    return nodePositions.map((position, index) => {
      const isUser = position.isUser;
      const connection = position.connection;
      const r = isUser ? 36 : 30; // Radius
      const nodeKey = isUser ? 'user' : `conn-${connection?.id || index}`;
      
      const strokeColor = isUser
        ? "#00F0FF" // Cyan for user
        : connection?.degree === 1
        ? "#FF2D8F" // Neon Pink for 1st degree
        : "#FFB800"; // Gold for 2nd degree
        
      const name = isUser
        ? (user?.name || "You").split(" ")[0]
        : connection?.name.split(" ")[0] || "Friend";

      const imageUrl = isUser
        ? resolveImageUrl(user?.profileImage)
        : resolveImageUrl(connection?.image);

      return (
        <G key={nodeKey}>
          <Defs>
            <ClipPath id={`clip-${nodeKey}`}>
              <Circle cx={position.x} cy={position.y} r={r - 3} />
            </ClipPath>
          </Defs>

          {/* Glowing outer backdrop ring */}
          <Circle
            cx={position.x}
            cy={position.y}
            r={r + 6}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            opacity={0.15}
          />

          {/* Medium ring (inner glow) */}
          <Circle
            cx={position.x}
            cy={position.y}
            r={r + 2.5}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            opacity={0.4}
          />

          {/* Main solid border ring */}
          <Circle
            cx={position.x}
            cy={position.y}
            r={r}
            fill="#121225"
            stroke={strokeColor}
            strokeWidth="2"
          />

          {/* Clipped image */}
          <SvgImage
            x={position.x - (r - 3)}
            y={position.y - (r - 3)}
            width={(r - 3) * 2}
            height={(r - 3) * 2}
            href={{ uri: imageUrl }}
            clipPath={`url(#clip-${nodeKey})`}
          />

          {/* Name Label Container: Semi-transparent pill */}
          <Rect
            x={position.x - 45}
            y={position.y + r + 7}
            width="90"
            height="18"
            rx="9"
            fill="rgba(15, 15, 35, 0.85)"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
          />

          {/* Name text */}
          <SvgText
            x={position.x}
            y={position.y + r + 19}
            fill="#E2E8F0"
            fontSize="9.5"
            fontWeight="700"
            textAnchor="middle"
          >
            {name}
          </SvgText>

          {/* Invisible interactive zone for click detection */}
          <Circle
            cx={position.x}
            cy={position.y}
            r={r + 15}
            fill="transparent"
            onPress={() => {
              if (!isUser && connection) {
                handleConnectionPress(connection);
              }
            }}
          />
        </G>
      );
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00F0FF" />
        <Text style={styles.loadingText}>Synthesizing Social Graph...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Profile not recognized. Please sign in again.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Scrollable Graph Container */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.graphContainer}
        horizontal={false}
        showsVerticalScrollIndicator={false}
        onScroll={handleVerticalScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          height: graphHeight,
        }}
      >
        <ScrollView
          ref={horizontalScrollViewRef}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          onScroll={handleHorizontalScroll}
          scrollEventThrottle={16}
          minimumZoomScale={0.5}
          maximumZoomScale={2.5}
          bouncesZoom={true}
          contentContainerStyle={{
            width: graphWidth,
            height: graphHeight,
          }}
        >
          <Svg width={graphWidth} height={graphHeight} style={styles.svg}>
            <Defs>
              <Pattern id="dot-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <Circle cx="20" cy="20" r="1.2" fill="rgba(0, 240, 255, 0.07)" />
              </Pattern>
            </Defs>
            <Rect width={graphWidth} height={graphHeight} fill="url(#dot-grid)" />
            {renderConnections()}
            {renderNodes()}
          </Svg>
        </ScrollView>
      </ScrollView>


      {/* Connection Detail Modal */}
      <Modal
        visible={showDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetail(false)}
      >
        <View style={styles.darkModalContainer}>
          <View style={styles.darkModalHeader}>
            <Text style={styles.darkModalTitle}>Vibe Profile</Text>
            <TouchableOpacity style={styles.darkCloseButton} onPress={() => setShowDetail(false)}>
              <Text style={styles.darkCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedConnection && (
            <ScrollView style={styles.darkModalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.darkProfileSection}>
                <View style={styles.avatarGlowContainer}>
                  <Image source={{ uri: selectedConnection.image }} style={styles.darkProfileImage} />
                  <View style={[styles.degreeBadge, { backgroundColor: selectedConnection.degree === 1 ? '#FF2D8F' : '#FFB800' }]}>
                    <Text style={styles.degreeText}>{selectedConnection.degree}st</Text>
                  </View>
                </View>
                <Text style={styles.darkName}>{selectedConnection.name}</Text>
                <Text style={styles.darkBio}>{selectedConnection.bio || "No bio yet."}</Text>

                {selectedConnection.degree === 2 && selectedConnection.mutualConnections && (
                  <View style={styles.darkMutualBadge}>
                    <Text style={styles.darkMutualText}>
                      ⚡ {selectedConnection.mutualConnections} Mutual Connections
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.darkInfoSection}>
                <Text style={styles.darkSectionTitle}>📚 Education Details</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Course:</Text>
                  <Text style={styles.infoValue}>{selectedConnection.course || "B.Tech"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Year:</Text>
                  <Text style={styles.infoValue}>{selectedConnection.year || "3rd Year"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Bhawan:</Text>
                  <Text style={styles.infoValue}>🏠 {selectedConnection.bhawan || "Rajendra Bhawan"}</Text>
                </View>
              </View>

              <View style={styles.darkActionSection}>
                <TouchableOpacity
                  style={[styles.darkButton, styles.primaryOutline]}
                  onPress={() => {
                    Alert.alert("Message", `Direct Message to ${selectedConnection.name} initialized.`);
                    setShowDetail(false);
                  }}
                >
                  <Text style={styles.primaryOutlineText}>💬 Send Message</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.darkButton, styles.neonSolid]}
                  onPress={() => handlePlanHangout(selectedConnection)}
                >
                  <Text style={styles.neonSolidText}>🎉 Plan Hangout</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Hangout Options Modal (Create/Add) */}
      <Modal
        visible={showHangoutOptions}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowHangoutOptions(false)}
      >
        <View style={styles.glassOverlay}>
          <View style={styles.glassModal}>
            <Text style={styles.glassTitle}>
              Plan Hangout with {selectedConnection?.name}
            </Text>

            <TouchableOpacity style={[styles.darkButton, styles.glassOptionButton]} onPress={handleChooseExistingHangout}>
              <Text style={styles.glassOptionText}>📅 Add to Existing Hangout</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.darkButton, styles.neonSolid]} onPress={handleCreateNewHangout}>
              <Text style={styles.neonSolidText}>✨ Create New Hangout</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.glassCancelButton} onPress={() => setShowHangoutOptions(false)}>
              <Text style={styles.glassCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Existing Hangouts List Modal */}
      <Modal
        visible={showExistingHangouts}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExistingHangouts(false)}
      >
        <View style={styles.darkModalContainer}>
          <View style={styles.darkModalHeader}>
            <Text style={styles.darkModalTitle}>Select Existing Hangout</Text>
            <TouchableOpacity style={styles.darkCloseButton} onPress={() => setShowExistingHangouts(false)}>
              <Text style={styles.darkCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.darkModalContent}>
            {existingHangouts.length === 0 ? (
              <View style={styles.darkEmptyState}>
                <Text style={styles.darkEmptyText}>No active hangouts available.</Text>
                <TouchableOpacity style={[styles.darkButton, styles.neonSolid]} onPress={() => {
                  setShowExistingHangouts(false);
                  handleCreateNewHangout();
                }}>
                  <Text style={styles.neonSolidText}>Create New Hangout</Text>
                </TouchableOpacity>
              </View>
            ) : (
              existingHangouts.map((hangout) => (
                <TouchableOpacity
                  key={hangout.id}
                  style={styles.darkHangoutCard}
                  onPress={() => handleAddToExistingHangout(hangout)}
                >
                  <Text style={styles.darkHangoutTitle}>{hangout.title}</Text>
                  <Text style={styles.darkHangoutDetails}>📅 {hangout.date} • {hangout.time}</Text>
                  <Text style={styles.darkHangoutDetails}>📍 {hangout.venue}</Text>
                  <View style={styles.cardProgressContainer}>
                    <Text style={styles.progressText}>
                      Slots filled: {hangout.participants.length} / {hangout.maxParticipants}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* New Hangout Form Modal */}
      <Modal
        visible={showNewHangoutForm}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowNewHangoutForm(false)}
      >
        <View style={styles.darkModalContainer}>
          <View style={styles.darkModalHeader}>
            <Text style={styles.darkModalTitle}>Create Hangout</Text>
            <TouchableOpacity style={styles.darkCloseButton} onPress={() => setShowNewHangoutForm(false)}>
              <Text style={styles.darkCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.darkModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.darkFormSection}>
              <Text style={styles.darkFormLabel}>Hangout Title *</Text>
              <TextInput
                style={styles.darkTextInput}
                value={hangoutTitle}
                onChangeText={setHangoutTitle}
                placeholder="e.g., Rooftop Cafe Jam, Code Sprint"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.darkFormSection}>
              <Text style={styles.darkFormLabel}>Date *</Text>
              <TextInput
                style={styles.darkTextInput}
                value={hangoutDate}
                onChangeText={setHangoutDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.darkFormSection}>
              <Text style={styles.darkFormLabel}>Time *</Text>
              <TextInput
                style={styles.darkTextInput}
                value={hangoutTime}
                onChangeText={setHangoutTime}
                placeholder="HH:MM"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.darkFormSection}>
              <Text style={styles.darkFormLabel}>Venue *</Text>
              <TextInput
                style={styles.darkTextInput}
                value={hangoutVenue}
                onChangeText={setHangoutVenue}
                placeholder="e.g., Nescafe Kiosk, MAC Auditorium"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.darkFormSection}>
              <Text style={styles.darkFormLabel}>Maximum Participants</Text>
              <TextInput
                style={styles.darkTextInput}
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                keyboardType="numeric"
                placeholder="4"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.darkFormSection}>
              <Text style={styles.darkFormLabel}>Invited Crew</Text>
              <View style={styles.darkChipList}>
                {selectedParticipants.map((participant) => (
                  <View key={participant.id} style={styles.darkChip}>
                    <Image source={{ uri: participant.image }} style={styles.darkChipImage} />
                    <Text style={styles.darkChipText}>{participant.name.split(" ")[0]}</Text>
                    <TouchableOpacity onPress={() => toggleParticipant(participant)} style={styles.removeChip}>
                      <Text style={styles.removeChipText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.dashedAddButton} onPress={() => setShowInviteMore(true)}>
                <Text style={styles.dashedAddButtonText}>+ Add Connections to Invite</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.darkButton, styles.neonSolid, styles.submitButton]} onPress={handleCreateHangout}>
              <Text style={styles.neonSolidText}>Broadcast Hangout Invitation</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Invite Friends Selection Modal */}
      <Modal
        visible={showInviteMore}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteMore(false)}
      >
        <View style={styles.darkModalContainer}>
          <View style={styles.darkModalHeader}>
            <Text style={styles.darkModalTitle}>Invite Connections</Text>
            <TouchableOpacity style={styles.darkCloseButton} onPress={() => setShowInviteMore(false)}>
              <Text style={styles.darkCloseText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.darkModalContent}>
            {connections.map((connection, _index) => {
              const isSelected = selectedParticipants.some((p) => p.id === connection.id);
              return (
                <TouchableOpacity
                  key={connection.id ? String(connection.id) : `invite-${_index}`}
                  style={[styles.darkInviteRow, isSelected && styles.selectedInviteRow]}
                  onPress={() => toggleParticipant(connection)}
                >
                  <Image source={{ uri: connection.image }} style={styles.inviteAvatar} />
                  <View style={styles.inviteInfo}>
                    <Text style={styles.inviteName}>{connection.name}</Text>
                    <Text style={styles.inviteBio} numberOfLines={1}>{connection.bio || "No bio yet."}</Text>
                  </View>
                  <View style={[styles.inviteCheckbox, isSelected && styles.inviteChecked]}>
                    {isSelected && <Text style={styles.checkmarkIcon}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
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
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    color: "#FF2D8F",
    fontSize: 16,
    fontWeight: "bold",
  },
  graphContainer: {
    flex: 1,
    backgroundColor: "#080816",
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  // Dark Modal Styles
  darkModalContainer: {
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
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  darkCloseButton: {
    padding: 6,
  },
  darkCloseText: {
    fontSize: 20,
    color: "#8E8EA8",
    fontWeight: "500",
  },
  darkModalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Profile Section inside Modal
  darkProfileSection: {
    alignItems: "center",
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A36",
  },
  avatarGlowContainer: {
    position: "relative",
    shadowColor: "#00F0FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  darkProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FF2D8F",
  },
  degreeBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#0A0A1C",
  },
  degreeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  darkName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 16,
    textAlign: "center",
  },
  darkBio: {
    fontSize: 14,
    color: "#B2B2CC",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 10,
    paddingHorizontal: 15,
  },
  darkMutualBadge: {
    backgroundColor: "rgba(0, 240, 255, 0.08)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.2)",
    marginTop: 16,
  },
  darkMutualText: {
    fontSize: 12,
    color: "#00F0FF",
    fontWeight: "700",
  },
  // Details Section inside Modal
  darkInfoSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A36",
  },
  darkSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8E8EA8",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: "#7E7E9A",
  },
  infoValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  // Actions
  darkActionSection: {
    paddingVertical: 28,
    gap: 14,
  },
  darkButton: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    height: 52,
  },
  primaryOutline: {
    borderWidth: 1.5,
    borderColor: "#2A2A4E",
    backgroundColor: "transparent",
  },
  primaryOutlineText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  neonSolid: {
    backgroundColor: "#FF2D8F",
    shadowColor: "#FF2D8F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  neonSolidText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  // Glass Overlay
  glassOverlay: {
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
    width: screenWidth - 40,
    maxWidth: 340,
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: "#222240",
  },
  glassTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 20,
    textAlign: "center",
  },
  glassOptionButton: {
    backgroundColor: "#1C1C3A",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2C2C54",
  },
  glassOptionText: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "700",
  },
  glassCancelButton: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  glassCancelText: {
    color: "#8E8EA8",
    fontSize: 14,
    fontWeight: "600",
  },
  // Existing Hangouts inside Modal
  darkEmptyState: {
    alignItems: "center",
    paddingVertical: 64,
    gap: 20,
  },
  darkEmptyText: {
    color: "#8E8EA8",
    fontSize: 15,
  },
  darkHangoutCard: {
    backgroundColor: "#13132B",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#222244",
  },
  darkHangoutTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  darkHangoutDetails: {
    fontSize: 13,
    color: "#8E8EA8",
    marginBottom: 4,
  },
  cardProgressContainer: {
    marginTop: 10,
  },
  progressText: {
    fontSize: 12,
    color: "#00F0FF",
    fontWeight: "600",
  },
  // Forms
  darkFormSection: {
    marginBottom: 22,
  },
  darkFormLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8E8EA8",
    marginBottom: 8.5,
    letterSpacing: 0.2,
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
    marginVertical: 24,
  },
  // Chips
  darkChipList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  darkChip: {
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
  darkChipImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  darkChipText: {
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
  dashedAddButton: {
    borderWidth: 1.5,
    borderColor: "#FF2D8F",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(255, 45, 143, 0.03)",
  },
  dashedAddButtonText: {
    color: "#FF2D8F",
    fontSize: 13,
    fontWeight: "700",
  },
  // Invite Selection Row
  darkInviteRow: {
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
  inviteCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#222240",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteChecked: {
    backgroundColor: "#FF2D8F",
    borderColor: "#FF2D8F",
  },
  checkmarkIcon: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});