import React from 'react';
import Svg, { Path, Rect, Circle, Ellipse, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';
import { getCarColorHex, getContrastColor, shadeColor } from '../utils/vehicleUtils';

interface CarSilhouetteProps {
  couleur: string;
  macaron: string;
  matricule: string;
}

export default function CarSilhouette({ couleur, macaron, matricule }: CarSilhouetteProps) {
  const bodyColor = getCarColorHex(couleur);
  const darkColor = shadeColor(bodyColor, -25);
  const veryDark = shadeColor(bodyColor, -45);
  const lightColor = shadeColor(bodyColor, 30);
  const textColor = getContrastColor(bodyColor);

  return (
    <View style={styles.container}>
      <Svg width="300" height="130" viewBox="0 0 300 130">
        <Defs>
          <RadialGradient id="windowGrad" cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor={lightColor} stopOpacity="0.65" />
            <Stop offset="100%" stopColor={shadeColor(bodyColor, -8)} stopOpacity="0.35" />
          </RadialGradient>
        </Defs>

        {/* Shadow */}
        <Ellipse cx="150" cy="118" rx="118" ry="8" fill="rgba(0,0,0,0.15)" />

        {/* Body lower (sill) */}
        <Rect x="22" y="74" width="256" height="30" rx="6" fill={darkColor} />

        {/* Main body */}
        <Path
          d={`M22 76 Q24 54 42 54 L58 44 Q74 28 106 24 L192 24 Q226 28 242 44 L258 54 Q278 54 278 76 L278 88 Q278 94 272 94 L28 94 Q22 94 22 88 Z`}
          fill={bodyColor}
        />

        {/* Left window */}
        <Path
          d="M62 54 L70 30 Q84 26 106 26 L144 26 L144 54 Z"
          fill="url(#windowGrad)"
        />

        {/* Right window */}
        <Path
          d="M150 54 L150 26 L188 26 Q218 28 232 44 L240 54 Z"
          fill="url(#windowGrad)"
        />

        {/* Window border outline */}
        <Path
          d="M62 54 L70 30 Q84 26 106 26 L188 26 Q218 28 232 44 L240 54 Z"
          fill="none"
          stroke={veryDark}
          strokeWidth="1.5"
        />

        {/* Window divider */}
        <Line x1="147" y1="26" x2="147" y2="54" stroke={veryDark} strokeWidth="1.5" />

        {/* Left wheel */}
        <Circle cx="76" cy="94" r="20" fill="#37474F" />
        <Circle cx="76" cy="94" r="13" fill="#546E7A" />
        <Circle cx="76" cy="94" r="6" fill="#B0BEC5" />
        <Circle cx="76" cy="94" r="2" fill="#78909C" />

        {/* Right wheel */}
        <Circle cx="224" cy="94" r="20" fill="#37474F" />
        <Circle cx="224" cy="94" r="13" fill="#546E7A" />
        <Circle cx="224" cy="94" r="6" fill="#B0BEC5" />
        <Circle cx="224" cy="94" r="2" fill="#78909C" />

        {/* Front headlight */}
        <Ellipse cx="275" cy="76" rx="7" ry="6" fill="#FFF9C4" opacity="0.9" />
        <Ellipse cx="275" cy="76" rx="4" ry="3.5" fill="#FFEE58" opacity="0.8" />

        {/* Rear light */}
        <Ellipse cx="25" cy="76" rx="7" ry="6" fill="#FFCCBC" opacity="0.85" />
        <Ellipse cx="25" cy="76" rx="4" ry="3.5" fill="#EF5350" opacity="0.7" />

        {/* Door line */}
        <Line x1="147" y1="54" x2="147" y2="94" stroke={veryDark} strokeWidth="1" opacity="0.6" />

        {/* Door handles */}
        <Rect x="108" y="72" width="22" height="5" rx="2.5" fill={veryDark} opacity="0.55" />
        <Rect x="170" y="72" width="22" height="5" rx="2.5" fill={veryDark} opacity="0.55" />
      </Svg>

      {/* Overlay text on car */}
      <View style={styles.overlayContainer} pointerEvents="none">
        <Text style={[styles.macaronText, { color: textColor }]}>{macaron}</Text>
        <Text style={[styles.matriculeText, { color: textColor }]}>{matricule}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  overlayContainer: {
    position: 'absolute',
    top: '38%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  macaronText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  matriculeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    opacity: 0.9,
  },
});
