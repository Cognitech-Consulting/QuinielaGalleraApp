// src/screens/PredictionsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { submitPredictions, pollCurrentEvent } from '../api/apiService';

const PredictionsScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const [event, setEvent] = useState(route.params?.event || null);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set up polling for real-time event updates
    const stopPolling = pollCurrentEvent((data, error) => {
      if (data) {
        setEvent(data);
      }
    }, 15000);

    return () => stopPolling();
  }, []);

  const handlePrediction = (peleaId, choice) => {
    setPredictions({
      ...predictions,
      [peleaId]: choice,
    });
  };

  const getTotalPeleas = () => {
    return event?.rondas?.reduce((total, ronda) => 
      total + (ronda.peleas?.length || 0), 0
    ) || 0;
  };

  const getPredictionsCount = () => {
    return Object.keys(predictions).length;
  };

  const handleSubmit = async () => {
    const totalPeleas = getTotalPeleas();
    const predictionsCount = getPredictionsCount();

    if (predictionsCount < totalPeleas) {
      Alert.alert(
        'Predicciones Incompletas',
        `Has completado ${predictionsCount} de ${totalPeleas} predicciones. ¿Deseas enviar las predicciones incompletas?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Enviar', onPress: submitUserPredictions },
        ]
      );
    } else {
      submitUserPredictions();
    }
  };

  const submitUserPredictions = async () => {
    try {
      setLoading(true);
      const result = await submitPredictions(user.user_id, predictions);
      
      Alert.alert(
        'Éxito',
        `Predicciones enviadas correctamente!\nPuntos actuales: ${result.total_points || 0}`,
        [
          {
            text: 'Ver Resultados',
            onPress: () => navigation.navigate('Results'),
          },
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.error || 'No se pudieron enviar las predicciones');
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D52B1E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{event.nombre}</Text>
        <Text style={styles.headerSubtitle}>
          {getPredictionsCount()} / {getTotalPeleas()} Predicciones
        </Text>
      </View>

      {/* Rounds and Fights */}
      <ScrollView style={styles.scrollView}>
        {event.rondas?.map((ronda) => (
          <View key={ronda.id} style={styles.roundCard}>
            <Text style={styles.roundTitle}>Ronda {ronda.numero}</Text>
            
            {ronda.peleas?.map((pelea) => (
              <View key={pelea.id} style={styles.fightCard}>
                <Text style={styles.fightTitle}>
                  {pelea.equipo1} vs {pelea.equipo2}
                </Text>
                
                <View style={styles.choicesContainer}>
                  <TouchableOpacity
                    style={[
                      styles.choiceButton,
                      predictions[pelea.id] === 'equipo1' && styles.choiceButtonSelected,
                    ]}
                    onPress={() => handlePrediction(pelea.id, 'equipo1')}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        predictions[pelea.id] === 'equipo1' && styles.choiceTextSelected,
                      ]}
                    >
                      {pelea.equipo1}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.choiceButton,
                      styles.choiceButtonTie,
                      predictions[pelea.id] === 'empate' && styles.choiceButtonSelected,
                    ]}
                    onPress={() => handlePrediction(pelea.id, 'empate')}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        predictions[pelea.id] === 'empate' && styles.choiceTextSelected,
                      ]}
                    >
                      Empate
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.choiceButton,
                      predictions[pelea.id] === 'equipo2' && styles.choiceButtonSelected,
                    ]}
                    onPress={() => handlePrediction(pelea.id, 'equipo2')}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        predictions[pelea.id] === 'equipo2' && styles.choiceTextSelected,
                      ]}
                    >
                      {pelea.equipo2}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Show result if available */}
                {pelea.resultado && (
                  <View style={styles.resultContainer}>
                    <Text style={styles.resultLabel}>Resultado: </Text>
                    <Text style={styles.resultText}>
                      {pelea.resultado === 'equipo1' && pelea.equipo1}
                      {pelea.resultado === 'equipo2' && pelea.equipo2}
                      {pelea.resultado === 'tie' && 'Empate'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              Enviar Predicciones ({getPredictionsCount()})
            </Text>
          )}
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
  },
  header: {
    backgroundColor: '#D52B1E',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFF',
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
  },
  roundCard: {
    backgroundColor: '#FFF',
    margin: 10,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roundTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D52B1E',
    marginBottom: 15,
  },
  fightCard: {
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  fightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  choicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  choiceButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  choiceButtonTie: {
    flex: 0.6,
  },
  choiceButtonSelected: {
    backgroundColor: '#D52B1E',
    borderColor: '#D52B1E',
  },
  choiceText: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  choiceTextSelected: {
    color: '#FFF',
  },
  resultContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ECC71',
  },
  footer: {
    padding: 15,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  submitButton: {
    backgroundColor: '#2ECC71',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PredictionsScreen;