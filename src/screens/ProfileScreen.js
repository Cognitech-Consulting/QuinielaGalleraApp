import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No hay sesión activa</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.user_id ? user.user_id.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{user.user_id}</Text>
          <Text style={styles.userEmail}>{user.email || 'Sin email'}</Text>
        </View>

        {/* Monedas Card */}
        <View style={styles.monedasCard}>
          <View style={styles.monedasHeader}>
            <Text style={styles.monedasIcon}>💰</Text>
            <Text style={styles.monedasLabel}>Monedas Disponibles</Text>
          </View>
          <Text style={styles.monedasAmount}>{user.monedas || 0}</Text>
          <Text style={styles.monedasInfo}>
            Cada ronda cuesta 50 monedas para participar
          </Text>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Estadísticas</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{user.total_participations || 0}</Text>
              <Text style={styles.statLabel}>Rondas Jugadas</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{user.total_points || 0}</Text>
              <Text style={styles.statLabel}>Puntos Totales</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{user.correct_predictions || 0}</Text>
              <Text style={styles.statLabel}>Aciertos</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {user.correct_predictions && user.total_predictions
                  ? `${Math.round((user.correct_predictions / user.total_predictions) * 100)}%`
                  : '0%'}
              </Text>
              <Text style={styles.statLabel}>Precisión</Text>
            </View>
          </View>
        </View>

        {/* Account Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Información de Cuenta</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Usuario:</Text>
              <Text style={styles.infoValue}>{user.user_id}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Monedas:</Text>
              <Text style={styles.infoValue}>{user.monedas || 0} 💰</Text>
            </View>
            
            {user.email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Miembro desde:</Text>
              <Text style={styles.infoValue}>
                {user.date_joined
                  ? new Date(user.date_joined).toLocaleDateString('es-ES')
                  : 'Desconocido'}
              </Text>
            </View>
          </View>
        </View>

        {/* How to Earn Monedas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 ¿Cómo ganar monedas?</Text>
          
          <View style={styles.helpCard}>
            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>🎯</Text>
              <View style={styles.helpText}>
                <Text style={styles.helpTitle}>Predicciones Correctas</Text>
                <Text style={styles.helpDescription}>
                  Gana puntos por cada predicción correcta
                </Text>
              </View>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>🏆</Text>
              <View style={styles.helpText}>
                <Text style={styles.helpTitle}>Rankings</Text>
                <Text style={styles.helpDescription}>
                  Los mejores jugadores reciben recompensas
                </Text>
              </View>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpIcon}>🎁</Text>
              <View style={styles.helpText}>
                <Text style={styles.helpTitle}>Bonos Diarios</Text>
                <Text style={styles.helpDescription}>
                  Inicia sesión diariamente para obtener monedas gratis
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.actionButtonText}>🏠 Ir al Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
              🚪 Cerrar Sesión
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Space */}
        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    backgroundColor: '#2c2c2c',
    borderBottomWidth: 2,
    borderBottomColor: '#e74c3c',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#95a5a6',
  },
  monedasCard: {
    backgroundColor: '#2c2c2c',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f39c12',
  },
  monedasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  monedasIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  monedasLabel: {
    fontSize: 16,
    color: '#95a5a6',
    fontWeight: '600',
  },
  monedasAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#f39c12',
    marginVertical: 10,
  },
  monedasInfo: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2c2c2c',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#3c3c3c',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#2c2c2c',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#3c3c3c',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3c3c3c',
  },
  infoLabel: {
    fontSize: 14,
    color: '#95a5a6',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  helpCard: {
    backgroundColor: '#2c2c2c',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#3c3c3c',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  helpIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  helpText: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  helpDescription: {
    fontSize: 13,
    color: '#95a5a6',
  },
  actionButton: {
    backgroundColor: '#2c2c2c',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3c3c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderColor: '#c0392b',
  },
  logoutButtonText: {
    color: '#fff',
  },
  footer: {
    height: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#95a5a6',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});