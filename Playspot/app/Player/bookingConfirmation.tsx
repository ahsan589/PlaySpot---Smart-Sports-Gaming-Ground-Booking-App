import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { OwnerBookingsSkeleton } from '../../components/ui/OwnerBookingsSkeleton';
import { db } from '../../firebaseconfig';

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const { groundId, date, time, price, address, status } = useLocalSearchParams();
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState<any>({});
  const [playerInfo, setPlayerInfo] = useState<any>({});
  const [groundInfo, setGroundInfo] = useState<any>({});

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!groundId || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Ensure params are strings
        const groundIdStr = Array.isArray(groundId) ? groundId[0] : groundId;
        const dateStr = Array.isArray(date) ? date[0] : date;
        const timeStr = Array.isArray(time) ? time[0] : time;
        const priceStr = Array.isArray(price) ? price[0] : price;
        const addressStr = Array.isArray(address) ? address[0] : address;
        const statusStr = Array.isArray(status) ? status[0] : status;

        // Generate booking ID
        const bookingId = `${groundIdStr}_${dateStr}_${timeStr}_${user.uid}`;

        // Local variables for fetched data
        let groundName = 'Unknown Ground';
        let groundAddress = addressStr || '';
        let playerName = user.displayName || 'Unknown Player';
        let playerMobile = user.phoneNumber || '';

        // Fetch ground info
        const groundDoc = await getDoc(doc(db, 'grounds', groundIdStr));
        if (groundDoc.exists()) {
          const groundData = groundDoc.data();
          groundName = groundData.name || groundName;
          groundAddress = addressStr || groundData.address || groundAddress;
        }

        // Fetch player info
        if (user.uid) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            playerName = userData.name || playerName;
            playerMobile = userData.phone || playerMobile;
          }
        }

        // Fetch payment info if exists
        const paymentDoc = await getDoc(doc(db, 'payments', bookingId));
        let paymentData: any = {};
        if (paymentDoc.exists()) {
          paymentData = paymentDoc.data();
        }

        // Set states with fetched data
        setGroundInfo({
          name: groundName,
          address: groundAddress,
        });

        setPlayerInfo({
          name: playerName,
          mobile: playerMobile,
        });

        // Set booking details - only essential info
        setBookingDetails({
          bookingId: `BK${Date.now().toString().slice(-6)}`, // Simple short ID
          groundName,
          date: dateStr,
          time: timeStr,
          amount: `Rs ${priceStr || '0'}`,
          transactionId: paymentData?.transactionId || 'N/A',
          paymentMethod: paymentData?.paymentMethod || 'Online Payment',
          paymentStatus: statusStr || paymentData?.status || 'Completed',
          bookingDate: new Date().toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        });

      } catch (error) {
        console.error('Error fetching booking data:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load booking details'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [groundId, date, time, price, address, status, user]);

  const handleGoToBookings = () => {
    router.push('/Player/(tabs)/bookingHistory');
  };

  const handleGoHome = () => {
    router.push('/Player/(tabs)/grounds');
  };

  if (loading) {
    return <OwnerBookingsSkeleton />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Success Header - Like Payment Apps */}
      <View style={styles.successHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={70} color="#10B981" />
        </View>
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.amount}>{bookingDetails.amount}</Text>
        <Text style={styles.message}>Your booking has been confirmed</Text>
      </View>

      {/* Essential Information Card */}
      <View style={styles.mainCard}>
        {/* Transaction Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{bookingDetails.transactionId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue}>{bookingDetails.bookingId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{bookingDetails.bookingDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{bookingDetails.paymentMethod}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{bookingDetails.paymentStatus}</Text>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ground Name</Text>
            <Text style={styles.detailValue}>{bookingDetails.groundName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking Date</Text>
            <Text style={styles.detailValue}>{bookingDetails.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time Slot</Text>
            <Text style={styles.detailValue}>{bookingDetails.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={[styles.detailValue, styles.addressText]}>{groundInfo.address}</Text>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{playerInfo.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile</Text>
            <Text style={styles.detailValue}>{playerInfo.mobile || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleGoToBookings}>
          <Text style={styles.primaryButtonText}>View My Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>

      {/* Help Section - Minimal */}
      <View style={styles.helpSection}>
        <Text style={styles.helpText}>
          Need help? Contact support: support@sportsapp.com
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1F2937',
  },
  amount: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    color: '#10B981',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 22,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    flexWrap: 'wrap',
  },
  addressText: {
    color: '#4B5563',
    fontSize: 13,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#1E40AF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
});