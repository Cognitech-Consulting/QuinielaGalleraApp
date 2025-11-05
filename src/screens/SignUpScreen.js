// src/screens/SignUpScreen.js - WITH PHONE NUMBER VALIDATION
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

  // ============================================================================
  // 🆕 PHONE NUMBER FORMATTING & VALIDATION
  // ============================================================================

  /**
   * Formats phone number as user types for Guatemala format: +502-XXXX-XXXX
   * Automatically adds country code and dashes
   */
  const formatPhoneNumber = (text) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // If starts with 502, keep it; otherwise we'll add it
    let numbers = cleaned;
    
    // Remove leading 502 if present (we'll add it back with formatting)
    if (numbers.startsWith('502')) {
      numbers = numbers.substring(3);
    }
    
    // Limit to 8 digits (Guatemala phone numbers are 8 digits)
    numbers = numbers.substring(0, 8);
    
    // Format as: +502-XXXX-XXXX
    let formatted = '+502';
    
    if (numbers.length > 0) {
      formatted += '-' + numbers.substring(0, 4);
    }
    
    if (numbers.length > 4) {
      formatted += '-' + numbers.substring(4, 8);
    }
    
    return formatted;
  };

  /**
   * Validates Guatemala phone number format
   * Must be 8 digits after country code
   */
  const validatePhoneNumber = (phone) => {
    if (!phone || phone.trim() === '') {
      return { valid: false, message: 'El número de teléfono es requerido para recibir notificaciones de WhatsApp' };
    }
    
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Remove 502 if present
    let numbers = cleaned;
    if (numbers.startsWith('502')) {
      numbers = numbers.substring(3);
    }
    
    // Must be exactly 8 digits
    if (numbers.length !== 8) {
      return { 
        valid: false, 
        message: `Número inválido. Debe tener 8 dígitos. Actual: ${numbers.length} dígitos` 
      };
    }
    
    // First digit should be valid (2-9, not 0 or 1)
    const firstDigit = numbers.charAt(0);
    if (firstDigit === '0' || firstDigit === '1') {
      return { 
        valid: false, 
        message: 'Número inválido. Números guatemaltecos no empiezan con 0 o 1' 
      };
    }
    
    return { valid: true, formatted: `+502${numbers}` };
  };

  /**
   * Handles phone number input with auto-formatting
   */
  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    updateField('numero_celular', formatted);
  };

  // ============================================================================

  const handleRegister = async () => {
    // Validate required fields
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

    // 🆕 VALIDATE PHONE NUMBER
    const phoneValidation = validatePhoneNumber(formData.numero_celular);
    if (!phoneValidation.valid) {
      Alert.alert(
        '📱 Número de Teléfono Inválido', 
        phoneValidation.message + '\n\nFormato correcto: +502-XXXX-XXXX\nEjemplo: +502-5555-1234',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    
    // Prepare data with properly formatted phone
    const { confirmPassword, ...userData } = formData;
    const dataToSend = {
      ...userData,
      numero_celular: phoneValidation.formatted // Send as +502XXXXXXXX (no dashes)
    };
    
    const result = await register(dataToSend);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        '¡Éxito! 🎉',
        'Cuenta creada exitosamente.\n\n📱 Recibirás confirmaciones por WhatsApp cuando hagas predicciones.\n\nPor favor inicia sesión.',
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

  // 🆕 SPECIAL RENDER FOR PHONE NUMBER WITH FORMATTING
  const renderPhoneInput = () => (
    <View style={{ marginBottom: 5 }}>
      <View style={[
        styles.inputWrapper,
        focusedInput === 'numero_celular' && styles.inputWrapperFocused
      ]}>
        <Text style={styles.inputIcon}>📱</Text>
        <TextInput
          style={styles.input}
          placeholder="Número de Celular *"
          placeholderTextColor="#999"
          value={formData.numero_celular}
          onChangeText={handlePhoneChange}
          editable={!loading}
          onFocus={() => setFocusedInput('numero_celular')}
          onBlur={() => setFocusedInput(null)}
          keyboardType="phone-pad"
          maxLength={16} // +502-XXXX-XXXX = 15 chars
        />
      </View>
      <Text style={styles.helperText}>
        Formato: +502-XXXX-XXXX • Requerido para WhatsApp
      </Text>
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

          {/* 🆕 UPDATED: Phone input with formatting */}
          {renderPhoneInput()}
          
          {renderInput('Dirección', 'direccion', '📍')}

          {/* WhatsApp Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>📱</Text>
            <Text style={styles.infoText}>
              Recibirás confirmaciones por WhatsApp cuando hagas predicciones
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>CREAR CUENTA</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginLink} 
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta? <Text style={styles.linkTextBold}>Inicia Sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.modalTitle}>📅 Selecciona tu Fecha de Nacimiento</Text>
            
            <View style={styles.dateInputsContainer}>
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateLabel}>Año</Text>
                <TextInput
                  style={styles.dateInput}
                  value={yearInput}
                  onChangeText={setYearInput}
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="2000"
                />
              </View>
              
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateLabel}>Mes</Text>
                <TextInput
                  style={styles.dateInput}
                  value={monthInput}
                  onChangeText={setMonthInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="01"
                />
              </View>
              
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateLabel}>Día</Text>
                <TextInput
                  style={styles.dateInput}
                  value={dayInput}
                  onChangeText={setDayInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="01"
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
    backgroundColor: '#F5F5F5',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: '#D52B1E',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 20,
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
    fontSize: 48,
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
  // 🆕 NEW STYLES FOR PHONE INPUT
  helperText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 15,
    marginTop: -8,
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 12,
    marginTop: 5,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
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