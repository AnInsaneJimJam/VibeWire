// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Always use the provided WSL IP
const BASE_URL = 'http://192.168.29.208:3000';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from AsyncStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear stored auth data
      await AsyncStorage.multiRemove(['authToken', 'userData']);
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Login user
  login: async (phoneNumber, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        phoneNumber,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Signup user (for reference)
  signup: async (name, phoneNumber, bio, password) => {
    try {
      const response = await api.post('/api/auth/signup', {
        name,
        phoneNumber,
        bio,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },
};

// User API functions (protected routes)
export const userAPI = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await api.get('/api/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Get user by ID
  getUserById: async (id) => {
    try {
      const response = await api.get(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },
};

// Connection API functions (protected routes)
export const connectionAPI = {
  // Get all connections for the current user
  getConnections: async () => {
    try {
      const response = await api.get('/api/connections');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Get connection graph
  getGraph: async () => {
    try {
      const response = await api.get('/api/connections/graph');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },
};

// Invite API functions
export const inviteAPI = {
  // Get all pending invites and approval requests
  getInvites: async () => {
    try {
      const response = await api.get('/api/invites');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Respond to a hangout invite
  respondToInvite: async (inviteId, response) => {
    try {
      const res = await api.post(`/api/invites/${inviteId}/respond`, { response });
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Respond to an approval request
  respondToApproval: async (inviteId, response) => {
    try {
      const res = await api.post(`/api/invites/${inviteId}/approve`, { response });
      return res.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },
};

// Hangout API functions (protected routes)
export const hangoutAPI = {
  // Get all hangouts
  getHangouts: async () => {
    try {
      const response = await api.get('/api/hangouts');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  // Create a new hangout
  createHangout: async (hangoutData) => {
    try {
      const response = await api.post('/api/hangouts', hangoutData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error' };
    }
  },
};

export default api;