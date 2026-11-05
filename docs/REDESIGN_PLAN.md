# Redesign Plan — Suivi Voitures (active app: `SuiviVoiture/`)

Scope reminder (from the audit): a read-only, offline vehicle-authorisation lookup for a residential cité. The redesign keeps **all** existing features and business rules; it adds no new business features.

## 1. Current UI problems

* Single flat navy screen; white text on translucent white boxes → low contrast, weak hierarchy (header, pill, label and input all compete).
* Header controls are tiny (≈ 28 dp tall), text-only, no icons, no accessibility labels.
* Emoji (🔍 📞 🏢 👤 ❌ ✓) used as icons: inconsistent rendering across devices.
* Hard-coded hex values and ~100 inline styles in `App.tsx`; no tokens; no reusable components.
* Missing states: startup loading, "no list loaded" call-to-action, import success/failure feedback (uses blocking `Alert`), validation per field, unreadable-list recovery.
* Result card is visually heavy (green border + banner + grey area) and puts the most important info (is the vehicle authorised? which block? who to call?) below a large drawing.
* RTL handled only on some rows; grid labels do not mirror.
* Import dialog is a centred card with a dashed picker; no password reveal; error text only.

## 2. Design philosophy

*Glanceable at a gate, usable with one thumb, readable in sun.* One primary question per screen state: **"Is this vehicle authorised?"**. Verdict first (large colour-coded status + icon + text, never colour alone), details second, action (call) third. Calm, professional, minimal: light neutral surfaces, one brand colour, semantic colours only for status. No gradients (except the existing SVG car), no decorative animation (only 150 ms fades/press feedback).

## 3. Proposed design system (`src/theme/`)

**Colour tokens** (light theme; dark theme not in scope — `userInterfaceStyle` stays light for outdoor legibility)

| Token | Value | Use |
|---|---|---|
| `primary` | `#1A237E` (existing brand navy) | app bar, primary buttons, focus |
| `primaryContainer` | `#E8EAF6` | tinted chips, selected states |
| `accent` | `#FFB300` | secondary highlight (import button on empty state) |
| `background` | `#F4F6FB` | screen |
| `surface` | `#FFFFFF` | cards, sheets |
| `border` | `#DDE1EC` | hairlines |
| `text` / `textMuted` | `#14182B` / `#5A6178` | AA contrast on surface (≥ 7:1 / ≥ 5.5:1) |
| `success` / `successContainer` | `#1B7A3A` / `#E3F4E8` | authorised |
| `danger` / `dangerContainer` | `#B3261E` / `#FCE8E6` | unknown vehicle, errors |
| `warning` / `warningContainer` | `#8A5A00` / `#FFF3D6` | no list / offline copy |

**Typography** (system font; Arabic falls back to system Arabic): display 28/34 bold, title 20/26 bold, subtitle 16/22 semibold, body 15/22, label 12/16 semibold uppercase-tracking for field captions, mono for plates (`monospace`, 1 px tracking). Respects system font scale (no `allowFontScaling={false}`).

**Spacing** 4-pt scale: 4, 8, 12, 16, 20, 24, 32. **Radius**: 8 (chips/inputs), 12 (buttons), 16 (cards), 24 (sheet top), full (pills). **Elevation**: `0` flat w/ border, `1` card (`elevation 2`, soft shadow), `2` sheet. **Touch target** ≥ 48 dp. **Icons**: `@expo/vector-icons` (MaterialCommunityIcons, bundled with Expo) — replaces every emoji.

**Status indicators**: icon + text + colour container (authorised ✓ green, unknown ✕ red, list loaded/empty chips, warning banner).

## 4. Screen-by-screen improvements

The app has one screen plus one dialog; both are redesigned.

1. **Main screen (Contrôle)**
   * App bar (navy): title "Contrôle des véhicules", subtitle = list status chip (`N véhicules` green / `Aucune liste` amber), actions: language toggle and "Importer" as 48 dp icon buttons with labels.
   * **Search card** (elevated, overlaps app bar): caption, large input (56 dp, plate-style monospace, clear button, search icon), full-width primary "Rechercher" button; submit via keyboard. Disabled while list not loaded with a hint.
   * **Result area** (state machine): `loading` (spinner while auto-loading) → `noList` (empty state with illustration, explanation, "Importer la liste" CTA) → `idle` (calm prompt + silhouette) → `found` → `unknown`.
   * **Found card**: verdict banner "Véhicule autorisé" (green, check icon) → plate/macaron as two large monospace chips → car silhouette tinted with vehicle colour → 2-col detail grid (Marque, Modèle, Couleur swatch, Bloc/Appartement) → contact row with primary "Appeler" button (hidden/disabled if no phone).
   * **Unknown card**: red verdict banner "Véhicule INCONNU", echoes the typed query in a mono chip, helper text, "Nouvelle recherche" action.
