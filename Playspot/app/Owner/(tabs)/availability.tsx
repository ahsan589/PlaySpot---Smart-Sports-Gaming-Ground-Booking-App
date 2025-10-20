import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import HeaderComponent from '../../../components/HeaderComponent';
import { AvailabilitySkeleton } from '../../../components/ui/AvailabilitySkeleton';
import { auth } from '../../../firebaseconfig';

interface Ground {
  id: string;
  name: string;
  address?: string;
  sportType?: string;
  facilities?: string[];
  availability?: { [day: string]: string[] };
  description?: string;
  venueType?: string;
}

interface UserData {
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

interface Booking {
  id: string;
  groundId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
}

const AvailabilityManagement = () => {
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGround, setSelectedGround] = useState<Ground | null>(null);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [currentDay, setCurrentDay] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotEnd, setNewSlotEnd] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);

  // ✅ Fetch user data (approval status) with real-time updates
  useEffect(() => {
    const db = getFirestore();
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data() as UserData);
      }
    }, (error) => {
      console.error('Error fetching user data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load user data',
      });
    });

    return unsubscribe;
  }, []);

  // ✅ REAL-TIME: Fetch grounds with real-time updates
  useEffect(() => {
    const db = getFirestore();
    const user = auth.currentUser;
    if (!user) return;

    let unsubscribeGrounds: (() => void) | undefined;

    const setupGroundsListener = () => {
      try {
        const groundsRef = collection(db, 'grounds');
        const groundsQuery = query(groundsRef, where('ownerId', '==', user.uid));
        
        unsubscribeGrounds = onSnapshot(groundsQuery, (snapshot) => {
          const groundsData = snapshot.docs.map((doc) => {
            const data = doc.data();
            
            return {
              id: doc.id,
              name: data.name || 'Unnamed Ground',
              address: data.address || 'No address specified',
              sportType: data.facilities?.[0] || data.venueType || 'General',
              facilities: data.facilities || [],
              venueType: data.venueType || 'outdoor',
              description: data.description || '',
              availability: data.availability || {},
            } as Ground;
          });

          console.log('Real-time grounds updated:', groundsData.length);
          setGrounds(groundsData);
          setLoading(false);
        }, (error) => {
          console.error('Error in grounds listener:', error);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to load grounds data',
          });
        });

      } catch (error) {
        console.error('Error setting up grounds listener:', error);
      }
    };

    if (userData?.approvalStatus === 'approved') {
      setupGroundsListener();
    }

    return () => {
      if (unsubscribeGrounds) {
        unsubscribeGrounds();
      }
    };
  }, [userData?.approvalStatus]);

  // ✅ REAL-TIME: Fetch bookings with real-time updates
  useEffect(() => {
    const db = getFirestore();
    const user = auth.currentUser;
    if (!user) return;

    let unsubscribeBookings: (() => void) | undefined;

    const setupBookingsListener = () => {
      try {
        // Get ground IDs first, then set up bookings listener
        const groundsRef = collection(db, 'grounds');
        const groundsQuery = query(groundsRef, where('ownerId', '==', user.uid));
        
        const unsubscribeGroundsForBookings = onSnapshot(groundsQuery, async (groundsSnapshot) => {
          const groundIds = groundsSnapshot.docs.map(doc => doc.id);
          
          if (groundIds.length === 0) {
            setBookings([]);
            return;
          }

          // Set up real-time listener for bookings
          const bookingsRef = collection(db, 'bookings');
          const bookingsQuery = query(
            bookingsRef, 
            where('groundId', 'in', groundIds),
            where('status', 'in', ['confirmed', 'pending'])
          );
          
          if (unsubscribeBookings) {
            unsubscribeBookings();
          }
          
          unsubscribeBookings = onSnapshot(bookingsQuery, (bookingsSnapshot) => {
            const bookingsData = bookingsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Booking[];
            
            setBookings(bookingsData);
            setLoading(false);
          }, (error) => {
            console.error('Error in bookings listener:', error);
            setLoading(false);
          });

        }, (error) => {
          console.error('Error setting up grounds listener for bookings:', error);
          setLoading(false);
        });

        return unsubscribeGroundsForBookings;

      } catch (error) {
        console.error('Error setting up bookings listener:', error);
        setLoading(false);
      }
    };

    if (userData?.approvalStatus === 'approved') {
      setupBookingsListener();
    } else {
      setLoading(false);
    }

    return () => {
      if (unsubscribeBookings) {
        unsubscribeBookings();
      }
    };
  }, [userData?.approvalStatus]);

  const handleGroundPress = (ground: Ground) => {
    setSelectedGround(ground);
    setShowDetailModal(true);
  };

  const openAddSlotModal = (day: string) => {
    setCurrentDay(day);
    setNewSlotStart('');
    setNewSlotEnd('');
    setShowAddSlotModal(true);
  };

  const addNewTimeSlot = () => {
    if (!newSlotStart || !newSlotEnd) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter both start and end times',
      });
      return;
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\s?[AP]M)?$/i;
    if (!timeRegex.test(newSlotStart) || !timeRegex.test(newSlotEnd)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter valid time format (e.g., 9:00 AM)',
      });
      return;
    }

    const newSlot = `${newSlotStart}-${newSlotEnd}`;
    
    if (!selectedGround) return;

    // Check if slot already exists
    const currentSlots = selectedGround.availability?.[currentDay] || [];
    if (currentSlots.includes(newSlot)) {
      Toast.show({
        type: 'error',
        text1: 'Duplicate Slot',
        text2: 'This time slot already exists',
      });
      return;
    }

    // Update local state
    setGrounds(prevGrounds => 
      prevGrounds.map(ground => {
        if (ground.id === selectedGround.id) {
          return {
            ...ground,
            availability: {
              ...ground.availability,
              [currentDay]: [...currentSlots, newSlot].sort()
            }
          };
        }
        return ground;
      })
    );

    // Update selected ground in modal
    setSelectedGround(prev => {
      if (!prev) return null;
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [currentDay]: [...currentSlots, newSlot].sort()
        }
      };
    });

    // Reset form and close modal
    setNewSlotStart('');
    setNewSlotEnd('');
    setShowAddSlotModal(false);
    
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Time slot added successfully',
    });
  };

  const saveAvailability = async (groundId: string, availability: { [day: string]: string[] }) => {
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'grounds', groundId), {
        availability: availability,
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Availability updated successfully',
      });
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error saving availability:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update availability',
      });
    }
  };

  const removeTimeSlot = (day: string, slot: string) => {
    if (!selectedGround) return;

    // Check if slot is booked
    const isBooked = bookings.some(booking => {
      if (booking.groundId !== selectedGround.id || booking.status !== 'confirmed') 
        return false;

      try {
        const bookingDate = new Date(booking.date);
        const now = new Date();

        // Only consider future bookings
        if (bookingDate <= now) return false;

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const bookingDay = dayNames[bookingDate.getDay()];

        return bookingDay === day && booking.time === slot;
      } catch (error) {
        console.error('Error processing booking date:', error);
        return false;
      }
    });

    if (isBooked) {
      Toast.show({
        type: 'info',
        text1: 'Slot Booked',
        text2: 'This slot is already booked and cannot be removed',
      });
      return;
    }

    // Update local state
    setGrounds(prevGrounds => 
      prevGrounds.map(ground => {
        if (ground.id === selectedGround.id) {
          return {
            ...ground,
            availability: {
              ...ground.availability,
              [day]: ground.availability?.[day]?.filter(s => s !== slot) || []
            }
          };
        }
        return ground;
      })
    );

    // Update selected ground in modal
    setSelectedGround(prev => {
      if (!prev) return null;
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [day]: prev.availability?.[day]?.filter(s => s !== slot) || []
        }
      };
    });

    Toast.show({
      type: 'success',
      text1: 'Slot Removed',
      text2: 'Time slot removed from availability',
    });
  };

  const getTotalSlots = (ground: Ground) => {
    return Object.keys(ground.availability || {}).reduce((total, day) => 
      total + (ground.availability?.[day]?.length || 0), 0
    );
  };

  const getAvailableDays = (ground: Ground) => {
    return Object.keys(ground.availability || {}).filter(day => 
      (ground.availability?.[day]?.length || 0) > 0
    ).length;
  };

  // ✅ Handle loading state
  if (loading) {
    return <AvailabilitySkeleton />;
  }

  // ✅ Handle pending/rejected states
  if (userData?.approvalStatus !== 'approved') {
    return (
      <View style={styles.container}>
        <HeaderComponent
          title="Availability"
          subtitle="Manage your ground schedule"
          iconName="calendar-outline"
        />
        <View style={styles.statusContainer}>
          {userData?.approvalStatus === 'pending' && (
            <>
              <Ionicons name="time-outline" size={64} color="#FF9800" />
              <Text style={styles.statusTitle}>Pending Approval</Text>
              <Text style={styles.statusText}>
                Your account is pending admin approval. You cannot manage availability yet.
              </Text>
            </>
          )}
          {userData?.approvalStatus === 'rejected' && (
            <>
              <Ionicons name="close-circle-outline" size={64} color="#F44336" />
              <Text style={styles.statusTitle}>Account Rejected</Text>
              <Text style={styles.statusText}>
                Your account was rejected. Reason:{' '}
                {userData?.rejectionReason || 'Not specified'}.
              </Text>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderComponent
        title="Manage Availability"
        subtitle="Select a ground to manage time slots"
        iconName="calendar-outline"
      />
      
      {/* Full Screen Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.fullScreenModal}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Manage Time Slots</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          {selectedGround && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Ground Info Card */}
              <View style={styles.groundInfoCard}>
                <View style={styles.groundHeader}>
                  <Ionicons name="business-outline" size={24} color="#1e293b" />
                  <Text style={styles.groundNameLarge}>{selectedGround.name}</Text>
                </View>
                <View style={styles.groundDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{selectedGround.address || 'No address specified'}</Text>
                  </View>
                  {selectedGround.facilities && selectedGround.facilities.length > 0 && (
                    <View style={styles.detailItem}>
                       <Ionicons name="football-outline" size={14} color="#666" />
                      <Text style={styles.detailText}>
                        Facilities: {selectedGround.facilities.join(', ')}
                      </Text> 
                    </View>
                  )}
                </View>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{getTotalSlots(selectedGround)}</Text>
                    <Text style={styles.statLabel}>Total Slots</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{getAvailableDays(selectedGround)}</Text>
                    <Text style={styles.statLabel}>Active Days</Text>
                  </View>
                </View>
              </View>

              {/* Days List */}
              <View style={styles.daysSection}>
                <Text style={styles.sectionTitle}>Weekly Schedule</Text>
                {[
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ].map((day) => {
                  const availableSlots = selectedGround.availability?.[day] || [];

                  return (
                    <View key={day} style={styles.dayCard}>
                      <View style={styles.dayHeader}>
                        <Text style={styles.dayText}>{day}</Text>
                        <Text style={styles.slotCount}>
                          {availableSlots.length} slot{availableSlots.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      
                      <View style={styles.slotsContainer}>
                        {availableSlots.length > 0 ? (
                          availableSlots.map((slot) => {
                            const isBooked = bookings.some(booking => {
                              if (booking.groundId !== selectedGround.id || booking.status !== 'confirmed') 
                                return false;

                              try {
                                const bookingDate = new Date(booking.date);
                                const now = new Date();
                                if (bookingDate <= now) return false;

                                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                const bookingDay = dayNames[bookingDate.getDay()];
                                return bookingDay === day && booking.time === slot;
                              } catch (error) {
                                return false;
                              }
                            });

                            return (
                              <TouchableOpacity
                                key={slot}
                                style={[styles.slot, isBooked && styles.bookedSlot]}
                                onPress={() => !isBooked && removeTimeSlot(day, slot)}
                              >
                                <View style={styles.slotContent}>
                                  <Ionicons 
                                    name={isBooked ? "lock-closed" : "time"} 
                                    size={16} 
                                    color={isBooked ? "#4CAF50" : "#1e293b"} 
                                  />
                                  <Text style={[styles.slotText, isBooked && styles.bookedSlotText]}>
                                    {slot}
                                  </Text>
                                </View>
                                {!isBooked && (
                                  <Ionicons name="close-circle" size={16} color="#f44336" />
                                )}
                              </TouchableOpacity>
                            );
                          })
                        ) : (
                          <View style={styles.noSlotsContainer}>
                            <Ionicons name="time-outline" size={20} color="#ccc" />
                            <Text style={styles.noSlotsText}>No time slots added</Text>
                          </View>
                        )}
                        
                        <TouchableOpacity
                          style={styles.addSlotButton}
                          onPress={() => openAddSlotModal(day)}
                        >
                          <Ionicons name="add-circle" size={20} color='#1e293b' />
                          <Text style={styles.addSlotText}>Add Time Slot</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  if (selectedGround) {
                    saveAvailability(selectedGround.id, selectedGround.availability || {})
                  }
                }}
              >
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Add Slot Modal */}
      <Modal
        visible={showAddSlotModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setShowAddSlotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addSlotModal}>
            <Text style={styles.addSlotTitle}>Add Time Slot for {currentDay}</Text>
            
            <View style={styles.timeInputContainer}>
              <View style={styles.timeInput}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 9:00 AM"
                  value={newSlotStart}
                  onChangeText={setNewSlotStart}
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.timeInput}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 11:00 AM"
                  value={newSlotEnd}
                  onChangeText={setNewSlotEnd}
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddSlotModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.addButton]}
                onPress={addNewTimeSlot}
              >
                <Text style={styles.addButtonText}>Add Slot</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {grounds.length === 0 ? (
        <View style={styles.noGroundsContainer}>
          <Ionicons name="business-outline" size={64} color="#ccc" />
          <Text style={styles.noGroundsText}>No grounds found</Text>
          <Text style={styles.noGroundsSubtext}>
            You need to add grounds first to manage availability
          </Text>
        </View>
      ) : (
        <FlatList
          data={grounds}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.groundCard}
              onPress={() => handleGroundPress(item)}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleContainer}>
                    <Ionicons name="business-outline" size={20} color="#1e293b" />
                    <Text style={styles.groundName}>{item.name}</Text>
                  </View>
                  <View style={styles.availabilityBadge}>
                    <Text style={styles.badgeText}>
                      {getTotalSlots(item)} slots
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {item.address || 'No address specified'}
                    </Text>
                  </View>
                  
               

                  {item.facilities && item.facilities.length > 0 && (
                    <View style={styles.detailRow}>
                       <Ionicons name="football-outline" size={14} color="#666" />
                      <Text style={styles.detailText} numberOfLines={1}>
                        {item.facilities.slice(0, 2).join(', ')}
                        {item.facilities.length > 2 && ` +${item.facilities.length - 2} more`}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.availabilityPreview}>
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewTitle}>This Week</Text>
                    <Text style={styles.daysActive}>
                      {getAvailableDays(item)}/7 days active
                    </Text>
                  </View>
                  <View style={styles.daysPreview}>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayAbbr, index) => {
                      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                      const dayName = dayNames[index];
                      const hasSlots = (item.availability?.[dayName]?.length || 0) > 0;

                      return (
                        <View key={dayName} style={styles.dayPreview}>
                          <Text style={styles.dayPreviewText}>{dayAbbr}</Text>
                          <View style={[
                            styles.dayIndicator,
                            hasSlots ? styles.availableDay : styles.unavailableDay
                          ]} />
                        </View>
                      );
                    })}
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <Text style={styles.tapToManage}>Tap to manage schedule</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Toast Component */}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  noGroundsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noGroundsText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noGroundsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContainer: { 
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  
  // Enhanced Ground Card Styles
  groundCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#1e293b',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groundName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0a0aff',
    marginLeft: 8,
    flex: 1,
  },
  availabilityBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  availabilityPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  daysActive: {
    fontSize: 12,
    color: '#666',
  },
  daysPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayPreview: {
    alignItems: 'center',
  },
  dayPreviewText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  dayIndicator: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  availableDay: {
    backgroundColor: '#4CAF50',
  },
  unavailableDay: {
    backgroundColor: '#e0e0e0',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  tapToManage: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Full Screen Modal Styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 40,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  backButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSpacer: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  // Ground Info Card in Modal
  groundInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#1e293b',
  },
  groundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groundNameLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 8,
  },
  groundDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },

  // Days Section in Modal
  daysSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  slotCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  slotsContainer: {
    flexDirection: 'column',
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  bookedSlot: {
    backgroundColor: '#e8f5e9',
  },
  slotContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginLeft: 8,
  },
  bookedSlotText: {
    color: '#2e7d32',
  },
  noSlotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  noSlotsText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  addSlotText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    marginLeft: 8,
  },

  // Save Button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  saveButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Add Slot Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  addSlotModal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addSlotTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1e293b',
  },
  timeInputContainer: {
    marginBottom: 20,
  },
  timeInput: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    width: '48%',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addButton: {
    backgroundColor: '#1e293b',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AvailabilityManagement;