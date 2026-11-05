import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, Linking, ActivityIndicator,
  Modal, Platform, KeyboardAvoidingView, SafeAreaView, Image
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Network from "expo-network";                          // [NOUVEAU] détection réseau
import AsyncStorage from "@react-native-async-storage/async-storage"; // [NOUVEAU] persistance
import { Vehicle, Lang } from "./src/types";
import { useT } from "./src/i18n";
import { decryptAES, parseCSV, searchVehicle, getCarColor, getTextColorForBg } from "./src/utils/vehicleUtils";
import CarSilhouette from "./src/components/CarSilhouette";

// ── [NOUVEAU] Clés AsyncStorage ──────────────────────────────
const STORAGE_KEY_PATH = "sv_file_path";   // chemin original du .enc
const STORAGE_KEY_NAME = "sv_file_name";   // nom du fichier
const STORAGE_KEY_PWD  = "sv_password";    // mot de passe
// Chemin de la copie locale (utilisée hors-ligne uniquement)
const LOCAL_ENC_PATH   = FileSystem.documentDirectory + "suivi_local.enc";

export default function App() {
  const [lang, setLang] = useState<Lang>("fr");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{found:boolean; vehicle?:Vehicle; query:string}|null>(null);
  const [showImport, setShowImport] = useState(false);
  const [selFile, setSelFile] = useState<{name:string; uri:string}|null>(null);
  const [decryptKey, setDecryptKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const T = useT(lang);
  const isAr = lang === "ar";

  const toggleLang = () => setLang(l => l === "fr" ? "ar" : "fr");

  // ── [NOUVEAU] Chargement automatique au démarrage ─────────
  useEffect(() => {
    autoLoad();
  }, []);

  // ── [NOUVEAU] Logique de chargement automatique ───────────
  const autoLoad = async () => {
    try {
      // Lire les données mémorisées
      const savedPath = await AsyncStorage.getItem(STORAGE_KEY_PATH);
      const savedPwd  = await AsyncStorage.getItem(STORAGE_KEY_PWD);

      // Aucune donnée mémorisée → premier lancement → ouvrir modal
      if (!savedPath || !savedPwd) {
        setShowImport(true);
        return;
      }

      // Vérifier l'état de la connexion
      const netState = await Network.getNetworkStateAsync();
      const isOnline = netState.isConnected && netState.isInternetReachable;

      if (isOnline) {
        // ── Connexion disponible + données mémorisées
        // → Charger depuis le chemin original
        const ok = await loadFromPath(savedPath, savedPwd);
        if (!ok) {
          // Fichier introuvable ou MDP incorrect → modal import
          setShowImport(true);
        }
      } else {
        // ── Hors-ligne
        // → Charger depuis la copie locale
        const localExists = await fileExists(LOCAL_ENC_PATH);
        if (localExists) {
          const ok = await loadFromPath(LOCAL_ENC_PATH, savedPwd);
          if (!ok) {
            // Copie locale corrompue ou MDP changé
            Alert.alert("", T.autoLoadFail);
          }
        } else {
          // Pas de copie locale disponible
          Alert.alert("", T.errorNoLocalFile);
        }
      }
    } catch {
      // En cas d'erreur inattendue → ouvrir modal
      setShowImport(true);
    }
  };

  // ── [NOUVEAU] Charger et déchiffrer un fichier .enc depuis un URI ─
  const loadFromPath = async (uri: string, pwd: string): Promise<boolean> => {
    try {
      const raw = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const csvText = decryptAES(raw, pwd);
      const parsed  = parseCSV(csvText);
      if (!parsed || parsed.length === 0) return false;
      setVehicles(parsed);
      setResult(null);
      setQuery("");
      return true;
    } catch {
      return false;
    }
  };

  // ── [NOUVEAU] Vérifier si un fichier existe ───────────────
  const fileExists = async (uri: string): Promise<boolean> => {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return info.exists;
    } catch {
      return false;
    }
  };

  // ── Sélection du fichier (inchangé) ──────────────────────
  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/plain", "*/*"],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        setSelFile({ name: res.assets[0].name, uri: res.assets[0].uri });
        setImportError("");
      }
    } catch {
      setImportError("Erreur selection fichier");
    }
  };

  // ── Import manuel — MODIFIÉ ───────────────────────────────
  const processImport = async () => {
    if (!selFile) { setImportError(T.errorNoFile); return; }
    if (!decryptKey.trim()) { setImportError(T.errorNoKey); return; }
    setLoading(true);
    setImportError("");
    try {
      const raw = await FileSystem.readAsStringAsync(selFile.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      let csvText = "";
      try {
        csvText = decryptAES(raw, decryptKey.trim());
      } catch {
        if (raw.includes(",") || raw.includes(";")) {
          csvText = raw;
        } else {
          setImportError(T.errorDecrypt);
          setLoading(false);
          return;
        }
      }
      const parsed = parseCSV(csvText);
      if (!parsed || parsed.length === 0) {
        setImportError(T.errorFormat);
        setLoading(false);
        return;
      }

      // ── [NOUVEAU] Import réussi → sauvegarder chemin + MDP ──
      await AsyncStorage.setItem(STORAGE_KEY_PATH, selFile.uri);
      await AsyncStorage.setItem(STORAGE_KEY_NAME, selFile.name);
      await AsyncStorage.setItem(STORAGE_KEY_PWD,  decryptKey.trim());

      // ── [NOUVEAU] Copier le fichier .enc en local (pour hors-ligne) ──
      try {
        await FileSystem.copyAsync({ from: selFile.uri, to: LOCAL_ENC_PATH });
      } catch {
        // La copie locale est optionnelle — ne pas bloquer si elle échoue
      }

      setVehicles(parsed);
      setShowImport(false);
      setResult(null);
      setQuery("");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("", T.successToast(parsed.length));
    } catch {
      setImportError(T.errorDecrypt);
    }
    setLoading(false);
  };

  // ── Recherche (inchangé) ──────────────────────────────────
  const doSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    if (vehicles.length === 0) { Alert.alert("", T.noList); return; }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const found = searchVehicle(vehicles, q);
    setResult({ found: !!found, vehicle: found, query: q.toUpperCase() });
    if (!found) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [query, vehicles, T]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e"/>

      {/* HEADER */}
      <View style={[styles.header, isAr && styles.rowRev]}>
        <View style={styles.headerTitles}>
          <Text style={styles.headerFr}>{T.HeaderLabel}</Text>
        </View>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLang}>
          <Text style={styles.langBtnTxt}>{T.langBtn}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.importBtn}
          onPress={() => {
            setShowImport(true);
            setSelFile(null);
            setDecryptKey("");
            setImportError("");
          }}>
          <Text style={styles.importBtnTxt}>{T.importLabel}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* STATUS */}
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, vehicles.length > 0 && styles.statusDotOn]}/>
            <Text style={styles.statusTxt}>
              {vehicles.length > 0 ? T.statusLoaded(vehicles.length) : T.statusNone}
            </Text>
          </View>

          {/* SEARCH */}
          <Text style={styles.searchLabel}>{T.searchLabel}</Text>
          <View style={[styles.searchRow, isAr && styles.rowRev]}>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={isAr ? "\u0645\u062b\u0627\u0644: 12345-678-09 \u0623\u0648 1234" : "Exemple: 12345-678-09 ou 1234"}
              placeholderTextColor="#aaa"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={doSearch}
              textAlign={isAr ? "right" : "left"}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={doSearch}>
              <Text style={styles.searchBtnTxt}>🔍</Text>
            </TouchableOpacity>
          </View>

          {/* RESULTS */}
          {result === null ? (
            <View style={styles.container}>
              <Image
                source={require('./image/Silhouette.png')}
                style={styles.silhouetteImage}
                accessibilityLabel="Silhouette Voiture"
              />
            </View>
          ) : result.found && result.vehicle ? (
            <VehicleCard vehicle={result.vehicle} T={T} isAr={isAr}/>
          ) : (
            <UnknownCard query={result.query} T={T} isAr={isAr}/>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* IMPORT MODAL (inchangé dans sa présentation) */}
      <Modal
        visible={showImport}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImport(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={[styles.modalTitle, isAr && styles.textRt]}>{T.modalTitle}</Text>
            <Text style={[styles.modalDesc,  isAr && styles.textRt]}>{T.modalDesc}</Text>

            <TouchableOpacity
              style={[styles.filePicker, selFile && styles.filePickerOk]}
              onPress={pickFile}>
              <Text style={styles.filePickerTxt}>
                {selFile ? "📄 " + selFile.name : T.fileDropText}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.keyLabel, isAr && styles.textRt]}>{T.keyLabel}</Text>
            <TextInput
              style={styles.keyInput}
              value={decryptKey}
              onChangeText={setDecryptKey}
              placeholder={T.modalPSW}
              placeholderTextColor="#aaa"
              secureTextEntry
              autoCapitalize="none"
            />

            {importError ? <Text style={styles.errorTxt}>{importError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowImport(false)}>
                <Text style={styles.cancelTxt}>{T.cancelBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, loading && {opacity:0.6}]}
                onPress={processImport}
                disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff"/>
                  : <Text style={styles.confirmTxt}>{T.confirmBtn}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function VehicleCard({ vehicle, T, isAr }: { vehicle: Vehicle; T: any; isAr: boolean }) {
  const colorHex = getCarColor(vehicle.couleur);
  const textC    = getTextColorForBg(colorHex);
  return (
    <View style={styles.vehicleCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardHeaderTxt}>✓  {T.vehicleFound}</Text>
      </View>
      <View style={styles.carArea}>
        <CarSilhouette couleur={vehicle.couleur} macaron={vehicle.macaron} matricule={vehicle.matricule}/>
      </View>
      <View style={[styles.infoGrid, isAr && styles.rowRev]}>
        <InfoItem label={T.macaron}   value={vehicle.macaron}   mono/>
        <InfoItem label={T.matricule} value={vehicle.matricule} mono/>
        <InfoItem label={T.marque}    value={vehicle.marque}/>
        <InfoItem label={T.modele}    value={vehicle.modele}/>
        <InfoItem label={T.bloc}      value={"🏢 Bloc " + vehicle.bloc}/>
        <Text style={styles.infoLabel}>{T.couleur}</Text>
        <View style={[styles.colorBadge, { backgroundColor: colorHex }]}>
          <Text style={[styles.colorBadgeTxt, { color: textC }]}>{vehicle.couleur}</Text>
        </View>
      </View>
      <View style={styles.divider}/>
      <View style={[styles.contactBlock, isAr && styles.rowRev]}>
        <View style={styles.contactAvatar}>
          <Text style={{color:"#fff", fontSize:18}}>👤</Text>
        </View>
        <View style={{flex:1}}>
          <Text style={[styles.contactName, isAr && styles.textRt]}>
            {T.representant} {vehicle.bloc}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => Linking.openURL("tel:" + vehicle.telephone)}>
          <Text style={styles.callBtnTxt}>📞 {T.appeler}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoItem({ label, value, mono, full }: {
  label: string; value: string; mono?: boolean; full?: boolean;
}) {
  return (
    <View style={[styles.infoItem, full && styles.infoItemFull]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.infoValueMono]}>{value}</Text>
    </View>
  );
}

