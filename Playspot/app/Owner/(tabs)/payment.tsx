import { MaterialIcons as Icon } from '@expo/vector-icons';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import HeaderComponent from '../../../components/HeaderComponent';
import { OwnerPaymentSkeleton } from '../../../components/ui/OwnerPaymentSkeleton';
import { auth, db } from '../../../firebaseconfig';

const { width } = Dimensions.get('window');

interface OwnerData {
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
}

interface MobilePaymentDetails {
  phoneNumber: string;
  accountTitle: string;
  enabled: boolean;
  lastUpdated?: string;
}

interface BankDetails {
  accountNumber: string;
  accountTitle: string;
  bankName: string;
  iban: string;
  enabled: boolean;
  lastUpdated?: string;
}

interface PaymentMethods {
  jazzcash?: MobilePaymentDetails;
  easypaisa?: MobilePaymentDetails;
  bank?: BankDetails;
}

interface PaymentMethodConfig {
  id: keyof PaymentMethods;
  name: string;
  icon: keyof typeof Icon.glyphMap;
  color: string;
  description: string;
  details: MobilePaymentDetails | BankDetails;
  setDetails: React.Dispatch<React.SetStateAction<any>>;
  enabled: boolean;
}

const PaymentMethodScreen = () => {
  const [selectedMethod, setSelectedMethod] = useState<keyof PaymentMethods | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userPaymentMethods, setUserPaymentMethods] = useState<PaymentMethods>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
  const [activeTab, setActiveTab] = useState<'methods' | 'active'>('methods');

  // Initialize with empty details
  const [jazzCashDetails, setJazzCashDetails] = useState<MobilePaymentDetails>({
    phoneNumber: '',
    accountTitle: '',
    enabled: false
  });
  
  const [easyPaisaDetails, setEasyPaisaDetails] = useState<MobilePaymentDetails>({
    phoneNumber: '',
    accountTitle: '',
    enabled: false
  });
  
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountNumber: '',
    accountTitle: '',
    bankName: '',
    iban: '',
    enabled: false
  });

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      loadOwnerData();
      loadPaymentMethods();
    }
  }, [user]);

  const loadOwnerData = async () => {
    if (!user) return;
    
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setOwnerData(docSnap.data() as OwnerData);
      }
    } catch (error) {
      console.error('Error loading owner data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load owner data',
      });
    }
  };

  const loadPaymentMethods = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const docRef = doc(db, 'owner_payment_methods', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as PaymentMethods;
        setUserPaymentMethods(data);
        
        // Update local states with saved data
        if (data.jazzcash) {
          setJazzCashDetails(data.jazzcash);
        }
        if (data.easypaisa) {
          setEasyPaisaDetails(data.easypaisa);
        }
        if (data.bank) {
          setBankDetails(data.bank);
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load payment methods',
      });
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods: PaymentMethodConfig[] = [
    {
      id: 'jazzcash',
      name: 'JazzCash',
      icon: 'smartphone',
      color: '#F15A24',
      description: 'Receive payments via JazzCash mobile wallet',
      details: jazzCashDetails,
      setDetails: setJazzCashDetails,
      enabled: jazzCashDetails.enabled
    },
    {
      id: 'easypaisa',
      name: 'EasyPaisa',
      icon: 'smartphone',
      color: '#00A651',
      description: 'Receive payments via EasyPaisa mobile wallet',
      details: easyPaisaDetails,
      setDetails: setEasyPaisaDetails,
      enabled: easyPaisaDetails.enabled
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: 'account-balance',
      color: '#663399',
      description: 'Direct bank transfers to your account',
      details: bankDetails,
      setDetails: setBankDetails,
      enabled: bankDetails.enabled
    }
  ];

  const handleSave = async () => {
    if (!selectedMethod || !user) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a payment method',
      });
      return;
    }

    const method = paymentMethods.find(m => m.id === selectedMethod);
    
    if (!method) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Invalid payment method',
      });
      return;
    }
    
    // Validation
    if (method.id === 'jazzcash' || method.id === 'easypaisa') {
      const mobileDetails = method.details as MobilePaymentDetails;
      if (!mobileDetails.phoneNumber || !mobileDetails.accountTitle) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please fill all required fields',
        });
        return;
      }
      if (!/^03\d{9}$/.test(mobileDetails.phoneNumber)) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please enter a valid phone number (03XXXXXXXXX)',
        });
        return;
      }
    } else if (method.id === 'bank') {
      const bankDetails = method.details as BankDetails;
      if (!bankDetails.accountNumber || !bankDetails.accountTitle || 
          !bankDetails.bankName || !bankDetails.iban) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: 'Please fill all required fields',
        });
        return;
      }
    }

    setSaving(true);
    try {
      const userDocRef = doc(db, 'owner_payment_methods', user.uid);
      
      // Prepare update data
      const updateData: PaymentMethods = {
        ...userPaymentMethods,
        [method.id]: {
          ...method.details,
          enabled: true,
          lastUpdated: new Date().toISOString()
        }
      };

      // Update Firestore
      await setDoc(userDocRef, {
        ...updateData,
        ownerId: user.uid,
        ownerName: ownerData?.name || 'Owner',
        ownerEmail: ownerData?.email || '',
        ownerPhone: ownerData?.phone || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Update local state
      method.setDetails({...method.details, enabled: true});
      
      // Update userPaymentMethods
      setUserPaymentMethods(updateData);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `${method.name} configured successfully!`,
      });
      setModalVisible(false);
      setActiveTab('active');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save payment method',
      });
      console.error('Error saving payment method:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleMethod = async (methodId: keyof PaymentMethods, value: boolean) => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'owner_payment_methods', user.uid);
      const method = paymentMethods.find(m => m.id === methodId);
      
      if (!method) return;
      
      if (value) {
        // If enabling, show the form
        setSelectedMethod(methodId);
        setModalVisible(true);
      } else {
        // If disabling, update Firestore
        const updateData: PaymentMethods = {
          ...userPaymentMethods,
          [methodId]: {
            ...userPaymentMethods[methodId] as any,
            enabled: false
          }
        };
        
        await setDoc(userDocRef, updateData, { merge: true });
        
        // Update local state
        method.setDetails({...method.details, enabled: false});
        
        // Update userPaymentMethods
        setUserPaymentMethods(updateData);
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `${method.name} has been disabled`,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update payment method',
      });
      console.error('Error toggling payment method:', error);
    }
  };

  const renderMethodForm = () => {
    if (!selectedMethod) return null;
    
    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (!method) return null;

    return (
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <View style={[styles.methodIconLarge, { backgroundColor: method.color }]}>
            { (method.id === 'jazzcash' || method.id === 'easypaisa') ? (
              <Image 
                source={method.id === 'jazzcash' ? require('../../../assets/images/jazz.png') : require('../../../assets/images/easypaisa.png')} 
                style={{ width: 32, height: 32 }} 
                resizeMode="contain" 
              />
            ) : (
              <Icon name={method.icon} size={32} color="white" />
            )}
          </View>
          <Text style={styles.formTitle}>Setup {method.name}</Text>
          <Text style={styles.formSubtitle}>Enter your account details to receive payments</Text>
        </View>
        
        <View style={styles.formContent}>
          {method.id === 'jazzcash' || method.id === 'easypaisa' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="03XXXXXXXXX"
                  keyboardType="phone-pad"
                  value={(method.details as MobilePaymentDetails).phoneNumber}
                  onChangeText={(text) => method.setDetails({...method.details, phoneNumber: text})}
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.inputHint}>Enter your 11-digit mobile number</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Holder Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name as registered"
                  value={(method.details as MobilePaymentDetails).accountTitle}
                  onChangeText={(text) => method.setDetails({...method.details, accountTitle: text})}
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.inputHint}>Name must match your account registration</Text>
              </View>
            </>
          ) : null}
          
          {method.id === 'bank' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bank Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your bank name"
                  value={(method.details as BankDetails).bankName}
                  onChangeText={(text) => method.setDetails({...method.details, bankName: text})}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Holder Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter account holder name"
                  value={(method.details as BankDetails).accountTitle}
                  onChangeText={(text) => method.setDetails({...method.details, accountTitle: text})}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter account number"
                  keyboardType="numeric"
                  value={(method.details as BankDetails).accountNumber}
                  onChangeText={(text) => method.setDetails({...method.details, accountNumber: text})}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>IBAN Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="PKXX XXXX XXXX XXXX XXXX XXXX"
                  value={(method.details as BankDetails).iban}
                  onChangeText={(text) => method.setDetails({...method.details, iban: text})}
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.inputHint}>24-character IBAN number</Text>
              </View>
            </>
          ) : null}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, {backgroundColor: method.color}]} 
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Icon name="check" size={20} color="white" />
                  <Text style={styles.saveButtonText}>Save & Activate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return <OwnerPaymentSkeleton />;
  }

  const activeMethodsCount = Object.keys(userPaymentMethods).filter(key => 
    userPaymentMethods[key as keyof PaymentMethods]?.enabled).length;

  return (
    <View style={styles.container}>
      <HeaderComponent
        title="Payment Methods"
        subtitle="Manage how you receive payments"
        iconName="card-outline"
      />
      
      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
            <Icon name="payments" size={24} color="#3B82F6" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statNumber}>{activeMethodsCount}</Text>
            <Text style={styles.statLabel}>Active Methods</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
            <Icon name="security" size={24} color="#10B981" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statNumber}>{paymentMethods.length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'methods' && styles.activeTab]}
          onPress={() => setActiveTab('methods')}
        >
          <Text style={[styles.tabText, activeTab === 'methods' && styles.activeTabText]}>
            Available Methods
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <View style={styles.tabWithBadge}>
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
              Active Methods
            </Text>
            {activeMethodsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeMethodsCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'methods' ? (
          <View style={styles.methodsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Payment Methods</Text>
              <Text style={styles.sectionSubtitle}>
                Choose and configure your preferred payment methods to start receiving payments
              </Text>
            </View>
            
            <View style={styles.methodsGrid}>
              {paymentMethods.map((method) => (
                <View key={method.id} style={styles.methodCard}>
                  <View style={styles.methodHeader}>
                    <View style={[styles.methodIcon, { backgroundColor: `${method.color}15` }]}>
                      { (method.id === 'jazzcash' || method.id === 'easypaisa') ? (
                        <Image 
                          source={method.id === 'jazzcash' ? require('../../../assets/images/jazz.png') : require('../../../assets/images/easypaisa.png')} 
                          style={{ width: 24, height: 24 }} 
                          resizeMode="contain" 
                        />
                      ) : (
                        <Icon name={method.icon} size={24} color={method.color} />
                      )}
                    </View>
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodName}>{method.name}</Text>
                      <Text style={styles.methodDescription}>{method.description}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.methodActions}>
                    <View style={styles.switchContainer}>
                      <Text style={styles.switchLabel}>
                        {method.enabled ? 'Enabled' : 'Disabled'}
                      </Text>
                      <Switch
                        value={method.enabled}
                        onValueChange={(value) => toggleMethod(method.id, value)}
                        trackColor={{ false: '#E2E8F0', true: `${method.color}40` }}
                        thumbColor={method.enabled ? method.color : '#F8FAFC'}
                      />
                    </View>
                    {!method.enabled && (
                      <TouchableOpacity 
                        style={[styles.setupButton, { borderColor: method.color }]}
                        onPress={() => {
                          setSelectedMethod(method.id);
                          setModalVisible(true);
                        }}
                      >
                        <Text style={[styles.setupButtonText, { color: method.color }]}>
                          Setup
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.infoCard}>
              <Icon name="info" size={20} color="#3B82F6" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Secure Payment Processing</Text>
                <Text style={styles.infoText}>
                  All payment methods are securely encrypted and processed. Your financial information is protected.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.activeSection}>
            {activeMethodsCount === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIllustration}>
                  <Icon name="account-balance-wallet" size={80} color="#E2E8F0" />
                </View>
                <Text style={styles.emptyTitle}>No Active Payment Methods</Text>
                <Text style={styles.emptySubtitle}>
                  You haven't activated any payment methods yet. Setup your first method to start receiving payments.
                </Text>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={() => {
                    setActiveTab('methods');
                    setSelectedMethod('jazzcash');
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.primaryButtonText}>Setup Payment Method</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.activeMethods}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Active Payment Methods</Text>
                  <Text style={styles.sectionSubtitle}>
                    Manage your configured payment methods and account details
                  </Text>
                </View>
                
                {Object.keys(userPaymentMethods)
                  .filter(key => userPaymentMethods[key as keyof PaymentMethods]?.enabled)
                  .map(key => {
                    const methodKey = key as keyof PaymentMethods;
                    const method = userPaymentMethods[methodKey];
                    const methodInfo = paymentMethods.find(m => m.id === methodKey);
                    
                    if (!method) return null;
                    
                    return (
                      <View key={key} style={styles.activeMethodCard}>
                        <View style={styles.activeMethodHeader}>
                          <View style={styles.activeMethodLeft}>
                            <View style={[styles.activeMethodIcon, { backgroundColor: `${methodInfo?.color}15` }]}>
                              { (methodKey === 'jazzcash' || methodKey === 'easypaisa') ? (
                                <Image 
                                  source={methodKey === 'jazzcash' ? require('../../../assets/images/jazz.png') : require('../../../assets/images/easypaisa.png')} 
                                  style={{ width: 20, height: 20 }} 
                                  resizeMode="contain" 
                                />
                              ) : (
                                <Icon name={methodInfo?.icon || 'payment'} size={20} color={methodInfo?.color} />
                              )}
                            </View>
                            <View>
                              <Text style={styles.activeMethodName}>{methodInfo?.name}</Text>
                              <Text style={styles.activeMethodStatus}>
                                <View style={styles.statusDot} />
                                Active • Updated {method.lastUpdated ? new Date(method.lastUpdated).toLocaleDateString() : 'recently'}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => {
                              setSelectedMethod(methodKey);
                              setModalVisible(true);
                            }}
                          >
                            <Icon name="edit" size={20} color="#64748B" />
                          </TouchableOpacity>
                        </View>
                        
                        <View style={styles.methodDetails}>
                          {(methodKey === 'jazzcash' || methodKey === 'easypaisa') && 'phoneNumber' in method ? (
                            <>
                              <DetailRow label="Phone Number" value={method.phoneNumber} />
                              <DetailRow label="Account Holder" value={method.accountTitle} />
                            </>
                          ) : null}
                          
                          {methodKey === 'bank' && 'bankName' in method ? (
                            <>
                              <DetailRow label="Bank Name" value={method.bankName} />
                              <DetailRow label="Account Holder" value={method.accountTitle} />
                              <DetailRow label="Account Number" value={method.accountNumber} />
                              <DetailRow label="IBAN Number" value={method.iban} />
                            </>
                          ) : null}
                        </View>
                        
                        <TouchableOpacity 
                          style={styles.disableButton}
                          onPress={() => toggleMethod(methodKey, false)}
                        >
                          <Icon name="block" size={16} color="#EF4444" />
                          <Text style={styles.disableButtonText}>Disable Method</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Configuration Modal */}
      <Modal
        animationType="slide"
        statusBarTranslucent={true}
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure Payment Method</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {renderMethodForm()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

// Helper component for detail rows
const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#1E293B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: 'white',
  },
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },

  // Section Styles
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },

  // Methods Section
  methodsSection: {
    paddingTop: 8,
  },
  methodsGrid: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  methodCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  methodActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  setupButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  setupButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },

  // Active Methods Section
  activeSection: {
    paddingTop: 8,
  },
  activeMethods: {
    gap: 16,
    paddingHorizontal: 20,
  },
  activeMethodCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activeMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activeMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeMethodName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  activeMethodStatus: {
    fontSize: 12,
    color: '#64748B',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  methodDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  disableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  disableButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIllustration: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Form Styles
  formContainer: {
    backgroundColor: 'white',
  },
  formHeader: {
    alignItems: 'center',
    padding: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  methodIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  formContent: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
  inputHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 0,
  },
});

export default PaymentMethodScreen;