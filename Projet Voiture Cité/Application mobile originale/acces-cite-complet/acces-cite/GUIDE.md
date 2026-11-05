# Guide Complet — Application Contrôle d'Accès Cité
## دليل التثبيت والاستخدام

---

## SOLUTION 1 — Application Web (PWA) ✅ Prête à l'emploi

### Installation sur Android (aucune compilation requise)

1. **Copiez** le fichier `pwa/index.html` sur un serveur web, ou ouvrez-le directement.
2. **Sur votre téléphone Android**, ouvrez Chrome et naviguez vers le fichier.
3. **Ajoutez à l'écran d'accueil** :
   - Appuyez sur le menu ⋮ de Chrome
   - Sélectionnez "Ajouter à l'écran d'accueil"
   - L'icône apparaît comme une vraie application
4. **L'app fonctionne sans Internet** après le premier chargement.

> **Alternative rapide** : Partagez le fichier HTML par WhatsApp/email, ouvrez-le dans Chrome, et ajoutez à l'écran d'accueil.

---

## SOLUTION 2 — APK Android natif (React Native / Expo)

### Prérequis

- **Node.js** 18+ : https://nodejs.org
- **Compte Expo** gratuit : https://expo.dev (inscription en 2 min)
- **EAS CLI** (outil de build Expo)

### Étapes de compilation

#### 1. Installer les outils

```bash
# Installer EAS CLI globalement
npm install -g eas-cli

# Se connecter à Expo
eas login
```

#### 2. Préparer le projet

```bash
# Aller dans le dossier du projet
cd expo-app

# Installer les dépendances
npm install

# Initialiser EAS pour votre compte
eas init
```

#### 3. Générer l'APK

```bash
# Générer un APK (format .apk, installable directement)
eas build --platform android --profile preview
```

Le build se fait dans le cloud (environ 5-10 minutes). Vous recevrez un lien de téléchargement de l'APK.

#### 4. Installer l'APK

1. Téléchargez l'APK sur votre téléphone Android
2. Activez "Sources inconnues" dans Paramètres > Sécurité
3. Ouvrez le fichier APK et installez

### Build local (sans compte Expo)

Si vous préférez compiler localement (nécessite Android Studio) :

```bash
# Installer Android Studio et SDK
# Puis dans expo-app/ :
npm install
npx expo run:android
```

---

## PRÉPARATION DU FICHIER CSV CHIFFRÉ

### Format du fichier CSV

```
macaron,matricule,modele,marque,couleur,bloc,telephone
M-0001,12345-001-16,Clio IV,Renault,Rouge,A,0555 12 34 56
M-0002,67890-002-23,Polo 6,Volkswagen,Blanc,B,0666 23 45 67
```

**Colonnes (dans cet ordre) :**
| Colonne | Description | Exemple |
|---------|-------------|---------|
| macaron | Numéro unique du macaron | M-0001 |
| matricule | Plaque d'immatriculation | 12345-001-16 |
| modele | Modèle du véhicule | Clio IV |
| marque | Marque du véhicule | Renault |
| couleur | Couleur (voir liste) | Rouge |
| bloc | Numéro/lettre du bloc | A |
| telephone | Téléphone du représentant | 0555 12 34 56 |

### Couleurs supportées

| Français | العربية | Hex |
|----------|---------|-----|
| Blanc/Blanche | أبيض | #ECEFF1 |
| Noir/Noire | أسود | #263238 |
| Rouge | أحمر | #C62828 |
| Bleu/Bleue | أزرق | #1565C0 |
| Vert/Verte | أخضر | #2E7D32 |
| Gris/Grise | رمادي | #607D8B |
| Jaune | أصفر | #F9A825 |
| Orange | برتقالي | #E65100 |
| Argent/Argenté | فضي | #B0BEC5 |
| Marron | بني | #5D4037 |
| Beige | بيج | #D7CCC8 |
| Bordeaux | - | #880E4F |
| Violet | بنفسجي | #6A1B9A |
| Rose | وردي | #AD1457 |

### Chiffrement AES du CSV

#### Option A : Script Python fourni

```bash
# Installer pycryptodome
pip install pycryptodome

# Générer un CSV exemple ET le chiffrer
python3 encrypt_csv.py --generate --key "votre-cle-secrete-123" --output vehicules.enc

# Chiffrer votre propre CSV
python3 encrypt_csv.py --input vehicules.csv --key "votre-cle-secrete-123" --output vehicules.enc
```

