#!/usr/bin/env python3
"""
Outil de génération et chiffrement du fichier CSV véhicules
Usage:
  python3 encrypt_csv.py --input vehicules.csv --key "ma-cle-secrete" --output vehicules.enc
  python3 encrypt_csv.py --generate --key "ma-cle-secrete" --output vehicules.enc
"""
import argparse
import base64
import sys

def aes_encrypt_compatible(plaintext: str, passphrase: str) -> str:
    """
    Chiffrement compatible CryptoJS.AES.encrypt(text, passphrase)
    CryptoJS utilise OpenSSL EVP_BytesToKey avec MD5 pour dériver clé+IV
    """
    try:
        from Crypto.Cipher import AES
        from Crypto.Hash import MD5
        import os

        salt = os.urandom(8)
        passphrase_bytes = passphrase.encode('utf-8')
        data_bytes = plaintext.encode('utf-8')

        # EVP_BytesToKey: dériver clé AES-256 + IV-128
        d = b''
        d_i = b''
        while len(d) < 48:  # 32 (clé) + 16 (IV)
            d_i = MD5.new(d_i + passphrase_bytes + salt).digest()
            d += d_i

        key = d[:32]
        iv  = d[32:48]

        # Padding PKCS7
        block_size = 16
        pad_len = block_size - (len(data_bytes) % block_size)
        data_padded = data_bytes + bytes([pad_len] * pad_len)

        cipher = AES.new(key, AES.MODE_CBC, iv)
        encrypted = cipher.encrypt(data_padded)

        # Format OpenSSL: "Salted__" + salt + ciphertext
        salted = b'Salted__' + salt + encrypted
        return base64.b64encode(salted).decode('utf-8')

    except ImportError:
        print("ERREUR: pycryptodome requis. Installez avec: pip install pycryptodome")
        sys.exit(1)

def generate_sample_csv() -> str:
    """Génère un CSV exemple avec des véhicules fictifs"""
    header = "macaron,matricule,modele,marque,couleur,bloc,telephone"
    rows = [
        "M-0001,12345-001-16,Clio IV,Renault,Rouge,A,0555 12 34 56",
        "M-0002,67890-002-23,Polo 6,Volkswagen,Blanc,B,0666 23 45 67",
        "M-0003,11111-003-20,308 SW,Peugeot,Bleu,C,0770 34 56 78",
        "M-0004,22222-004-19,Duster,Dacia,Gris,A,0555 12 34 56",
        "M-0005,33333-005-21,Symbol,Renault,Noir,D,0661 45 67 89",
        "M-0006,44444-006-22,Logan,Dacia,Vert,B,0666 23 45 67",
        "M-0007,55555-007-18,Megane III,Renault,Argent,E,0550 56 78 90",
        "M-0008,66666-008-24,Tiggo 4,Chery,Beige,C,0770 34 56 78",
        "M-0009,77777-009-20,508,Peugeot,Bordeaux,F,0557 67 89 01",
        "M-0010,88888-010-22,Yaris,Toyota,Jaune,A,0555 12 34 56",
        "M-0011,99999-011-19,Corsa,Opel,Orange,G,0662 78 90 12",
        "M-0012,10101-012-23,Rio,Kia,Marron,D,0661 45 67 89",
    ]
    return header + "\n" + "\n".join(rows)

def main():
    parser = argparse.ArgumentParser(
        description='Chiffrement AES de fichiers CSV pour contrôle d\'accès cité'
    )
    parser.add_argument('--input', '-i', help='Fichier CSV d\'entrée')
    parser.add_argument('--output', '-o', default='vehicules.enc', help='Fichier chiffré de sortie')
    parser.add_argument('--key', '-k', required=True, help='Clé de chiffrement AES')
    parser.add_argument('--generate', '-g', action='store_true',
                        help='Générer un CSV exemple au lieu d\'un fichier d\'entrée')
    parser.add_argument('--decrypt', '-d', action='store_true',
                        help='Mode déchiffrement: convertit .enc vers CSV')

    args = parser.parse_args()

    if args.decrypt:
        # Mode déchiffrement
        if not args.input:
            print("ERREUR: --input requis pour le déchiffrement")
            sys.exit(1)
        with open(args.input, 'r', encoding='utf-8') as f:
            encrypted = f.read().strip()
        csv_text = aes_decrypt(encrypted, args.key)
        out_file = args.output.replace('.enc', '.csv') if '.enc' in args.output else args.output + '.csv'
        with open(out_file, 'w', encoding='utf-8') as f:
            f.write(csv_text)
        print(f"✓ Déchiffré → {out_file}")
        return

    # Mode chiffrement
    if args.generate:
        csv_text = generate_sample_csv()
        print("✓ CSV exemple généré (12 véhicules)")
    elif args.input:
        with open(args.input, 'r', encoding='utf-8') as f:
            csv_text = f.read()
        print(f"✓ CSV lu: {args.input}")
    else:
        print("ERREUR: Spécifiez --input ou utilisez --generate")
        sys.exit(1)

    # Compter les lignes
    lines = [l for l in csv_text.split('\n') if l.strip()]
    data_lines = len(lines) - 1  # moins l'en-tête
    print(f"  {data_lines} véhicule(s) à chiffrer")

    # Chiffrer
    encrypted = aes_encrypt_compatible(csv_text, args.key)

    with open(args.output, 'w', encoding='utf-8') as f:
        f.write(encrypted)

    print(f"✓ Fichier chiffré → {args.output}")
    print(f"  Clé utilisée: {args.key}")
    print(f"  Taille: {len(encrypted)} octets")
    print()
    print("Pour tester dans l'application:")
    print(f"  1. Importez le fichier: {args.output}")
    print(f"  2. Entrez la clé: {args.key}")
    print()
    print("Matricules de test (si --generate utilisé):")
    print("  M-0001, M-0002, ..., M-0012")
    print("  12345-001-16, 67890-002-23, ...")

if __name__ == '__main__':
    main()
