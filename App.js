import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Text, View, ActivityIndicator } from 'react-native';

// Screens - All matching your actual file names
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import PredictionsScreen from './src/screens/PredictionsScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import RankingsScreen from './src/screens/RankingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for authenticated users
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#2c2c2c',
          borderTopColor: '#3c3c3c',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#e74c3c',
        tabBarInactiveTintColor: '#95a5a6',
        headerStyle: {
          backgroundColor: '#2c2c2c',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
          headerTitle: '🐔 Predicciones de Gallos',
        }}
      />
      <Tab.Screen
        name="Rankings"
        component={RankingsScreen}
        options={{
          title: 'Rankings',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏆</Text>,
          headerTitle: 'Rankings',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
          headerTitle: 'Mi Perfil',
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { user, loading } = useAuth();

  // ✅ FIX: Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A2E' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={{ color: '#FFF', marginTop: 10, fontSize: 16 }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2c2c2c',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          
          {/* Event Detail Screen */}
          <Stack.Screen
            name="EventDetail"
            component={EventDetailScreen}
            options={({ route }) => ({
              title: route.params?.evento?.nombre || 'Detalles del Evento',
              headerStyle: {
                backgroundColor: '#2c2c2c',
              },
              headerTintColor: '#fff',
            })}
          />
          
          <Stack.Screen
            name="Predictions"
            component={PredictionsScreen}
            options={{
              title: 'Hacer Predicciones',
              headerStyle: {
                backgroundColor: '#2c2c2c',
              },
              headerTintColor: '#fff',
            }}
          />
          
          <Stack.Screen
            name="Results"
            component={ResultsScreen}
            options={{
              title: 'Resultados',
              headerStyle: {
                backgroundColor: '#2c2c2c',
              },
              headerTintColor: '#fff',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// Root App Component
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}