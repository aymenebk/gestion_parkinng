import React from "react";
import {
  ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, elevation, radius, spacing, touch, type } from "../theme/tokens";
import { rowDir, textAlign, useLang } from "../LangContext";

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Round 48 dp icon-only button; `label` is the accessibility label. */
export function IconButton({ icon, label, onPress, light, disabled }: {
  icon: IconName; label: string; onPress: () => void; light?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={4}
      style={({ pressed }) => [s.iconBtn, light && s.iconBtnLight, pressed && s.pressed, disabled && s.disabled]}>
      <MaterialCommunityIcons name={icon} size={24} color={light ? colors.onPrimary : colors.primary} />
    </Pressable>
  );
}

type Variant = "primary" | "tonal" | "ghost" | "success" | "accent";
const btnBg: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  success: { backgroundColor: colors.success },
  accent: { backgroundColor: colors.accent },
  tonal: { backgroundColor: colors.primaryContainer },
  ghost: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
};

export function Button({ title, onPress, icon, variant = "primary", loading, disabled, style }: {
  title: string; onPress: () => void; icon?: IconName; variant?: Variant;
  loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const { isAr } = useLang();
  const fg = variant === "primary" || variant === "success" ? colors.onPrimary : variant === "accent" ? colors.text : colors.primary;
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [s.btn, btnBg[variant], { flexDirection: rowDir(isAr) }, pressed && s.pressed, off && s.disabled, style]}>
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon ? <MaterialCommunityIcons name={icon} size={20} color={fg} /> : null}
          <Text style={[s.btnTxt, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function TextField({ label, error, trailing, ...rest }: TextInputProps & {
  label: string; error?: string; trailing?: React.ReactNode;
}) {
  const { isAr } = useLang();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[type.label, { textAlign: textAlign(isAr) }]}>{label.toUpperCase()}</Text>
      <View style={[s.field, { flexDirection: rowDir(isAr) }, !!error && { borderColor: colors.danger }]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor="#8A90A6"
          textAlign={textAlign(isAr)}
          style={s.fieldInput}
          {...rest}
        />
        {trailing}
      </View>
      {error ? <Text style={[type.caption, { color: colors.danger, textAlign: textAlign(isAr) }]}>{error}</Text> : null}
    </View>
  );
}

export function StatusChip({ icon, text, tone }: { icon: IconName; text: string; tone: "success" | "warning" }) {
  const { isAr } = useLang();
  const fg = tone === "success" ? colors.success : colors.warning;
  const bg = tone === "success" ? colors.successContainer : colors.warningContainer;
  return (
    <View style={[s.chip, { backgroundColor: bg, flexDirection: rowDir(isAr) }]} accessibilityRole="text">
      <MaterialCommunityIcons name={icon} size={16} color={fg} />
      <Text style={{ color: fg, fontSize: 12, fontWeight: "700" }}>{text}</Text>
    </View>
  );
}

export function Banner({ tone, text, onDismiss, dismissLabel }: {
  tone: "success" | "error" | "warning" | "info"; text: string; onDismiss?: () => void; dismissLabel?: string;
}) {
  const { isAr } = useLang();
  const map = {
    success: { fg: colors.success, bg: colors.successContainer, icon: "check-circle" },
    error: { fg: colors.danger, bg: colors.dangerContainer, icon: "alert-circle" },
    warning: { fg: colors.warning, bg: colors.warningContainer, icon: "alert" },
    info: { fg: colors.primary, bg: colors.primaryContainer, icon: "information" },
  } as const;
  const m = map[tone];
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={tone === "error" ? "alert" : "text"}
      style={[s.banner, { backgroundColor: m.bg, flexDirection: rowDir(isAr) }]}>
      <MaterialCommunityIcons name={m.icon} size={22} color={m.fg} />
      <Text style={[type.body, { flex: 1, color: m.fg, textAlign: textAlign(isAr), fontWeight: "600" }]}>{text}</Text>
      {onDismiss ? (
        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel={dismissLabel} hitSlop={12}>
          <MaterialCommunityIcons name="close" size={20} color={m.fg} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function EmptyState({ icon, title, description, action }: {
  icon: IconName; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <View style={s.empty} accessibilityLiveRegion="polite">
      <View style={s.emptyIcon}>
        <MaterialCommunityIcons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={[type.title, { textAlign: "center" }]}>{title}</Text>
      <Text style={[type.body, { textAlign: "center", color: colors.textMuted }]}>{description}</Text>
      {action}
    </View>
  );
}

const s = StyleSheet.create({
  iconBtn: { width: touch, height: touch, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryContainer },
  iconBtnLight: { backgroundColor: "rgba(255,255,255,0.16)" },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
  btn: { minHeight: touch, borderRadius: radius.md, paddingHorizontal: spacing.xl, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  btnTxt: { fontSize: 16, fontWeight: "700" },
  field: { minHeight: 56, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", paddingHorizontal: spacing.lg, gap: spacing.sm },
  fieldInput: { flex: 1, fontSize: 17, fontWeight: "500", color: colors.text, paddingVertical: spacing.md },
  chip: { alignItems: "center", gap: spacing.xs, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6, alignSelf: "flex-start" },
  banner: { alignItems: "center", gap: spacing.md, borderRadius: radius.md, padding: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, ...elevation.card },
  empty: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryContainer, alignItems: "center", justifyContent: "center" },
});
