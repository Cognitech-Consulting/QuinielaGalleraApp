// src/screens/HomeScreen.js - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getAllActiveEvents, getUserTickets, pollAllActiveEvents } from '../api/apiService';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInitialData();

    // Start polling for events (updates every 15 seconds)
    const stopPolling = pollAllActiveEvents((data, error) => {
      if (data && data.events) {
        setEvents(data.events);
      }
    }, 15000);

    return () => stopPolling();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load user tickets
      const ticketsData = await getUserTickets(user.user_id);
      setTickets(ticketsData.event_tickets);

      // Load all active events
      const eventsData = await getAllActiveEvents();
      setEvents(eventsData.events || []);

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudieron cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleEventPress = (event) => {
    // Navigate to event detail screen
    navigation.navigate('EventDetail', { event });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🐓</Text>
        </View>
        <ActivityIndicator size="large" color="#D52B1E" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Cargando eventos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🐓</Text>
            </View>
            <Text style={styles.appTitle}>Quiniela Gallera</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.nombre || user.user_id}</Text>
          <View style={styles.ticketsContainer}>
            <Text style={styles.ticketEmoji}>🎫</Text>
            <Text style={styles.ticketsText}>{tickets} tickets</Text>
          </View>
        </View>
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D52B1E']} />
        }
      >
        <Text style={styles.sectionTitle}>📅 Eventos Activos</Text>

        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>😴</Text>
            <Text style={styles.emptyText}>No hay eventos activos</Text>
            <Text style={styles.emptySubtext}>Los eventos aparecerán aquí cuando estén disponibles</Text>
          </View>
        ) : (
          events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => handleEventPress(event)}
            >
              <View style={styles.eventHeader}>
                <Text style={styles.eventName}>{event.nombre}</Text>
                <Text style={styles.roundCount}>
                  {event.rondas.length} {event.rondas.length === 1 ? 'Ronda' : 'Rondas'}
                </Text>
              </View>

              <View style={styles.eventDetails}>
                <View style={styles.eventDetail}>
                  <Text style={styles.detailIcon}>📍</Text>
                  <Text style={styles.detailText}>{event.ubicacion}</Text>
                </View>
                <View style={styles.eventDetail}>
                  <Text style={styles.detailIcon}>📅</Text>
                  <Text style={styles.detailText}>{event.fecha}</Text>
                </View>
              </View>

              {/* Show active rounds count */}
              <View style={styles.activeRoundsContainer}>
                {event.rondas.filter(r => r.active).length > 0 ? (
                  <Text style={styles.activeRoundsText}>
                    🟢 {event.rondas.filter(r => r.active).length} ronda(s) activa(s)
                  </Text>
                ) : (
                  <Text style={styles.inactiveRoundsText}>
                    🔴 Sin rondas activas
                  </Text>
                )}
              </View>

              <View style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsText}>Ver Detalles →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navItemActive}>
          <Text style={styles.navIconActive}>🏠</Text>
          <Text style={styles.navTextActive}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Results')}
        >
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navText}>Resultados</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Rankings')}
        >
          <Text style={styles.navIcon}>🏆</Text>
          <Text style={styles.navText}>Rankings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoEmoji: {
    fontSize: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#D52B1E',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#FFF',
    fontWeight: '600',
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  ticketsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ticketEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  ticketsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  eventCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  roundCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D52B1E',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  activeRoundsContainer: {
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  activeRoundsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
  },
  inactiveRoundsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  viewDetailsButton: {
    alignItems: 'center',
    paddingTop: 8,
  },
  viewDetailsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D52B1E',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 10,
    paddingTop: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.5,
  },
  navIconActive: {
    fontSize: 24,
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    color: '#999',
  },
  navTextActive: {
    fontSize: 12,
    color: '#D52B1E',
    fontWeight: '600',
  },
});

export default HomeScreen;