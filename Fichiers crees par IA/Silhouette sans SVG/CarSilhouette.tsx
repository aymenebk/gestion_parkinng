import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getCarColorHex, shadeColor, getContrastColor } from '../utils/vehicleUtils';

interface Props {
  couleur: string;
  macaron: string;
  matricule: string;
}

export default function CarSilhouette({ couleur, macaron, matricule }: Props) {
  const body  = getCarColorHex(couleur);
  const dark  = shadeColor(body, -30);
  const textC = getContrastColor(body);

  return (
    <View style={styles.container}>
      {/* Toit */}
      <View style={[styles.roof, { backgroundColor: body }]}/>
      {/* Carrosserie */}
      <View style={[styles.body, { backgroundColor: body }]}>
        {/* Pare-brise */}
        <View style={styles.windshield}/>
        {/* Texte */}
        <View style={styles.textArea}>
          <Text style={[styles.macaron, { color: textC }]}>{macaron}</Text>
          <Text style={[styles.matricule, { color: textC }]}>{matricule}</Text>
        </View>
      </View>
      {/* Pare-chocs bas */}
      <View style={[styles.bumper, { backgroundColor: dark }]}/>
      {/* Pneus */}
      <View style={styles.tyres}>
        <View style={styles.tyre}/>
        <View style={styles.tyre}/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 260,
  },
  roof: {
    width: 140,
    height: 44,
    borderRadius: 12,
    marginBottom: -2,
  },
  body: {
    width: 240,
    height: 130,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
  },
  windshield: {
    width: 130,
    height: 42,
    backgroundColor: 'rgba(200,230,255,0.55)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: 0,
  },
  textArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macaron: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  matricule: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    opacity: 0.9,
    marginTop: 4,
  },
  bumper: {
    width: 220,
    height: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: -2,
  },
  tyres: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 220,
    marginTop: 4,
  },
  tyre: {
    width: 34,
    height: 44,
    backgroundColor: '#111',
    borderRadius: 8,
  },
});
