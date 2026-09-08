// Mapeo de ciclo según año de ingreso (Ingeniería de Sistemas - escuela 11)
// 22 para atrás = 10° (X)
const CICLOS_POR_ANIO: Record<string, { ciclo: number; romano: string }> = {
  "22": { ciclo: 10, romano: "X" },
  "23": { ciclo: 8, romano: "VIII" },
  "24": { ciclo: 6, romano: "VI" },
  "25": { ciclo: 4, romano: "IV" },  // Default primer semestre
  "26": { ciclo: 2, romano: "II" },
};

// Grupos del 2° semestre 2025 (ingreso julio 2025) → 3° ciclo
const GRUPOS_SEGUNDO_SEMESTRE_2025 = ["08", "09", "10", "11", "12", "13", "14", "15"];

/**
 * Calcula el ciclo del estudiante basado en su código
 * @param codigo - Código del estudiante (ej: 2611010122)
 * @returns Objeto con ciclo numérico y romano, o null si no se puede determinar
 */
export function calcularCiclo(codigo: string): { ciclo: number; romano: string } | null {
  // Extraer los primeros 2 dígitos (año) y posiciones 4-5 (grupo)
  const anio = codigo.substring(0, 2);
  const escuela = codigo.substring(2, 4);
  const grupo = codigo.substring(4, 6);

  // Si es código de 22 para atrás, retorna 10° (X)
  if (anio <= "22") {
    return CICLOS_POR_ANIO["22"];
  }

  // Caso especial: 2025 tiene 2 semestres
  if (anio === "25") {
    // 2521 = Ingresantes 2° semestre (julio 2025) → 3° ciclo (III)
    if (escuela === "21") {
      return { ciclo: 3, romano: "III" };
    }
    // 2511 con grupos 08-15 = 2° semestre → 3° ciclo (III)
    if (escuela === "11" && GRUPOS_SEGUNDO_SEMESTRE_2025.includes(grupo)) {
      return { ciclo: 3, romano: "III" };
    }
    // 2511 con grupos 01-07 = 1° semestre → 4° ciclo (IV)
    return CICLOS_POR_ANIO["25"];
  }

  // Buscar en el mapeo para otros años
  const cicloInfo = CICLOS_POR_ANIO[anio];
  if (cicloInfo) {
    return cicloInfo;
  }

  // Si no se reconoce el año, retornar null
  return null;
}

/**
 * Obtiene solo el número de ciclo
 */
export function getCicloNumero(codigo: string): number {
  const ciclo = calcularCiclo(codigo);
  return ciclo ? ciclo.ciclo : 1;
}

/**
 * Obtiene solo el romano del ciclo
 */
export function getCicloRomano(codigo: string): string {
  const ciclo = calcularCiclo(codigo);
  return ciclo ? ciclo.romano : "I";
}

/**
 * Convierte número de ciclo a romano para mostrar en UI
 */
export function cicloARomano(ciclo: number): string {
  const romanos: Record<number, string> = {
    1: "I", 2: "II", 3: "III", 4: "IV", 5: "V",
    6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X",
    11: "XI", 12: "XII"
  };
  return romanos[ciclo] || ciclo.toString();
}
