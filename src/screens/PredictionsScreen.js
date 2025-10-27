// src/screens/PredictionsScreen.js - ONE TIME SUBMISSION ONLY
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
import { submitPredictions, pollCurrentEvent, checkParticipation } from '../api/apiService';

const PredictionsScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const [event, setEvent] = useState(route.params?.event || null);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    verifyStatus();

    const stopPolling = pollCurrentEvent((data, error) => {
      if (data) {
        setEvent(data);
      }
    }, 15000);

    return () => stopPolling();
  }, []);

  const verifyStatus = async () => {
    if (!event) return;
    
    try {
      setCheckingStatus(true);
      const result = await checkParticipation(user.user_id, event.id);
      
      if (!result.participated) {
        Alert.alert(
          'No Autorizado',
          'Debes participar en el evento antes de hacer predicciones.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setHasParticipated(true);
        // Check if user already submitted predictions by trying to get them
        checkIfAlreadySubmitted();
      }
    } catch (error) {
      console.error('Error checking status:', error);
      Alert.alert('Error', 'No se pudo verificar tu estado en el evento.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const checkIfAlreadySubmitted = async () => {
    // We'll check this by attempting to submit
    // The backend will tell us if we already submitted
    setHasSubmitted(false); // Assume not submitted until proven otherwise
  };

  const handlePrediction = (peleaId, choice) => {
    if (hasSubmitted) {
      Alert.alert('Predicciones Bloqueadas', 'Ya enviaste tus predicciones. No puedes modificarlas.');
      return;
    }
    
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

    if (predictionsCount === 0) {
      Alert.alert(
        'Sin Predicciones',
        'Debes hacer al menos una predicción antes de enviar.'
      );
      return;
    }

    if (predictionsCount < totalPeleas) {
      Alert.alert(
        'Predicciones Incompletas',
        `Has completado ${predictionsCount} de ${totalPeleas} predicciones.\n\n⚠️ ADVERTENCIA: Una vez enviadas, NO podrás modificarlas.\n\n¿Deseas enviar ahora?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Enviar Ahora', style: 'destructive', onPress: submitUserPredictions },
        ]
      );
    } else {
      Alert.alert(
        'Confirmar Envío',
        `¿Deseas enviar tus ${predictionsCount} predicciones?\n\n⚠️ Una vez enviadas, NO podrás modificarlas.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Enviar', onPress: submitUserPredictions },
        ]
      );
    }
  };

  const submitUserPredictions = async () => {
    try {
      setLoading(true);
      
      const predictionsArray = Object.entries(predictions).map(([peleaId, choice]) => ({
        pelea_id: parseInt(peleaId),
        prediccion: choice
      }));
      
      console.log('Submitting predictions (ONE TIME):', {
        user_id: user.user_id,
        event_id: event.id,
        predictions: predictionsArray
      });
      
      const result = await submitPredictions(user.user_id, event.id, predictionsArray);
      
      setHasSubmitted(true); // Lock predictions
      
      Alert.alert(
        '¡Éxito!',
        `Predicciones enviadas correctamente!\n\nPuntos actuales: ${result.total_points || 0}\n\n✓ Tus predicciones están bloqueadas.`,
        [
          {
            text: 'Ver Resultados',
            onPress: () => navigation.navigate('Results'),
          },
          {
            text: 'Volver al Inicio',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      console.error('Submit predictions error:', error);
      
      let errorMessage = 'No se pudieron enviar las predicciones';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.error) {
        errorMessage = error.error;
        
        // Check if already submitted
        if (errorMessage.includes('Ya has enviado') || errorMessage.includes('modificarlas')) {
          setHasSubmitted(true);
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D52B1E" />
        <Text style={styles.loadingText}>Verificando estado...</Text>
      </View>
    );
  }

  if (!event || !hasParticipated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D52B1E" />
      </View>
    );
  }

  if (hasSubmitted) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedIcon}>🔒</Text>
        <Text style={styles.lockedTitle}>Predicciones Bloqueadas</Text>
        <Text style={styles.lockedText}>
          Ya enviaste tus predicciones para este evento.
        </Text>
        <Text style={styles.lockedSubtext}>
          No puedes modificarlas. Ve a "Resultados" para ver tus puntos.
        </Text>
        <TouchableOpacity
          style={styles.goToResultsButton}
          onPress={() => navigation.navigate('Results')}
          activeOpacity={0.8}
        >
          <Text style={styles.goToResultsButtonText}>Ver Mis Resultados</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.goHomeButton}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <Text style={styles.goHomeButtonText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = getTotalPeleas() > 0 ? getPredictionsCount() / getTotalPeleas() : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{event.nombre}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {getPredictionsCount()} / {getTotalPeleas()} Predicciones
          </Text>
        </View>
        
        <View style={styles.warningBadge}>
          <Text style={styles.warningText}>⚠️ Solo puedes enviar UNA vez</Text>
        </View>
      </View>

      {/* Rounds and Fights */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {event.rondas?.map((ronda, rondaIndex) => (
          <View key={ronda.id} style={styles.roundCard}>
            <View style={styles.roundHeader}>
              <Text style={styles.roundTitle}>Ronda {ronda.numero}</Text>
              <View style={styles.roundBadge}>
                <Text style={styles.roundBadgeText}>
                  {ronda.peleas?.filter(p => predictions[p.id]).length || 0}/{ronda.peleas?.length || 0}
                </Text>
              </View>
            </View>
            
            {ronda.peleas?.map((pelea, peleaIndex) => (
              <View key={pelea.id} style={styles.fightCard}>
                <View style={styles.fightHeader}>
                  <Text style={styles.fightNumber}>Pelea #{peleaIndex + 1}</Text>
                  {predictions[pelea.id] && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>✓</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fightTitle}>
                  {pelea.equipo1} <Text style={styles.vs}>VS</Text> {pelea.equipo2}
                </Text>
                
                <View style={styles.choicesContainer}>
                  <TouchableOpacity
                    style={[
                      styles.choiceButton,
                      predictions[pelea.id] === 'equipo1' && styles.choiceButtonSelected,
                    ]}
                    onPress={() => handlePrediction(pelea.id, 'equipo1')}
                    activeOpacity={0.7}
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
                      predictions[pelea.id] === 'empate' && styles.choiceButtonSelectedTie,
                    ]}
                    onPress={() => handlePrediction(pelea.id, 'empate')}
                    activeOpacity={0.7}
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
                    activeOpacity={0.7}
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
              </View>
            ))}
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
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
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F5F5F5',
  },
  lockedIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  lockedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  lockedSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  goToResultsButton: {
    backgroundColor: '#D52B1E',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
  },
  goToResultsButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goHomeButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  goHomeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#D52B1E',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFC107',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  warningBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  warningText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  roundCard: {
    backgroundColor: '#FFF',
    margin: 15,
    marginTop: 20,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#F5F5F5',
  },
  roundTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D52B1E',
  },
  roundBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  roundBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
  },
  fightCard: {
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#D52B1E',
  },
  fightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fightNumber: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#2ECC71',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  vs: {
    color: '#D52B1E',
    fontSize: 14,
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
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  choiceButtonTie: {
    flex: 0.6,
  },
  choiceButtonSelected: {
    backgroundColor: '#D52B1E',
    borderColor: '#D52B1E',
    shadowColor: '#D52B1E',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  choiceButtonSelectedTie: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
    shadowColor: '#FFC107',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
  footer: {
    padding: 15,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  submitButton: {
    backgroundColor: '#2ECC71',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default PredictionsScreen;