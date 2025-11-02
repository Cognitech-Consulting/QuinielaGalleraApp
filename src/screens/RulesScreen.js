// File: src/screens/RulesScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { getAppRules } from '../api/apiService';

const RulesScreen = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const data = await getAppRules();
      setRules(data.rules);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <ScrollView style={styles.container}>
      {rules.map((rule) => (
        <View key={rule.id} style={styles.ruleSection}>
          <Text style={styles.ruleTitle}>{rule.title}</Text>
          <Markdown>{rule.content}</Markdown>
        </View>
      ))}
    </ScrollView>
  );
};

export default RulesScreen;