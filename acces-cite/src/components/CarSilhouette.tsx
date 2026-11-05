import React from 'react';
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';
import { getCarColorHex, shadeColor, getContrastColor } from '../utils/vehicleUtils';

interface Props {
  couleur: string;
  macaron: string;
  matricule: string;
}

export default function CarSilhouette({ couleur, macaron, matricule }: Props) {
  const body  = getCarColorHex(couleur);
  const dark  = shadeColor(body, -28);
  const glass = shadeColor(body, 40);
  const lite  = shadeColor(body, 18);
  const textC = getContrastColor(body);
  const id    = body.replace('#', '');

  return (
    <View style={styles.wrapper}>
      <Svg width={260} height={220} viewBox="0 0 380 290">
        <Defs>
          <LinearGradient id={'gl' + id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor={glass} stopOpacity="0.85"/>
            <Stop offset="1"   stopColor={body}  stopOpacity="0.45"/>
          </LinearGradient>
          <LinearGradient id={'sh' + id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.26"/>
            <Stop offset="1" stopColor="#000000" stopOpacity="0"/>
          </LinearGradient>
        </Defs>

        {/* Ombre sol */}
        <Path
          d="M 42 284 Q 190 292 338 284 Q 190 278 42 284 Z"
          fill="rgba(0,0,0,0.14)"
        />

        {/* Toit plat arrondi */}
        <Rect x="104" y="12" width="172" height="54" rx="14" fill={body}/>
        {/* Reflet toit */}
        <Rect x="112" y="18" width="80" height="20" rx="8" fill="white" opacity="0.22"/>

        {/* Montant A gauche */}
        <Path d="M 104 36 Q 76 62 60 90 L 94 90 Q 108 68 124 58 Z" fill={dark}/>
        {/* Montant A droit */}
        <Path d="M 276 36 Q 304 62 320 90 L 286 90 Q 272 68 256 58 Z" fill={dark}/>

        {/* Carrosserie principale */}
        <Path d={
          "M 60 90 Q 40 96 32 116 L 28 210 Q 28 228 46 234 " +
          "L 72 238 L 72 252 Q 72 264 90 268 L 290 268 " +
          "Q 308 264 308 252 L 308 238 L 334 234 " +
          "Q 352 228 352 210 L 348 116 Q 340 96 320 90 Z"
        } fill={body}/>

        {/* Reflet carrosserie */}
        <Path d={
          "M 60 90 Q 40 96 32 116 L 34 158 " +
          "Q 76 124 190 118 Q 304 124 346 158 L 348 116 " +
          "Q 340 96 320 90 Z"
        } fill={'url(#sh' + id + ')'}/>

        {/* Pare-brise */}
        <Path d={
          "M 124 58 Q 112 70 104 90 L 276 90 " +
          "Q 268 70 256 58 Q 226 50 190 49 Q 154 50 124 58 Z"
        } fill={'url(#gl' + id + ')'}/>

        {/* Retro gauche */}
        <Path d="M 58 118 Q 36 116 30 124 Q 26 134 36 140 Q 46 146 60 144 L 64 132 Z"
          fill={dark}/>
        {/* Retro droit */}
        <Path d="M 322 118 Q 344 116 350 124 Q 354 134 344 140 Q 334 146 320 144 L 316 132 Z"
          fill={dark}/>

        {/* Ligne de caractere */}
        <Path d="M 34 174 Q 112 164 190 162 Q 268 164 346 174"
          fill="none" stroke={lite} strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>

        {/* Bas de pare-chocs arrondi */}
        <Path d={
          "M 72 252 Q 72 264 90 268 L 290 268 Q 308 264 308 252 " +
          "Q 308 244 296 240 Q 258 234 190 234 " +
          "Q 122 234 84 240 Q 72 244 72 252 Z"
        } fill={dark}/>

        {/* Pneu gauche vertical */}
        <Rect x="44" y="240" width="36" height="48" rx="8" fill="#111111"/>
        <Rect x="48" y="244" width="28" height="40" rx="6" fill="#2a2a2a"/>

        {/* Pneu droit vertical */}
        <Rect x="300" y="240" width="36" height="48" rx="8" fill="#111111"/>
        <Rect x="304" y="244" width="28" height="40" rx="6" fill="#2a2a2a"/>

      </Svg>

      {/* Texte macaron + matricule */}
      <View style={styles.overlay}>
        <Text style={[styles.macaron, { color: textC }]}>{macaron}</Text>
        <Text style={[styles.matricule, { color: textC }]}>{matricule}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: '58%',
    alignItems: 'center',
  },
  macaron: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  matricule: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
