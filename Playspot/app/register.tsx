import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { auth, db } from '../firebaseconfig';

const { width, height } = Dimensions.get('window');

const Register = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [role, setRole] = useState<'owner' | 'player' | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const bounceValue = useSharedValue(0);

  // Password validation states
  const [isLengthValid, setIsLengthValid] = useState(false);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);

  useEffect(() => {
    setIsLengthValid(password.length >= 8);
    setHasUppercase(/[A-Z]/.test(password));
    setHasLowercase(/[a-z]/.test(password));
    setHasNumber(/\d/.test(password));
    setHasSpecialChar(/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password));
  }, [password]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  };

  const validatePassword = (password: string) => {
    const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;
    return re.test(password);
  };

  const onRegister = async () => {
    if (!role) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a role: Facility Owner or Player',
      });
      return;
    }
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter your name',
      });
      return;
    }
    if (!validateEmail(email)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid email address',
      });
      return;
    }
    if (!validatePassword(password)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Password must be at least 8 characters and include a capital letter, number, and symbol',
      });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Passwords do not match',
      });
      return;
    }

    setLoading(true);
    bounceValue.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 300 })
    );

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        role,
        approvalStatus: role === 'owner' ? 'pending' : 'approved',
        emailVerified: false,
        ...(role === 'owner' && {
          approved: false,
          rejectionReason: '',
          rejectedAt: null,
          approvedAt: null,
          documentsUploaded: false
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await sendEmailVerification(user);
      
      setLoading(false);
      
      if (role === 'owner') {
        router.push({
          pathname: '/document-upload',
          params: { 
            userId: user.uid,
            isEditMode: 'false'
          }
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Registration successful! Please check your email to verify your account before logging in.',
        });
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error: any) {
      setLoading(false);
      let errorMessage = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      Toast.show({
        type: 'error',
        text1: 'Registration Error',
        text2: errorMessage,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceValue.value * -15 }]
  }));

  return (
    <LinearGradient colors={['#0f172a', '#2859caff']} style={styles.container}>
      
      {/* Static Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
        
        {/* Static Sports Icons */}
        <Ionicons name="basketball" size={28} color="rgba(255, 255, 255, 0.3)" style={[styles.staticIcon, styles.icon1]} />
        <Ionicons name="tennisball" size={28} color="rgba(255, 255, 255, 0.3)" style={[styles.staticIcon, styles.icon2]} />
        <Ionicons name="football" size={28} color="rgba(255, 255, 255, 0.3)" style={[styles.staticIcon, styles.icon3]} />
      </View>
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.content, animatedStyle]}>
            
            {/* Header Section */}
            <View style={styles.header}>
               <View style={styles.logoContainer}>
                           <View style={styles.iconCircle}>
                             <Ionicons name="game-controller" size={width > 600 ? 80 : 60} color="#fff" />
                           </View>
          
                <Text style={styles.appName}>INDOOR SPORTS HUB</Text>
                <Text style={styles.tagline}>Join Our Sports Community</Text>
              </View>
            </View>

            {/* Registration Form Section */}
            <View style={styles.formContainer}>
              <LinearGradient
                colors={['white', 'white']}
                style={styles.formGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.formHeader}>
                  <Text style={styles.welcomeText}>Create Account</Text>
                  <Text style={styles.subtitle}>Sign up to continue your sports journey</Text>
                </View>

                {/* Improved Role Selection */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>I am a...</Text>
                  <View style={styles.roleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        role === 'player' && styles.roleButtonActive,
                      ]}
                      onPress={() => setRole('player')}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={role === 'player' ? ['#1e293b', '#5a5de5ff'] : ['#f8f9fa', '#e9ecef']}
                        style={styles.roleButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons
                          name="person-outline"
                          size={24}
                          color={role === 'player' ? '#fff' : '#666'}
                          style={styles.roleIcon}
                        />
                        <Text style={[
                          styles.roleButtonText,
                          role === 'player' && styles.roleButtonTextActive
                        ]}>
                          Player
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        role === 'owner' && styles.roleButtonActive,
                      ]}
                      onPress={() => setRole('owner')}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={role === 'owner' ? ['#1e293b', '#5a5de5ff'] : ['#f8f9fa', '#e9ecef']}
                        style={styles.roleButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons
                          name="business-outline"
                          size={24}
                          color={role === 'owner' ? '#fff' : '#666'}
                          style={styles.roleIcon}
                        />
                        <Text style={[
                          styles.roleButtonText,
                          role === 'owner' && styles.roleButtonTextActive
                        ]}>
                          Facility Owner
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={[styles.inputWrapper, focusedInput === 'name' && styles.inputWrapperFocused]}>
                      <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your full name"
                        placeholderTextColor="#999"
                        onFocus={() => setFocusedInput('name')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputWrapperFocused]}>
                      <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        placeholderTextColor="#999"
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputWrapperFocused]}>
                      <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        secureTextEntry={!passwordVisible}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Create a password"
                        placeholderTextColor="#999"
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setPasswordVisible(!passwordVisible)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                    {focusedInput === 'password' && (
                      <View style={styles.validationContainer}>
                        <Text style={[styles.validationText, isLengthValid ? styles.valid : styles.invalid]}>
                          • At least 8 characters
                        </Text>
                        <Text style={[styles.validationText, hasUppercase ? styles.valid : styles.invalid]}>
                          • Contains uppercase letter
                        </Text>
                        <Text style={[styles.validationText, hasLowercase ? styles.valid : styles.invalid]}>
                          • Contains lowercase letter
                        </Text>
                        <Text style={[styles.validationText, hasNumber ? styles.valid : styles.invalid]}>
                          • Contains number
                        </Text>
                        <Text style={[styles.validationText, hasSpecialChar ? styles.valid : styles.invalid]}>
                          • Contains special character
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={[styles.inputWrapper, focusedInput === 'confirmPassword' && styles.inputWrapperFocused]}>
                      <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        secureTextEntry={!confirmPasswordVisible}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm your password"
                        placeholderTextColor="#999"
                        onFocus={() => setFocusedInput('confirmPassword')}
                        onBlur={() => setFocusedInput(null)}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {role === 'owner' && (
                  <View style={styles.noteContainer}>
                    <Ionicons name="information-circle-outline" size={18} color="#f16363ff" />
                    <Text style={styles.noteText}>
                      Facility owners need to upload verification documents after registration
                    </Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.registerButton, loading && styles.buttonDisabled]} 
                  onPress={onRegister} 
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient 
                    colors={loading ? ['#ccc', '#bbb'] : ['#8b5cf6', '#1e293b']} 
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.buttonText}>CREATING ACCOUNT...</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footerLinks}>
                  <TouchableOpacity 
                    onPress={() => router.push('/login')} 
                    style={styles.linkButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.linkText}>
                      Already have an account? <Text style={styles.linkTextBold}>Sign in here</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '30%',
    opacity: 0.8,
  },
  backgroundElements: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.1,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: '#4f46e5',
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    bottom: -50,
    left: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    backgroundColor: '#4f46e5',
    top: '40%',
    left: '20%',
  },
  staticIcon: {
    position: 'absolute',
    zIndex: 1,
    opacity: 0.4,
  },
  icon1: {
    top: '20%',
    left: '10%',
  },
  icon2: {
    top: '60%',
    right: '15%',
  },
  icon3: {
    top: '30%',
    right: '20%',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: width > 600 ? 0 : 0,
  },
  content: {
    width: '100%',
    maxWidth: width > 600 ? 500 : 400,
    alignSelf: 'center',
    zIndex: 20,
  },
  
  header: {
    alignItems: 'center',
       marginTop: 20,
  },
 logoContainer: {
    alignItems: 'center',
    marginBottom: width > 600 ? 40 : 30,
  },
  iconCircle: {
    width: width > 600 ? 120 : 100,
    height: width > 600 ? 120 : 100,
    borderRadius: width > 600 ? 60 : 50,
    backgroundColor: '#ffffff48',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  appName: {
    fontSize: width > 600 ? 32 : 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  tagline: {
    fontSize: width > 600 ? 16 : 14,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  formGradient: {
    padding: width > 600 ? 30 : 25,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  welcomeText: {
    fontSize: width > 600 ? 28 : 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: width > 600 ? 16 : 14,
    color: '#666',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: width > 600 ? 16 : 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    marginLeft: 5,
  },
  // Improved Role Selection Styles
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 5,
  },
  roleButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 70, // Reduced height for compact look
  },
  roleButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    gap: 0,
  },
  roleButtonActive: {
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  roleIcon: {
    marginRight: 8,
  },
  roleButtonText: {
    fontSize: width > 600 ? 16 : 14,
    fontWeight: '600',
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: '#1e293b',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  inputIcon: {
    padding: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: width > 600 ? 16 : 14,
    color: '#333',
    paddingLeft: 0,
  },
  eyeIcon: {
    padding: 15,
  },
  validationContainer: {
    marginTop: 8,
    marginLeft: 5,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  validationText: {
    fontSize: width > 600 ? 14 : 12,
    marginBottom: 2,
  },
  valid: {
    color: '#28a745',
    fontWeight: '600',
  },
  invalid: {
    color: '#dc3545',
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonGradient: {
    padding: width > 600 ? 18 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: width > 600 ? 16 : 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe1e1ff',
    borderLeftWidth: 4,
    borderLeftColor: '#ff0a0aff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  noteText: {
    marginLeft: 8,
    fontSize: width > 600 ? 14 : 12,
    color: '#f16363ff',
    flex: 1,
    fontWeight: '500',
  },
  footerLinks: {
    alignItems: 'center',
  },
  linkButton: {
    padding: 10,
  },
  linkText: {
    color: '#666',
    fontSize: width > 600 ? 15 : 13,
    textAlign: 'center',
  },
  linkTextBold: {
    color: '#1e293b',
    fontWeight: 'bold',
  },
});

export default Register;