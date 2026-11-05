import { View, StyleSheet } from 'react-native';
import CarSilhouette from '../components/CarSilhouette';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <CarSilhouette couleur="rouge" macaron="M-0001" matricule="12345-001-16"/>
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
});
