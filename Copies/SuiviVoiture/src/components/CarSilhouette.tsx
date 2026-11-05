import React from "react";
import Svg, { Path, Rect, Ellipse, Defs, LinearGradient, Stop } from "react-native-svg";
import { View, Text, StyleSheet } from "react-native";
import { getCarColor, getTextColorForBg, shadeColor } from "../utils/vehicleUtils";

interface Props {
  couleur: string;
  macaron: string;
  matricule: string;
}

export default function CarSilhouette({ couleur, macaron, matricule }: Props) {
  const body  = getCarColor(couleur);
  const dark  = shadeColor(body, -28);
  const vdark = shadeColor(body, -50);
  const glass = shadeColor(body, 40);
  const lite  = shadeColor(body, 18);
  const textC = getTextColorForBg(body);
  const id    = body.replace("#","");

  return (
    <View style={styles.wrapper}>
      <Svg width={300} height={220} viewBox="0 0 380 290">
        <Defs>
          <LinearGradient id={"gl"+id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={glass} stopOpacity="0.85"/>
            <Stop offset="1" stopColor={shadeColor(body,-6)} stopOpacity="0.45"/>
          </LinearGradient>
          <LinearGradient id={"sh"+id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.26"/>
            <Stop offset="1" stopColor="#000000" stopOpacity="0"/>
          </LinearGradient>
        </Defs>

        {/* Ombre sol */}
        <Ellipse cx="190" cy="260" rx="148" ry="6" fill="rgba(0,0,0,0.14)"/>

        {/* Toit */}
        <Rect x="97" y="34" width="185" height="24" rx="14" fill={body}/>
        <Ellipse cx="152" cy="42" rx="38" ry="6" fill="white" opacity="0.22"/>

        {/* Montants A */}
        <Path d={"M 104 36 Q 76 62 60 90 L 94 90 Q 108 68 124 58 Z"} fill={dark}/>
        <Path d={"M 276 36 Q 304 62 320 90 L 286 90 Q 272 68 256 58 Z"} fill={dark}/>

        {/* Pneu gauche */}
        <Rect x="44"  y="200" width="36" height="58" rx="8" fill="#111"/>
        <Rect x="48"  y="204" width="28" height="50" rx="6" fill="#2a2a2a"/>

        {/* Pneu droit */}
        <Rect x="300" y="200" width="36" height="58" rx="8" fill="#111"/>
        <Rect x="304" y="204" width="28" height="50" rx="6" fill="#2a2a2a"/>

        {/* Carrosserie */}
        <Path d={"M 60 90 Q 40 96 32 116 L 30 140 Q 30 228 46 234 L 72 238 L 308 238 Q 350 238 348 140 L 348 116 Q 340 96 320 90 Z"} fill={body}/>

        {/* Reflet carrosserie */}
        <Path d={"M 60 90 Q 40 96 32 116 L 34 158 Q 76 124 190 118 Q 304 124 346 158 L 348 116 Q 340 96 320 90 Z"} fill={"url(#sh"+id+")"}/>

        {/* Pare-brise */}
        <Path d={"M 124 58 Q 112 70 104 90 L 276 90 Q 268 70 256 58 Q 226 50 190 49 Q 154 50 124 58 Z"} fill={"url(#gl"+id+")"}/>
        <Path d={"M 128 60 Q 118 74 112 88 L 152 88 Q 150 72 158 62 Z"} fill="white" opacity="0.18"/>

        {/* Retroviseurs */}
        <Path d={"M 77 63 Q 36 61 30 69 Q 26 79 36 85 Q 46 91 60 89 L 67 77 Z"} fill={vdark}/>
        <Path d={"M 303 63 Q 344 61 350 69 Q 354 79 344 85 Q 334 91 320 89 L 313 77 Z"} fill={vdark}/>

        {/* Ligne de caractere */}
        <Path d={"M 34 174 Q 112 164 190 162 Q 268 164 346 174"} fill="none" stroke={lite} strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>

        {/* Bas de pare-chocs */}
        <Path d={"M 42 210 Q 42 224 60 228 L 315 228 Q 333 224 333 212 Q 333 204 311 200 Q 258 194 190 194 Q 122 194 54 200 Q 42 204 42 212 Z"} fill={dark}/>

        {/* Optiques */}
        <Path d={"M 315 122 Q 286 121 280 129 Q 276 139 286 145 Q 296 151 310 149 Q 347 151 340 124 Z"} fill="#FFFFFF"/>
        <Path d={"M 65 122 Q 94 121 100 129 Q 104 139 94 145 Q 84 151 70 149 Q 33 151 40 124"} fill="#FFFFFF"/>
      </Svg>

      {/* Macaron */}
      <View style={styles.macaronOverlay}>
        <Text style={[styles.macaronText, { color: textC }]}>{macaron}</Text>
      </View>

      {/* Matricule */}
      <View style={styles.matriculeOverlay}>
        <Text style={[styles.matriculeText, { color: textC }]}>{matricule}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", justifyContent: "center", position: "relative" },
  macaronOverlay: { position: "absolute", top: "52%", alignItems: "center" },
  matriculeOverlay: { position: "absolute", top: "62%", alignItems: "center" },
  macaronText: { fontSize: 14, fontWeight: "800", letterSpacing: 1.5,
    textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  matriculeText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.8,
    textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
});