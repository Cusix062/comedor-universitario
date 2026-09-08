import sqlite3

# Mapeo de ciclos
CICLOS = {
    "22": {"ciclo": 10, "romano": "X"},
    "23": {"ciclo": 8, "romano": "VIII"},
    "24": {"ciclo": 6, "romano": "VI"},
    "25": {"ciclo": 4, "romano": "IV"},
    "26": {"ciclo": 2, "romano": "II"},
}

GRUPOS_2DO_SEMESTRE = ["08", "09", "10", "11", "12", "13", "14", "15"]

def calcular_ciclo(codigo):
    anio = codigo[:2]
    escuela = codigo[2:4]
    grupo = codigo[4:6]
    
    if anio <= "22":
        return CICLOS["22"]
    
    if anio == "25":
        if escuela == "21":
            return {"ciclo": 3, "romano": "III"}
        if escuela == "11" and grupo in GRUPOS_2DO_SEMESTRE:
            return {"ciclo": 3, "romano": "III"}
        return CICLOS["25"]
    
    return CICLOS.get(anio, None)

db = sqlite3.connect('data/comedor.db')
estudiantes = db.execute('SELECT id, codigo, nombre, ciclo FROM estudiantes ORDER BY codigo').fetchall()

print("=== ACTUALIZANDO CICLOS ===")
print()

for est in estudiantes:
    id_, codigo, nombre, ciclo_actual = est
    info = calcular_ciclo(codigo)
    if info:
        ciclo_calc = info['ciclo']
        romano = info['romano']
        if ciclo_actual != ciclo_calc:
            db.execute('UPDATE estudiantes SET ciclo = ? WHERE id = ?', (ciclo_calc, id_))
            print(f"ACTUALIZADO: {codigo} | {nombre} | {ciclo_actual} -> {ciclo_calc} ({romano})")
        else:
            print(f"OK: {codigo} | {nombre} | {ciclo_actual} ({romano})")
    else:
        print(f"SIN CICLO: {codigo} | {nombre}")

db.commit()

print()
print("=== ESTADO FINAL ===")
estudiantes = db.execute('SELECT codigo, nombre, ciclo FROM estudiantes ORDER BY codigo').fetchall()
for est in estudiantes:
    cod, nom, cic = est
    info = calcular_ciclo(cod)
    romano = info['romano'] if info else "?"
    print(f"{cod} | {nom} | {cic} ciclo ({romano})")
