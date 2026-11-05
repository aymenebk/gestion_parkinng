# Guide Complet : De la PWA vers une Application Android (.apk)
## Avec logiciels libres sous Windows 11

---

# VUE D'ENSEMBLE

```
Votre PWA (HTML/JS/CSS)
        ↓
  React Native / Expo       ← Framework open-source (Meta + Expo)
        ↓
    EAS Build               ← Service de compilation cloud (gratuit)
        ↓
   Fichier .apk             ← Installable sur tout Android
```

**Logiciels libres utilisés :**
- Node.js (licence MIT)
- Expo CLI (licence MIT)
- React Native (licence MIT)
- EAS Build (gratuit pour usage personnel)
- VS Code (licence MIT) — éditeur recommandé

**Durée estimée :** 2h à 3h pour la première fois

---

# ÉTAPE 1 — INSTALLER LES OUTILS DE BASE

## 1.1 — Node.js

Node.js est le moteur d'exécution JavaScript nécessaire à Expo.

1. Allez sur https://nodejs.org
2. Téléchargez la version **LTS** (ex: 20.x.x LTS)
3. Lancez l'installateur `.msi`
4. Cochez **"Add to PATH"** pendant l'installation
5. Cliquez sur Suivant jusqu'à la fin

**Vérification :** Ouvrez PowerShell (touche Windows + X → Terminal) et tapez :
```powershell
node --version
# Doit afficher : v20.x.x

npm --version
# Doit afficher : 10.x.x
```

---

## 1.2 — Visual Studio Code (éditeur de code)

1. Allez sur https://code.visualstudio.com
2. Téléchargez et installez
3. Extensions recommandées à installer dans VS Code :
   - **ES7+ React/Redux/React-Native snippets**
   - **Prettier - Code formatter**

---

## 1.3 — Git (gestionnaire de versions)

1. Allez sur https://git-scm.com/download/win
2. Téléchargez et installez (options par défaut suffisent)

**Vérification :**
```powershell
git --version
# Doit afficher : git version 2.x.x
```

---

# ÉTAPE 2 — CRÉER UN COMPTE EXPO

Expo est la plateforme qui va compiler votre APK dans le cloud.

1. Allez sur https://expo.dev
2. Cliquez sur **"Sign Up"**
3. Créez un compte gratuit (email + mot de passe)
4. Confirmez votre email

> ⚠️ Notez bien votre nom d'utilisateur Expo, vous en aurez besoin.

---

# ÉTAPE 3 — INSTALLER EXPO CLI ET EAS CLI

