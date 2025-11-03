// src/screens/EventDetailScreen.js - NEW SCREEN FOR VIEWING RONDAS
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
  getUserRondaParticipations,
  participateInRonda,
  getUserMonedas,
  pollUserRondaParticipations,
} from '../api/apiService';

const EventDetailScreen = ({ route, navigation }) => {
  const { event } = route.params; // Event object passed from HomeScreen
  const { user, updateUser } = useAuth();
  
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monedas, setMonedas] = useState(user?.monedas || 0);
  const [processingRonda, setProcessingRonda] = useState(null);

  useEffect(() => {
    loadData();

    // Poll participations every 20 seconds
    const stopPolling = pollUserRondaParticipations(
      user.user_id,
      event.id,
      (data, error) => {
        if (data) {
          setParticipations(data.participations || []);
        }
      },
      20000
    );

    return () => {
      stopPolling();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user's participations in this event
      const partData = await getUserRondaParticipations(user.user_id, event.id);
      setParticipations(partData.participations || []);
      
      // Refresh monedas
      const monedasData = await getUserMonedas(user.user_id);
      setMonedas(monedasData.monedas);
      
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const hasParticipatedInRonda = (ronda_id) => {
    return participations.some(p => p.ronda_id === ronda_id);
  };

  const getRondaParticipation = (ronda_id) => {
    return participations.find(p => p.ronda_id === ronda_id);
  };

  const handleParticipateInRonda = async (ronda) => {
    if (monedas < 50) {
      Alert.alert(
        'Sin Monedas',
        'No tienes suficientes monedas para participar en esta ronda. Necesitas 50 💰',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirmar Participación',
      `¿Participar en Ronda ${ronda.numero}?\n\nCosto: 50 💰\nMonedas actuales: ${monedas} 💰\nMonedas después: ${monedas - 50} 💰`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Participar',
          onPress: async () => {
            try {
              setProcessingRonda(ronda.id);
              
              const response = await participateInRonda(user.user_id, ronda.id);
              
              // Update monedas
              setMonedas(response.monedas_remaining);
              await updateUser({ ...user, monedas: response.monedas_remaining });
              
              // Reload participations
              await loadData();
              
              Alert.alert(
                '¡Éxito!',
                `Participación registrada en Ronda ${ronda.numero}. Te quedan ${response.monedas_remaining} 💰`,
                [
                  {
                    text: 'Hacer Predicciones',
                    onPress: () => navigation.navigate('Predictions', {
                      ronda: ronda,
                      event: event,
                      participation_id: response.participation_id,
                    }),
                  },
                ]
              );
            } catch (error) {
              console.error('Error participating:', error);
              Alert.alert(
                'Error',
                error.error || 'No se pudo registrar la participación'
              );
            } finally {
              setProcessingRonda(null);
            }
          },
        },
      ]
    );
  };

  const handleViewResults = (ronda, participation) => {
    navigation.navigate('Results', {
      evento_id: event.id,
      ronda_id: ronda.id,
      participation_id: participation.participation_id,
    });
  };

  const renderRonda = (ronda) => {
    const participated = hasParticipatedInRonda(ronda.id);
    const participation = getRondaParticipation(ronda.id);
    const isProcessing = processingRonda === ronda.id;
    const isActive = ronda.is_active;

    return (
      <View key={ronda.id} style={styles.rondaCard}>
        {/* Header */}
        <View style={styles.rondaHeader}>
          <Text style={styles.rondaTitle}>
            {isActive ? '🔴' : '⚫'} RONDA {ronda.numero}
          </Text>
          <Text style={styles.rondaStatus}>
            {isActive ? 'ACTIVA' : 'CERRADA'}
          </Text>
        </View>

        {/* Info */}
        <Text style={styles.rondaInfo}>
          🥊 {ronda.peleas_count} Peleas
        </Text>

        {/* Participation Status */}
        {participated && participation ? (
          <View style={styles.participatedBox}>
            <Text style={styles.participatedText}>
              ✅ Ya Participaste
            </Text>
            <Text style={styles.pointsText}>
              {participation.total_points} / {participation.predictions_count} puntos
            </Text>
          </View>
        ) : isActive ? (
          <TouchableOpacity
            style={[
              styles.participateButton,
              isProcessing && styles.participateButtonDisabled,
            ]}
            onPress={() => handleParticipateInRonda(ronda)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.participateButtonText}>
                💰 Participar (50 monedas)
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.closedBox}>
            <Text style={styles.closedText}>⏳ Ronda cerrada</Text>
          </View>
        )}

        {/* View Results Button */}
        {participated && participation && (
          <TouchableOpacity
            style={styles.resultsButton}
            onPress={() => handleViewResults(ronda, participation)}
          >
            <Text style={styles.resultsButtonText}>📊 Ver Resultados</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Cargando rondas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        
        <View style={styles.monedasBadge}>
          <Text style={styles.monedasText}>💰 {monedas}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Event Info */}
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>🏆 {event.nombre}</Text>
          <Text style={styles.eventDetails}>📅 {event.fecha}</Text>
          <Text style={styles.eventDetails}>📍 {event.ubicacion}</Text>
          <Text style={styles.eventDetails}>🎯 {event.rondas_count} Rondas</Text>
        </View>

        {/* Rondas Section */}
        <View style={styles.rondasSection}>
          <Text style={styles.sectionTitle}>📊 RONDAS</Text>
          
          {event.rondas && event.rondas.length > 0 ? (
            event.rondas.map(ronda => renderRonda(ronda))
          ) : (
            <Text style={styles.noRondasText}>
              No hay rondas disponibles aún
            </Text>
          )}
        </View>

        {/* Rankings Button */}
        <TouchableOpacity
          style={styles.rankingsButton}
          onPress={() => navigation.navigate('Rankings', { event_id: event.id })}
        >
          <Text style={styles.rankingsButtonText}>🏆 Ver Rankings</Text>
        </TouchableOpacity>
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
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  monedasBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  monedasText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  eventInfo: {
    backgroundColor: '#16213E',
    padding: 20,
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  eventDetails: {
    fontSize: 16,
    color: '#CCC',
    marginBottom: 5,
  },
  rondasSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  rondaCard: {
    backgroundColor: '#16213E',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  rondaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rondaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  rondaStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  rondaInfo: {
    fontSize: 16,
    color: '#CCC',
    marginBottom: 15,
  },
  participatedBox: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  participatedText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pointsText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
  participateButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  participateButtonDisabled: {
    backgroundColor: '#999',
  },
  participateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closedBox: {
    backgroundColor: '#555',
    padding: 15,
    borderRadius: 10,
  },
  closedText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  resultsButton: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  resultsButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rankingsButton: {
    backgroundColor: '#FFD93D',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  rankingsButtonText: {
    color: '#1A1A2E',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noRondasText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default EventDetailScreen;