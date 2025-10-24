import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://cognitech.pythonanywhere.com'; // Updated URL

const RankingsScreen = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        // Retrieve active event ID from AsyncStorage
        const activeEventId = await AsyncStorage.getItem('active_event_id');
        if (!activeEventId) {
          Alert.alert('Error', 'No se encontró el ID del evento activo.');
          setError('ID del evento no encontrado.');
          setLoading(false);
          return;
        }

        // Fetch rankings from the server
        const response = await axios.get(`${BASE_URL}/eventos/api/rankings/${activeEventId}/`);
        if (response.status === 200) {
          setRankings(response.data.rankings || []);
        } else {
          Alert.alert('Error', 'No se pudo obtener el ranking.');
          setError('No se pudo obtener el ranking.');
        }
      } catch (error) {
        console.error('Fetch Rankings Error:', error);
        Alert.alert('Error', 'Hubo un problema al cargar el ranking.');
        setError('Hubo un problema al cargar el ranking.');
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D52B1E" />
        <Text style={styles.loadingText}>Cargando ranking...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Ranking del Evento</Text>
      {rankings.length === 0 ? (
        <Text style={styles.noRankingsText}>No hay datos de ranking para mostrar.</Text>
      ) : (
        rankings.map((rank, index) => (
          <View key={index} style={styles.rankItem}>
            <Text style={styles.rankText}>
              {index + 1}. {rank.user} - {rank.points} puntos
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#D52B1E',
  },
  noRankingsText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  rankItem: {
    marginBottom: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default RankingsScreen;
