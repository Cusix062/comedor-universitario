export interface Estudiante {
  id: number;
  codigo: string;
  nombre: string;
  correo: string;
  ciclo: number;
  telefono: string;
  fecha_registro: string;
}

export interface Cupo {
  id: number;
  fecha: string;
  tipo: "almuerzo" | "cena";
  capacidad: number;
  ocupados: number;
  estado: "abierto" | "cerrado" | "pausado";
}

export interface Inscripcion {
  id: number;
  estudiante_id: number;
  cupo_id: number;
  numero_orden: number;
  estado: "reservado" | "atendido" | "cancelado";
  fecha_hora: string;
  estudiante?: Estudiante;
  cupo?: Cupo;
}

export interface Admin {
  id: number;
  usuario: string;
  password_hash: string;
}

export interface AcademicAPIResponse {
  id_estu: string;
  nivel: string;
  cod_estu: string;
  estudiante: string;
  egreso: string;
}

export interface TurnoConfig {
  fecha: string;
  almuerzo_capacidad: number;
  cena_capacidad: number;
}

export type TipoTurno = "almuerzo" | "cena";
