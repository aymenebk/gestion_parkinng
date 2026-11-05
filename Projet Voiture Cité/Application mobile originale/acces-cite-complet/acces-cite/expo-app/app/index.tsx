import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Alert, Linking, ActivityIndicator,
  Animated, Platform, KeyboardAvoidingView, I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { Vehicle, Lang } from '../src/types';
import { useT } from '../src/i18n';
import { decryptAES, parseCSV, searchVehicle, getCarColorHex } from '../src/utils/vehicleUtils';
import CarSilhouette from '../src/components/CarSilhouette';

export default function HomeScreen() {
  // ─── State ───────────────────────────────────────────
  const [lang, setLang] = useState<Lang>('fr');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<{ found: boolean; vehicle?: Vehicle; query: string } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string } | null>(null);
  const [decryptKey, setDecryptKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [isListening, setIsListening] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const T = useT(lang);

  // ─── Language toggle ──────────────────────────────────
  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'fr' ? 'ar' : 'fr');
  }, []);

  // ─── File picker ──────────────────────────────────────
  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        setSelectedFile({ name: asset.name, uri: asset.uri });
        setImportError('');
      }
    } catch (e) {
      setImportError('Erreur lors de la sélection du fichier');
    }
  };

  // ─── Import & decrypt ────────────────────────────────
  const processImport = async () => {
    if (!selectedFile) { setImportError(T.errorNoFile); return; }
    if (!decryptKey.trim()) { setImportError(T.errorNoKey); return; }

    setIsLoading(true);
    setImportError('');

    try {
      const content = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      let csvText = '';

      // Essayer le déchiffrement AES
      try {
        csvText = decryptAES(content, decryptKey.trim());
      } catch {
        // Si échec, essayer comme CSV brut (pour les tests)
        if (content.includes(',') || content.includes(';')) {
          csvText = content;
        } else {
          throw new Error(T.errorDecrypt);
        }
      }

      const parsed = parseCSV(csvText);
      setVehicles(parsed);
      setShowImport(false);
      setResult(null);
      setSearchQuery('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✓', T.successLoaded(parsed.length));
    } catch (e) {
      setImportError((e as Error).message || T.errorDecrypt);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Search ──────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;

    if (vehicles.length === 0) {
      Alert.alert('', T.noListLoaded);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const found = searchVehicle(vehicles, query);

    // Animate result
    fadeAnim.setValue(0);
    setResult({ found: !!found, vehicle: found, query });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (!found) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [searchQuery, vehicles, T]);

  const isRTL = lang === 'ar';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />

      {/* ── HEADER ── */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>{T.appName}</Text>
          <Text style={styles.headerSubtitle}>{T.appNameAr}</Text>
        </View>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLang}>
          <Text style={styles.langBtnText}>{T.langToggle}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.importBtn} onPress={() => setShowImport(true)}>
          <Ionicons name="cloud-upload-outline" size={16} color="#1a237e" />
          <Text style={styles.importBtnText}>{T.importBtn}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Status badge */}
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, vehicles.length > 0 && styles.statusDotActive]} />
            <Text style={styles.statusText} numberOfLines={1}>
              {vehicles.length > 0 ? T.statusLoaded(vehicles.length) : T.statusNone}
            </Text>
          </View>

          {/* Search section */}
          <View style={styles.searchSection}>
            <Text style={styles.searchLabel}>{T.searchLabel}</Text>
            <Text style={[styles.searchLabelAr, isRTL && { display: 'none' }]}>
              {T.searchLabelAr}
            </Text>

            <View style={[styles.searchBox, isRTL && styles.searchBoxRTL]}>
              <TextInput
                style={[styles.searchInput, isRTL && styles.searchInputRTL]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={T.searchPlaceholder}
                placeholderTextColor="#aaa"
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
                textAlign={isRTL ? 'right' : 'left'}
              />
              <TouchableOpacity
                style={[styles.iconBtn, isListening && styles.iconBtnActive]}
                onPress={() => Alert.alert('', T.noVoiceSupport)}
              >
                <Ionicons
                  name={isListening ? 'mic' : 'mic-outline'}
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                <Ionicons name="search" size={22} color="#1a237e" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Results */}
          {result === null ? (
            <EmptyState T={T} />
          ) : (
            <Animated.View style={[styles.resultWrapper, { opacity: fadeAnim }]}>
              {result.found && result.vehicle ? (
                <VehicleFoundCard vehicle={result.vehicle} T={T} isRTL={isRTL} />
              ) : (
                <UnknownVehicleCard query={result.query} T={T} isRTL={isRTL} />
              )}
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── IMPORT MODAL ── */}
      {showImport && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={[styles.modalTitle, isRTL && styles.rtlText]}>{T.importTitle}</Text>
            <Text style={[styles.modalDesc, isRTL && styles.rtlText]}>{T.importDesc}</Text>

            <TouchableOpacity style={styles.filePickerBtn} onPress={pickFile}>
              <Ionicons name="document-outline" size={20} color="#1a237e" />
              <Text style={styles.filePickerText} numberOfLines={1}>
                {selectedFile ? `📄 ${selectedFile.name}` : T.selectFile}
              </Text>
            </TouchableOpacity>

            <View style={styles.keyInputWrapper}>
              <Text style={[styles.keyLabel, isRTL && styles.rtlText]}>{T.keyLabel}</Text>
              <TextInput
                style={[styles.keyInput, isRTL && styles.rtlText]}
                value={decryptKey}
                onChangeText={setDecryptKey}
                placeholder={T.keyPlaceholder}
                placeholderTextColor="#aaa"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {importError ? (
              <Text style={styles.errorText}>{importError}</Text>
            ) : null}

            <View style={styles.csvHint}>
              <Text style={styles.csvHintText}>{T.csvFormat}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowImport(false); setImportError(''); }}
              >
                <Text style={styles.cancelBtnText}>{T.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, isLoading && styles.confirmBtnDisabled]}
                onPress={processImport}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>{T.decryptLoad}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function EmptyState({ T }: { T: any }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="car-outline" size={64} color="rgba(255,255,255,0.4)" />
      <Text style={styles.emptyTitle}>{T.emptyTitle}</Text>
      <Text style={styles.emptySubtitle}>{T.emptySubtitle}</Text>
    </View>
  );
}

