import json, sqlite3

data = json.load(open('data/beneficiarios.json', 'r', encoding='utf-8'))
db = sqlite3.connect('data/comedor.db')

db.execute('DELETE FROM beneficiarios')

for nombre in data['almuerzo']:
    db.execute('INSERT INTO beneficiarios (nombre, carrera, ciclo_grupo, turno) VALUES (?, ?, ?, ?)', 
               (nombre.strip(), 'INGENIERIA DE SISTEMAS', 'BENEFICIARIO', 'almuerzo'))
for nombre in data['cena']:
    db.execute('INSERT INTO beneficiarios (nombre, carrera, ciclo_grupo, turno) VALUES (?, ?, ?, ?)', 
               (nombre.strip(), 'INGENIERIA DE SISTEMAS', 'BENEFICIARIO', 'cena'))
db.commit()

total = db.execute('SELECT COUNT(*) FROM beneficiarios').fetchone()[0]
print(f'Total cargados: {total}')

rows = db.execute('SELECT id, nombre, turno FROM beneficiarios LIMIT 5').fetchall()
for r in rows:
    print(f'  {r[0]}: [{r[2]}] {repr(r[1])}')

# Test matching
test_name = 'HERNANDEZ CUSI JORGE JAIR'
test2 = 'TTURUCO BOLAÑOS ARNY YOMAR'
test3 = 'GALVEZ RODRIGUEZ MARCO JOSEPHY'

import unicodedata
def normalize(s):
    s = s.strip().upper()
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.replace('N', 'N').replace('Ñ', 'N')
    import re
    s = re.sub(r'[^A-Z\s]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

for test in [test_name, test2, test3]:
    norm_test = normalize(test)
    all_benef = db.execute('SELECT nombre FROM beneficiarios WHERE turno = ?', ('almuerzo',)).fetchall()
    found = False
    for b in all_benef:
        norm_db = normalize(b[0])
        if norm_test == norm_db:
            found = True
            break
    print(f'  Test "{test}" -> normalized: "{norm_test}" -> found: {found}')
