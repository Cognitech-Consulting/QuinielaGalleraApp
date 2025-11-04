// src/context/AuthContext.js - FIXED VERSION WITH TICKET SUPPORT
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser, logout as apiLogout, getCurrentUserId } from '../api/apiService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // ✅ Load full user object from AsyncStorage
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (user_id, password) => {
    try {
      // Call login API
      const response = await loginUser({ user_id, password });
      
      console.log('Login response:', response); // Debug log
      
      // ✅ FIXED: Save complete user data including event_tickets
      const userData = {
        user_id: response.user_id,
        event_tickets: response.event_tickets || 0,
        nombre: response.nombre || '',
        apellido: response.apellido || ''
      };
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Set user state
      setUser(userData);
      
      console.log('User data saved:', userData); // Debug log
      
      return { success: true };
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      
      // Handle different error formats
      let errorMessage = 'Login failed';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      const response = await registerUser(userData);
      console.log('Register response:', response);
      return { success: true, data: response };
    } catch (error) {
      console.error('Register error in AuthContext:', error);
      
      // Handle different error formats
      let errorMessage = 'Error al registrar usuario';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'object') {
        // Handle field-specific errors from Django
        const fieldErrors = [];
        for (const [field, messages] of Object.entries(error)) {
          if (Array.isArray(messages)) {
            fieldErrors.push(`${field}: ${messages.join(', ')}`);
          } else if (typeof messages === 'string') {
            fieldErrors.push(`${field}: ${messages}`);
          }
        }
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join('\n');
        }
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // ✅ NEW: Function to update user data (e.g., after using a ticket)
  const updateUser = async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser, // ✅ Export this for updating tickets after use
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};