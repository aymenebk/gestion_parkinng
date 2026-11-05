# How the APK was built

Result: `dist/android/gestion-parking.apk` (package `com.cite.suivivoitures`, version 1.1.0, versionCode 2, ~63 MB).
SHA-256: `91793cf8ad59d0c31c655aa01d3e1f74211c98847dde9c19c3ff7ab12cfa0e9e`

The APK was built in the **Expo (EAS) cloud**, not locally. This machine has no JDK and no Android `cmdline-tools`, so a local Gradle build was not possible without installing them.

## 1. Prepare the app (`SuiviVoiture/`)

1. **Align dependencies with Expo SDK 54** (the old `package.json` mixed SDK 54 with SDK 51 native modules, which breaks native builds):
   `npx expo install --fix`
   then added `expo-secure-store`, `react-native-safe-area-context`, `@expo/vector-icons`, and removed the unused `expo-network` and `react-native-screens`.
2. **File API:** `expo-file-system` is imported from `expo-file-system/legacy`, because SDK 54's default export no longer has `readAsStringAsync`, `documentDirectory`, etc.
3. **Android config (`app.json`):** name "Suivi Voitures", package `com.cite.suivivoitures`, `versionCode: 2`, `allowBackup: false`, a proper adaptive icon (foreground `assets/adaptive-icon.png`, white background) and a 1024 px `icon.png` / `splash-icon.png` regenerated from the original car artwork.
4. **Pre-build check:** `tsc`, ESLint, Jest, and `npx expo export --platform android` (a real Metro bundle) all passed before submitting.

## 2. Configure EAS

1. Logged-in account: `npx eas-cli whoami` showed `ne_fekairi` (and `nounou_dz`).
2. The old `extra.eas.projectId` in `app.json` belonged to a different Expo account, so it was removed, `"owner": "ne_fekairi"` was set, and a new project was created:
   `npx eas-cli init --non-interactive --force`
   (created `@ne_fekairi/suivivoiture`; the new `projectId` was written into `app.json`).
3. `eas.json`: added `"appVersionSource": "local"` so `versionCode` comes from `app.json`. The `preview` profile is what produces the APK:

   ```json
   "preview": {
     "distribution": "internal",
     "android": { "buildType": "apk" }
   }
   ```

   (`production` builds an `app-bundle`/AAB for the Play Store and was not used.)

## 3. Build

```bash
cd SuiviVoiture
npx eas-cli build --platform android --profile preview --non-interactive --no-wait --json
```

* Build ID: `588eff31-c53b-4ddf-ae9b-c05588672b13`. It waited in the free-tier queue for about an hour, then finished with status `FINISHED`.
* Status was polled with `npx eas-cli build:view <id> --json` until it reached `FINISHED`.
* EAS signs `preview` builds with an EAS-managed keystore; no credentials were supplied by hand.

## 4. Download

The artifact URL came from `artifacts.applicationArchiveUrl` in the build JSON:

```bash
mkdir -p dist/android
curl -L -o dist/android/gestion-parking.apk \
  "https://expo.dev/artifacts/eas/zmxEyAPs4RhfM63ZttCBCibXjsmp2D1ByAjfCgZlQM4.apk"
```

The file was then checked: it starts with the ZIP signature `PK`, contains `AndroidManifest.xml` and `classes.dex`, and its SHA-256 was recorded above. The same URL works in a browser until the build expires on 2026-11-19.

## 5. Install

Open the APK on an Android phone and allow "Install unknown apps" for the browser or file manager when prompted. Minimum Android version is the Expo SDK 54 default (7.0, API 24).

## Not done

* The APK has **not** been installed or run on an emulator or a physical device.
* No Play Store release or signed production build was made.

## Rebuilding

```bash
cd SuiviVoiture
npm install
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

Bump `android.versionCode` in `app.json` before each new build you want to install over an existing one.
