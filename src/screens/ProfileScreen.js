// ProfileScreen.js - FIXED VERSION
// The API returns balance data at top level, not nested in 'balance' object

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://cognitech.pythonanywhere.com';

const ProfileScreen = ({ navigation }) => {
  const { logout } = useAuth();

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

        await fetchBalance(parsedUser.user_id);
        await fetchProfilePicture(parsedUser.user_id);
      }
    } catch (error) {
      console.error('Fetch User Data Error:', error);
    }
  };

  // 🔧 FIXED: API returns data at top level, not nested in 'balance'
  const fetchBalance = async (user_id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/accounts/user-balance/?user_id=${user_id}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Balance API Response:', data); // Debug log
        
        // API response structure:
        // {
        //   "success": true,
        //   "user_id": "cochito",
        //   "total_monedas": 10150.0,
        //   "monedas_disponibles": 10150.0,
        //   "total_premios_ganados": 1,
        //   "recent_prizes": [...]
        // }
        
        if (data && data.success) {
          setTotalMonedas(data.total_monedas || 0);
          setMonedasDisponibles(data.monedas_disponibles || 0);
          setTotalPremios(data.total_premios_ganados || 0);
          setRecentPrizes(data.recent_prizes || []);
          
          console.log('✅ Balance updated:', {
            total: data.total_monedas,
            available: data.monedas_disponibles,
            prizes: data.total_premios_ganados
          });
        }
      } else {
        console.error('❌ Balance API failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Fetch Balance Error:', error);
    }
  };

  const fetchProfilePicture = async (user_id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/accounts/profile-picture/?user_id=${user_id}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profile_picture_url) {
          const fullUrl = data.profile_picture_url.startsWith('http')
            ? data.profile_picture_url
            : `${API_URL}${data.profile_picture_url}`;
          setProfilePicture(fullUrl);
          await AsyncStorage.setItem(`profile_pic_${user_id}`, fullUrl);
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

      const file = {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        name: `profile_${userId}.${fileType}`,
        type: `image/${fileType}`,
      };

      formData.append('profile_picture', file);

      const response = await fetch(
        `${API_URL}/api/accounts/upload-profile-picture/`,
        {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const pictureUrl = data.profile_picture || data.profile_picture_url;
        if (pictureUrl) {
          const fullUrl = pictureUrl.startsWith('http')
            ? pictureUrl
            : `${API_URL}${pictureUrl}`;
          setProfilePicture(fullUrl);
          await AsyncStorage.setItem(`profile_pic_${userId}`, fullUrl);
          Alert.alert('¡Éxito!', 'Foto de perfil actualizada correctamente.');
        }
      } else {
        Alert.alert('Error', data.message || data.error || 'No se pudo subir la imagen.');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', 'No se pudo subir la imagen. Verifica tu conexión.');
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
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (error) {
            console.error('Logout Error:', error);
            Alert.alert('Error', 'No se pudo cerrar la sesión.');
          }
        },
      },
    ]);
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
              onError={() => {
                console.log('Image load error, resetting');
                setProfilePicture(null);
              }}
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
          disabled={uploadingImage}
        >
          <Text style={styles.editPhotoText}>
            {uploadingImage ? 'Subiendo...' : 'Cambiar foto'}
          </Text>
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

          <InfoCard icon="👤" label="Usuario" value={userId} color="#D52B1E" />

          <InfoCard
            icon="✨"
            label="Nombre"
            value={`${nombre} ${apellido}`}
            color="#4CAF50"
          />

          <InfoCard
            icon="🎫"
            label="Tickets Disponibles"
            value={tickets}
            color="#FF9800"
          />

          <InfoCard
            icon="🏆"
            label="Premios Ganados"
            value={totalPremios}
            color="#9C27B0"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones</Text>

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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 4,
    borderColor: '#FFF',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarEmoji: {
    fontSize: 50,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D52B1E',
  },
  cameraIcon: {
    fontSize: 14,
  },
  editPhotoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editPhotoText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
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
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
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
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  actionArrow: {
    fontSize: 24,
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  logoutButton: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#D52B1E',
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D52B1E',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#CCC',
  },
});

export default ProfileScreen;