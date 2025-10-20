import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Toast from 'react-native-toast-message';
import { GroundsSkeleton } from '../../../components/ui/GroundsSkeleton';
import { db } from '../../../firebaseconfig';

const { width, height } = Dimensions.get('window');

// List of major cities in Pakistan
const PAKISTANI_CITIES = [
  "Islamabad", "Rawalpindi", "Karachi", "Lahore", "Faisalabad", 
  "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala",
  "Bahawalpur", "Sargodha", "Sukkur", "Larkana", "Sheikhupura",
  "Rahim Yar Khan", "Jhang", "Dera Ghazi Khan", "Gujrat", "Sahiwal",
  "Wah Cantonment", "Mardan", "Kasur", "Okara", "Mingora",
  "Nawabshah", "Chiniot", "Kotri", "Kāmoke", "Hafizabad",
  "Sadiqabad", "Mirpur Khas", "Burewala", "Kohat", "Khanewal",
  "Dera Ismail Khan", "Turbat", "Muzaffargarh", "Abbottabad", "Mandi Bahauddin",
  "Shikarpur", "Jacobabad", "Jhelum", "Khanpur", "Khairpur",
  "Khuzdar", "Pakpattan", "Hub", "Daska", "Gojra",
  "Muridke", "Bahawalnagar", "Samundri", "Jaranwala", "Chishtian",
  "Attock", "Vehari", "Kot Abdul Malik", "Ferozewala", "Chakwal",
  "Gujar Khan", "Kamalia", "Umerkot", "Ahmedpur East", "Kot Addu",
  "Wazirabad", "Mansehra", "Layyah", "Mirpur", "Swabi",
  "Chaman", "Taxila", "Nowshera", "Khushab", "Shahdadkot",
  "Mianwali", "Kabal", "Lodhran", "Hasilpur", "Charsadda",
  "Bhakkar", "Badin", "Arifwala", "Ghotki", "Sambrial",
  "Jatoi", "Haroonabad", "Daharki", "Narowal", "Tando Adam",
  "Karak", "Mian Channu", "Tando Allahyar", "Ahmadpur Sial", "Pasrur",
  "Khairpur Mir's", "Chichawatni", "Kamoke", "Hasan Abdal", "Muzaffarabad"
];

interface Ground {
  id: string;
  name: string;
  address: string;
  city: string;
  price: number;
  amenities: string[];
  description: string;
  contactInfo: string;
  ownerName: string;
  size: string;
  rating: number;
  reviews: number;
  photos?: string[];
  facilities: string[];
  status: string;
  latitude: number;
  longitude: number;
  venueType?: 'indoor' | 'outdoor' | 'gaming_arena' | 'sports_complex';
}

interface Review {
  id?: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  groundId: string;
}

// Common cricket ground amenities/facilities
const ALL_AMENITIES = [
  "Parking", "Changing Rooms", "Floodlights", "Cafeteria", "Equipment Rental",
  "Practice Nets", "Scoreboard", "Grass Pitch",
  "Cricket Academy", "Wi-Fi", "Power Backup",
  "Security","Restaurant","Lockers", "Tournament Organization", 
];

// Venue types with labels, icons, and map pin colors
const venueTypes = [
  { 
    value: 'outdoor', 
    label: 'Outdoor', 
    icon: 'sunny-outline',
    pinColor: '#4CAF50', // Green for outdoor
    pinIcon: 'football-outline'
  },
  { 
    value: 'indoor', 
    label: 'Indoor', 
    icon: 'home-outline',
    pinColor: '#2196F3', // Blue for indoor
    pinIcon: 'home-outline'
  },
  { 
    value: 'gaming_arena', 
    label: 'Gaming Arena', 
    icon: 'game-controller-outline',
    pinColor: '#9C27B0', // Purple for gaming
    pinIcon: 'game-controller-outline'
  },
  { 
    value: 'sports_complex', 
    label: 'Sports Complex', 
    icon: 'fitness-outline',
    pinColor: '#FF9800', // Orange for complex
    pinIcon: 'fitness-outline'
  },
];

// Helper functions for venue types
const getVenueTypeDisplayName = (venueType: string): string => {
  const type = venueTypes.find(vt => vt.value === venueType);
  return type ? type.label : 'Unknown';
};

const getVenueTypeIcon = (venueType: string): string => {
  const type = venueTypes.find(vt => vt.value === venueType);
  return type ? type.icon : 'help-outline';
};

const getVenueTypePinColor = (venueType: string): string => {
  const type = venueTypes.find(vt => vt.value === venueType);
  return type ? type.pinColor : '#666666'; // Default gray
};

const getVenueTypePinIcon = (venueType: string): string => {
  const type = venueTypes.find(vt => vt.value === venueType);
  return type ? type.pinIcon : 'location-outline';
};

// Distance calculation using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

