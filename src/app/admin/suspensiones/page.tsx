"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

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

  const [estudianteSel, setEstudianteSel] = useState<Estudiante | null>(null);
  const [tipoSuspension, setTipoSuspension] = useState<"almuerzo" | "cena" | "ambos">("ambos");
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split("T")[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split("T")[0]);
  const [motivo, setMotivo] = useState("");

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

      setMensaje(`Suspension creada para ${estudianteSel.nombre}`);
      setEstudianteSel(null);
      resetForm();
      buscarEstudiantes();
      cargarSuspendidos();
    } catch {
      setError("Error de conexion");
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

      setMensaje("Suspension actualizada");
      setEditando(null);
      cargarSuspendidos();
      if (busqueda.length >= 2) buscarEstudiantes();
    } catch {
      setError("Error de conexion");
    }
  };

  const eliminarSuspension = async (id: number) => {
    if (!confirm("Eliminar esta suspension?")) return;
    try {
      const res = await fetch(`/api/admin/suspensiones?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMensaje("Suspension eliminada");
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
    if (tipo === "ambos") return "Ambos";
    if (tipo === "almuerzo") return "Almuerzo";
    return "Cena";
  };

  const activos = suspendidos.filter((s) => s.fecha_inicio <= hoy && s.fecha_fin >= hoy);
  const programados = suspendidos.filter((s) => s.fecha_inicio > hoy);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl">
        {mensaje && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className="text-sm font-medium">{mensaje}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
            <p className="text-3xl font-bold text-red-600">{activos.length}</p>
            <p className="text-xs text-slate-500 mt-1">Activas hoy</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
            <p className="text-3xl font-bold text-amber-600">{programados.length}</p>
            <p className="text-xs text-slate-500 mt-1">Programadas</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
            <p className="text-3xl font-bold text-slate-700">{suspendidos.length}</p>
            <p className="text-xs text-slate-500 mt-1">Total activas</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              En sistema
              <span className="ml-2 text-xs text-slate-400 font-normal">({suspendidos.length})</span>
            </h2>

            {suspendidos.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-10 h-10 text-emerald-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-slate-500">No hay suspensiones activas</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {suspendidos.map((s) => {
                  const estado = getEstado(s);
                  return (
                    <div key={s.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              estado.texto === "Activa" ? "bg-red-100 text-red-700" :
                              estado.texto === "Programada" ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-500"
                            }`}>
                              {estado.texto}
                            </span>
                            <span className="text-xs text-slate-500">{getTipoLabel(s.tipo)}</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 truncate">{s.nombre}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{s.codigo}</p>
                          <p className="text-xs text-slate-400 mt-1">{s.fecha_inicio} al {s.fecha_fin}</p>
                          {s.motivo && (
                            <p className="text-xs text-slate-400 italic mt-1">Motivo: {s.motivo}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => abrirEdicion(s)}
                            className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-medium transition border border-slate-200"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminarSuspension(s.id)}
                            className="text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium transition border border-slate-200"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Encontrados en API</h2>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Codigo o nombre..."
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />

              {resultados.length > 0 && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  {resultados.map((est) => (
                    <div
                      key={est.id}
                      className={`border rounded-lg p-3 cursor-pointer transition ${
                        estudianteSel?.id === est.id
                          ? "border-indigo-400 bg-indigo-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      onClick={() => setEstudianteSel(est)}
                    >
                      <p className="text-sm font-semibold text-slate-900">{est.nombre}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{est.codigo}</p>
                      {est.suspensiones.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {est.suspensiones.map((s) => {
                            const e = getEstado(s);
                            return (
                              <span key={s.id} className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                e.texto === "Activa" ? "bg-red-100 text-red-700" :
                                e.texto === "Programada" ? "bg-amber-100 text-amber-700" :
                                "bg-slate-100 text-slate-500"
                              }`}>
                                {e.texto}
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
                <p className="text-center text-slate-400 text-sm mt-4">No se encontraron estudiantes</p>
              )}
            </div>

            {estudianteSel && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">
                  Suspender: <span className="text-red-600">{estudianteSel.nombre}</span>
                </h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Turno</label>
                    <select
                      value={tipoSuspension}
                      onChange={(e) => setTipoSuspension(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="ambos">Ambos</option>
                      <option value="almuerzo">Almuerzo</option>
                      <option value="cena">Cena</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Motivo</label>
                    <input
                      type="text"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Opcional"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Desde</label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Hasta</label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      min={fechaInicio}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={crearSuspension}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium text-sm transition"
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={() => setEstudianteSel(null)}
                    className="px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg font-medium text-sm transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900">Editar Suspension</h3>
              <button
                onClick={() => setEditando(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-semibold text-slate-900">{editando.nombre}</p>
              <p className="text-xs text-slate-500 mt-0.5">{editando.codigo}</p>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Turno</label>
                <select
                  value={editTipo}
                  onChange={(e) => setEditTipo(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="ambos">Ambos</option>
                  <option value="almuerzo">Almuerzo</option>
                  <option value="cena">Cena</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Desde</label>
                  <input
                    type="date"
                    value={editInicio}
                    onChange={(e) => setEditInicio(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Hasta</label>
                  <input
                    type="date"
                    value={editFin}
                    onChange={(e) => setEditFin(e.target.value)}
                    min={editInicio}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Motivo</label>
                <input
                  type="text"
                  value={editMotivo}
                  onChange={(e) => setEditMotivo(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={guardarEdicion}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium text-sm transition"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => setEditando(null)}
                className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg font-medium text-sm transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
