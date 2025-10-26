// src/screens/ResultsScreen.js - PREMIUM BRANDED VERSION
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
    setTimeout(() => setRefreshing(false), 1000);
  };

  const calculateAccuracy = () => {
    if (predictionResults.length === 0) return 0;
    const correct = predictionResults.filter(r => r.correct).length;
    return Math.round((correct / predictionResults.length) * 100);
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
        <Text style={styles.hiddenResultsTitle}>Resultados Ocultos</Text>
        <Text style={styles.hiddenResultsText}>
          Los resultados no están disponibles en este momento.
        </Text>
        <Text style={styles.hiddenResultsSubtext}>
          El administrador los hará visibles próximamente.
        </Text>
      </View>
    );
  }

  const correctCount = predictionResults.filter(r => r.correct).length;
  const incorrectCount = predictionResults.length - correctCount;
  const accuracy = calculateAccuracy();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Resultados</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Puntos</Text>
            <Text style={styles.statValue}>{totalPoints}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Precisión</Text>
            <Text style={styles.statValue}>{accuracy}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Correctas</Text>
            <Text style={[styles.statValue, styles.correctValue]}>{correctCount}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {predictionResults.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📊</Text>
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
                    <Text style={styles.badgeText}>✓ Correcto</Text>
                  </View>
                ) : (
                  <View style={styles.incorrectBadge}>
                    <Text style={styles.badgeText}>✗ Incorrecto</Text>
                  </View>
                )}
              </View>

              <View style={styles.matchInfo}>
                <Text style={styles.matchTeams}>
                  {result.equipo1} <Text style={styles.vs}>VS</Text> {result.equipo2}
                </Text>
              </View>

              <View style={styles.resultDetails}>
                <View style={styles.predictionRow}>
                  <View style={styles.predictionLabel}>
                    <Text style={styles.predictionLabelText}>Tu predicción</Text>
                  </View>
                  <Text style={styles.predictionValue}>
                    {result.prediccion === 'equipo1' && result.equipo1}
                    {result.prediccion === 'equipo2' && result.equipo2}
                    {result.prediccion === 'empate' && 'Empate'}
                  </Text>
                </View>

                <View style={styles.resultRow}>
                  <View style={styles.resultLabel}>
                    <Text style={styles.resultLabelText}>Resultado real</Text>
                  </View>
                  <Text style={[styles.resultValue, result.correct && styles.resultValueCorrect]}>
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
            🔄 Actualización automática cada 20 segundos
          </Text>
        </View>
      </ScrollView>
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
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  hiddenResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F5F5F5',
  },
  hiddenIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  hiddenResultsTitle: {
    fontSize: 24,
    color: '#1a1a1a',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  hiddenResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  hiddenResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#D52B1E',
    paddingTop: 60,
    paddingBottom: 25,
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  correctValue: {
    color: '#FFC107',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingTop: 20,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#FFF',
    marginBottom: 12,
    padding: 16,
    borderRadius: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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
    marginBottom: 12,
  },
  matchNumber: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  correctBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  incorrectBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchInfo: {
    marginBottom: 12,
  },
  matchTeams: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  vs: {
    color: '#D52B1E',
    fontSize: 14,
  },
  resultDetails: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 12,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predictionLabel: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  predictionLabelText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  predictionValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  resultLabel: {
    backgroundColor: '#D52B1E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resultLabelText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 14,
    color: '#D52B1E',
    fontWeight: 'bold',
  },
  resultValueCorrect: {
    color: '#2ECC71',
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