const CustomHeader = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  return (
    <LinearGradient
      colors={["#0f172a", "#121c32ff", "#152752ff"] as const}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={headerStyles.header}
    >
      {/* Background Pattern */}
      <View style={headerStyles.backgroundPattern}>
        <View style={headerStyles.patternCircle1} />
        <View style={headerStyles.patternCircle2} />
        <View style={headerStyles.patternDotGrid} />
      </View>

      <View style={headerStyles.headerContent}>
        <View style={headerStyles.textContainer}>
          {/* Main Title with Icon */}
          <View style={headerStyles.titleRow}>
            <Text style={headerStyles.title}>Grounds</Text>
          </View>
          
          {/* Subtitle with animated dots */}
          <View style={headerStyles.subtitleContainer}>
            <Text style={headerStyles.subtitle}>
             Discover top play spots
            </Text>
          </View>
        </View>

        {/* Enhanced User Profile */}
        <TouchableOpacity style={headerStyles.userContainer}>
          <View style={headerStyles.userInfo}>
            <Text style={headerStyles.welcome}>Welcome back</Text>
            <Text style={headerStyles.userName} numberOfLines={1}>
              {user?.displayName || user?.email?.split('@')[0] || 'Player'}
            </Text>
          </View>
          <View style={headerStyles.avatar}>
            {user?.photoURL ? (
              <Image 
                source={{ uri: user.photoURL }} 
                style={headerStyles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={18} color="#fff" />
            )}
            {/* Online Status Indicator */}
            <View style={headerStyles.onlineIndicator} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Border Effect */}
      <View style={headerStyles.bottomGlow} />
    </LinearGradient>
  );
};

const headerStyles = StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  patternCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(96, 165, 250, 0.05)',
  },
  patternDotGrid: {
    position: 'absolute',
    top: '30%',
    right: '20%',
    width: 60,
    height: 60,
    opacity: 0.3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 5,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#cbd5e1',
    fontWeight: '500',
    marginRight: 0,
  },
  animatedDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#60a5fa',
    marginHorizontal: 1,
  },
  dot1: {
    opacity: 0.6,
  },
  dot2: {
    opacity: 0.8,
  },
  dot3: {
    opacity: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
    marginLeft: 6,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  userInfo: {
    marginRight: 10,
    maxWidth: 100,
  },
  welcome: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '500',
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#334155',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: 4,
    backgroundColor: '#60a5fa',
    borderRadius: 2,
    opacity: 0.6,
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
});
// Custom Map Marker Component
const CustomMapMarker = ({ 
  venueType, 
  isSelected,
  onPress 
}: { 
  venueType: string; 
  isSelected: boolean;
  onPress: () => void;
}) => {
  const pinColor = getVenueTypePinColor(venueType);
  const pinIcon = getVenueTypePinIcon(venueType);
  
  return (
    <TouchableOpacity onPress={onPress} style={styles.markerContainer}>
      <View style={[
        styles.markerPin,
        { 
          backgroundColor: pinColor,
          transform: [{ scale: isSelected ? 1.2 : 1 }]
        }
      ]}>
        <Ionicons 
          name={pinIcon as any} 
          size={16} 
          color="white" 
        />
      </View>
      {isSelected && <View style={[styles.markerPulse, { borderColor: pinColor }]} />}
    </TouchableOpacity>
  );
};

