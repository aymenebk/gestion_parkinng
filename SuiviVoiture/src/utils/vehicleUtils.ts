import CryptoJS from "crypto-js";
import { Vehicle } from "../types";

export function decryptAES(ciphertext: string, key: string): string {
  const decrypted = CryptoJS.AES.decrypt(ciphertext.trim(), key);
  const result = decrypted.toString(CryptoJS.enc.Utf8);
  if (!result || result.length < 5) throw new Error("Cle incorrecte");
  return result;
}

const HEADER_NAMES = ["macaron", "matricule", "modele", "modèle", "marque", "couleur", "bloc", "telephone", "téléphone"];

/** Splits one CSV line, honouring "quoted, fields" and doubled quotes. */
function splitLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out.map(p => p.trim().replace(/^'|'$/g, ""));
}

/** Parses the 7-column vehicle CSV (header optional, `,` or `;`). Rows with fewer than 7 fields are counted in `skipped`. */
export function parseCSVWithStats(text: string): { vehicles: Vehicle[]; skipped: number } {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return { vehicles: [], skipped: 0 };
  const sep = lines[0].includes(";") ? ";" : ",";
  const first = splitLine(lines[0], sep);
  const isHeader =
    HEADER_NAMES.includes((first[0] || "").toLowerCase()) ||
    HEADER_NAMES.includes((first[1] || "").toLowerCase()) ||
    (first.length >= 7 && !/\d/.test(first[6]));
  const dataLines = isHeader ? lines.slice(1) : lines;
  const vehicles: Vehicle[] = [];
  let skipped = 0;
  for (const line of dataLines) {
    const p = splitLine(line, sep);
    if (p.length < 7) { skipped++; continue; }
    vehicles.push({ macaron: p[0], matricule: p[1], modele: p[2], marque: p[3], couleur: p[4], bloc: p[5], telephone: p[6] });
  }
  return { vehicles, skipped };
}

export function parseCSV(text: string): Vehicle[] {
  return parseCSVWithStats(text).vehicles;
}

const normalizeId = (s: string) => s.toUpperCase().replace(/\s/g, "");

export function searchVehicle(vehicles: Vehicle[], query: string): Vehicle | undefined {
  const q = normalizeId(query);
  return vehicles.find(v => normalizeId(v.macaron) === q || normalizeId(v.matricule) === q);
}

export function getCarColor(colorName: string): string {
  const map: Record<string, string> = {
    "blanc":"#dcdcdc","blanche":"#dcdcdc","white":"#dcdcdc",
    "noir":"#263238","noire":"#263238","black":"#263238",
    "rouge":"#ff0000","red":"#ff0000",
    "bleu":"#1565c0","bleue":"#1565c0","blue":"#1565c0",
    "vert":"#2e7d32","verte":"#2e7d32","green":"#2e7d32",
    "gris":"#969696","grise":"#969696","grey":"#969696","gray":"#969696",
    "jaune":"#ffff00","yellow":"#ffff00",
    "orange":"#e65100",
    "argent":"#b0bec5","silver":"#b0bec5",
    "marron":"#5d4037","brown":"#5d4037",
    "beige":"#d7ccc8","bordeaux":"#880e4f","grenat":"#880e4f",
    "violet":"#6a1b9a","purple":"#6a1b9a",
    "rose":"#ad1457","pink":"#ad1457",
    "أبيض":"#dcdcdc","أسود":"#263238","أحمر":"#ff0000",
    "أزرق":"#1565c0","أخضر":"#2e7d32","رمادي":"#969696",
    "أصفر":"#ffff00","برتقالي":"#e65100","فضي":"#b0bec5",
    "بني":"#5d4037","بيج":"#d7ccc8","بنفسجي":"#6a1b9a",
    "وردي":"#ad1457","عقيق":"#880e4f",
  };
  return map[(colorName||"").toLowerCase().trim()] || "#78909c";
}

export function getTextColorForBg(hexColor: string): string {
  const r = parseInt(hexColor.slice(1,3),16);
  const g = parseInt(hexColor.slice(3,5),16);
  const b = parseInt(hexColor.slice(5,7),16);
  return (0.299*r + 0.587*g + 0.114*b)/255 > 0.5 ? "#1a1a2e" : "#ffffff";
}

export function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#",""),16);
  const R = Math.min(255,Math.max(0,(num>>16)+Math.round(255*percent/100)));
  const G = Math.min(255,Math.max(0,((num>>8)&0xff)+Math.round(255*percent/100)));
  const B = Math.min(255,Math.max(0,(num&0xff)+Math.round(255*percent/100)));
  return "#"+[R,G,B].map(v=>v.toString(16).padStart(2,"0")).join("");
}
