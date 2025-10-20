import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { auth, db } from '../firebaseconfig';

const { width, height } = Dimensions.get('window');

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dg5fojcpg';
const CLOUDINARY_UPLOAD_PRESET = 'app_uploads';

const uploadToCloudinary = async (imageUri: string, folder: string): Promise<string> => {
  try {
    if (!imageUri) {
      throw new Error('No image selected');
    }

    const formData = new FormData();
    const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = fileExtension === 'jpg' ? 'jpeg' : fileExtension;
    const fileName = `${folder}_${Date.now()}.${fileExtension}`;
    
    formData.append('file', {
      uri: imageUri,
      type: `image/${mimeType}`,
      name: fileName,
    } as any);
    
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

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

const DocumentUploadScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const isEditMode = params.isEditMode === 'true';
  const retryMode = params.retry === 'true';
  
  const [cnicFrontImage, setCnicFrontImage] = useState<string | null>(null);
  const [cnicBackImage, setCnicBackImage] = useState<string | null>(null);
  const [groundImages, setGroundImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // New fields for ground information
  const [groundName, setGroundName] = useState('');
  const [groundLocation, setGroundLocation] = useState('');

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        // Determine the correct user ID
        let targetUserId = userId;
        
        if (retryMode || isEditMode) {
          // For retry/edit mode, use the currently logged-in user
          const currentUser = auth.currentUser;
          if (currentUser) {
            targetUserId = currentUser.uid;
          } else {
            Toast.show({
              type: 'error',
              text1: 'Authentication Error',
              text2: 'Please log in again'
            });
            router.push('/login');
            return;
          }
        }

        if (!targetUserId) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'User ID not found'
          });
          router.back();
          return;
        }

        setEffectiveUserId(targetUserId);

        // Load existing documents if in edit/retry mode
        if (isEditMode || retryMode) {
          try {
            const userDoc = await getDoc(doc(db, 'users', targetUserId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setCnicFrontImage(userData.cnicFrontImage || null);
              setCnicBackImage(userData.cnicBackImage || null);
              setGroundImages(userData.groundImages || []);
              setGroundName(userData.groundName || '');
              setGroundLocation(userData.groundLocation || '');
            }
          } catch (error) {
            console.error('Error loading existing documents:', error);
          }
        }
      } catch (error) {
        console.error('Error initializing screen:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load screen'
        });
      } finally {
        setLoading(false);
      }
    };

    initializeScreen();
  }, [userId, isEditMode, retryMode, router]);

  const pickImage = async (type: 'cnicFront' | 'cnicBack' | 'ground') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission required',
          text2: 'Sorry, we need camera roll permissions to make this work!'
        });
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'ground' ? [16, 9] : [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        if (type === 'cnicFront') {
          setCnicFrontImage(selectedImage.uri);
        } else if (type === 'cnicBack') {
          setCnicBackImage(selectedImage.uri);
        } else {
          if (groundImages.length < 5) {
            setGroundImages([...groundImages, selectedImage.uri]);
          } else {
            Toast.show({
              type: 'error',
              text1: 'Limit Reached',
              text2: 'You can upload maximum 5 ground images'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick image'
      });
    }
  };

  const removeGroundImage = (index: number) => {
    const newImages = groundImages.filter((_, i) => i !== index);
    setGroundImages(newImages);
  };

  const handleUpload = async () => {
    // Validate required fields
    if (!groundName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please enter your ground name'
      });
      return;
    }

    if (!groundLocation.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please enter your ground location'
      });
      return;
    }

    if (!cnicFrontImage || !cnicBackImage || groundImages.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Missing Documents',
        text2: 'Please upload CNIC front, back, and at least one ground image'
      });
      return;
    }

    if (!effectiveUserId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User ID not found'
      });
      return;
    }

    setUploadingImages(true);

    try {
      // Upload all images to Cloudinary
      const cnicFrontUrl = await uploadToCloudinary(cnicFrontImage, 'cnic');
      const cnicBackUrl = await uploadToCloudinary(cnicBackImage, 'cnic');
      
      const groundUrls = [];
      for (let i = 0; i < groundImages.length; i++) {
        const url = await uploadToCloudinary(groundImages[i], 'grounds');
        groundUrls.push(url);
      }

      // Prepare update data
      const updateData: any = {
        cnicFrontImage: cnicFrontUrl,
        cnicBackImage: cnicBackUrl,
        groundImages: groundUrls,
        groundName: groundName.trim(),
        groundLocation: groundLocation.trim(),
        documentsUploaded: true,
        updatedAt: new Date(),
      };

      // If this is a retry, reset approval status
      if (retryMode) {
        updateData.approvalStatus = 'pending';
        updateData.rejectionReason = '';
        updateData.rejectedAt = null;
      }

      // Update user document with uploaded images in Firebase
      await updateDoc(doc(db, 'users', effectiveUserId), updateData);

      setUploadingImages(false);
      setShowCompletionScreen(true);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: retryMode || isEditMode
          ? 'Documents and ground information updated successfully! Your account is pending admin approval.'
          : 'Registration and document upload successful! Your account is pending admin approval.'
      });
    } catch (error) {
      setUploadingImages(false);
      console.error('Error uploading documents:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Error',
        text2: 'Failed to upload documents. Please try again.'
      });
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Upload?',
      'You can upload your documents later from your profile. Your account will remain pending until documents are uploaded.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Skip',
          onPress: () => {
            if (retryMode || isEditMode) {
              router.back();
            } else {
              router.push('/login');
            }
          }
        }
      ]
    );
  };

  const handleComplete = () => {
    if (retryMode || isEditMode) {
      // Go back to previous screen or to profile
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/Owner/(tabs)/profile');
      }
    } else {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5e72e4" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showCompletionScreen) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.completionContainer}>
          <View style={styles.completionIconContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
          </View>

          <Text style={styles.completionTitle}>
            {retryMode || isEditMode ? 'Documents Updated!' : 'Registration Complete!'}
          </Text>

          <Text style={styles.completionMessage}>
            {retryMode || isEditMode
              ? 'Your documents and ground information have been successfully updated and are pending admin review.'
              : 'Your registration and document upload was successful! Your account is now pending admin approval.'
            }
          </Text>

          <View style={styles.completionActions}>
            <TouchableOpacity
              style={styles.completionButton}
              onPress={handleComplete}
            >
              <Text style={styles.completionButtonText}>
                {retryMode || isEditMode ? 'Back to Profile' : 'Continue to Login'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isEditFlow = retryMode || isEditMode;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {isEditFlow ? 'Update Documents' : 'Verification Documents'}
        </Text>
        
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Progress Steps - Only show for registration flow */}
        {!isEditFlow && (
          <View style={styles.progressContainer}>
            <View style={styles.progressStep}>
              <View style={[styles.progressIcon, styles.progressCompleted]}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
              <Text style={styles.progressText}>Account Created</Text>
            </View>

            <View style={styles.progressLine} />

            <View style={styles.progressStep}>
              <View style={[styles.progressIcon, styles.progressCurrent]}>
                <Text style={styles.progressNumber}>2</Text>
              </View>
              <Text style={[styles.progressText, styles.progressTextCurrent]}>Upload Documents</Text>
            </View>
          </View>
        )}

        {/* Ground Information Section */}
        <View style={styles.groundInfoSection}>
          <Text style={styles.sectionTitle}>Ground Information</Text>
          
          {/* Ground Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Ground Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your ground name"
              placeholderTextColor="#999"
              value={groundName}
              onChangeText={setGroundName}
              maxLength={100}
            />
            <Text style={styles.charCount}>{groundName.length}/100</Text>
          </View>

          {/* Ground Location Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Ground Location *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Enter complete ground address and location"
              placeholderTextColor="#999"
              value={groundLocation}
              onChangeText={setGroundLocation}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
            />
            <Text style={styles.charCount}>{groundLocation.length}/200</Text>
          </View>
        </View>

        {/* CNIC Front */}
        <View style={styles.uploadSection}>
          <Text style={styles.uploadLabel}>CNIC Front Side *</Text>
          <Text style={styles.uploadHint}>Clear image of the front side of your CNIC</Text>
          <TouchableOpacity
            style={[styles.imageUploadButton, cnicFrontImage && styles.imageUploadButtonSuccess]}
            onPress={() => pickImage('cnicFront')}
          >
            <View style={styles.uploadButtonContent}>
              <Ionicons
                name={cnicFrontImage ? "checkmark-circle" : "document-outline"}
                size={28}
                color={cnicFrontImage ? "#4CAF50" : "#5e72e4"}
              />
              <Text style={[styles.imageUploadText, cnicFrontImage && styles.imageUploadTextSuccess]}>
                {cnicFrontImage ? "Uploaded Successfully" : "Upload CNIC Front"}
              </Text>
            </View>
          </TouchableOpacity>
          {cnicFrontImage && (
            <Image source={{ uri: cnicFrontImage }} style={styles.previewImage} />
          )}
        </View>

        {/* CNIC Back */}
        <View style={styles.uploadSection}>
          <Text style={styles.uploadLabel}>CNIC Back Side *</Text>
          <Text style={styles.uploadHint}>Clear image of the back side of your CNIC</Text>
          <TouchableOpacity
            style={[styles.imageUploadButton, cnicBackImage && styles.imageUploadButtonSuccess]}
            onPress={() => pickImage('cnicBack')}
          >
            <View style={styles.uploadButtonContent}>
              <Ionicons
                name={cnicBackImage ? "checkmark-circle" : "document-outline"}
                size={28}
                color={cnicBackImage ? "#4CAF50" : "#5e72e4"}
              />
              <Text style={[styles.imageUploadText, cnicBackImage && styles.imageUploadTextSuccess]}>
                {cnicBackImage ? "Uploaded Successfully" : "Upload CNIC Back"}
              </Text>
            </View>
          </TouchableOpacity>
          {cnicBackImage && (
            <Image source={{ uri: cnicBackImage }} style={styles.previewImage} />
          )}
        </View>

        {/* Ground Images */}
        <View style={styles.uploadSection}>
          <Text style={styles.uploadLabel}>Ground Images *</Text>
          <Text style={styles.uploadHint}>Add up to 5 images of your sports facility</Text>

          {groundImages.length > 0 && (
            <View style={styles.imageGrid}>
              {groundImages.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.gridImage} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeGroundImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff3d00" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {groundImages.length < 5 && (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={() => pickImage('ground')}
            >
              <Ionicons name="add" size={24} color="#5e72e4" />
              <Text style={styles.addImageText}>Add Image ({groundImages.length}/5)</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.uploadButton, 
              uploadingImages && styles.buttonDisabled,
              isEditFlow ? styles.uploadButtonEdit : styles.uploadButtonNew
            ]}
            onPress={handleUpload}
            disabled={uploadingImages}
          >
            {uploadingImages ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>
                  {isEditFlow ? 'Update Documents' : 'Complete Registration'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  headerRight: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressCurrent: {
    backgroundColor: '#5e72e4',
  },
  progressNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  progressTextCurrent: {
    color: '#5e72e4',
    fontWeight: '600',
  },
  progressLine: {
    height: 2,
    width: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  // Ground Information Styles
  groundInfoSection: {
    marginBottom: 25,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  // Upload Section Styles
  uploadSection: {
    marginBottom: 25,
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 5,
  },
  uploadHint: {
    fontSize: 13,
    color: '#888',
    marginBottom: 15,
  },
  imageUploadButton: {
    backgroundColor: '#f7f9fc',
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  imageUploadButtonSuccess: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
    borderStyle: 'solid',
  },
  uploadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#5e72e4',
    fontWeight: '500',
  },
  imageUploadTextSuccess: {
    color: '#4CAF50',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  imageContainer: {
    position: 'relative',
    width: (width - 80) / 3,
    height: 100,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f9fc',
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    borderRadius: 15,
    padding: 15,
  },
  addImageText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#5e72e4',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  skipButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  skipButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    flex: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginLeft: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  uploadButtonNew: {
    backgroundColor: '#5e72e4',
    shadowColor: '#5e72e4',
  },
  uploadButtonEdit: {
    backgroundColor: '#ff6b00',
    shadowColor: '#ff6b00',
    flex: 2,
    marginLeft: 0,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  completionIconContainer: {
    marginBottom: 30,
  },
  successIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 15,
  },
  completionMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  completionActions: {
    width: '100%',
    alignItems: 'center',
  },
  completionButton: {
    backgroundColor: '#5e72e4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '80%',
    shadowColor: '#5e72e4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  completionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default DocumentUploadScreen;