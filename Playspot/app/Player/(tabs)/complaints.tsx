// screens/player/ComplaintsManagement.tsx
import HeaderComponent from "@/components/HeaderComponent";
import { ComplaintsSkeleton } from "@/components/ui/ComplaintsSkeleton";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  where
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Toast from 'react-native-toast-message';
import { auth } from "../../../firebaseconfig";

interface Complaint {
  id: string;
  playerId: string;
  playerName: string;
  playerEmail?: string;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  groundId: string;
  groundName: string;
  type: string;
  description: string;
  status: "pending" | "under_review" | "resolved";
  createdAt: Date;
  adminNote?: string;
  resolvedAt?: Date;
  reviewedByAdmin?: boolean;
}

interface OwnerComplaint {
  id: string;
  playerId: string;
  playerName: string;
  playerEmail?: string;
  groundId: string;
  groundName: string;
  type: string;
  description: string;
  status: "pending" | "under_review" | "resolved";
  createdAt: Date;
  ownerId: string;
  ownerName: string;
  adminNote?: string;
  resolvedAt?: Date;
  reviewedByAdmin?: boolean;
}

const { width, height } = Dimensions.get('window');
const isSmall = width < 400;
const isMedium = width >= 400 && width < 768;
const isLarge = width >= 768;

type ViewMode = "list" | "detail";

