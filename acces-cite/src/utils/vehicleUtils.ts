import CryptoJS from 'crypto-js';
import { Vehicle } from './types';

export function decryptAES(ciphertext: string, passphrase: string): string {
  const decrypted = CryptoJS.AES.decrypt(ciphertext.trim(), passphrase);
  const result = decrypted.toString(CryptoJS.enc.Utf8);
  if (!result || result.length < 3) throw new Error('Cle incorrecte');
  return result;
}

export function parseCSV(text: string): Vehicle[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) throw new Error('CSV vide');
  const sep = lines[0].includes(';') ? ';' : ',';
  const firstField = lines[0].split(sep)[0].trim().toLowerCase();
  const hasHeader = isNaN(Number(firstField)) && !/^\d/.test(firstField);
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const vehicles: Vehicle[] = [];
  for (const line of dataLines) {
    if (!line.trim()) continue;
    const parts = line.split(sep).map(p => p.trim().replace(/^[\"']|[\"']$/g, ''));
    if (parts.length < 7) continue;
    vehicles.push({
      macaron:   parts[0],
      matricule: parts[1],
      modele:    parts[2],
      marque:    parts[3],
      couleur:   parts[4],
      bloc:      parts[5],
      telephone: parts[6],
    });
  }
  if (vehicles.length === 0) throw new Error('Aucun vehicule trouve');
  return vehicles;
}

export function searchVehicle(vehicles: Vehicle[], query: string): Vehicle | undefined {
  const q = query.toUpperCase().replace(/\s+/g, '');
  return vehicles.find(v =>
    v.macaron.toUpperCase().replace(/\s+/g, '') === q ||
    v.matricule.toUpperCase().replace(/\s+/g, '') === q
  );
}

export function getCarColorHex(colorName: string): string {
  const map: Record<string, string> = {
    'blanc': '#ECEFF1', 'blanche': '#ECEFF1', 'white': '#ECEFF1',
    'noir': '#263238', 'noire': '#263238', 'black': '#263238',
    'rouge': '#C62828', 'red': '#C62828',
    'bleu': '#1565C0', 'bleue': '#1565C0', 'blue': '#1565C0',
    'vert': '#2E7D32', 'verte': '#2E7D32', 'green': '#2E7D32',
    'gris': '#607D8B', 'grise': '#607D8B', 'grey': '#607D8B', 'gray': '#607D8B',
    'jaune': '#F9A825', 'yellow': '#F9A825',
    'orange': '#E65100',
    'argent': '#B0BEC5', 'argente': '#B0BEC5', 'silver': '#B0BEC5',
    'marron': '#5D4037', 'brown': '#5D4037',
    'beige': '#D7CCC8',
    'bordeaux': '#880E4F',
    'violet': '#6A1B9A', 'violette': '#6A1B9A', 'purple': '#6A1B9A',
    'rose': '#AD1457', 'pink': '#AD1457',
    'blanc casse': '#F5F5DC', 'creme': '#FFFDE7',
    'أبيض': '#ECEFF1', 'أسود': '#263238', 'أحمر': '#C62828',
    'أزرق': '#1565C0', 'أخضر': '#2E7D32', 'رمادي': '#607D8B',
    'أصفر': '#F9A825', 'برتقالي': '#E65100', 'فضي': '#B0BEC5',
    'بني': '#5D4037', 'بيج': '#D7CCC8', 'بنفسجي': '#6A1B9A',
    'وردي': '#AD1457',
  };
  return map[colorName.toLowerCase().trim()] ?? '#78909C';
}

export function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  const amt = Math.round(255 * percent / 100);
  const R = clamp((num >> 16) + amt);
  const G = clamp(((num >> 8) & 0xff) + amt);
  const B = clamp((num & 0xff) + amt);
  return '#' + [R, G, B].map(v => v.toString(16).padStart(2, '0')).join('');
}

export function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1A1A2E' : '#FFFFFF';
}
