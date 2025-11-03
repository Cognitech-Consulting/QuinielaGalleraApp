import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../api/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        await refreshUser(userData.user_id);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userId, password) => {
    try {
      const response = await apiService.login(userId, password);
      
      if (response.success) {
        const monedasResponse = await apiService.getUserMonedas(userId);
        
        const userData = {
          user_id: userId,
          monedas: monedasResponse.monedas || 0,
        };
        
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      console.log('🔵 AuthContext received userData:', userData);
      
      // CRITICAL: Extract fields in CORRECT order from userData object
      const response = await apiService.register(
        userData.user_id,           // 1. user_id
        userData.password,          // 2. password
        userData.nombre,            // 3. nombre
        userData.apellido,          // 4. apellido
        userData.fecha_nacimiento,  // 5. fecha_nacimiento
        userData.numero_celular,    // 6. numero_celular
        userData.direccion          // 7. direccion
      );
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async (userId = user?.user_id) => {
    if (!userId) return;

    try {
      const monedasResponse = await apiService.getUserMonedas(userId);
      
      setUser(prev => ({
        ...prev,
        monedas: monedasResponse.monedas || 0,
      }));

      const updatedUser = {
        ...user,
        monedas: monedasResponse.monedas || 0,
      };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const deductMonedas = (amount) => {
    setUser(prev => ({
      ...prev,
      monedas: Math.max(0, (prev.monedas || 0) - amount),
    }));
  };

  const addMonedas = (amount) => {
    setUser(prev => ({
      ...prev,
      monedas: (prev.monedas || 0) + amount,
    }));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    deductMonedas,
    addMonedas,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;