// Map Legend Component
const MapLegend = () => {
  return (
    <View style={styles.mapLegend}>
      <Text style={styles.mapLegendTitle}>Venue Types</Text>
      <View style={styles.mapLegendItems}>
        {venueTypes.map((venueType) => (
          <View key={venueType.value} style={styles.mapLegendItem}>
            <View style={[styles.legendColor, { backgroundColor: venueType.pinColor }]}>
              <Ionicons name={venueType.pinIcon as any} size={12} color="white" />
            </View>
            <Text style={styles.legendText}>{venueType.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function GroundsScreen() {
  const router = useRouter();
  const auth = getAuth();
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [filteredGrounds, setFilteredGrounds] = useState<Ground[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedGround, setSelectedGround] = useState<Ground | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isWeb, setIsWeb] = useState(false);

  // Auto-scroll state
  const scrollViewRefs = useRef<Map<string, any>>(new Map());

  // Scroll direction detection
  const lastScrollY = useRef(0);

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const isScrollingDown = currentScrollY > lastScrollY.current;
    lastScrollY.current = currentScrollY;
  };
  
  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [showOnlyOpen, setShowOnlyOpen] = useState(true);
  const [distanceRange, setDistanceRange] = useState<[number, number]>([0, 50]);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(300))[0];
  
  // Available options for filtering
  const [availableAmenities, setAvailableAmenities] = useState<string[]>([]);

  // Rating and Review Modal State
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReviews, setUserReviews] = useState<Review[]>([]);

  // Map and Location States
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [region, setRegion] = useState({
    latitude: 30.3753, // Default to Pakistan center
    longitude: 69.3451,
    latitudeDelta: 12,
    longitudeDelta: 12,
  });
  const [mapReady, setMapReady] = useState(false);
  const [selectedMapGround, setSelectedMapGround] = useState<Ground | null>(null);

  useEffect(() => {
    // Check if running on web
    setIsWeb(Platform.OS === 'web');
    fetchGrounds();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, grounds, priceRange, selectedAmenities, selectedCities, selectedVenueTypes, showOnlyOpen, distanceRange]);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'web') {
      // Web location handling
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                altitude: null,
                accuracy: position.coords.accuracy,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
              },
              timestamp: Date.now(),
            });
            setRegion({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
          },
          (error) => {
            setLocationError(error.message);
            console.log('Location permission denied');
          }
        );
      } else {
        setLocationError('Geolocation is not supported by this browser.');
      }
      return;
    }

    // Mobile location handling
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError('Permission to access location was denied');
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      setLocationError('Error getting location');
      console.error('Error getting location:', error);
    }
  };

  const fetchGrounds = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'grounds'));
      const groundsData: Ground[] = [];
      const amenitiesSet = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Extract city from address if not explicitly provided
        let city = data.city || '';
        if (!city && data.address) {
          // Try to match with known Pakistani cities
          const foundCity = PAKISTANI_CITIES.find(pakCity => 
            data.address.toLowerCase().includes(pakCity.toLowerCase())
          );
          if (foundCity) {
            city = foundCity;
          } else {
            // Fallback: extract the last part of address as city
            const addressParts = data.address.split(',');
            if (addressParts.length > 1) {
              city = addressParts[addressParts.length - 1].trim();
            }
          }
        }
        
        const ground = {
          id: doc.id,
          name: data.name || 'Unnamed Ground',
          address: data.address || '',
          city: city,
          price: data.price || 0,
          amenities: data.facilities || [],
          description: data.description || '',
          contactInfo: data.contactInfo || '',
          ownerName: data.ownerName || '',
          size: data.size || '',
          rating: data.rating || 0,
          reviews: data.reviews || 0,
          photos: data.photos || [],
          facilities: data.facilities || [],
          status: data.status || 'open',
          latitude: data.latitude || 30.3753 + (Math.random() - 0.5) * 0.5,
          longitude: data.longitude || 69.3451 + (Math.random() - 0.5) * 0.5,
          venueType: data.venueType || 'outdoor',
        };
        
        groundsData.push(ground);
        
        // Collect all available amenities from this ground
        ground.amenities.forEach((amenity: string) => amenitiesSet.add(amenity));
      });
      
      setGrounds(groundsData);
      
      // Combine amenities from grounds with our predefined list
      const allAmenities = Array.from(new Set([...ALL_AMENITIES, ...Array.from(amenitiesSet)]));
      setAvailableAmenities(allAmenities.sort());
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch grounds data');
      setLoading(false);
      console.error(err);
    }
  };

  const applyFilters = () => {
    let results = [...grounds];

    // Apply search filter
    if (searchQuery) {
      results = results.filter(ground =>
        ground.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ground.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ground.city && ground.city.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply price filter
    results = results.filter(ground =>
      ground.price >= priceRange[0] && ground.price <= priceRange[1]
    );

    // Apply amenities filter
    if (selectedAmenities.length > 0) {
      results = results.filter(ground =>
        selectedAmenities.every(amenity => ground.amenities.includes(amenity))
      );
    }

    // Apply city filter
    if (selectedCities.length > 0) {
      results = results.filter(ground =>
        selectedCities.includes(ground.city)
      );
    }

    // Apply status filter
    if (showOnlyOpen) {
      results = results.filter(ground => ground.status === 'open');
    }

    // Apply venue type filter
    if (selectedVenueTypes.length > 0) {
      results = results.filter(ground =>
        selectedVenueTypes.includes(ground.venueType || 'outdoor')
      );
    }

    // Apply distance filter
    if (userLocation && distanceRange[1] > 0) {
      results = results.filter(ground => {
        const distance = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          ground.latitude,
          ground.longitude
        );
        return distance >= distanceRange[0] && distance <= distanceRange[1];
      });
    }

    setFilteredGrounds(results);
  };

  const handleGroundPress = (ground: Ground) => {
    router.push({
      pathname: '/Player/groundDetails',
      params: { 
        groundId: ground.id,
        groundName: ground.name,
        groundAddress: ground.address,
        groundCity: ground.city,
        groundPrice: ground.price.toString(),
        groundAmenities: JSON.stringify(ground.amenities),
        groundDescription: ground.description,
        groundContactInfo: ground.contactInfo,
        groundOwnerName: ground.ownerName,
        groundSize: ground.size,
        groundRating: ground.rating.toString(),
        groundReviews: ground.reviews.toString(),
        groundPhotos: JSON.stringify(ground.photos || []),
        groundStatus: ground.status,
        groundLatitude: ground.latitude.toString(),
        groundLongitude: ground.longitude.toString(),
      },
    });
  };

  const openRatingModal = async (ground: Ground) => {
    if (!auth.currentUser) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Required',
        text2: 'Please sign in to rate and review grounds.',
      });
      return;
    }
    
    setSelectedGround(ground);
    setUserRating(0);
    setUserReview('');
    setRatingModalVisible(true);
    
    // Fetch existing reviews for this ground
    try {
      const reviewsRef = collection(db, 'reviews');
      const reviewsQuery = await getDocs(reviewsRef);
      const reviewsData: Review[] = [];
      
      reviewsQuery.forEach((doc) => {
        const data = doc.data();
        if (data.groundId === ground.id) {
          reviewsData.push({
            id: doc.id,
            userId: data.userId,
            userName: data.userName,
            rating: data.rating,
            comment: data.comment,
            createdAt: data.createdAt.toDate(),
            groundId: data.groundId
          });
        }
      });
      
      setUserReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const submitRating = async () => {
    if (!selectedGround || !auth.currentUser || userRating === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a rating before submitting.',
      });
      return;
    }
    
    setSubmittingReview(true);
    
    try {
      const user = auth.currentUser;
      const reviewData: Review = {
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        rating: userRating,
        comment: userReview,
        createdAt: new Date(),
        groundId: selectedGround.id
      };
      
      // Add review to Firestore
      const reviewsRef = collection(db, 'reviews');
      await setDoc(doc(reviewsRef), reviewData);
      
      // Calculate new average rating
      const allReviews = [...userReviews, reviewData];
      const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / allReviews.length;
      
      // Update ground document with new rating and review count
      const groundRef = doc(db, 'grounds', selectedGround.id);
      await updateDoc(groundRef, {
        rating: averageRating,
        reviews: allReviews.length
      });
      
      // Update local state
      setGrounds(prevGrounds => 
        prevGrounds.map(ground => 
          ground.id === selectedGround.id 
            ? { ...ground, rating: averageRating, reviews: allReviews.length }
            : ground
        )
      );
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Your review has been submitted successfully!',
      });
      setRatingModalVisible(false);
      setUserReviews(allReviews);
    } catch (error) {
      console.error('Error submitting review:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit your review. Please try again.',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const toggleCity = (city: string) => {
    if (selectedCities.includes(city)) {
      setSelectedCities(selectedCities.filter(c => c !== city));
    } else {
      setSelectedCities([...selectedCities, city]);
    }
  };

  const toggleVenueType = (venueType: string) => {
    if (selectedVenueTypes.includes(venueType)) {
      setSelectedVenueTypes(selectedVenueTypes.filter(vt => vt !== venueType));
    } else {
      setSelectedVenueTypes([...selectedVenueTypes, venueType]);
    }
  };

  const resetFilters = () => {
    setPriceRange([0, 10000]);
    setSelectedAmenities([]);
    setSelectedCities([]);
    setSelectedVenueTypes([]);
    setShowOnlyOpen(true);
    setDistanceRange([0, 50]);
    setSearchQuery('');
  };

  const showFilters = () => {
    setFiltersVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ]).start();
  };

  const hideFilters = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      })
    ]).start(() => setFiltersVisible(false));
  };

  const renderRatingStars = (rating: number, size: number = 24) => {
    return (
      <View style={styles.ratingStarsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setUserRating(star)}
            disabled={submittingReview}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={size}
              color={star <= rating ? "#FFD700" : "#ccc"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDisplayStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.ratingStarsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= Math.floor(rating) ? "star" : "star-outline"}
            size={size}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  const renderMapMarkers = () => {
    return filteredGrounds.map(ground => (
      <Marker
        key={ground.id}
        coordinate={{
          latitude: ground.latitude,
          longitude: ground.longitude
        }}
        title={ground.name}
        description={`Rs ${ground.price}/hour`}
        onPress={() => setSelectedMapGround(ground)}
      >
        <CustomMapMarker
          venueType={ground.venueType || 'outdoor'}
          isSelected={selectedMapGround?.id === ground.id}
          onPress={() => setSelectedMapGround(ground)}
        />
        <Callout tooltip onPress={() => handleGroundPress(ground)}>
          <View style={styles.customCallout}>
            <View style={styles.calloutHeader}>
              <Text style={styles.calloutTitle} numberOfLines={1}>{ground.name}</Text>
              <View style={styles.calloutRating}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.calloutRatingText}>{ground.rating.toFixed(1)}</Text>
              </View>
            </View>
            <View style={styles.calloutVenueType}>
              <Ionicons 
                name={getVenueTypeIcon(ground.venueType || 'outdoor') as any} 
                size={12} 
                color={getVenueTypePinColor(ground.venueType || 'outdoor')} 
              />
              <Text style={styles.calloutVenueTypeText}>
                {getVenueTypeDisplayName(ground.venueType || 'outdoor')}
              </Text>
            </View>
            <Text style={styles.calloutPrice}>Rs {ground.price}/hour</Text>
            <Text style={styles.calloutAddress} numberOfLines={2}>{ground.address}</Text>
            <View style={styles.calloutStatus}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: ground.status === 'open' ? '#4caf50' : '#f44336' }
              ]} />
              <Text style={styles.calloutStatusText}>
                {ground.status === 'open' ? 'Open' : 'Closed'}
              </Text>
            </View>
            <View style={styles.calloutActions}>
              <TouchableOpacity
                style={styles.calloutButton}
                onPress={() => handleGroundPress(ground)}
              >
                <Text style={styles.calloutButtonText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calloutButton}
                onPress={() => openRatingModal(ground)}
              >
                <Text style={styles.calloutButtonText}>Rate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Callout>
      </Marker>
    ));
  };

