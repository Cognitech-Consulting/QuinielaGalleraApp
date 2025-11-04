// src/screens/EventDetailScreen.js - NEW SCREEN
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { pollAllActiveEvents } from '../api/apiService';

const EventDetailScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const [event, setEvent] = useState(route.params?.event || null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Poll for event updates
    const stopPolling = pollAllActiveEvents((data, error) => {
      if (data && data.events) {
        // Find and update this specific event
        const updatedEvent = data.events.find(e => e.id === event.id);
        if (updatedEvent) {
          setEvent(updatedEvent);
        }
      }
    }, 15000);

    return () => stopPolling();
  }, [event.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh will happen via polling
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleRoundPress = (round) => {
    if (!round.active) {
      Alert.alert(
        'Ronda Inactiva',
        'Esta ronda no está disponible para participación en este momento.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to round predictions (free access)
    navigation.navigate('RoundPredictions', { event, round });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del Evento</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Event Info */}
      <View style={styles.eventInfoCard}>
        <Text style={styles.eventName}>{event.nombre}</Text>
        <View style={styles.eventMetaContainer}>
          <View style={styles.eventMeta}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText}>{event.ubicacion}</Text>
          </View>
          <View style={styles.eventMeta}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={styles.metaText}>{event.fecha}</Text>
          </View>
        </View>
      </View>

      {/* Rounds List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D52B1E']} />
        }
      >
        <Text style={styles.sectionTitle}>🎯 Rondas del Evento</Text>

        {event.rondas.map((round) => (
          <TouchableOpacity
            key={round.id}
            style={[
              styles.roundCard,
              !round.active && styles.roundCardInactive
            ]}
            onPress={() => handleRoundPress(round)}
          >
            <View style={styles.roundHeader}>
              <View>
                <Text style={styles.roundTitle}>Ronda {round.numero}</Text>
                <Text style={styles.roundFightsCount}>
                  {round.peleas.length} {round.peleas.length === 1 ? 'Pelea' : 'Peleas'}
                </Text>
              </View>

              {round.active ? (
                <View style={styles.statusBadgeActive}>
                  <Text style={styles.statusDot}>🟢</Text>
                  <Text style={styles.statusTextActive}>Activa</Text>
                </View>
              ) : (
                <View style={styles.statusBadgeInactive}>
                  <Text style={styles.statusDot}>🔴</Text>
                  <Text style={styles.statusTextInactive}>Inactiva</Text>
                </View>
              )}
            </View>

            {/* Preview of fights */}
            <View style={styles.fightsPreview}>
              {round.peleas.slice(0, 2).map((fight, index) => (
                <View key={fight.id} style={styles.fightPreviewItem}>
                  <Text style={styles.fightPreviewText}>
                    🐓 {fight.equipo1} vs {fight.equipo2}
                  </Text>
                </View>
              ))}
              {round.peleas.length > 2 && (
                <Text style={styles.moreFights}>
                  +{round.peleas.length - 2} peleas más
                </Text>
              )}
            </View>

            {round.active && (
              <View style={styles.viewButtonContainer}>
                <Text style={styles.viewButtonText}>Ver Ronda →</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#D52B1E',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  eventInfoCard: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  eventMetaContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  roundCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  roundCardInactive: {
    opacity: 0.6,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  roundFightsCount: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  statusBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    fontSize: 12,
    marginRight: 6,
  },
  statusTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#155724',
  },
  statusTextInactive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#721c24',
  },
  fightsPreview: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginBottom: 12,
  },
  fightPreviewItem: {
    marginBottom: 8,
  },
  fightPreviewText: {
    fontSize: 14,
    color: '#666',
  },
  moreFights: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  viewButtonContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D52B1E',
  },
  bottomSpacer: {
    height: 20,
  },
});

export default EventDetailScreen;