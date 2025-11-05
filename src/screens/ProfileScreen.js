import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  BackHandler,
  RefreshControl,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'https://cognitech.pythonanywhere.com';

const ProfileScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [tickets, setTickets] = useState(0);
  
  const [totalMonedas, setTotalMonedas] = useState(0);
  const [monedasDisponibles, setMonedasDisponibles] = useState(0);
  const [totalPremios, setTotalPremios] = useState(0);
  const [recentPrizes, setRecentPrizes] = useState([]);
  
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    requestPermissions();
    fetchUserData();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Necesitamos acceso a tu galería para subir fotos de perfil.'
        );
      }
    }
  };

  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        
        setUserId(parsedUser.user_id || '');
        setNombre(parsedUser.nombre || '');
        setApellido(parsedUser.apellido || '');
        setTickets(parsedUser.event_tickets || 0);
        
        const savedPicture = await AsyncStorage.getItem(`profile_pic_${parsedUser.user_id}`);
        if (savedPicture) {
          setProfilePicture(savedPicture);
        }
        
        await fetchBalance(parsedUser.user_id);
        await fetchProfilePicture(parsedUser.user_id);
      }
    } catch (error) {
      console.error('Fetch User Data Error:', error);
    }
  };

  const fetchBalance = async (user_id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/accounts/user-balance/?user_id=${user_id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.balance) {
          setTotalMonedas(data.balance.total_monedas || 0);
          setMonedasDisponibles(data.balance.monedas_disponibles || 0);
          setTotalPremios(data.balance.total_premios_ganados || 0);
          setRecentPrizes(data.recent_prizes || []);
        }
      }
    } catch (error) {
      console.error('Fetch Balance Error:', error);
    }
  };

  const fetchProfilePicture = async (user_id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/accounts/profile-picture/?user_id=${user_id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const pictureUrl = data.profile_picture_url || data.profile_picture;
        if (pictureUrl) {
          setProfilePicture(pictureUrl);
          await AsyncStorage.setItem(`profile_pic_${user_id}`, pictureUrl);
        }
      }
    } catch (error) {
      console.error('Fetch Profile Picture Error:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Pick Image Error:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const uploadProfilePicture = async (imageUri) => {
    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('profile_picture', {
        uri: imageUri,
        name: `profile_${userId}.${fileType}`,
        type: `image/${fileType}`,
      });

      const response = await fetch(
        `${API_URL}/api/accounts/upload-profile-picture/`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const pictureUrl = data.profile_picture_url || data.profile_picture;
        
        if (pictureUrl) {
          setProfilePicture(pictureUrl);
          await AsyncStorage.setItem(`profile_pic_${userId}`, pictureUrl);
          Alert.alert('Éxito', 'Foto de perfil actualizada correctamente.');
        }
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'No se pudo subir la imagen.');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', 'No se pudo subir la imagen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
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
              BackHandler.exitApp();
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
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={pickImage}
          activeOpacity={0.8}
        >
          {uploadingImage ? (
            <ActivityIndicator size="large" color="#FFF" />
          ) : profilePicture ? (
            <Image 
              source={{ uri: profilePicture }} 
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarEmoji}>👤</Text>
          )}
          <View style={styles.cameraIconContainer}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <Text style={styles.headerSubtitle}>@{userId}</Text>
        <TouchableOpacity 
          style={styles.editPhotoButton}
          onPress={pickImage}
        >
          <Text style={styles.editPhotoText}>Cambiar foto</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#D52B1E']}
            tintColor="#D52B1E"
          />
        }
      >
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceTitle}>💰 Mi Balance</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Text style={styles.refreshText}>🔄</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.balanceAmount}>
            <Text style={styles.balanceValue}>
              {totalMonedas.toLocaleString('es-GT')}
            </Text>
            <Text style={styles.balanceCurrency}>monedas</Text>
          </View>
          {monedasDisponibles !== totalMonedas && (
            <Text style={styles.balanceSubtext}>
              Disponibles: {monedasDisponibles.toLocaleString('es-GT')}
            </Text>
          )}
        </View>

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

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>🏆 Estadísticas</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tickets}</Text>
              <Text style={styles.statLabel}>Tickets</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FFD700' }]}>
                {totalPremios}
              </Text>
              <Text style={styles.statLabel}>Premios</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {totalMonedas > 0 ? totalMonedas.toLocaleString('es-GT', {maximumFractionDigits: 0}) : '0'}
              </Text>
              <Text style={styles.statLabel}>Monedas</Text>
            </View>
          </View>
        </View>

        {recentPrizes.length > 0 && (
          <View style={styles.prizesCard}>
            <Text style={styles.sectionTitle}>🏅 Últimos Premios</Text>
            {recentPrizes.slice(0, 5).map((prize, index) => (
              <View key={prize.id || index} style={styles.prizeRow}>
                <View style={styles.prizeLeft}>
                  <Text style={styles.prizeType}>{prize.tipo_display}</Text>
                  <Text style={styles.prizeDetails}>
                    {prize.evento} • Ronda {prize.ronda}
                  </Text>
                  <Text style={styles.prizeDate}>
                    {new Date(prize.fecha).toLocaleDateString('es-GT', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={styles.prizeRight}>
                  <Text style={styles.prizeAmount}>
                    +{prize.monto.toLocaleString('es-GT')}
                  </Text>
                  <Text style={styles.prizeCurrency}>💰</Text>
                </View>
              </View>
            ))}
            
            {recentPrizes.length > 5 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>
                  Ver todos ({recentPrizes.length} premios)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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
            onPress={() => navigation.navigate('Results')}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionButtonText}>Mis Resultados</Text>
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>Quiniela Gallera © 2025</Text>
          <Text style={styles.footerSubtext}>Versión 1.0.1</Text>
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
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D52B1E',
  },
  cameraIcon: {
    fontSize: 12,
  },
  editPhotoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editPhotoText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
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
  balanceCard: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  refreshText: {
    fontSize: 20,
  },
  balanceAmount: {
    alignItems: 'center',
    marginVertical: 10,
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  balanceCurrency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 5,
  },
  balanceSubtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
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
  prizesCard: {
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
  prizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  prizeLeft: {
    flex: 1,
  },
  prizeType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  prizeDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  prizeDate: {
    fontSize: 11,
    color: '#999',
  },
  prizeRight: {
    alignItems: 'flex-end',
  },
  prizeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  prizeCurrency: {
    fontSize: 14,
  },
  viewAllButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D52B1E',
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