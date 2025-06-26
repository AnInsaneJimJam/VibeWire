import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Svg, Circle, Line, G } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

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

interface GraphProps {
  userDetails: {
    name: string;
    image: string;
    userNumber: string;
  };
  connections: Connection[];
}

interface NodePosition {
  x: number;
  y: number;
  connection?: Connection;
  isUser?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function GraphScreen({ userDetails, connections }: GraphProps) {
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Separate connections by degree
  const firstDegreeConnections = connections.filter(c => c.degree === 1);
  const secondDegreeConnections = connections.filter(c => c.degree === 2);

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
    const firstDegreeAngleStep = (2 * Math.PI) / firstDegreeConnections.length;
    
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
        secondDegreeIndex + Math.ceil(secondDegreeConnections.length / firstDegreeConnections.length)
      );
      
      const firstDegreeAngle = firstIndex * firstDegreeAngleStep;
      const firstDegreeX = centerX + Math.cos(firstDegreeAngle) * firstDegreeRadius;
      const firstDegreeY = centerY + Math.sin(firstDegreeAngle) * firstDegreeRadius;
      
      relatedSecondDegree.forEach((connection, relatedIndex) => {
        const subAngle = (relatedIndex * (Math.PI / 3)) - (Math.PI / 6); // Spread around first degree node
        positions.push({
          x: firstDegreeX + Math.cos(firstDegreeAngle + subAngle) * secondDegreeRadius,
          y: firstDegreeY + Math.sin(firstDegreeAngle + subAngle) * secondDegreeRadius,
          connection,
        });
      });
      
      secondDegreeIndex += relatedSecondDegree.length;
    });

    return positions;
  };

  const nodePositions = calculateNodePositions();

  const handleConnectionPress = (connection: Connection) => {
    setSelectedConnection(connection);
    setShowDetail(true);
  };

  const handlePlanHangout = (connection: Connection) => {
    Alert.alert(
      'Plan Hangout',
      `Would you like to plan a hangout with ${connection.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Plan It!', 
          onPress: () => {
            Alert.alert('Success!', `Hangout request sent to ${connection.name}`);
            setShowDetail(false);
          }
        },
      ]
    );
  };

  const navigateToProfileScreen = () => {
  // Add your navigation logic here
  console.log('Navigate to profile screen');
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
    const firstDegreePositions = nodePositions.filter(p => p.connection?.degree === 1);
    const secondDegreePositions = nodePositions.filter(p => p.connection?.degree === 2);
    
    firstDegreePositions.forEach((firstPos, firstIndex) => {
      const relatedSecondDegree = secondDegreePositions.slice(
        firstIndex * Math.ceil(secondDegreePositions.length / firstDegreePositions.length),
        (firstIndex + 1) * Math.ceil(secondDegreePositions.length / firstDegreePositions.length)
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
            fill={isUser ? "#00D4FF" : connection?.degree === 1 ? "#FF6B9D": "#FFD93D"}
            stroke="#FFFFFF"
            strokeWidth="3"
          />
        </G>
      );
    });
  };

  return (
  <View style={[styles.container, { backgroundColor: '#0F0F23' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Connection Network</Text>
        <Text style={styles.subtitle}>Explore your connections</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#00D4FF' }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF6B9D' }]} />
          <Text style={styles.legendText}>1st Degree</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFD93D' }]} />
          <Text style={styles.legendText}>2nd Degree</Text>
        </View>
      </View>

      {/* Scrollable Graph */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.graphContainer}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        minimumZoomScale={0.5}
        maximumZoomScale={2}
        bouncesZoom={true}
        contentContainerStyle={{
          width: graphWidth,
          height: graphHeight,
        }}
      >

       <TouchableOpacity onPress={() => navigateToProfileScreen()} activeOpacity={0.8}> 
        <ScrollView
          style={styles.verticalScroll}
          showsVerticalScrollIndicator={false}
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
                    shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.3,
shadowRadius: 4,
elevation: 5,
                  }
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
                    uri: isUser ? userDetails.image : connection?.image 
                  }}
                  style={[
                    styles.nodeImage,
                    {
                      width: nodeSize - 10,
                      height: nodeSize - 10,
                      borderRadius: (nodeSize - 10) / 2,
                    }
                  ]}
                />
                <Text style={[
                  styles.nodeName,
                  { fontSize: isUser ? 12 : 10 }
                ]}>
                  {isUser 
                    ? userDetails.name.split(' ')[0] 
                    : connection?.name.split(' ')[0]
                  }
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      
      </TouchableOpacity>

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
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.profileSection}>
                <Image 
                  source={{ uri: selectedConnection.image }} 
                  style={styles.modalProfileImage} 
                />
                <Text style={styles.modalName}>{selectedConnection.name}</Text>
                <Text style={styles.modalBio}>{selectedConnection.bio}</Text>
                
                {selectedConnection.degree === 2 && (
                  <View style={styles.mutualBadge}>
                    <Text style={styles.mutualText}>
                      {selectedConnection.mutualConnections} mutual connections
                    </Text>
                  </View>
                )}
              </View>

              {(selectedConnection.course || selectedConnection.bhawan) && (
                <View style={styles.educationSection}>
                  <Text style={styles.sectionTitle}>📚 Education</Text>
                  {selectedConnection.course && (
                    <Text style={styles.educationText}>{selectedConnection.course}</Text>
                  )}
                  {selectedConnection.year && (
                    <Text style={styles.educationText}>{selectedConnection.year}</Text>
                  )}
                  {selectedConnection.bhawan && (
                    <Text style={styles.educationText}>🏠 {selectedConnection.bhawan}</Text>
                  )}
                </View>
              )}

              <View style={styles.actionSection}>
                <TouchableOpacity 
                  style={styles.messageButton}
                  onPress={() => {
                    Alert.alert('Message', `Opening chat with ${selectedConnection.name}`);
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
      </ScrollView>
  </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F0F0F0',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(187, 17, 17, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#F0F0F0',
    fontWeight: '500',
  },
  graphContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  verticalScroll: {
    flex: 1,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  nodeOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeImage: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nodeName: {
    color: 'black',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  closeButton: {
    fontSize: 18,
    color: '#636E72',
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#6C5CE7',
    marginBottom: 16,
  },
  modalName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalBio: {
    fontSize: 16,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  mutualBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mutualText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  educationSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
  },
  educationText: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 6,
  },
  actionSection: {
    paddingVertical: 24,
    gap: 12,
  },
  messageButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hangoutButton: {
    backgroundColor: '#00B894',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  hangoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});