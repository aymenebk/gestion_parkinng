# Codebase Audit — Gestion Parking / "Suivi Voitures"

Date: 2026-11-05 · Scope: whole repository `D:\MyDesktop\gestion_parkinng` · Phase 1 (read-only; only this file was created, plus `node_modules/` in `SuiviVoiture/` for verification).

---

## 1. Executive Summary

* **The project is not a parking-management system with a backend.** It is a small, **offline-first, read-only Expo / React Native app** ("Suivi Voitures", package `com.cite.suivivoitures`) used by a gate guard of a residential *cité* to **check whether a vehicle is authorised**. The guard imports an AES-encrypted CSV list of vehicles (`.enc`), types a plate (*matricule*) or sticker number (*macaron*), and the app shows the vehicle, its colour silhouette, the block/apartment and a "call the block representative" button. There is **no database, no API, no login, no create/update/delete**. The mission brief assumes CRUD/backend; none of it exists and none will be invented (see §15).
* **The active codebase is `SuiviVoiture/` (root)**: `App.tsx` (294 lines, single component file) + `src/{types,i18n}.ts`, `src/utils/vehicleUtils.ts`, `src/components/CarSilhouette.tsx`. Everything else in the repo (≈ 12 other copies of the same app, an obsolete SDK-51 project, a PWA prototype, ~10 `.txt` scratch notes/logs, a stray ESRI shapefile) is history/noise.
* **Critical finding: the app very likely cannot run as built.** `package.json` pins Expo SDK **54** core but SDK **51-era** native modules (`expo-file-system ~17`, `expo-document-picker ~12`, `expo-haptics ~13`, `expo-network ~7`, `async-storage 1.x`, `react-native-screens 4.6`, `safe-area-context 5.1`). `npx expo install --check` reports **9 packages out of date**. Earlier cloud builds failed with native C++ errors (`Errors*.txt`) — consistent with this mismatch.
* **Other high-severity issues:** the stored decryption password is kept in plaintext in AsyncStorage (docs claim it is encrypted); the "original file path" that is memorised is actually a volatile cache URI, so the documented "connected mode" cannot work after the OS clears the cache; the repo contains credentials-bearing note files (`Compte Expo.txt`, `Compte Netlefy.txt`) and a personal EAS project ID; there are **zero tests** and no lint config; 28 npm audit findings (1 critical).
* **What is good:** compact, readable logic; business rules are clear and consistent with the PWA reference (exact match on macaron/matricule, whitespace-insensitive, bilingual FR/AR); i18n is centralised; the TypeScript of the active app compiles (`tsc` errors exist only in stray `original/` and `NewApplication/` folders).

## 2. Project Overview

| Item | Value |
|---|---|
| Purpose | Fast on-site verification that a vehicle is registered in the residence ("contrôle des véhicules") |
| Users | Guards / security staff (single role, no auth) |
| Languages | French (default) and Arabic (RTL) – toggle in header |
| Data source | Encrypted CSV file (`.enc`) chosen by user via Android file picker; password typed by user |
| Origin | PWA prototype (`Projet Voiture Cité/.../pwa/index.html`) ported to Expo (per `Creation Application mobile depuis PWA.txt`) |
| Distribution so far | EAS cloud build (`eas build -p android --profile preview`, APK) from a personal Expo account |

## 3. Technology Stack

* Expo SDK 54 (`expo ~54.0.34`), React 19.1.0, React Native 0.81.5, TypeScript ~5.9 (`strict: true`, extends `expo/tsconfig.base`).
* No navigation library (single screen + `Modal`). No state library (7 `useState` hooks in `App`).
* `crypto-js` (AES decryption, OpenSSL "Salted__" format), `expo-document-picker`, `expo-file-system`, `expo-haptics`, `expo-network`, `@react-native-async-storage/async-storage`, `react-native-svg` (car silhouette), `react-native-screens`/`safe-area-context` (declared but unused).
* Build: EAS Build (cloud). `eas.json`: `preview` → APK, `production` → app-bundle. `.npmrc`: `legacy-peer-deps=true`.
* **No** test runner, linter, formatter, CI, or env/config files. No `android/` or `ios/` native folder (managed workflow / prebuild on demand).

