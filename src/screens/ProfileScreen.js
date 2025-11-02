// src/screens/ProfileScreen.js - PREMIUM BRANDED VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

const BASE_URL = 'https://cognitech.pythonanywhere.com';

const ProfileScreen = ({ navigation }) => {
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('user_id');
      if (storedUserId) {
        setUserId(storedUserId);
        setUsername(storedUserId);
      }
      const storedPic = await AsyncStorage.getItem('profile_picture_url');
      if (storedPic) setProfilePicUrl(storedPic);
      if (storedUserId) {
        try {
          const resp = await axios.get(`${BASE_URL}/api/accounts/profile/${storedUserId}/`);
          if (resp?.data?.profile_picture_url) {
            setProfilePicUrl(resp.data.profile_picture_url);
            await AsyncStorage.setItem('profile_picture_url', resp.data.profile_picture_url);
          }
          if (resp?.data?.username) setUsername(resp.data.username);
        } catch {}
      }
    } catch (error) {
      console.error('Fetch User Data Error:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (password && password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        user_id: userId,
        new_username: username,
        new_password: password || undefined,
      };
      const response = await axios.post(`${BASE_URL}/api/accounts/update-profile/`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.status === 200) {
        Alert.alert('¡Éxito!', 'Perfil actualizado correctamente.');
        setPassword('');
        setConfirmPassword('');
        await AsyncStorage.setItem('user_id', username);
        setUserId(username);
      } else {
        Alert.alert('Error', 'No se pudo actualizar el perfil.');
      }
    } catch (error) {
      console.error('Update Profile Error:', error);
      Alert.alert('Error', 'Ocurrió un problema al actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso Denegado', 'Necesitamos acceso a tu galería');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    if (!userId) {
      Alert.alert('Error', 'Usuario no válido');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('user_id', userId);
      form.append('profile_picture', {
        uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
      });
      const res = await axios.post(
        `${BASE_URL}/api/accounts/upload-profile-picture/`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (res.status === 200 && res.data?.profile_picture_url) {
        setProfilePicUrl(res.data.profile_picture_url);
        await AsyncStorage.setItem('profile_picture_url', res.data.profile_picture_url);
        Alert.alert('✅ Éxito', 'Foto de perfil actualizada');
      } else {
        Alert.alert('Error', 'No se pudo subir la imagen');
      }
    } catch (e) {
      console.error('Upload Image Error:', e);
      Alert.alert('❌ Error', 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
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
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (error) {
              console.error('Logout Error:', error);
              Alert.alert('Error', 'No se pudo cerrar la sesión.');
            }
          },
        },
      ]
    );
  };

  const renderInput = (placeholder, value, onChangeText, icon, options = {}) => (
    <View style={[styles.inputWrapper, focusedInput === placeholder && styles.inputWrapperFocused]}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocusedInput(placeholder)}
        onBlur={() => setFocusedInput(null)}
        editable={!loading && !uploading}
        {...options}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={pickImage}
          activeOpacity={0.8}
          disabled={uploading}
          style={styles.avatarContainer}
        >
          {profilePicUrl ? (
            <Image source={{ uri: profilePicUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarEmoji}>👤</Text>
          )}
          {uploading && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color="#FFF" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <Text style={styles.headerSubtitle}>{userId}</Text>
        <TouchableOpacity
          style={styles.changePhotoBtn}
          onPress={pickImage}
          activeOpacity={0.85}
          disabled={uploading}
        >
          {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.changePhotoText}>Cambiar foto</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Información de Cuenta</Text>
            <View style={styles.sectionDivider} />
          </View>

          {renderInput('Nombre de Usuario', username, setUsername, '✨')}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cambiar Contraseña</Text>
            <View style={styles.sectionDivider} />
          </View>

          {renderInput('Nueva Contraseña', password, setPassword, '🔒', { secureTextEntry: true })}
          {renderInput('Confirmar Contraseña', confirmPassword, setConfirmPassword, '🔒', { secureTextEntry: true })}

          <TouchableOpacity
            style={[styles.updateButton, (loading || uploading) && styles.buttonDisabled]}
            onPress={handleUpdateProfile}
            disabled={loading || uploading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.updateButtonText}>Actualizar Perfil</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Acciones de Cuenta</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <View style={styles.logoutButtonContent}>
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Quiniela Gallera © 2025</Text>
          <Text style={styles.footerSubtext}>Versión 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#D52B1E',
    paddingTop: 60,
    paddingBottom: 20,
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
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    overflow: 'hidden',
  },
  avatarEmoji: { fontSize: 44 },
  avatarImage: { width: '100%', height: '100%' },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' },
  changePhotoBtn: {
    marginTop: 8,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  changePhotoText: { color: '#FFF', fontWeight: '700' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 25 },
  profileCard: {
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
  sectionHeader: { marginTop: 5, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  sectionDivider: { height: 2, width: 40, backgroundColor: '#D52B1E' },
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
  inputWrapperFocused: { borderColor: '#D52B1E', backgroundColor: '#FFF', shadowOpacity: 0.1 },
  inputIcon: { fontSize: 20, marginLeft: 15 },
  input: { flex: 1, height: 50, paddingHorizontal: 15, fontSize: 15, color: '#1a1a1a' },
  updateButton: {
    backgroundColor: '#D52B1E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#D52B1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: { opacity: 0.6, backgroundColor: '#999' },
  updateButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
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
  actionsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 15 },
  logoutButton: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  logoutButtonContent: { flexDirection: 'row', alignItems: 'center' },
  logoutIcon: { fontSize: 20, marginRight: 10 },
  logoutButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  footer: { alignItems: 'center', paddingVertical: 30 },
  footerText: { fontSize: 14, color: '#666', fontWeight: '600', marginBottom: 5 },
  footerSubtext: { fontSize: 12, color: '#999' },
});

export default ProfileScreen;