2. **Import bottom sheet** (replaces centred modal; same fields and rules): drag handle, title/description, file row (icon, file name or "Choisir un fichier", replace action), password field with show/hide, inline field-level validation, progress state on the confirm button, inline error banner; success is shown as a dismissible banner/snackbar on the main screen (no blocking `Alert`).
3. **Feedback**: snackbar/banner component for success, startup load failures ("Chargement automatique échoué…", "Hors-ligne et aucune liste…") instead of `Alert`.

## 5. Navigation improvements

Single-screen app stays single-screen (no tabs invented). Import is a bottom sheet reachable from (a) the app bar and (b) the empty-state CTA; language toggle is always visible; back button closes the sheet; keyboard "search" submits; after a result, the input keeps focus-ready and a clear (×) button resets both field and result.

## 6. Reusable components (`src/components/`, tokens in `src/theme/`)

`AppBar`, `IconButton`, `Button` (primary / tonal / ghost, loading), `TextField` (label, error, trailing action), `StatusChip`, `Banner` (info/success/warning/error), `Card`, `BottomSheet` (Modal-based), `EmptyState`, `VehicleCard`, `UnknownCard`, `InfoItem`, `ColorSwatch`, plus the existing `CarSilhouette`. All consume `theme/tokens.ts` and an `rtl` helper (`useDirection`) so mirrored layouts are consistent.

## 7. Technical changes bundled with the redesign (from the audit)

* B-1/B-2: `npx expo install --fix`; FileSystem imported from `expo-file-system/legacy` (smallest behaviour-preserving change).
* B-3/B-6: loading order becomes *saved path → local copy → import sheet*, **independent of network** (keeps the documented intent "original if available, otherwise local copy"; `expo-network` removed).
* B-4: password moved to `expo-secure-store`; one-time migration from the old AsyncStorage key, then the plaintext key is deleted.
* B-5: plaintext-CSV fallback kept (existing behaviour) but only accepted if it parses to ≥ 1 row.
* B-8: CSV tokenizer handles quotes; reports number of skipped rows; header detection keeps current rule.
* B-9/B-11: placeholder corrected; strings moved into i18n (including "Bloc"); unused styles/keys cleaned.
* B-7: stray folders excluded from `tsconfig`.
* B-14: adaptive icon foreground/background fixed, `android.allowBackup=false`, `versionCode`.
* Architecture: `App.tsx` → thin shell; `hooks/useVehicleStore.ts` (persistence + loading), `screens/ControlScreen.tsx`, components as above. Pure logic remains in `utils/vehicleUtils.ts`.
* Tests/lint: Jest (`jest-expo`) unit tests for utils and a CSV/crypto round-trip with a vector produced by the same algorithm as `encrypt_csv.py`; ESLint (`eslint-config-expo`); `npm run typecheck`.

## 8. Accessibility considerations

* All interactive elements: `accessibilityRole`, `accessibilityLabel` (localised), state (`disabled`, `busy`).
* ≥ 48 dp targets; text contrast ≥ 4.5:1 (tokens above chosen to pass); status never conveyed by colour alone (icon + text).
* Result changes announced via `accessibilityLiveRegion="polite"`.
* Font scaling honoured; layouts wrap instead of clipping.
* RTL: `I18nManager`-independent per-component mirroring via `useDirection` (row-reverse, text alignment, icon flips) so the in-app FR/AR toggle works without restarting.

## 9. Implementation plan

1. Branch `redesign` (local only, nothing pushed).
2. Dependency alignment + FileSystem legacy import; confirm `tsc` clean. *(checkpoint: app boots in Metro/tsc)*
3. Tests for existing utils first (pin current behaviour), then B-8 parser upgrade.
4. `theme/` + base components.
5. `useVehicleStore` hook (storage, SecureStore migration, load order).
6. `ControlScreen` + sheet + cards; slim `App.tsx`.
7. Lint, typecheck, unit tests.
8. Build APK (Phase 4) and test on emulator if one can be created (blocked on JDK / AVD decisions — see audit Q-6, Q-7).
9. Final report.
