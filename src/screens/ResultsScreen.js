// src/screens/ResultsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { pollUserResults } from '../api/apiService';

const ResultsScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [predictionResults, setPredictionResults] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    // Set up polling for results (every 20 seconds)
    const stopPolling = pollUserResults(user.user_id, (data, error) => {
      if (data) {
        setResultsVisible(data.resultsVisible);
        setPredictionResults(data.predictionResults || []);
        setTotalPoints(data.totalPoints || 0);
        setLoading(false);
      } else if (error) {
        console.error('Polling error:', error);
        setLoading(false);
      }
    }, 20000);

    return () => stopPolling();
  }, [user.user_id]);

  const onRefresh = () => {
    setRefreshing(true);
    // Polling will automatically update
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D52B1E" />
        <Text style={styles.loadingText}>Cargando resultados...</Text>
      </View>
    );
  }

  if (!resultsVisible) {
    return (
      <View style={styles.hiddenResultsContainer}>
        <Text style={styles.hiddenIcon}>🔒</Text>
        <Text style={styles.hiddenResultsText}>
          Los resultados no están disponibles en este momento.
        </Text>
        <Text style={styles.hiddenResultsSubtext}>
          Por favor, vuelve más tarde cuando el administrador los haga visibles.
        </Text>
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
      {/* Header with Total Points */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Resultados</Text>
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>Puntos Totales</Text>
          <Text style={styles.pointsValue}>{totalPoints}</Text>
        </View>
      </View>

      {/* Results List */}
      {predictionResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No hay predicciones para mostrar.
          </Text>
        </View>
      ) : (
        predictionResults.map((result, index) => (
          <View
            key={result.pelea_id || index}
            style={[
              styles.resultCard,
              result.correct ? styles.resultCardCorrect : styles.resultCardIncorrect,
            ]}
          >
            <View style={styles.resultHeader}>
              <Text style={styles.matchNumber}>Pelea #{index + 1}</Text>
              {result.correct ? (
                <View style={styles.correctBadge}>
                  <Text style={styles.correctText}>✓ Correcto</Text>
                </View>
              ) : (
                <View style={styles.incorrectBadge}>
                  <Text style={styles.incorrectText}>✗ Incorrecto</Text>
                </View>
              )}
            </View>

            <Text style={styles.matchText}>
              {result.equipo1} vs {result.equipo2}
            </Text>

            <View style={styles.resultDetails}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Tu predicción:</Text>
                <Text style={styles.resultValue}>
                  {result.prediccion === 'equipo1' && result.equipo1}
                  {result.prediccion === 'equipo2' && result.equipo2}
                  {result.prediccion === 'empate' && 'Empate'}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Resultado real:</Text>
                <Text style={[styles.resultValue, styles.resultValueBold]}>
                  {result.resultado === 'equipo1' && result.equipo1}
                  {result.resultado === 'equipo2' && result.equipo2}
                  {result.resultado === 'tie' && 'Empate'}
                  {!result.resultado && 'Pendiente'}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔄 Actualizando automáticamente cada 20 segundos
        </Text>
      </View>
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
  hiddenResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  hiddenIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  hiddenResultsText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  hiddenResultsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
    marginBottom: 15,
  },
  pointsCard: {
    backgroundColor: '#FFC107',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#333',
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#FFF',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultCardCorrect: {
    borderLeftColor: '#2ECC71',
  },
  resultCardIncorrect: {
    borderLeftColor: '#E74C3C',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchNumber: {
    fontSize: 14,
    color: '#999',
  },
  correctBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  correctText: {
    color: '#2ECC71',
    fontSize: 12,
    fontWeight: 'bold',
  },
  incorrectBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  incorrectText: {
    color: '#E74C3C',
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  resultDetails: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 14,
    color: '#333',
  },
  resultValueBold: {
    fontWeight: 'bold',
    color: '#D52B1E',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default ResultsScreen;