## 4. Architecture Explanation

Single-screen, single-file container architecture:

```
index.ts ─ registerRootComponent(App)
App.tsx  ─ all state, all side effects (file I/O, storage, network, haptics), all handlers, header, search, modal, and 4 inline sub-components + 100+ style rules
src/
  types.ts                 Vehicle, Lang
  i18n.ts                  FR/AR string tables + useT(lang)
  utils/vehicleUtils.ts    decryptAES, parseCSV, searchVehicle, colour helpers
  components/CarSilhouette.tsx   SVG car tinted with the vehicle colour + plates
```

Data flow: `DocumentPicker → FileSystem.readAsStringAsync → CryptoJS.AES.decrypt → parseCSV → useState(vehicles)` (in memory only). Persistence: AsyncStorage keys `sv_file_path`, `sv_file_name`, `sv_password`; local backup copy `documentDirectory/suivi_local.enc`. Search is an in-memory linear scan.

## 5. Directory Structure

| Path | Status |
|---|---|
| `SuiviVoiture/` | **Active app** (Expo SDK 54) |
| `SuiviVoiture/original/`, `SuiviVoiture/NewApplication/` | Stale copies *inside* the app dir; break `tsc` (see B-7) |
| `NewApplication/` | Blank Expo SDK 54 template (20-line `App.tsx`) – not the app |
| `acces-cite/`, `Fichiers crees par IA/acces-cite/` | Obsolete Expo SDK 51 + expo-router attempt |
| `Copies/SuiviVoiture`, `Copies/SuiviVoiture (Old)`, `Code Source/`, `Code Source/SuiviVoiture_modifie/` | Older/newer snapshots of the same code (`new_App.tsx` is a 454-line variant) |
| `Projet Voiture Cité/` | Original PWA (`pwa/index.html`, 42 KB), `encrypt_csv.py` (encrypts CSV), sample CSV, GUIDE.md |
| `*.txt` at root (`Build.txt`, `Errors*.txt`, `Creation Application*.txt`, `etapes.txt`, …) | Personal notes / build logs |
| `Compte Expo.txt`, `Compte Netlefy.txt` | **Account info – should not be in a repo** (not opened during this audit) |
| `New_Shapefile.*` | Unrelated GIS file |

## 6. Existing Features (verified in `SuiviVoiture/App.tsx`)

1. **Import list** (modal): pick file, enter password, decrypt, parse, load. Plain (unencrypted) CSV is accepted as fallback if decryption throws and the text contains `,` or `;`.
2. **Auto-load at startup**: if a path + password were saved → online: reload from saved path; offline: reload from local copy; first launch: opens import modal.
3. **Search** by macaron or matricule (exact, case- and whitespace-insensitive) with haptic feedback.
4. **Result card (found)**: macaron, matricule, marque, modèle, "Appartement"/bloc, colour badge, SVG car silhouette in the vehicle's colour with both identifiers, "Représentant du Bloc X" and a **call** button (`tel:`).
5. **Result card (unknown)**: red "Véhicule INCONNU" card.
6. **Status pill**: number of vehicles loaded.
7. **FR / AR toggle** (partial RTL).
8. Declared but **not implemented**: voice search (`voiceHint`, `noVoice` strings exist; PWA had it); `errorNoConnection`, `autoLoadSuccess` strings are unused.

CSV contract (positional, 7 columns): `macaron, matricule, modele, marque, couleur, bloc, telephone`; header optional; `;` or `,` separator.

## 7. Database and Data Model

No database. One entity, `Vehicle` (`src/types.ts`) held in memory from the CSV. Persisted: 3 AsyncStorage keys and one file copy (see §4). The "relationship" between vehicle and block representative is implicit: the phone number is per vehicle row; no representative name exists in the data (the UI prints "Représentant du Bloc A").

## 8. Main User Workflows

