// src/screens/SignUpScreen.js - PREMIUM BRANDED VERSION
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
  const [focusedInput, setFocusedInput] = useState(null);
  
  const [yearInput, setYearInput] = useState('2000');
  const [monthInput, setMonthInput] = useState('01');
  const [dayInput, setDayInput] = useState('01');
  
  const { register } = useAuth();

  const handleRegister = async () => {
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
    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        '¡Éxito!',
        'Cuenta creada exitosamente. Por favor inicia sesión.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      const errorMessage = typeof result.error === 'string' 
        ? result.error 
        : JSON.stringify(result.error);
      Alert.alert('Error de Registro', errorMessage || 'No se pudo crear la cuenta');
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDateSelect = () => {
    const year = parseInt(yearInput) || 2000;
    const month = Math.max(1, Math.min(12, parseInt(monthInput) || 1));
    const day = Math.max(1, Math.min(31, parseInt(dayInput) || 1));
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    updateField('fecha_nacimiento', dateString);
    setShowDatePicker(false);
  };

  const handleOpenDatePicker = () => {
    if (formData.fecha_nacimiento) {
      const [year, month, day] = formData.fecha_nacimiento.split('-');
      setYearInput(year || '2000');
      setMonthInput(month || '01');
      setDayInput(day || '01');
    }
    setShowDatePicker(true);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Seleccionar Fecha de Nacimiento';
    return dateString;
  };

  const renderInput = (placeholder, field, icon, options = {}) => (
    <View style={[
      styles.inputWrapper,
      focusedInput === field && styles.inputWrapperFocused
    ]}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={formData[field]}
        onChangeText={(value) => updateField(field, value)}
        editable={!loading}
        onFocus={() => setFocusedInput(field)}
        onBlur={() => setFocusedInput(null)}
        {...options}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Background */}
      <View style={styles.background}>
        <View style={styles.backgroundOverlay} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>🐓</Text>
          <Text style={styles.headerTitle}>Crear Cuenta</Text>
          <Text style={styles.headerSubtitle}>Únete a Quiniela Gallera</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Credenciales</Text>
            <View style={styles.sectionDivider} />
          </View>

          {renderInput('ID de Usuario *', 'user_id', '👤', { autoCapitalize: 'none' })}
          {renderInput('Contraseña *', 'password', '🔒', { secureTextEntry: true })}
          {renderInput('Confirmar Contraseña *', 'confirmPassword', '🔒', { secureTextEntry: true })}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <View style={styles.sectionDivider} />
          </View>

          {renderInput('Nombre', 'nombre', '✨')}
          {renderInput('Apellido', 'apellido', '✨')}

          {/* Date Picker Button */}
          <TouchableOpacity
            style={[
              styles.inputWrapper,
              focusedInput === 'date' && styles.inputWrapperFocused
            ]}
            onPress={handleOpenDatePicker}
            disabled={loading}
          >
            <Text style={styles.inputIcon}>📅</Text>
            <Text style={[
              styles.dateText,
              !formData.fecha_nacimiento && styles.datePlaceholder
            ]}>
              {formatDisplayDate(formData.fecha_nacimiento)}
            </Text>
          </TouchableOpacity>

          {renderInput('Número de Celular', 'numero_celular', '📱', { keyboardType: 'phone-pad' })}
          {renderInput('Dirección', 'direccion', '📍')}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>CREAR CUENTA</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
            style={styles.loginLink}
          >
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.linkTextBold}>Inicia Sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.modalTitle}>Fecha de Nacimiento</Text>
            
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#D52B1E',
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionDivider: {
    height: 2,
    width: 40,
    backgroundColor: '#D52B1E',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: '#D52B1E',
    backgroundColor: '#FFF',
    shadowOpacity: 0.1,
  },
  inputIcon: {
    fontSize: 20,
    marginLeft: 15,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#1a1a1a',
  },
  dateText: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#1a1a1a',
    textAlignVertical: 'center',
    paddingTop: Platform.OS === 'ios' ? 15 : 0,
  },
  datePlaceholder: {
    color: '#999',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 15,
    backgroundColor: '#D52B1E',
    shadowColor: '#D52B1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: '#999',
  },
  buttonContent: {
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loginLink: {
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  linkTextBold: {
    color: '#D52B1E',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  dateInputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  dateInput: {
    height: 50,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    fontSize: 16,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#D52B1E',
    shadowColor: '#D52B1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;