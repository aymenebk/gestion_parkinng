# Suivi Voitures

Android app (Expo SDK 54 / React Native 0.81 / TypeScript) for gate staff of a residential cité: import an encrypted vehicle list, look a vehicle up by **matricule** or **macaron**, see whether it is authorised, and call the block representative. French / Arabic (RTL). Works fully offline.

## Data file

CSV with 7 columns (header optional, separator `,` or `;`):

```
macaron,matricule,modele,marque,couleur,bloc,telephone
M-0001,12345-001-16,Clio IV,Renault,Rouge,A,0555 12 34 56
```

The file is encrypted with CryptoJS-compatible AES (passphrase mode, `Salted__` OpenSSL format) — see `Projet Voiture Cité/.../encrypt_csv.py` at the repository root. An unencrypted CSV is also accepted.

On a successful import the app keeps the file path, a private copy (`documentDirectory/suivi_local.enc`) and the password (Android Keystore via `expo-secure-store`). At startup it reloads the saved file, falling back to the private copy; if neither can be read the import sheet opens.

## Develop

```bash
npm install
npm run check      # tsc + eslint + jest
npx expo start     # then press "a" with an emulator / device, or scan with Expo Go
```

Requires Node 20+. `.npmrc` sets `legacy-peer-deps=true`.

## Build the APK

**EAS cloud build** (no local Android toolchain needed; requires `npx eas-cli login`):

```bash
npx eas-cli build --platform android --profile preview
```

The build page gives a browser download link for an installable APK (`preview` profile, internal distribution, `com.cite.suivivoitures`). `production` produces an app bundle for the Play Store.

**Local build** needs JDK 17, the Android SDK (platform 36, build-tools 36.0.0, NDK) and `npx expo prebuild --platform android` followed by `./gradlew assembleRelease` in `android/`.

## Install on a phone

Open the build link (or the APK file) on the Android device, allow "Install unknown apps" for the browser/file manager when asked, then install. Minimum Android version: 7.0 (API 24, the Expo SDK 54 default).

## Layout

```
App.tsx                      providers + ControlScreen
src/screens/ControlScreen    the single screen (search, results, import sheet)
src/hooks/useVehicleStore    persistence, startup load, import pipeline
src/components/              ui.tsx (Button, TextField, Banner, …), BottomSheet, VehicleCard, CarSilhouette
src/theme/tokens.ts          colours, spacing, radius, typography, elevation
src/utils/vehicleUtils.ts    decrypt, CSV parse, search, colour helpers (unit-tested)
src/i18n.ts, LangContext     FR/AR strings and per-component RTL mirroring
```

Design and audit documents: `../docs/`.
