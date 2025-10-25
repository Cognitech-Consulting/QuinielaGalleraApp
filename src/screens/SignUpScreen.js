// src/screens/SignUpScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    numero_celular: '',
    direccion: '',
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Separate input states for date picker
  const [yearInput, setYearInput] = useState('2000');
  const [monthInput, setMonthInput] = useState('01');
  const [dayInput, setDayInput] = useState('01');
  
  const { register } = useAuth();

  const handleRegister = async () => {
    // Validation
    if (!formData.user_id || !formData.password) {
      Alert.alert('Error', 'ID de usuario y contraseña son requeridos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    // Remove confirmPassword before sending to API
    const { confirmPassword, ...userData } = formData;

    console.log('Attempting registration with:', userData);

    const result = await register(userData);
    setLoading(false);

    console.log('Registration result:', result);

    if (result.success) {
      Alert.alert(
        'Éxito',
        'Cuenta creada exitosamente. Por favor inicia sesión.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } else {
      // Show detailed error message
      const errorMessage = typeof result.error === 'string' 
        ? result.error 
        : JSON.stringify(result.error);
      
      console.error('Registration error:', result.error);
      Alert.alert('Error de Registro', errorMessage || 'No se pudo crear la cuenta');
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDateSelect = () => {
    // Validate inputs
    const year = parseInt(yearInput) || 2000;
    const month = Math.max(1, Math.min(12, parseInt(monthInput) || 1));
    const day = Math.max(1, Math.min(31, parseInt(dayInput) || 1));
    
    // Format as YYYY-MM-DD
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    updateField('fecha_nacimiento', dateString);
    setShowDatePicker(false);
  };

  const handleOpenDatePicker = () => {
    // If there's already a date, parse it to set inputs
    if (formData.fecha_nacimiento) {
      const [year, month, day] = formData.fecha_nacimiento.split('-');
      setYearInput(year || '2000');
      setMonthInput(month || '01');
      setDayInput(day || '01');
    }
    setShowDatePicker(true);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Seleccionar Fecha';
    return dateString;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Crear Cuenta</Text>

        <TextInput
          style={styles.input}
          placeholder="ID de Usuario *"
          value={formData.user_id}
          onChangeText={(value) => updateField('user_id', value)}
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña *"
          value={formData.password}
          onChangeText={(value) => updateField('password', value)}
          secureTextEntry
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar Contraseña *"
          value={formData.confirmPassword}
          onChangeText={(value) => updateField('confirmPassword', value)}
          secureTextEntry
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={formData.nombre}
          onChangeText={(value) => updateField('nombre', value)}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Apellido"
          value={formData.apellido}
          onChangeText={(value) => updateField('apellido', value)}
          editable={!loading}
        />

        {/* Date Picker Button */}
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={handleOpenDatePicker}
          disabled={loading}
        >
          <Text style={styles.datePickerButtonText}>
            📅 {formatDisplayDate(formData.fecha_nacimiento)}
          </Text>
        </TouchableOpacity>

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModal}>
              <Text style={styles.modalTitle}>Seleccionar Fecha de Nacimiento</Text>
              
              {/* Simple Date Selector */}
              <View style={styles.dateInputsContainer}>
                <View style={styles.dateInputGroup}>
                  <Text style={styles.dateLabel}>Año</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={yearInput}
                    onChangeText={setYearInput}
                  />
                </View>

                <View style={styles.dateInputGroup}>
                  <Text style={styles.dateLabel}>Mes</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="MM"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={monthInput}
                    onChangeText={setMonthInput}
                  />
                </View>

                <View style={styles.dateInputGroup}>
                  <Text style={styles.dateLabel}>Día</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="DD"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={dayInput}
                    onChangeText={setDayInput}
                  />
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleDateSelect}
                >
                  <Text style={styles.confirmButtonText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <TextInput
          style={styles.input}
          placeholder="Número de Celular"
          value={formData.numero_celular}
          onChangeText={(value) => updateField('numero_celular', value)}
          keyboardType="phone-pad"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Dirección"
          value={formData.direccion}
          onChangeText={(value) => updateField('direccion', value)}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Registrarse</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            ¿Ya tienes cuenta? <Text style={styles.linkTextBold}>Inicia Sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D52B1E',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#DDD',
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#D52B1E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  linkTextBold: {
    color: '#D52B1E',
    fontWeight: 'bold',
  },
  datePickerButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateInputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  dateInput: {
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    fontSize: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#D52B1E',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;