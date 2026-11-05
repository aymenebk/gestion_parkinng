Installer  Visual Studio Code x64
Installer Python

# Vérifier que python est bien installé
python --version

# Installer le module de cryptographie
python -m pip install pycryptodome

Important : Une fois l'installation terminée, vous devez fermer complètement votre fenêtre PowerShell et en ouvrir une nouvelle pour que Windows prenne en compte les nouveaux chemins d'accès. Votre commande python -m pip install pycryptodome fonctionnera alors sans problème.

# Chiffrer la liste vehicules.csv avec le mot de passe "votre-cle-secrete-123"
python encrypt_csv.py --input vehicules.csv --key "votre-cle-secrete-123" --output vehicules.enc