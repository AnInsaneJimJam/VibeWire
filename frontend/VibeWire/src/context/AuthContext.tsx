// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import api from '../services/api';
import { router } from 'expo-router';

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (phoneNumber: string, password: string) => Promise<any>;
  signup: (name: string, phoneNumber: string, bio: string, password: string, profileImage: string | null) => Promise<any>;
  logout: () => Promise<void>;
  updateUser: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
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

  const login = async (phoneNumber: string, password: string) => {
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

  const signup = async (name: string, phoneNumber: string, bio: string, password: string, profileImage: string | null) => {
    try {
      setLoading(true);
      // Backend expects: name, phoneNumber, bio, password
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

  const updateUser = async (userData: any) => {
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
