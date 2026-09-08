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
  estudiante_id: number;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  codigo?: string;
  nombre?: string;
  correo?: string;
}

export default function SuspensionesPage() {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Estudiante[]>([]);
  const [suspendidos, setSuspendidos] = useState<Suspension[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Formulario
  const [estudianteSel, setEstudianteSel] = useState<Estudiante | null>(null);
  const [tipoSuspension, setTipoSuspension] = useState<"almuerzo" | "cena" | "ambos">("ambos");
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split("T")[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split("T")[0]);
  const [motivo, setMotivo] = useState("");

  // Edición
  const [editando, setEditando] = useState<Suspension | null>(null);
  const [editTipo, setEditTipo] = useState<"almuerzo" | "cena" | "ambos">("ambos");
  const [editInicio, setEditInicio] = useState("");
  const [editFin, setEditFin] = useState("");
  const [editMotivo, setEditMotivo] = useState("");

  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session");
    const googleAdmin = localStorage.getItem("google_admin_session");
    if (!adminSession && !googleAdmin) {
      fetch("/api/auth/session").then(r => r.json()).then(session => {
        if (session?.user?.isAdmin) {
          localStorage.setItem("google_admin_session", "true");
          cargarSuspendidos();
        } else {
          router.push("/");
        }
      }).catch(() => router.push("/"));
      return;
    }
    cargarSuspendidos();
  }, [router]);

  useEffect(() => {
    if (busqueda.length < 2) {
      setResultados([]);
      return;
    }
    const timer = setTimeout(() => buscarEstudiantes(), 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const cargarSuspendidos = async () => {
    try {
      const res = await fetch("/api/admin/suspensiones?activas=true");
      const data = await res.json();
      setSuspendidos(data);
    } catch {
      console.error("Error");
    }
  };

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
        setError(data.error || "Error al crear");
        return;
      }

      setMensaje(`Suspensión creada para ${estudianteSel.nombre}`);
      setEstudianteSel(null);
      resetForm();
      buscarEstudiantes();
      cargarSuspendidos();
    } catch {
      setError("Error de conexión");
    }
  };

  const abrirEdicion = (s: Suspension) => {
    setEditando(s);
    setEditTipo(s.tipo as any);
    setEditInicio(s.fecha_inicio);
    setEditFin(s.fecha_fin);
    setEditMotivo(s.motivo);
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    setError("");
    setMensaje("");

    try {
      const res = await fetch("/api/admin/suspensiones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editando.id,
          tipo: editTipo,
          fecha_inicio: editInicio,
          fecha_fin: editFin,
          motivo: editMotivo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al editar");
        return;
      }

      setMensaje("Suspensión actualizada");
      setEditando(null);
      cargarSuspendidos();
      if (busqueda.length >= 2) buscarEstudiantes();
    } catch {
      setError("Error de conexión");
    }
  };

  const eliminarSuspension = async (id: number) => {
    if (!confirm("¿Eliminar esta suspensión?")) return;
    try {
      const res = await fetch(`/api/admin/suspensiones?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMensaje("Suspensión eliminada");
        cargarSuspendidos();
        if (busqueda.length >= 2) buscarEstudiantes();
      }
    } catch {
      console.error("Error");
    }
  };

  const resetForm = () => {
    setTipoSuspension("ambos");
    setFechaInicio(new Date().toISOString().split("T")[0]);
    setFechaFin(new Date().toISOString().split("T")[0]);
    setMotivo("");
  };

  const hoy = new Date().toISOString().split("T")[0];

  const getEstado = (s: Suspension): { texto: string; color: string } => {
    if (s.fecha_inicio <= hoy && s.fecha_fin >= hoy) {
      return { texto: "Activa", color: "bg-red-100 text-red-700 border-red-200" };
    }
    if (s.fecha_inicio > hoy) {
      return { texto: "Programada", color: "bg-amber-100 text-amber-700 border-amber-200" };
    }
    return { texto: "Vencida", color: "bg-gray-100 text-gray-500 border-gray-200" };
  };

  const getTipoLabel = (tipo: string) => {
    if (tipo === "ambos") return "🍽️ Ambos";
    if (tipo === "almuerzo") return "🥗 Almuerzo";
    return "🌙 Cena";
  };

  const activos = suspendidos.filter((s) => s.fecha_inicio <= hoy && s.fecha_fin >= hoy);
  const programados = suspendidos.filter((s) => s.fecha_inicio > hoy);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white shadow-lg" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">🚫</div>
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

      <main className="max-w-7xl mx-auto p-4 space-y-5">
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

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-red-600">{activos.length}</p>
            <p className="text-gray-500 text-sm mt-1 font-medium">🔴 Activas hoy</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-amber-600">{programados.length}</p>
            <p className="text-gray-500 text-sm mt-1 font-medium">🟡 Programadas</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-gray-600">{suspendidos.length}</p>
            <p className="text-gray-500 text-sm mt-1 font-medium">📋 Total activas</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Lista de suspendidos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-sm">📋</span>
              Estudiantes Suspendidos ({suspendidos.length})
            </h2>

            {suspendidos.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">✅</div>
                <p className="text-gray-400">No hay suspensiones activas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {suspendidos.map((s) => {
                  const estado = getEstado(s);
                  return (
                    <div key={s.id} className={`border rounded-xl p-4 transition-all ${estado.color}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${estado.color}`}>
                              {estado.texto}
                            </span>
                            <span className="text-xs font-semibold text-gray-700">{getTipoLabel(s.tipo)}</span>
                          </div>
                          <p className="font-bold text-gray-800 text-sm">{s.nombre}</p>
                          <p className="text-xs text-gray-500">Código: {s.codigo}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            📅 {s.fecha_inicio} al {s.fecha_fin}
                          </p>
                          {s.motivo && (
                            <p className="text-xs text-gray-400 italic mt-1">Motivo: {s.motivo}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                          <button
                            onClick={() => abrirEdicion(s)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => eliminarSuspension(s.id)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                          >
                            🗑️ Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Buscador + Formulario */}
          <div className="space-y-5">
            {/* Buscador */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm">🔍</span>
                Buscar Estudiante
              </h2>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Código o nombre..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />

              {resultados.length > 0 && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  {resultados.map((est) => (
                    <div
                      key={est.id}
                      className={`border rounded-xl p-3 cursor-pointer transition-all ${
                        estudianteSel?.id === est.id
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setEstudianteSel(est)}
                    >
                      <p className="font-bold text-gray-800 text-sm">{est.nombre}</p>
                      <p className="text-xs text-gray-500">Código: {est.codigo}</p>
                      {est.suspensiones.length > 0 && (
                        <div className="mt-1">
                          {est.suspensiones.map((s) => {
                            const e = getEstado(s);
                            return (
                              <span key={s.id} className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mr-1 border ${e.color}`}>
                                {e.texto} - {getTipoLabel(s.tipo)}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {busqueda.length >= 2 && !cargando && resultados.length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-4">No se encontraron estudiantes</p>
              )}
            </div>

            {/* Formulario crear */}
            {estudianteSel && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-sm">🚫</span>
                  Suspender: {estudianteSel.nombre}
                </h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Turno</label>
                    <select
                      value={tipoSuspension}
                      onChange={(e) => setTipoSuspension(e.target.value as any)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                    >
                      <option value="ambos">🍽️ Ambos</option>
                      <option value="almuerzo">🥗 Almuerzo</option>
                      <option value="cena">🌙 Cena</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Motivo</label>
                    <input
                      type="text"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Opcional"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      min={fechaInicio}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={crearSuspension}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    🚫 Aplicar
                  </button>
                  <button
                    onClick={() => setEstudianteSel(null)}
                    className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de edición */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="text-xl">✏️</span> Editar Suspensión
              </h3>
              <button
                onClick={() => setEditando(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-3 p-3 bg-gray-50 rounded-xl">
              <p className="text-sm font-bold text-gray-800">{editando.nombre}</p>
              <p className="text-xs text-gray-500">Código: {editando.codigo}</p>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Turno</label>
                <select
                  value={editTipo}
                  onChange={(e) => setEditTipo(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                >
                  <option value="ambos">🍽️ Ambos</option>
                  <option value="almuerzo">🥗 Almuerzo</option>
                  <option value="cena">🌙 Cena</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
                  <input
                    type="date"
                    value={editInicio}
                    onChange={(e) => setEditInicio(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={editFin}
                    onChange={(e) => setEditFin(e.target.value)}
                    min={editInicio}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Motivo</label>
                <input
                  type="text"
                  value={editMotivo}
                  onChange={(e) => setEditMotivo(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={guardarEdicion}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
              >
                💾 Guardar Cambios
              </button>
              <button
                onClick={() => setEditando(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
