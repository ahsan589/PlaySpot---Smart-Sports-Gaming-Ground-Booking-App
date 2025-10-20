import HeaderComponent from '@/components/HeaderComponent';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { BookingHistorySkeleton } from '../../../components/ui/BookingHistorySkeleton';
import { auth, db } from '../../../firebaseconfig';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 414;
const isLargeDevice = width >= 414;
const isTablet = width > 768;

// Responsive sizing function
const responsiveSize = (small: number, medium: number, large: number, tablet: number = large) => {
  if (isTablet) return tablet;
  if (isSmallDevice) return small;
  if (isMediumDevice) return medium;
  return large;
};

interface Booking {
  id: string;
  groundId: string;
  groundName: string;
  date: string;
  time: string;
  duration: number;
  pricePerHour: number;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  userId: string;
  userEmail: string;
  userName: string;
  createdAt: any;
  ownerId: string;
  rejectionReason?: string;
}

type FilterType = 'all' | 'confirmed' | 'pending' | 'rejected';

export default function MyBookingsScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const fadeAnim = useState(new Animated.Value(0))[0];
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (user) {
      setupRealtimeListener();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [bookings]);

  const setupRealtimeListener = () => {
    if (!user) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userBookings: Booking[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userBookings.push({
            id: doc.id,
            groundId: data.groundId,
            groundName: data.groundName,
            date: data.date,
            time: data.time,
            duration: data.duration,
            pricePerHour: data.pricePerHour,
            totalAmount: data.totalAmount,
            bookingStatus: data.bookingStatus || data.status || 'pending',
            paymentStatus: data.paymentStatus,
            userId: data.userId,
            userEmail: data.userEmail,
            userName: data.userName,
            createdAt: data.createdAt,
            ownerId: data.ownerId,
            rejectionReason: data.rejectionReason || data.reason // Map both possible fields
          } as Booking);
        });

        // Sort by date (newest first)
        userBookings.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        setBookings(userBookings);
        setLoading(false);
        setRefreshing(false);
      }, (error) => {
        console.error('Error listening to bookings:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load your bookings. Please try again.'
        });
        setLoading(false);
        setRefreshing(false);
      });

      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('Error setting up listener:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to set up real-time updates. Please try again.'
      });
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleProceedToPayment = (booking: Booking) => {
    router.push({
      pathname: '../payment',
      params: {
        bookingId: booking.id,
        groundId: booking.groundId,
        groundName: booking.groundName,
        totalAmount: booking.totalAmount.toString(),
        date: booking.date,
        time: booking.time,
        ownerId: booking.ownerId
      }
    });
  };

  const handleCashPayment = async (bookingId: string) => {
    if (!user) return;

    try {
      setUpdatingPayment(bookingId);

      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      const [groundDoc, ownerDoc] = await Promise.all([
        getDoc(doc(db, 'grounds', booking.groundId)),
        getDoc(doc(db, 'users', booking.ownerId))
      ]);

      const groundData = groundDoc.exists() ? groundDoc.data() : {};
      const ownerData = ownerDoc.exists() ? ownerDoc.data() : {};

      const paymentData = {
        groundId: booking.groundId,
        date: booking.date,
        time: booking.time,
        amount: booking.totalAmount,
        paymentMethod: 'cash',
        transactionId: '',
        screenshotUrl: '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        playerInfo: {
          id: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          phone: user.phoneNumber || ''
        },
        ownerInfo: {
          id: booking.ownerId,
          name: ownerData?.name || '',
          email: ownerData?.email || ''
        },
        groundInfo: {
          name: booking.groundName,
          address: groundData?.address || ''
        }
      };

      await setDoc(doc(db, 'payments', `${booking.groundId}_${booking.date}_${booking.time}_${user.uid}`), paymentData);

      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        paymentStatus: 'cash'
      });

      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, paymentStatus: 'cash' }
            : booking
        )
      );

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Cash payment selected. Owner will confirm receipt.'
      });
    } catch (error) {
      console.error('Error setting cash payment:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to set cash payment. Please try again.'
      });
    } finally {
      setUpdatingPayment(null);
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

  const getStatusConfig = (status: string, isPayment: boolean = false) => {
    if (isPayment) {
      switch (status) {
        case 'paid': return { color: '#10B981', icon: 'checkmark-circle', label: 'Paid Online' };
        case 'cash': return { color: '#3B82F6', icon: 'cash', label: 'Pay with Cash' };
        case 'pending': return { color: '#F59E0B', icon: 'time', label: 'Payment Pending' };
        default: return { color: '#6B7280', icon: 'help-circle', label: status };
      }
    } else {
      switch (status) {
        case 'confirmed': return { color: '#10B981', icon: 'checkmark-done', label: 'Confirmed' };
        case 'cancelled': return { color: '#EF4444', icon: 'close-circle', label: 'Cancelled' };
        case 'rejected': return { color: '#DC2626', icon: 'ban', label: 'Rejected' };
        case 'pending': return { color: '#F59E0B', icon: 'time', label: 'Pending Approval' };
        default: return { color: '#6B7280', icon: 'help-circle', label: status };
      }
    }
  };

  const toggleCardExpansion = (bookingId: string) => {
    setExpandedCard(expandedCard === bookingId ? null : bookingId);
  };

  // Filter bookings based on active filter
  const filteredBookings = bookings.filter(booking => {
    switch (activeFilter) {
      case 'confirmed':
        return booking.bookingStatus === 'confirmed';
      case 'pending':
        return booking.bookingStatus === 'pending';
      case 'rejected':
        return booking.bookingStatus === 'rejected';
      case 'all':
      default:
        return true;
    }
  });

  // Count bookings for each filter
  const bookingCounts = {
    all: bookings.length,
    confirmed: bookings.filter(b => b.bookingStatus === 'confirmed').length,
    pending: bookings.filter(b => b.bookingStatus === 'pending').length,
    rejected: bookings.filter(b => b.bookingStatus === 'rejected').length,
  };

  const FilterTabs = () => {
    const filters: { key: FilterType; label: string; icon: string; activeColor: string }[] = [
      { 
        key: 'all', 
        label: 'All', 
        icon: 'grid', 
        activeColor: '#1a294dff'
      },
      { 
        key: 'confirmed', 
        label: 'Confirmed', 
        icon: 'checkmark-done', 
        activeColor: '#10B981'
      },
      { 
        key: 'pending', 
        label: 'Pending', 
        icon: 'time', 
        activeColor: '#F59E0B'
      },
      { 
        key: 'rejected', 
        label: 'Rejected', 
        icon: 'close-circle', 
        activeColor: '#EF4444'
      },
    ];

    return (
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter.key;
            const count = bookingCounts[filter.key];
            
            return (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  isActive && [
                    styles.filterTabActive,
                    { 
                      backgroundColor: `${filter.activeColor}08`, 
                      borderColor: filter.activeColor,
                      shadowColor: filter.activeColor
                    }
                  ]
                ]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <View style={styles.filterContent}>
                  <View style={[
                    styles.filterIconContainer,
                    isActive && { 
                      backgroundColor: filter.activeColor,
                      transform: [{ scale: 1.1 }]
                    }
                  ]}>
                    <Ionicons 
                      name={filter.icon as any} 
                      size={responsiveSize(14, 15, 16, 17)} 
                      color={isActive ? '#FFFFFF' : '#6B7280'} 
                    />
                  </View>
                  
                  <View style={styles.filterTextContainer}>
                    <Text style={[
                      styles.filterTabText,
                      isActive && [styles.filterTabTextActive, { color: filter.activeColor }]
                    ]}>
                      {filter.label}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.filterBadge,
                    isActive 
                      ? { 
                          backgroundColor: filter.activeColor,
                          transform: [{ scale: 1.1 }]
                        }
                      : { backgroundColor: '#F3F4F6' }
                  ]}>
                    <Text style={[
                      styles.filterBadgeText,
                      isActive ? styles.filterBadgeTextActive : styles.filterBadgeTextInactive
                    ]}>
                      {count}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const EmptyState = ({ type }: { type: FilterType }) => {
    const emptyConfig = {
      all: {
        icon: 'calendar-outline',
        title: 'No Bookings Yet',
        subtitle: 'You haven\'t made any bookings. Start by exploring available grounds.',
        color: '#1a294dff',
        buttonText: 'Explore Grounds',
        onPress: () => router.push('./grounds')
      },
      confirmed: {
        icon: 'checkmark-done-outline',
        title: 'No Confirmed Bookings',
        subtitle: 'You don\'t have any confirmed bookings yet. They will appear here once approved.',
        color: '#10B981',
        buttonText: 'View All Bookings',
        onPress: () => setActiveFilter('all')
      },
      pending: {
        icon: 'time-outline',
        title: 'No Pending Approvals',
        subtitle: 'You don\'t have any bookings waiting for approval. All your requests have been processed.',
        color: '#F59E0B',
        buttonText: 'View All Bookings',
        onPress: () => setActiveFilter('all')
      },
      rejected: {
        icon: 'close-circle-outline',
        title: 'No Rejected Bookings',
        subtitle: 'Great! All your booking requests have been approved.',
        color: '#EF4444',
        buttonText: 'View All Bookings',
        onPress: () => setActiveFilter('all')
      }
    };

    const config = emptyConfig[type];

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIllustration}>
          <View style={[styles.emptyIconContainer, { backgroundColor: `${config.color}08` }]}>
            <Ionicons name={config.icon as any} size={responsiveSize(32, 36, 40, 48)} color={config.color} />
          </View>
        </View>
        <Text style={styles.emptyTitle}>{config.title}</Text>
        <Text style={styles.emptySubtitle}>{config.subtitle}</Text>
        <TouchableOpacity 
          style={[styles.emptyButton, { backgroundColor: config.color }]}
          onPress={config.onPress}
        >
          <Text style={styles.emptyButtonText}>{config.buttonText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <BookingHistorySkeleton />;
  }

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const bookingStatus = getStatusConfig(booking.bookingStatus);
    const paymentStatus = getStatusConfig(booking.paymentStatus, true);
    const isExpanded = expandedCard === booking.id;
    const showPaymentButtons = booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'pending';
    const hasRejectionReason = booking.bookingStatus === 'rejected' && booking.rejectionReason;
    
    return (
      <TouchableOpacity 
        style={styles.bookingCard}
        onPress={() => toggleCardExpansion(booking.id)}
        activeOpacity={0.7}
      >
        {/* Compact View - Always Visible */}
        <View style={styles.compactView}>
          <View style={styles.compactHeader}>
            <View style={styles.compactMainInfo}>
              <Text style={styles.groundName}>{booking.groundName}</Text>
              <Text style={styles.bookingAmount}>Rs{booking.totalAmount}</Text>
            </View>
            <View style={styles.statusIcons}>
              <View style={[styles.statusIcon, { backgroundColor: `${bookingStatus.color}15` }]}>
                <Ionicons name={bookingStatus.icon as any} size={responsiveSize(14, 15, 16)} color={bookingStatus.color} />
              </View>
              <View style={[styles.statusIcon, { backgroundColor: `${paymentStatus.color}15` }]}>
                <Ionicons name={paymentStatus.icon as any} size={responsiveSize(14, 15, 16)} color={paymentStatus.color} />
              </View>
            </View>
          </View>

          <View style={styles.compactDetails}>
            <View style={styles.compactDetailItem}>
              <Ionicons name={"calendar-outline" as any} size={responsiveSize(12, 13, 14)} color="#6B7280" />
              <Text style={styles.compactDetailText}>{formatDate(booking.date)}</Text>
            </View>
            
            <View style={styles.compactDetailItem}>
              <Ionicons name={"time-outline" as any} size={responsiveSize(12, 13, 14)} color="#6B7280" />
              <Text style={styles.compactDetailText}>{booking.time.replace('-', ' to ')}</Text>
            </View>
          </View>

          <View style={styles.compactStatus}>
            <View style={[styles.compactStatusBadge, { backgroundColor: `${bookingStatus.color}15` }]}>
              <Text style={[styles.compactStatusText, { color: bookingStatus.color }]}>
                {bookingStatus.label}
              </Text>
            </View>
            <View style={[styles.compactStatusBadge, { backgroundColor: `${paymentStatus.color}15` }]}>
              <Text style={[styles.compactStatusText, { color: paymentStatus.color }]}>
                {paymentStatus.label}
              </Text>
            </View>
          </View>

          {/* Show rejection reason in compact view if available */}
          {hasRejectionReason && !isExpanded && (
            <View style={styles.compactRejectionContainer}>
              <View style={styles.compactRejectionHeader}>
                <Ionicons name="warning-outline" size={responsiveSize(12, 13, 14)} color="#DC2626" />
                <Text style={styles.compactRejectionTitle}>Rejected: {booking.rejectionReason}</Text>
              </View>
            </View>
          )}

          {/* Payment Buttons - Show only in compact view when not expanded */}
          {showPaymentButtons && !isExpanded && (
            <View style={styles.compactActionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.onlinePaymentButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleProceedToPayment(booking);
                }}
              >
                <Ionicons name={"card" as any} size={responsiveSize(14, 15, 16)} color="#FFF" />
                <Text style={styles.actionButtonText}>Pay Online</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.cashPaymentButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleCashPayment(booking.id);
                }}
                disabled={updatingPayment === booking.id}
              >
                {updatingPayment === booking.id ? (
                  <ActivityIndicator size="small" color="#1e293b" />
                ) : (
                  <>
                    <Ionicons name={"cash" as any} size={responsiveSize(14, 15, 16)} color="#1e293b" />
                    <Text style={[styles.actionButtonText, { color: '#1e293b' }]}>Pay Cash</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Expand/Collapse Indicator */}
          {(showPaymentButtons || hasRejectionReason || booking.bookingStatus === 'pending') && (
            <View style={styles.expandIndicator}>
              <Ionicons 
                name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"} 
                size={responsiveSize(16, 17, 18)} 
                color="#6B7280" 
              />
              <Text style={styles.expandIndicatorText}>
                {isExpanded ? 'Show less' : 'Show more'}
              </Text>
            </View>
          )}
        </View>

        {/* Expanded View - Only shown when card is expanded */}
        {isExpanded && (
          <View style={styles.expandedView}>
            <View style={styles.expandedDetails}>
              <View style={styles.detailItem}>
                <Ionicons name={"hourglass-outline" as any} size={responsiveSize(14, 15, 16)} color="#6B7280" />
                <Text style={styles.detailText}>{booking.duration} hour{booking.duration > 1 ? 's' : ''}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name={"pricetag-outline" as any} size={responsiveSize(14, 15, 16)} color="#6B7280" />
                <Text style={styles.detailText}>Rs{booking.pricePerHour}/hour</Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name={"person-outline" as any} size={responsiveSize(14, 15, 16)} color="#6B7280" />
                <Text style={styles.detailText}>Booked by: {booking.userName}</Text>
              </View>
            </View>

            {/* Rejection Reason - Show in expanded view */}
            {hasRejectionReason && (
              <View style={styles.rejectionContainer}>
                <View style={styles.rejectionHeader}>
                  <Ionicons name="warning-outline" size={responsiveSize(14, 15, 16)} color="#DC2626" />
                  <Text style={styles.rejectionTitle}>Rejection Reason</Text>
                </View>
                <Text style={styles.rejectionReason}>{booking.rejectionReason}</Text>
              </View>
            )}

            {booking.bookingStatus === 'pending' && (
              <View style={styles.pendingApprovalContainer}>
                <Ionicons name="time-outline" size={responsiveSize(16, 17, 18)} color="#F59E0B" />
                <Text style={styles.pendingApprovalText}>
                  Waiting for owner approval. Payment options will be available once confirmed.
                </Text>
              </View>
            )}

            {/* Payment buttons in expanded view */}
            {showPaymentButtons && (
              <View style={styles.expandedActionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.onlinePaymentButton]}
                  onPress={() => handleProceedToPayment(booking)}
                >
                  <Ionicons name={"card" as any} size={responsiveSize(16, 17, 18)} color="#FFF" />
                  <Text style={styles.actionButtonText}>Proceed to Online Payment</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cashPaymentButton]}
                  onPress={() => handleCashPayment(booking.id)}
                  disabled={updatingPayment === booking.id}
                >
                  {updatingPayment === booking.id ? (
                    <ActivityIndicator size="small" color="#1e293b" />
                  ) : (
                    <>
                      <Ionicons name={"cash" as any} size={responsiveSize(16, 17, 18)} color="#1e293b" />
                      <Text style={[styles.actionButtonText, { color: '#1e293b' }]}>Pay with Cash at Venue</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderComponent
        title="My Bookings"
        subtitle="Manage and track your ground bookings"
        iconName="calendar-outline"
      />
    
      {bookings.length === 0 ? (
        <EmptyState type="all" />
      ) : (
        <View style={styles.content}>
          <FilterTabs />
          
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {activeFilter === 'all' ? 'All Bookings' : getStatusConfig(activeFilter).label}
            </Text>
            <Text style={styles.resultsCount}>
              {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
            </Text>
          </View>

          {filteredBookings.length === 0 ? (
            <EmptyState type={activeFilter} />
          ) : (
            <Animated.ScrollView 
              style={[styles.scrollView, { opacity: fadeAnim }]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#1a294dff']}
                  tintColor={'#1a294dff'}
                />
              }
            >
              {filteredBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
              
              <View style={styles.listFooter}>
                <Text style={styles.listFooterText}>
                  {filteredBookings.length === 1 
                    ? '1 booking found' 
                    : `${filteredBookings.length} bookings found`
                  }
                </Text>
              </View>
            </Animated.ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: responsiveSize(12, 14, 16),
    paddingHorizontal: responsiveSize(12, 16, 20),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  filterScrollContent: {
    flexDirection: 'row',
    gap: responsiveSize(8, 10, 12),
    paddingHorizontal: responsiveSize(4, 6, 8),
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsiveSize(10, 11, 12),
    paddingHorizontal: responsiveSize(12, 14, 16),
    borderRadius: responsiveSize(14, 16, 18),
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    minWidth: responsiveSize(80, 90, 100),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  filterTabActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    transform: [{ scale: 1.02 }],
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize(6, 7, 8),
    flex: 1,
    justifyContent: 'center',
  },
  filterIconContainer: {
    width: responsiveSize(28, 30, 32, 34),
    height: responsiveSize(28, 30, 32, 34),
    borderRadius: responsiveSize(14, 15, 16, 17),
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTextContainer: {
    flex: 1,
  },
  filterTabText: {
    fontSize: responsiveSize(12, 13, 14, 15),
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  filterTabTextActive: {
    fontWeight: '700',
  },
  filterBadge: {
    paddingHorizontal: responsiveSize(6, 7, 8),
    paddingVertical: responsiveSize(3, 4, 4),
    borderRadius: responsiveSize(10, 12, 14),
    minWidth: responsiveSize(22, 24, 26),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterBadgeText: {
    fontSize: responsiveSize(10, 11, 12, 13),
    fontWeight: '700',
    textAlign: 'center',
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },
  filterBadgeTextInactive: {
    color: '#6B7280',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveSize(16, 18, 20),
    paddingVertical: responsiveSize(14, 16, 18),
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#F3F4F6',
  },
  resultsTitle: {
    fontSize: responsiveSize(16, 17, 18, 20),
    fontWeight: '700',
    color: '#1F2937',
  },
  resultsCount: {
    fontSize: responsiveSize(13, 14, 15, 16),
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSize(20, 24, 32),
    paddingBottom: responsiveSize(40, 50, 60),
  },
  emptyIllustration: {
    marginBottom: responsiveSize(24, 28, 32),
  },
  emptyIconContainer: {
    width: responsiveSize(90, 100, 120, 140),
    height: responsiveSize(90, 100, 120, 140),
    borderRadius: responsiveSize(45, 50, 60, 70),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emptyTitle: {
    fontSize: responsiveSize(18, 20, 24, 26),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: responsiveSize(6, 8, 10),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: responsiveSize(13, 14, 16, 17),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: responsiveSize(24, 28, 32),
    lineHeight: responsiveSize(18, 20, 24, 26),
    paddingHorizontal: responsiveSize(0, 10, 20),
  },
  emptyButton: {
    paddingHorizontal: responsiveSize(20, 24, 28),
    paddingVertical: responsiveSize(12, 13, 14),
    borderRadius: responsiveSize(10, 12, 14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: responsiveSize(140, 150, 160),
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: responsiveSize(13, 14, 15, 16),
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  listFooter: {
    padding: responsiveSize(16, 18, 20),
    alignItems: 'center',
  },
  listFooterText: {
    fontSize: responsiveSize(12, 13, 14),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  bookingCard: {
    backgroundColor: '#FFF',
    borderRadius: responsiveSize(14, 16, 18),
    marginHorizontal: responsiveSize(12, 16, 20),
    marginBottom: responsiveSize(10, 12, 14),
    padding: responsiveSize(14, 16, 20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginTop: responsiveSize(10, 12, 14),
    borderLeftWidth: 4,
    borderLeftColor: '#1a294dff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  compactView: {},
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: responsiveSize(8, 10, 12),
  },
  compactMainInfo: {
    flex: 1,
  },
  groundName: {
    fontSize: responsiveSize(15, 16, 17, 19),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  bookingAmount: {
    fontSize: responsiveSize(16, 17, 19, 22),
    fontWeight: '800',
    color: '#1e293b',
  },
  statusIcons: {
    flexDirection: 'row',
    gap: responsiveSize(6, 7, 8),
  },
  statusIcon: {
    width: responsiveSize(26, 28, 30, 32),
    height: responsiveSize(26, 28, 30, 32),
    borderRadius: responsiveSize(13, 14, 15, 16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactDetails: {
    flexDirection: width < 400 ? 'column' : 'row',
    gap: responsiveSize(8, 10, 12),
    marginBottom: responsiveSize(8, 10, 12),
  },
  compactDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize(6, 7, 8),
  },
  compactDetailText: {
    fontSize: responsiveSize(12, 13, 14, 15),
    color: '#374151',
  },
  compactStatus: {
    flexDirection: 'row',
    gap: responsiveSize(6, 7, 8),
    marginBottom: responsiveSize(8, 10, 12),
    flexWrap: 'wrap',
  },
  compactStatusBadge: {
    paddingHorizontal: responsiveSize(8, 9, 10),
    paddingVertical: responsiveSize(3, 4, 4),
    borderRadius: responsiveSize(10, 11, 12),
  },
  compactStatusText: {
    fontSize: responsiveSize(10, 11, 12, 13),
    fontWeight: '600',
  },
  compactRejectionContainer: {
    backgroundColor: '#FEF2F2',
    padding: responsiveSize(8, 9, 10),
    borderRadius: responsiveSize(6, 7, 8),
    marginBottom: responsiveSize(8, 9, 10),
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  compactRejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize(4, 5, 6),
  },
  compactRejectionTitle: {
    fontSize: responsiveSize(10, 11, 12, 13),
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },
  compactActionButtons: {
    flexDirection: 'row',
    gap: responsiveSize(8, 9, 10),
    marginBottom: responsiveSize(6, 7, 8),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsiveSize(10, 11, 12),
    borderRadius: responsiveSize(8, 9, 10),
    gap: responsiveSize(6, 7, 8),
    flex: 1,
  },
  onlinePaymentButton: {
    backgroundColor: '#1e293b',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cashPaymentButton: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#1e293b',
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: responsiveSize(12, 13, 14, 15),
    color: '#FFF',
  },
  expandIndicator: {
    alignItems: 'center',
    paddingTop: responsiveSize(6, 7, 8),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: responsiveSize(6, 7, 8),
    flexDirection: 'row',
    justifyContent: 'center',
    gap: responsiveSize(4, 5, 6),
  },
  expandIndicatorText: {
    fontSize: responsiveSize(11, 12, 13, 14),
    color: '#6B7280',
    fontWeight: '500',
  },
  expandedView: {
    paddingTop: responsiveSize(12, 14, 16),
    marginTop: responsiveSize(6, 7, 8),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  expandedDetails: {
    gap: responsiveSize(10, 11, 12),
    marginBottom: responsiveSize(12, 14, 16),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize(10, 11, 12),
  },
  detailText: {
    fontSize: responsiveSize(13, 14, 15, 16),
    color: '#374151',
  },
  rejectionContainer: {
    backgroundColor: '#FEF2F2',
    padding: responsiveSize(12, 14, 16),
    borderRadius: responsiveSize(8, 9, 10),
    marginBottom: responsiveSize(12, 14, 16),
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize(6, 7, 8),
    marginBottom: 6,
  },
  rejectionTitle: {
    fontSize: responsiveSize(13, 14, 15, 16),
    fontWeight: '600',
    color: '#DC2626',
  },
  rejectionReason: {
    fontSize: responsiveSize(12, 13, 14, 15),
    color: '#7F1D1D',
    lineHeight: responsiveSize(16, 18, 20),
  },
  pendingApprovalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize(10, 11, 12),
    backgroundColor: '#FFFBEB',
    padding: responsiveSize(12, 14, 16),
    borderRadius: responsiveSize(10, 11, 12),
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    marginBottom: responsiveSize(12, 14, 16),
  },
  pendingApprovalText: {
    flex: 1,
    fontSize: responsiveSize(12, 13, 14, 15),
    color: '#92400E',
    lineHeight: responsiveSize(16, 18, 20),
  },
  expandedActionButtons: {
    gap: responsiveSize(8, 9, 10),
  },
});