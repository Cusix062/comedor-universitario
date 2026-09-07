"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Estudiante {
  id: number;
  codigo: string;
  nombre: string;
  correo: string;
  ciclo: number;
  suspensiones: Suspension[];
}

interface Suspension {
  id: number;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
}

export default function SuspensionesPage() {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Estudiante[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Formulario de suspension
  const [estudianteSel, setEstudianteSel] = useState<Estudiante | null>(null);
  const [tipoSuspension, setTipoSuspension] = useState<"almuerzo" | "cena" | "ambos">("ambos");
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split("T")[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split("T")[0]);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session");
    if (!adminSession) {
      router.push("/");
      return;
    }
  }, [router]);

  useEffect(() => {
    if (busqueda.length < 2) {
      setResultados([]);
      return;
    }

    const timer = setTimeout(() => {
      buscarEstudiantes();
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda]);

  const buscarEstudiantes = async () => {
    setCargando(true);
    try {
      const res = await fetch(`/api/admin/suspensiones?q=${encodeURIComponent(busqueda)}`);
      const data = await res.json();
      setResultados(data);
    } catch {
      console.error("Error");
    } finally {
      setCargando(false);
    }
  };

  const crearSuspension = async () => {
    if (!estudianteSel) return;

    setError("");
    setMensaje("");

    try {
      const res = await fetch("/api/admin/suspensiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estudiante_id: estudianteSel.id,
          tipo: tipoSuspension,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          motivo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear suspensión");
        return;
      }

      setMensaje(`Suspensión creada para ${estudianteSel.nombre}`);
      setEstudianteSel(null);
      setMotivo("");
      setFechaInicio(new Date().toISOString().split("T")[0]);
      setFechaFin(new Date().toISOString().split("T")[0]);
      setTipoSuspension("ambos");
      buscarEstudiantes();
    } catch {
      setError("Error de conexión");
    }
  };

  const eliminarSuspension = async (id: number) => {
    if (!confirm("¿Eliminar esta suspensión?")) return;

    try {
      const res = await fetch(`/api/admin/suspensiones?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMensaje("Suspensión eliminada");
        buscarEstudiantes();
        if (estudianteSel) {
          buscarEstudiantes();
        }
      }
    } catch {
      console.error("Error");
    }
  };

  const hoy = new Date().toISOString().split("T")[0];

  const getEstadoSuspension = (s: Suspension): { texto: string; color: string } => {
    if (s.fecha_inicio <= hoy && s.fecha_fin >= hoy) {
      return { texto: "Activa", color: "bg-red-100 text-red-700" };
    }
    if (s.fecha_inicio > hoy) {
      return { texto: "Programada", color: "bg-amber-100 text-amber-700" };
    }
    return { texto: "Vencida", color: "bg-gray-100 text-gray-500" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white shadow-lg" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">
              🚫
            </div>
            <div>
              <h1 className="text-lg font-bold">Gestión de Suspensiones</h1>
              <p className="text-gray-400 text-xs">Comedor Universitario</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition text-sm font-medium"
          >
            ← Volver
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-5">
        {mensaje && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-xl flex items-center gap-3">
            <span className="text-xl">✅</span>
            <span className="font-medium">{mensaje}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Buscador */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-sm">🔍</span>
            Buscar Estudiante
          </h2>
          <p className="text-sm text-gray-500 mb-3">Buscar por código universitario o nombre y apellido</p>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej: 2023001 o HERNANDEZ CUSI"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />
        </div>

        {/* Resultados */}
        {resultados.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">
              Resultados ({resultados.length})
            </h2>
            <div className="space-y-3">
              {resultados.map((est) => (
                <div
                  key={est.id}
                  className={`border rounded-xl p-4 transition-all ${
                    estudianteSel?.id === est.id
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800">{est.nombre}</p>
                      <p className="text-sm text-gray-500">Código: {est.codigo}</p>
                      <p className="text-xs text-gray-400">Correo: {est.correo}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEstudianteSel(est)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition"
                      >
                        🚫 Suspender
                      </button>
                    </div>
                  </div>

                  {/* Suspensiones existentes */}
                  {est.suspensiones.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-2">Suspensiones:</p>
                      <div className="space-y-2">
                        {est.suspensiones.map((s) => {
                          const estado = getEstadoSuspension(s);
                          return (
                            <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estado.color}`}>
                                  {estado.texto}
                                </span>
                                <span className="text-xs font-medium text-gray-700">
                                  {s.tipo === "ambos" ? "🍽️ Ambos" : s.tipo === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {s.fecha_inicio} al {s.fecha_fin}
                                </span>
                                {s.motivo && (
                                  <span className="text-xs text-gray-400 italic">({s.motivo})</span>
                                )}
                              </div>
                              <button
                                onClick={() => eliminarSuspension(s.id)}
                                className="text-red-500 hover:text-red-700 text-xs font-semibold"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {busqueda.length >= 2 && !cargando && resultados.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-400">No se encontraron estudiantes</p>
          </div>
        )}

        {/* Formulario de suspensión */}
        {estudianteSel && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-sm">🚫</span>
              Suspender a: {estudianteSel.nombre}
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de suspensión</label>
                <select
                  value={tipoSuspension}
                  onChange={(e) => setTipoSuspension(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="ambos">🍽️ Ambos turnos</option>
                  <option value="almuerzo">🥗 Solo Almuerzo</option>
                  <option value="cena">🌙 Solo Cena</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Conducta inadecuada"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  min={fechaInicio}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={crearSuspension}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                🚫 Aplicar Suspensión
              </button>
              <button
                onClick={() => setEstudianteSel(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
