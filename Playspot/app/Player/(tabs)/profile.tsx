import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ProfileSkeleton } from '../../../components/ui/ProfileSkeleton';
import { auth, db } from '../../../firebaseconfig';
import { logoutUser } from '../../../utils/authUtils';

const { width } = Dimensions.get('window');
const isSmall = width < 400;

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dg5fojcpg';
const CLOUDINARY_UPLOAD_PRESET = 'app_uploads';

// Upload image to Cloudinary
const uploadToCloudinary = async (imageUri: string): Promise<string> => {
  try {
    if (!imageUri) {
      throw new Error('No image selected');
    }

    const formData = new FormData();
    const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = fileExtension === 'jpg' ? 'jpeg' : fileExtension;
    const fileName = `profile_${Date.now()}.${fileExtension}`;
    
    formData.append('file', {
      uri: imageUri,
      type: `image/${mimeType}`,
      name: fileName,
    } as any);
    
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'profiles');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error?.message || `Upload failed with status ${response.status}`);
    }

    if (!responseData.secure_url) {
      throw new Error('No secure URL returned from Cloudinary');
    }

    return responseData.secure_url;

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to upload image: ${message}`);
  }
};

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  favoriteSports: string[];
  address: string;
  createdAt: any;
  photoURL: string | null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'User not authenticated',
        });
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const profileData = {
          id: userDoc.id,
          name: userData.name || '',
          email: userData.email || user.email || '',
          phone: userData.phone || '',
          role: userData.role || 'player',
          favoriteSports: userData.favoriteSports || [],
          address: userData.address || '',
          createdAt: userData.createdAt || null,
          photoURL: userData.photoURL || user.photoURL || null,
        };
        setProfile(profileData);
        setEditName(profileData.name);
        setEditPhone(profileData.phone);
        setEditAddress(profileData.address);
        setImage(profileData.photoURL);
      } else {
        const newProfile = {
          id: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          phone: '',
          role: 'player',
          favoriteSports: [],
          address: '',
          createdAt: null,
          photoURL: user.photoURL || null,
        };
        setProfile(newProfile);
        setEditName(newProfile.name);
        setEditPhone(newProfile.phone);
        setEditAddress(newProfile.address);
        setImage(newProfile.photoURL);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      Alert.alert(
        'Change Profile Photo',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: takePhoto,
          },
          {
            text: 'Choose from Library',
            onPress: chooseFromLibrary,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick image',
      });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permission required',
        text2: 'Sorry, we need camera permissions to make this work!',
      });
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    await handleImageResult(result);
  };

  const chooseFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permission required',
        text2: 'Sorry, we need camera roll permissions to make this work!',
      });
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    await handleImageResult(result);
  };

  const handleImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUploadingImage(true);

      try {
        const cloudinaryUrl = await uploadToCloudinary(result.assets[0].uri);
        setImage(cloudinaryUrl);
        if (!editing) {
          await saveImageOnly(cloudinaryUrl);
        } else {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Profile image updated! Remember to save your changes.',
          });
        }
      } catch (uploadError: any) {
        console.error('Upload failed:', uploadError);
        Toast.show({
          type: 'error',
          text1: 'Upload Failed',
          text2: 'Failed to upload image. Please try again.',
        });
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const saveImageOnly = async (imageUrl: string) => {
    if (!profile) return;

    setSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'User not authenticated',
        });
        return;
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: imageUrl,
        updatedAt: new Date(),
      });

      setProfile(prev => prev ? { ...prev, photoURL: imageUrl } : null);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile image updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile image',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    if (!editName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter your name',
      });
      return;
    }

    setSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'User not authenticated',
        });
        return;
      }

      const updatedData: any = {
        name: editName.trim(),
        phone: editPhone,
        address: editAddress,
        updatedAt: new Date(),
      };

      if (image) updatedData.photoURL = image;

      await updateDoc(doc(db, 'users', currentUser.uid), updatedData);

      setProfile({
        ...profile,
        ...updatedData
      });

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been updated successfully!',
      });
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditName(profile?.name || '');
    setEditPhone(profile?.phone || '');
    setEditAddress(profile?.address || '');
    setImage(profile?.photoURL || null);
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logoutUser(router),
        },
      ]
    );
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="sad-outline" size={64} color="#d32f2f" />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.scrollView,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Enhanced Header Section with LinearGradient */}
          <LinearGradient
            colors={["#0f172a", "#1e293b", "#334155"] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* Background Pattern */}
            <View style={styles.backgroundPattern}>
              <View style={styles.patternCircle1} />
              <View style={styles.patternCircle2} />
            </View>

            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={pickImage}
                disabled={uploadingImage || saving}
              >
                {uploadingImage ? (
                  <View style={styles.avatarPlaceholder}>
                    <ActivityIndicator size="large" color="#fff" />
                  </View>
                ) : image ? (
                  <Image source={{ uri: image }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={40} color="#0f172a" />
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={16} color="#0f172a" />
                </View>
              </TouchableOpacity>

              <View style={styles.userInfo}>
                {editing ? (
                  <TextInput
                    style={[styles.userName, styles.editableName]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your name"
                    placeholderTextColor="#cbd5e1"
                  />
                ) : (
                  <Text style={styles.userName}>{profile.name || 'Player'}</Text>
                )}
                
                <View style={styles.roleContainer}>
                  <View style={styles.roleBadge}>
                    <Ionicons name="shield-checkmark" size={14} color="#fff" />
                    <Text style={styles.roleText}>{profile.role || 'player'}</Text>
                  </View>
                
                </View>
                
                <Text style={styles.userEmail}>{profile.email}</Text>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Ionicons name="calendar" size={14} color="#60a5fa" />
                    <Text style={styles.statText}>
                      {profile.createdAt ? 
                        `Joined ${profile.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` 
                        : 'New Member'
                      }
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Glow Effect */}
            <View style={styles.bottomGlow} />
          </LinearGradient>

          {/* Personal Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Ionicons name="person-circle" size={24} color="#1e293b" />
              </View>
              <Text style={styles.cardTitle}>Personal Information</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="person-outline" size={20} color="#1e293b" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Enter your name"
                    />
                  ) : (
                    <Text style={styles.infoText}>{profile.name}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="call-outline" size={20} color="#1e293b" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={editPhone}
                      onChangeText={setEditPhone}
                      placeholder="Enter your phone number"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={styles.infoText}>{profile.phone || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="location-outline" size={20} color="#1e293b" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={editAddress}
                      onChangeText={setEditAddress}
                      placeholder="Enter your address"
                      multiline
                    />
                  ) : (
                    <Text style={styles.infoText}>{profile.address || 'Not provided'}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Account Information Card */}
          {profile.createdAt && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons name="information-circle" size={24} color="#1e293b" />
                </View>
                <Text style={styles.cardTitle}>Account Information</Text>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="calendar-outline" size={20} color="#1e293b" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Member Since</Text>
                    <Text style={styles.infoText}>
                      {profile.createdAt.toDate().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="mail-outline" size={20} color="#1e293b" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email Address</Text>
                    <Text style={styles.infoText}>{profile.email}</Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="key-outline" size={20} color="#1e293b" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Account Type</Text>
                    <View style={styles.roleContainer}>
                      <Text style={styles.roleBadgeText}>{profile.role}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          {editing ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={saving}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
                <Ionicons name="create" size={20} color="#fff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out" size={20} color="#fff" />
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 10,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Enhanced Header Styles with LinearGradient
  header: {
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 20,
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  editableName: {
    borderBottomWidth: 2,
    borderBottomColor: '#60a5fa',
    paddingVertical: 4,
    color: '#fff',
    fontSize: 24,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
    marginBottom: 12,
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
    alignSelf: 'flex-start',
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
  // Card Styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  infoSection: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
  },
  roleBadgeText: {
    color: '#475569',
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButton: {
    backgroundColor: '#1e293b',
  },
  cancelButton: {
    backgroundColor: '#64748b',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 0,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});