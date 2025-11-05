import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { getPrizePoolInfo } from '../api/apiService';

export default function PrizeDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prizeData, setPrizeData] = useState(null);

  useEffect(() => {
    loadPrizeData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadPrizeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPrizeData = async () => {
    try {
      const data = await getPrizePoolInfo();
      setPrizeData(data);
    } catch (error) {
      console.error('Error loading prize data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPrizeData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D52B1E" />
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
      {/* Current Prize Pool */}
      <View style={styles.prizePoolCard}>
        <Text style={styles.prizePoolLabel}>🏆 Pozo Acumulado</Text>
        <Text style={styles.prizePoolAmount}>
          {prizeData?.prize_pool?.current_amount?.toLocaleString('es-GT', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </Text>
        <Text style={styles.prizePoolCurrency}>MONEDAS</Text>
        <Text style={styles.prizePoolSubtext}>
          {prizeData?.prize_pool?.participations_since_reset} participaciones desde último reseteo
        </Text>
      </View>

      {/* Last Winner */}
      {prizeData?.prize_pool?.last_winner && (
        <View style={styles.lastWinnerCard}>
          <Text style={styles.sectionTitle}>🎉 Último Ganador</Text>
          <Text style={styles.winnerText}>
            {prizeData.prize_pool.last_winner}
          </Text>
          <Text style={styles.winnerDate}>
            {new Date(prizeData.prize_pool.last_reset).toLocaleDateString('es-GT')}
          </Text>
        </View>
      )}

      {/* Prize Tiers */}
      <View style={styles.prizeTiersCard}>
        <Text style={styles.sectionTitle}>💰 Premios</Text>
        
        <View style={styles.tierRow}>
          <Text style={styles.tierEmoji}>🥇</Text>
          <View style={styles.tierInfo}>
            <Text style={styles.tierTitle}>10/10 Correctas</Text>
            <Text style={styles.tierAmount}>¡POZO COMPLETO!</Text>
          </View>
        </View>

        <View style={styles.tierRow}>
          <Text style={styles.tierEmoji}>🥈</Text>
          <View style={styles.tierInfo}>
            <Text style={styles.tierTitle}>9/10 Correctas</Text>
            <Text style={styles.tierAmount}>1,000 monedas</Text>
          </View>
        </View>

        <View style={styles.tierRow}>
          <Text style={styles.tierEmoji}>🥉</Text>
          <View style={styles.tierInfo}>
            <Text style={styles.tierTitle}>8/10 Correctas</Text>
            <Text style={styles.tierAmount}>50 monedas</Text>
          </View>
        </View>
      </View>

      {/* Terms */}
      <View style={styles.termsCard}>
        <Text style={styles.sectionTitle}>📋 Términos</Text>
        <Text style={styles.termText}>
          • El pozo es global para todos los eventos activos
        </Text>
        <Text style={styles.termText}>
          • Cada participación suma 5 monedas al pozo
        </Text>
        <Text style={styles.termText}>
          • Si hay múltiples ganadores de 10/10, el premio se divide equitativamente
        </Text>
        <Text style={styles.termText}>
          • El pozo se reinicia a 10,000 monedas tras cualquier ganador de 10/10
        </Text>
      </View>

      {/* Recent Winners */}
      {prizeData?.recent_winners && prizeData.recent_winners.length > 0 && (
        <View style={styles.recentWinnersCard}>
          <Text style={styles.sectionTitle}>🏅 Ganadores Recientes</Text>
          {prizeData.recent_winners.map((winner, index) => (
            <View key={index} style={styles.winnerRow}>
              <Text style={styles.winnerName}>{winner.nombre}</Text>
              <Text style={styles.winnerPrize}>
                {winner.premio.toLocaleString('es-GT')} monedas
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

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
  prizePoolCard: {
    backgroundColor: '#D52B1E',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  prizePoolLabel: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  prizePoolAmount: {
    fontSize: 48,
    color: '#FFF',
    fontWeight: 'bold',
  },
  prizePoolCurrency: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
    marginTop: 4,
  },
  prizePoolSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 12,
  },
  lastWinnerCard: {
    backgroundColor: '#FFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  winnerText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  winnerDate: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  prizeTiersCard: {
    backgroundColor: '#FFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  tierInfo: {
    flex: 1,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tierAmount: {
    fontSize: 14,
    color: '#D52B1E',
    fontWeight: '600',
    marginTop: 2,
  },
  termsCard: {
    backgroundColor: '#FFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  termText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  recentWinnersCard: {
    backgroundColor: '#FFF',
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  winnerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  winnerName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  winnerPrize: {
    fontSize: 14,
    color: '#D52B1E',
    fontWeight: '600',
  },
});