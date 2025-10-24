// HomeScreen.js

import React from 'react';
import { View, Text, Button } from 'react-native';
import { auth } from './firebaseConfig';
import { signOut } from 'firebase/auth';

const HomeScreen = ({ navigation }) => {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error signing out: ', error.message);
    }
  };

  return (
    <View>
      <Text>Welcome to QuinielaGallera!</Text>
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
};

export default HomeScreen;
