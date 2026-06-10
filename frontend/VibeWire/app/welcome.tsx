import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image
} from 'react-native';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>VibeWire</Text>
        <Text style={styles.tagline}>Plan hangouts with your crew</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.illustration}>
          <Image 
            source={require('../assets/images/vibewirelogo.png')} 
            style={styles.illustrationImage}
          />
          <Text style={styles.illustrationText}>
            Connect, Plan, Vibe
          </Text>
        </View>

        <Text style={styles.description}>
          The easiest way to organize hangouts with friends. 
          Create events, invite your crew, and never miss out on the fun!
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.signupButton}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.signupButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Join thousands of people planning amazing hangouts
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    fontSize: 40,
    fontWeight: '900',
    color: '#00F0FF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: '#8E8EA8',
    textAlign: 'center',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  illustration: {
    alignItems: 'center',
    marginBottom: 36,
  },
  illustrationImage: {
    width: 210,
    height: 210,
    marginBottom: 16,
    resizeMode: 'contain',
  },
  illustrationText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    color: '#8E8EA8',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 290,
  },
  buttonContainer: {
    marginBottom: 32,
    gap: 14,
  },
  signupButton: {
    backgroundColor: '#FF2D8F',
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: '#FF2D8F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2E2E5F',
  },
  loginButtonText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#6E6E8A',
    textAlign: 'center',
  },
});