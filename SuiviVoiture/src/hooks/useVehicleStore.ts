import { useCallback, useEffect, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Vehicle } from "../types";
import { decryptAES, parseCSVWithStats } from "../utils/vehicleUtils";

// Storage keys (unchanged from the previous version so existing installs keep working).
const KEY_PATH = "sv_file_path";
const KEY_NAME = "sv_file_name";
const KEY_PWD = "sv_password";
/** Private copy of the last imported file; always available, independent of the network. */
const LOCAL_ENC_PATH = (FileSystem.documentDirectory ?? "") + "suivi_local.enc";

export type LoadStatus = "loading" | "ready" | "empty";
export type ImportErrorCode = "noFile" | "noKey" | "decrypt" | "format";
export type ImportResult =
  | { ok: true; count: number; skipped: number }
  | { ok: false; error: ImportErrorCode };

/** Password lives in the Android Keystore (SecureStore). Migrates the legacy plaintext AsyncStorage value once. */
async function readPassword(): Promise<string | null> {
  const secure = await SecureStore.getItemAsync(KEY_PWD);
  if (secure) return secure;
  const legacy = await AsyncStorage.getItem(KEY_PWD);
  if (legacy) {
    await SecureStore.setItemAsync(KEY_PWD, legacy);
    await AsyncStorage.removeItem(KEY_PWD);
    return legacy;
  }
  return null;
}

async function tryLoad(uri: string, pwd: string): Promise<Vehicle[] | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
    const { vehicles } = parseCSVWithStats(decryptAES(raw, pwd));
    return vehicles.length > 0 ? vehicles : null;
  } catch {
    return null;
  }
}

export function useVehicleStore() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [fileName, setFileName] = useState<string | null>(null);
  /** Set when startup could not restore the saved list (so the UI can explain why the import sheet opened). */
  const [restoreFailed, setRestoreFailed] = useState(false);
  /** Set when the list came from the private copy instead of the originally picked file. */
  const [restoredFromCopy, setRestoredFromCopy] = useState(false);

  // Startup: saved path first (as before), then the private copy. No network dependency.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pwd, path, name] = await Promise.all([
          readPassword(), AsyncStorage.getItem(KEY_PATH), AsyncStorage.getItem(KEY_NAME),
        ]);
        if (!pwd) { if (!cancelled) setStatus("empty"); return; }
        let list = path ? await tryLoad(path, pwd) : null;
        let fromCopy = false;
        if (!list) { list = await tryLoad(LOCAL_ENC_PATH, pwd); fromCopy = !!list; }
        if (cancelled) return;
        if (list) {
          setVehicles(list);
          setFileName(name);
          setRestoredFromCopy(fromCopy);
          setStatus("ready");
        } else {
          setRestoreFailed(true);
          setStatus("empty");
        }
      } catch {
        if (!cancelled) { setRestoreFailed(true); setStatus("empty"); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /** Decrypts, parses and — only when everything succeeded — persists the file + password. */
  const importFile = useCallback(async (
    file: { name: string; uri: string } | null, password: string,
  ): Promise<ImportResult> => {
    if (!file) return { ok: false, error: "noFile" };
    const pwd = password.trim();
    if (!pwd) return { ok: false, error: "noKey" };
    let raw: string;
    try {
      raw = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });
    } catch {
      return { ok: false, error: "decrypt" };
    }
    let csv: string;
    try {
      csv = decryptAES(raw, pwd);
    } catch {
      // Existing behaviour: a plain (unencrypted) CSV is still accepted.
      if (raw.includes(",") || raw.includes(";")) csv = raw;
      else return { ok: false, error: "decrypt" };
    }
    const { vehicles: parsed, skipped } = parseCSVWithStats(csv);
    if (parsed.length === 0) return { ok: false, error: "format" };

    await AsyncStorage.setItem(KEY_PATH, file.uri);
    await AsyncStorage.setItem(KEY_NAME, file.name);
    await SecureStore.setItemAsync(KEY_PWD, pwd);
    try {
      await FileSystem.deleteAsync(LOCAL_ENC_PATH, { idempotent: true });
      await FileSystem.copyAsync({ from: file.uri, to: LOCAL_ENC_PATH });
    } catch {
      // The private copy is a best-effort fallback; the import itself succeeded.
    }
    setVehicles(parsed);
    setFileName(file.name);
    setRestoreFailed(false);
    setRestoredFromCopy(false);
    setStatus("ready");
    return { ok: true, count: parsed.length, skipped };
  }, []);

  return { vehicles, status, fileName, restoreFailed, restoredFromCopy, importFile };
}
