import sqlite3

db = sqlite3.connect('data/comedor.db')

# Tablas
cursor = db.execute("SELECT name FROM sqlite_master WHERE type='table'")
tablas = [r[0] for r in cursor.fetchall()]
print("TABLAS:", tablas)

# Columnas de cada tabla
for tabla in tablas:
    cursor = db.execute(f"PRAGMA table_info({tabla})")
    columnas = [(r[1], r[2]) for r in cursor.fetchall()]
    print(f"\n{tabla}:")
    for col, tipo in columnas:
        print(f"  {col} ({tipo})")

# Contar registros
print("\n=== REGISTROS ===")
for tabla in tablas:
    count = db.execute(f"SELECT COUNT(*) FROM {tabla}").fetchone()[0]
    print(f"  {tabla}: {count}")
