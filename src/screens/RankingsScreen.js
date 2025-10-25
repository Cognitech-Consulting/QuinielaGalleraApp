// src/screens/RankingsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pollRankings } from '../api/apiService';

const RankingsScreen = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [eventId, setEventId] = useState(null);

  useEffect(() => {
    initializeRankings();
  }, []);

  const initializeRankings = async () => {
    try {
      const activeEventId = await AsyncStorage.getItem('active_event_id');
      
      if (!activeEventId) {
        setError('No se encontró el ID del evento activo.');
        setLoading(false);
        return;
      }

      setEventId(activeEventId);

      // Set up polling for rankings (every 30 seconds)
      const stopPolling = pollRankings(activeEventId, (data, err) => {
        if (data) {
          setRankings(data.rankings || []);
          setError(null);
          setLoading(false);
        } else if (err) {
          // Check if it's a 403 error (ranking hidden)
          if (err.error === 'Ranking is currently hidden.') {
            setError('hidden');
          } else {
            setError(err.error || 'Error al cargar el ranking.');
          }
          setLoading(false);
        }
      }, 30000);

      // Cleanup
      return () => {
        stopPolling();
      };
    } catch (error) {
      console.error('Initialize Rankings Error:', error);
      setError('Hubo un problema al inicializar el ranking.');
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D52B1E" />
        <Text style={styles.loadingText}>Cargando ranking...</Text>
      </View>
    );
  }

  if (error === 'hidden') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>🔒</Text>
        <Text style={styles.errorTitle}>Ranking Oculto</Text>
        <Text style={styles.errorText}>
          El ranking no está disponible en este momento. El administrador lo hará visible cuando corresponda.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Ranking</Text>
        <Text style={styles.headerSubtitle}>Top 10 Participantes</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {rankings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No hay datos de ranking para mostrar.
            </Text>
          </View>
        ) : (
          rankings.map((rank, index) => (
            <View
              key={index}
              style={[
                styles.rankItem,
                index === 0 && styles.rankItemFirst,
                index === 1 && styles.rankItemSecond,
                index === 2 && styles.rankItemThird,
              ]}
            >
              <View style={styles.rankPosition}>
                {index === 0 && <Text style={styles.medalIcon}>🥇</Text>}
                {index === 1 && <Text style={styles.medalIcon}>🥈</Text>}
                {index === 2 && <Text style={styles.medalIcon}>🥉</Text>}
                {index > 2 && (
                  <Text style={styles.positionNumber}>{index + 1}</Text>
                )}
              </View>

              <View style={styles.rankInfo}>
                <Text style={styles.rankUser}>{rank.user}</Text>
                <Text style={styles.rankPoints}>
                  {rank.points} {rank.points === 1 ? 'punto' : 'puntos'}
                </Text>
              </View>

              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>{rank.points}</Text>
              </View>
            </View>
          ))
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔄 Actualizando automáticamente cada 30 segundos
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#D52B1E',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 10,
    marginVertical: 5,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DDD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rankItemFirst: {
    borderLeftColor: '#FFD700',
    backgroundColor: '#FFFEF7',
  },
  rankItemSecond: {
    borderLeftColor: '#C0C0C0',
    backgroundColor: '#FAFAFA',
  },
  rankItemThird: {
    borderLeftColor: '#CD7F32',
    backgroundColor: '#FFF9F5',
  },
  rankPosition: {
    width: 50,
    alignItems: 'center',
  },
  medalIcon: {
    fontSize: 32,
  },
  positionNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#999',
  },
  rankInfo: {
    flex: 1,
    marginLeft: 10,
  },
  rankUser: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rankPoints: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  rankBadge: {
    backgroundColor: '#D52B1E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rankBadgeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
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

export default RankingsScreen;