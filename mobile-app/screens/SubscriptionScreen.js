import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SubscriptionScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Subscription Plans</Text>
      <View style={styles.plan}>
        <Text style={styles.planTitle}>Free</Text>
        <Text>Basic features</Text>
      </View>
      <View style={styles.plan}>
        <Text style={styles.planTitle}>Premium</Text>
        <Text>Unlimited chat</Text>
        <Text>View contact</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Buy Premium</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  plan: { margin: 10, padding: 15, borderWidth: 1, borderRadius: 10 },
  planTitle: { fontSize: 20, fontWeight: 'bold' },
  button: { backgroundColor: 'blue', padding: 10, alignItems: 'center', borderRadius: 5, marginTop: 10 },
  buttonText: { color: 'white', fontSize: 18 },
});

export default SubscriptionScreen;