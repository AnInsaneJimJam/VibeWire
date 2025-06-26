import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function OTPVerifyScreen() {
  const params = useLocalSearchParams();
  const { phoneNumber, mockOTP, name, bio, password } = params;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<TextInput[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Log the mock OTP when component mounts
  useEffect(() => {
    console.log('🔐 OTP Screen - Mock OTP:', mockOTP);
    console.log('📱 Phone Number:', phoneNumber);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    // Handle backspace - focus previous input
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const enteredOTP = otp.join('');
    
    if (enteredOTP.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔍 Verifying OTP...');
      console.log('Entered OTP:', enteredOTP);
      console.log('Expected OTP:', mockOTP);
      
      // Verify OTP
      if (enteredOTP === mockOTP) {
        console.log('✅ OTP Verified Successfully!');
        
        // TODO: Call your signup API here
        console.log('📝 Creating user account...');
        console.log('User Data:', {
          name,
          phoneNumber,
          bio: bio || 'No bio provided',
          password: '***hidden***'
        });
        
        // Simulate API call
        setTimeout(() => {
  Alert.alert(
    'Success!', 
    'Your account has been created successfully!',
    [
      {
        text: 'Continue',
        onPress: () => router.replace({
          pathname: '/profile',
          params: {
            name: name,
            phoneNumber: phoneNumber,
            bio: bio || 'No bio provided',
            profileImage: params.profileImage || ''
          }
        })
      }
    ]
  );
}, 1000);

        
      } else {
        console.log('❌ Invalid OTP');
        Alert.alert('Error', 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
      
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error('OTP verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    // Generate new mock OTP
    const newMockOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔄 New Mock OTP Generated:', newMockOTP);
    
    // Update the params (in real app, you'd make API call)
    // For now, just log it
    Alert.alert('OTP Sent', `New OTP sent to ${phoneNumber}\nCheck console for mock OTP`);
    
    // Reset timer
    setTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Verify Phone Number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phoneNumber}>{phoneNumber}</Text>
        </Text>
      </View>

      {/* OTP Input */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            style={[
              styles.otpInput,
              digit && styles.otpInputFilled
            ]}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={(event) => handleKeyPress(event, index)}
            keyboardType="number-pad"
            textAlign="center"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      {/* Timer/Resend */}
      <View style={styles.resendContainer}>
        {!canResend ? (
          <Text style={styles.timerText}>
            Resend code in {timer}s
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResendOTP}>
            <Text style={styles.resendText}>Resend OTP</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Verify Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.verifyButton, loading && styles.disabledButton]}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          <Text style={styles.verifyButtonText}>
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Debug Info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          🔍 Debug: Check console for mock OTP
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 24,
    color: '#6C5CE7',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#636E72',
    lineHeight: 24,
  },
  phoneNumber: {
    fontWeight: '600',
    color: '#6C5CE7',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 40,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#2D3436',
  },
  otpInputFilled: {
    borderColor: '#6C5CE7',
    backgroundColor: '#F8F7FF',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    fontSize: 16,
    color: '#636E72',
  },
  resendText: {
    fontSize: 16,
    color: '#6C5CE7',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 20,
  },
  verifyButton: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 16,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#B2B2B2',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugContainer: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
  },
});