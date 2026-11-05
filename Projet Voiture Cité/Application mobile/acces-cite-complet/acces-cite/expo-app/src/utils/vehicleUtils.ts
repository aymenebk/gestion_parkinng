import CryptoJS from 'crypto-js';
import { Vehicle } from '../types';

/**
 * Déchiffre un texte chiffré avec CryptoJS.AES.encrypt(text, passphrase)
 * Compatible avec le format OpenSSL Salted__
 */
export function decryptAES(ciphertext: string, passphrase: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(ciphertext.trim(), passphrase);
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    if (!result || result.length < 3) throw new Error('Clé incorrecte ou fichier corrompu');
    return result;
  } catch (e) {
    throw new Error('Déchiffrement échoué: ' + (e as Error).message);
  }
}

/**
 * Parse un CSV (séparateur , ou ;) en tableau de Vehicle
 * Format attendu: macaron, matricule, modele, marque, couleur, bloc, telephone
 */
export function parseCSV(text: string): Vehicle[] {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) throw new Error('CSV vide ou incomplet');

  const sep = lines[0].includes(';') ? ';' : ',';

  // Détecter et ignorer l'en-tête
  const firstField = lines[0].split(sep)[0].trim().toLowerCase();
  const hasHeader = isNaN(Number(firstField)) && !/^\d/.test(firstField);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  if (dataLines.length === 0) throw new Error('Aucune donnée dans le CSV');

  const vehicles: Vehicle[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    // Gérer les champs avec guillemets
    const parts = splitCSVLine(line, sep);
    if (parts.length < 7) continue;

    vehicles.push({
      macaron:   parts[0].trim(),
      matricule: parts[1].trim(),
      modele:    parts[2].trim(),
      marque:    parts[3].trim(),
      couleur:   parts[4].trim(),
      bloc:      parts[5].trim(),
      telephone: parts[6].trim(),
    });
  }

  if (vehicles.length === 0) throw new Error('Aucun véhicule valide trouvé');
  return vehicles;
}

function splitCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === sep && !inQuotes) {
      result.push(current.replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.replace(/^["']|["']$/g, ''));
  return result;
}

/**
 * Recherche un véhicule par matricule ou macaron (insensible à la casse et aux espaces)
 */
export function searchVehicle(vehicles: Vehicle[], query: string): Vehicle | undefined {
  const q = query.toUpperCase().replace(/\s+/g, '');
  return vehicles.find(v =>
    v.macaron.toUpperCase().replace(/\s+/g, '') === q ||
    v.matricule.toUpperCase().replace(/\s+/g, '') === q
  );
}

/**
 * Convertit un nom de couleur en code hexadécimal
 */
export function getCarColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    // Français
    'blanc': '#ECEFF1', 'blanche': '#ECEFF1',
    'noir': '#263238', 'noire': '#263238',
    'rouge': '#C62828',
    'bleu': '#1565C0', 'bleue': '#1565C0',
    'vert': '#2E7D32', 'verte': '#2E7D32',
    'gris': '#607D8B', 'grise': '#607D8B',
    'jaune': '#F9A825',
    'orange': '#E65100',
    'argent': '#B0BEC5', 'argenté': '#B0BEC5',
    'marron': '#5D4037',
    'beige': '#D7CCC8',
    'violet': '#6A1B9A', 'violette': '#6A1B9A',
    'rose': '#AD1457',
    'bordeaux': '#880E4F', 'bourgogne': '#880E4F',
    'kaki': '#827717',
    'crème': '#FFF8E1', 'creme': '#FFF8E1',
    // English
    'white': '#ECEFF1', 'black': '#263238', 'red': '#C62828',
    'blue': '#1565C0', 'green': '#2E7D32', 'grey': '#607D8B',
    'gray': '#607D8B', 'yellow': '#F9A825', 'silver': '#B0BEC5',
    'brown': '#5D4037', 'purple': '#6A1B9A', 'pink': '#AD1457',
    // Arabe
    'أبيض': '#ECEFF1', 'أسود': '#263238', 'أحمر': '#C62828',
    'أزرق': '#1565C0', 'أخضر': '#2E7D32', 'رمادي': '#607D8B',
    'أصفر': '#F9A825', 'برتقالي': '#E65100', 'فضي': '#B0BEC5',
    'بني': '#5D4037', 'بيج': '#D7CCC8', 'بنفسجي': '#6A1B9A',
    'وردي': '#AD1457', 'أبيض فاتح': '#ECEFF1',
  };

  const key = colorName.toLowerCase().trim();
  return colorMap[key] ?? '#78909C';
}

/**
 * Détermine si le texte doit être blanc ou sombre sur un fond coloré
 */
export function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#1A1A2E' : '#FFFFFF';
}

/**
 * Assombrit ou éclaircit une couleur hex
 */
export function shadeColor(hexColor: string, percent: number): string {
  const num = parseInt(hexColor.replace('#', ''), 16);
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  const amt = Math.round(255 * percent / 100);
  const R = clamp((num >> 16) + amt);
  const G = clamp(((num >> 8) & 0xff) + amt);
  const B = clamp((num & 0xff) + amt);
  return '#' + [R, G, B].map(v => v.toString(16).padStart(2, '0')).join('');
}
