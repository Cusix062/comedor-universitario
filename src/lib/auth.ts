export interface Session {
  tipo: "estudiante" | "admin";
  id: number;
  usuario: string;
}