* **First launch** → import modal auto-opens → pick `.enc` → password → "Charger la liste" → success alert → search.
* **Next launches (online)** → silent reload from the stored URI; on failure the import modal opens.
* **Next launches (offline)** → silent reload of `suivi_local.enc`; failures show an Alert.
* **Look-up** → type identifier → 🔍 / keyboard "search" → found/unknown card → optionally call.
* **Change language** / **re-import** from the header at any time.

## 9. Technical Quality Assessment

| Area | Assessment |
|---|---|
| Organisation | Utils/i18n/types separated, but `App.tsx` mixes persistence, I/O, UI and 100 inline styles (God component). |
| Reusability | Inline sub-components (`VehicleCard`, `InfoItem`, `UnknownCard`) exist but share no design tokens; colours are hard-coded hex everywhere. |
| State | Local `useState`; derived state (`result`) not reset on language change; no `useReducer`/hook for the load pipeline. |
| Error handling | Mostly `catch {}` that swallows the cause; hard-coded French strings (`"Erreur selection fichier"`, `"Bloc "`) bypass i18n. |
| Accessibility | No `accessibilityRole/Label` on buttons; touch targets < 44 dp (language/import buttons ≈ 28 dp tall); emoji used as icons; colour-only status (dot); 10–13 sp text. |
| Responsiveness | Fixed 300×220 SVG; `width:"47%"` grid; no tablet layout; `KeyboardAvoidingView` disabled on Android (`behavior` undefined). |
| Testing | **None** (no test files, no jest). Pure functions in `vehicleUtils.ts` are easily testable. |
| Dependencies | Mismatched with SDK (see B-1). `react-native-screens` and `safe-area-context` are unused. |

## 10. Identified Bugs and Problems

Format: **ID — Title (Severity)** · *Where* · *Why it matters* · *Fix*.

