import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../src/context/AuthContext';

export default function SignupScreen() {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    bio: '',
    password: '',
    confirmPassword: '',
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission denied', 'We need access to your camera roll to select a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
  };

  const validateForm = () => {
    const { name, phoneNumber, password, confirmPassword } = formData;
    
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number (10+ digits)');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      await signup(formData.name, formData.phoneNumber, formData.bio, formData.password, profileImage);
      
      Alert.alert('Success', 'Account created successfully!');
      router.replace('/connections-select');
      
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred.';
      Alert.alert('Signup Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the VibeWire community</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* 👤 Profile Picture Picker */}
            <View style={styles.profilePicRow}>
              <TouchableOpacity onPress={pickImage}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profilePic} />
                ) : (
                  <View style={styles.placeholderPic}>
                    <Text style={styles.placeholderText}>+ Add Avatar</Text>
                  </View>
                )}
              </TouchableOpacity>

              {profileImage && (
                <TouchableOpacity onPress={removeImage} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#666"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                autoCapitalize="words"
              />
            </View>

            {/* Phone Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#666"
                value={formData.phoneNumber}
                onChangeText={(text) => handleInputChange('phoneNumber', text)}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            {/* Bio Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio (Optional)</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#666"
                value={formData.bio}
                onChangeText={(text) => handleInputChange('bio', text)}
                multiline
                numberOfLines={3}
                maxLength={150}
              />
              <Text style={styles.characterCount}>
                {formData.bio.length}/150
              </Text>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password (min 6 chars)"
                placeholderTextColor="#666"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#666"
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange('confirmPassword', text)}
                secureTextEntry
              />
            </View>

            {/* Signup Button */}
            <TouchableOpacity 
              style={[styles.signupButton, loading && styles.disabledButton]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? 'Synthesizing Profile...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1C1C3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2E2E5F',
  },
  backButtonText: {
    fontSize: 20,
    color: '#00F0FF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8EA8',
  },
  form: {
    paddingHorizontal: 24,
  },
  profilePicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  profilePic: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    borderColor: '#00F0FF',
  },
  placeholderPic: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#13132B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1E1E3F',
  },
  placeholderText: {
    color: '#8E8EA8',
    fontSize: 12,
    fontWeight: '700',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF2D8F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8EA8',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#13132B',
    borderWidth: 1.5,
    borderColor: '#1E1E3F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: '#FFFFFF',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 11,
    color: '#8E8EA8',
    textAlign: 'right',
    marginTop: 4,
  },
  signupButton: {
    backgroundColor: '#FF2D8F',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF2D8F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#66163E',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#8E8EA8',
  },
  loginLink: {
    fontSize: 14,
    color: '#00F0FF',
    fontWeight: '700',
  },
});