function UnknownCard({ query, T, isAr }: { query: string; T: any; isAr: boolean }) {
  return (
    <View style={styles.unknownCard}>
      <Text style={styles.unknownIcon}>❌</Text>
      <Text style={[styles.unknownTitle, isAr && styles.textRt]}>{T.unknownTitle}</Text>
      <Text style={[styles.unknownSub,   isAr && styles.textRt]}>{T.unknownSub}</Text>
      <Text style={styles.unknownQuery}>« {query} »</Text>
    </View>
  );
}

const NAVY="#1a237e", GOLD="#ffd600", SUCCESS="#1b5e20", DANGER="#b71c1c";
const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:NAVY },
  header: { flexDirection:"row", alignItems:"center", gap:8, paddingHorizontal:14, paddingVertical:10, backgroundColor:"rgba(255,255,255,0.08)", borderBottomWidth:0.5, borderBottomColor:"rgba(255,255,255,0.15)" },
  headerTitles: { flex:1 },
  headerFr: { fontSize:13, fontWeight:"700", color:"#fff" },
  langBtn: { backgroundColor:"rgba(255,255,255,0.15)", borderRadius:16, paddingHorizontal:10, paddingVertical:5, borderWidth:1, borderColor:"rgba(255,255,255,0.3)" },
  langBtnTxt: { fontSize:12, fontWeight:"600", color:"#fff" },
  importBtn: { backgroundColor:GOLD, borderRadius:8, paddingHorizontal:10, paddingVertical:7 },
  importBtnTxt: { fontSize:12, fontWeight:"700", color:NAVY },
  scroll: { padding:16, gap:16, paddingBottom:40 },
  statusBadge: { flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"rgba(255,255,255,0.12)", borderRadius:20, paddingHorizontal:14, paddingVertical:8, alignSelf:"center", borderWidth:1, borderColor:"rgba(255,255,255,0.2)" },
  statusDot: { width:8, height:8, borderRadius:4, backgroundColor:"#ff5252" },
  statusDotOn: { backgroundColor:"#69f0ae" },
  statusTxt: { fontSize:12, color:"#fff" },
  searchLabel: { fontSize:13, fontWeight:"600", color:"rgba(255,255,255,0.9)", textAlign:"center" },
  searchRow: { flexDirection:"row", gap:8, alignItems:"center" },
  searchInput: { flex:1, backgroundColor:"rgba(255,255,255,0.95)", borderRadius:12, paddingHorizontal:14, paddingVertical:13, fontSize:16, fontWeight:"500", color:"#1a1a2e", borderWidth:2, borderColor:"transparent" },
  searchBtn: { width:50, height:50, borderRadius:12, backgroundColor:GOLD, alignItems:"center", justifyContent:"center" },
  searchBtnTxt: { fontSize:20 },
  emptyState: { alignItems:"center", paddingVertical:32 },
  emptyIcon: { fontSize:64, opacity:0.4 },
  vehicleCard: { backgroundColor:"#fff", borderRadius:14, overflow:"hidden", borderWidth:2, borderColor:"#c8e6c9" },
  cardHeader: { backgroundColor:SUCCESS, padding:12 },
  cardHeaderTxt: { fontSize:13, fontWeight:"700", color:"#fff" },
  carArea: { backgroundColor:"#f5f5f5", padding:16, alignItems:"center", gap:8 },
  colorBadge: { borderRadius:8, paddingHorizontal:10, paddingVertical:0, borderWidth:1, height:22, borderColor:"rgba(0,0,0,0.12)" },
  colorBadgeTxt: { fontSize:12, fontWeight:"700" },
  infoGrid: { padding:14, flexDirection:"row", flexWrap:"wrap", gap:10 },
  infoItem: { width:"47%" },
  infoItemFull: { width:"100%" },
  infoLabel: { fontSize:10, fontWeight:"700", color:"#90a4ae", textTransform:"uppercase", letterSpacing:0.5 },
  infoValue: { fontSize:14, fontWeight:"600", color:"#1a1a2e", marginTop:2 },
  infoValueMono: { fontFamily:Platform.OS==="ios"?"Menlo":"monospace", letterSpacing:1 },
  divider: { height:1, backgroundColor:"#e0e0e0" },
  contactBlock: { padding:12, backgroundColor:"#e8f5e9", flexDirection:"row", alignItems:"center", gap:12 },
  contactAvatar: { width:40, height:40, borderRadius:20, backgroundColor:SUCCESS, alignItems:"center", justifyContent:"center" },
  contactName: { fontSize:12, fontWeight:"700", color:SUCCESS },
  contactPhone: { fontSize:13, color:"#546e7a" },
  callBtn: { backgroundColor:SUCCESS, borderRadius:8, paddingHorizontal:12, paddingVertical:8 },
  callBtnTxt: { color:"#fff", fontSize:12, fontWeight:"700" },
  unknownCard: { backgroundColor:"#fff", borderRadius:14, borderWidth:2, borderColor:"#ffcdd2", padding:32, alignItems:"center", gap:12 },
  unknownIcon: { fontSize:48 },
  unknownTitle: { fontSize:22, fontWeight:"900", color:DANGER },
  unknownSub: { fontSize:13, color:"#90a4ae", textAlign:"center" },
  unknownQuery: { fontSize:14, fontFamily:Platform.OS==="ios"?"Menlo":"monospace", color:"#546e7a", backgroundColor:"#f5f5f5", borderRadius:8, paddingHorizontal:16, paddingVertical:8 },
  modalOverlay: { flex:1, backgroundColor:"rgba(0,0,0,0.65)", justifyContent:"center", alignItems:"center", padding:20 },
  modal: { backgroundColor:"#fff", borderRadius:14, padding:20, width:"100%", gap:12 },
  modalTitle: { fontSize:17, fontWeight:"700", color:NAVY },
  modalDesc: { fontSize:13, color:"#546e7a" },
  filePicker: { borderWidth:2, borderStyle:"dashed", borderColor:"#c5cae9", borderRadius:10, padding:16, alignItems:"center" },
  filePickerOk: { borderColor:"#43a047", backgroundColor:"#f1f8e9" },
  filePickerTxt: { fontSize:13, color:"#546e7a", textAlign:"center" },
  keyLabel: { fontSize:12, fontWeight:"700", color:"#546e7a" },
  keyInput: { borderWidth:1.5, borderColor:"#ddd", borderRadius:10, padding:12, fontSize:15, color:"#1a1a2e" },
  errorTxt: { fontSize:12, color:DANGER, backgroundColor:"#ffebee", borderRadius:8, padding:10 },
  modalActions: { flexDirection:"row", gap:10 },
  cancelBtn: { flex:1, backgroundColor:"#f5f5f5", borderRadius:10, padding:13, alignItems:"center" },
  cancelTxt: { fontSize:14, fontWeight:"600", color:"#546e7a" },
  confirmBtn: { flex:2, backgroundColor:NAVY, borderRadius:10, padding:13, alignItems:"center" },
  confirmTxt: { fontSize:14, fontWeight:"700", color:"#fff" },
  rowRev: { flexDirection:"row-reverse" },
  textRt: { textAlign:"right" },
  container: { flex:1, justifyContent:"center", alignItems:"center" },
  silhouetteImage: { width:200, height:200, opacity:0.6, resizeMode:"contain" },
});
