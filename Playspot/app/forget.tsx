import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,

  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../firebaseconfig';

const { width, height } = Dimensions.get('window');

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: email input, 2: code verification, 3: new password
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const bounceValue = useRef(new Animated.Value(0)).current;

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  };

  // Password validation states
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasUpperCase, setHasUpperCase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  // Validate password conditions
  React.useEffect(() => {
    if (step === 3) {
      setHasMinLength(newPassword.length >= 8);
      setHasUpperCase(/[A-Z]/.test(newPassword));
      setHasNumber(/\d/.test(newPassword));
      setHasSpecialChar(/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(newPassword));
      setPasswordsMatch(newPassword === confirmPassword && confirmPassword.length > 0);
    }
  }, [newPassword, confirmPassword, step]);

  const PasswordCondition = ({ condition, text }: { condition: boolean; text: string }) => {
    return (
      <View style={styles.conditionRow}>
        <View style={[styles.conditionIndicator, condition ? styles.conditionMet : styles.conditionUnmet]}>
          <Text style={styles.conditionIndicatorText}>{condition ? '✓' : ''}</Text>
        </View>
        <Text style={[styles.conditionText, condition ? styles.conditionMetText : styles.conditionUnmetText]}>
          {text}
        </Text>
      </View>
    );
  };

  const onSendResetLink = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    // Animation
    Animated.sequence([
      Animated.timing(bounceValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(bounceValue, {
        toValue: 0,
        duration: 300,
        delay: 100,
        useNativeDriver: true
      })
    ]).start();

    try {
      await sendPasswordResetEmail(auth, email);
      setLoading(false);
      Alert.alert('Check your email', 'We sent a password reset link to your email address');
      router.push('/login');
    } catch (error: any) {
      setLoading(false);
      let errorMessage = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const onVerifyCode = () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Validation Error', 'Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    // Simulate code verification
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1500);
  };

  const onResetPassword = () => {
    if (newPassword.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    // Simulate password reset
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Your password has been reset successfully');
      router.push('/login');
    }, 2000);
  };

  const translateY = bounceValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15]
  });

  return (
    <LinearGradient colors={['#0f172a', '#2859caff']} style={styles.container}>
       <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View style={[styles.content, { transform: [{ translateY }] }]}>
          <View style={styles.logoContainer}>
            <Ionicons name="game-controller" size={width > 600 ? 100 : 80} color="#fff" />
            <Text style={styles.appName}>INDOOR SPORTS HUB</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>
              {step === 1 ? 'Reset Password' : step === 2 ? 'Verification Code' : 'Create New Password'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 
                ? 'Enter your email to receive a verification code' 
                : step === 2 
                ? 'Enter the 6-digit code sent to your email' 
                : 'Create a new password for your account'}
            </Text>

            {step === 1 && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
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
            )}

            {step === 2 && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'code' && styles.inputFocused]}
                  keyboardType="number-pad"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#aaa"
                  maxLength={6}
                  onFocus={() => setFocusedInput('code')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity onPress={() => setStep(1)} style={styles.resendContainer}>
                  <Text style={styles.resendText}>Didn't receive the code? <Text style={styles.resendLink}>Resend</Text></Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 3 && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={[styles.input, focusedInput === 'newPassword' && styles.inputFocused]}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Create a new password"
                    placeholderTextColor="#aaa"
                    onFocus={() => setFocusedInput('newPassword')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  
                  <View style={styles.passwordConditions}>
                    <PasswordCondition condition={hasMinLength} text="At least 8 characters" />
                    <PasswordCondition condition={hasUpperCase} text="Contains an uppercase letter" />
                    <PasswordCondition condition={hasNumber} text="Contains a number" />
                    <PasswordCondition condition={hasSpecialChar} text="Contains a special character" />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={[styles.input, focusedInput === 'confirmPassword' && styles.inputFocused]}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your new password"
                    placeholderTextColor="#aaa"
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  
                  <View style={styles.passwordConditions}>
                    <PasswordCondition condition={passwordsMatch} text="Passwords match" />
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={step === 1 ? onSendResetLink : step === 2 ? onVerifyCode : onResetPassword} 
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={['#1e293b', '#575af3ff']} 
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>
                  {loading 
                    ? 'PROCESSING...' 
                    : step === 1 
                    ? 'SEND RESET LINK' 
                    : step === 2 
                    ? 'VERIFY CODE' 
                    : 'RESET PASSWORD'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/login')} 
              style={styles.linkContainer}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                Back to <Text style={styles.linkTextBold}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '60%',
    opacity: 0.5,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 55,
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    padding: 35,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputFocused: {
    borderColor: '#1e293b',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  resendContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  resendText: {
    color: '#666',
    fontSize: 14,
  },
  resendLink: {
    color: '#1e293b',
    fontWeight: '600',
  },
  passwordConditions: {
    marginTop: 10,
    marginLeft: 5,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  conditionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  conditionMet: {
    backgroundColor: '#4caf50',
  },
  conditionUnmet: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  conditionIndicatorText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  conditionText: {
    fontSize: 13,
  },
  conditionMetText: {
    color: '#4caf50',
    fontWeight: '600',
  },
  conditionUnmetText: {
    color: '#999',
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
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  linkContainer: {
    marginTop: 25,
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 16,
  },
  linkTextBold: {
    color: '#1e293b',
    fontWeight: 'bold',
  },
});

export default ForgotPassword;