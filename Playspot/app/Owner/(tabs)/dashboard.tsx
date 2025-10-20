// screens/owner/Dashboard.tsx
import { OwnerDashboardSkeleton } from '@/components/ui/OwnerDashboardSkeleton';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, getFirestore, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  LayoutAnimation,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import HeaderComponent from '../../../components/HeaderComponent';
import { auth } from '../../../firebaseconfig';
import { useOwnerAuth } from '../../../hooks/useOwnerAuth';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

// Interfaces
interface UserData {
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  name?: string;
}

interface GroundData {
  id: string;
  name: string;
}

interface BookingData {
  id: string;
  status: "pending" | "confirmed" | "cancelled";
  totalAmount: number;
  createdAt: any;
  paymentStatus: "pending" | "paid" | "failed";
  groundId: string;
}

interface ReviewData {
  id: string;
  rating: number;
  groundId: string;
}

interface PaymentData {
  id: string;
  amount: number;
  status: string;
  createdAt: any;
  groundId: string;
  date: string;
  groundInfo: {
    name: string;
    address: string;
  };
  ownerInfo: {
    id: string;
    name: string;
    email: string;
  };
  playerInfo: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  paymentMethod: string;
  time: string;
  transactionId: string;
  screenshotUrl: string;
  updatedAt: string;
}

// Enhanced Coach Marks Component
interface CoachMarkProps {
  visible: boolean;
  title: string;
  description: string;
  targetPosition: { x: number; y: number; width: number; height: number };
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const CoachMark: React.FC<CoachMarkProps> = ({
  visible,
  title,
  description,
  targetPosition,
  onNext,
  onSkip,
  onBack,
  currentStep,
  totalSteps,
  placement = 'bottom'
}) => {
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.spring(animatedValue, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      animatedValue.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const tooltipStyle = {
    transform: [{
      scale: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
      }),
    }],
    opacity: animatedValue,
  };

