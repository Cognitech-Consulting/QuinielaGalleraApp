// src/screens/RoundPredictionsScreen.js
// Updated: Allows multiple participations in the same round

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://cognitech.pythonanywhere.com';

export default function RoundPredictionsScreen({ route, navigation }) {
  const { round } = route.params || {}; // Changed from ronda to round

  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userTickets, setUserTickets] = useState(0);
  const [participationCount, setParticipationCount] = useState(0);

  // Safety check - if no round data, go back
  useEffect(() => {
    if (!round || !round.id || !round.numero || !round.peleas) {
      Alert.alert(
        'Error',
        'No se pudo cargar la información de la ronda',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
  }, [round]);

  useEffect(() => {
    if (round && round.id) {
      loadUserData();
      checkParticipationCount();
    }
  }, [round]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('User data from AsyncStorage:', user); // Debug log
        
        // First, set from AsyncStorage
        setUserTickets(user.event_tickets || 0);
        
        // Then, fetch fresh data from API
        try {
          const response = await fetch(
            `${API_URL}/api/accounts/tickets/?user_id=${user.user_id}`
          );
          
          if (response.ok) {
            const data = await response.json();
            console.log('Fresh ticket data from API:', data); // Debug log
            
            // Update AsyncStorage with fresh data
            user.event_tickets = data.event_tickets;
            await AsyncStorage.setItem('user', JSON.stringify(user));
            
            // Update state
            setUserTickets(data.event_tickets);
          }
        } catch (apiError) {
          console.error('Error fetching fresh ticket data:', apiError);
          // Continue with cached data if API fails
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkParticipationCount = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const response = await fetch(
        `${API_URL}/eventos/api/check-ronda-participation/?user_id=${user.user_id}&ronda_id=${round.id}`
      );

      if (response.ok) {
        const data = await response.json();
        setParticipationCount(data.participaciones_count);
      }
    } catch (error) {
      console.error('Error checking participation:', error);
    }
  };

  const handlePredictionSelect = (peleaId, choice) => {
    setPredictions({
      ...predictions,
      [peleaId]: choice,
    });
  };

  const allPredictionsSelected = () => {
    return round.peleas.every((pelea) => predictions[pelea.id] !== undefined);
  };

  const handleSubmit = () => {
    if (!allPredictionsSelected()) {
      Alert.alert(
        'Predicciones Incompletas',
        'Debes seleccionar un ganador para todas las peleas antes de enviar.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (userTickets < 1) {
      Alert.alert(
        'Sin Tickets',
        'No tienes tickets disponibles. Necesitas 1 ticket para participar.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirmar Participación',
      `Esto usará 1 ticket. Te quedarán ${userTickets - 1} tickets.\n\n${
        participationCount > 0
          ? `Esta será tu participación #${participationCount + 1} en esta ronda.`
          : 'Esta será tu primera participación en esta ronda.'
      }`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: submitPredictions,
        },
      ]
    );
  };

  const submitPredictions = async () => {
    setSubmitting(true);

    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        Alert.alert('Error', 'No se encontró información del usuario');
        setSubmitting(false);
        return;
      }

      const user = JSON.parse(userData);

      // Format predictions for API
      const predictionsArray = round.peleas.map((pelea) => ({
        pelea_id: pelea.id,
        prediccion: predictions[pelea.id],
      }));

      const response = await fetch(`${API_URL}/eventos/api/submit-ronda-predictions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id,
          ronda_id: round.id,
          predictions: predictionsArray,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update user tickets locally
        user.event_tickets = data.tickets_restantes;
        await AsyncStorage.setItem('user', JSON.stringify(user));
        setUserTickets(data.tickets_restantes);

        Alert.alert(
          '¡Éxito!',
          `Participación #${data.participacion_numero} registrada exitosamente.\n\nTickets restantes: ${data.tickets_restantes}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset predictions for potential new participation
                setPredictions({});
                setParticipationCount(data.participacion_numero);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'No se pudieron enviar las predicciones');
      }
    } catch (error) {
      console.error('Error submitting predictions:', error);
      Alert.alert('Error', 'Ocurrió un error al enviar las predicciones');
    } finally {
      setSubmitting(false);
    }
  };

  const getChoiceStyle = (peleaId, choice) => {
    return predictions[peleaId] === choice ? styles.choiceSelected : styles.choice;
  };

  const getChoiceTextStyle = (peleaId, choice) => {
    return predictions[peleaId] === choice
      ? styles.choiceTextSelected
      : styles.choiceText;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Safety check */}
      {!round || !round.peleas ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D52B1E" />
          <Text style={styles.loadingText}>Cargando ronda...</Text>
        </View>
      ) : (
        <>
          {/* Header Card */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ronda {round.numero || '?'}</Text>
            <View style={styles.headerInfo}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Tickets Disponibles</Text>
                <Text style={styles.infoValue}>{userTickets}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Tus Participaciones</Text>
                <Text style={styles.infoValue}>{participationCount}</Text>
              </View>
            </View>
            {participationCount > 0 && (
              <Text style={styles.participationNote}>
                💡 Puedes participar múltiples veces en esta ronda
              </Text>
            )}
          </View>

          {/* Fights */}
          <View style={styles.fightsContainer}>
            <Text style={styles.sectionTitle}>Selecciona tus predicciones:</Text>

            {round.peleas.map((pelea, index) => (
              <View key={pelea.id} style={styles.fightCard}>
                <Text style={styles.fightNumber}>Pelea {index + 1}</Text>
                <Text style={styles.fightTitle}>
                  {pelea.equipo1} vs {pelea.equipo2}
                </Text>

                <View style={styles.choicesContainer}>
                  <TouchableOpacity
                    style={getChoiceStyle(pelea.id, 'equipo1')}
                    onPress={() => handlePredictionSelect(pelea.id, 'equipo1')}
                  >
                    <Text style={getChoiceTextStyle(pelea.id, 'equipo1')}>
                      {pelea.equipo1}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={getChoiceStyle(pelea.id, 'empate')}
                    onPress={() => handlePredictionSelect(pelea.id, 'empate')}
                  >
                    <Text style={getChoiceTextStyle(pelea.id, 'empate')}>Empate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={getChoiceStyle(pelea.id, 'equipo2')}
                    onPress={() => handlePredictionSelect(pelea.id, 'equipo2')}
                  >
                    <Text style={getChoiceTextStyle(pelea.id, 'equipo2')}>
                      {pelea.equipo2}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!allPredictionsSelected() || userTickets < 1 || submitting) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!allPredictionsSelected() || userTickets < 1 || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {userTickets < 1
                  ? 'Sin Tickets Disponibles'
                  : 'Usar 1 Ticket y Enviar Predicciones'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#D52B1E',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  infoValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  participationNote: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
    fontStyle: 'italic',
  },
  fightsContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  fightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fightNumber: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  fightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  choicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  choice: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  choiceSelected: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D52B1E',
    backgroundColor: '#D52B1E',
    alignItems: 'center',
  },
  choiceText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  choiceTextSelected: {
    fontSize: 13,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#D52B1E',
    padding: 18,
    borderRadius: 12,
    margin: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 30,
  },
});