// src/screens/ResultsScreen.js
// UPDATED VERSION - Auto-polling every 20 seconds + Fixed results display

import React, { useState, useEffect, useRef } from 'react';
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
const POLLING_INTERVAL = 20000; // 20 seconds

export default function ResultsScreen({ navigation }) {
  const [participaciones, setParticipaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedParticipaciones, setExpandedParticipaciones] = useState({});
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const pollingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadParticipaciones();

    // Start auto-polling
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        console.log('🔄 Auto-polling results...');
        loadParticipaciones(true); // Silent reload
      }
    }, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const loadParticipaciones = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        if (!silent) setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      const response = await fetch(
        `${API_URL}/eventos/api/get-user-ronda-participaciones/?user_id=${user.user_id}`,
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Results loaded:', data.participaciones.length, 'participaciones');
        
        // Group by event
        const grouped = groupByEvent(data.participaciones);
        
        if (isMountedRef.current) {
          setParticipaciones(grouped);
          setLastUpdate(new Date());
        }
      } else {
        console.error('❌ Failed to load results:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading participaciones:', error);
    } finally {
      if (isMountedRef.current) {
        if (!silent) setLoading(false);
        setRefreshing(false);
      }
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
      
      // Check if result exists and is not null/undefined
      if (pred.resultado_real && pred.resultado_real !== 'pending') {
        if (pred.es_correcta === true) return '✓';
        if (pred.es_correcta === false) return '✗';
      }
      
      return '⏳';
    };

    const getStatusColor = () => {
      if (!resultsVisible) return '#FFA500';
      
      if (pred.resultado_real && pred.resultado_real !== 'pending') {
        if (pred.es_correcta === true) return '#2ECC71';
        if (pred.es_correcta === false) return '#E74C3C';
      }
      
      return '#FFA500';
    };

    const getPrediccionText = () => {
      if (pred.prediccion === 'equipo1') return pred.equipo1;
      if (pred.prediccion === 'equipo2') return pred.equipo2;
      return 'Empate';
    };

    const getResultadoText = () => {
      if (!resultsVisible) return 'Evento Finalizado';
      
      // Check if resultado_real exists and is valid
      if (!pred.resultado_real || pred.resultado_real === 'pending' || pred.resultado_real === '') {
        return 'Pendiente';
      }
      
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
    
    // Extract stats with defaults
    const stats = part.stats || {
      correctas: 0,
      incorrectas: 0,
      pendientes: 0,
      precision: 0,
      total_predicciones: 0
    };
    
    // Determine status based on evento.current and ronda_cerrada
    let statusText;
    let statusColor;
    
    if (!part.evento.current) {
      // Event is no longer active - hide results
      statusText = 'Evento Finalizado';
      statusColor = '#999';
    } else if (part.ronda_cerrada && part.puntos_obtenidos !== null) {
      // Show correct/total instead of just points
      statusText = `${stats.correctas}/${part.total_peleas} correctas`;
      statusColor = '#D52B1E';
    } else if (part.ronda_cerrada) {
      // Round closed but results not calculated yet
      statusText = 'Calculando resultados...';
      statusColor = '#FFA500';
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
            {/* Stats Summary Card - Only show when round is closed and results exist */}
            {part.results_visible && part.ronda_cerrada && stats.total_predicciones > 0 && (
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>📊 Resumen de Resultados</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#2ECC71' }]}>
                      {stats.correctas}
                    </Text>
                    <Text style={styles.statLabel}>Correctas</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#E74C3C' }]}>
                      {stats.incorrectas}
                    </Text>
                    <Text style={styles.statLabel}>Incorrectas</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#FFA500' }]}>
                      {stats.pendientes}
                    </Text>
                    <Text style={styles.statLabel}>Pendientes</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#D52B1E' }]}>
                      {stats.precision}%
                    </Text>
                    <Text style={styles.statLabel}>Precisión</Text>
                  </View>
                </View>
              </View>
            )}
            
            <Text style={styles.prediccionesTitle}>Tus Predicciones:</Text>
            {part.predicciones.map((pred) => renderPrediccion(pred, part.results_visible))}
            
            {!part.evento.current && (
              <View style={styles.eventEndedNotice}>
                <Ionicons name="information-circle" size={20} color="#856404" />
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
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Mis Resultados</Text>
            <Text style={styles.headerSubtitle}>
              Los resultados están visibles mientras el evento esté activo
            </Text>
          </View>
          <View style={styles.autoUpdateBadge}>
            <Ionicons name="sync" size={14} color="#fff" />
            <Text style={styles.autoUpdateText}>Auto-actualiza</Text>
          </View>
        </View>
        <Text style={styles.lastUpdateText}>
          Última actualización: {lastUpdate.toLocaleTimeString('es-GT', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </Text>
      </View>

      {participaciones.map(renderEvento)}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔄 Actualizándose cada 20 segundos
        </Text>
      </View>
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
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
  },
  header: {
    backgroundColor: '#D52B1E',
    padding: 20,
    paddingTop: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  autoUpdateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  autoUpdateText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  lastUpdateText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  eventoContainer: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventoHeader: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  eventoTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  eventoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  activeEventBadge: {
    backgroundColor: '#2ECC71',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeEventText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  inactiveEventBadge: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inactiveEventText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventoFecha: {
    fontSize: 13,
    color: '#666',
  },
  rondaContainer: {
    marginBottom: 15,
  },
  rondaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rondaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D52B1E',
  },
  rondaParticipaciones: {
    fontSize: 12,
    color: '#666',
  },
  participacionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  participacionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  participacionInfo: {
    flex: 1,
  },
  participacionNumero: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  participacionFecha: {
    fontSize: 11,
    color: '#999',
  },
  participacionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  prediccionesContainer: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statsCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  prediccionesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  prediccionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  prediccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  prediccionTitle: {
    fontSize: 13,
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
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  prediccionDetails: {
    gap: 6,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  eventEndedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    gap: 10,
  },
  eventEndedText: {
    flex: 1,
    fontSize: 12,
    color: '#856404',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});