function VehicleFoundCard({ vehicle, T, isRTL }: { vehicle: Vehicle; T: any; isRTL: boolean }) {
  const colorHex = getCarColorHex(vehicle.couleur);

  return (
    <View style={styles.vehicleCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
        <Text style={styles.cardHeaderText}>{T.vehicleFound}</Text>
        <View style={styles.authorizedBadge}>
          <Text style={styles.authorizedBadgeText}>✓ Autorisé</Text>
        </View>
      </View>

      {/* Car SVG */}
      <View style={styles.carArea}>
        <CarSilhouette
          couleur={vehicle.couleur}
          macaron={vehicle.macaron}
          matricule={vehicle.matricule}
        />
        <View style={styles.colorRow}>
          <View style={[styles.colorSwatch, { backgroundColor: colorHex }]} />
          <Text style={styles.colorLabel}>{vehicle.couleur}</Text>
        </View>
      </View>

      {/* Info grid */}
      <View style={[styles.infoGrid, isRTL && styles.infoGridRTL]}>
        <InfoItem label={T.fieldMacaron} value={vehicle.macaron} mono />
        <InfoItem label={T.fieldMatricule} value={vehicle.matricule} mono />
        <InfoItem label={T.fieldMarque} value={vehicle.marque} />
        <InfoItem label={T.fieldModele} value={vehicle.modele} />
        <InfoItem label={T.fieldBloc} value={`🏢 Bloc ${vehicle.bloc}`} fullWidth />
      </View>

      <View style={styles.divider} />

      {/* Contact */}
      <View style={[styles.contactBlock, isRTL && styles.contactBlockRTL]}>
        <View style={styles.contactAvatar}>
          <Ionicons name="person" size={20} color="#fff" />
        </View>
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, isRTL && styles.rtlText]}>
            {T.fieldRepresentant} — Bloc {vehicle.bloc}
          </Text>
          <Text style={[styles.contactPhone, isRTL && styles.rtlText]}>
            {vehicle.telephone}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => Linking.openURL(`tel:${vehicle.telephone}`)}
        >
          <Ionicons name="call" size={14} color="#fff" />
          <Text style={styles.callBtnText}>{T.callBtn}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoItem({ label, value, mono, fullWidth }: {
  label: string; value: string; mono?: boolean; fullWidth?: boolean
}) {
  return (
    <View style={[styles.infoItem, fullWidth && styles.infoItemFull]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.infoValueMono]}>{value}</Text>
    </View>
  );
}