// Add image carousel component matching the reference design
const ImageCarousel = ({ photos, groundName }: { photos: string[], groundName: string }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  if (!photos || photos.length === 0) {
    return (
      <View style={styles.noImageContainer}>
        <Ionicons name="location-outline" size={40} color="#ccc" />
        <Text style={styles.noImageText}>No Image</Text>
      </View>
    );
  }

  // Get different images for each position
  const getMainImage = () => {
    // Show the first image as main (no number overlay)
    return photos[0];
  };

  const getBottomLeftImage = () => {
    // Show the second image if available, otherwise fallback to first
    return photos[1] || photos[0];
  };

  const getBottomRightImage = () => {
    // Show the first image for total count indicator
    return photos[0];
  };

  const getTotalImagesDisplay = () => {
    // Show total count of images
    return photos.length;
  };

  return (
    <View style={styles.imageCarouselContainer}>
      {/* Main large image - shows first image (NO number overlay) */}
      <View style={styles.mainImageContainer}>
        <Image
          source={{ uri: getMainImage() }}
          style={styles.mainImage}
          resizeMode="cover"
        />
      </View>

      {/* Bottom section with two smaller images */}
      {photos.length > 1 && (
        <View style={styles.bottomImagesContainer}>
          {/* Left: Different image without number overlay */}
          <View style={styles.bottomImageWrapper}>
            <Image
              source={{ uri: getBottomLeftImage() }}
              style={styles.bottomImage}
              resizeMode="cover"
            />
          </View>

          {/* Right: Total images count indicator */}
          <View style={styles.bottomImageWrapper}>
            <Image
              source={{ uri: getBottomRightImage() }}
              style={styles.bottomImage}
              resizeMode="cover"
            />
            <View style={styles.totalImagesOverlay}>
              <Text style={styles.totalImagesText}>{getTotalImagesDisplay()}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Hidden FlatList for swipe functionality */}
      <FlatList
        ref={flatListRef}
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={() => null}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width * 0.9);
          setActiveIndex(index);
        }}
        style={styles.hiddenFlatList}
      />
    </View>
  );
};

