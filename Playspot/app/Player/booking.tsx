import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { BookingSkeleton } from '../../components/ui/BookingSkeleton';
import { auth, db } from '../../firebaseconfig';
const { width } = Dimensions.get('window');

export default function BookingScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  const params = useLocalSearchParams();
  
  const groundId = params.groundId as string;
  const groundName = params.groundName as string;
  const groundPrice = params.groundPrice as string;
  const groundAvailability = params.groundAvailability as string;
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [ownerId, setOwnerId] = useState(''); // Added ownerId state
  const [availability, setAvailability] = useState<{ [key: string]: string[] }>({});
  const [groundData, setGroundData] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user data and set up real-time listeners for ground and bookings
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          // Fetch user data
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserData(userData);
            setUserName(userData.name || user.displayName || 'User');
          } else {
            setUserName(user.displayName || 'User');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserName(user.displayName || 'User');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    let groundUnsub: () => void;
    let bookingsUnsub: () => void;

    if (groundId) {
      // Set up real-time listener for ground data
      groundUnsub = onSnapshot(doc(db, 'grounds', groundId), (doc: any) => {
        if (doc.exists()) {
          const data = doc.data();
          setGroundData(data);
          setOwnerId(data.ownerId || '');
        }
      });

      // Set up real-time listener for bookings
      const bookingsQuery = query(collection(db, 'bookings'), where('groundId', '==', groundId), where('status', 'in', ['confirmed', 'pending']));
      bookingsUnsub = onSnapshot(bookingsQuery, (snapshot: any) => {
        const bookingsData = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
        setBookings(bookingsData);
      });
    }

    return () => {
      if (groundUnsub) groundUnsub();
      if (bookingsUnsub) bookingsUnsub();
    };
  }, [user, groundId]);

  // Calculate availability based on ground data and bookings
  useEffect(() => {
    if (groundData) {
      let avail = groundData.availability || {};
      if (Object.keys(avail).length === 0) {
        // Fallback to param if Firestore availability is empty
        try {
          avail = groundAvailability ? JSON.parse(groundAvailability) : {};
        } catch (e) {
          console.error('Error parsing availability:', e);
          avail = {};
        }
      }

      // Create bookedSlots keyed by date string
      const bookedSlotsByDate: { [date: string]: string[] } = {};
      bookings.forEach(booking => {
        const dateStr = booking.date;
        if (!bookedSlotsByDate[dateStr]) bookedSlotsByDate[dateStr] = [];
        bookedSlotsByDate[dateStr].push(booking.time);
      });

      // For next 7 days, map availability by date string filtering out booked times
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = new Date();
      const filteredAvail: { [date: string]: string[] } = {};

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = daysOfWeek[date.getDay()];
        const availableTimes = avail[dayName] || [];
        const bookedTimes = bookedSlotsByDate[dateStr] || [];
        const freeTimes = availableTimes.filter((time: string) => !bookedTimes.includes(time));
        if (freeTimes.length > 0) {
          filteredAvail[dateStr] = freeTimes;
        }
      }

      setAvailability(filteredAvail);
    }
  }, [groundData, bookings, groundAvailability]);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    return {
      date: date.toISOString().split('T')[0],
      formattedDate,
      slots: availability[date.toISOString().split('T')[0]] || [],
    };
  });

  const availableDates = next7Days.filter(d => d.slots.length > 0);
  const times = selectedDate ? (availability[selectedDate] || []) : [];
  
  const pricePerHour = parseInt(groundPrice) || 0;
  const totalPrice = pricePerHour * selectedDuration;

  const handleBookSlot = async () => {
    if (!selectedDate || !selectedTime || !user || !ownerId) return;
    
    setIsBooking(true);
    try {
      const bookingRef = doc(collection(db, 'bookings'));
      
      const bookingData = {
        id: bookingRef.id,
        groundId,
        groundName,
        pricePerHour,
        duration: selectedDuration,
        date: selectedDate,
        time: selectedTime,
        userId: user.uid,
        userEmail: user.email,
        userName: userName,
        status: 'pending',
        createdAt: serverTimestamp(),
        totalAmount: totalPrice,
        paymentStatus: 'pending',
        ownerId: ownerId // Added ownerId to booking data
      };
      
      await setDoc(bookingRef, bookingData);
      
      Toast.show({
        type: 'success',
        text1: 'Booking Request Sent',
        text2: `Your ${selectedDuration} hour slot request at ${groundName} on ${new Date(selectedDate).toLocaleDateString()} at ${selectedTime.replace('-', ' - ')} has been submitted for approval!`
      });
      router.back();
    } catch (error) {
      console.error('Error booking slot:', error);
      Toast.show({
        type: 'error',
        text1: 'Booking Failed',
        text2: 'There was an error processing your booking request. Please try again.'
      });
    } finally {
      setIsBooking(false);
    }
  };

  const getDayColor = (date: string) => {
    if (date === selectedDate) return '#1e293b';
    const day = new Date(date).getDay();
    return day === 0 ? '#e74c3c' : day === 6 ? '#1e293b' : '#2c3e50';
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  if (loading) {
    return <BookingSkeleton />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
    }>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color='#1e293b' />
        </TouchableOpacity>
        <Text style={styles.title}>Request Booking</Text>
      </View>

      {/* User Info Card */}
      {userName && (
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <Ionicons name="person" size={24} color='#1e293b' />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>Booking for: {userName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Ground Info Card */}
      <View style={styles.groundCard}>
        <View style={styles.groundInfo}>
          <Ionicons name="location" size={24} color='#1e293b' />
          <View style={styles.groundDetails}>
            <Text style={styles.groundName}>{groundName}</Text>
            <Text style={styles.groundPrice}>Rs{pricePerHour} / hour</Text>
          </View>
        </View>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar" size={20} color='#1e293b' />
          <Text style={styles.sectionTitle}>Select Date</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.datesContainer}
          contentContainerStyle={styles.datesContent}
        >
          {availableDates.map((day) => (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.dateOption,
                selectedDate === day.date && styles.selectedDateOption,
                { borderLeftColor: getDayColor(day.date) }
              ]}
              onPress={() => setSelectedDate(day.date)}
            >
              <Text style={[
                styles.dateDayText,
                selectedDate === day.date && styles.selectedDateText
              ]}>
                {day.formattedDate.split(' ')[0]}
              </Text>
              <Text style={[
                styles.dateNumberText,
                selectedDate === day.date && styles.selectedDateText
              ]}>
                {day.formattedDate.split(' ')[2]}
              </Text>
              <Text style={[
                styles.dateMonthText,
                selectedDate === day.date && styles.selectedDateText
              ]}>
                {day.formattedDate.split(' ')[1]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Duration Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={20} color='#1e293b' />
          <Text style={styles.sectionTitle}>Select Duration</Text>
        </View>
        <View style={styles.durationContainer}>
          {[1, 2, 3, 4].map((hours) => (
            <TouchableOpacity
              key={hours}
              style={[
                styles.durationOption,
                selectedDuration === hours && styles.selectedDurationOption
              ]}
              onPress={() => setSelectedDuration(hours)}
            >
              <Text style={[
                styles.durationText,
                selectedDuration === hours && styles.selectedDurationText
              ]}>
                {hours} {hours === 1 ? 'hour' : 'hours'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Time Selection */}
      {selectedDate && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={20} color='#1e293b' />
            <Text style={styles.sectionTitle}>Select Time Slots</Text>
          </View>
          <View style={styles.timesContainer}>
            {times.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeOption,
                  selectedTime === time && styles.selectedTimeOption
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Ionicons
                  name={selectedTime === time ? "checkmark-circle" : "time-outline"}
                  size={20}
                  color={selectedTime === time ? "#fff" :'#1e293b'}
                />
                <Text style={[
                  styles.timeText,
                  selectedTime === time && styles.selectedTimeText
                ]}>
                  {time.replace('-', ' - ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Selected Slot Summary */}
      {(selectedDate || selectedTime) && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Selected Slot</Text>
          <View style={styles.summaryDetails}>
            {selectedDate && (
              <View style={styles.summaryItem}>
                <Ionicons name="calendar" size={16} color='#1e293b' />
                <Text style={styles.summaryText}>
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            )}
            {selectedTime && (
              <View style={styles.summaryItem}>
                <Ionicons name="time" size={16} color='#1e293b' />
                <Text style={styles.summaryText}>
                  {selectedTime.replace('-', ' - ')}
                </Text>
              </View>
            )}
            <View style={styles.summaryItem}>
              <Ionicons name="hourglass" size={16} color='#1e293b' />
              <Text style={styles.summaryText}>
                {selectedDuration} {selectedDuration === 1 ? 'hour' : 'hours'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="pricetag" size={16} color='#1e293b' />
              <Text style={[styles.summaryText, {color: '#ff6b00', fontWeight: 'bold'}]}>
                Rs{totalPrice} total
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Book Slot Button */}
      <TouchableOpacity
        style={[
          styles.confirmButton,
          (!selectedDate || !selectedTime) && styles.disabledButton
        ]}
        onPress={handleBookSlot}
        disabled={!selectedDate || !selectedTime || isBooking || !user}
      >
        <Ionicons name="checkmark-circle" size={24} color="#fff" />
        <Text style={styles.confirmButtonText}>
          {isBooking ? 'Requesting...' : (selectedDate && selectedTime ? `Request Booking for Rs${totalPrice}` : 'Select Date & Time')}
        </Text>
      </TouchableOpacity>

      {/* Info Text */}
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle" size={20} color="#1e293b" />
        <Text style={styles.infoText}>
          Your booking request will be sent for approval. The ground owner will confirm or reject your request.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
      backgroundColor: '#fff',
  },
  header: {
        backgroundColor: '#fff',
    padding: 20,
    paddingTop: 5,
    flexDirection: 'row',
    position: 'fixed',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  userCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  groundCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  groundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groundDetails: {
    marginLeft: 15,
  },
  groundName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  groundPrice: {
    fontSize: 16,
    color: '#ff6b00',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  datesContainer: {
    marginHorizontal: -5,
  },
  datesContent: {
    paddingHorizontal: 5,
  },
  dateOption: {
    width: 80,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#2c3e50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedDateOption: {
    backgroundColor: '#1e293b',
    transform: [{ scale: 1.05 }],
  },
  dateDayText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    marginBottom: 4,
  },
  dateNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dateMonthText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedDateText: {
    color: '#fff',
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  durationOption: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    margin: 6,
    minWidth: width * 0.25,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  selectedDurationOption: {
    backgroundColor: '#1e293b',
    borderColor: '#1e293b',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedDurationText: {
    color: '#fff',
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    margin: 6,
    minWidth: width * 0.4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedTimeOption: {
    backgroundColor: '#1e293b',
    borderColor: '#1e293b',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  selectedTimeText: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryDetails: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
    fontWeight: '500',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    margin: 16,
    padding: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#a5b1c2',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1e293b',
  },
  infoText: {
    marginLeft: 10,
    color: '#1e293b',
    fontSize: 14,
    flex: 1,
  },
});
