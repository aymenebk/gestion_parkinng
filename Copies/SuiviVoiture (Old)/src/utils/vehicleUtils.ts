import CryptoJS from "crypto-js";
import { Vehicle } from "../types";

export function decryptAES(ciphertext: string, key: string): string {
  const decrypted = CryptoJS.AES.decrypt(ciphertext.trim(), key);
  const result = decrypted.toString(CryptoJS.enc.Utf8);
  if (!result || result.length < 5) throw new Error("Cle incorrecte");
  return result;
}

export function parseCSV(text: string): Vehicle[] {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const firstField = lines[0].split(sep)[0].trim().toLowerCase();
  const isHeader = isNaN(Number(firstField)) && !firstField.match(/^\d/);
  const dataLines = isHeader ? lines.slice(1) : lines;
  return dataLines.map(line => {
    const parts = line.split(sep).map(p => p.trim().replace(/^["\x27]|["\x27]$/g, ""));
    if (parts.length < 7) return null;
    return { macaron: parts[0], matricule: parts[1], modele: parts[2], marque: parts[3], couleur: parts[4], bloc: parts[5], telephone: parts[6] };
  }).filter(Boolean) as Vehicle[];
}

export function searchVehicle(vehicles: Vehicle[], query: string): Vehicle | undefined {
  const q = query.toUpperCase().replace(/\s/g, "");
  return vehicles.find(v =>
    v.macaron.toUpperCase().replace(/\s/g,"") === q ||
    v.matricule.toUpperCase().replace(/\s/g,"") === q
  );
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
    "\u0623\u0628\u064a\u0636":"#dcdcdc","\u0623\u0633\u0648\u062f":"#263238","\u0623\u062d\u0645\u0631":"#ff0000",
    "\u0623\u0632\u0631\u0642":"#1565c0","\u0623\u062e\u0636\u0631":"#2e7d32","\u0631\u0645\u0627\u062f\u064a":"#969696",
    "\u0623\u0635\u0641\u0631":"#ffff00","\u0628\u0631\u062a\u0642\u0627\u0644\u064a":"#e65100","\u0641\u0636\u064a":"#b0bec5",
    "\u0628\u0646\u064a":"#5d4037","\u0628\u064a\u062c":"#d7ccc8","\u0628\u0646\u0641\u0633\u062c\u064a":"#6a1b9a",
    "\u0648\u0631\u062f\u064a":"#ad1457","\u0639\u0642\u064a\u0642":"#880e4f",
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