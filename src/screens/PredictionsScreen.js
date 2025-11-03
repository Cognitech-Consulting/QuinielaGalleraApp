import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import apiService from '../api/apiService';

export default function PredictionsScreen({ route, navigation }) {
  const { ronda, evento, participationId } = route.params;
  const { user, refreshUser } = useAuth();
  const [peleas, setPeleas] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRondaFights();
  }, []);

  const loadRondaFights = async () => {
    try {
      setLoading(true);
      // The peleas are already in the ronda object from the previous screen
      if (ronda.peleas && ronda.peleas.length > 0) {
        setPeleas(ronda.peleas);
        // Initialize predictions object
        const initialPredictions = {};
        ronda.peleas.forEach(pelea => {
          initialPredictions[pelea.id] = null;
        });
        setPredictions(initialPredictions);
      }
    } catch (error) {
      console.error('Error loading fights:', error);
      Alert.alert('Error', 'No se pudieron cargar las peleas');
    } finally {
      setLoading(false);
    }
  };

  const handlePrediction = (peleaId, prediccion) => {
    setPredictions(prev => ({
      ...prev,
      [peleaId]: prediccion,
    }));
  };

  const validatePredictions = () => {
    const allSelected = Object.values(predictions).every(pred => pred !== null);
    if (!allSelected) {
      Alert.alert(
        'Predicciones Incompletas',
        'Debes hacer una predicción para todas las peleas'
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validatePredictions()) return;

    Alert.alert(
      'Confirmar Predicciones',
      `¿Estás seguro de enviar tus predicciones para la Ronda ${ronda.numero}?\n\nNo podrás cambiarlas después.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: submitPredictions,
        },
      ]
    );
  };

  const submitPredictions = async () => {
    try {
      setSubmitting(true);

      // Format predictions for API
      const predictionsArray = Object.entries(predictions).map(([peleaId, prediccion]) => ({
        pelea_id: parseInt(peleaId),
        prediccion: prediccion,
      }));

      const response = await apiService.submitRondaPredictions(
        participationId,
        predictionsArray
      );

      if (response.success) {
        await refreshUser();
        Alert.alert(
          '¡Éxito!',
          `Predicciones enviadas correctamente para la Ronda ${ronda.numero}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting predictions:', error);
      Alert.alert(
        'Error',
        error.message || 'No se pudieron enviar las predicciones'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderPelea = ({ item }) => {
    const selectedPrediction = predictions[item.id];

    return (
      <View style={styles.peleaCard}>
        <View style={styles.peleaHeader}>
          <Text style={styles.peleaNumber}>Pelea #{item.numero}</Text>
          <Text style={styles.peleaCategory}>{item.categoria}</Text>
        </View>

        <View style={styles.fightersContainer}>
          {/* Gallo 1 */}
          <TouchableOpacity
            style={[
              styles.galloButton,
              selectedPrediction === '1' && styles.galloButtonSelected,
            ]}
            onPress={() => handlePrediction(item.id, '1')}
          >
            <Text style={styles.galloLabel}>GALLO 1</Text>
            <Text
              style={[
                styles.galloName,
                selectedPrediction === '1' && styles.textSelected,
              ]}
            >
              {item.gallo1_nombre}
            </Text>
            <Text style={styles.galloInfo}>{item.gallo1_dueno}</Text>
            {item.gallo1_color && (
              <Text style={styles.galloColor}>🎨 {item.gallo1_color}</Text>
            )}
          </TouchableOpacity>

          {/* VS */}
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Gallo 2 */}
          <TouchableOpacity
            style={[
              styles.galloButton,
              selectedPrediction === '2' && styles.galloButtonSelected,
            ]}
            onPress={() => handlePrediction(item.id, '2')}
          >
            <Text style={styles.galloLabel}>GALLO 2</Text>
            <Text
              style={[
                styles.galloName,
                selectedPrediction === '2' && styles.textSelected,
              ]}
            >
              {item.gallo2_nombre}
            </Text>
            <Text style={styles.galloInfo}>{item.gallo2_dueno}</Text>
            {item.gallo2_color && (
              <Text style={styles.galloColor}>🎨 {item.gallo2_color}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Empate Option */}
        <TouchableOpacity
          style={[
            styles.empateButton,
            selectedPrediction === 'empate' && styles.empateButtonSelected,
          ]}
          onPress={() => handlePrediction(item.id, 'empate')}
        >
          <Text
            style={[
              styles.empateText,
              selectedPrediction === 'empate' && styles.textSelected,
            ]}
          >
            🤝 EMPATE
          </Text>
        </TouchableOpacity>
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

  const selectedCount = Object.values(predictions).filter(p => p !== null).length;
  const totalCount = peleas.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{evento.nombre}</Text>
        <Text style={styles.headerSubtitle}>Ronda {ronda.numero}</Text>
        <Text style={styles.predictionsCount}>
          {selectedCount} de {totalCount} predicciones
        </Text>
      </View>

      {/* Fights List */}
      <FlatList
        data={peleas}
        renderItem={renderPelea}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (submitting || selectedCount < totalCount) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting || selectedCount < totalCount}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {selectedCount < totalCount
                ? `Completa todas las predicciones (${selectedCount}/${totalCount})`
                : '✓ ENVIAR PREDICCIONES'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e74c3c',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#e74c3c',
    fontWeight: '600',
  },
  predictionsCount: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 8,
  },
  listContent: {
    padding: 15,
  },
  peleaCard: {
    backgroundColor: '#2c2c2c',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#3c3c3c',
  },
  peleaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3c3c3c',
  },
  peleaNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  peleaCategory: {
    fontSize: 14,
    color: '#95a5a6',
  },
  fightersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  galloButton: {
    flex: 1,
    backgroundColor: '#3c3c3c',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: '#3c3c3c',
  },
  galloButtonSelected: {
    backgroundColor: '#e74c3c',
    borderColor: '#c0392b',
  },
  galloLabel: {
    fontSize: 10,
    color: '#95a5a6',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  galloName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  galloInfo: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  galloColor: {
    fontSize: 11,
    color: '#95a5a6',
    marginTop: 4,
  },
  textSelected: {
    color: '#fff',
  },
  vsContainer: {
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  empateButton: {
    backgroundColor: '#3c3c3c',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: '#3c3c3c',
    alignItems: 'center',
  },
  empateButtonSelected: {
    backgroundColor: '#f39c12',
    borderColor: '#d68910',
  },
  empateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    padding: 15,
    backgroundColor: '#2c2c2c',
    borderTopWidth: 1,
    borderTopColor: '#3c3c3c',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#7f8c8d',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});