#### Option B : Node.js / CryptoJS

```javascript
const CryptoJS = require('crypto-js');
const fs = require('fs');

const csvText = fs.readFileSync('vehicules.csv', 'utf8');
const encrypted = CryptoJS.AES.encrypt(csvText, 'votre-cle-secrete').toString();
fs.writeFileSync('vehicules.enc', encrypted);
console.log('Fichier chiffré créé: vehicules.enc');
```

#### Option C : En ligne (pour test)

Vous pouvez aussi importer un fichier CSV **non chiffré** directement dans l'application (entrez n'importe quelle clé, l'app essaiera d'abord le déchiffrement puis lira le CSV brut si échec).

---

## UTILISATION DE L'APPLICATION

### Interface

```
┌─────────────────────────────────────┐
│ Contrôle d'Accès Cité  [AR] [Import]│  ← En-tête
├─────────────────────────────────────┤
│  ● 127 véhicules chargés ✓          │  ← Statut
├─────────────────────────────────────┤
│  Matricule ou N° Macaron            │
│  ┌─────────────────┐ [🎤] [🔍]     │  ← Recherche
│  │ 12345-001-16    │               │
│  └─────────────────┘               │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ ✓ Véhicule autorisé         │   │  ← Résultat
│  │  [Silhouette voiture rouge] │   │     (si trouvé)
│  │  M-0001 | 12345-001-16      │   │
│  │  Renault Clio IV | Rouge    │   │
│  │  Bloc A                     │   │
│  │  👤 Représentant | ☎ Appeler│   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Flux d'utilisation quotidien

1. **Ouvrir l'app** (déjà configurée avec la liste chargée)
2. **Scanner/saisir** le matricule ou numéro de macaron
3. **Vérifier** le résultat affiché :
   - ✅ **Vert** → Véhicule autorisé, informations affichées
   - ❌ **Rouge** → "Véhicule INCONNU !" → Refuser l'accès
4. En cas de doute, **appeler** le représentant du bloc directement depuis l'app

### Mise à jour de la liste

Quand la liste change :
1. Appuyez sur **[Importer]** (coin supérieur droit)
2. Sélectionnez le nouveau fichier CSV chiffré
3. Entrez la clé de déchiffrement
4. Appuyez sur **Déchiffrer & Charger**

---

## SÉCURITÉ

- La liste reste **en mémoire** uniquement (non sauvegardée sur le disque)
- Le fichier CSV est chiffré en **AES-256** via CryptoJS
- La clé de déchiffrement n'est jamais stockée
- Il est recommandé de changer la clé régulièrement

---

## STRUCTURE DU PROJET

```
acces-cite/
├── pwa/
│   ├── index.html          ← Application PWA (prête à l'emploi)
│   └── manifest.json       ← Manifest pour installation Android
├── expo-app/
│   ├── app/
│   │   ├── _layout.tsx     ← Layout Expo Router
│   │   └── index.tsx       ← Écran principal
│   ├── src/
│   │   ├── components/
│   │   │   └── CarSilhouette.tsx  ← Silhouette SVG
│   │   ├── utils/
│   │   │   └── vehicleUtils.ts    ← Déchiffrement, parsing, couleurs
│   │   ├── i18n.ts         ← Traductions FR/AR
│   │   └── types.ts        ← Types TypeScript
│   ├── app.json            ← Config Expo
│   ├── eas.json            ← Config build APK
│   └── package.json        ← Dépendances
├── encrypt_csv.py          ← Outil Python de chiffrement
└── GUIDE.md                ← Ce fichier
```

---

## DÉPANNAGE

| Problème | Solution |
|----------|---------|
| "Échec du déchiffrement" | Vérifiez que la clé est exactement la même que lors du chiffrement |
| "Format CSV invalide" | Vérifiez les 7 colonnes séparées par virgules |
| La silhouette est grise | La couleur n'est pas reconnue, vérifiez l'orthographe dans le CSV |
| La recherche ne trouve rien | Vérifiez les espaces: "M-0001" ≠ "M 0001" |
| PWA ne s'installe pas | Utilisez Chrome (pas Firefox) sur Android |
| Build APK échoue | Vérifiez votre connexion et que `eas login` a réussi |

---

*Application développée avec des logiciels libres : React Native (Expo), CryptoJS, React Native SVG*
*رخصة مفتوحة المصدر — Licence open-source (MIT)*
