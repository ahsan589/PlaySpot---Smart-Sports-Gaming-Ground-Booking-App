import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import GroundDetailsSkeleton from '../../components/ui/GroundDetailsSkeleton';
import { db } from '../../firebaseconfig';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = 380;

interface GroundDetails {
  id: string;
  name: string;
  address: string;
  price: number;
  amenities: string[];
  description: string;
  contactInfo: string;
  ownerName: string;
  size: string;
  rating: number;
  reviews: number;
  photos?: string[];
  availability?: { [day: string]: string[] };
}

interface Review {
  id: string;
  userName: string;
  comment: string;
  rating: number;
  date: string;
}

// Function to filter out booked slots from availability
const filterBookedSlots = (groundId: string, availability: { [day: string]: string[] }, bookedSlots: { [date: string]: string[] }): { [day: string]: string[] } => {
  const filteredAvailability: { [day: string]: string[] } = {};
  
  const currentDate = new Date().toLocaleDateString('en-CA');
  
  const dayMap: { [key: string]: number } = {
    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
    'Thursday': 4, 'Friday': 5, 'Saturday': 6
  };
  
  for (const day in availability) {
    const availableTimes = availability[day];
    const dayIndex = dayMap[day];
    
    const freeTimes = availableTimes.filter(time => {
      for (const bookedDate in bookedSlots) {
        if (bookedDate >= currentDate) {
          try {
            const bookingDateObj = new Date(bookedDate);
            const bookingDayIndex = bookingDateObj.getDay();
            
            if (bookingDayIndex === dayIndex && bookedSlots[bookedDate].includes(time)) {
              return false;
            }
          } catch (error) {
            console.error('Error processing booking date:', error);
          }
        }
      }
      return true;
    });
    
    if (freeTimes.length > 0) {
      filteredAvailability[day] = freeTimes;
    }
  }
  
  return filteredAvailability;
};

