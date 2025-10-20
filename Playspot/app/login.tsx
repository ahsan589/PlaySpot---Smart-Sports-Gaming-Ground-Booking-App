import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

import { auth } from '../firebaseconfig';

// Import the required functions from react-native-reanimated
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Sports icons for floating animation
const sportsIcons = [
 'basketball', 'tennisball', 'football', 'baseball', 
  'american-football',
];

// Create a separate component for floating icons
const FloatingIcon = ({ iconName, index }: { iconName: string; index: number }) => {
  const x = useSharedValue(Math.random() * width);
  const y = useSharedValue(Math.random() * height);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
    opacity.value = withTiming(0.7, { duration: 1000 });
    
    // Continuous floating animation
    x.value = withRepeat(
      withSequence(
        withTiming(x.value + (Math.random() * 60 - 30), { duration: 3000 + Math.random() * 2000 }),
        withTiming(x.value + (Math.random() * 60 - 30), { duration: 3000 + Math.random() * 2000 })
      ),
      -1,
      true
    );
    
    y.value = withRepeat(
      withSequence(
        withTiming(y.value + (Math.random() * 40 - 20), { duration: 2500 + Math.random() * 2000 }),
        withTiming(y.value + (Math.random() * 40 - 20), { duration: 2500 + Math.random() * 2000 })
      ),
      -1,
      true
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value }
    ],
  }));

  return (
    <Animated.View style={[styles.floatingIcon, iconStyle]} pointerEvents="none">
      <Ionicons name={iconName as any} size={24} color="rgba(255, 255, 255, 0.5)" />
    </Animated.View>
  );
};

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const bounceValue = new RNAnimated.Value(0);

  // Password validation states
  const [isLengthValid, setIsLengthValid] = useState(false);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);

  // Memoize the floating icons to prevent recreation on every render
  const floatingIcons = useMemo(() => 
    Array(8).fill(0).map((_, i) => ({
      iconName: sportsIcons[i % sportsIcons.length],
      id: i
    }))
  , []);

  useEffect(() => {
    // Validate password conditions on password change
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

  const onLogin = async () => {
    if (!validateEmail(email)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid email address',
      });
      return;
    }
    if (password.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter your password',
      });
      return;
    }

    setLoading(true);
    // Animation on login - using React Native Animated
    RNAnimated.sequence([
      RNAnimated.timing(bounceValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      RNAnimated.timing(bounceValue, {
        toValue: 0,
        duration: 300,
        delay: 100,
        useNativeDriver: true
      })
    ]).start();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        await signOut(auth);
        setLoading(false);
        Toast.show({
          type: 'error',
          text1: 'Verification Required',
          text2: 'Please verify your email address before logging in.',
        });
        return;
      }

      // Fetch user role from Firestore
      const userDoc = await import('firebase/firestore').then(({ doc, getDoc }) => {
        const db = require('../firebaseconfig').db;
        return getDoc(doc(db, 'users', user.uid));
      });

      // Check if user is suspended
      await checkUserSuspended(user.uid);

      setLoading(false);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'owner') {
          router.replace('/Owner/(tabs)/dashboard');
        } else if (userData.role === 'player') {
          router.replace('/Player/(tabs)/grounds');
        } else {
          Toast.show({
            type: 'error',
            text1: 'Login Error',
            text2: 'User role is not defined',
          });
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Login Error',
          text2: 'User data not found',
        });
      }
    } catch (error: any) {
      setLoading(false);
      if (error.message && error.message.includes('suspended')) {
        Toast.show({
          type: 'error',
          text1: 'Account Suspended',
          text2: error.message,
        });
      } else {
        let errorMessage = 'Login failed';
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'No user found with this email';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect password';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address';
        }
        Toast.show({
          type: 'error',
          text1: 'Login Error',
          text2: errorMessage,
        });
      }
    }
  };

  // Add checkUserSuspended function
  const checkUserSuspended = async (userId: string) => {
    const { doc, getDoc } = await import('firebase/firestore');
    const db = require('../firebaseconfig').db;
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists() && userDoc.data().suspended) {
      await signOut(auth);
      throw new Error('Your account has been suspended. Please contact support.');
    }
  };

  const translateY = bounceValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15]
  });

  return (
    <LinearGradient colors={['#0f172a', '#2859caff']} style={styles.container}>
      
      {/* Animated court lines */}
      <View style={styles.courtLines} pointerEvents="none">
        <View style={[styles.courtLine, styles.courtLine1]} />
        <View style={[styles.courtLine, styles.courtLine2]} />
        <View style={[styles.courtLine, styles.courtLine3]} />
        <View style={[styles.courtLine, styles.courtLine4]} />
      </View>
      
      {/* Floating sports icons */}
      {floatingIcons.map((icon) => (
        <FloatingIcon key={icon.id} iconName={icon.iconName} index={icon.id} />
      ))}
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" >
          <RNAnimated.View style={[styles.content, { transform: [{ translateY }] }]}>
            <View style={styles.logoContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="game-controller" size={width > 600 ? 80 : 60} color="#fff" />
              </View>
              <Text style={styles.appName}>INDOOR SPORTS HUB</Text>
              <Text style={styles.tagline}>Your Sports Community Awaits</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Sign in to access your sports community</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputWrapperFocused]}>
                  <Ionicons name="mail-outline" size={width > 600 ? 24 : 20} color="#666" style={styles.icon} />
                  <TextInput
                    style={[styles.input, { paddingLeft: width > 600 ? 50 : 40 }]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#aaa"
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputWrapperFocused]}>
                  <Ionicons name="lock-closed-outline" size={width > 600 ? 24 : 20} color="#666" style={styles.icon} />
                  <TextInput
                    style={[styles.input, { paddingLeft: width > 600 ? 50 : 40 }]}
                    secureTextEntry={!passwordVisible}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#aaa"
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
                      size={width > 600 ? 24 : 20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

             <TouchableOpacity 
  style={[styles.button, loading && styles.buttonDisabled]} 
  onPress={onLogin} 
  disabled={loading}
  activeOpacity={0.8}
>
  <LinearGradient 
    colors={['#8b5cf6', '#1e293b']} 
    style={styles.buttonGradient}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
  >
    {loading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#fff" />
        <Text style={styles.buttonText}>SIGNING IN...</Text>
      </View>
    ) : (
      <Text style={styles.buttonText}>SIGN IN</Text>
    )}
  </LinearGradient>
