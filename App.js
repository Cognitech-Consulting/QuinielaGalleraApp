// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import PredictionsScreen from './src/screens/PredictionsScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import RankingsScreen from './src/screens/RankingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

// Auth Navigator (Login, SignUp)
function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

// Main App Navigator (Home, Predictions, Results, Rankings, Profile)
function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#D52B1E',
        },
        headerTintColor: '#FFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Quiniela Gallera',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Predictions" 
        component={PredictionsScreen}
        options={{
          title: 'Hacer Predicciones',
        }}
      />
      <Stack.Screen 
        name="Results" 
        component={ResultsScreen}
        options={{
          title: 'Mis Resultados',
        }}
      />
      <Stack.Screen 
        name="Rankings" 
        component={RankingsScreen}
        options={{
          title: 'Rankings',
        }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Mi Perfil',
        }}
      />
    </Stack.Navigator>
  );
}

// Root Navigator - switches between Auth and App based on user state
function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D52B1E" />
      </View>
    );
  }

  return user ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}