function UnknownVehicleCard({ query, T, isRTL }: { query: string; T: any; isRTL: boolean }) {
  return (
    <View style={styles.unknownCard}>
      <View style={styles.unknownIcon}>
        <Ionicons name="close-circle" size={40} color="#C62828" />
      </View>
      <Text style={[styles.unknownTitle, isRTL && styles.rtlText]}>{T.vehicleUnknown}</Text>
      <Text style={[styles.unknownSub, isRTL && styles.rtlText]}>{T.vehicleUnknownSub}</Text>
      <View style={styles.unknownQuery}>
        <Text style={styles.unknownQueryText}>« {query} »</Text>
      </View>
    </View>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────────
const NAVY = '#1a237e';
const GOLD = '#ffd600';
const SUCCESS = '#1b5e20';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NAVY },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  headerRTL: { flexDirection: 'row-reverse' },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  langBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  langBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  importBtn: {
    backgroundColor: GOLD, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  importBtnText: { fontSize: 12, fontWeight: '700', color: NAVY },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff5252' },
  statusDotActive: { backgroundColor: '#69f0ae' },
  statusText: { fontSize: 12, color: '#fff', flexShrink: 1 },

  searchSection: { gap: 8 },
  searchLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  searchLabelAr: { fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  searchBox: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  searchBoxRTL: { flexDirection: 'row-reverse' },
  searchInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 16, fontWeight: '500', color: '#1a1a2e',
    borderWidth: 2, borderColor: 'transparent',
  },
  searchInputRTL: { textAlign: 'right' },
  iconBtn: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  iconBtnActive: { backgroundColor: '#e53935', borderColor: '#e53935' },
  searchBtn: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
  },

  resultWrapper: { width: '100%' },

  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  emptySubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },

  // Vehicle found card
  vehicleCard: {
    backgroundColor: '#fff', borderRadius: 14,
    overflow: 'hidden', borderWidth: 2, borderColor: '#c8e6c9',
  },
  cardHeader: {
    backgroundColor: SUCCESS, flexDirection: 'row',
    alignItems: 'center', padding: 12, gap: 8,
  },
  cardHeaderText: { fontSize: 13, fontWeight: '700', color: '#fff', flex: 1 },
  authorizedBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  authorizedBadgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },

  carArea: { backgroundColor: '#f5f5f5', padding: 16, alignItems: 'center', gap: 10 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorSwatch: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.15)' },
  colorLabel: { fontSize: 13, color: '#546e7a', fontWeight: '500' },

  infoGrid: {
    padding: 14, flexDirection: 'row',
    flexWrap: 'wrap', gap: 10,
  },
  infoGridRTL: { flexDirection: 'row-reverse' },
  infoItem: { width: '47%' },
  infoItemFull: { width: '100%' },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#90a4ae', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', marginTop: 2 },
  infoValueMono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 1 },

  divider: { height: 1, backgroundColor: '#e0e0e0', marginHorizontal: 0 },

  contactBlock: {
    padding: 12, backgroundColor: '#e8f5e9',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  contactBlockRTL: { flexDirection: 'row-reverse' },
  contactAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: SUCCESS,
    alignItems: 'center', justifyContent: 'center',
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 12, fontWeight: '700', color: SUCCESS },
  contactPhone: { fontSize: 13, color: '#546e7a' },
  callBtn: {
    backgroundColor: SUCCESS, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  callBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Unknown
  unknownCard: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 2, borderColor: '#ffcdd2',
    padding: 32, alignItems: 'center', gap: 12,
  },
  unknownIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#ffebee',
    alignItems: 'center', justifyContent: 'center',
  },
  unknownTitle: { fontSize: 24, fontWeight: '900', color: '#c62828', letterSpacing: 0.5 },
  unknownSub: { fontSize: 13, color: '#90a4ae', textAlign: 'center' },
  unknownQuery: {
    backgroundColor: '#f5f5f5', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  unknownQueryText: { fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#546e7a', letterSpacing: 1 },

  // Modal
  modalOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 20, width: '100%', maxWidth: 400, gap: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: NAVY },
  modalDesc: { fontSize: 13, color: '#546e7a', lineHeight: 20 },
  filePickerBtn: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#c5cae9',
    borderRadius: 10, padding: 16, alignItems: 'center',
    flexDirection: 'row', gap: 10,
  },
  filePickerText: { fontSize: 13, color: '#546e7a', flex: 1 },
  keyInputWrapper: { gap: 6 },
  keyLabel: { fontSize: 12, fontWeight: '700', color: '#546e7a' },
  keyInput: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    padding: 12, fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#1a1a2e',
  },
  errorText: {
    fontSize: 12, color: '#c62828',
    backgroundColor: '#ffebee', borderRadius: 8,
    padding: 10,
  },
  csvHint: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10 },
  csvHintText: { fontSize: 11, color: '#90a4ae', lineHeight: 17 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, backgroundColor: '#f5f5f5', borderRadius: 10,
    padding: 13, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#546e7a' },
  confirmBtn: {
    flex: 2, backgroundColor: NAVY, borderRadius: 10,
    padding: 13, alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
});
