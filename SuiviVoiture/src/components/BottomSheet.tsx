import React from "react";
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, elevation, radius, spacing } from "../theme/tokens";

export default function BottomSheet({ visible, onClose, children, closeLabel }: {
  visible: boolean; onClose: () => void; children: React.ReactNode; closeLabel: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={s.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={closeLabel}>
          <View style={s.scrim} />
        </Pressable>
        <KeyboardAvoidingView behavior="padding" style={s.kav}>
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
            <View style={s.handle} />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content} bounces={false}>
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { flex: 1, backgroundColor: colors.scrim },
  kav: { width: "100%", maxHeight: "92%" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, ...elevation.sheet },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: spacing.md },
  content: { padding: spacing.xl, gap: spacing.lg },
});