Dans PowerShell (en tant qu'administrateur) :

```powershell
# Installer Expo CLI globalement
npm install -g expo-cli

# Installer EAS CLI (outil de build)
npm install -g eas-cli

# Se connecter à votre compte Expo
eas login
# Entrez votre email et mot de passe Expo
```

**Vérification :**
```powershell
expo --version
eas --version
```

---

# ÉTAPE 4 — CRÉER LE PROJET REACT NATIVE

## 4.1 — Initialiser le projet

Choisissez un dossier de travail (ex: `C:\Projets\`) et dans PowerShell :

```powershell
# Aller dans votre dossier de travail
cd C:\Projets

# Créer le projet Expo
npx create-expo-app acces-cite --template blank-typescript

# Entrer dans le dossier
cd acces-cite
```

## 4.2 — Installer les dépendances nécessaires

```powershell
# Navigation et interface
npm install expo-router expo-status-bar

# Fonctionnalités spécifiques à votre app
npm install expo-document-picker
npm install expo-file-system
npm install expo-haptics

# Chiffrement AES (comme dans votre PWA)
npm install crypto-js
npm install @types/crypto-js

# Icônes
npm install @expo/vector-icons

# Dessin SVG (silhouette voiture)
npm install react-native-svg

# Interface
npm install react-native-safe-area-context
npm install react-native-screens
```

---

# ÉTAPE 5 — CONFIGURER LE PROJET

## 5.1 — Fichier app.json

Ouvrez `C:\Projets\acces-cite\app.json` dans VS Code et remplacez son contenu :

```json
{
  "expo": {
    "name": "Suivi Voitures | متابعة السيارات",
    "slug": "acces-cite",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a237e"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a237e"
      },
      "package": "com.cite.suivivoitures",
      "versionCode": 1,
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.CALL_PHONE"
      ]
    },
    "plugins": [
      "expo-router"
    ],
    "scheme": "acces-cite"
  }
}
```

## 5.2 — Fichier eas.json (configuration du build)

Créez le fichier `C:\Projets\acces-cite\eas.json` :

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

> **preview** = génère un `.apk` installable directement
> **production** = génère un `.aab` pour le Play Store

## 5.3 — Icône de l'application

Copiez votre fichier `icon-192.png` dans `C:\Projets\acces-cite\assets\` et renommez-le `icon.png`.

Pour les autres images requises :
```powershell
# Expo peut générer les variantes automatiquement
npx expo install expo-splash-screen
```

---

# ÉTAPE 6 — TRADUIRE LE CODE DE LA PWA EN REACT NATIVE

C'est l'étape principale. Voici la correspondance entre HTML/CSS et React Native :

## Correspondance HTML → React Native

| HTML/CSS          | React Native              |
|-------------------|---------------------------|
| `<div>`           | `<View>`                  |
| `<p>`, `<span>`   | `<Text>`                  |
| `<input>`         | `<TextInput>`             |
| `<button>`        | `<TouchableOpacity>`      |
| `<img>`           | `<Image>`                 |
| `<svg>`           | Composants `react-native-svg` |
| `style="..."`     | `StyleSheet.create({...})`|
| `display: flex`   | Par défaut en RN          |
| `onClick`         | `onPress`                 |
| `localStorage`    | `AsyncStorage`            |
| `CryptoJS`        | même lib `crypto-js`      |
| `fetch()`         | même API `fetch()`        |

## Structure des fichiers à créer

```
acces-cite/
├── app/
│   ├── _layout.tsx        ← Layout racine
│   └── index.tsx          ← Écran principal
├── src/
│   ├── components/
│   │   └── CarSilhouette.tsx   ← SVG voiture
│   ├── utils/
│   │   └── vehicleUtils.ts     ← Déchiffrement, parsing CSV
│   ├── i18n.ts            ← Traductions FR/AR
│   └── types.ts           ← Types TypeScript
├── assets/
│   └── icon.png
├── app.json
└── eas.json
```

## Exemple : convertir votre fonction buildCarSVG

Dans votre PWA (JavaScript) :
```javascript
// PWA — HTML pur
function buildCarSVG(colorHex) {
  return `<svg viewBox="0 0 380 290">
    <rect x="104" y="12" width="172" height="54" rx="14" fill="${colorHex}"/>
    ...
  </svg>`;
}
```

En React Native (TypeScript) :
```typescript
// React Native — composant SVG
import Svg, { Rect, Path } from 'react-native-svg';

function CarSilhouette({ couleur }: { couleur: string }) {
  const colorHex = getCarColorHex(couleur);
  return (
    <Svg viewBox="0 0 380 290" width="280" height="210">
      <Rect x="104" y="12" width="172" height="54" rx="14" fill={colorHex}/>
      {/* ... autres formes ... */}
    </Svg>
  );
}
```

## Exemple : convertir le déchiffrement AES

Identique dans les deux cas, `crypto-js` fonctionne tel quel :
```typescript
import CryptoJS from 'crypto-js';

function decryptAES(ciphertext: string, key: string): string {
  const decrypted = CryptoJS.AES.decrypt(ciphertext, key);
  return decrypted.toString(CryptoJS.enc.Utf8);
}
```

## Exemple : import de fichier CSV

```typescript
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

