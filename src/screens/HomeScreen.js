// src/screens/HomeScreen.js
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
import { useAuth } from '../context/AuthContext';
import {
  getCurrentEvent,
  pollCurrentEvent,
  getUserTickets,
  checkParticipation,
  useTicket,
} from '../api/apiService';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState(0);
  const [hasParticipated, setHasParticipated] = useState(false);

  useEffect(() => {
    loadInitialData();

    // Set up polling for event updates (every 15 seconds)
    const stopPolling = pollCurrentEvent((data, error) => {
      if (data) {
        setEvent(data);
      } else if (error) {
        console.error('Polling error:', error);
      }
    }, 15000);

    // Cleanup function to stop polling when component unmounts
    return () => {
      stopPolling();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load current event
      const eventData = await getCurrentEvent();
      setEvent(eventData);

      // Load user tickets
      const ticketsData = await getUserTickets(user.user_id);
      setTickets(ticketsData.event_tickets);

      // Check if user has participated
      const participationData = await checkParticipation(user.user_id, eventData.id);
      setHasParticipated(participationData.participated);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudo cargar el evento actual');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleParticipate = async () => {
    if (tickets <= 0) {
      Alert.alert(
        'Sin Tickets',
        'No tienes tickets disponibles para participar en este evento.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Usar Ticket',
      '¿Deseas usar 1 ticket para participar en este evento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Usar Ticket',
          onPress: async () => {
            try {
              await useTicket(user.user_id, event.id);
              setTickets(tickets - 1);
              setHasParticipated(true);
              navigation.navigate('Predictions', { event });
            } catch (error) {
              Alert.alert('Error', error.error || 'No se pudo usar el ticket');
            }
          },
        },
      ]
    );
  };

  const handleContinue = () => {
    navigation.navigate('Predictions', { event });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D52B1E" />
        <Text style={styles.loadingText}>Cargando evento...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay eventos activos en este momento</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Bienvenido</Text>
          <Text style={styles.userIdText}>{user.user_id}</Text>
        </View>
        <View style={styles.ticketsContainer}>
          <Text style={styles.ticketsLabel}>Tickets:</Text>
          <Text style={styles.ticketsCount}>{tickets}</Text>
        </View>
      </View>

      {/* Event Info */}
      <View style={styles.eventCard}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>EN VIVO</Text>
        </View>
        
        <Text style={styles.eventName}>{event.nombre}</Text>
        <Text style={styles.eventDetail}>📅 {event.fecha}</Text>
        <Text style={styles.eventDetail}>📍 {event.ubicacion}</Text>
        <Text style={styles.roundsCount}>
          {event.rondas?.length || 0} Rondas • {' '}
          {event.rondas?.reduce((total, ronda) => total + (ronda.peleas?.length || 0), 0) || 0} Peleas
        </Text>
      </View>

      {/* Participation Status */}
      {hasParticipated ? (
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continuar con Predicciones</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.participateButton, tickets <= 0 && styles.buttonDisabled]}
          onPress={handleParticipate}
        >
          <Text style={styles.participateButtonText}>
            {tickets > 0 ? 'Participar (1 Ticket)' : 'Sin Tickets Disponibles'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Quick Access Buttons */}
      <View style={styles.quickAccess}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => navigation.navigate('Results')}
        >
          <Text style={styles.quickButtonIcon}>📊</Text>
          <Text style={styles.quickButtonText}>Mis Resultados</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => navigation.navigate('Rankings')}
        >
          <Text style={styles.quickButtonIcon}>🏆</Text>
          <Text style={styles.quickButtonText}>Rankings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.quickButtonIcon}>👤</Text>
          <Text style={styles.quickButtonText}>Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#D52B1E',
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFF',
  },
  userIdText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  ticketsContainer: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ticketsLabel: {
    fontSize: 12,
    color: '#333',
  },
  ticketsCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF00',
    marginRight: 5,
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00FF00',
  },
  eventName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  eventDetail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  roundsCount: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  participateButton: {
    backgroundColor: '#D52B1E',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#2ECC71',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  participateButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickAccess: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginTop: 20,
  },
  quickButton: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickButtonIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  quickButtonText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF5252',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;