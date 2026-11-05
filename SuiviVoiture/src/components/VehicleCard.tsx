import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Vehicle } from "../types";
import { getCarColor } from "../utils/vehicleUtils";
import { colors, mono, radius, spacing, type } from "../theme/tokens";
import { rowDir, textAlign, useLang } from "../LangContext";
import CarSilhouette from "./CarSilhouette";
import { Button, Card } from "./ui";

function Verdict({ tone, icon, text }: { tone: "success" | "danger"; icon: "check-circle" | "close-circle"; text: string }) {
  const { isAr } = useLang();
  const bg = tone === "success" ? colors.success : colors.danger;
  return (
    <View style={[s.verdict, { backgroundColor: bg, flexDirection: rowDir(isAr) }]} accessibilityRole="header">
      <MaterialCommunityIcons name={icon} size={28} color="#fff" />
      <Text style={[s.verdictTxt, { textAlign: textAlign(isAr) }]}>{text}</Text>
    </View>
  );
}

function InfoItem({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  const { isAr } = useLang();
  return (
    <View style={s.infoItem}>
      <Text style={[type.label, { textAlign: textAlign(isAr) }]}>{label.toUpperCase()}</Text>
      {children ?? <Text style={[type.subtitle, { textAlign: textAlign(isAr) }]}>{value}</Text>}
    </View>
  );
}

function IdChip({ label, value }: { label: string; value: string }) {
  const { isAr } = useLang();
  return (
    <View style={s.idChip} accessible accessibilityLabel={label + " " + value}>
      <Text style={[type.label, { textAlign: textAlign(isAr) }]}>{label.toUpperCase()}</Text>
      <Text style={s.idValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

export function VehicleCard({ vehicle, onError }: { vehicle: Vehicle; onError: (msg: string) => void }) {
  const { T, isAr } = useLang();
  const colorHex = getCarColor(vehicle.couleur);
  const phone = vehicle.telephone.replace(/[^\d+]/g, "");
  const call = () => {
    Linking.openURL("tel:" + phone).catch(() => onError(T.callError));
  };
  return (
    <Card style={{ overflow: "hidden" }}>
      <Verdict tone="success" icon="check-circle" text={T.vehicleFound} />
      <View style={[s.ids, { flexDirection: rowDir(isAr) }]}>
        <IdChip label={T.macaron} value={vehicle.macaron} />
        <IdChip label={T.matricule} value={vehicle.matricule} />
      </View>
      <View style={s.carArea}>
        <CarSilhouette couleur={vehicle.couleur} macaron={vehicle.macaron} matricule={vehicle.matricule} />
      </View>
      <View style={[s.grid, { flexDirection: rowDir(isAr) }]}>
        <InfoItem label={T.marque} value={vehicle.marque} />
        <InfoItem label={T.modele} value={vehicle.modele} />
        <InfoItem label={T.bloc} value={T.blocValue(vehicle.bloc)} />
        <InfoItem label={T.couleur}>
          <View style={[s.colorRow, { flexDirection: rowDir(isAr) }]}>
            <View style={[s.swatch, { backgroundColor: colorHex }]} />
            <Text style={type.subtitle}>{vehicle.couleur}</Text>
          </View>
        </InfoItem>
      </View>
      <View style={s.contact}>
        <View style={[s.contactRow, { flexDirection: rowDir(isAr) }]}>
          <View style={s.avatar}><MaterialCommunityIcons name="account" size={22} color={colors.success} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[type.label, { textAlign: textAlign(isAr) }]}>{T.representant.toUpperCase()}</Text>
            <Text style={[type.subtitle, { textAlign: textAlign(isAr) }]}>{vehicle.bloc}</Text>
            <Text style={[type.caption, { textAlign: textAlign(isAr) }]}>{phone ? vehicle.telephone : T.noPhone}</Text>
          </View>
        </View>
        <Button title={T.appeler} icon="phone" variant="success" onPress={call} disabled={!phone} />
      </View>
    </Card>
  );
}

export function UnknownCard({ query, onReset }: { query: string; onReset: () => void }) {
  const { T, isAr } = useLang();
  return (
    <Card style={{ overflow: "hidden" }}>
      <Verdict tone="danger" icon="close-circle" text={T.unknownTitle} />
      <View style={s.unknownBody}>
        <Text style={[type.body, { textAlign: "center", color: colors.textMuted }]}>{T.unknownSub}</Text>
        <View style={s.queryChip} accessible accessibilityLabel={query}>
          <Text style={[s.idValue, { color: colors.danger }]}>{query}</Text>
        </View>
        <Text style={[type.caption, { textAlign: "center", writingDirection: isAr ? "rtl" : "ltr" }]}>{T.unknownHelp}</Text>
        <Button title={T.newSearch} icon="magnify" variant="tonal" onPress={onReset} />
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  verdict: { alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  verdictTxt: { flex: 1, color: "#fff", fontSize: 20, fontWeight: "800" },
  ids: { gap: spacing.md, padding: spacing.lg, paddingBottom: 0 },
  idChip: { flex: 1, backgroundColor: colors.primaryContainer, borderRadius: radius.md, padding: spacing.md, gap: 2 },
  idValue: { fontFamily: mono, fontSize: 18, fontWeight: "800", letterSpacing: 1, color: colors.primary },
  carArea: { alignItems: "center", paddingVertical: spacing.md },
  grid: { flexWrap: "wrap", paddingHorizontal: spacing.lg, rowGap: spacing.lg },
  infoItem: { width: "50%", gap: 2, paddingEnd: spacing.sm },
  colorRow: { alignItems: "center", gap: spacing.sm },
  swatch: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  contact: { marginTop: spacing.lg, padding: spacing.lg, gap: spacing.md, backgroundColor: colors.successContainer },
  contactRow: { alignItems: "center", gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  unknownBody: { padding: spacing.xl, gap: spacing.md, alignItems: "stretch" },
  queryChip: { alignSelf: "center", backgroundColor: colors.dangerContainer, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
});
