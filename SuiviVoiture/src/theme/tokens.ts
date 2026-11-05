import { Platform, TextStyle } from "react-native";

/** Design tokens — single source of truth for the whole UI (see docs/REDESIGN_PLAN.md §3). */
export const colors = {
  primary: "#1A237E",
  primaryContainer: "#E8EAF6",
  onPrimary: "#FFFFFF",
  accent: "#FFB300",
  background: "#F4F6FB",
  surface: "#FFFFFF",
  border: "#DDE1EC",
  text: "#14182B",
  textMuted: "#5A6178",
  success: "#1B7A3A",
  successContainer: "#E3F4E8",
  danger: "#B3261E",
  dangerContainer: "#FCE8E6",
  warning: "#8A5A00",
  warningContainer: "#FFF3D6",
  scrim: "rgba(10,14,40,0.55)",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, sheet: 24, full: 999 };
export const touch = 48;

export const mono = Platform.select({ ios: "Menlo", default: "monospace" }) as string;

export const type: Record<"display" | "title" | "subtitle" | "body" | "label" | "caption", TextStyle> = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: "800", color: colors.text },
  title: { fontSize: 20, lineHeight: 26, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 16, lineHeight: 22, fontWeight: "600", color: colors.text },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400", color: colors.text },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 0.6, color: colors.textMuted },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400", color: colors.textMuted },
};

export const elevation = {
  card: { shadowColor: "#0A0E28", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sheet: { shadowColor: "#0A0E28", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 8 },
};
