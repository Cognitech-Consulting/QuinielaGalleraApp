// src/screens/LoginScreen.js
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
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!userId || !password) {
      Alert.alert('Campos Requeridos', 'Por favor ingresa tu usuario y contraseña');
      return;
    }

    setLoading(true);
    const result = await login(userId, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error de Inicio de Sesión', result.error || 'Credenciales inválidas. Intenta nuevamente.');
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#D52B1E" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Gradient background */}
        <LinearGradient
          colors={['#D52B1E', '#3B0000']}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* HEADER with massive centered logo */}
            <View style={styles.header}>
              <View style={styles.logoWrapper}>
                <View style={styles.whiteCircle}>
                  <Image
                    source={require('../../assets/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <Text style={styles.subtitle}>Tu pasión por las peleas</Text>
            </View>

            {/* FORM CARD */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Bienvenido de vuelta</Text>
              <Text style={styles.formSubtitle}>Inicia sesión para continuar</Text>

              <Text style={styles.inputLabel}>Usuario</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu usuario"
                placeholderTextColor="#999"
                value={userId}
                onChangeText={setUserId}
                editable={!loading}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                secureTextEntry={true}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => navigation.navigate('ForgotPasswordScreen')}
                disabled={loading}
              >
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate('SignUp')}
                disabled={loading}
              >
                <Text style={styles.registerText}>Crear nueva cuenta</Text>
              </TouchableOpacity>

              <Text style={styles.infoText}>
                Al iniciar sesión, aceptas nuestros términos y condiciones
              </Text>
            </View>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Quiniela Gallera © 2025</Text>
              <Text style={styles.footerSubtext}>Versión 1.0.1 • Hecho en Guatemala 🇬🇹</Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  whiteCircle: {
    backgroundColor: '#FFF',
    borderRadius: 999,
    width: width * 0.8, // huge circular background
    height: width * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  logoImage: {
    width: width * 0.7,
    height: width * 0.7,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 10,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 30,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15.5,
    color: '#1a1a1a',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#D52B1E',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#D52B1E',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#D52B1E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 26,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    marginHorizontal: 14,
    color: '#999',
    fontSize: 13,
  },
  registerButton: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 17,
    borderWidth: 2,
    borderColor: '#D52B1E',
    alignItems: 'center',
  },
  registerText: {
    color: '#D52B1E',
    fontSize: 15.5,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    marginTop: 35,
    paddingBottom: 30,
  },
  footerText: {
    color: '#FFF',
    fontSize: 13,
    marginBottom: 3,
  },
  footerSubtext: {
    color: '#EEE',
    fontSize: 11,
  },
});

export default LoginScreen;
