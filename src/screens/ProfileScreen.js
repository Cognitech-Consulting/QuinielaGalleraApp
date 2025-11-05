// src/screens/ProfileScreen.js - FIXED TO READ FROM 'user' KEY
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [tickets, setTickets] = useState(0);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // ⭐ FIXED: Read from 'user' key (single JSON object)
      const userData = await AsyncStorage.getItem('user');
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('Retrieved user data:', parsedUser); // Debug log
        
        setUserId(parsedUser.user_id || '');
        setNombre(parsedUser.nombre || '');
        setApellido(parsedUser.apellido || '');
        setTickets(parsedUser.event_tickets || 0);
      }
    } catch (error) {
      console.error('Fetch User Data Error:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert(
                'Sesión Cerrada', 
                'Por favor cierra y vuelve a abrir la aplicación.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Logout Error:', error);
              Alert.alert('Error', 'No se pudo cerrar la sesión.');
            }
          },
        },
      ]
    );
  };

  const InfoCard = ({ icon, label, value, color = '#D52B1E' }) => (
    <View style={styles.infoCard}>
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
        <Text style={styles.infoIcon}>{icon}</Text>
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <Text style={styles.headerSubtitle}>@{userId}</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <InfoCard 
            icon="👤" 
            label="Usuario" 
            value={userId}
            color="#D52B1E"
          />
          
          <InfoCard 
            icon="✨" 
            label="Nombre" 
            value={nombre}
            color="#4CAF50"
          />
          
          <InfoCard 
            icon="📝" 
            label="Apellido" 
            value={apellido}
            color="#2196F3"
          />
          
          <InfoCard 
            icon="🎟️" 
            label="Tickets Disponibles" 
            value={`${tickets} tickets`}
            color="#FF9800"
          />
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>🏆 Estadísticas</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tickets}</Text>
              <Text style={styles.statLabel}>Tickets</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Premios</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Participaciones</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Acciones</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionButtonText}>Configuración</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionIcon}>🏆</Text>
              <Text style={styles.actionButtonText}>Mis Premios</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible pronto')}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionButtonText}>Historial</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.logoutButtonContent}>
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Quiniela Gallera © 2025</Text>
          <Text style={styles.footerSubtext}>Versión 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#D52B1E',
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 25,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
    paddingLeft: 5,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D52B1E',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  actionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F8F8F8',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  actionButtonText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  actionArrow: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
  },
  logoutButton: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen;