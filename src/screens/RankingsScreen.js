// src/screens/RankingsScreen.js - PREMIUM BRANDED VERSION
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

      const stopPolling = pollRankings(activeEventId, (data, err) => {
        if (data) {
          setRankings(data.rankings || []);
          setError(null);
          setLoading(false);
        } else if (err) {
          if (err.error === 'Ranking is currently hidden.') {
            setError('hidden');
          } else {
            setError(err.error || 'Error al cargar el ranking.');
          }
          setLoading(false);
        }
      }, 30000);

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
          El ranking no está disponible en este momento.
        </Text>
        <Text style={styles.errorSubtext}>
          El administrador lo hará visible cuando corresponda.
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
        <Text style={styles.headerEmoji}>🏆</Text>
        <Text style={styles.headerTitle}>Ranking</Text>
        <Text style={styles.headerSubtitle}>Top 10 Participantes</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {rankings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📊</Text>
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
                {index === 0 && (
                  <View style={[styles.medalContainer, styles.goldMedal]}>
                    <Text style={styles.medalIcon}>🥇</Text>
                  </View>
                )}
                {index === 1 && (
                  <View style={[styles.medalContainer, styles.silverMedal]}>
                    <Text style={styles.medalIcon}>🥈</Text>
                  </View>
                )}
                {index === 2 && (
                  <View style={[styles.medalContainer, styles.bronzeMedal]}>
                    <Text style={styles.medalIcon}>🥉</Text>
                  </View>
                )}
                {index > 2 && (
                  <View style={styles.positionCircle}>
                    <Text style={styles.positionNumber}>{index + 1}</Text>
                  </View>
                )}
              </View>

              <View style={styles.rankInfo}>
                <Text style={styles.rankUser}>{rank.user}</Text>
                <Text style={styles.rankPoints}>
                  {rank.points} {rank.points === 1 ? 'punto' : 'puntos'}
                </Text>
              </View>

              <View style={[
                styles.rankBadge,
                index === 0 && styles.badgeGold,
                index === 1 && styles.badgeSilver,
                index === 2 && styles.badgeBronze,
              ]}>
                <Text style={styles.rankBadgeText}>{rank.points}</Text>
              </View>
            </View>
          ))
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔄 Actualización automática cada 30 segundos
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F5F5F5',
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#D52B1E',
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
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
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginBottom: 10,
    padding: 16,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  rankItemFirst: {
    borderLeftColor: '#FFD700',
    backgroundColor: '#FFFEF7',
    shadowColor: '#FFD700',
    shadowOpacity: 0.2,
  },
  rankItemSecond: {
    borderLeftColor: '#C0C0C0',
    backgroundColor: '#FAFAFA',
    shadowColor: '#C0C0C0',
    shadowOpacity: 0.15,
  },
  rankItemThird: {
    borderLeftColor: '#CD7F32',
    backgroundColor: '#FFF9F5',
    shadowColor: '#CD7F32',
    shadowOpacity: 0.15,
  },
  rankPosition: {
    width: 55,
    alignItems: 'center',
  },
  medalContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldMedal: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  silverMedal: {
    backgroundColor: 'rgba(192, 192, 192, 0.1)',
  },
  bronzeMedal: {
    backgroundColor: 'rgba(205, 127, 50, 0.1)',
  },
  medalIcon: {
    fontSize: 30,
  },
  positionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  rankInfo: {
    flex: 1,
    marginLeft: 15,
  },
  rankUser: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  rankPoints: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  rankBadge: {
    backgroundColor: '#D52B1E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 15,
    shadowColor: '#D52B1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeGold: {
    backgroundColor: '#FFD700',
  },
  badgeSilver: {
    backgroundColor: '#C0C0C0',
  },
  badgeBronze: {
    backgroundColor: '#CD7F32',
  },
  rankBadgeText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  footer: {
    padding: 25,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default RankingsScreen;