// src/screens/HomeScreen.js - UPDATED FOR MULTIPLE ACTIVE EVENTS - FIXED
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import apiService from '../api/apiService';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monedas, setMonedas] = useState(user?.monedas || 0);

  useEffect(() => {
    loadInitialData();

    // Poll active events every 15 seconds
    const intervalId = setInterval(() => {
      loadActiveEvents();
    }, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadInitialData();
    }, [])
  );

  const loadActiveEvents = async () => {
    try {
      const eventsData = await apiService.getActiveEvents();
      setEvents(eventsData.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load active events
      const eventsData = await apiService.getActiveEvents();
      setEvents(eventsData.events || []);
      
      // Load user monedas
      try {
        const monedasData = await apiService.getUserMonedas(user.user_id);
        setMonedas(monedasData.monedas || 0);
      } catch (error) {
        console.log('Error loading monedas:', error);
        // Keep the current monedas value
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      // No active events - this is OK
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const handleViewEvent = (event) => {
    navigation.navigate('EventDetail', { event });
  };

  const renderEventCard = (event) => {
    // ✅ FIX: Add safety checks for rondas
    const rondas = event.rondas || [];
    const activeRondas = rondas.filter(r => r?.is_active).length;
    const totalRondas = rondas.length;

    return (
      <View key={event.id} style={styles.eventCard}>
        {/* Event Header */}
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>🏆 {event.nombre}</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>🔴 ACTIVO</Text>
          </View>
        </View>

        {/* Event Info */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventDetail}>📅 {event.fecha || 'Fecha no disponible'}</Text>
          <Text style={styles.eventDetail}>📍 {event.ubicacion || 'Ubicación no disponible'}</Text>
          <Text style={styles.eventDetail}>
            🎯 {totalRondas} Rondas ({activeRondas} activas)
          </Text>
        </View>

        {/* View Event Button */}
        <TouchableOpacity
          style={styles.viewEventButton}
          onPress={() => handleViewEvent(event)}
        >
          <Text style={styles.viewEventButtonText}>📋 Ver Evento</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Cargando eventos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>¡Hola, {user?.user_id || 'Usuario'}!</Text>
          <View style={styles.monedasContainer}>
            <Text style={styles.monedasText}>💰 {monedas} Monedas</Text>
          </View>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>🏆 EVENTOS ACTIVOS</Text>
          <Text style={styles.subtitle}>
            Selecciona un evento para ver sus rondas
          </Text>
        </View>

        {/* Events List */}
        {events.length > 0 ? (
          <View style={styles.eventsContainer}>
            {events.map(event => renderEventCard(event))}
          </View>
        ) : (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEventsIcon}>📭</Text>
            <Text style={styles.noEventsText}>
              No hay eventos activos en este momento
            </Text>
            <Text style={styles.noEventsHint}>
              Los eventos aparecerán aquí cuando el administrador los active
            </Text>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 ¿Cómo funciona?</Text>
          <Text style={styles.infoText}>
            • Cada ronda cuesta <Text style={styles.boldText}>50 💰</Text>
          </Text>
          <Text style={styles.infoText}>
            • Puedes participar en múltiples rondas
          </Text>
          <Text style={styles.infoText}>
            • Gana puntos por cada predicción correcta
          </Text>
          <Text style={styles.infoText}>
            • Consulta los rankings de cada evento
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
  },
  loadingText: {
    marginTop: 10,
    color: '#FFF',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#16213E',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  monedasContainer: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  monedasText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  profileButton: {
    backgroundColor: '#4ECDC4',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    fontSize: 20,
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    padding: 20,
    paddingBottom: 10,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  eventsContainer: {
    padding: 20,
    paddingTop: 10,
  },
  eventCard: {
    backgroundColor: '#16213E',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  activeBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventInfo: {
    marginBottom: 15,
  },
  eventDetail: {
    fontSize: 16,
    color: '#CCC',
    marginBottom: 5,
  },
  viewEventButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewEventButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noEventsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noEventsIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  noEventsText: {
    fontSize: 20,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  noEventsHint: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#16213E',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFD93D',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD93D',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#CCC',
    marginBottom: 8,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
});

export default HomeScreen;