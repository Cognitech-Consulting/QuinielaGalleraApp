import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import apiService from '../api/apiService';

export default function ResultsScreen({ route, navigation }) {
  const { evento } = route.params || {};
  const { user } = useAuth();
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRonda, setExpandedRonda] = useState(null);

  useEffect(() => {
    loadParticipations();
  }, [evento]);

  const loadParticipations = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserRondaParticipations(
        user.user_id,
        evento?.id
      );
      
      if (response.participations) {
        setParticipations(response.participations);
      }
    } catch (error) {
      console.error('Error loading participations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadParticipations();
  };

  const toggleRonda = (rondaId) => {
    setExpandedRonda(expandedRonda === rondaId ? null : rondaId);
  };

  const getResultIcon = (resultado) => {
    switch (resultado) {
      case 'correcto':
        return '✅';
      case 'incorrecto':
        return '❌';
      case 'pendiente':
        return '⏳';
      default:
        return '❓';
    }
  };

  const renderPrediction = (prediction) => (
    <View key={prediction.pelea_id} style={styles.predictionItem}>
      <View style={styles.predictionHeader}>
        <Text style={styles.predictionNumber}>Pelea #{prediction.pelea_numero}</Text>
        <Text style={styles.resultIcon}>{getResultIcon(prediction.resultado)}</Text>
      </View>
      
      <View style={styles.predictionDetails}>
        <Text style={styles.predictionLabel}>Tu predicción:</Text>
        <Text style={styles.predictionValue}>
          {prediction.prediccion === '1'
            ? `Gallo 1 (${prediction.gallo1_nombre})`
            : prediction.prediccion === '2'
            ? `Gallo 2 (${prediction.gallo2_nombre})`
            : 'Empate'}
        </Text>
      </View>

      {prediction.resultado_real && (
        <View style={styles.predictionDetails}>
          <Text style={styles.predictionLabel}>Resultado real:</Text>
          <Text style={styles.resultValue}>
            {prediction.resultado_real === '1'
              ? `Ganó Gallo 1`
              : prediction.resultado_real === '2'
              ? `Ganó Gallo 2`
              : 'Empate'}
          </Text>
        </View>
      )}

      {prediction.puntos > 0 && (
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>+{prediction.puntos} pts</Text>
        </View>
      )}
    </View>
  );

  const renderParticipation = ({ item }) => {
    const isExpanded = expandedRonda === item.ronda_id;
    const statusColor =
      item.total_points > 0
        ? '#27ae60'
        : item.predictions?.every(p => p.resultado === 'pendiente')
        ? '#f39c12'
        : '#e74c3c';

    return (
      <View style={styles.participationCard}>
        <TouchableOpacity
          style={styles.participationHeader}
          onPress={() => toggleRonda(item.ronda_id)}
        >
          <View style={styles.participationInfo}>
            <Text style={styles.rondaTitle}>Ronda {item.ronda_number}</Text>
            <Text style={styles.participationDate}>
              {new Date(item.participated_at).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.participationStats}>
            <View style={[styles.pointsBadgeHeader, { backgroundColor: statusColor }]}>
              <Text style={styles.pointsHeaderText}>{item.total_points} pts</Text>
            </View>
            <Text style={styles.predictionsCountText}>
              {item.predictions_count} peleas
            </Text>
          </View>

          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && item.predictions && (
          <View style={styles.predictionsContainer}>
            {item.predictions.map(renderPrediction)}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </SafeAreaView>
    );
  }

  if (participations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>Sin Resultados</Text>
          <Text style={styles.emptyText}>
            Aún no has participado en ninguna ronda de este evento
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalPoints = participations.reduce((sum, p) => sum + (p.total_points || 0), 0);
  const totalParticipations = participations.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{evento?.nombre || 'Resultados'}</Text>
        <View style={styles.headerStats}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalPoints}</Text>
            <Text style={styles.statLabel}>Puntos Totales</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalParticipations}</Text>
            <Text style={styles.statLabel}>Rondas Jugadas</Text>
          </View>
        </View>
      </View>

      {/* Participations List */}
      <FlatList
        data={participations}
        renderItem={renderParticipation}
        keyExtractor={(item) => item.ronda_id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#e74c3c']}
            tintColor="#e74c3c"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    backgroundColor: '#2c2c2c',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e74c3c',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  statLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  listContent: {
    padding: 15,
  },
  participationCard: {
    backgroundColor: '#2c2c2c',
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#3c3c3c',
    overflow: 'hidden',
  },
  participationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  participationInfo: {
    flex: 1,
  },
  rondaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  participationDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  participationStats: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  pointsBadgeHeader: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  pointsHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  predictionsCountText: {
    fontSize: 12,
    color: '#95a5a6',
  },
  expandIcon: {
    color: '#e74c3c',
    fontSize: 16,
  },
  predictionsContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#3c3c3c',
  },
  predictionItem: {
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  resultIcon: {
    fontSize: 20,
  },
  predictionDetails: {
    marginBottom: 6,
  },
  predictionLabel: {
    fontSize: 11,
    color: '#95a5a6',
    marginBottom: 2,
  },
  predictionValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 14,
    color: '#f39c12',
    fontWeight: '600',
  },
  pointsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  pointsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});