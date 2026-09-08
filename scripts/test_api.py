import json, urllib.request

url = 'https://sivireno.undc.edu.pe/tiger/consulta/con_searchEstudiante.php'

# Probar los dos códigos de referencia
codigos = ['2521080092', '2521010136']

for codigo in codigos:
    data = json.dumps({'opcion': 7, 'buscador': codigo}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    response = urllib.request.urlopen(req, timeout=10)
    result = json.loads(response.read().decode('utf-8'))
    
    if isinstance(result, list) and len(result) > 0:
        r = result[0]
        print(f"Codigo: {r['cod_estu']}")
        print(f"  Nombre: {r['estudiante']}")
        print(f"  Nivel: {r['nivel']}")
        print(f"  Egreso: {r['egreso']}")
        print()

# Ahora buscar todos los 2521
print("=== BUSCANDO TODOS LOS 2521 ===")
data = json.dumps({'opcion': 7, 'buscador': '2521'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
response = urllib.request.urlopen(req, timeout=10)
result = json.loads(response.read().decode('utf-8'))

filtrados = [r for r in result if r['cod_estu'].startswith('2521')]
filtrados.sort(key=lambda x: x['cod_estu'])

print(f"Total 2521: {len(filtrados)}")
print()

# Analizar grupos
grupos = {}
for r in filtrados:
    cod = r['cod_estu']
    grupo = cod[4:6]
    if grupo not in grupos:
        grupos[grupo] = []
    grupos[grupo].append(cod)

print("=== GRUPOS ENCONTRADOS 2521 ===")
for g in sorted(grupos.keys()):
    print(f"  Grupo {g}: {len(grupos[g])} estudiantes (ej: {grupos[g][0]})")

print()
print("=== PRIMEROS Y ULTIMOS POR GRUPO ===")
for g in sorted(grupos.keys())[:3]:
    print(f"\nGrupo {g}:")
    for cod in grupos[g][:3]:
        print(f"  {cod}")