</TouchableOpacity>

              <View style={styles.linksContainer}>
                <TouchableOpacity 
                  onPress={() => router.push('/register')} 
                  style={styles.linkContainer}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkText}>
                    Don't have an account? <Text style={styles.linkTextBold}>Register here</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/forget')} activeOpacity={0.7}>
                  <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
            </View>
          </RNAnimated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '50%',
    opacity: 0.59,
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: width > 600 ? 0 : 0,
  },
  content: {
    width: '100%',
    maxWidth: width > 600 ? 500 : 400,
    alignSelf: 'center',

    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: width > 600 ? 40 : 30,
  },
  iconCircle: {
    width: width > 600 ? 120 : 100,
    height: width > 600 ? 120 : 100,
    borderRadius: width > 600 ? 60 : 50,
    backgroundColor: '#ffffff5a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  appName: {
    fontSize: width > 600 ? 28 : 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  tagline: {
    fontSize: width > 600 ? 16 : 14,
    color: '#fff',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
     padding: 35,
  },
  title: {
    fontSize: width > 600 ? 30 : 26,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: width > 600 ? 16 : 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: width > 600 ? 30 : 25,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: width > 600 ? 16 : 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    marginLeft: 5,
  },
  inputWrapper: {
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: '#1e293b',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  input: {
    padding: width > 600 ? 18 : 14,
    fontSize: width > 600 ? 16 : 14,
    color: '#333',
  },
  icon: {
    position: 'absolute',
    left: width > 600 ? 15 : 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 10,
  },
  eyeIcon: {
    position: 'absolute',
    right: width > 600 ? 15 : 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 5,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    padding: width > 600 ? 18 : 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: width > 600 ? 18 : 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginLeft: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  linksContainer: {
    marginTop: 20,
  },
  linkContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: width > 600 ? 16 : 14,
  },
  linkTextBold: {
    color: '#1e293b',
    fontWeight: 'bold',
  },
  forgotPassword: {
    color: '#666',
    textAlign: 'center',
    fontSize: width > 600 ? 15 : 13,
    fontWeight: '600',
  },
  courtLines: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  courtLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  courtLine1: {
    top: '20%',
    left: 0,
    right: 0,
    height: 1,
  },
  courtLine2: {
    top: 0,
    bottom: 0,
    left: '30%',
    width: 1,
  },
  courtLine3: {
    top: '60%',
    left: 0,
    right: 0,
    height: 1,
  },
  courtLine4: {
    top: 0,
    bottom: 0,
    left: '70%',
    width: 1,
  },
  floatingIcon: {
    position: 'absolute',
    zIndex: 2,
  },
});

export default Login;