import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { collection, doc, getDoc, getDocs, getFirestore, query, updateDoc, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { OwnerEarningsSkeleton } from '../../components/ui/OwnerEarningsSkeleton';
import { auth } from '../../firebaseconfig';

const { width } = Dimensions.get('window');

interface PaymentTransaction {
  id: string;
  amount: number;
  date: string;
  time: string;
  status: 'pending' | 'paid';
  paymentMethod: string;
  transactionId: string;
  screenshotUrl: string;
  playerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  groundInfo: {
    name: string;
    address: string;
  };
  createdAt: string;
}

const EarningsTransactions = () => {
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [dailyEarnings, setDailyEarnings] = useState(0);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const receiptRef = useRef<ViewShot>(null);
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Helper function to format date as YYYY-MM-DD
  const formatDate = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Helper function to check if a date string is within the current week
  const isDateInCurrentWeek = useCallback((dateString: string): boolean => {
    if (!dateString) return false;
    const paymentDate = new Date(dateString);
    const today = new Date();
    
    // Start of current week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // End of current week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return paymentDate >= startOfWeek && paymentDate <= endOfWeek;
  }, []);

  // Helper function to check if a date string is within the current month
  const isDateInCurrentMonth = useCallback((dateString: string): boolean => {
    if (!dateString) return false;
    const paymentDate = new Date(dateString);
    const today = new Date();
    
    return paymentDate.getMonth() === today.getMonth() && 
           paymentDate.getFullYear() === today.getFullYear();
  }, []);

  // Helper function to check if a date string is today
  const isDateToday = useCallback((dateString: string): boolean => {
    if (!dateString) return false;
    const paymentDate = new Date(dateString);
    const today = new Date();
    
    return (
      paymentDate.getDate() === today.getDate() &&
      paymentDate.getMonth() === today.getMonth() &&
      paymentDate.getFullYear() === today.getFullYear()
    );
  }, []);

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    try {
      const db = getFirestore();
      const user = auth.currentUser;
      if (!user) return;

      const paymentsRef = collection(db, 'payments');
      const paymentsQuery = query(paymentsRef, where('ownerInfo.id', '==', user.uid));
      const paymentsSnapshot = await getDocs(paymentsQuery);

      const payments: PaymentTransaction[] = [];
      for (const paymentDoc of paymentsSnapshot.docs) {
        const data = paymentDoc.data();

        // Parse the payment id to get booking details
        const [groundId, date, time, playerId] = paymentDoc.id.split('_');

        // Check if booking exists
        const bookingsRef = collection(db, 'bookings');
        const bookingQuery = query(bookingsRef,
          where('userId', '==', playerId),
          where('groundId', '==', groundId),
          where('date', '==', date),
          where('time', '==', time)
        );
        const bookingSnapshot = await getDocs(bookingQuery);

        if (bookingSnapshot.empty) continue; // Skip payments without corresponding bookings

        let playerName = 'Unknown Player';
        let playerEmail = '';
        let playerPhone = '';

        // Try to fetch player data from users collection if playerId exists
        if (playerId) {
          try {
            const playerDoc = await getDoc(doc(db, 'users', playerId));
            if (playerDoc.exists()) {
              const playerData = playerDoc.data() as any;
              playerName = playerData.name || 'Unknown Player';
              playerEmail = playerData.email || '';
              playerPhone = playerData.phone || '';
            }
          } catch (error) {
            console.error('Error fetching player data:', error);
          }
        }

        // If playerInfo exists in payment document, use it as fallback
        if (data.playerInfo && typeof data.playerInfo === 'object') {
          playerName = data.playerInfo.name || playerName;
          playerEmail = data.playerInfo.email || playerEmail;
          playerPhone = data.playerInfo.phone || playerPhone;
        }

        // Final fallbacks for individual fields
        playerName = playerName || data.playerName || 'Unknown Player';
        playerEmail = playerEmail || data.playerEmail || '';
        playerPhone = playerPhone || data.playerPhone || '';

        payments.push({
          id: paymentDoc.id,
          amount: data.amount || 0,
          date: data.date || '',
          time: data.time || '',
          status: (data.status as 'pending' | 'paid') || 'pending',
          paymentMethod: data.paymentMethod || '',
          transactionId: data.transactionId || '',
          screenshotUrl: data.screenshotUrl || '',
          playerInfo: {
            name: playerName,
            email: playerEmail,
            phone: playerPhone,
          },
          groundInfo: {
            name: data.groundInfo?.name || data.groundName || '',
            address: data.groundInfo?.address || data.groundAddress || '',
          },
          createdAt: data.createdAt || data.timestamp || '',
        });
      }

      payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPaymentTransactions(payments);

      const paidPayments = payments.filter(p => p.status === 'paid');
      const pendingPayments = payments.filter(p => p.status === 'pending');

      const total = paidPayments.reduce((sum, p) => sum + p.amount, 0);
      const pending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

      setTotalEarnings(total);
      setPendingEarnings(pending);

      // Use payment creation date (createdAt) for earnings calculations
      const daily = paidPayments
        .filter(p => p.createdAt && isDateToday(p.createdAt))
        .reduce((sum, p) => sum + p.amount, 0);

      const weekly = paidPayments
        .filter(p => p.createdAt && isDateInCurrentWeek(p.createdAt))
        .reduce((sum, p) => sum + p.amount, 0);

      const monthly = paidPayments
        .filter(p => p.createdAt && isDateInCurrentMonth(p.createdAt))
        .reduce((sum, p) => sum + p.amount, 0);

      setDailyEarnings(daily);
      setWeeklyEarnings(weekly);
      setMonthlyEarnings(monthly);

      // Animate when data loads
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  }, [fadeAnim, isDateToday, isDateInCurrentWeek, isDateInCurrentMonth]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  // Memoized filtered transactions
  const filteredTransactions = useMemo(() => {
    return paymentTransactions.filter(transaction => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'cash') return transaction.paymentMethod === 'cash' && transaction.status === 'pending';
      return transaction.status === activeFilter;
    });
  }, [paymentTransactions, activeFilter]);

  // Memoized currency formatter
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Memoized status config
  const getStatusConfig = useCallback((status: string) => {
    switch (status) {
      case 'paid':
        return { color: '#10b981', bgColor: '#ecfdf5', icon: 'checkmark-circle-outline' as const };
      case 'pending':
        return { color: '#f59e0b', bgColor: '#fffbeb', icon: 'time-outline' as const };
      default:
        return { color: '#6b7280', bgColor: '#f3f4f6', icon: 'help-circle-outline' as const };
    }
  }, []);

  // Memoized payment method config
  const getPaymentMethodConfig = useCallback((method: string) => {
    switch (method) {
      case 'jazzcash':
        return { color: '#f15a24', name: 'JazzCash', icon: 'phone-portrait-outline' as const };
      case 'easypaisa':
        return { color: '#2baae1', name: 'EasyPaisa', icon: 'phone-portrait' as const };
      case 'cash':
        return { color: '#10b981', name: 'Cash', icon: 'cash-outline' as const };
      default:
        return { color: '#663399', name: 'Bank Transfer', icon: 'business-outline' as const };
    }
  }, []);

  const shareReceiptImage = useCallback(async () => {
    if (!selectedTransaction || !receiptRef.current) return;

    try {
      const currentRef = receiptRef.current;
      if (!currentRef) return;
      const uri = await currentRef.capture!();
      if (uri) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Receipt',
        });
      }
    } catch (error) {
      console.error('Error sharing receipt image:', error);
    }
  }, [selectedTransaction]);

  const downloadReceipt = useCallback(async () => {
    if (!selectedTransaction || !receiptRef.current) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access media library is required to save the receipt.');
        return;
      }

      const uri = await receiptRef.current!.capture!();
      if (uri) {
        const asset = await MediaLibrary.createAssetAsync(uri);
        const album = await MediaLibrary.getAlbumAsync('CricketApp Receipts');
        if (album) {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
          await MediaLibrary.createAlbumAsync('CricketApp Receipts', asset, false);
        }
        alert('Receipt saved to gallery!');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to save receipt. Please try again.');
    }
  }, [selectedTransaction]);

  const shareTransaction = useCallback(async () => {
    if (!selectedTransaction) return;

    const details = `
Transaction Details
Amount: ${formatCurrency(selectedTransaction.amount)}
Status: ${selectedTransaction.status.toUpperCase()}
Ground: ${selectedTransaction.groundInfo.name}
Player: ${selectedTransaction.playerInfo.name}
Date: ${selectedTransaction.date}
Time: ${selectedTransaction.time}
Payment Method: ${getPaymentMethodConfig(selectedTransaction.paymentMethod).name}
Transaction ID: ${selectedTransaction.transactionId || 'N/A'}
    `.trim();

    try {
      await Share.share({
        message: details,
      });
    } catch (error) {
      console.error('Error sharing transaction:', error);
    }
  }, [selectedTransaction, formatCurrency, getPaymentMethodConfig]);

  const handleReceivePayment = useCallback(async () => {
    if (!selectedTransaction) return;

    try {
      const db = getFirestore();
      // Parse the payment id to get booking details
      const [groundId, date, time, playerId] = selectedTransaction.id.split('_');

      // Find the booking
      const bookingsRef = collection(db, 'bookings');
      const bookingQuery = query(bookingsRef,
        where('userId', '==', playerId),
        where('groundId', '==', groundId),
        where('date', '==', date),
        where('time', '==', time)
      );
      const bookingSnapshot = await getDocs(bookingQuery);

      if (!bookingSnapshot.empty) {
        const bookingDoc = bookingSnapshot.docs[0];
        // Update booking paymentStatus
        await updateDoc(doc(db, 'bookings', bookingDoc.id), {
          paymentStatus: 'paid'
        });
      }

      // Update payment status
      await updateDoc(doc(db, 'payments', selectedTransaction.id), {
        status: 'paid'
      });

      // Refresh data
      fetchEarnings();
      setModalVisible(false);
      alert('Payment received successfully!');
    } catch (error) {
      console.error('Error receiving payment:', error);
      alert('Failed to receive payment. Please try again.');
    }
  }, [selectedTransaction, fetchEarnings]);

  const renderTransactionCard = useCallback(({ item, index }: { item: PaymentTransaction; index: number }) => {
    const statusConfig = getStatusConfig(item.status);
    const methodConfig = getPaymentMethodConfig(item.paymentMethod);

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          }],
        }}
      >
        <TouchableOpacity 
          style={styles.transactionCard}
          onPress={() => {
            setSelectedTransaction(item);
            setModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.transactionHeader}>
            <View style={styles.transactionLeft}>
              <View style={[styles.methodIconContainer, { backgroundColor: `${methodConfig.color}15` }]}>
                <Ionicons name={methodConfig.icon} size={20} color={methodConfig.color} />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.groundName} numberOfLines={1}>
                  {item.groundInfo.name}
                </Text>
                <Text style={styles.playerName}>{item.playerInfo.name}</Text>
                {item.playerInfo.phone && (
                  <Text style={styles.playerPhone}>{item.playerInfo.phone}</Text>
                )}
              </View>
            </View>
            <View style={styles.transactionRight}>
              <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.transactionFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="calendar-outline" size={12} color="#6b7280" />
              <Text style={styles.footerText}>{item.date}</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={12} color="#6b7280" />
              <Text style={styles.footerText}>{item.time}</Text>
            </View>
            <View style={styles.footerItem}>
              <Text style={styles.footerText}>{methodConfig.name}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [fadeAnim, getStatusConfig, getPaymentMethodConfig, formatCurrency]);

  const TransactionModal = useCallback(() => (
    <Modal
      animationType="slide"
      statusBarTranslucent={true}
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        />
        <View style={styles.modalContainer}>
          {/* Header with gradient */}
          <LinearGradient
            colors={["#0f172a", "#1e293b", "#334155"]}
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <View>
                <Text style={styles.modalTitle}>Transaction Details</Text>
                <Text style={styles.modalSubtitle}>Payment information</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ViewShot ref={receiptRef} options={{ format: 'png', quality: 0.9 }}>
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
            {selectedTransaction && (
              <>
                {/* Amount Section */}
                <View style={styles.amountSection}>
                  <Text style={styles.amountLabel}>Total Amount</Text>
                  <Text style={styles.modalAmount}>{formatCurrency(selectedTransaction.amount)}</Text>
                  <View style={[styles.statusBadgeLarge, {
                    backgroundColor: getStatusConfig(selectedTransaction.status).bgColor
                  }]}>
                    <Ionicons
                      name={getStatusConfig(selectedTransaction.status).icon}
                      size={16}
                      color={getStatusConfig(selectedTransaction.status).color}
                    />
                    <Text style={[styles.statusTextLarge, {
                      color: getStatusConfig(selectedTransaction.status).color
                    }]}>
                      {selectedTransaction.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Main Details Grid */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Transaction Information</Text>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="location" size={20} color="#1e293b" />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Ground Name</Text>
                        <Text style={styles.detailValue}>{selectedTransaction.groundInfo.name}</Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="navigate" size={20} color="#10b981" />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Address</Text>
                        <Text style={styles.detailValue}>{selectedTransaction.groundInfo.address}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Player Information */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Player Information</Text>
                  <View style={styles.playerCard}>
                    <View style={styles.playerAvatar}>
                      <Ionicons name="person" size={24} color="#fff" />
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{selectedTransaction.playerInfo.name}</Text>
                      <View style={styles.playerContacts}>
                        <View style={styles.contactItem}>
                          <Ionicons name="mail" size={14} color="#6b7280" />
                          <Text style={styles.contactText}>
                            {selectedTransaction.playerInfo.email || 'No email provided'}
                          </Text>
                        </View>
                        <View style={styles.contactItem}>
                          <Ionicons name="call" size={14} color="#6b7280" />
                          <Text style={styles.contactText}>
                            {selectedTransaction.playerInfo.phone || 'No phone provided'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Date & Time */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Booking Details</Text>
                  <View style={styles.bookingGrid}>
                    <View style={styles.bookingCard}>
                      <Ionicons name="calendar" size={24} color="#f59e0b" />
                      <Text style={styles.bookingLabel}>Date</Text>
                      <Text style={styles.bookingValue}>{selectedTransaction.date}</Text>
                    </View>
                    <View style={styles.bookingCard}>
                      <Ionicons name="time" size={24} color="#ef4444" />
                      <Text style={styles.bookingLabel}>Time</Text>
                      <Text style={styles.bookingValue}>{selectedTransaction.time}</Text>
                    </View>
                  </View>
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Payment Details</Text>
                  <View style={styles.paymentMethodCard}>
                    <View style={[styles.methodIconLarge, {
                      backgroundColor: `${getPaymentMethodConfig(selectedTransaction.paymentMethod).color}15`
                    }]}>
                      <Ionicons
                        name={getPaymentMethodConfig(selectedTransaction.paymentMethod).icon}
                        size={28}
                        color={getPaymentMethodConfig(selectedTransaction.paymentMethod).color}
                      />
                    </View>
                    <View style={styles.paymentMethodInfo}>
                      <Text style={styles.paymentMethodName}>
                        {getPaymentMethodConfig(selectedTransaction.paymentMethod).name}
                      </Text>
                      <Text style={styles.transactionId}>
                        Transaction ID: {selectedTransaction.transactionId || 'Not provided'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Screenshot */}
                {selectedTransaction.screenshotUrl && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Proof</Text>
                    <View style={styles.screenshotContainer}>
                      <Image
                        source={{ uri: selectedTransaction.screenshotUrl }}
                        style={styles.screenshot}
                        resizeMode="cover"
                      />
                      <View style={styles.screenshotOverlay}>
                        <TouchableOpacity style={styles.viewFullButton} onPress={() => setShowFullImage(true)}>
                          <Ionicons name="expand" size={20} color="#fff" />
                          <Text style={styles.viewFullText}>View Full</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  {selectedTransaction.status === 'pending' && selectedTransaction.paymentMethod === 'cash' && (
                    <TouchableOpacity style={styles.receiveButton} onPress={handleReceivePayment}>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.receiveButtonText}>Receive </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.secondaryButton} onPress={shareReceiptImage}>
                    <Ionicons name="share-outline" size={20} color="#1e293b" />
                    <Text style={styles.secondaryButtonText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={shareTransaction}>
                    <Ionicons name="share-social-outline" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>Social</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
          </ViewShot>
        </View>
      </View>
    </Modal>
  ), [modalVisible, selectedTransaction, formatCurrency, getStatusConfig, getPaymentMethodConfig, handleReceivePayment, shareReceiptImage, shareTransaction]);

  const StatCard = useCallback(({ title, value, icon, color }: {
    title: string;
    value: number;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: '#fff' }]}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${color}10` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
      </View>
      <Text style={styles.statValue}>{formatCurrency(value)}</Text>
      <Text style={styles.statLabel}>{title}</Text>
      <View style={styles.statTrend}>
        <Ionicons name="arrow-up" size={16} color="#10B981" />
        <Text style={[styles.statTrendText, { color: '#10B981' }]}>
          Updated
        </Text>
      </View>
    </View>
  ), [formatCurrency]);

  // Memoized quick stats data
  const quickStatsData = useMemo(() => ({
    totalTransactions: paymentTransactions.length,
    completedTransactions: paymentTransactions.filter(t => t.status === 'paid').length,
    pendingTransactions: paymentTransactions.filter(t => t.status === 'pending').length,
  }), [paymentTransactions]);

  if (loading) {
    return <OwnerEarningsSkeleton />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0f172a', '#152752ff']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Earnings Dashboard</Text>
            <Text style={styles.headerSubtitle}>Track your revenue and payments</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="trending-up" size={32} color="#fff" />
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons 
            name="stats-chart" 
            size={20} 
            color={activeTab === 'overview' ? '#1e293b' : '#9ca3af'} 
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
          onPress={() => setActiveTab('transactions')}
        >
          <Ionicons 
            name="list" 
            size={20} 
            color={activeTab === 'transactions' ? '#1e293b' : '#9ca3af'} 
          />
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
            Transactions
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' ? (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Earnings"
                value={totalEarnings}
                icon="wallet-outline"
                color="#10b981"
              />
              <StatCard
                title="Today"
                value={dailyEarnings}
                icon="today-outline"
                color="#3b82f6"
              />
              <StatCard
                title="Weekly"
                value={weeklyEarnings}
                icon="calendar-outline"
                color="#f59e0b"
              />
              <StatCard
                title="Pending"
                value={pendingEarnings}
                icon="time-outline"
                color="#ef4444"
              />
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{quickStatsData.totalTransactions}</Text>
                <Text style={styles.quickStatLabel}>Total Transactions</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>
                  {quickStatsData.completedTransactions}
                </Text>
                <Text style={styles.quickStatLabel}>Completed</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>
                  {quickStatsData.pendingTransactions}
                </Text>
                <Text style={styles.quickStatLabel}>Pending</Text>
              </View>
            </View>
          </>
        ) : (
          /* Transactions Tab */
          <View style={styles.transactionsTab}>
            {/* Filter Buttons */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterScrollView}
            >
              <View style={styles.filterContainer}>
                {['all', 'cash', 'paid', 'pending'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterButton,
                      activeFilter === filter && styles.activeFilterButton
                    ]}
                    onPress={() => setActiveFilter(filter)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      activeFilter === filter && styles.activeFilterButtonText
                    ]}>
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Transactions List */}
            <View style={styles.transactionsList}>
              {filteredTransactions.length > 0 ? (
                <FlatList
                  data={filteredTransactions}
                  renderItem={renderTransactionCard}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.listContainer}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="receipt-outline" size={64} color="#e5e7eb" />
                  <Text style={styles.emptyStateTitle}>No transactions found</Text>
                  <Text style={styles.emptyStateText}>
                    {activeFilter !== 'all' 
                      ? `No ${activeFilter} transactions available`
                      : 'You have no transactions yet'
                    }
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <TransactionModal />

      {/* Full Image Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showFullImage}
        statusBarTranslucent={true}
        onRequestClose={() => setShowFullImage(false)}
      >
        <View style={styles.fullImageModalOverlay}>
          <TouchableOpacity
            style={styles.fullImageModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFullImage(false)}
          />
          <View style={styles.fullImageModalContainer}>
            <TouchableOpacity
              style={styles.fullImageCloseButton}
              onPress={() => setShowFullImage(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            {selectedTransaction?.screenshotUrl && (
              <Image
                source={{ uri: selectedTransaction.screenshotUrl }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ... (keep the same styles as before)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 24,
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  headerIcon: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginTop: -20,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#f1f5f9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: width > 600 ? 200 : 140,
    borderRadius: 20,
    padding: width > 600 ? 24 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statTrendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: '#f3f4f6',
  },
  transactionsTab: {
    flex: 1,
  },
  filterScrollView: {
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  activeFilterButton: {
    backgroundColor: '#1e293b',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  transactionsList: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  groundName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  playerName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 2,
  },
  playerPhone: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },

  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 20,
    marginTop: 40,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  modalCloseButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  modalContent: {
    padding: 24,
  },
  amountSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  amountLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  modalAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 16,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8,
  },
  statusTextLarge: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    paddingLeft: 8,
  },
  detailsGrid: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  playerInfo: {
    flex: 1,
  },
  playerContacts: {
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
  },
  bookingGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  bookingCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  bookingLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  bookingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  methodIconLarge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 14,
    color: '#6b7280',
  },
  screenshotContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  screenshot: {
    width: '100%',
    height: 200,
  },
  screenshotOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  viewFullText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 150,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#1e293b',
    fontWeight: '600',
    fontSize: 16,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  receiveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  receiveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  fullImageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  fullImageModalBackdrop: {
    flex: 1,
  },
  fullImageModalContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  fullImageCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});

export default EarningsTransactions;