export default function GroundDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [ground, setGround] = useState<GroundDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    fetchGroundDetails();
  }, []);

  const fetchGroundDetails = async () => {
    try {
      if (params.groundId && typeof params.groundId === 'string') {
        const docRef = doc(db, 'grounds', params.groundId);
        const docSnap = await getDoc(docRef);

        let groundData: GroundDetails;
        if (docSnap.exists()) {
          const data = docSnap.data();
          groundData = {
            id: docSnap.id,
            name: data.name || 'Unnamed Ground',
            address: data.address || '',
            price: data.price || 0,
            amenities: data.facilities || [],
            description: data.description || '',
            contactInfo: data.contactInfo || '',
            ownerName: data.ownerName || '',
            size: data.size || '',
            rating: data.rating || 0,
            reviews: data.reviews || 0,
            photos: data.photos || [],
            availability: data.availability || {},
          };
        } else {
          groundData = {
            id: params.groundId as string,
            name: params.groundName as string || 'Unnamed Ground',
            address: params.groundAddress as string || '',
            price: Number(params.groundPrice) || 0,
            amenities: JSON.parse(params.groundAmenities as string) || [],
            description: params.groundDescription as string || '',
            contactInfo: params.groundContactInfo as string || '',
            ownerName: params.groundOwnerName as string || '',
            size: params.groundSize as string || '',
            rating: Number(params.groundRating) || 0,
            reviews: Number(params.groundReviews) || 0,
            photos: JSON.parse(params.groundPhotos as string) || [],
            availability: JSON.parse(params.groundAvailability as string) || {},
          };
        }

        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('groundId', '==', groundData.id),
          where('status', 'in', ['confirmed', 'pending'])
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookedSlots: { [date: string]: string[] } = {};
        bookingsSnapshot.forEach(doc => {
          const data = doc.data();
          const date = data.date;
          const time = data.time;
          const status = data.status;

          if (status === 'confirmed' || status === 'pending') {
            if (!bookedSlots[date]) bookedSlots[date] = [];
            if (!bookedSlots[date].includes(time)) {
              bookedSlots[date].push(time);
            }
          }
        });

        const filteredAvailability = filterBookedSlots(groundData.id, groundData.availability || {}, bookedSlots);
        setGround({ ...groundData, availability: filteredAvailability });
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch ground details');
      setLoading(false);
      console.error(err);
    }
  };

  const handleCall = () => {
    if (ground?.contactInfo) {
      Linking.openURL(`tel:${ground.contactInfo}`);
    }
  };

  const handleBook = () => {
    if (ground) {
      router.push({
        pathname: '/Player/booking',
        params: {
          groundId: ground.id,
          groundName: ground.name,
          groundAddress: ground.address,
          groundPrice: ground.price.toString(),
          groundAmenities: JSON.stringify(ground.amenities),
          groundDescription: ground.description,
          groundContactInfo: ground.contactInfo,
          groundOwnerName: ground.ownerName,
          groundSize: ground.size,
          groundRating: ground.rating.toString(),
          groundReviews: ground.reviews.toString(),
          groundPhotos: JSON.stringify(ground.photos),
          groundAvailability: JSON.stringify(ground.availability),
        },
      });
    }
  };

  const fetchReviews = async () => {
    if (!ground) return;

    setReviewsLoading(true);
    try {
      const reviewsRef = collection(db, 'reviews');
      const q = query(reviewsRef, where('groundId', '==', ground.id));
      const querySnapshot = await getDocs(q);

      const reviewsData: Review[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviewsData.push({
          id: doc.id,
          userName: data.userName || 'Anonymous',
          comment: data.comment || '',
          rating: data.rating || 0,
          date: data.date || new Date().toISOString().split('T')[0],
        });
      });

      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleViewReviews = () => {
    setReviewsModalVisible(true);
    fetchReviews();
  };

  const openImageModal = (index: number = 0) => {
    setModalImageIndex(index);
    setImageModalVisible(true);
  };

  const nextImage = () => {
    if (ground && ground.photos) {
      setModalImageIndex((prevIndex) => 
        prevIndex === ground.photos!.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (ground && ground.photos) {
      setModalImageIndex((prevIndex) => 
        prevIndex === 0 ? ground.photos!.length - 1 : prevIndex - 1
      );
    }
  };

  const handleImageScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / width);
    setActiveImageIndex(newIndex);
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT - 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0, IMAGE_HEIGHT],
    outputRange: [1.2, 1, 0.8],
    extrapolate: 'clamp'
  });

  if (loading) {
    return <GroundDetailsSkeleton />;
  }

  if (error || !ground) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#d32f2f" />
        <Text style={styles.errorText}>{error || 'Ground not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView 
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Enhanced Image Carousel */}
        <View style={styles.imageContainer}>
          {ground.photos && ground.photos.length > 0 ? (
            <>
              <Animated.ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleImageScroll}
                scrollEventThrottle={16}
                style={styles.imageScrollView}
              >
                {ground.photos.map((photo, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Animated.Image 
                      source={{ uri: photo }} 
                      style={[styles.coverImage, { transform: [{ scale: imageScale }] }]}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </Animated.ScrollView>
              
              <LinearGradient
                colors={['transparent', 'transparent', 'rgba(0,0,0,0.3)']}
                style={styles.gradient}
              />
              
              {/* Enhanced Preview Button */}
              <TouchableOpacity 
                style={styles.previewButton}
                onPress={() => openImageModal(0)}
              >
                <Ionicons name="expand" size={18} color="white" />
                <Text style={styles.previewButtonText}>Preview</Text>
              </TouchableOpacity>
              
              {ground.photos.length > 1 && (
                <View style={styles.imagePagination}>
                  {ground.photos.map((_, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.paginationDot, 
                        index === activeImageIndex ? styles.paginationDotActive : {}
                      ]} 
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={64} color="#e1e5e9" />
              <Text style={styles.placeholderText}>No Image Available</Text>
            </View>
          )}
        </View>
        
        {/* Content Area */}
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{ground.name}</Text>
              <View style={styles.priceTag}>
                <Text style={styles.price}>Rs{ground.price}</Text>
                <Text style={styles.perHour}>/hour</Text>
              </View>
            </View>
            
            <View style={styles.ratingContainer}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingBadgeText}>{ground.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.reviewsText}>({ground.reviews} reviews)</Text>
              <TouchableOpacity style={styles.reviewsButton} onPress={handleViewReviews}>
                <Text style={styles.reviewsButtonText}>View All</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Info - Linear Layout */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#64748b" />
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{ground.address}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#64748b" />
              <Text style={styles.infoLabel}>Owner:</Text>
              <Text style={styles.infoValue}>{ground.ownerName}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="resize-outline" size={20} color="#64748b" />
              <Text style={styles.infoLabel}>Size:</Text>
              <Text style={styles.infoValue}>{ground.size}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#64748b" />
              <Text style={styles.infoLabel}>Contact:</Text>
              <TouchableOpacity onPress={handleCall}>
                <Text style={[styles.infoValue, styles.contactText]}>{ground.contactInfo}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this ground</Text>
            <Text style={styles.description}>{ground.description}</Text>
          </View>

          {/* Amenities Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities & Facilities</Text>
            <View style={styles.amenitiesList}>
              {ground.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Availability Section */}
          {ground.availability && Object.keys(ground.availability).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Time Slots</Text>
              <View style={styles.availabilityList}>
                {[
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ].map((day) => {
                  const daySlots = ground.availability?.[day] || [];
                  if (daySlots.length === 0) return null;
                  
                  return (
                    <View key={day} style={styles.availabilityDay}>
                      <Text style={styles.dayLabel}>{day}</Text>
                      <View style={styles.timeSlots}>
                        {daySlots.map((slot, index) => (
                          <Text key={index} style={styles.timeSlotText}>
                            {slot.replace('-', ' - ')}
                          </Text>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Reviews Preview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rating & Reviews</Text>
              {ground.reviews > 0 && (
                <TouchableOpacity style={styles.viewAllButton} onPress={handleViewReviews}>
                  <Text style={styles.viewAllText}>View All</Text>
                  <Ionicons name="chevron-forward" size={16} color='#1e293b' />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.ratingOverview}>
              <View style={styles.ratingCircle}>
                <Text style={styles.ratingNumber}>{ground.rating.toFixed(1)}</Text>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= Math.floor(ground.rating) ? "star" : "star-outline"}
                      size={14}
                      color="#FFD700"
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.ratingSubtitle}>Based on {ground.reviews} reviews</Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Enhanced Sticky Header */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <BlurView intensity={95} tint="light" style={styles.blurHeader}>
          <Text style={styles.stickyHeaderTitle} numberOfLines={1}>{ground.name}</Text>
          <View style={styles.stickyRating}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.stickyRatingText}>{ground.rating.toFixed(1)}</Text>
          </View>
        </BlurView>
      </Animated.View>

      {/* Enhanced Book Button */}
      <View style={styles.bookButtonContainer}>
        <View style={styles.pricePreview}>
          <Text style={styles.pricePreviewText}>Rs{ground.price}</Text>
          <Text style={styles.perHourPreview}>/hour</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
          <Text style={styles.bookButtonText}>Book Now</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity 
            style={styles.imageModalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          
          {ground.photos && (
            <>
              <Image 
                source={{ uri: ground.photos[modalImageIndex] }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
              
              {ground.photos.length > 1 && (
                <>
                  <TouchableOpacity 
                    style={[styles.navButton, styles.prevButton]}
                    onPress={prevImage}
                  >
                    <Ionicons name="chevron-back" size={28} color="white" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.navButton, styles.nextButton]}
                    onPress={nextImage}
                  >
                    <Ionicons name="chevron-forward" size={28} color="white" />
                  </TouchableOpacity>
                  
                  <View style={styles.modalPagination}>
                    <Text style={styles.modalPaginationText}>
                      {modalImageIndex + 1} / {ground.photos.length}
                    </Text>
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </Modal>

      {/* Enhanced Reviews Modal */}
      <Modal
        visible={reviewsModalVisible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setReviewsModalVisible(false)}
      >
        <View style={styles.reviewsModalOverlay}>
          <View style={styles.reviewsModalContent}>
            <View style={styles.reviewsModalHeader}>
              <View>
                <Text style={styles.reviewsModalTitle}>Reviews & Ratings</Text>
                <Text style={styles.reviewsModalSubtitle}>{ground.reviews} reviews</Text>
              </View>
              <TouchableOpacity
                onPress={() => setReviewsModalVisible(false)}
                style={styles.reviewsModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.reviewsModalBody}>
              {reviewsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color='#1e293b'/>
                  <Text style={styles.loadingText}>Loading reviews...</Text>
                </View>
              ) : reviews.length > 0 ? (
                <FlatList
                  data={reviews}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.reviewsList}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewUserInfo}>
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                              {item.userName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View>
                            <Text style={styles.reviewUser}>{item.userName}</Text>
                            <Text style={styles.reviewDate}>{item.date}</Text>
                          </View>
                        </View>
                        <View style={styles.reviewRating}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name={star <= item.rating ? "star" : "star-outline"}
                              size={16}
                              color="#FFD700"
                            />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.reviewComment}>{item.comment}</Text>
                    </View>
                  )}
                />
              ) : (
                <View style={styles.noReviewsContainer}>
                  <Ionicons name="chatbubble-outline" size={64} color="#e1e5e9" />
                  <Text style={styles.noReviewsText}>No reviews yet</Text>
                  <Text style={styles.noReviewsSubtitle}>Be the first to review this ground</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  errorText: {
    color: '#dc2626',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  imageContainer: {
    height: IMAGE_HEIGHT,
    width: '100%',
    position: 'relative',
    backgroundColor: '#1e293b',
  },
  imageWrapper: {
    width: width,
    height: IMAGE_HEIGHT,
  },
  imageScrollView: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  coverImage: {
    width: width,
    height: IMAGE_HEIGHT,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  previewButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  previewButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 6,
    fontSize: 14,
  },
  imagePagination: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: 'white',
    width: 20,
  },
  coverPlaceholder: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  headerSection: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginRight: 16,
    lineHeight: 32,
  },
  priceTag: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  perHour: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fefce8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  ratingBadgeText: {
    color: '#d97706',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  reviewsText: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 12,
  },
  reviewsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reviewsButtonText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  // New linear info section styles
  infoSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  infoLabel: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 12,
    marginRight: 8,
    width: 80,
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    flex: 1,
  },
  contactText: {
    color: '#1e293b',
  },
  section: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#166534',
    marginLeft: 8,
    fontWeight: '500',
  },
  availabilityList: {
    gap: 12,
  },
  availabilityDay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    width: 100,
    marginTop: 4,
  },
  timeSlots: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '500',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    marginBottom: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    marginRight: 2,
  },
  ratingOverview: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  ratingCircle: {
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
  },
  ratingSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 100 : 80,
    zIndex: 10,
  },
  blurHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  stickyHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  stickyRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  stickyRatingText: {
    color: '#1e293b',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  bookButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  pricePreview: {
    flex: 1,
  },
  pricePreviewText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  perHourPreview: {
    fontSize: 14,
    color: '#64748b',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    marginRight: 8,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  modalPagination: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  modalPaginationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  reviewsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  reviewsModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
  },
  reviewsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  reviewsModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  reviewsModalSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  reviewsModalCloseButton: {
    padding: 4,
  },
  reviewsModalBody: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewsList: {
    padding: 20,
  },
  reviewItem: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  reviewUser: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 12,
  },
  noReviewsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noReviewsText: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 16,
    fontWeight: '500',
  },
  noReviewsSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
});