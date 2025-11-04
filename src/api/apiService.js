// src/api/apiService.js - FINAL VERIFIED VERSION
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://cognitech.pythonanywhere.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== AUTHENTICATION APIs ====================

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/api/accounts/register/', userData);
    return response.data;
  } catch (error) {
    console.error('Registration API Error:', error.response?.data || error.message);
    
    if (error.response?.data) {
      throw error.response.data;
    } else if (error.message) {
      throw { error: error.message };
    } else {
      throw { error: 'Error de conexión. Verifica tu internet.' };
    }
  }
};

// ⭐ FIXED: loginUser expects credentials object
export const loginUser = async (credentials) => {
  try {
    console.log('Login attempt with:', credentials); // Debug log
    
    const response = await api.post('/api/accounts/login/', credentials);
    
    console.log('Login response:', response.data); // Debug log
    
    // Save user_id to AsyncStorage
    if (response.data.user_id) {
      await AsyncStorage.setItem('user_id', response.data.user_id);
    }
    
    return response.data;
  } catch (error) {
    console.error('Login API Error:', error.response?.data || error.message);
    throw error.response?.data || { error: error.message || 'Login failed' };
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

// ==================== USER TICKET APIs ====================

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

// NEW: Get all active events
export const getAllActiveEvents = async () => {
  try {
    const response = await api.get('/eventos/api/all-active-events/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// OLD: Keep for backwards compatibility
export const getCurrentEvent = async () => {
  try {
    const response = await api.get('/eventos/api/current-event/');
    
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

export const submitPredictions = async (user_id, event_id, predictions) => {
  try {
    const payload = {
      user_id,
      event_id,
      predictions
    };
    
    console.log('Submitting predictions:', JSON.stringify(payload, null, 2));
    
    const response = await api.post('/eventos/api/submit-predictions/', payload);
    return response.data;
  } catch (error) {
    console.error('Submit predictions error:', error.response?.data || error.message);
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

export const hasSubmittedPredictions = async (user_id, event_id) => {
  try {
    const response = await api.get('/eventos/api/has-submitted-predictions/', {
      params: { user_id, event_id },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ==================== RANKING APIs ====================

export const getRankings = async (event_id) => {
  try {
    const response = await api.get(`/eventos/api/rankings/${event_id}/`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ==================== POLLING UTILITIES ====================

export const pollCurrentEvent = (callback, interval = 15000) => {
  let isPolling = true;

  const fetchData = async () => {
    if (!isPolling) return;

    try {
      const data = await getCurrentEvent();
      callback(data, null);
    } catch (error) {
      callback(null, error);
    }

    if (isPolling) {
      setTimeout(fetchData, interval);
    }
  };

  fetchData();

  return () => {
    isPolling = false;
  };
};

export const pollAllActiveEvents = (callback, interval = 15000) => {
  let isPolling = true;

  const fetchData = async () => {
    if (!isPolling) return;

    try {
      const data = await getAllActiveEvents();
      callback(data, null);
    } catch (error) {
      callback(null, error);
    }

    if (isPolling) {
      setTimeout(fetchData, interval);
    }
  };

  fetchData();

  return () => {
    isPolling = false;
  };
};

export const pollUserResults = (user_id, callback, interval = 20000) => {
  let isPolling = true;

  const fetchData = async () => {
    if (!isPolling) return;

    try {
      const data = await getUserResults(user_id);
      callback(data, null);
    } catch (error) {
      callback(null, error);
    }

    if (isPolling) {
      setTimeout(fetchData, interval);
    }
  };

  fetchData();

  return () => {
    isPolling = false;
  };
};

export const pollRankings = (event_id, callback, interval = 30000) => {
  let isPolling = true;

  const fetchData = async () => {
    if (!isPolling) return;

    try {
      const data = await getRankings(event_id);
      callback(data, null);
    } catch (error) {
      callback(null, error);
    }

    if (isPolling) {
      setTimeout(fetchData, interval);
    }
  };

  fetchData();

  return () => {
    isPolling = false;
  };
};

export default api;