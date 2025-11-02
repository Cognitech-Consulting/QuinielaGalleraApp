// src/screens/HomeScreen.js - LOCKED AFTER SUBMISSION (FIXED)
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
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  getCurrentEvent,
  pollCurrentEvent,
  checkParticipation,
  hasSubmittedPredictions,
} from '../api/apiService';

const formatMonedas = (amount) => `${amount} 💰`;

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monedas, setMonedas] = useState(0);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadInitialData();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    const stopPolling = pollCurrentEvent((data, error) => {
      if (data) setEvent(data);
      else if (error) console.error('Polling error:', error);
    }, 15000);

    return () => {
      stopPolling();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadInitialData();
    }, [])
  );

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const eventData = await getCurrentEvent();
      setEvent(eventData);
      setMonedas(Number(user?.monedas ?? 0));
      const participationData = await checkParticipation(user.user_id, eventData.id);
      setHasParticipated(participationData.participated);
      if (participationData.participated) {
        try {
          const submittedData = await hasSubmittedPredictions(user.user_id, eventData.id);
          setHasSubmitted(submittedData.has_submitted);
        } catch (error) {
          console.error('Error checking submission:', error);
          setHasSubmitted(false);
        }
      } else {
        setHasSubmitted(false);
      }
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
    const canParticipate = monedas >= 50;
    if (!canParticipate) {
      Alert.alert('Sin Monedas', 'No tienes monedas suficientes para participar en este evento.', [{ text: 'OK' }]);
      return;
    }
    Alert.alert(
      'Usar Monedas',
      '¿Deseas usar 50 monedas para participar en este evento?\n\n✓ Hacer predicciones\n✓ Enviar predicciones\n✓ Ver resultados',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Participar',
          onPress: async () => {
            try {
              setMonedas((m) => m - 50);
              setHasParticipated(true);
              setHasSubmitted(false);
              navigation.navigate('Predictions', { event });
            } catch (error) {
              Alert.alert('Error', 'No se pudo procesar la participación');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🐓</Text>
        </View>
        <ActivityIndicator size="large" color="#D52B1E" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Cargando evento...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>😴</Text>
        <Text style={styles.emptyTitle}>Sin Eventos Activos</Text>
        <Text style={styles.emptyText}>No hay eventos en este momento</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canParticipate = monedas >= 50;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Bienvenido</Text>
            <Text style={styles.userIdText}>{user.user_id}</Text>
          </View>
          <View style={styles.ticketsContainer}>
            <Text style={styles.ticketsLabel}>Monedas</Text>
            <Text style={styles.ticketsCount}>{formatMonedas(monedas)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.eventCard}>
        <View style={styles.liveIndicator}>
          <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.liveText}>EN VIVO</Text>
        </View>

        <View style={styles.eventHeader}>
          <Text style={styles.eventEmoji}>🏆</Text>
          <View style={styles.eventHeaderText}>
            <Text style={styles.eventName}>{event.nombre}</Text>
            <Text style={styles.eventDate}>📅 {event.fecha}</Text>
          </View>
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.eventDetailRow}>
            <Text style={styles.eventDetailIcon}>📍</Text>
            <Text style={styles.eventDetailText}>{event.ubicacion}</Text>
          </View>
          <View style={styles.eventDetailRow}>
            <Text style={styles.eventDetailIcon}>🎯</Text>
            <Text style={styles.eventDetailText}>{event.rondas?.length || 0} Rondas</Text>
          </View>
          <View style={styles.eventDetailRow}>
            <Text style={styles.eventDetailIcon}>⚔️</Text>
            <Text style={styles.eventDetailText}>
              {event.rondas?.reduce((total, ronda) => total + (ronda.peleas?.length || 0), 0) || 0} Peleas
            </Text>
          </View>
        </View>

        {!hasParticipated ? (
          <TouchableOpacity
            style={[styles.participateButton, !canParticipate && styles.buttonDisabled]}
            onPress={handleParticipate}
            activeOpacity={0.8}
          >
            <Text style={styles.participateButtonText}>
              {canParticipate ? 'Participar (50 Monedas)' : 'Sin Monedas'}
            </Text>
          </TouchableOpacity>
        ) : hasSubmitted ? (
          <View style={styles.lockedCard}>
            <View style={styles.lockedHeader}>
              <Text style={styles.lockedIcon}>🔒</Text>
              <Text style={styles.lockedTitle}>Predicciones Enviadas</Text>
            </View>
            <Text style={styles.lockedText}>Ya enviaste tus predicciones para este evento.</Text>
            <TouchableOpacity
              style={styles.viewResultsButton}
              onPress={() => navigation.navigate('Results')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewResultsButtonText}>Ver Mis Resultados →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('Predictions', { event })}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continuar Predicciones →</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.quickAccessSection}>
        <Text style={styles.sectionTitle}>Acceso Rápido</Text>
        <View style={styles.quickAccess}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => navigation.navigate('Results')}
            activeOpacity={0.7}
          >
            <View style={styles.quickButtonIconContainer}>
              <Text style={styles.quickButtonIcon}>📊</Text>
            </View>
            <Text style={styles.quickButtonText}>Mis Resultados</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => navigation.navigate('Rankings')}
            activeOpacity={0.7}
          >
            <View style={styles.quickButtonIconContainer}>
              <Text style={styles.quickButtonIcon}>🏆</Text>
            </View>
            <Text style={styles.quickButtonText}>Rankings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}
          >
            <View style={styles.quickButtonIconContainer}>
              <Text style={styles.quickButtonIcon}>👤</Text>
            </View>
            <Text style={styles.quickButtonText}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { paddingBottom: 30 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  logoEmoji: { fontSize: 50 },
  loadingText: { marginTop: 20, fontSize: 16, color: '#666', fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F5F5F5' },
  emptyEmoji: { fontSize: 80, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  header: {
    backgroundColor: '#D52B1E', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500' },
  userIdText: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  ticketsContainer: {
    backgroundColor: '#FFC107', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  ticketsLabel: { fontSize: 11, color: '#1a1a1a', fontWeight: '600' },
  ticketsCount: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center' },
  eventCard: {
    backgroundColor: '#FFF', marginHorizontal: 20, marginTop: -30, padding: 20, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10,
  },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00FF00', marginRight: 8 },
  liveText: { fontSize: 12, fontWeight: 'bold', color: '#00FF00', letterSpacing: 1 },
  eventHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  eventEmoji: { fontSize: 40, marginRight: 15 },
  eventHeaderText: { flex: 1 },
  eventName: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 5 },
  eventDate: { fontSize: 14, color: '#666' },
  eventDetails: { backgroundColor: '#F8F8F8', borderRadius: 12, padding: 15, marginBottom: 20 },
  eventDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  eventDetailIcon: { fontSize: 18, marginRight: 10 },
  eventDetailText: { fontSize: 15, color: '#333', fontWeight: '500' },
  participateButton: {
    backgroundColor: '#D52B1E', padding: 16, borderRadius: 12, alignItems: 'center',
    shadowColor: '#D52B1E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  continueButton: {
    backgroundColor: '#2ECC71', padding: 16, borderRadius: 12, alignItems: 'center',
    shadowColor: '#2ECC71', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  buttonDisabled: { backgroundColor: '#999', opacity: 0.6 },
  participateButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  continueButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  lockedCard: { backgroundColor: '#FFF9E6', padding: 15, borderRadius: 12, borderWidth: 2, borderColor: '#FFC107' },
  lockedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  lockedIcon: { fontSize: 24, marginRight: 10 },
  lockedTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  lockedText: { fontSize: 14, color: '#666', marginBottom: 15 },
  viewResultsButton: { backgroundColor: '#D52B1E', padding: 12, borderRadius: 8, alignItems: 'center' },
  viewResultsButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  quickAccessSection: { marginTop: 30, marginHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 15 },
  quickAccess: { flexDirection: 'row', justifyContent: 'space-between' },
  quickButton: {
    backgroundColor: '#FFF', padding: 15, borderRadius: 15, alignItems: 'center', flex: 1, marginHorizontal: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  quickButtonIconContainer: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  quickButtonIcon: { fontSize: 24 },
  quickButtonText: { fontSize: 12, color: '#333', textAlign: 'center', fontWeight: '600' },
  logoutButton: {
    backgroundColor: '#1a1a1a', marginHorizontal: 20, marginTop: 30, padding: 16, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#333',
  },
  logoutButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default HomeScreen;
