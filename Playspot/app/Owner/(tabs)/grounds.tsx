import { GroundsSkeleton } from '@/components/ui/GroundsSkeleton';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import HeaderComponent from '../../../components/HeaderComponent';
import { auth } from '../../../firebaseconfig';
import { useOwnerAuth } from '../../../hooks/useOwnerAuth';

interface Ground {
  id: string;
  name: string;
  address: string;
  price: number;
  facilities: string[];
  status: 'open' | 'closed';
  photos?: string[];
  ownerId: string;
  ownerName: string;
  bookings: number;
  description?: string;
  size?: string;
  timings?: string;
  contactInfo?: string;
  latitude?: number;
  longitude?: number;
  createdAt: any;
  rating?: number;
  reviews?: number;
  venueType?: 'indoor' | 'outdoor' | 'gaming_arena' | 'sports_complex';
}

const GroundsManagement = () => {
  const router = useRouter();
  const [grounds, setGrounds] = useState<Ground[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGround, setEditingGround] = useState<Ground | null>(null);
  const [newGround, setNewGround] = useState<Partial<Ground>>({
    name: '',
    address: '',
    price: 0,
    facilities: [],
    status: 'open',
    description: '',
    size: '',
    timings: '',
    contactInfo: '',
    photos: [],
    latitude: undefined,
    longitude: undefined,
    venueType: 'outdoor',
  });
  const [facilityInput, setFacilityInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);
  const [selectedGroundReviews, setSelectedGroundReviews] = useState<any[]>([]);
  const [selectedGroundName, setSelectedGroundName] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const { approvalStatus, loading: authLoading, user } = useOwnerAuth();
  const [recentlyAddedGroundId, setRecentlyAddedGroundId] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);
  const [addressError, setAddressError] = useState(false);
  const [priceError, setPriceError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const venueTypes = [
    { value: 'outdoor', label: 'Outdoor Ground', icon: 'sunny-outline' },
    { value: 'indoor', label: 'Indoor Court', icon: 'business-outline' },
    { value: 'gaming_arena', label: 'Gaming Arena', icon: 'game-controller-outline' },
    { value: 'sports_complex', label: 'Sports Complex', icon: 'football-outline' },
  ];

  const CLOUDINARY_CLOUD_NAME = 'dg5fojcpg';
  const CLOUDINARY_UPLOAD_PRESET = 'app_uploads';
  const db = getFirestore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const groundsRef = collection(db, 'grounds');
        const groundsQuery = query(groundsRef, where('ownerId', '==', user.uid));
        const groundsSnapshot = await getDocs(groundsQuery);

        const groundsData = groundsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Ground[];

        const reviewsRef = collection(db, 'reviews');
        const reviewsSnapshot = await getDocs(reviewsRef);

        const reviewsByGround: { [key: string]: { rating: number; count: number } } = {};

        reviewsSnapshot.docs.forEach((doc) => {
          const review = doc.data();
          const groundId = review.groundId;

          if (!reviewsByGround[groundId]) {
            reviewsByGround[groundId] = { rating: 0, count: 0 };
          }

          reviewsByGround[groundId].rating += review.rating;
          reviewsByGround[groundId].count += 1;
        });

        const bookingsRef = collection(db, 'bookings');
        const bookingsSnapshot = await getDocs(bookingsRef);
        
        const bookingsByGround: { [key: string]: number } = {};
        
        bookingsSnapshot.docs.forEach((doc) => {
          const booking = doc.data();
          const groundId = booking.propertyId;
          
          if (groundId) {
            bookingsByGround[groundId] = (bookingsByGround[groundId] || 0) + 1;
          }
        });

        const groundsWithReviews = groundsData.map((ground) => {
          const reviewData = reviewsByGround[ground.id];
          const bookingsCount = bookingsByGround[ground.id] || 0;
          
          if (reviewData && reviewData.count > 0) {
            return {
              ...ground,
              rating: Math.round((reviewData.rating / reviewData.count) * 10) / 10,
              reviews: reviewData.count,
              bookings: bookingsCount
            };
          } else {
            return {
              ...ground,
              rating: 0,
              reviews: 0,
              bookings: bookingsCount
            };
          }
        });

        setGrounds(groundsWithReviews);
      } catch (error) {
        console.error('Error fetching data:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch grounds',
          position: 'bottom'
        });
      } finally {
        setLoading(false);
      }
    };

    if (approvalStatus === 'approved') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [approvalStatus]);

  const uploadToCloudinary = async (imageUri: string): Promise<string> => {
    try {
      const formData = new FormData();
      const fileExtension = imageUri.split('.').pop() || 'jpg';
      const fileName = `ground_${Date.now()}.${fileExtension}`;
      
      formData.append('file', {
        uri: imageUri,
        type: `image/${fileExtension}`,
        name: fileName,
      } as any);
      
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'grounds');
      formData.append('resource_type', 'image');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      if (!data.secure_url) {
        throw new Error('Invalid response from Cloudinary');
      }

      return data.secure_url;
      
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'We need access to your gallery.',
        });
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        setUploading(true);
        const cloudinaryUrls: string[] = [];
        const totalImages = result.assets.length;

        try {
          for (let i = 0; i < result.assets.length; i++) {
            const asset = result.assets[i];
            try {
              const cloudinaryUrl = await uploadToCloudinary(asset.uri);
              cloudinaryUrls.push(cloudinaryUrl);
            } catch (uploadError) {
              console.error(`Failed to upload image ${i + 1}:`, uploadError);
            }
          }

          if (cloudinaryUrls.length === 0) {
            throw new Error('All image uploads failed');
          }

          if (editingGround) {
            const groundRef = doc(db, 'grounds', editingGround.id);
            const updatedPhotos = [...(editingGround.photos || []), ...cloudinaryUrls];
            
            await updateDoc(groundRef, { photos: updatedPhotos });
            
            setGrounds(grounds.map(g => g.id === editingGround.id ? { ...g, photos: updatedPhotos } : g));
            setEditingGround(prev => prev ? { ...prev, photos: updatedPhotos } : null);
            
            setNewGround(prev => ({
              ...prev,
              photos: updatedPhotos
            }));
          } else {
            setNewGround((prev) => {
              const updated = {
                ...prev,
                photos: [...(prev.photos || []), ...cloudinaryUrls],
              };
              return updated;
            });
          }

          setUploading(false);

          const failedCount = totalImages - cloudinaryUrls.length;
          if (failedCount > 0) {
            Toast.show({
              type: 'info',
              text1: 'Partial Success',
              text2: `${cloudinaryUrls.length} image(s) uploaded successfully. ${failedCount} failed.`
            });
          } else {
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: `${cloudinaryUrls.length} image(s) uploaded successfully!`
            });
          }

        } catch (error) {
          console.error('Upload process error:', error);
          setUploading(false);
          Toast.show({
            type: 'error',
            text1: 'Upload Failed',
            text2: `Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
    } catch (err) {
      console.error('Image Picker Error:', err);
      setUploading(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick images'
      });
    }
  };

  const deleteFromCloudinary = async (imageUrl: string) => {
    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const publicId = `grounds/${fileName.split('.')[0]}`;

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: publicId,
            api_key: 'your_api_key_here',
            timestamp: Math.floor(Date.now() / 1000),
            signature: 'generated_signature_here'
          }),
        }
      );

      if (!response.ok) {
        console.warn('Failed to delete from Cloudinary:', response.status);
      } else {
        const result = await response.json();
        console.log('Cloudinary deletion result:', result);
      }
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
    }
  };

  const removePhoto = async (index: number) => {
    try {
      if (editingGround) {
        const photoToRemove = editingGround.photos?.[index];
        if (photoToRemove) {
          await deleteFromCloudinary(photoToRemove);
        }

        const groundRef = doc(db, 'grounds', editingGround.id);
        const updatedPhotos = [...(editingGround.photos || [])];
        updatedPhotos.splice(index, 1);
        await updateDoc(groundRef, { photos: updatedPhotos });

        setGrounds(grounds.map(g => g.id === editingGround.id ? { ...g, photos: updatedPhotos } : g));
        setEditingGround(prev => prev ? { ...prev, photos: updatedPhotos } : null);
        setNewGround(prev => ({ ...prev, photos: updatedPhotos }));
      } else {
        const photoToRemove = newGround.photos?.[index];
        if (photoToRemove) {
          await deleteFromCloudinary(photoToRemove);
        }

        setNewGround((prev) => {
          const updated = [...(prev.photos || [])];
          updated.splice(index, 1);
          return { ...prev, photos: updated };
        });
      }
      } catch (error) {
        console.error('Error removing photo:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to remove photo'
        });
      }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission Denied',
          text2: 'We need location access to set ground location.'
        });
        setLocationLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      let address = '';
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode.length > 0) {
          const place = geocode[0];
          address = [
            place.name,
            place.street,
            place.city,
            place.region,
            place.postalCode,
            place.country
          ].filter(part => part).join(', ');
        } else {
          Toast.show({
            type: 'error',
            text1: 'Address Not Found',
            text2: 'Could not get address from location. Please enter the address manually.'
          });
        }
      } catch (geocodeError) {
        console.error('Reverse geocoding error:', geocodeError);
        Toast.show({
          type: 'error',
          text1: 'Geocoding Error',
          text2: 'Failed to get address from location. Please enter the address manually.'
        });
      }

      setNewGround((prev) => ({
        ...prev,
        latitude,
        longitude,
        address: address || prev.address,
      }));

      setLocationLoading(false);
      Toast.show({
        type: 'success',
        text1: '✅ Location Set',
        text2: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      });
    } catch (error) {
      console.error('Location Error:', error);
      setLocationLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to get location.'
      });
    }
  };

  const addGround = async () => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'You must be logged in to add a ground'
        });
        return;
      }

      // Enhanced validation with error state updates
      let hasError = false;
      
      if (!newGround.name?.trim()) {
        setNameError(true);
        hasError = true;
      } else {
        setNameError(false);
      }
      
      if (!newGround.address?.trim()) {
        setAddressError(true);
        hasError = true;
      } else {
        setAddressError(false);
      }
      
      if (!newGround.price || newGround.price <= 0) {
        setPriceError(true);
        hasError = true;
      } else {
        setPriceError(false);
      }

      if (hasError) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please fill in all required fields correctly',
          position: 'top',
          topOffset: 50
        });
        return;
      }

      const groundData = {
        name: newGround.name,
        address: newGround.address,
        price: Number(newGround.price),
        facilities: newGround.facilities || [],
        photos: newGround.photos || [],
        description: newGround.description || '',
        size: newGround.size || '',
        timings: newGround.timings || '',
        contactInfo: newGround.contactInfo || '',
        latitude: newGround.latitude,
        longitude: newGround.longitude,
        venueType: newGround.venueType || 'outdoor',
        ownerId: user.uid,
        ownerName: user.email?.split('@')[0] || 'Owner',
        bookings: 0,
        createdAt: new Date(),
        status: 'open'
      };
      
      const docRef = await addDoc(collection(db, 'grounds'), groundData);
      
      const savedDoc = await getDoc(docRef);
      const savedData = savedDoc.data();
      
      setGrounds([...grounds, { id: docRef.id, ...groundData } as Ground]);
      setModalVisible(false);
      
      setRecentlyAddedGroundId(docRef.id);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Ground added successfully with ${groundData.photos.length} photos`
      });

      setTimeout(() => {
        router.push({
          pathname: "./availability",
          params: { groundId: docRef.id }
        });
      }, 2000);
      
      resetForm();
    } catch (error) {
      console.error('Error adding ground:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add ground: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  };

  const updateGround = async () => {
    try {
      if (!editingGround) return;

      // Enhanced validation with error state updates
      let hasError = false;
      
      if (!newGround.name?.trim()) {
        setNameError(true);
        hasError = true;
      } else {
        setNameError(false);
      }
      
      if (!newGround.address?.trim()) {
        setAddressError(true);
        hasError = true;
      } else {
        setAddressError(false);
      }
      
      if (!newGround.price || newGround.price <= 0) {
        setPriceError(true);
        hasError = true;
      } else {
        setPriceError(false);
      }

      if (hasError) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please fill in all required fields correctly',
          position: 'top',
          topOffset: 50
        });
        return;
      }

      const updateData = {
        name: newGround.name,
        address: newGround.address,
        price: Number(newGround.price),
        facilities: newGround.facilities || [],
        photos: newGround.photos || [],
        description: newGround.description || '',
        size: newGround.size || '',
        timings: newGround.timings || '',
        contactInfo: newGround.contactInfo || '',
        latitude: newGround.latitude,
        longitude: newGround.longitude,
        venueType: newGround.venueType || 'outdoor',
        status: newGround.status
      };
      
      await updateDoc(doc(db, 'grounds', editingGround.id), updateData);
      
      const updatedDoc = await getDoc(doc(db, 'grounds', editingGround.id));
      const updatedData = updatedDoc.data();
      
      setGrounds(grounds.map(g => 
        g.id === editingGround.id ? { ...g, ...updateData } as Ground : g
      ));
      
      setModalVisible(false);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Ground updated successfully with ${updateData.photos.length} photos`
      });

      setTimeout(() => {
        router.push({
          pathname: "./availability",
          params: { groundId: editingGround.id }
        });
      }, 2000);
      
      setEditingGround(null);
      resetForm();
    } catch (error) {
      console.error('Error updating ground:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update ground: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  };

  const toggleStatus = async (groundId: string, currentStatus: 'open' | 'closed') => {
    try {
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';
      await updateDoc(doc(db, 'grounds', groundId), { status: newStatus });

      setGrounds(grounds.map(g => 
        g.id === groundId ? { ...g, status: newStatus } : g
      ));

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Ground status updated to ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update ground status'
      });
    }
  };

  const deleteGround = (ground: Ground) => {
    if (!auth.currentUser) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Required',
        text2: 'Please sign in to delete grounds.',
      });
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Delete Ground',
      `Are you sure you want to delete "${ground.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete photos from Cloudinary first
              if (ground.photos && ground.photos.length > 0) {
                for (const photoUrl of ground.photos) {
                  await deleteFromCloudinary(photoUrl);
                }
              }

              // Delete the ground document from Firestore
              await deleteDoc(doc(db, 'grounds', ground.id));
              
              // Remove from local state
              setGrounds(prevGrounds => prevGrounds.filter(g => g.id !== ground.id));
              
              // Show success message
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Ground deleted successfully!',
              });
            } catch (error) {
              console.error('Error deleting ground:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete ground. Please try again.',
              });
            }
          },
        },
      ],
      {
        cancelable: true,
      }
    );
  };

  const editGround = (ground: Ground) => {
    setEditingGround(ground);
    setNewGround({
      name: ground.name,
      address: ground.address,
      price: ground.price,
      facilities: ground.facilities,
      photos: ground.photos,
      description: ground.description,
      size: ground.size,
      timings: ground.timings,
      contactInfo: ground.contactInfo,
      latitude: ground.latitude,
      longitude: ground.longitude,
      venueType: ground.venueType || 'outdoor',
      status: ground.status
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setNewGround({
      name: '',
      address: '',
      price: 0,
      facilities: [],
      status: 'open',
      description: '',
      size: '',
      timings: '',
      contactInfo: '',
      photos: [],
      latitude: undefined,
      longitude: undefined,
      venueType: 'outdoor',
    });
    setFacilityInput('');
    setNameError(false);
    setAddressError(false);
    setPriceError(false);
  };

  const addFacility = () => {
    if (facilityInput.trim()) {
      setNewGround(prev => ({
        ...prev,
        facilities: [...(prev.facilities || []), facilityInput.trim()]
      }));
      setFacilityInput('');
    }
  };

  const removeFacility = (index: number) => {
    setNewGround(prev => {
      const updatedFacilities = [...(prev.facilities || [])];
      updatedFacilities.splice(index, 1);
      return {
        ...prev,
        facilities: updatedFacilities
      };
    });
  };

  const fetchReviewsForGround = async (groundId: string, groundName: string) => {
    try {
      setReviewsLoading(true);

      const reviewsRef = collection(db, 'reviews');
      const reviewsQuery = query(reviewsRef, where('groundId', '==', groundId));
      const reviewsSnapshot = await getDocs(reviewsQuery);

      const reviewsWithUsers = await Promise.all(
        reviewsSnapshot.docs.map(async (reviewDoc) => {
          const review = reviewDoc.data();
          const userRef = doc(db, 'users', review.userId);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.exists() ? userDoc.data() : null;

          return {
            id: reviewDoc.id,
            ...review,
            userName: userData?.name || userData?.email?.split('@')[0] || 'Anonymous',
            userEmail: userData?.email || '',
          };
        })
      );

      setSelectedGroundReviews(reviewsWithUsers);
      setSelectedGroundName(groundName);
      setReviewsModalVisible(true);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch reviews'
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  const getVenueTypeDisplayName = (type: string) => {
    const venueType = venueTypes.find(vt => vt.value === type);
    return venueType ? venueType.label : 'Outdoor Ground';
  };

  const getVenueTypeIcon = (type: string) => {
    const venueType = venueTypes.find(vt => vt.value === type);
    return venueType ? venueType.icon : 'sunny-outline';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const groundsRef = collection(db, 'grounds');
      const groundsQuery = query(groundsRef, where('ownerId', '==', user.uid));
      const groundsSnapshot = await getDocs(groundsQuery);

      const groundsData = groundsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Ground[];

      const reviewsRef = collection(db, 'reviews');
      const reviewsSnapshot = await getDocs(reviewsRef);

      const reviewsByGround: { [key: string]: { rating: number; count: number } } = {};

      reviewsSnapshot.docs.forEach((doc) => {
        const review = doc.data();
        const groundId = review.groundId;

        if (!reviewsByGround[groundId]) {
          reviewsByGround[groundId] = { rating: 0, count: 0 };
        }

        reviewsByGround[groundId].rating += review.rating;
        reviewsByGround[groundId].count += 1;
      });

      const bookingsRef = collection(db, 'bookings');
      const bookingsSnapshot = await getDocs(bookingsRef);

      const bookingsByGround: { [key: string]: number } = {};

      bookingsSnapshot.docs.forEach((doc) => {
        const booking = doc.data();
        const groundId = booking.propertyId;

        if (groundId) {
          bookingsByGround[groundId] = (bookingsByGround[groundId] || 0) + 1;
        }
      });

      const groundsWithReviews = groundsData.map((ground) => {
        const reviewData = reviewsByGround[ground.id];
        const bookingsCount = bookingsByGround[ground.id] || 0;

        if (reviewData && reviewData.count > 0) {
          return {
            ...ground,
            rating: Math.round((reviewData.rating / reviewData.count) * 10) / 10,
            reviews: reviewData.count,
            bookings: bookingsCount
          };
        } else {
          return {
            ...ground,
            rating: 0,
            reviews: 0,
            bookings: bookingsCount
          };
        }
      });

      setGrounds(groundsWithReviews);
    } catch (error) {
      console.error('Error refreshing data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to refresh grounds',
        position: 'bottom'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const renderGround = ({ item }: { item: Ground }) => (
    <View style={styles.groundCard}>
      {item.photos && item.photos.length > 0 && (
        <Image source={{ uri: item.photos[0] }} style={styles.groundImage} />
      )}
      
      <View style={styles.groundInfo}>
        <View style={styles.groundHeader}>
          <Text style={styles.groundName}>{item.name}</Text>
          <View style={[
            styles.statusBadge, 
            item.status === 'open' ? styles.statusOpen : styles.statusClosed
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'open' ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>
        </View>
        
        <View style={styles.venueTypeContainer}>
          <Ionicons 
            name={getVenueTypeIcon(item.venueType || 'outdoor') as any} 
            size={16} 
            color="#666" 
          />
          <Text style={styles.venueTypeText}>
            {getVenueTypeDisplayName(item.venueType || 'outdoor')}
          </Text>
        </View>
        
        <Text style={styles.groundAddress}>{item.address}</Text>
        
        <View style={styles.groundStats}>
          <View style={styles.statItem}>
            <Ionicons name="pricetag-outline" size={16} color="#666" />
            <Text style={styles.statText}>Rs. {item.price}/hour</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.statText}>{item.rating || 0} ({item.reviews || 0})</Text>
          </View>
          
        </View>
        
        <Text style={styles.groundFacilities}>
          {item.facilities?.join(' • ') || 'No facilities listed'}
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => toggleStatus(item.id, item.status)}
          >
            <Ionicons 
              name={item.status === 'open' ? 'lock-closed' : 'lock-open'} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => fetchReviewsForGround(item.id, item.name)}
          >
            <Ionicons name="star-outline" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => editGround(item)}
          >
            <Ionicons name="create-outline" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => deleteGround(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Show skeleton only during initial loading and auth check
  if ((loading || authLoading) && grounds.length === 0) {
    return <GroundsSkeleton />;
  }

  if (approvalStatus !== 'approved') {
    return (
      <View style={styles.container}>
        <HeaderComponent
          title="Manage Grounds"
          subtitle="Add or edit your sports facilities"
          iconName="location-outline"
        />
        <View style={styles.notApprovedContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#ff9500" />
          <Text style={styles.notApprovedText}>
            {approvalStatus === 'pending'
              ? 'Your account is pending admin approval. You cannot manage grounds yet.'
              : 'Your account has been rejected. Please contact admin.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderComponent
        title="Manage Grounds"
        subtitle="Add or edit your sports facilities"
        iconName="location-outline"
      />
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setEditingGround(null);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Add New Ground</Text>
      </TouchableOpacity>

      {grounds.length > 0 ? (
        <FlatList
          data={grounds}
          renderItem={renderGround}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1e293b']}
              tintColor="#1e293b"
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={60} color="#ddd" />
          <Text style={styles.emptyText}>No grounds found</Text>
          <Text style={styles.emptySubtext}>Add your first ground to get started</Text>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        statusBarTranslucent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingGround ? 'Edit Ground' : 'Add New Ground'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <Text style={styles.label}>Venue Type *</Text>
              <View style={styles.venueTypeGrid}>
                {venueTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.venueTypeButton,
                      newGround.venueType === type.value && styles.venueTypeButtonSelected
                    ]}
                    onPress={() => setNewGround({...newGround, venueType: type.value as any})}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={20} 
                      color={newGround.venueType === type.value ? '#fff' : '#1e293b'} 
                    />
                    <Text style={[
                      styles.venueTypeButtonText,
                      newGround.venueType === type.value && styles.venueTypeButtonTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.label}>Ground Name *</Text>
              <TextInput
                style={[styles.input, nameError && styles.inputError]}
                value={newGround.name}
                onChangeText={(text) => {
                  setNewGround({...newGround, name: text});
                  if (text.trim() !== '') setNameError(false);
                }}
                placeholder="Enter ground name"
              />

              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[styles.input, addressError && styles.inputError]}
                value={newGround.address}
                onChangeText={(text) => {
                  setNewGround({...newGround, address: text});
                  if (text.trim() !== '') setAddressError(false);
                }}
                placeholder="Enter unique full address (e.g., 123 Main St, City, State)"
              />

              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="location" size={16} color="#fff" />
                    <Text style={styles.buttonText}>
                      {newGround.latitude && newGround.longitude
                        ? `Location Set (${newGround.latitude.toFixed(4)}, ${newGround.longitude.toFixed(4)})`
                        : 'Set Ground Location'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Price per hour (Rs.) *</Text>
              <TextInput
                style={[styles.input, priceError && styles.inputError]}
                value={newGround.price?.toString()}
                onChangeText={(text) => {
                  const priceValue = Number(text);
                  setNewGround({...newGround, price: priceValue});
                  if (text.trim() !== '' && !isNaN(priceValue) && priceValue > 0) setPriceError(false);
                }}
                placeholder="Enter price"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Details</Text>
              
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newGround.description}
                onChangeText={(text) => setNewGround({...newGround, description: text})}
                placeholder="Enter description"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Size</Text>
              <TextInput
                style={styles.input}
                value={newGround.size}
                onChangeText={(text) => setNewGround({...newGround, size: text})}
                placeholder="e.g., Full court, Half court"
              />

              <Text style={styles.label}>Timings</Text>
              <TextInput
                style={styles.input}
                value={newGround.timings}
                onChangeText={(text) => setNewGround({...newGround, timings: text})}
                placeholder="e.g., 6AM - 10PM"
              />

              <Text style={styles.label}>Contact Info</Text>
              <TextInput
                style={styles.input}
                value={newGround.contactInfo}
                onChangeText={(text) => setNewGround({...newGround, contactInfo: text})}
                placeholder="Phone number or email"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Facilities</Text>
              
              <View style={styles.facilityInputContainer}>
                <TextInput
                  style={styles.facilityInput}
                  value={facilityInput}
                  onChangeText={setFacilityInput}
                  placeholder="Add facility (e.g., Basketball, Water Station)"
                  onSubmitEditing={addFacility}
                />
                <TouchableOpacity style={styles.addFacilityButton} onPress={addFacility}>
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {newGround.facilities && newGround.facilities.length > 0 && (
                <View style={styles.facilitiesList}>
                  {newGround.facilities.map((facility, index) => (
                    <View key={index} style={styles.facilityTag}>
                      <Text style={styles.facilityText}>{facility}</Text>
                      <TouchableOpacity onPress={() => removeFacility(index)}>
                        <Ionicons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Photos</Text>
              
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage} disabled={uploading}>
                {uploading ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.uploadButtonText}>Uploading...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                    <Text style={styles.uploadButtonText}>Upload Photos</Text>
                  </>
                )}
              </TouchableOpacity>

              {newGround.photos && newGround.photos.length > 0 && (
                <View style={styles.photosContainer}>
                  {newGround.photos.map((photo, index) => (
                    <View key={index} style={styles.photoItem}>
                      <Image source={{ uri: photo }} style={styles.thumbnail} />
                      <TouchableOpacity 
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(index)}
                      >
                        <Ionicons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={18} color="#666" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={editingGround ? updateGround : addGround}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {editingGround ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={false}
        visible={reviewsModalVisible}
        statusBarTranslucent={true}
        onRequestClose={() => setReviewsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reviews for {selectedGroundName}</Text>
            <TouchableOpacity onPress={() => setReviewsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {reviewsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color='#1e293b' />
              <Text style={styles.loadingText}>Loading reviews...</Text>
            </View>
          ) : selectedGroundReviews.length > 0 ? (
            <FlatList
              data={selectedGroundReviews}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.reviewsList}
              renderItem={({ item }) => (
                <View style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUser}>{item.userName}</Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{item.comment}</Text>
                  <Text style={styles.reviewDate}>
                    {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Date not available'}
                  </Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.noReviewsContainer}>
              <Ionicons name="chatbubble-outline" size={60} color="#ddd" />
              <Text style={styles.noReviewsText}>No reviews yet for this ground.</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
    backgroundColor: '#fdf2f2',
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#666',
  },
  notApprovedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 50,
    margin: 16, 
  },
  notApprovedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    margin: 16, 
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10, 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: { 
    paddingBottom: 20 
  },
  groundCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom:0,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    margin: 16, 
    elevation: 2,
  },
  groundImage: {
    width: '100%',
    height: 150,
  },
  groundInfo: {
    padding: 16,
  },
  groundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groundName: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#1a1a1a',
    flex: 1,
    marginRight: 10,
  },
  venueTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  venueTypeText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#e6f7ee',
  },
  statusClosed: {
    backgroundColor: '#feeaea',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  groundAddress: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 12,
  },
  groundStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  groundFacilities: { 
    fontSize: 13, 
    color: '#444', 
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  iconButton: {
    padding: 8,
    marginLeft: 12,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    marginTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  formSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 16,
    color: '#333',
  },
  venueTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  venueTypeButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  venueTypeButtonSelected: {
    backgroundColor: '#1e293b',
  },
  venueTypeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  venueTypeButtonTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  facilityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  facilityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  addFacilityButton: {
    backgroundColor: '#1e293b',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  facilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  facilityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  facilityText: {
    color: '#fff',
    marginRight: 6,
    fontSize: 13,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#ff6b00',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  uploadButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 15,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  photoItem: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: {
    flex: 1,
    backgroundColor:'#1e293b',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reviewsList: {
    padding: 10,
  },
  reviewItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewUser: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  noReviewsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noReviewsText: {
    fontSize: 15,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  closeButton: {
    padding: 4,
  },
} as const);

export default GroundsManagement;