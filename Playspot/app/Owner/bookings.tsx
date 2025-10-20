// screens/owner/BookingRequests.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDocs, getFirestore, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import HeaderComponent from '../../components/HeaderComponent';
import { OwnerBookingsSkeleton } from '../../components/ui/OwnerBookingsSkeleton';
import { auth } from '../../firebaseconfig';

interface Booking {
  id: string;
  groundId: string;
  groundName: string;
  playerName: string;
  date: string;
  time: string;
  duration: number;
  pricePerHour: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'delayed' | 'rejected' | 'cancelled';
  paymentStatus: string;
  reason?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  createdAt: any;
}

type OwnerApprovalStatus = 'pending' | 'approved' | 'rejected';
type ViewMode = 'list' | 'detail';

const { width, height } = Dimensions.get('window');
const isSmall = width < 400;
const isMedium = width >= 400 && width < 768;
const isLarge = width >= 768;

const BookingRequests = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerApprovalStatus, setOwnerApprovalStatus] = useState<OwnerApprovalStatus>('pending');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [ownerGrounds, setOwnerGrounds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchBookings();
  }, [ownerApprovalStatus]);

  const fetchBookings = async () => {
    setRefreshing(true);
    try {
      const db = getFirestore();
      const user = auth.currentUser;
      if (!user) return;

      // Fetch owner approval status
      const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        setOwnerApprovalStatus(userData.approvalStatus || 'pending');
        setRejectionReason(userData.rejectionReason || null);
      }

      if (ownerApprovalStatus === 'approved') {
        // Fetch grounds owned by this user
        const groundsRef = collection(db, 'grounds');
        const groundsQuery = query(groundsRef, where('ownerId', '==', user.uid));
        const groundsSnapshot = await getDocs(groundsQuery);
        const groundIds = groundsSnapshot.docs.map(doc => doc.id);
        setOwnerGrounds(groundIds);

        if (groundIds.length > 0) {
          // Fetch bookings for grounds owned by this user
          const bookingsRef = collection(db, 'bookings');
          const bookingsQuery = query(bookingsRef, where('groundId', 'in', groundIds));
          const bookingsSnapshot = await getDocs(bookingsQuery);
          
          const bookingsData: Booking[] = [];
          
          for (const doc of bookingsSnapshot.docs) {
            const bookingData = doc.data();
            
            // Fetch user details for each booking
            const userQuery = query(collection(db, 'users'), where('__name__', '==', bookingData.userId));
            const userSnapshot = await getDocs(userQuery);
            let userDetails = { name: '', email: '', phone: '' };
            
            if (!userSnapshot.empty) {
              const userData = userSnapshot.docs[0].data();
              userDetails = {
                name: userData.name || userData.displayName || 'Unknown Player',
                email: userData.email || 'No email',
                phone: userData.phoneNumber || userData.phone || 'No phone'
              };
            }
            
            bookingsData.push({
              id: doc.id,
              groundId: bookingData.groundId,
              groundName: bookingData.groundName,
              playerName: userDetails.name,
              date: bookingData.date,
              time: bookingData.time,
              duration: bookingData.duration || 1,
              pricePerHour: bookingData.pricePerHour || bookingData.groundPrice || 0,
              totalAmount: bookingData.totalAmount || (bookingData.duration || 1) * (bookingData.pricePerHour || bookingData.groundPrice || 0),
              status: bookingData.status || bookingData.bookingStatus || 'pending',
              paymentStatus: bookingData.paymentStatus || 'pending',
              reason: bookingData.reason,
              userId: bookingData.userId,
              userEmail: userDetails.email,
              userName: userDetails.name,
              userPhone: userDetails.phone,
              createdAt: bookingData.createdAt
            } as Booking);
          }
          
          // Sort bookings by date (newest first)
          bookingsData.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          });
          
          setBookings(bookingsData);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch bookings',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: 'confirmed' | 'delayed' | 'rejected' | 'cancelled', reason?: string) => {
    try {
      const db = getFirestore();
      const updateData: any = { 
        status: newStatus,
        ...(reason && { reason }) 
      };
      
      await updateDoc(doc(db, 'bookings', bookingId), updateData);
      
      // Update local state
      setBookings(bookings.map(b => {
        if (b.id === bookingId) {
          return { 
            ...b, 
            status: newStatus, 
            ...(reason && { reason }) 
          };
        }
        return b;
      }));

      // If we're in detail view, update the selected booking
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking({
          ...selectedBooking,
          status: newStatus,
          ...(reason && { reason })
        });
      }
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Booking ${newStatus} successfully`,
      });
      
      // Reset rejection reason and hide input
      setRejectReason('');
      setShowRejectInput(false);
    } catch (error) {
      console.error(`Error ${newStatus} booking:`, error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Failed to ${newStatus} booking`,
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.replace('-', ' - ');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'delayed': return 'alert-circle';
      case 'rejected': return 'close-circle';
      case 'cancelled': return 'ban';
      default: return 'help-circle';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10B981'; // Green
      case 'pending': return '#F59E0B'; // Orange
      case 'delayed': return '#3B82F6'; // Blue
      case 'rejected': return '#EF4444'; // Red
      case 'cancelled': return '#6B7280'; // Gray
      default: return '#6B7280';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleBookingPress = (booking: Booking) => {
    setSelectedBooking(booking);
    setViewMode('detail');
    setShowRejectInput(false);
    setRejectReason('');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedBooking(null);
    setRejectReason('');
    setShowRejectInput(false);
  };

  const handleRejectClick = () => {
    setShowRejectInput(true);
    setRejectReason('');
  };

  const handleCancelReject = () => {
    setShowRejectInput(false);
    setRejectReason('');
  };

  const handleConfirmReject = () => {
    if (selectedBooking && rejectReason.trim()) {
      handleStatusChange(selectedBooking.id, 'rejected', rejectReason.trim());
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a reason for rejection',
      });
    }
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

  // Simple Card View for Booking List
  const renderSimpleBookingCard = ({ item }: { item: Booking }) => (
    <TouchableOpacity 
      style={[styles.simpleBookingCard, isLarge && styles.simpleBookingCardTablet]}
      onPress={() => handleBookingPress(item)}
    >
      <View style={styles.simpleCardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {getInitials(item.userName)}
          </Text>
        </View>
        <View style={styles.simpleCardInfo}>
          <Text style={styles.playerName} numberOfLines={1}>
            {item.userName}
          </Text>
          <Text style={styles.groundName} numberOfLines={1}>
            {item.groundName}
          </Text>
          <View style={styles.timeInfo}>
            <Ionicons name="time-outline" size={12} color="#6B7280" />
            <Text style={styles.timeText}>
              {item.duration} hour{item.duration > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.simpleCardStatus}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusTextSimple, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
          <Text style={styles.amountText}>
            Rs{item.totalAmount}
          </Text>
        </View>
      </View>
      
      <View style={styles.simpleCardFooter}>
        <View style={styles.dateInfo}>
          <Ionicons name="calendar-outline" size={12} color="#6B7280" />
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        </View>
        <Text style={styles.timeSlotText}>{formatTime(item.time)}</Text>
      </View>
    </TouchableOpacity>
  );

  // Detail View Screen
  const renderDetailView = () => {
    if (!selectedBooking) return null;

    return (
      <View style={styles.detailContainer}>
        {/* Header */}
        <View style={styles.detailHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToList}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
            <Text style={styles.backButtonText}>Back to List</Text>
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>Booking Details</Text>
          <View style={styles.detailHeaderSpacer} />
        </View>

        <ScrollView 
          style={styles.detailContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailContentContainer}
        >
          {/* Booking Header */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <View style={styles.detailAvatarContainer}>
                <Text style={styles.detailAvatarText}>
                  {getInitials(selectedBooking.userName)}
                </Text>
              </View>
              <View style={styles.detailTitleContainer}>
                <Text style={styles.detailPlayerName}>
                  {selectedBooking.userName}
                </Text>
                <Text style={styles.detailGroundName}>
                  {selectedBooking.groundName}
                </Text>
                <View style={[styles.detailStatusBadge, { backgroundColor: getStatusColor(selectedBooking.status) }]}>
                  <Ionicons name={getStatusIcon(selectedBooking.status)} size={16} color="#FFFFFF" />
                  <Text style={styles.detailStatusText}>
                    {selectedBooking.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Booking Information */}
          <View style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Booking Information</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar" size={20} color="#1e293b" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedBooking.date)}</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="time" size={20} color="#1e293b" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Time Slot</Text>
                  <Text style={styles.infoValue}>{formatTime(selectedBooking.time)}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="hourglass" size={20} color="#1e293b" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>{selectedBooking.duration} hour{selectedBooking.duration > 1 ? 's' : ''}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="cash" size={20} color="#1e293b" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Price/Hour</Text>
                  <Text style={styles.infoValue}>Rs{selectedBooking.pricePerHour}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Payment Information */}
          <View style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            
            <View style={styles.paymentInfo}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>Rs{selectedBooking.totalAmount}</Text>
              </View>
              
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payment Status</Text>
                <View style={[
                  styles.paymentStatusBadge,
                  selectedBooking.paymentStatus === 'paid' ? styles.paidBadge : styles.pendingBadge
                ]}>
                  <Text style={styles.paymentStatusText}>
                    {selectedBooking.paymentStatus.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Player Contact Information */}
          <View style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Player Information</Text>
            
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <Ionicons name="mail" size={18} color="#6B7280" />
                <Text style={styles.contactText}>{selectedBooking.userEmail}</Text>
              </View>
              
              <View style={styles.contactItem}>
                <Ionicons name="call" size={18} color="#6B7280" />
                <Text style={styles.contactText}>{selectedBooking.userPhone || 'No phone provided'}</Text>
              </View>
            </View>
          </View>

          {/* Reason (if any) */}
          {selectedBooking.reason && (
            <View style={[styles.detailCard, styles.reasonCard]}>
              <View style={styles.reasonHeader}>
                <Ionicons name="information-circle" size={20} color="#F59E0B" />
                <Text style={styles.reasonTitle}>Reason</Text>
              </View>
              <Text style={styles.reasonText}>{selectedBooking.reason}</Text>
            </View>
          )}

          {/* Action Buttons */}
          {(selectedBooking.status === 'pending' || selectedBooking.status === 'delayed') && (
            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Manage Booking</Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.confirmButton]} 
                  onPress={() => handleStatusChange(selectedBooking.id, 'confirmed')}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Confirm Booking</Text>
                </TouchableOpacity>

                {!showRejectInput ? (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]} 
                    onPress={handleRejectClick}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Reject Booking</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelRejectButton]} 
                    onPress={handleCancelReject}
                  >
                    <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Cancel Rejection</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Rejection Reason Input - Show when rejectReason is not empty */}
              {showRejectInput && (
                <View style={styles.rejectContainer}>
                  <Text style={styles.rejectLabel}>Reason for Rejection</Text>
                  <TextInput
                    style={styles.rejectInput}
                    placeholder="Enter reason for rejection..."
                    placeholderTextColor="#9CA3AF"
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    multiline
                    numberOfLines={3}
                  />
                  <View style={styles.rejectActions}>
                    <TouchableOpacity 
                      style={[styles.rejectActionButton, styles.cancelButton]} 
                      onPress={handleCancelReject}
                    >
                      <Text style={styles.rejectActionText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.rejectActionButton, styles.confirmRejectButton]} 
                      onPress={handleConfirmReject}
                      disabled={!rejectReason.trim()}
                    >
                      <Text style={styles.rejectActionText}>Confirm Rejection</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Additional actions for rejected bookings */}
          {selectedBooking.status === 'rejected' && (
            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Booking Actions</Text>
              <TouchableOpacity 
                style={[styles.actionButton, styles.confirmButton]} 
                onPress={() => handleStatusChange(selectedBooking.id, 'confirmed')}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Confirm Booking</Text>
              </TouchableOpacity>
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
        title="Booking Requests"
        subtitle="Manage booking requests for your grounds"
        iconName="calendar-outline"
      />
      
      <View style={styles.content}>
        {ownerGrounds.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Grounds Listed</Text>
            <Text style={styles.emptySubtitle}>
              You need to add grounds to receive booking requests
            </Text>
            <TouchableOpacity style={styles.addGroundButton}>
              <Text style={styles.addGroundText}>Add Your First Ground</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={bookings}
            renderItem={renderSimpleBookingCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={fetchBookings}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Booking Requests</Text>
                <Text style={styles.emptySubtitle}>
                  You have no booking requests for your grounds yet
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );

  if (loading || refreshing) {
    return <OwnerBookingsSkeleton />;
  }

  if (ownerApprovalStatus === 'pending') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#6b46c1', '#1e293b']} style={styles.gradientHeader}>
          <HeaderComponent
            title="Booking Requests"
            subtitle="Manage booking requests for your grounds"
            iconName="calendar-outline"
          />
        </LinearGradient>
        <View style={styles.statusContainer}>
          <Ionicons name="time" size={64} color="#F59E0B" />
          <Text style={styles.statusTitle}>Account Pending Approval</Text>
          <Text style={styles.statusMessage}>
            Your account is pending admin approval. You cannot manage bookings yet.
          </Text>
        </View>
        <Toast />
      </View>
    );
  }

  if (ownerApprovalStatus === 'rejected') {
    return (
      <View style={styles.container}>
        <HeaderComponent
          title="Booking Requests"
          subtitle="Manage booking requests for your grounds"
          iconName="calendar-outline"
        />
        <View style={styles.statusContainer}>
          <Ionicons name="close-circle" size={64} color="#EF4444" />
          <Text style={styles.statusTitle}>Account Rejected</Text>
          <Text style={styles.statusMessage}>
            {rejectionReason 
              ? `Your account was rejected. Reason: ${rejectionReason}`
              : 'Your account was rejected. Please contact support for details.'
            }
          </Text>
        </View>
        <Toast />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {viewMode === 'list' ? renderListView() : renderDetailView()}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  gradientHeader: {
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  // List View Styles
  listContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: isSmall ? 16 : 20,
  },
  listContent: {
    paddingBottom: 20,
  },

  // Simple Card Styles
  simpleBookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#1e293b',
    marginHorizontal: isSmall ? 0 : 10,
    elevation: 2,
  },
  simpleBookingCardTablet: {
    marginHorizontal: isLarge ? 20 : 0,
  },
  simpleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  simpleCardInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  groundName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  simpleCardStatus: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusTextSimple: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  simpleCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  timeSlotText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
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
    alignItems: 'center',
  },
  detailAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  detailTitleContainer: {
    flex: 1,
  },
  detailPlayerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  detailGroundName: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  detailStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  detailStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
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
  paymentInfo: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paidBadge: {
    backgroundColor: '#DCFCE7',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  contactInfo: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  reasonCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  reasonText: {
    fontSize: 15,
    color: '#92400E',
    lineHeight: 22,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  cancelRejectButton: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rejectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  rejectInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  rejectActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  confirmRejectButton: {
    backgroundColor: '#EF4444',
  },
  rejectActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty States
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
  addGroundButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  addGroundText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Status Containers
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default BookingRequests;