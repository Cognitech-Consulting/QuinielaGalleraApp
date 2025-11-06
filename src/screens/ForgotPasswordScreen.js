// src/screens/ForgotPasswordScreen.js - FIXED VERSION WITH WINE COLORS & KEYBOARD FIX
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

const API_URL = 'https://cognitech.pythonanywhere.com';

const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const [userId, setUserId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let numbers = cleaned;
    
    if (numbers.startsWith('502')) {
      numbers = numbers.substring(3);
    }
    
    numbers = numbers.substring(0, 8);
    
    let formatted = '+502';
    if (numbers.length > 0) {
      formatted += '-' + numbers.substring(0, 4);
    }
    if (numbers.length > 4) {
      formatted += '-' + numbers.substring(4, 8);
    }
    
    return formatted;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const handleRequestReset = async () => {
    if (!userId || !phoneNumber) {
      Alert.alert('Error', 'Por favor ingresa tu ID de usuario y número de teléfono');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    let numbers = cleanPhone;
    if (numbers.startsWith('502')) {
      numbers = numbers.substring(3);
    }

    if (numbers.length !== 8) {
      Alert.alert('Error', 'Número de teléfono inválido. Debe tener 8 dígitos.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/accounts/password-reset/request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          numero_celular: `+502${numbers}`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          'Código Enviado',
          `Se ha enviado un código de recuperación a tu teléfono.\n\nCódigo: ${data.token}\n\nExpira en ${data.expires_in_minutes} minutos.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setResetToken(data.token);
                setStep(2);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'No se pudo enviar el código de recuperación');
      }
    } catch (error) {
      console.error('Request reset error:', error);
      Alert.alert('Error', 'Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = () => {
    if (!resetToken || resetToken.trim().length < 10) {
      Alert.alert('Error', 'Por favor ingresa un código válido');
      return;
    }
    setStep(3);
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/accounts/password-reset/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          '¡Éxito!',
          'Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.',
          [
            {
              text: 'Iniciar Sesión',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'No se pudo restablecer la contraseña');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      Alert.alert('Error', 'Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (placeholder, value, onChangeText, icon, options = {}) => (
    <View
      style={[
        styles.inputWrapper,
        focusedInput === placeholder && styles.inputWrapperFocused,
      ]}
    >
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        editable={!loading}
        onFocus={() => setFocusedInput(placeholder)}
        onBlur={() => setFocusedInput(null)}
        {...options}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={0}
    >
      <View style={styles.background}>
        <View style={styles.backgroundOverlay} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>🔒</Text>
          <Text style={styles.headerTitle}>Recuperar Contraseña</Text>
          <Text style={styles.headerSubtitle}>Paso {step} de 3</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]}>
              <Text style={[styles.progressText, step >= 1 && styles.progressTextActive]}>
                1
              </Text>
            </View>
            <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
            <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]}>
              <Text style={[styles.progressText, step >= 2 && styles.progressTextActive]}>
                2
              </Text>
            </View>
            <View style={[styles.progressLine, step >= 3 && styles.progressLineActive]} />
            <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]}>
              <Text style={[styles.progressText, step >= 3 && styles.progressTextActive]}>
                3
              </Text>
            </View>
          </View>

          {/* Step 1: Request Token */}
          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>Verifica tu Identidad</Text>
              <Text style={styles.stepDescription}>
                Ingresa tu ID de usuario y número de teléfono para recibir un código de
                recuperación
              </Text>

              {renderInput('ID de Usuario', userId, setUserId, '👤', {
                autoCapitalize: 'none',
              })}

              {renderInput('Número de Celular', phoneNumber, handlePhoneChange, '📱', {
                keyboardType: 'phone-pad',
                maxLength: 16,
              })}

              <Text style={styles.helperText}>Formato: +502-XXXX-XXXX</Text>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRequestReset}
                disabled={loading}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>ENVIAR CÓDIGO</Text>
                  )}
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* Step 2: Enter Token */}
          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>Ingresa el Código</Text>
              <Text style={styles.stepDescription}>
                Revisa tu WhatsApp o SMS. Hemos enviado un código de recuperación a tu número
                registrado.
              </Text>

              {renderInput('Código de Recuperación', resetToken, setResetToken, '🔑', {
                autoCapitalize: 'none',
              })}

              <Text style={styles.helperText}>El código expira en 30 minutos</Text>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyToken}
                disabled={loading}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>VERIFICAR CÓDIGO</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setStep(1)}
                disabled={loading}
              >
                <Text style={styles.linkText}>¿No recibiste el código? Reenviar</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>Nueva Contraseña</Text>
              <Text style={styles.stepDescription}>
                Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
              </Text>

              {renderInput('Nueva Contraseña', newPassword, setNewPassword, '🔒', {
                secureTextEntry: true,
              })}

              {renderInput(
                'Confirmar Contraseña',
                confirmPassword,
                setConfirmPassword,
                '🔒',
                {
                  secureTextEntry: true,
                }
              )}

              {newPassword.length > 0 && (
                <View style={styles.passwordStrength}>
                  <Text style={styles.strengthLabel}>Fortaleza: </Text>
                  <Text
                    style={[
                      styles.strengthText,
                      newPassword.length < 6 && styles.strengthWeak,
                      newPassword.length >= 6 &&
                        newPassword.length < 10 &&
                        styles.strengthMedium,
                      newPassword.length >= 10 && styles.strengthStrong,
                    ]}
                  >
                    {newPassword.length < 6
                      ? 'Débil'
                      : newPassword.length < 10
                      ? 'Media'
                      : 'Fuerte'}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>RESTABLECER CONTRASEÑA</Text>
                  )}
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Recordaste tu contraseña?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    height: 220,
    backgroundColor: '#722F37', // Wine color
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
    fontSize: 48,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
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
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressStep: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: '#722F37', // Wine color
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
  },
  progressTextActive: {
    color: '#FFF',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E0E0E0',
  },
  progressLineActive: {
    backgroundColor: '#722F37', // Wine color
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputWrapperFocused: {
    borderColor: '#722F37', // Wine color
    backgroundColor: '#FFF',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#1a1a1a',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
    marginTop: -10,
  },
  button: {
    backgroundColor: '#722F37', // Wine color
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 10,
    shadowColor: '#722F37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#722F37', // Wine color
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: -5,
  },
  strengthLabel: {
    fontSize: 14,
    color: '#666',
  },
  strengthText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  strengthWeak: {
    color: '#E74C3C',
  },
  strengthMedium: {
    color: '#F39C12',
  },
  strengthStrong: {
    color: '#27AE60',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  footerLink: {
    fontSize: 16,
    color: '#722F37', // Wine color
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;