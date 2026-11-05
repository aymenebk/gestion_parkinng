import CryptoJS from "crypto-js";
import {
  decryptAES, parseCSV, parseCSVWithStats, searchVehicle,
  getCarColor, getTextColorForBg, shadeColor,
} from "../utils/vehicleUtils";

const SAMPLE = [
  "macaron,matricule,modele,marque,couleur,bloc,telephone",
  "M-0001,12345-001-16,Clio IV,Renault,Rouge,A,0555 12 34 56",
  "M-0002,67890-002-23,Polo 6,Volkswagen,Blanc,B,0666 23 45 67",
].join("\n");

describe("decryptAES", () => {
  it("round-trips a CryptoJS passphrase-encrypted CSV (same format as encrypt_csv.py)", () => {
    const enc = CryptoJS.AES.encrypt(SAMPLE, "secret-key").toString();
    expect(decryptAES(enc, "secret-key")).toBe(SAMPLE);
  });
  it("tolerates surrounding whitespace/newlines in the file", () => {
    const enc = CryptoJS.AES.encrypt(SAMPLE, "k").toString();
    expect(decryptAES("\n" + enc + "\n", "k")).toBe(SAMPLE);
  });
  it("throws on a wrong password", () => {
    const enc = CryptoJS.AES.encrypt(SAMPLE, "good").toString();
    expect(() => decryptAES(enc, "bad")).toThrow();
  });
});

describe("parseCSV", () => {
  it("parses a file with header (comma)", () => {
    const v = parseCSV(SAMPLE);
    expect(v).toHaveLength(2);
    expect(v[0]).toEqual({
      macaron: "M-0001", matricule: "12345-001-16", modele: "Clio IV",
      marque: "Renault", couleur: "Rouge", bloc: "A", telephone: "0555 12 34 56",
    });
  });
  it("supports ';' separator and CRLF line endings", () => {
    const v = parseCSV(SAMPLE.replace(/,/g, ";").replace(/\n/g, "\r\n"));
    expect(v).toHaveLength(2);
    expect(v[1].marque).toBe("Volkswagen");
  });
  it("keeps the first row when there is no header, even if the macaron is not numeric", () => {
    const v = parseCSV(SAMPLE.split("\n").slice(1).join("\n"));
    expect(v).toHaveLength(2);
    expect(v[0].macaron).toBe("M-0001");
  });
  it("keeps the first row when there is no header and the macaron is numeric", () => {
    const v = parseCSV("1001,12345-001-16,Clio,Renault,Rouge,A,0555\n1002,222,Polo,VW,Blanc,B,0666");
    expect(v).toHaveLength(2);
  });
  it("handles quoted fields containing the separator", () => {
    const v = parseCSV('macaron,matricule,modele,marque,couleur,bloc,telephone\nM-1,111,"Clio, RS",Renault,Rouge,A,0555');
    expect(v[0].modele).toBe("Clio, RS");
  });
  it("skips short rows and reports them", () => {
    const r = parseCSVWithStats(SAMPLE + "\nbroken,row");
    expect(r.vehicles).toHaveLength(2);
    expect(r.skipped).toBe(1);
  });
  it("returns [] for empty or header-only input", () => {
    expect(parseCSV("")).toEqual([]);
    expect(parseCSV("macaron,matricule,modele,marque,couleur,bloc,telephone")).toEqual([]);
  });
});

describe("searchVehicle", () => {
  const list = parseCSV(SAMPLE);
  it("matches macaron or matricule, case- and space-insensitive", () => {
    expect(searchVehicle(list, "m-0001")?.bloc).toBe("A");
    expect(searchVehicle(list, " 67890 - 002-23".replace(/ - /g, "-"))?.bloc).toBe("B");
    expect(searchVehicle(list, "m - 0002".replace(/ - /g, "-"))?.bloc).toBe("B");
  });
  it("is exact-match only (as in the PWA)", () => {
    expect(searchVehicle(list, "1234")).toBeUndefined();
    expect(searchVehicle(list, "M-000")).toBeUndefined();
  });
});

describe("colour helpers", () => {
  it("maps FR/EN/AR names and falls back to grey", () => {
    expect(getCarColor("Rouge")).toBe("#ff0000");
    expect(getCarColor(" blue ")).toBe("#1565c0");
    expect(getCarColor("أسود")).toBe("#263238");
    expect(getCarColor("inconnue")).toBe("#78909c");
    expect(getCarColor("")).toBe("#78909c");
  });
  it("picks a readable text colour", () => {
    expect(getTextColorForBg("#ffffff")).toBe("#1a1a2e");
    expect(getTextColorForBg("#000000")).toBe("#ffffff");
  });
  it("shades and clamps", () => {
    expect(shadeColor("#000000", -50)).toBe("#000000");
    expect(shadeColor("#ffffff", 50)).toBe("#ffffff");
  });
});
