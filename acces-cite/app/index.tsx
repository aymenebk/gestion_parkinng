import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Contrôle Accès Cité</Text>
      <Text style={styles.textAr}>مراقبة دخول السكنات</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a237e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  textAr: {
    color: '#ffd600',
    fontSize: 18,
    marginTop: 8,
  },
});