import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { Vehicle } from "../types";
import { searchVehicle } from "../utils/vehicleUtils";
import { ImportErrorCode, useVehicleStore } from "../hooks/useVehicleStore";
import { rowDir, textAlign, useLang } from "../LangContext";
import { colors, radius, spacing, type } from "../theme/tokens";
import BottomSheet from "../components/BottomSheet";
import { VehicleCard, UnknownCard } from "../components/VehicleCard";
import { Banner, Button, Card, EmptyState, IconButton, StatusChip, TextField } from "../components/ui";

type Result = { vehicle?: Vehicle; query: string };
type Notice = { tone: "success" | "error" | "warning" | "info"; text: string };

const haptic = (fn: () => Promise<void>) => { fn().catch(() => undefined); };

export default function ControlScreen() {
  const { T, isAr, toggle } = useLang();
  const insets = useSafeAreaInsets();
  const store = useVehicleStore();

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selFile, setSelFile] = useState<{ name: string; uri: string } | null>(null);
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [importError, setImportError] = useState<ImportErrorCode | "pick" | null>(null);
  const [importing, setImporting] = useState(false);

  const hasList = store.status === "ready";

  const openImport = useCallback(() => {
    setSelFile(null); setPassword(""); setShowPwd(false); setImportError(null); setSheetOpen(true);
  }, []);

  // First launch / unreadable saved list → open the import sheet (as before).
  useEffect(() => {
    if (store.status === "empty") {
      if (store.restoreFailed) setNotice({ tone: "warning", text: T.autoLoadFail });
      openImport();
    } else if (store.status === "ready" && store.restoredFromCopy) {
      setNotice({ tone: "info", text: T.autoLoadedFrom });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.status]);

  // Success / info notices disappear on their own; warnings and errors stay until dismissed.
  useEffect(() => {
    if (!notice || (notice.tone !== "success" && notice.tone !== "info")) return;
    const id = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(id);
  }, [notice]);

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/plain", "*/*"], copyToCacheDirectory: true });
      if (!res.canceled && res.assets?.[0]) {
        setSelFile({ name: res.assets[0].name, uri: res.assets[0].uri });
        setImportError(null);
      }
    } catch {
      setImportError("pick");
    }
  };

  const confirmImport = async () => {
    setImporting(true);
    setImportError(null);
    const r = await store.importFile(selFile, password);
    setImporting(false);
    if (!r.ok) { setImportError(r.error); return; }
    setSheetOpen(false);
    setResult(null);
    setQuery("");
    setNotice({ tone: "success", text: T.successToast(r.count) + (r.skipped ? " · " + T.skippedRows(r.skipped) : "") });
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  };

  const doSearch = () => {
    const q = query.trim();
    if (!q) return;
    if (!hasList) { setNotice({ tone: "warning", text: T.noList }); return; }
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    const found = searchVehicle(store.vehicles, q);
    setResult({ vehicle: found, query: q.toUpperCase() });
    haptic(() => Haptics.notificationAsync(found ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error));
  };

  const reset = () => { setQuery(""); setResult(null); };

  const errorText = (e: ImportErrorCode | "pick" | null) => {
    switch (e) {
      case "noFile": return T.errorNoFile;
      case "noKey": return T.errorNoKey;
      case "decrypt": return T.errorDecrypt;
      case "format": return T.errorFormat;
      case "pick": return T.pickError;
      default: return undefined;
    }
  };

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      {/* App bar */}
      <View style={[s.appBar, { paddingTop: insets.top + spacing.md }]}>
        <View style={[s.appBarRow, { flexDirection: rowDir(isAr) }]}>
          <View style={{ flex: 1, gap: spacing.sm }}>
            <Text style={[s.appTitle, { textAlign: textAlign(isAr) }]} accessibilityRole="header">{T.HeaderLabel}</Text>
            {store.status === "loading" ? null : hasList
              ? <StatusChip icon="check-circle" tone="success" text={T.statusLoadedShort(store.vehicles.length)} />
              : <StatusChip icon="alert" tone="warning" text={T.statusNone} />}
          </View>
          <IconButton icon="translate" label={T.langA11y} onPress={toggle} light />
          <IconButton icon="file-upload-outline" label={T.importA11y} onPress={openImport} light />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + spacing.xxxl }]} keyboardShouldPersistTaps="handled">
          {notice ? (
            <Banner tone={notice.tone} text={notice.text} onDismiss={() => setNotice(null)} dismissLabel={T.dismiss} />
          ) : null}

          {/* Search */}
          <Card style={s.searchCard}>
            <TextField
              label={T.searchLabel}
              value={query}
              onChangeText={t => { setQuery(t); if (result) setResult(null); }}
              placeholder={T.searchPlaceholder}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={doSearch}
              editable={store.status !== "loading"}
              trailing={query ? (
                <Pressable onPress={reset} hitSlop={12} accessibilityRole="button" accessibilityLabel={T.clearLabel}>
                  <MaterialCommunityIcons name="close-circle" size={22} color={colors.textMuted} />
                </Pressable>
              ) : null}
            />
            <Button title={T.searchBtn} icon="magnify" onPress={doSearch} disabled={!query.trim() || store.status === "loading"} />
          </Card>

          {/* Result area */}
          {store.status === "loading" ? (
            <View style={s.loading} accessibilityLiveRegion="polite">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={type.caption}>{T.loadingList}</Text>
            </View>
          ) : !hasList ? (
            <EmptyState
              icon="file-lock-outline"
              title={T.emptyTitle}
              description={T.emptyDesc}
              action={<Button title={T.emptyCta} icon="file-upload-outline" variant="accent" onPress={openImport} />}
            />
          ) : result === null ? (
            <View style={s.idle} accessibilityLiveRegion="polite">
              <Image source={require("../../image/Silhouette.png")} style={s.silhouette} accessibilityIgnoresInvertColors />
              <Text style={[type.title, { textAlign: "center" }]}>{T.idleTitle}</Text>
              <Text style={[type.body, { textAlign: "center", color: colors.textMuted }]}>{T.idleDesc}</Text>
            </View>
          ) : result.vehicle ? (
            <VehicleCard vehicle={result.vehicle} onError={text => setNotice({ tone: "error", text })} />
          ) : (
            <UnknownCard query={result.query} onReset={reset} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Import sheet */}
      <BottomSheet visible={sheetOpen} onClose={() => !importing && setSheetOpen(false)} closeLabel={T.cancelBtn}>
        <Text style={[type.title, { textAlign: textAlign(isAr) }]} accessibilityRole="header">{T.modalTitle}</Text>
        <Text style={[type.body, { color: colors.textMuted, textAlign: textAlign(isAr) }]}>{T.modalDesc}</Text>

        {store.restoreFailed && store.status === "empty" ? <Banner tone="warning" text={T.autoLoadFail} /> : null}

        <Pressable
          onPress={pickFile}
          accessibilityRole="button"
          accessibilityLabel={selFile ? T.fileLabel + " " + selFile.name + ". " + T.changeFile : T.pickFile}
          style={({ pressed }) => [s.filePicker, !!selFile && s.filePickerOk, importError === "noFile" && s.filePickerErr, pressed && { opacity: 0.8 }, { flexDirection: rowDir(isAr) }]}>
          <MaterialCommunityIcons name={selFile ? "file-check-outline" : "file-upload-outline"} size={28} color={selFile ? colors.success : colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[type.subtitle, { textAlign: textAlign(isAr) }]} numberOfLines={1}>{selFile ? selFile.name : T.pickFile}</Text>
            <Text style={[type.caption, { textAlign: textAlign(isAr) }]}>{selFile ? T.changeFile : T.fileDropText}</Text>
          </View>
        </Pressable>
        {importError === "noFile" ? <Text style={[type.caption, s.err, { textAlign: textAlign(isAr) }]}>{T.errorNoFile}</Text> : null}

        <TextField
          label={T.keyLabel}
          value={password}
          onChangeText={t => { setPassword(t); if (importError) setImportError(null); }}
          placeholder={T.modalPSW}
          secureTextEntry={!showPwd}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={confirmImport}
          error={importError === "noKey" ? T.errorNoKey : undefined}
          trailing={
            <Pressable onPress={() => setShowPwd(v => !v)} hitSlop={12} accessibilityRole="button" accessibilityLabel={showPwd ? T.hidePwd : T.showPwd}>
              <MaterialCommunityIcons name={showPwd ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textMuted} />
            </Pressable>
          }
        />

        {importError && importError !== "noFile" && importError !== "noKey"
          ? <Banner tone="error" text={errorText(importError) ?? ""} /> : null}

        <View style={[s.actions, { flexDirection: rowDir(isAr) }]}>
          <Button title={T.cancelBtn} variant="ghost" onPress={() => setSheetOpen(false)} disabled={importing} style={{ flex: 1 }} />
          <Button title={T.confirmBtn} onPress={confirmImport} loading={importing} style={{ flex: 2 }} />
        </View>
      </BottomSheet>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  appBar: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl + spacing.lg },
  appBarRow: { alignItems: "center", gap: spacing.sm },
  appTitle: { fontSize: 20, lineHeight: 26, fontWeight: "800", color: colors.onPrimary },
  scroll: { padding: spacing.lg, gap: spacing.lg, marginTop: -(spacing.xxxl + spacing.sm) },
  searchCard: { padding: spacing.lg, gap: spacing.lg },
  loading: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xxxl },
  idle: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl, paddingHorizontal: spacing.xl },
  silhouette: { width: 160, height: 160, opacity: 0.55, resizeMode: "contain" },
  filePicker: { alignItems: "center", gap: spacing.md, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.primary, borderRadius: radius.md, padding: spacing.lg, backgroundColor: colors.primaryContainer, minHeight: 72 },
  filePickerOk: { borderColor: colors.success, backgroundColor: colors.successContainer },
  filePickerErr: { borderColor: colors.danger },
  err: { color: colors.danger },
  actions: { gap: spacing.md, marginTop: spacing.sm },
});

