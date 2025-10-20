// PaymentScreen.tsx
import HeaderComponent from '@/components/HeaderComponent';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { PaymentSkeleton } from '../../components/ui/PaymentSkeleton';
import { db } from '../../firebaseconfig';

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
    const fileName = `payment_${Date.now()}.${fileExtension}`;
    
    formData.append('file', {
      uri: imageUri,
      type: `image/${mimeType}`,
      name: fileName,
    } as any);
    
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'payment_screenshots');

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
      console.error('Cloudinary response error:', responseData);
      throw new Error(responseData.error?.message || `Upload failed with status ${response.status}`);
    }

    if (!responseData.secure_url) {
      throw new Error('No secure URL returned from Cloudinary');
    }

    return responseData.secure_url;

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Cloudinary upload error:', error.message);
      throw new Error(`Failed to upload image: ${error.message}`);
    } else {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image: Unknown error');
    }
  }
};

export default function PaymentScreen() {
  const router = useRouter();
  const { bookingId, groundId, date, time, totalAmount, groundName, ownerId } = useLocalSearchParams();
  const auth = getAuth();
  const user = auth.currentUser;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const animation = React.useRef(new Animated.Value(0)).current;
  
  // Fix for TypeScript error - handle both string and string[] types
  const [price, setPrice] = useState(() => {
    if (!totalAmount) return 0;
    const amount = Array.isArray(totalAmount) ? totalAmount[0] : totalAmount;
    return parseInt(amount);
  });
  
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [ownerPaymentMethods, setOwnerPaymentMethods] = useState<any>({});
  const [screenshotModalVisible, setScreenshotModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [selectedMethodDetails, setSelectedMethodDetails] = useState<any>(null);
  const [ownerInfo, setOwnerInfo] = useState<any>({});
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');

  // Payment methods with Expo vector icons
  const paymentMethods = [
    {
      id: 'jazzcash',
      name: 'JazzCash',
      icon: <Image source={require('../../assets/images/jazz.png')} style={{ width: 32, height: 32, resizeMode: 'contain' }} />,
      color: '#f15a24',
      description: 'Pay with JazzCash wallet'
    },
    {
      id: 'easypaisa',
      name: 'EasyPaisa',
      icon: <Image source={require('../../assets/images/easypaisa.png')} style={{ width: 28, height: 28, resizeMode: 'contain' }} />,
      color: '#2baae1',
      description: 'Pay with EasyPaisa account'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: <MaterialIcons name="account-balance" size={32} color="#663399" />,
      color: '#663399',
      description: 'Direct bank transfer'
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!groundId) return;

        // Ensure groundId is a string
        const groundIdStr = Array.isArray(groundId) ? groundId[0] : groundId;
        const ownerIdStr = Array.isArray(ownerId) ? ownerId[0] : ownerId;

        const groundDoc = await getDoc(doc(db, 'grounds', groundIdStr));
        if (groundDoc.exists()) {
          const groundData = groundDoc.data();
          setAddress(groundData.address || '');

          // Fetch owner's payment methods using the ownerId from params
          if (ownerIdStr) {
            try {
              const ownerPaymentMethodsDoc = await getDoc(doc(db, 'owner_payment_methods', ownerIdStr));

              if (ownerPaymentMethodsDoc.exists()) {
                const methodsData = ownerPaymentMethodsDoc.data();
                setOwnerPaymentMethods(methodsData || {});

                // Fetch owner info
                const ownerDoc = await getDoc(doc(db, 'users', ownerIdStr));
                if (ownerDoc.exists()) {
                  setOwnerInfo(ownerDoc.data());
                }
              } else {
                setOwnerPaymentMethods({});
              }
            } catch (docError) {
              console.error('Error fetching owner payment methods document:', docError);
              setOwnerPaymentMethods({});
            }
          } else {
            setOwnerPaymentMethods({});
          }
        }

        // Fetch player info
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setPlayerName(userData.name || user.displayName || '');
              setPlayerPhone(userData.phone || user.phoneNumber || '');
            } else {
              setPlayerName(user.displayName || '');
              setPlayerPhone(user.phoneNumber || '');
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            setPlayerName(user.displayName || '');
            setPlayerPhone(user.phoneNumber || '');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load details'
        });
        setOwnerPaymentMethods({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groundId, ownerId, user]);

  // Separate useEffect for updating selected method details
  useEffect(() => {
    if (selectedPaymentMethod && ownerPaymentMethods[selectedPaymentMethod]) {
      const methodDetails = ownerPaymentMethods[selectedPaymentMethod];
      setSelectedMethodDetails(methodDetails);
    } else {
      setSelectedMethodDetails(null);
    }
  }, [selectedPaymentMethod, ownerPaymentMethods]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission required',
          text2: 'We need access to your photos to upload payment screenshot.'
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        setScreenshotUri(result.assets[0].uri);
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

  const uploadScreenshot = async () => {
    if (!screenshotUri || !transactionId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a screenshot and enter transaction ID'
      });
      return;
    }

    setUploading(true);
    try {
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(screenshotUri);
      
      // Ensure groundId is string for document ID
      const groundIdStr = Array.isArray(groundId) ? groundId[0] : groundId;
      const dateStr = Array.isArray(date) ? date[0] : date;
      const timeStr = Array.isArray(time) ? time[0] : time;
      
      // Get player info
      const playerInfo = {
        id: user?.uid,
        name: playerName || user?.displayName || '',
        email: user?.email || '',
        phone: playerPhone || user?.phoneNumber || ''
      };
      
      // Save to Firestore
      const paymentData = {
        groundId: groundIdStr,
        date: dateStr,
        time: timeStr,
        amount: price,
        paymentMethod: selectedPaymentMethod,
        transactionId,
        screenshotUrl: cloudinaryUrl,
        status: 'paid',
        createdAt: new Date().toISOString(),
        playerInfo,
        ownerInfo: {
          id: Array.isArray(ownerId) ? ownerId[0] : ownerId,
          name: ownerInfo?.name || '',
          email: ownerInfo?.email || ''
        },
        groundInfo: {
          name: Array.isArray(groundName) ? groundName[0] : groundName,
          address: address
        }
      };

      // Add to payments collection
      await setDoc(doc(db, 'payments', `${groundIdStr}_${dateStr}_${timeStr}_${user?.uid}`), paymentData);

      // Also add to ground's payment history
      await updateDoc(doc(db, 'grounds', groundIdStr), {
        payments: arrayUnion(paymentData)
      });

      // Update booking status to paid if bookingId is available
      if (bookingId) {
        const bookingIdStr = Array.isArray(bookingId) ? bookingId[0] : bookingId;
        try {
          await updateDoc(doc(db, 'bookings', bookingIdStr), {
            paymentStatus: 'paid'
          });
        } catch (bookingError) {
          console.error('Error updating booking payment status:', bookingError);
          // Don't fail the entire payment process if booking update fails
        }
      }
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Payment details submitted for verification'
      });

      setScreenshotModalVisible(false);
      router.push({
        pathname: '/Player/bookingConfirmation',
        params: {
          groundId: groundIdStr,
          date: dateStr,
          time: timeStr,
          price: price.toString(),
          address,
          status: 'pending'
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error uploading screenshot:', error.message);
      } else {
        console.error('Error uploading screenshot:', error);
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to upload payment details'
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    const ownerMethod = ownerPaymentMethods[methodId];
    if (ownerMethod && ownerMethod.enabled === true) {
      setSelectedPaymentMethod(methodId);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'This payment method is not available for this ground'
      });
    }
  };

  const handlePayment = () => {
    if (!selectedPaymentMethod) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a payment method'
      });
      return;
    }
    
    // Check if owner has this payment method enabled
    const ownerMethod = ownerPaymentMethods[selectedPaymentMethod];
    if (!ownerMethod || ownerMethod.enabled !== true) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'This payment method is not available for this ground'
      });
      return;
    }
    
    // Show screenshot upload modal
    setScreenshotModalVisible(true);
  };

  const buttonScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95]
  });

  if (loading) {
    return <PaymentSkeleton />;
  }

  return (
    
    <View style={styles.container}>

<View style={styles.gradientHeader}>

    <HeaderComponent
                 title="Pay to Play"
                 subtitle="Secure booking with instant confirmation"
                 iconName="card-outline"
               />
</View>

               <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color="#6c757d" />
            <Text style={styles.cardHeaderText}>Booking Summary</Text>
          </View>
          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={16} color="#6c757d" />
              <Text style={styles.detailText}>
                {Array.isArray(date) ? date[0] : date}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time" size={16} color="#6c757d" />
              <Text style={styles.detailText}>
                {Array.isArray(time) ? time[0] : time}
              </Text>
            </View>
            {groundName && (
              <View style={styles.detailRow}>
                <Ionicons name="location" size={16} color="#6c757d" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {Array.isArray(groundName) ? groundName[0] : groundName}
                </Text>
              </View>
            )}
            {address ? (
              <View style={styles.detailRow}>
                <Ionicons name="navigate" size={16} color="#6c757d" />
                <Text style={styles.detailText} numberOfLines={1}>{address}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amount}>Rs. {price}</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        
        <View style={styles.paymentOptions}>
          {paymentMethods.map((method) => {
            // Check if this payment method exists in owner's methods and is enabled
            const ownerMethod = ownerPaymentMethods[method.id];
            const isMethodAvailable = ownerMethod && ownerMethod.enabled === true;
            
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentCard,
                  selectedPaymentMethod === method.id && { 
                    borderColor: method.color,
                    backgroundColor: method.color + '30',
                    shadowColor: method.color,
                  },
                  !isMethodAvailable && styles.disabledPaymentCard
                ]}
                onPress={() => handlePaymentMethodSelect(method.id)}
                disabled={!isMethodAvailable}
              >
                <View style={styles.methodInfo}>
                  <View style={[styles.iconContainer, { backgroundColor: method.color + '20' }]}>
                    {method.icon}
                  </View>
                  <View style={styles.methodTextContainer}>
                    <Text style={[
                      styles.methodName,
                      !isMethodAvailable && styles.disabledMethodText
                    ]}>
                      {method.name}
                      {!isMethodAvailable && ' (Not Available)'}
                    </Text>
                    <Text style={[
                      styles.methodDescription,
                      !isMethodAvailable && styles.disabledMethodText
                    ]}>
                      {method.description}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedPaymentMethod === method.id && { 
                    backgroundColor: method.color,
                    borderColor: method.color,
                  },
                  !isMethodAvailable && styles.disabledRadioButton
                ]}>
                  {selectedPaymentMethod === method.id && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Method Details - Only shown when a method is selected */}
        {selectedPaymentMethod && selectedMethodDetails && (
          <View style={styles.selectedMethodDetails}>
            <Text style={styles.detailsTitle}>
              {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name} Payment Details
            </Text>
            
            <View style={styles.paymentInstructions}>
              <Ionicons name="information-circle-outline" size={18} color="#1e293b" />
              <Text style={styles.instructionsText}>
                Please transfer Rs. {price} to the following account and upload payment proof.
              </Text>
            </View>
            
            {(selectedPaymentMethod === 'jazzcash' || selectedPaymentMethod === 'easypaisa') && selectedMethodDetails.phoneNumber ? (
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Phone Number:</Text>
                  <Text style={styles.detailValue}>{selectedMethodDetails.phoneNumber}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Account Title:</Text>
                  <Text style={styles.detailValue}>{selectedMethodDetails.accountTitle}</Text>
                </View>
              </View>
            ) : null}
            
            {selectedPaymentMethod === 'bank' && selectedMethodDetails.bankName ? (
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Bank Name:</Text>
                  <Text style={styles.detailValue}>{selectedMethodDetails.bankName}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Account Title:</Text>
                  <Text style={styles.detailValue}>{selectedMethodDetails.accountTitle}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Account Number:</Text>
                  <Text style={styles.detailValue}>{selectedMethodDetails.accountNumber}</Text>
                </View>
                {selectedMethodDetails.iban && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>IBAN:</Text>
                    <Text style={styles.detailValue}>{selectedMethodDetails.iban}</Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        )}
        
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Secure Payment</Text>
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="lock-closed" size={20} color='#1e293b' />
              <Text style={styles.featureText}>Encrypted transaction</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={20} color='#1e293b' />
              <Text style={styles.featureText}>Verified payment methods</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity 
            style={[
              styles.payButton,
              (!selectedPaymentMethod || !ownerPaymentMethods[selectedPaymentMethod]?.enabled) && styles.payButtonDisabled
            ]} 
            onPress={handlePayment}
            disabled={!selectedPaymentMethod || !(ownerPaymentMethods[selectedPaymentMethod]?.enabled === true)}
            activeOpacity={0.9}
          >
            <View style={styles.payButtonContent}>
              <Text style={styles.payButtonText}>Pay Rs. {price}</Text>
              <View style={styles.lockContainer}>
                <Ionicons name="lock-closed" size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color="#6c757d" />
          <Text style={styles.securityText}>Your payment is secure and encrypted</Text>
        </View>
      </View>

      {/* Screenshot Upload Modal */}
      <Modal
        animationType="slide"
         transparent={false}
          statusBarTranslucent={true}
        visible={screenshotModalVisible}
        onRequestClose={() => setScreenshotModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Payment Proof</Text>
              <TouchableOpacity onPress={() => setScreenshotModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Please upload a screenshot of your payment confirmation
            </Text>
            
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              {screenshotUri ? (
    <Image
      source={{ uri: screenshotUri }}
      style={{ flex: 1, width: undefined, height: undefined }}
      resizeMode="contain"   // show whole image
    />

              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="cloud-upload" size={40} color="#6c757d" />
                  <Text style={styles.uploadText}>Tap to select screenshot</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              placeholder="Enter Transaction ID"
              value={transactionId}
              onChangeText={setTransactionId}
              placeholderTextColor="#999"
            />
            
            <TouchableOpacity 
              style={[styles.submitButton, (!screenshotUri || !transactionId) && styles.submitButtonDisabled]}
              onPress={uploadScreenshot}
              disabled={!screenshotUri || !transactionId || uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: '#f8f9fa',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
gradientHeader: {
  borderRadius: 16,
  overflow: 'hidden',
  marginBottom: 4,
  paddingVertical:0,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 5,
},
gradientBackground: {
  padding: 20,
  paddingVertical: 40,
},
headerRow: {
  flexDirection: 'row',
  alignItems: 'center',
},
headerIconCircle: {
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight:6,
},
headerTextContainer: {
  flex: 1,
},
gradientHeaderTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#fff',
  marginBottom: 0,
},
gradientHeaderSubtitle: {
  fontSize: 14,
  color: 'rgba(255, 255, 255, 0.8)',
},

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin:20
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cardHeaderText: {
    marginLeft: 8,
    color: '#6c757d',
    fontSize: 14,
  },
  bookingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: '#6c757d',
    fontSize: 14,
    flex: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  amountLabel: {
    fontSize: 16,
    color: '#6c757d',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginLeft:20
  },
  paymentOptions: {
    marginBottom: 24,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
        marginHorizontal:20
  },
  disabledPaymentCard: {
    opacity: 0.5,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 12,
    color: '#6c757d',
  },
  disabledMethodText: {
    color: '#999',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ced4da',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledRadioButton: {
    borderColor: '#e9ecef',
  },
  selectedMethodDetails: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal:20,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  paymentInstructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
  },
  detailsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal:20
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    paddingTop: 20,
  marginHorizontal:20,
  },
  payButton: {
    backgroundColor: '#1e293b',
    padding: 18,
    borderRadius: 12,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    marginBottom: 16,
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  lockContainer: {
    backgroundColor: '#1e293b',
    padding: 4,
    borderRadius: 20,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#adb5bd',
    shadowColor: '#6c757d',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  securityText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
    lineHeight: 20,
  },
  uploadButton: {
    height: 200,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 10,
    color: '#6c757d',
  },
  screenshotPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});