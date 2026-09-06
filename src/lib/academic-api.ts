import { AcademicAPIResponse } from "@/types";

const API_URL = "https://sivireno.undc.edu.pe/tiger/consulta/con_searchEstudiante.php";

export async function buscarEstudiante(codigo: string): Promise<AcademicAPIResponse | null> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        opcion: 7,
        buscador: codigo,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status}`);
    }

    const data: AcademicAPIResponse[] = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    // Buscar coincidencia exacta por código
    const estudiante = data.find((e) => e.cod_estu === codigo);
    return estudiante || null;
  } catch (error) {
    console.error("Error al consultar API académica:", error);
    return null;
  }
}
