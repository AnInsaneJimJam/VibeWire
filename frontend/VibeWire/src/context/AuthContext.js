// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import api from '../services/api';
import { router } from 'expo-router';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Load auth data on app start
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const [storedToken, storedUser] = await AsyncStorage.multiGet([
        'authToken',
        'userData'
      ]);
      
      if (storedToken[1] && storedUser[1]) {
        setToken(storedToken[1]);
        setUser(JSON.parse(storedUser[1]));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkOnboarding = async () => {
    try {
      setOnboardingChecked(true);
      // Fetch connections graph
      const res = await api.get('/api/connections/graph');
      const firstDegree = res.data.firstDegree || [];
      if (firstDegree.length >= 8) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/connections-select');
      }
    } catch (error) {
      // If not authenticated or error, go to welcome
      router.replace('/welcome');
    }
  };

  const login = async (phoneNumber, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login(phoneNumber, password);
      
      const { token: authToken, user: userData } = response;
      
      // Store in AsyncStorage
      await AsyncStorage.multiSet([
        ['authToken', authToken],
        ['userData', JSON.stringify(userData)]
      ]);
      
      // Update state
      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);
      setOnboardingChecked(false); // trigger onboarding check
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, phoneNumber, bio, password) => {
    try {
      setLoading(true);
      const response = await authAPI.signup(name, phoneNumber, bio, password);
      
      const { token: authToken, user: userData } = response;
      
      // Store in AsyncStorage
      await AsyncStorage.multiSet([
        ['authToken', authToken],
        ['userData', JSON.stringify(userData)]
      ]);
      
      // Update state
      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);
      setOnboardingChecked(false); // trigger onboarding check
      
      return response;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.multiRemove(['authToken', 'userData']);
      
      // Clear state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setOnboardingChecked(false);
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData) => {
    try {
      // Update AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // Update state
      setUser(userData);
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};