async function importerFichier() {
  // Ouvre le sélecteur de fichier
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });

  if (!result.canceled && result.assets[0]) {
    // Lire le contenu du fichier
    const contenu = await FileSystem.readAsStringAsync(result.assets[0].uri);
    // Déchiffrer et parser...
  }
}
```

---

# ÉTAPE 7 — TESTER SUR VOTRE TÉLÉPHONE (sans APK)

Avant de compiler, vous pouvez tester en direct grâce à **Expo Go**.

## 7.1 — Installer Expo Go sur votre Android

Depuis le Play Store, cherchez **"Expo Go"** et installez-le.

## 7.2 — Lancer le serveur de développement

```powershell
cd C:\Projets\acces-cite
npx expo start
```

Un QR code apparaît dans le terminal. Scannez-le avec l'app Expo Go.
Votre application s'affiche immédiatement sur votre téléphone !

> ✅ Chaque modification du code se recharge automatiquement.

---

# ÉTAPE 8 — COMPILER L'APK

Quand tout est testé et fonctionnel :

## 8.1 — Initialiser EAS pour votre projet

```powershell
cd C:\Projets\acces-cite
eas build:configure
```

## 8.2 — Lancer le build APK

```powershell
# Build APK (installable directement, pour test/distribution)
eas build --platform android --profile preview
```

Ce que va se passer :
1. EAS télécharge votre code vers les serveurs Expo
2. La compilation se fait dans le cloud (~5 à 15 minutes)
3. Vous recevez un lien de téléchargement de l'APK

```
✔ Build finished.
🎉 Your build is ready!
   Download: https://expo.dev/artifacts/eas/xxxx.apk
```

## 8.3 — Installer l'APK sur votre téléphone

1. Téléchargez l'APK depuis le lien
2. Sur Android : **Paramètres → Sécurité → Sources inconnues → Autoriser**
3. Ouvrez le fichier APK → Installer

---

# ÉTAPE 9 — PUBLIER SUR LE PLAY STORE (optionnel)

Si vous voulez publier officiellement :

```powershell
# Build AAB (format requis par le Play Store)
eas build --platform android --profile production
```

Puis :
1. Créez un compte Google Play Developer (25$ une seule fois)
2. Allez sur https://play.google.com/console
3. Créez une nouvelle application
4. Uploadez le fichier `.aab` généré

---

# RÉSUMÉ DES COMMANDES

```powershell
# 1. Créer le projet
npx create-expo-app acces-cite --template blank-typescript
cd acces-cite

# 2. Installer les dépendances
npm install expo-router expo-document-picker expo-file-system
npm install expo-haptics crypto-js @types/crypto-js
npm install @expo/vector-icons react-native-svg
npm install react-native-safe-area-context react-native-screens

# 3. Se connecter à Expo
eas login

# 4. Tester en live
npx expo start

# 5. Compiler l'APK
eas build --platform android --profile preview
```

---

# DÉPANNAGE FRÉQUENT

| Problème | Solution |
|----------|---------|
| `npm : terme non reconnu` | Réinstaller Node.js et redémarrer PowerShell |
| `eas : terme non reconnu` | `npm install -g eas-cli` puis redémarrer |
| Erreur `Metro bundler` | Supprimer `node_modules/` puis `npm install` |
| QR code ne fonctionne pas | Vérifier que le PC et le téléphone sont sur le même Wi-Fi |
| Build échoue sur EAS | Vérifier les logs sur https://expo.dev/accounts/[votre-compte]/builds |
| `crypto-js` introuvable | `npm install crypto-js --save` |

---

# RESSOURCES UTILES

- Documentation Expo : https://docs.expo.dev
- React Native : https://reactnative.dev/docs/getting-started
- EAS Build : https://docs.expo.dev/build/introduction
- Communauté : https://forums.expo.dev

---

*Guide rédigé pour Windows 11 — Logiciels libres uniquement*
*Node.js (MIT) • Expo (MIT) • React Native (MIT)*