const ComplaintsManagement = () => {
  const [complaintsByPlayer, setComplaintsByPlayer] = useState<Complaint[]>([]);
  const [complaintsAgainstPlayer, setComplaintsAgainstPlayer] = useState<OwnerComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"byPlayer" | "againstPlayer">("byPlayer");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | OwnerComplaint | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Complaint form state
  const [ownerName, setOwnerName] = useState("");
  const [groundName, setGroundName] = useState("");
  const [complaintType, setComplaintType] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");

  // Complaint types
  const complaintTypes = [
    { id: "payment_issue", label: "Payment Issue" },
    { id: "behavior_issue", label: "Behavior Issue" },
    { id: "no_show", label: "No Show / Cancellation" },
    { id: "property_damage", label: "Property Damage" },
    { id: "rule_violation", label: "Rule Violation" },
    { id: "other", label: "Other" },
  ];

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const db = getFirestore();
      const user = auth.currentUser;
      if (!user) return;

      // Fetch complaints by player (complaints submitted by this player)
      const playerComplaintsRef = collection(db, "player_complaints");
      const playerComplaintsQuery = query(
        playerComplaintsRef,
        where("playerId", "==", user.uid)
      );

      const playerComplaintsSnapshot = await getDocs(playerComplaintsQuery);
      let playerComplaintsData = playerComplaintsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        resolvedAt: doc.data().resolvedAt?.toDate() || null,
      })) as Complaint[];

      // Sort by date (newest first)
      playerComplaintsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setComplaintsByPlayer(playerComplaintsData);

      // Fetch complaints against player (complaints submitted by owners against this player)
      const ownerComplaintsRef = collection(db, "owner_complaints");
      
      // Query by playerEmail - this is the key fix
      const ownerComplaintsQuery = query(
        ownerComplaintsRef,
        where("playerEmail", "==", user.email)
      );

      const ownerComplaintsSnapshot = await getDocs(ownerComplaintsQuery);
      let ownerComplaintsData = ownerComplaintsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          playerName: data.playerName || user.displayName || "Player",
          playerEmail: data.playerEmail || user.email || "",
          createdAt: data.createdAt?.toDate() || new Date(),
          resolvedAt: data.resolvedAt?.toDate() || null,
        };
      }) as OwnerComplaint[];

      // Sort by date (newest first)
      ownerComplaintsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setComplaintsAgainstPlayer(ownerComplaintsData);

    } catch (error) {
      console.error("Error fetching complaints:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch complaints'
      });
    } finally {
      setLoading(false);
    }
  };

  const submitComplaint = async () => {
    if (!complaintType || !complaintDescription.trim() || !ownerName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all required fields'
      });
      return;
    }

    setSubmitting(true);
    try {
      const db = getFirestore();
      const user = auth.currentUser;

      if (!user) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'You must be logged in to submit a complaint'
        });
        return;
      }

      const complaintData = {
        playerId: user.uid,
        playerName: user.displayName || "Player",
        playerEmail: user.email || "",
        ownerName: ownerName.trim(),
        ownerEmail: "", // We'll keep this empty for now as per your working code
        groundName: groundName.trim(),
        type: complaintType,
        description: complaintDescription.trim(),
        status: "pending",
        createdAt: new Date(),
        reviewedByAdmin: false
      };

      await addDoc(collection(db, "player_complaints"), complaintData);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Complaint submitted successfully'
      });
      resetForm();
      setShowComplaintModal(false);
      fetchComplaints(); // Refresh the list
    } catch (error) {
      console.error("Error submitting complaint:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit complaint'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setOwnerName("");
    setGroundName("");
    setComplaintType("");
    setComplaintDescription("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "#10B981"; // Green
      case "under_review": return "#F59E0B"; // Orange
      default: return "#EF4444"; // Red for pending
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "resolved": return "Resolved";
      case "under_review": return "Under Review";
      default: return "Pending";
    }
  };

  const getTypeLabel = (type: string) => {
    const typeObj = complaintTypes.find(t => t.id === type);
    return typeObj ? typeObj.label : type.replace('_', ' ').toUpperCase();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleComplaintPress = (complaint: Complaint | OwnerComplaint) => {
    setSelectedComplaint(complaint);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedComplaint(null);
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (viewMode === 'detail') {
        handleBackToList();
        return true; // Prevent default back action
      }
      return false;
    });

    return () => backHandler.remove();
  }, [viewMode]);

  // Simple Card View for Complaints List
  const renderSimpleComplaintCard = ({ item }: { item: Complaint | OwnerComplaint }) => (
    <TouchableOpacity 
      style={[styles.simpleComplaintCard, isLarge && styles.simpleComplaintCardTablet]}
      onPress={() => handleComplaintPress(item)}
    >
      <View style={styles.simpleCardHeader}>
        <View style={styles.simpleCardTitleContainer}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: activeTab === "byPlayer" ? "#EEF2FF" : "#FEF2F2" }
          ]}>
            <Ionicons 
              name={activeTab === "byPlayer" ? "business" : "person"} 
              size={20} 
              color={activeTab === "byPlayer" ? "#1e293b" : "#EF4444"} 
            />
          </View>
          <View style={styles.simpleCardTextContainer}>
            <Text style={styles.simpleCardTitle} numberOfLines={1}>
              {activeTab === "byPlayer" 
                ? `Against: ${(item as Complaint).ownerName}`
                : `By: ${(item as OwnerComplaint).ownerName}`
              }
            </Text>
            <Text style={styles.simpleCardSubtitle}>
              {getTypeLabel(item.type)}
            </Text>
          </View>
        </View>
        <View style={[styles.simpleStatusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.simpleStatusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.simpleCardBody}>
        <Text style={styles.simpleCardDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.simpleCardFooter}>
        <View style={styles.simpleCardDateTime}>
          <Ionicons name="calendar" size={14} color="#6B7280" />
          <Text style={styles.simpleCardDateTimeText}>
            {formatDate(item.createdAt)} • {formatTime(item.createdAt)}
          </Text>
        </View>
        
        {/* Warning indicator for complaints against player with admin note */}
        {activeTab === "againstPlayer" && item.adminNote && (
          <View style={styles.warningIndicator}>
            <Ionicons name="warning" size={14} color="#DC2626" />
            <Text style={styles.warningIndicatorText}>Warning</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Detail View Screen
  const renderDetailView = () => {
    if (!selectedComplaint) return null;

    return (
      <View style={styles.detailContainer}>
        {/* Header */}
        <View style={styles.detailHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToList}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>
            {activeTab === "byPlayer" ? "Complaint Details" : "Complaint Against You"}
          </Text>
          <View style={styles.detailHeaderSpacer} />
        </View>

        <ScrollView 
          style={styles.detailContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailContentContainer}
        >
          {/* Complaint Header Card */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailTitleContainer}>
                <View style={[
                  styles.detailIconContainer,
                  { backgroundColor: activeTab === "byPlayer" ? "#EEF2FF" : "#FEF2F2" }
                ]}>
                  <Ionicons 
                    name={activeTab === "byPlayer" ? "business" : "person"} 
                    size={24} 
                    color={activeTab === "byPlayer" ? "#1e293b" : "#EF4444"} 
                  />
                </View>
                <View style={styles.detailTitleText}>
                  <Text style={styles.detailTitle}>
                    {activeTab === "byPlayer" 
                      ? `Against: ${(selectedComplaint as Complaint).ownerName}`
                      : `By: ${(selectedComplaint as OwnerComplaint).ownerName}`
                    }
                  </Text>
                  <Text style={styles.detailSubtitle}>{getTypeLabel(selectedComplaint.type)}</Text>
                </View>
              </View>
              <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedComplaint.status) }]}>
                <Text style={styles.detailStatusText}>{getStatusText(selectedComplaint.status)}</Text>
              </View>
            </View>
          </View>

          {/* Player Information - Show for complaints against player */}
          {activeTab === "againstPlayer" && (
            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Player Information</Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Ionicons name="person" size={18} color="#1e293b" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Player Name</Text>
                    <Text style={styles.infoValue}>{(selectedComplaint as OwnerComplaint).playerName}</Text>
                  </View>
                </View>

                {(selectedComplaint as OwnerComplaint).playerEmail && (
                  <View style={styles.infoItem}>
                    <Ionicons name="mail" size={18} color="#1e293b" />
                    <View style={styles.infoText}>
                      <Text style={styles.infoLabel}>Player Email</Text>
                      <Text style={styles.infoValue}>{(selectedComplaint as OwnerComplaint).playerEmail}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Complaint Information */}
          <View style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Complaint Information</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar" size={18} color="#1e293b" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedComplaint.createdAt)}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="time" size={18} color="#1e293b" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Time</Text>
                  <Text style={styles.infoValue}>{formatTime(selectedComplaint.createdAt)}</Text>
                </View>
              </View>

              {selectedComplaint.groundName && (
                <View style={styles.infoItem}>
                  <Ionicons name="location" size={18} color="#1e293b" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Ground</Text>
                    <Text style={styles.infoValue}>{selectedComplaint.groundName}</Text>
                  </View>
                </View>
              )}

              <View style={styles.infoItem}>
                <Ionicons name="alert-circle" size={18} color="#1e293b" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={[styles.infoValue, { color: getStatusColor(selectedComplaint.status) }]}>
                    {getStatusText(selectedComplaint.status)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Complaint Description */}
          <View style={styles.detailCard}>
            <Text style={styles.sectionTitle}>
              {activeTab === "byPlayer" ? "Complaint Description" : "Complaint Details"}
            </Text>
            <Text style={styles.descriptionText}>{selectedComplaint.description}</Text>
          </View>

          {/* Admin Note - Show as warning for complaints against player */}
          {activeTab === "againstPlayer" && selectedComplaint.adminNote && (
            <View style={[styles.detailCard, styles.warningCard]}>
              <View style={styles.warningHeader}>
                <Ionicons name="warning" size={24} color="#DC2626" />
                <Text style={styles.warningTitle}>Important Warning from Admin</Text>
              </View>
              <Text style={styles.warningText}>{selectedComplaint.adminNote}</Text>
              {selectedComplaint.resolvedAt && (
                <Text style={styles.warningDate}>
                  Action taken on: {formatDate(selectedComplaint.resolvedAt)}
                </Text>
              )}
            </View>
          )}

          {/* Show resolved status without admin note */}
          {selectedComplaint.status === "resolved" && !selectedComplaint.adminNote && (
            <View style={[styles.detailCard, styles.successCard]}>
              <View style={styles.successHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.successTitle}>Complaint Resolved</Text>
              </View>
              <Text style={styles.successText}>
                This complaint has been successfully resolved by the administration.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // List View Screen
  const renderListView = () => (
    <View style={styles.listContainer}>
      <HeaderComponent
        title="Complaints Management"
        subtitle="Manage and View Complaints"
        iconName="alert-circle-outline"
      />

      <View style={styles.content}>
        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "byPlayer" && styles.activeTab]}
            onPress={() => setActiveTab("byPlayer")}
          >
            <Ionicons 
              name="arrow-up-circle" 
              size={20} 
              color={activeTab === "byPlayer" ? "#FFFFFF" : "#1e293b"} 
            />
            <Text style={[styles.tabText, activeTab === "byPlayer" && styles.activeTabText]}>
              Your Complaints
            </Text>
            {complaintsByPlayer.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{complaintsByPlayer.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === "againstPlayer" && styles.activeTab]}
            onPress={() => setActiveTab("againstPlayer")}
          >
            <Ionicons 
              name="arrow-down-circle" 
              size={20} 
              color={activeTab === "againstPlayer" ? "#FFFFFF" : "#EF4444"} 
            />
            <Text style={[styles.tabText, activeTab === "againstPlayer" && styles.activeTabText]}>
              Against You
            </Text>
            {complaintsAgainstPlayer.length > 0 && (
              <View style={[styles.badge, styles.badgeWarning]}>
                <Text style={styles.badgeText}>{complaintsAgainstPlayer.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* New Complaint Button */}
        {activeTab === "byPlayer" && (
          <TouchableOpacity
            style={styles.newComplaintButton}
            onPress={() => setShowComplaintModal(true)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.newComplaintText}>File New Complaint</Text>
          </TouchableOpacity>
        )}

        {/* Complaints List */}
        <FlatList
          data={activeTab === "byPlayer" ? complaintsByPlayer : complaintsAgainstPlayer}
          renderItem={renderSimpleComplaintCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="document-text-outline" 
                size={64} 
                color="#D1D5DB" 
              />
              <Text style={styles.emptyTitle}>
                {activeTab === "byPlayer" 
                  ? "No Complaints Filed" 
                  : "No Complaints Against You"
                }
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "byPlayer"
                  ? "You haven't filed any complaints against ground owners yet."
                  : "You have no complaints from ground owners at this time."
                }
              </Text>
              {activeTab === "byPlayer" && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setShowComplaintModal(true)}
                >
                  <Text style={styles.emptyButtonText}>File Your First Complaint</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
    </View>
  );

  if (loading) {
    return <ComplaintsSkeleton />;
  }

  return (
    <View style={styles.container}>
      {viewMode === "list" ? renderListView() : renderDetailView()}

      {/* Complaint Submission Modal */}
      <Modal
        visible={showComplaintModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setShowComplaintModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
              <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowComplaintModal(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          
              <View style={styles.formContainer}>
                <View style={styles.formHeader}>
                  <View style={[styles.methodIconLarge, { backgroundColor: '#1e293b15' }]}>
                    <Ionicons name="alert-circle" size={32} color="#1e293b" />
                  </View>
                  <Text style={styles.formTitle}>File New Complaint</Text>
                  <Text style={styles.formSubtitle}>Enter complaint details below</Text>
                </View>

                <Text style={styles.inputLabel}>Owner's Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter the ground owner's name"
                  value={ownerName}
                  onChangeText={setOwnerName}
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>Ground Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter ground name"
                  value={groundName}
                  onChangeText={setGroundName}
                  placeholderTextColor="#999"
                />

                <Text style={styles.inputLabel}>Complaint Type *</Text>
                <View style={styles.typeContainer}>
                  {complaintTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeButton,
                        complaintType === type.id && styles.typeButtonSelected
                      ]}
                      onPress={() => setComplaintType(type.id)}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        complaintType === type.id && styles.typeButtonTextSelected
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.descriptionInput]}
                  placeholder="Describe the issue in detail..."
                  value={complaintDescription}
                  onChangeText={setComplaintDescription}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowComplaintModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={submitComplaint}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>Submit Complaint</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },

  // List View Styles
  listContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: isSmall ? 12 : 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    margin:4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isSmall ? 10 : 12,
    borderRadius: 8,
    margin: 2,
  },
  activeTab: {
    backgroundColor: '#1e293b',
  },
  tabText: {
    fontSize: isSmall ? 12 : 14,
    fontWeight: '600',
    marginLeft: 6,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  badgeWarning: {
    backgroundColor: '#EF4444',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  newComplaintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    padding: isSmall ? 14 : 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    margin:4,
  },
  newComplaintText: {
    color: '#FFFFFF',
    fontSize: isSmall ? 14 : 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 20,
  },

  // Simple Card Styles
  simpleComplaintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    margin:4,
    elevation: 2,
  },
  simpleComplaintCardTablet: {
    marginHorizontal: isLarge ? 20 : 0,
  },
  simpleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  simpleCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  simpleCardTextContainer: {
    flex: 1,
  },
  simpleCardTitle: {
    fontSize: isSmall ? 14 : 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  simpleCardSubtitle: {
    fontSize: isSmall ? 12 : 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  simpleStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  simpleStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  simpleCardBody: {
    marginBottom: 12,
  },
  simpleCardDescription: {
    fontSize: isSmall ? 13 : 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  simpleCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simpleCardDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  simpleCardDateTimeText: {
    fontSize: isSmall ? 11 : 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  warningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  warningIndicatorText: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: 4,
  },

  // Detail View Styles
  detailContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isSmall ? 16 : 20,
    paddingTop: isSmall ? 0 : 0,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginLeft: 8,
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  detailHeaderSpacer: {
    width: 80,
  },
  detailContent: {
    flex: 1,
  },
  detailContentContainer: {
    padding: isSmall ? 16 : 20,
    paddingBottom: 40,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTitleText: {
    flex: 1,
  },
  detailTitle: {
    fontSize: isSmall ? 12 : 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  detailSubtitle: {
    fontSize: isSmall ? 14 : 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detailStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: isSmall ? 16 : 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: isSmall ? 'column' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: isSmall ? '100%' : '48%',
  },
  infoText: {
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 15,
    color: '#991B1B',
    lineHeight: 22,
    fontWeight: '500',
  },
  warningDate: {
    fontSize: 14,
    color: '#991B1B',
    fontStyle: 'italic',
    marginTop: 8,
  },
  infoCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  infoCardText: {
    fontSize: 15,
    color: '#92400E',
    lineHeight: 22,
  },
  resolvedDate: {
    fontSize: 14,
    color: '#92400E',
    fontStyle: 'italic',
    marginTop: 8,
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 8,
  },
  successText: {
    fontSize: 15,
    color: '#065F46',
    lineHeight: 22,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    padding: 20,
    alignItems: 'flex-end',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  formContainer: {
    padding: 4,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  methodIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  descriptionInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    margin: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  typeButtonSelected: {
    backgroundColor: '#1e293b',
    borderColor: '#1e293b',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  typeButtonTextSelected: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    marginRight: 12,
     marginBottom: 20,
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ComplaintsManagement;