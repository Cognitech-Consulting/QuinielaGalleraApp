// src/api/apiService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://cognitech.pythonanywhere.com';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== AUTH APIs ====================

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/api/accounts/register/', userData);
    return response.data;
  } catch (error) {
    console.error('Registration API Error:', error.response?.data || error.message);
    
    // Return detailed error information
    if (error.response?.data) {
      // Django typically returns errors in this format
      throw error.response.data;
    } else if (error.message) {
      throw { error: error.message };
    } else {
      throw { error: 'Error de conexión. Verifica tu internet.' };
    }
  }
};

export const loginUser = async (user_id, password) => {
  try {
    const response = await api.post('/api/accounts/login/', {
      user_id,
      password,
    });
    
    // Save user_id to AsyncStorage
    if (response.data.user_id) {
      await AsyncStorage.setItem('user_id', response.data.user_id);
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCurrentUserId = async () => {
  try {
    return await AsyncStorage.getItem('user_id');
  } catch (error) {
    console.error('Error getting user_id:', error);
    return null;
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('user_id');
    await AsyncStorage.removeItem('active_event_id');
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

// ==================== USER APIs ====================

export const getUserTickets = async (user_id) => {
  try {
    const response = await api.get('/api/accounts/tickets/', {
      params: { user_id },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const useTicket = async (user_id, event_id) => {
  try {
    const response = await api.post('/api/accounts/use-ticket/', {
      user_id,
      event_id,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ==================== EVENT APIs ====================

export const getCurrentEvent = async () => {
  try {
    const response = await api.get('/eventos/api/current-event/');
    
    // Save event_id to AsyncStorage
    if (response.data.id) {
      await AsyncStorage.setItem('active_event_id', response.data.id.toString());
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const checkParticipation = async (user_id, event_id) => {
  try {
    const response = await api.get('/eventos/api/check-participation/', {
      params: { user_id, event_id },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ==================== PREDICTION APIs ====================

export const submitPredictions = async (user_id, predictions) => {
  try {
    const response = await api.post('/eventos/api/submit-predictions/', {
      user_id,
      predictions,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getUserResults = async (user_id) => {
  try {
    const response = await api.get('/eventos/api/user-results/', {
      params: { user_id },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ==================== RANKINGS API ====================

export const getRankings = async (event_id) => {
  try {
    const response = await api.get(`/eventos/api/rankings/${event_id}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ==================== POLLING UTILITIES ====================

/**
 * Set up polling for current event updates
 * @param {Function} callback - Function to call with updated data
 * @param {number} interval - Polling interval in milliseconds (default: 15000 = 15 seconds)
 * @returns {Function} - Function to stop polling
 */
export const pollCurrentEvent = (callback, interval = 15000) => {
  let isActive = true;
  
  const poll = async () => {
    if (!isActive) return;
    
    try {
      const data = await getCurrentEvent();
      callback(data, null);
    } catch (error) {
      callback(null, error);
    }
    
    if (isActive) {
      setTimeout(poll, interval);
    }
  };
  
  // Start polling
  poll();
  
  // Return cleanup function
  return () => {
    isActive = false;
  };
};

/**
 * Set up polling for user results
 * @param {string} user_id - User ID
 * @param {Function} callback - Function to call with updated data
 * @param {number} interval - Polling interval in milliseconds (default: 20000 = 20 seconds)
 * @returns {Function} - Function to stop polling
 */
export const pollUserResults = (user_id, callback, interval = 20000) => {
  let isActive = true;
  
  const poll = async () => {
    if (!isActive) return;
    
    try {
      const data = await getUserResults(user_id);
      callback(data, null);
    } catch (error) {
      callback(null, error);
    }
    
    if (isActive) {
      setTimeout(poll, interval);
    }
  };
  
  // Start polling
  poll();
  
  // Return cleanup function
  return () => {
    isActive = false;
  };
};

/**
 * Set up polling for rankings
 * @param {number} event_id - Event ID
 * @param {Function} callback - Function to call with updated data
 * @param {number} interval - Polling interval in milliseconds (default: 30000 = 30 seconds)
 * @returns {Function} - Function to stop polling
 */
export const pollRankings = (event_id, callback, interval = 30000) => {
  let isActive = true;
  
  const poll = async () => {
    if (!isActive) return;
    
    try {
      const data = await getRankings(event_id);
      callback(data, null);
    } catch (error) {
      callback(null, error);
    }
    
    if (isActive) {
      setTimeout(poll, interval);
    }
  };
  
  // Start polling
  poll();
  
  // Return cleanup function
  return () => {
    isActive = false;
  };
};

export default api;