* **B-1 — SDK / native-module version mismatch (Critical)** · `SuiviVoiture/package.json` · `expo-file-system 17` (SDK 51) etc. with RN 0.81 / SDK 54; `expo install --check` lists 9 mismatches; earlier EAS builds failed in native compile (`Errors2.txt`). Build/run failure or runtime crashes. · *Fix:* `npx expo install --fix`, drop unused `react-native-screens`/`safe-area-context` or align them.
* **B-2 — Legacy FileSystem API (Critical once B-1 is fixed)** · `App.tsx:4,18,89,127,134` · In SDK 54 `expo-file-system` default export is the new `File/Directory/Paths` API; `documentDirectory`, `readAsStringAsync`, `copyAsync`, `getInfoAsync`, `EncodingType` live in `expo-file-system/legacy`. After upgrading, the app would crash/throw on every import. · *Fix:* import from `expo-file-system/legacy` (minimal change) or migrate to the new API.
* **B-3 — "Original path" is a cache URI (High)** · `App.tsx:100–110,143` · `copyToCacheDirectory: true` means `selFile.uri` points into the app cache, which Android can purge at any time; it is not the user's original file and not updated when the source changes. The documented "connected mode uses original file" is therefore not what happens, and the stored URI silently dies. · *Fix:* always persist the picked file into `documentDirectory` (single source of truth) and drop the online/offline fork, or use SAF persisted URIs. Behaviour change → needs product decision (Q-2).
* **B-4 — Password stored in plaintext in AsyncStorage (High)** · `App.tsx:145` · Contradicts `Changement.txt` ("mot de passe (chiffré)"). Any rooted device/backup exposes the key that decrypts all residents' data. · *Fix:* `expo-secure-store` (Android Keystore).
* **B-5 — Unauthenticated plaintext fallback (Medium)** · `App.tsx:119–127` · If decryption fails and the file contains `,`/`;` it is accepted as plain CSV, so a wrong password on a plaintext file "works"; also masks error reasons. · *Fix:* only accept plaintext when it parses as CSV *and* is explicitly allowed; otherwise show `errorDecrypt`.
* **B-6 — Online detection too strict (Medium)** · `App.tsx:49` · `isConnected && isInternetReachable` is `null`/false on captive or slow networks → app falls to the offline path although the file is local. The network check has no purpose for a local file. · *Fix:* remove the dependency on network for a local file (see B-3).
* **B-7 — Stray source trees break type-check (Medium)** · `SuiviVoiture/original/`, `SuiviVoiture/NewApplication/` · `tsc --noEmit` yields 9 errors, all there; `active` files compile clean. · *Fix:* move/delete archives (they're duplicated elsewhere) or exclude them in `tsconfig`.
* **B-8 — Crash-prone parsing (Medium)** · `vehicleUtils.ts:parseCSV` · naive `split(sep)` breaks quoted fields containing separators; header detection treats any non-numeric first field as header, so a macaron such as `M-0001` in a header-less file is skipped; invalid rows are silently dropped (no count reported). · *Fix:* proper CSV tokenizer; report skipped rows.
* **B-9 — Search placeholder misleading (Low)** · `App.tsx:222` · Shows "ou 1234" but search is exact match, so `1234` never matches `12345-678-09`. Behaviour matches the PWA, so the placeholder is wrong, not the logic (Q-3 asks whether partial match is desired).
* **B-10 — Phone link not sanitised; no empty check (Low)** · `App.tsx:277` · `tel:` + raw CSV field ("0555 12 34 56" works, empty gives a dead button); `Linking.openURL` unhandled rejection.
* **B-11 — Label/value inconsistencies (Low)** · `App.tsx:262–263` · Label "Appartement" shows "🏢 Bloc A"; "Bloc" hard-coded in French in Arabic mode; `representant` text shows no name; `contactPhone`, `emptyState`, `emptyIcon` styles unused; `StatusBar` is the legacy RN component (should use `expo-status-bar`/edge-to-edge).
* **B-12 — Results not cleared / stale on language change; searching does nothing on empty list silently on submit (Low)**.
* **B-13 — Duplicated `shadeColor`/colour logic and a duplicated asset (Low)** · `Silhouette.png` (placeholder image) and `CarSilhouette.tsx` (SVG) represent the same idea; `getTextColorForBg` assumes 7-char hex.
* **B-14 — App icon config (Low)** · `app.json` uses `icon.png` as `adaptiveIcon.foregroundImage` (will be clipped by the mask); no `splash`, no `android.versionCode`, `userInterfaceStyle: light` only.
* **B-15 — Voice search (PWA feature) missing (Low/Info)** · declared in strings, absent in code. Not re-added unless confirmed (Q-4).

## 11. Security Assessment

| Item | Severity | Notes |
|---|---|---|
| Plaintext password in AsyncStorage | High | B-4 |
| Weak KDF: CryptoJS passphrase mode = MD5 EVP_BytesToKey, no iterations | Medium | Inherited from `encrypt_csv.py` and the PWA; changing it needs a new file format and re-encryption tooling (Q-5). Strong passphrase is the only mitigation. |
| Personal data (names/plates/phones) cached unencrypted in `documentDirectory/suivi_local.enc` is still ciphertext → acceptable; decrypted `vehicles` live only in memory | OK | but the plaintext-CSV fallback (B-5) lets unencrypted files be imported and copied |
| Credential / account files committed (`Compte Expo.txt`, `Compte Netlefy.txt`) and personal EAS `projectId` + owner in `app.json`/logs | High | Rotate those credentials; remove from git history before the repo is ever pushed/shared. Not opened or reproduced here. |
| `allowBackup` default | Medium | The default Android backup would copy AsyncStorage (incl. password) to cloud backup; set `android.allowBackup=false`. |
| Android permissions | OK | None declared beyond Expo defaults; no `READ_EXTERNAL_STORAGE` needed with the document picker. |
| npm audit | Medium | 28 findings (1 critical, 12 high), mostly transitive via old SDK-51 tooling; re-evaluate after B-1. |

## 12. Performance Assessment

Fine at the intended scale (hundreds to low thousands of rows; linear scan + one decrypt). `searchVehicle` does `toUpperCase().replace` on every row on every search (O(n) allocations) – pre-normalising once on load would help but isn't needed yet. The ~100-line `StyleSheet` and the `Image` + SVG silhouette are cheap. Decryption runs on the JS thread (CryptoJS, MD5-based, pure JS): blocks the UI for a large file; show a loading state (already present in the modal).

## 13. Build and Deployment Assessment

* Past practice: **EAS cloud build** requires the owner's Expo login; `Errors*.txt` show native build failures from the B-1 mismatch (`react-native-screens`, `react-native-svg` and C++ symbol errors) and the workaround of bumping them by hand.
* **Local toolchain on this machine:** Node 22.15 / npm 10.9 ✔; Android SDK at `%LOCALAPPDATA%\Android\Sdk` has `build-tools 36.0.0`, `platforms/android-37.0`, `platform-tools`, `emulator`, two **system images (android-37.1/37.2)**; **no JDK** (no `java`, no `JAVA_HOME`), **no `cmdline-tools`**, **no AVD** defined. Expo SDK 54 needs JDK 17, compileSdk 36 (platform 36 + build-tools 36.0.0), NDK 27.x, CMake – gradle can fetch the SDK pieces if licences are accepted. Disk: `C:` 13 GB free (94 % used), `D:` 49 GB free.
* Therefore a **local** APK build needs a JDK 17 download (and extra SDK components) — or an EAS cloud build with the owner's Expo account. Both need user approval (see §15).
* `eas.json` is valid; `cli.appVersionSource` not set (warning); `preview` profile gives an installable APK. There is no signing configuration in the repo (EAS-managed keystore). No release/debug separation of config.

## 14. Recommended Improvements

1. Fix dependencies with `npx expo install --fix`; move to `expo-file-system/legacy` (or the new API) and `expo-secure-store`.
2. Collapse load logic into one storage model: *import → copy into app storage → always load from it* (resolves B-3, B-6); keep network out of it. (Product decision first.)
3. Split `App.tsx` into `theme/`, `components/`, `hooks/useVehicleStore`, `screens/`; centralise strings and tokens.
4. Add unit tests (Jest + `jest-expo`) for `parseCSV`, `searchVehicle`, `decryptAES` (with a vector produced by `encrypt_csv.py`) and the colour helpers; add ESLint (`eslint-config-expo`) and `tsc` script.
5. Accessibility pass (roles, labels, 48 dp targets, contrast, dynamic type, TalkBack).
6. Clean the repository: archive the 12 stale copies outside the repo, delete `Compte*.txt`, rotate credentials.
7. Android config: `android.package` kept, add `versionCode`, `allowBackup:false`, proper adaptive icon, splash.

## 15. Risks and Technical Questions

* **Q-1 (scope):** The brief calls this "gestion parking" and mentions CRUD/backend. The code is a read-only access-control lookup. Should the redesign stay strictly within that (my plan), or is a real parking-management feature set (entries/exits, slots, subscriptions) wanted? I will **not** invent it.
* **Q-2:** Is changing the storage model of B-3 acceptable (single local copy; re-import to refresh)? The documented "online reads the original file" is unachievable with the document picker without persistable SAF URIs.
* **Q-3:** Should search remain exact-match (as the PWA) or also match partial plate/sticker (e.g. last 4 digits, as the placeholder suggests)?
* **Q-4:** Is voice search wanted back?
* **Q-5:** Can the file format (CryptoJS passphrase AES) change? It would need coordinated changes to `encrypt_csv.py` and every distributed `.enc` file.
* **Q-6 (build):** No JDK is installed. May I download a portable Temurin JDK 17 into a project-local tools folder (≈ 200 MB, plus Android platform 36 / NDK, several GB on `D:`) and build locally? Alternative: EAS cloud build under your Expo account (uploads the source to Expo's servers).
* **Q-7 (device):** An emulator needs an AVD created from the existing `android-37.x` image and `cmdline-tools` (or Android Studio's AVD Manager); the `mcp__android__*` tools are available to drive it. No physical device is claimed.
* **Risk:** the repo has a single commit with 12 copies of everything; large refactors are safest on a new branch with the stray copies left untouched.
