import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://cognitech.pythonanywhere.com'; 

const ResultsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [predictionResults, setPredictionResults] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const user_id = await AsyncStorage.getItem('user_id');
        if (!user_id) {
          Alert.alert('Error', 'Usuario no encontrado.');
          return;
        }

        const response = await axios.get(`${BASE_URL}/eventos/api/user-results/`, {
          params: { user_id },
        });

        if (response.status === 200) {
          setResultsVisible(response.data.resultsVisible);
          setPredictionResults(response.data.predictionResults || []);
          setTotalPoints(response.data.totalPoints || 0);
        } else {
          Alert.alert('Error', 'No se pudieron obtener los resultados.');
        }
      } catch (error) {
        console.error('Fetch Results Error:', error);
        Alert.alert('Error', 'Hubo un problema al cargar los resultados.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

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
        <Text style={styles.hiddenResultsText}>
          Los resultados no están disponibles en este momento. Por favor, vuelve más tarde.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Resultados de tus Predicciones</Text>
      <Text style={styles.totalPoints}>Puntos Totales: {totalPoints}</Text>
      {predictionResults.length === 0 ? (
        <Text style={styles.noResultsText}>No hay predicciones para mostrar.</Text>
      ) : (
        predictionResults.map((result) => (
          <View key={result.pelea_id} style={styles.resultBox}>
            <Text style={styles.matchText}>
              {result.equipo1} vs {result.equipo2}
            </Text>
            <Text>
              Tu predicción: {result.prediccion} | Resultado:{' '}
              {result.resultado || 'Pendiente'}
            </Text>
            <Text style={{ color: result.correct ? 'green' : 'red' }}>
              {result.correct ? '¡Correcto!' : 'Incorrecto'}
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
  hiddenResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  hiddenResultsText: {
    fontSize: 18,
    color: '#e74c3c',
    textAlign: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  totalPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  noResultsText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  resultBox: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  matchText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ResultsScreen;


