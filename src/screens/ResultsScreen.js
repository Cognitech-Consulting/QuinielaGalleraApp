// src/screens/ResultadosScreen.js
// Results screen with automatic visibility based on event status

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'https://cognitech.pythonanywhere.com';

export default function ResultsScreen({ navigation }) {
  const [participaciones, setParticipaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedParticipaciones, setExpandedParticipaciones] = useState({});

  useEffect(() => {
    loadParticipaciones();
  }, []);

  const loadParticipaciones = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      const response = await fetch(
        `${API_URL}/eventos/api/get-user-ronda-participaciones/?user_id=${user.user_id}`
      );

      if (response.ok) {
        const data = await response.json();
        // Group by event
        const grouped = groupByEvent(data.participaciones);
        setParticipaciones(grouped);
      }
    } catch (error) {
      console.error('Error loading participaciones:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const groupByEvent = (participaciones) => {
    const grouped = {};

    participaciones.forEach((part) => {
      const eventoId = part.evento.id;
      if (!grouped[eventoId]) {
        grouped[eventoId] = {
          evento: part.evento,
          rondas: {},
        };
      }

      const rondaId = part.ronda.id;
      if (!grouped[eventoId].rondas[rondaId]) {
        grouped[eventoId].rondas[rondaId] = {
          ronda: part.ronda,
          participaciones: [],
        };
      }

      grouped[eventoId].rondas[rondaId].participaciones.push(part);
    });

    // Convert to array and sort
    return Object.values(grouped).map((evento) => ({
      ...evento,
      rondas: Object.values(evento.rondas).sort((a, b) => a.ronda.numero - b.ronda.numero),
    }));
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadParticipaciones();
  };

  const toggleParticipacion = (participacionId) => {
    setExpandedParticipaciones((prev) => ({
      ...prev,
      [participacionId]: !prev[participacionId],
    }));
  };

  const renderPrediccion = (pred, resultsVisible) => {
    const getStatusIcon = () => {
      if (!resultsVisible) return '⏳';
      if (pred.es_correcta === true) return '✓';
      if (pred.es_correcta === false) return '✗';
      return '⏳';
    };

    const getStatusColor = () => {
      if (!resultsVisible) return '#FFA500';
      if (pred.es_correcta === true) return '#2ECC71';
      if (pred.es_correcta === false) return '#E74C3C';
      return '#FFA500';
    };

    const getPrediccionText = () => {
      if (pred.prediccion === 'equipo1') return pred.equipo1;
      if (pred.prediccion === 'equipo2') return pred.equipo2;
      return 'Empate';
    };

    const getResultadoText = () => {
      if (!resultsVisible) return 'Evento Finalizado';
      if (!pred.resultado_real) return 'Pendiente';
      if (pred.resultado_real === 'equipo1') return pred.equipo1;
      if (pred.resultado_real === 'equipo2') return pred.equipo2;
      if (pred.resultado_real === 'tie') return 'Empate';
      return 'Pendiente';
    };

    return (
      <View key={pred.pelea_id} style={styles.prediccionCard}>
        <View style={styles.prediccionHeader}>
          <Text style={styles.prediccionTitle}>
            {pred.equipo1} vs {pred.equipo2}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
          </View>
        </View>
        <View style={styles.prediccionDetails}>
          <View style={styles.prediccionRow}>
            <Text style={styles.prediccionLabel}>Tu Predicción:</Text>
            <Text style={styles.prediccionValue}>{getPrediccionText()}</Text>
          </View>
          <View style={styles.prediccionRow}>
            <Text style={styles.prediccionLabel}>Resultado:</Text>
            <Text style={[styles.prediccionValue, { color: getStatusColor() }]}>
              {getResultadoText()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderParticipacion = (part) => {
    const isExpanded = expandedParticipaciones[part.participacion_id];
    
    // Determine status based on evento.current and ronda_cerrada
    let statusText;
    let statusColor;
    
    if (!part.evento.current) {
      // Event is no longer active - hide results
      statusText = 'Evento Finalizado';
      statusColor = '#999';
    } else if (part.ronda_cerrada && part.puntos_obtenidos !== null) {
      // Round closed and results available - show points
      statusText = `${part.puntos_obtenidos}/${part.total_peleas} puntos`;
      statusColor = '#D52B1E';
    } else {
      // Round still open or results pending
      statusText = 'Resultados Pendientes';
      statusColor = '#FFA500';
    }

    return (
      <View key={part.participacion_id} style={styles.participacionCard}>
        <TouchableOpacity
          onPress={() => toggleParticipacion(part.participacion_id)}
          style={styles.participacionHeader}
        >
          <View style={styles.participacionInfo}>
            <Text style={styles.participacionNumero}>
              Participación #{part.numero_participacion}
            </Text>
            <Text style={styles.participacionFecha}>
              {new Date(part.fecha_participacion).toLocaleDateString('es-GT', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.participacionStatus}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.prediccionesContainer}>
            <Text style={styles.prediccionesTitle}>Tus Predicciones:</Text>
            {part.predicciones.map((pred) => renderPrediccion(pred, part.results_visible))}
            
            {!part.evento.current && (
              <View style={styles.eventEndedNotice}>
                <Ionicons name="information-circle" size={20} color="#999" />
                <Text style={styles.eventEndedText}>
                  Este evento ha finalizado. Los resultados ya no están disponibles.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderRonda = (rondaData) => {
    return (
      <View key={rondaData.ronda.id} style={styles.rondaContainer}>
        <View style={styles.rondaHeader}>
          <Text style={styles.rondaTitle}>🥊 Ronda {rondaData.ronda.numero}</Text>
          <Text style={styles.rondaParticipaciones}>
            {rondaData.participaciones.length} participación
            {rondaData.participaciones.length !== 1 ? 'es' : ''}
          </Text>
        </View>
        {rondaData.participaciones.map(renderParticipacion)}
      </View>
    );
  };

  const renderEvento = (eventoData) => {
    // Show event status badge
    const isActive = eventoData.evento.current;
    
    return (
      <View key={eventoData.evento.id} style={styles.eventoContainer}>
        <View style={styles.eventoHeader}>
          <View style={styles.eventoTitleRow}>
            <Text style={styles.eventoTitle}>📅 {eventoData.evento.nombre}</Text>
            {isActive ? (
              <View style={styles.activeEventBadge}>
                <Text style={styles.activeEventText}>ACTIVO</Text>
              </View>
            ) : (
              <View style={styles.inactiveEventBadge}>
                <Text style={styles.inactiveEventText}>FINALIZADO</Text>
              </View>
            )}
          </View>
          <Text style={styles.eventoFecha}>{eventoData.evento.fecha}</Text>
        </View>
        {eventoData.rondas.map(renderRonda)}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D52B1E" />
        <Text style={styles.loadingText}>Cargando resultados...</Text>
      </View>
    );
  }

  if (participaciones.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="clipboard-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>No tienes participaciones aún</Text>
        <Text style={styles.emptyText}>
          Participa en las rondas activas para ver tus resultados aquí
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#D52B1E']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Resultados</Text>
        <Text style={styles.headerSubtitle}>
          Los resultados están visibles mientras el evento esté activo
        </Text>
      </View>

      {participaciones.map(renderEvento)}

      <View style={styles.bottomPadding} />
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
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
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  eventoContainer: {
    marginTop: 20,
    marginHorizontal: 15,
  },
  eventoHeader: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventoTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  eventoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  activeEventBadge: {
    backgroundColor: '#2ECC71',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeEventText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  inactiveEventBadge: {
    backgroundColor: '#999',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inactiveEventText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  eventoFecha: {
    fontSize: 14,
    color: '#666',
  },
  rondaContainer: {
    marginBottom: 15,
  },
  rondaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  rondaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D52B1E',
  },
  rondaParticipaciones: {
    fontSize: 12,
    color: '#666',
  },
  participacionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  participacionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  participacionInfo: {
    flex: 1,
  },
  participacionNumero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  participacionFecha: {
    fontSize: 12,
    color: '#999',
  },
  participacionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  prediccionesContainer: {
    padding: 15,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  prediccionesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  prediccionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ddd',
  },
  prediccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prediccionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  prediccionDetails: {
    gap: 5,
  },
  prediccionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prediccionLabel: {
    fontSize: 12,
    color: '#666',
  },
  prediccionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  eventEndedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    gap: 10,
  },
  eventEndedText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 30,
  },
});