  // Calculate tooltip position based on target and placement
  const getTooltipPosition = () => {
    const tooltipWidth = width - 40;
    const tooltipHeight = 180;
    
    switch (placement) {
      case 'top':
        return {
          top: Math.max(targetPosition.y - tooltipHeight - 20, 20),
          left: 20,
        };
      case 'bottom':
      default:
        return {
          top: Math.min(targetPosition.y + targetPosition.height + 20, height - tooltipHeight - 20),
          left: 20,
        };
    }
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={coachMarkStyles.overlay}>
        {/* Animated Spotlight */}
        <View style={coachMarkStyles.spotlightContainer}>
          <Animated.View 
            style={[
              coachMarkStyles.spotlight,
              {
                top: targetPosition.y - 5,
                left: targetPosition.x - 5,
                width: targetPosition.width + 15,
                height: targetPosition.height + 15,
                transform: [{
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                }],
              }
            ]}
          />
        </View>

        {/* Tooltip with smooth animation */}
        <Animated.View 
          style={[
            coachMarkStyles.tooltip,
            tooltipPosition,
            tooltipStyle
          ]}
        >
          {/* Progress indicator */}
          <View style={coachMarkStyles.progressContainer}>
            <View style={coachMarkStyles.progressBackground}>
              <View 
                style={[
                  coachMarkStyles.progressFill,
                  { width: `${((currentStep + 1) / totalSteps) * 100}%` }
                ]} 
              />
            </View>
            <Text style={coachMarkStyles.progressText}>
              {currentStep + 1} of {totalSteps}
            </Text>
          </View>

          <Text style={coachMarkStyles.title}>{title}</Text>
          <Text style={coachMarkStyles.description}>{description}</Text>
          
          <View style={coachMarkStyles.footer}>
            <TouchableOpacity style={coachMarkStyles.skipButton} onPress={onSkip}>
              <Text style={coachMarkStyles.skipButtonText}>Skip Tour</Text>
            </TouchableOpacity>
            
            <View style={coachMarkStyles.navigationButtons}>
              {currentStep > 0 && (
                <TouchableOpacity style={coachMarkStyles.backButton} onPress={onBack}>
                  <Ionicons name="chevron-back" size={20} color="#4F46E5" />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={coachMarkStyles.nextButton} onPress={onNext}>
                <Text style={coachMarkStyles.nextButtonText}>
                  {currentStep === totalSteps - 1 ? 'Get Started' : 'Next'}
                </Text>
                <Ionicons 
                  name={currentStep === totalSteps - 1 ? "checkmark" : "chevron-forward"} 
                  size={20} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const coachMarkStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  spotlightContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.45)'
  },
  spotlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    borderRadius:10,
    marginVertical:40
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    width: width - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    marginVertical:40,
    elevation: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

const OwnerDashboard = () => {
  const { approvalStatus, rejectionReason, loading, user } = useOwnerAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [grounds, setGrounds] = useState<GroundData[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [confirmedBookings, setConfirmedBookings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [showCoachMarks, setShowCoachMarks] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetPositions, setTargetPositions] = useState<Array<{x: number; y: number; width: number; height: number}>>([]);
  const [isMeasuring, setIsMeasuring] = useState(false);

  // Refs for coach marks
  const scrollViewRef = useRef<ScrollView>(null);
  const earningsCardRef = useRef<View>(null);
  const groundsCardRef = useRef<View>(null);
  const bookingsCardRef = useRef<View>(null);
  const ratingCardRef = useRef<View>(null);
  const bookingsActionRef = useRef<View>(null);
  const earningsActionRef = useRef<View>(null);
  const groundsActionRef = useRef<View>(null);
  const complaintsActionRef = useRef<View>(null);
  const recentPaymentsRef = useRef<View>(null);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideUpAnim = useState(new Animated.Value(30))[0];

  const router = useRouter();

  // Enhanced coach marks steps configuration
  const coachMarksSteps = [
    {
      title: "Track Your Earnings 💰", 
      description: "Monitor your total earnings from all confirmed bookings. This updates in real-time as payments come in.",
      ref: earningsCardRef,
      placement: 'bottom' as const,
      scrollOffset: 0,
    },
    {
      title: "Manage Your Grounds 🏟️",
      description: "See how many active grounds you have listed.",
      ref: groundsCardRef,
      placement: 'bottom' as const,
      scrollOffset: 0,
    },
    {
      title: "Booking Performance 📊",
      description: "Track your confirmed bookings. This shows your business growth and customer demand.",
      ref: bookingsCardRef,
      placement: 'bottom' as const,
      scrollOffset: 0,
    },
    {
      title: "Customer Ratings ⭐",
      description: "Your average rating based on customer reviews. Maintain quality service to keep ratings high!",
      ref: ratingCardRef,
      placement: 'bottom' as const,
      scrollOffset: 0,
    },
    {
      title: "Manage Bookings 📅",
      description: "Handle all booking requests here. The red badge shows pending requests that need your attention.",
      ref: bookingsActionRef,
      placement: 'bottom' as const,
      scrollOffset: 200,
    },
    {
      title: "Earnings & Reports 📈", 
      description: "View detailed earnings reports, payment history, and download financial analytics and In cash section click recieve for cash payment confirmation.",
      ref: earningsActionRef,
      placement: 'bottom' as const,
      scrollOffset: 200,
    },
    {
      title: "Ground Management 🏢",
      description: "Add new sports grounds, edit listings, update prices, and manage availability.",
      ref: groundsActionRef,
      placement: 'bottom' as const,
      scrollOffset: 200,
    },
    {
      title: "Complaint Section🛎️",
      description: "Manage and View Complaints.",
      ref: complaintsActionRef,
      placement: 'bottom' as const,
      scrollOffset: 200,
    },
    {
      title: "Payment Tracking 💳",
      description: "Monitor all recent payments with status, amounts, and dates.",
      ref: recentPaymentsRef,
      placement: 'top' as const,
      scrollOffset: 400,
    }
  ];

  // Enhanced measurement with scrolling
  const measureTargets = async (stepIndex: number = currentStep) => {
    setIsMeasuring(true);
    
    // Scroll to the appropriate position first
    const step = coachMarksSteps[stepIndex];
    if (scrollViewRef.current && step.scrollOffset !== undefined) {
      scrollViewRef.current.scrollTo({ y: step.scrollOffset, animated: true });
    }

    // Wait for scroll to complete and UI to settle
    await new Promise(resolve => setTimeout(resolve, 500));

    const measurements: Array<{x: number; y: number; width: number; height: number}> = [];
    let measuredCount = 0;

    const measureStep = (index: number) => {
      if (index >= coachMarksSteps.length) {
        setTargetPositions(measurements);
        setIsMeasuring(false);
        return;
      }

      const stepRef = coachMarksSteps[index].ref;
      if (stepRef.current) {
        stepRef.current.measureInWindow((x, y, width, height) => {
          measurements[index] = { 
            x: Math.max(x, 0), 
            y: Math.max(y, 0), 
            width: Math.max(width, 1), 
            height: Math.max(height, 1) 
          };
          measuredCount++;
          
          if (measuredCount === coachMarksSteps.length) {
            setTargetPositions(measurements);
            setIsMeasuring(false);
          }
        });
      } else {
        // If element not found, use default position
        measurements[index] = { x: width / 2 - 50, y: height / 2 - 50, width: 100, height: 100 };
        measuredCount++;
        
        if (measuredCount === coachMarksSteps.length) {
          setTargetPositions(measurements);
          setIsMeasuring(false);
        }
      }
    };

    // Measure all steps
    coachMarksSteps.forEach((_, index) => measureStep(index));
  };

  // Check if coach marks should be shown
  useEffect(() => {
    const checkCoachMarksStatus = async () => {
      if (approvalStatus === 'approved' && !loading) {
        try {
          const hasSeenCoachMarks = await AsyncStorage.getItem('owner_coach_marks_completed_v2');
          if (!hasSeenCoachMarks) {
            // Wait for dashboard to fully load
            setTimeout(() => {
              startCoachMarks();
            }, 1500);
          }
        } catch (error) {
          console.error('Error checking coach marks status:', error);
        }
      }
    };

    checkCoachMarksStatus();
  }, [approvalStatus, loading]);

  const completeCoachMarks = async () => {
    try {
      await AsyncStorage.setItem('owner_coach_marks_completed_v2', 'true');
      setShowCoachMarks(false);
      setCurrentStep(0);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (error) {
      console.error('Error saving coach marks status:', error);
    }
  };

  const nextStep = async () => {
    if (currentStep < coachMarksSteps.length - 1) {
      const nextStepIndex = currentStep + 1;
      await measureTargets(nextStepIndex);
      setCurrentStep(nextStepIndex);
    } else {
      completeCoachMarks();
    }
  };

  const previousStep = async () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      await measureTargets(prevStepIndex);
      setCurrentStep(prevStepIndex);
    }
  };

  const skipCoachMarks = () => {
    completeCoachMarks();
  };

  const startCoachMarks = async () => {
    setShowCoachMarks(true);
    setCurrentStep(0);
    await measureTargets(0);
  };

  // Calculate earnings from payments
  const calculateEarningsFromPayments = (paymentsData: PaymentData[]) => {
    const paidPayments = paymentsData.filter(payment => payment.status === "paid");
    const earnings = paidPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    return earnings;
  };

  // Fetch owner data when approval status changes to approved
  useEffect(() => {
    if (approvalStatus === 'approved') {
      fetchData();
    } else {
      // Reset data if not approved
      setGrounds([]);
      setBookings([]);
      setReviews([]);
      setPayments([]);
      setTotalEarnings(0);
      setPendingBookings(0);
      setConfirmedBookings(0);
      setAverageRating(0);
    }
  }, [approvalStatus]);

  // Add real-time listeners for immediate updates
  useEffect(() => {
    if (approvalStatus !== 'approved') return;

    const db = getFirestore();
    const user = auth.currentUser;
    if (!user) return;

    // Set up real-time listener for grounds
    const groundsQuery = query(
      collection(db, "grounds"),
      where("ownerId", "==", user.uid)
    );

    const unsubscribeGrounds = onSnapshot(groundsQuery, (snapshot) => {
      const groundsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GroundData[];
      setGrounds(groundsData);

      // When grounds change, fetch updated bookings and reviews
      if (groundsData.length > 0) {
        const groundIds = groundsData.map(ground => ground.id);
        
        // Real-time listener for bookings
        const bookingsQuery = query(
          collection(db, "bookings"),
          where("groundId", "in", groundIds)
        );

        const unsubscribeBookings = onSnapshot(bookingsQuery, (bookingsSnapshot) => {
          const bookingsData = bookingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as BookingData[];

          // Sort by date (newest first)
          bookingsData.sort((a, b) => {
            const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
            return dateB.getTime() - dateA.getTime();
          });

          setBookings(bookingsData);

          // Recalculate booking metrics
          const confirmedBookingsData = bookingsData.filter(
            booking => booking.status === "confirmed"
          );
          
          const pending = bookingsData.filter(booking => booking.status === "pending").length;
          setPendingBookings(pending);
          
          const confirmed = confirmedBookingsData.length;
          setConfirmedBookings(confirmed);
        });

        // Real-time listener for reviews
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("groundId", "in", groundIds)
        );

        const unsubscribeReviews = onSnapshot(reviewsQuery, (reviewsSnapshot) => {
          const reviewsData = reviewsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ReviewData[];

          setReviews(reviewsData);
          
          if (reviewsData.length > 0) {
            const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
            setAverageRating(parseFloat((totalRating / reviewsData.length).toFixed(1)));
          } else {
            setAverageRating(0);
          }
        });

        // Real-time listener for payments
        const paymentsQuery = query(
          collection(db, "payments"),
          where("ownerInfo.id", "==", user.uid)
        );

        const unsubscribePayments = onSnapshot(paymentsQuery, (paymentsSnapshot) => {
          const paymentsData = paymentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as PaymentData[];

          // Sort by date (newest first)
          paymentsData.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB.getTime() - dateA.getTime();
          });

          setPayments(paymentsData);

          // Calculate earnings from payments
          const earnings = calculateEarningsFromPayments(paymentsData);
          setTotalEarnings(earnings);
        });

        return () => {
          unsubscribeBookings();
          unsubscribeReviews();
          unsubscribePayments();
        };
      } else {
        // No grounds, reset all data
        setBookings([]);
        setReviews([]);
        setPayments([]);
        setTotalEarnings(0);
        setPendingBookings(0);
        setConfirmedBookings(0);
        setAverageRating(0);
      }
    }, (error) => {
      console.error("Real-time listener error:", error);
    });

    return () => unsubscribeGrounds();
  }, [approvalStatus]);

  useEffect(() => {
    if (approvalStatus === "approved") {
      // Staggered animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [approvalStatus, bookings, reviews, payments]);

  const fetchData = async () => {
    try {
      const db = getFirestore();
      const user = auth.currentUser;
      if (!user) return;

      // Fetch user data
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as UserData;

        // Only fetch other data if user is approved
        if (userData.approvalStatus === "approved") {
          // Fetch grounds (properties)
          const groundsQuery = query(
            collection(db, "grounds"),
            where("ownerId", "==", user.uid)
          );
          const groundsSnapshot = await getDocs(groundsQuery);
          const groundsData = groundsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as GroundData[];
          setGrounds(groundsData);

          // Fetch bookings for these grounds
          const groundIds = groundsData.map(ground => ground.id);
          if (groundIds.length > 0) {
            const bookingsQuery = query(
              collection(db, "bookings"),
              where("groundId", "in", groundIds)
            );
            const bookingsSnapshot = await getDocs(bookingsQuery);
            const bookingsData = bookingsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as BookingData[];
            
            // Sort by date (newest first)
            bookingsData.sort((a, b) => {
              const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
              const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
              return dateB.getTime() - dateA.getTime();
            });
            
            setBookings(bookingsData);

            // Calculate booking counts
            const confirmedBookingsData = bookingsData.filter(
              booking => booking.status === "confirmed"
            );
            
            const pending = bookingsData.filter(booking => booking.status === "pending").length;
            setPendingBookings(pending);
            
            const confirmed = confirmedBookingsData.length;
            setConfirmedBookings(confirmed);
          } else {
            // Reset counts if no grounds
            setPendingBookings(0);
            setConfirmedBookings(0);
            setBookings([]);
          }

          // Fetch payments
          const paymentsQuery = query(
            collection(db, "payments"),
            where("ownerInfo.id", "==", user.uid)
          );
          const paymentsSnapshot = await getDocs(paymentsQuery);
          const paymentsData = paymentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as PaymentData[];
          
          // Sort by date (newest first)
          paymentsData.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
          
          setPayments(paymentsData);

          // Calculate earnings from payments
          const earnings = calculateEarningsFromPayments(paymentsData);
          setTotalEarnings(earnings);

          // Fetch reviews for these grounds
          if (groundIds.length > 0) {
            const reviewsQuery = query(
              collection(db, "reviews"),
              where("groundId", "in", groundIds)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            const reviewsData = reviewsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as ReviewData[];
            
            setReviews(reviewsData);
            
            // Calculate average rating
            if (reviewsData.length > 0) {
              const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
              setAverageRating(parseFloat((totalRating / reviewsData.length).toFixed(1)));
            } else {
              setAverageRating(0);
            }
          } else {
            setReviews([]);
            setAverageRating(0);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleResubmit = async () => {
    try {
      const db = getFirestore();
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { approvalStatus: "pending" });

      Alert.alert("Resubmitted", "Your account has been resubmitted for admin approval.");
    } catch (error) {
      console.error("Error resubmitting approval:", error);
      Alert.alert("Error", "Failed to resubmit. Try again later.");
    }
  };

  // Navigation handlers
  const navigateToBookings = () => {
    router.push('/Owner/bookings');
  };

  const navigateToEarnings = () => {
    router.push('/Owner/earnings');
  };

  const navigateToProperties = () => {
    router.push('/Owner/grounds');
  };

  const navigateToComplaints = () => {
    router.push('/Owner/complaints');
  };

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return <OwnerDashboardSkeleton />;
  }

  // Handle non-approved accounts
  if (approvalStatus !== "approved") {
    return (
      <View style={styles.container}>
        <HeaderComponent
          title="Dashboard"
          subtitle="Overview of your business performance"
          iconName="speedometer"
        />
        <View style={styles.notApprovedContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#ff9500" />
          <Text style={styles.notApprovedText}>
            {approvalStatus === 'pending'
              ? 'Your account is pending admin approval. You cannot access the dashboard yet.'
              : 'Your account has been rejected. Please contact admin.'}
          </Text>
          {approvalStatus === 'rejected' && rejectionReason && (
            <Text style={styles.rejectionReason}>
              Reason: {rejectionReason}
            </Text>
          )}
          {approvalStatus === 'rejected' && (
            <TouchableOpacity style={styles.resubmitButton} onPress={handleResubmit}>
              <Text style={styles.resubmitButtonText}>Resubmit for Approval</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Handle Approved - Main Dashboard
  return (
    <View style={styles.container}>
      {/* Enhanced Coach Marks */}
      <CoachMark
        visible={!!(showCoachMarks && targetPositions[currentStep] && !isMeasuring)}
        title={coachMarksSteps[currentStep].title}
        description={coachMarksSteps[currentStep].description}
        targetPosition={targetPositions[currentStep] || { x: 0, y: 0, width: 0, height: 0 }}
        onNext={nextStep}
        onSkip={skipCoachMarks}
        onBack={previousStep}
        currentStep={currentStep}
        totalSteps={coachMarksSteps.length}
        placement={coachMarksSteps[currentStep].placement}
      />

      <HeaderComponent
        title="Dashboard"
        subtitle="Overview of your business performance"
        iconName="speedometer"
        showHelp={true}
        onHelpPress={startCoachMarks}
      />
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor={'#4F46E5'}
          />
        }
        scrollEnabled={!showCoachMarks}
      >
        <View style={styles.contentContainer}>
          {/* Compact Performance Overview */}
          <Animated.View 
            style={[
              styles.performanceContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <View style={styles.compactPerformanceGrid}>
              {/* Earnings Card */}
              <View 
                ref={earningsCardRef}
                style={styles.compactPerformanceCard}
              >
                <View style={[styles.compactIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Ionicons name="trending-up" size={20} color="#10B981" />
                </View>
                <View style={styles.compactContent}>
                  <Text style={styles.compactValue}>Rs {totalEarnings.toLocaleString()}</Text>
                  <Text style={styles.compactLabel}>Total Earnings</Text>
                </View>
              </View>

              {/* Grounds Card */}
              <View 
                ref={groundsCardRef}
                style={styles.compactPerformanceCard}
              >
                <View style={[styles.compactIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <Ionicons name="business" size={20} color="#1e293b" />
                </View>
                <View style={styles.compactContent}>
                  <Text style={styles.compactValue}>{grounds.length}</Text>
                  <Text style={styles.compactLabel}>Active Grounds</Text>
                </View>
              </View>

              {/* Bookings Card */}
              <View 
                ref={bookingsCardRef}
                style={styles.compactPerformanceCard}
              >
                <View style={[styles.compactIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <Ionicons name="calendar" size={20} color="#3B82F6" />
                </View>
                <View style={styles.compactContent}>
                  <Text style={styles.compactValue}>{confirmedBookings}</Text>
                  <Text style={styles.compactLabel}>Confirmed Bookings</Text>
                </View>
              </View>

              {/* Rating Card */}
              <View 
                ref={ratingCardRef}
                style={styles.compactPerformanceCard}
              >
                <View style={[styles.compactIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <Ionicons name="star" size={20} color="#F59E0B" />
                </View>
                <View style={styles.compactContent}>
                  <Text style={styles.compactValue}>{averageRating || 'N/A'}</Text>
                  <Text style={styles.compactLabel}>Avg Rating</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View 
            style={[
              styles.quickActionsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {/* Bookings Action */}
              <TouchableOpacity 
                ref={bookingsActionRef}
                style={[styles.quickActionButton, styles.bookingsAction]} 
                onPress={navigateToBookings}
                disabled={showCoachMarks && currentStep !== 5}
              >
                <View style={styles.quickActionIconContainer}>
                  <Ionicons name="calendar" size={24} color="#3B82F6" />
                  {pendingBookings > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{pendingBookings}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.quickActionText}>Bookings</Text>
                <Text style={styles.quickActionSubtext}>Manage bookings</Text>
              </TouchableOpacity>

              {/* Earnings Action */}
              <TouchableOpacity 
                ref={earningsActionRef}
                style={[styles.quickActionButton, styles.earningsAction]} 
                onPress={navigateToEarnings}
                disabled={showCoachMarks && currentStep !== 6}
              >
                <View style={styles.quickActionIconContainer}>
                  <Ionicons name="cash" size={24} color="#10B981" />
                </View>
                <Text style={styles.quickActionText}>Earnings</Text>
                <Text style={styles.quickActionSubtext}>View reports</Text>
              </TouchableOpacity>

              {/* Grounds Action */}
              <TouchableOpacity 
                ref={groundsActionRef}
                style={[styles.quickActionButton, styles.propertiesAction]} 
                onPress={navigateToProperties}
                disabled={showCoachMarks && currentStep !== 7}
              >
                <View style={styles.quickActionIconContainer}>
                  <Ionicons name="business" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.quickActionText}>Grounds</Text>
                <Text style={styles.quickActionSubtext}>Manage listings</Text>
              </TouchableOpacity>

              {/* Complaints Action */}
              <TouchableOpacity 
                ref={complaintsActionRef}
                style={[styles.quickActionButton, styles.complaintsAction]} 
                onPress={navigateToComplaints}
                disabled={showCoachMarks && currentStep !== 8}
              >
                <View style={styles.quickActionIconContainer}>
                  <Ionicons name="alert-circle" size={24} color="#EF4444" />
                </View>
                <Text style={styles.quickActionText}>Complaints</Text>
                <Text style={styles.quickActionSubtext}>View issues</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Recent Payments */}
          <Animated.View 
            style={[
              styles.activityContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Payments</Text>
              <TouchableOpacity onPress={navigateToEarnings}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View 
              ref={recentPaymentsRef}
              style={styles.activityList}
            >
              {payments.slice(0, 4).map((payment: PaymentData, index) => (
                <Animated.View 
                  key={payment.id} 
                  style={[
                    styles.activityItem, 
                    index === payments.slice(0, 4).length - 1 ? styles.activityItemLast : {},
                    { 
                      opacity: fadeAnim,
                      transform: [{ translateY: slideUpAnim }] 
                    }
                  ]}
                >
                  <View style={[styles.activityIcon, { backgroundColor: payment.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
                    <Ionicons 
                      name={payment.status === 'paid' ? "checkmark-circle" : "time"} 
                      size={20} 
                      color={payment.status === 'paid' ? "#10B981" : "#F59E0B"} 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>
                      {payment.groundInfo?.name || 'Ground'} - {payment.time}
                    </Text>
                    <Text style={styles.activityTime}>
                      {formatDate(payment.createdAt)} • {payment.paymentMethod}
                    </Text>
                  </View>
                  <Text style={[styles.activityAmount, { color: payment.status === 'paid' ? '#10B981' : '#F59E0B' }]}>
                    Rs{payment.amount.toLocaleString()}
                  </Text>
                </Animated.View>
              ))}
              
              {payments.length === 0 && (
                <View style={[styles.activityItem, styles.activityItemLast]}>
                  <View style={[styles.activityIcon, { backgroundColor: 'rgba(156, 163, 175, 0.1)' }]}>
                    <Ionicons name="card" size={20} color="#9CA3AF" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>No payments yet</Text>
                    <Text style={styles.activityTime}>Payments will appear here</Text>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Enhanced Help Button */}
      {!showCoachMarks && (
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={startCoachMarks}
        >
          <Ionicons name="help-circle" size={44} color="#e8e8f5ff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  notApprovedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  notApprovedText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  rejectionReason: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  resubmitButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resubmitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  performanceContainer: {
    marginBottom: 20,
  },
  compactPerformanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  compactPerformanceCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  compactLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  bookingsAction: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  earningsAction: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  complaintsAction: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  propertiesAction: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  quickActionIconContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  quickActionSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityItemLast: {
    borderBottomWidth: 0,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  helpButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
});

export default OwnerDashboard;