const renderGroundCard = ({ item: ground }: { item: Ground }) => (
  <TouchableOpacity
    style={styles.groundCard}
    onPress={() => handleGroundPress(ground)}
    activeOpacity={0.9}
  >
    {/* Image Section */}
    <View style={styles.cardImageSection}>
      <ImageCarousel photos={ground.photos || []} groundName={ground.name} />

      {/* Status Badge */}
      <View style={[styles.statusBadge,
        { backgroundColor: ground.status === 'open' ? '#0a0b0a71' : '#43363561' }]}>
        <Text style={styles.statusText}>{ground.status === 'open' ? 'OPEN' : 'CLOSED'}</Text>
      </View>
    </View>

    {/* Content Section */}
    <View style={styles.cardContent}>
      {/* Rating section at the top */}
      <TouchableOpacity
        style={styles.ratingContainer}
        onPress={() => openRatingModal(ground)}
        activeOpacity={0.7}
      >
        {renderDisplayStars(ground.rating, 16)}
        <View style={styles.ratingInfo}>
          <Text style={styles.ratingText}>{ground.rating.toFixed(1)}</Text>
          <Text style={styles.reviewsCount}>({ground.reviews})</Text>
        </View>
      </TouchableOpacity>

      {/* Ground name and price below the rating */}
      <View style={styles.namePriceRow}>
        <Text style={styles.groundName} numberOfLines={1}>{ground.name}</Text>
        <Text style={styles.groundPrice}>Rs {ground.price}/hr</Text>
      </View>

      {/* Location */}
      <View style={styles.locationSection}>
        <Ionicons name="location-outline" size={14} color="#666" />
        <Text style={styles.groundAddress} numberOfLines={1}>{ground.city}</Text>
      </View>

      {/* Details Row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Ionicons name={getVenueTypeIcon(ground.venueType || 'outdoor') as any} size={14} color="#666" />
          <Text style={styles.detailText}>{getVenueTypeDisplayName(ground.venueType || 'outdoor')}</Text>
        </View>

        {userLocation && (
          <View style={styles.detailItem}>
            <Ionicons name="navigate-outline" size={14} color="#666" />
            <Text style={styles.detailText}>
              {calculateDistance(
                userLocation.coords.latitude,
                userLocation.coords.longitude,
                ground.latitude,
                ground.longitude
              ).toFixed(1)} km
            </Text>
          </View>
        )}
      </View>

      {/* Amenities */}
      {ground.amenities && ground.amenities.length > 0 && (
        <View style={styles.amenitiesContainer}>
          {ground.amenities.slice(0, 2).map((amenity: string, index: number) => (
            <View key={index} style={styles.amenityChip}>
              <Text style={styles.amenityText} numberOfLines={1}>{amenity}</Text>
            </View>
          ))}
          {ground.amenities.length > 2 && (
            <View style={styles.moreAmenitiesChip}>
              <Text style={styles.moreAmenitiesText}>+{ground.amenities.length - 2}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  </TouchableOpacity>
);

  if (loading) {
    return <GroundsSkeleton />;
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#d32f2f" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchGrounds} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <CustomHeader />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search grounds, locations, or cities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={showFilters}
        >
          <Ionicons name="filter" size={20} color="#fff" />
          {(selectedAmenities.length > 0 || selectedCities.length > 0 || selectedVenueTypes.length > 0) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {selectedAmenities.length + selectedCities.length + selectedVenueTypes.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {(selectedAmenities.length > 0 || selectedCities.length > 0 || searchQuery) && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {searchQuery && (
              <View style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>"{searchQuery}"</Text>
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            {selectedCities.map(city => (
              <View key={city} style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>{city}</Text>
                <TouchableOpacity onPress={() => toggleCity(city)}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
            {selectedAmenities.map(amenity => (
              <View key={amenity} style={styles.activeFilter}>
                <Text style={styles.activeFilterText}>{amenity}</Text>
                <TouchableOpacity onPress={() => toggleAmenity(amenity)}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={resetFilters} style={styles.clearAllButton}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredGrounds.length} {filteredGrounds.length === 1 ? 'Ground' : 'Grounds'} Available
        </Text>
        <TouchableOpacity onPress={() => setShowMap(!showMap)} style={styles.viewToggle}>
          <Text style={styles.viewToggleText}>{showMap ? 'List View' : 'Map View'}</Text>
          <Ionicons name={showMap ? "list" : "map"} size={16} color='#fbfbfbff' />
        </TouchableOpacity>
      </View>

      {/* Map View */}
      {showMap && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={region}
            onRegionChangeComplete={setRegion}
            onMapReady={() => setMapReady(true)}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            toolbarEnabled={true}
          >
            {renderMapMarkers()}
            {userLocation && (
              <Marker
                coordinate={{
                  latitude: userLocation.coords.latitude,
                  longitude: userLocation.coords.longitude
                }}
                title={auth.currentUser?.displayName || auth.currentUser?.email || "Your Location"}
                pinColor="#1e293b"
              />
            )}
          </MapView>
          
          {/* Map Legend */}
          <MapLegend />
          
          {/* Selected Ground Info Card */}
          {selectedMapGround && (
            <View style={styles.selectedGroundCard}>
              <View style={styles.selectedGroundHeader}>
                <Text style={styles.selectedGroundTitle}>{selectedMapGround.name}</Text>
                <TouchableOpacity onPress={() => setSelectedMapGround(null)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.selectedGroundVenueType}>
                <Ionicons 
                  name={getVenueTypeIcon(selectedMapGround.venueType || 'outdoor') as any} 
                  size={14} 
                  color={getVenueTypePinColor(selectedMapGround.venueType || 'outdoor')} 
                />
                <Text style={styles.selectedGroundVenueTypeText}>
                  {getVenueTypeDisplayName(selectedMapGround.venueType || 'outdoor')}
                </Text>
              </View>
              <Text style={styles.selectedGroundPrice}>Rs {selectedMapGround.price}/hour</Text>
              <Text style={styles.selectedGroundAddress}>{selectedMapGround.address}</Text>
              <View style={styles.selectedGroundActions}>
                <TouchableOpacity 
                  style={styles.selectedGroundButton}
                  onPress={() => handleGroundPress(selectedMapGround)}
                >
                  <Text style={styles.selectedGroundButtonText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.selectedGroundButton}
                  onPress={() => openRatingModal(selectedMapGround)}
                >
                  <Text style={styles.selectedGroundButtonText}>Rate</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {!mapReady && (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator size="large" color="#1e293b" />
              <Text style={styles.mapLoadingText}>Loading Map...</Text>
            </View>
          )}
          
          {locationError && (
            <View style={styles.mapErrorOverlay}>
              <Text style={styles.mapErrorText}>{locationError}</Text>
            </View>
          )}
        </View>
      )}

      {/* Grounds List - Single column */}
      {!showMap && (
        <FlatList
          data={filteredGrounds}
          renderItem={renderGroundCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.groundsList}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={styles.noGroundsContainer}>
              <Ionicons name="search-outline" size={64} color="#ccc" />
              <Text style={styles.noGroundsText}>No cricket grounds found</Text>
              <Text style={styles.noGroundsSubText}>Try adjusting your search or filters</Text>
              <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Rating and Review Modal */}
      <Modal
        visible={ratingModalVisible}
        transparent={true}
        animationType="slide"
         statusBarTranslucent={true}
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.ratingModalOverlay}>
          <View style={styles.ratingModalContent}>
            <View style={styles.ratingModalHeader}>
              <Text style={styles.ratingModalTitle}>Rate {selectedGround?.name}</Text>
              <TouchableOpacity 
                onPress={() => setRatingModalVisible(false)}
                style={styles.ratingModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.ratingModalBody}>
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>Your Rating</Text>
                {renderRatingStars(userRating, 32)}
              </View>
              
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Your Review (Optional)</Text>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Share your experience with this ground..."
                  value={userReview}
                  onChangeText={setUserReview}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#999"
                />
              </View>
              
              {userReviews.length > 0 && (
                <View style={styles.existingReviewsSection}>
                  <Text style={styles.existingReviewsTitle}>Recent Reviews</Text>
                  {userReviews.slice(0, 3).map((review, index) => (
                    <View key={index} style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewerName}>{review.userName}</Text>
                        {renderRatingStars(review.rating, 16)}
                      </View>
                      {review.comment && (
                        <Text style={styles.reviewComment}>{review.comment}</Text>
                      )}
                      <Text style={styles.reviewDate}>
                        {review.createdAt.toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
            
            <View style={styles.ratingModalFooter}>
              <TouchableOpacity 
                style={[styles.submitRatingButton, userRating === 0 && styles.submitRatingButtonDisabled]}
                onPress={submitRating}
                disabled={userRating === 0 || submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitRatingButtonText}>
                    Submit Review
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={filtersVisible}
        transparent={true}
         statusBarTranslucent={true}
        animationType="none"
        onRequestClose={hideFilters}
      >
        <TouchableWithoutFeedback onPress={hideFilters}>
          <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>
        
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Grounds</Text>
            <TouchableOpacity onPress={hideFilters} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Price Range (Rs  per hour)</Text>
              <View style={styles.priceRangeDisplay}>
                <Text style={styles.priceRangeText}>Rs {priceRange[0]} - Rs {priceRange[1]}</Text>
              </View>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack} />
                <View style={[styles.sliderRange, { 
                  left: `${(priceRange[0] / 10000) * 100}%`, 
                  width: `${((priceRange[1] - priceRange[0]) / 10000) * 100}%` 
                }]} />
                <View style={[styles.sliderThumb, { left: `${(priceRange[0] / 10000) * 100}%` }]} />
                <View style={[styles.sliderThumb, { left: `${(priceRange[1] / 10000) * 100}%` }]} />
              </View>
              <View style={styles.priceInputsContainer}>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Min</Text>
                  <TextInput
                    style={styles.priceInputField}
                    value={priceRange[0].toString()}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                      const value = parseInt(text) || 0;
                      setPriceRange([Math.min(value, priceRange[1]), priceRange[1]]);
                    }}
                  />
                </View>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Max</Text>
                  <TextInput
                    style={styles.priceInputField}
                    value={priceRange[1].toString()}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                      const value = parseInt(text) || 10000;
                      setPriceRange([priceRange[0], Math.max(value, priceRange[0])]);
                    }}
                  />
                </View>
              </View>
            </View>
            
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Availability</Text>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Show only available grounds</Text>
                <Switch
                  value={showOnlyOpen}
                  onValueChange={setShowOnlyOpen}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={showOnlyOpen ? '#1e293b' : '#f4f3f4'}
                />
              </View>
            </View>
            
            {/* Cities Filter */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Text style={styles.filterSectionTitle}>Cities</Text>
                {selectedCities.length > 0 && (
                  <TouchableOpacity onPress={() => setSelectedCities([])}>
                    <Text style={styles.clearFilterText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.filterGrid}>
                {PAKISTANI_CITIES.slice(0, 10).map((city, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.filterChip,
                      selectedCities.includes(city) && styles.filterChipSelected
                    ]}
                    onPress={() => toggleCity(city)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedCities.includes(city) && styles.filterChipTextSelected
                    ]} numberOfLines={1}>
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Distance Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Distance Range (km)</Text>
              <View style={styles.priceRangeDisplay}>
                <Text style={styles.priceRangeText}>{distanceRange[0]} - {distanceRange[1]} km</Text>
              </View>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack} />
                <View style={[styles.sliderRange, {
                  left: `${(distanceRange[0] / 50) * 100}%`,
                  width: `${((distanceRange[1] - distanceRange[0]) / 50) * 100}%`
                }]} />
                <View style={[styles.sliderThumb, { left: `${(distanceRange[0] / 50) * 100}%` }]} />
                <View style={[styles.sliderThumb, { left: `${(distanceRange[1] / 50) * 100}%` }]} />
              </View>
              <View style={styles.priceInputsContainer}>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Min</Text>
                  <TextInput
                    style={styles.priceInputField}
                    value={distanceRange[0].toString()}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                      const value = parseInt(text) || 0;
                      setDistanceRange([Math.min(value, distanceRange[1]), distanceRange[1]]);
                    }}
                  />
                </View>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Max</Text>
                  <TextInput
                    style={styles.priceInputField}
                    value={distanceRange[1].toString()}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                      const value = parseInt(text) || 50;
                      setDistanceRange([distanceRange[0], Math.max(value, distanceRange[0])]);
                    }}
                  />
                </View>
              </View>
              {!userLocation && (
                <Text style={styles.locationWarning}>
                  Location access required for distance filtering
                </Text>
              )}
            </View>

            {/* Venue Type Filter */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Text style={styles.filterSectionTitle}>Venue Type</Text>
                {selectedVenueTypes.length > 0 && (
                  <TouchableOpacity onPress={() => setSelectedVenueTypes([])}>
                    <Text style={styles.clearFilterText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.filterGrid}>
                {venueTypes.map((venueType, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.filterChip,
                      selectedVenueTypes.includes(venueType.value) && styles.filterChipSelected
                    ]}
                    onPress={() => toggleVenueType(venueType.value)}
                  >
                    <View style={styles.venueTypeChipContent}>
                      <Ionicons
                        name={venueType.icon as any}
                        size={16}
                        color={selectedVenueTypes.includes(venueType.value) ? 'white' : '#666'}
                      />
                      <Text style={[
                        styles.filterChipText,
                        selectedVenueTypes.includes(venueType.value) && styles.filterChipTextSelected
                      ]} numberOfLines={1}>
                        {venueType.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amenities Filter */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Text style={styles.filterSectionTitle}>Amenities</Text>
                {selectedAmenities.length > 0 && (
                  <TouchableOpacity onPress={() => setSelectedAmenities([])}>
                    <Text style={styles.clearFilterText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.filterGrid}>
                {availableAmenities.slice(0, 15).map((amenity, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.filterChip,
                      selectedAmenities.includes(amenity) && styles.filterChipSelected
                    ]}
                    onPress={() => toggleAmenity(amenity)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedAmenities.includes(amenity) && styles.filterChipTextSelected
                    ]} numberOfLines={1}>
                      {amenity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={resetFilters} style={styles.resetFiltersButton}>
              <Text style={styles.resetFiltersText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={hideFilters} 
              style={styles.applyFiltersButton}
            >
              <Text style={styles.applyFiltersText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor:'#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff6b00',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeFiltersContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#1e293b',
    marginRight: 6,
  },
  clearAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
  },
  clearAllText: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: '500',
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  resultsText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6, 
  },
  viewToggleText: {
    fontSize: 14,
    color: '#fff',
    marginRight: 4,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  mapErrorOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapErrorText: {
    marginLeft: 8,
    color: '#d32f2f',
    fontSize: 14,
  },
  // Custom Map Marker Styles
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
    opacity: 0.5,
  },
  // Map Legend Styles
  mapLegend: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 150,
  },
  mapLegendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  mapLegendItems: {
    gap: 6,
  },
  mapLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
  customCallout: {
    width: 250,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  calloutRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutRatingText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
    color: '#666',
  },
  calloutVenueType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  calloutVenueTypeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  calloutPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  calloutStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  calloutStatusText: {
    fontSize: 12,
    color: '#666',
  },
  calloutActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calloutButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  calloutButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedGroundCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedGroundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedGroundTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  selectedGroundVenueType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedGroundVenueTypeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  selectedGroundPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  selectedGroundAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  selectedGroundActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectedGroundButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedGroundButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Horizontal card layout styles
  groundsList: {
    paddingVertical: 8,
  },
  groundCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#1e293b',
    flexDirection: 'row',
    height: 160,
    minHeight: 120,
    maxHeight: 160,
  },
  cardImageContainer: {
    width: '25%',
    minWidth: 120,
    maxWidth: 160,
    height: '100%',
    position: 'relative',
  },
  groundImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleSection: {
    flex: 1,
    marginRight: 8,
  },
  groundName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    color: '#666',
  },
  groundPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color:'#1e293b',
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groundAddress: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  amenityChip: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  amenityText: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: '500',
  },
  moreAmenitiesChip: {
    backgroundColor: '#e0e0e0',
    width: 20,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAmenitiesText: {
    fontSize: 8,
    color: '#666',
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6c5ce7',
  },
  rateButtonText: {
    color: '#6c5ce7',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  noImageText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  reviewsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  noGroundsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noGroundsText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    fontWeight: '600',
  },
  noGroundsSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearFilterText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  priceRangeDisplay: {
    backgroundColor: '#f0f4ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  priceRangeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  sliderContainer: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 16,
    position: 'relative',
  },
  sliderTrack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  sliderRange: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    top: -10,
    marginLeft: -12,
  },
  priceInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceInput: {
    width: '48%',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceInputField: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipSelected: {
    backgroundColor: '#1e293b',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextSelected: {
    color: 'white',
  },
  resetFiltersButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    flex: 1,
    marginRight: 12,
    alignItems: 'center',
  },
  resetFiltersText: {
    color: '#1e293b',
    fontWeight: 'bold',
    fontSize: 16,
  },
  applyFiltersButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    flex: 1,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  ratingStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  ratingModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  ratingModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ratingModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingModalCloseButton: {
    padding: 4,
  },
  ratingModalBody: {
    padding: 20,
  },
  ratingSection: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  reviewSection: {
    marginBottom: 4,
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  existingReviewsSection: {
    marginTop: 24,
    marginBottom: 24
  },
  existingReviewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  reviewItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  ratingModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitRatingButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitRatingButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitRatingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationWarning: {
    fontSize: 12,
    color: '#d32f2f',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  venueTypeChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Image Carousel Styles
  imageCarouselContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  carouselImage: {
    width: width * 0.9,
    height: '100%',
    borderRadius: 8,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: 'white',
  },
  imageCounter: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Card Image Section
  cardImageSection: {
    width: '35%',
    minWidth: 100,
    maxWidth: 120,
    height: '100%',
    margin: 7,
    position: 'relative',
  },
  // Title and Rating Section
  titleAndRating: {
    flex: 1,
    marginRight: 8,
  },
  // Name and Price Row
  namePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reviewsCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  // Details Row
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  // New Image Carousel Styles matching reference design
  mainImageContainer: {
    flex: 1,
    width: '100%',
    height: '50%',
    position: 'relative',
    marginBottom: 4,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  bottomImagesContainer: {
    flexDirection: 'row',
    height: '30%',
    width: '100%',
    marginBottom: 24,
    gap: 2,
  },
  bottomImageWrapper: {
    flex: 1,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  bottomImage: {
    width: '100%',
    height: '100%',
  },
  currentImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentImageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.33)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalImagesText: {
    color: 'white',
    fontSize: 18,
  },
  hiddenFlatList: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});