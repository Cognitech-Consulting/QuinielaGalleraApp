// src/screens/LoginScreen.js - DARK WINE PREMIUM VERSION 🍷
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
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!userId || !password) {
      Alert.alert('Error', 'Por favor ingresa tu ID de usuario y contraseña');
      return;
    }

    setLoading(true);
    const result = await login(userId, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error || 'No se pudo iniciar sesión');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Dark Wine Background */}
      <View style={styles.backgroundDark}>
        <View style={styles.wineOverlay} />
      </View>

      {/* Decorative Elements - Subtle and Sexy */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />

      <View style={styles.content}>
        {/* Logo Section - Elegant */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🐓</Text>
          </View>
          <Text style={styles.title}>QUINIELA</Text>
          <Text style={styles.titleBold}>GALLERA</Text>
          <View style={styles.divider} />
          <Text style={styles.tagline}>Tu pasión por las peleas</Text>
        </View>

        {/* Form Card - Dark Glass Effect */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Iniciar Sesión</Text>

          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'userId' && styles.inputWrapperFocused
            ]}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="ID de Usuario"
                placeholderTextColor="#888"
                value={userId}
                onChangeText={setUserId}
                autoCapitalize="none"
                editable={!loading}
                onFocus={() => setFocusedInput('userId')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={[
              styles.inputWrapper,
              focusedInput === 'password' && styles.inputWrapperFocused
            ]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>ENTRAR</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('SignUp')}
            disabled={loading}
            style={styles.signupLink}
          >
            <Text style={styles.linkText}>
              ¿No tienes cuenta?{' '}
              <Text style={styles.linkTextBold}>Regístrate aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer - Subtle */}
        <Text style={styles.footer}>
          © 2025 Quiniela Gallera
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundDark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0f0f0f',
  },
  wineOverlay: {
    flex: 1,
    backgroundColor: '#1a0505', // Very dark wine/burgundy
    opacity: 0.9,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(139, 0, 0, 0.08)', // Dark wine tint
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -180,
    left: -180,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: '40%',
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(139, 0, 0, 0.05)', // Subtle wine
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(139, 0, 0, 0.15)', // Dark wine tint
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(213, 43, 30, 0.3)', // Subtle red border
  },
  logoEmoji: {
    fontSize: 45,
  },
  title: {
    fontSize: 34,
    fontWeight: '300',
    color: '#e0e0e0',
    letterSpacing: 6,
  },
  titleBold: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 3,
    marginTop: -5,
  },
  divider: {
    width: 70,
    height: 3,
    backgroundColor: '#D52B1E', // Brand red accent
    marginVertical: 12,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  formCard: {
    width: '100%',
    backgroundColor: 'rgba(20, 20, 20, 0.85)', // Dark glass effect
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.2)', // Subtle wine border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 15,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 28,
    textAlign: 'center',
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  inputWrapperFocused: {
    borderColor: '#D52B1E', // Brand red on focus
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    shadowColor: '#D52B1E',
    shadowOpacity: 0.3,
  },
  inputIcon: {
    fontSize: 22,
    marginLeft: 18,
  },
  input: {
    flex: 1,
    height: 58,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#FFF',
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 5,
    marginBottom: 18,
    backgroundColor: '#D52B1E', // Brand red
    shadowColor: '#D52B1E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.4,
    backgroundColor: '#555',
  },
  buttonContent: {
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  signupLink: {
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  linkTextBold: {
    color: '#D52B1E',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 35,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default LoginScreen;