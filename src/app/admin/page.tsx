"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session");
    if (!adminSession) {
      router.push("/");
      return;
    }
    fetchInscritos();
  }, [router, fecha]);

  const fetchInscritos = async () => {
    setCargando(true);
    try {
      const res = await fetch(`/api/admin/validar?fecha=${fecha}`);
      const data = await res.json();
      setInscritos(data);
    } catch {
      console.error("Error");
    } finally {
      setCargando(false);
    }
  };

  const marcarAtendido = async (inscripcionId: number) => {
    try {
      await fetch("/api/admin/validar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inscripcion_id: inscripcionId, accion: "atender" }),
      });
      fetchInscritos();
    } catch {
      console.error("Error");
    }
  };

  const eliminarInscripcion = async (inscripcionId: number, nombre: string) => {
    if (!confirm(`¿Eliminar la inscripción de ${nombre}? Se liberará el cupo.`)) return;
    try {
      const res = await fetch(`/api/admin/validar?id=${inscripcionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchInscritos();
      }
    } catch {
      console.error("Error");
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("admin_session");
    router.push("/");
  };

  const almuerzos = inscritos.filter((i) => i.turno === "almuerzo");
  const cenas = inscritos.filter((i) => i.turno === "cena");
  const atendidos = inscritos.filter((i) => i.estado === "atendido").length;
  const pendientes = inscritos.filter((i) => i.estado === "reservado").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white shadow-lg" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">
              👨‍💼
            </div>
            <div>
              <h1 className="text-lg font-bold">Panel de Administración</h1>
              <p className="text-gray-400 text-xs">Comedor Universitario</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/admin/turnos")}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition text-sm font-medium"
            >
              ⚙️ Cupos
            </button>
            <button
              onClick={() => router.push("/admin/formato")}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition text-sm font-medium"
            >
              📄 Formato
            </button>
            <button
              onClick={() => router.push("/admin/historial")}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl transition text-sm font-medium"
            >
              📚 Historial
            </button>
            <button
              onClick={() => router.push("/admin/monitoreo")}
              className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition text-sm font-medium"
            >
              📊 Monitoreo
            </button>
            <button
              onClick={() => router.push("/admin/validar")}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl transition text-sm font-medium"
            >
              📱 Validar
            </button>
            <button
              onClick={cerrarSesion}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-xl transition text-sm font-medium"
            >
              🚪 Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">📅 Fecha:</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            onClick={fetchInscritos}
            className="text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
          >
            🔄 Actualizar
          </button>
          <a
            href={`/api/admin/export?fecha=${fecha}`}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all"
          >
            📥 Exportar Excel
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{almuerzos.length}</p>
            <p className="text-gray-500 text-sm mt-1 font-medium">🥗 Almuerzos</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-amber-600">{cenas.length}</p>
            <p className="text-gray-500 text-sm mt-1 font-medium">🌙 Cenas</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-blue-600">{atendidos}</p>
            <p className="text-gray-500 text-sm mt-1 font-medium">✅ Atendidos</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
            <p className="text-3xl font-bold text-gray-600">{pendientes}</p>
            <p className="text-gray-500 text-sm mt-1 font-medium">⏳ Pendientes</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm">📋</span>
            Inscritos del día ({inscritos.length} total)
          </h2>

          {cargando ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-3 text-gray-400 text-sm">Cargando...</p>
            </div>
          ) : inscritos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">📭</div>
              <p className="text-gray-400">No hay inscritos aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">N°</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Turno</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {inscritos.map((insc) => (
                    <tr key={insc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-800">{insc.numero_orden}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">{insc.codigo}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{insc.nombre}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          insc.turno === "almuerzo"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {insc.turno === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          insc.estado === "reservado"
                            ? "bg-amber-100 text-amber-700"
                            : insc.estado === "atendido"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {insc.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {insc.estado === "reservado" && (
                            <button
                              onClick={() => marcarAtendido(insc.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            >
                              ✅ Atender
                            </button>
                          )}
                          <button
                            onClick={() => eliminarInscripcion(insc.id, insc.nombre)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
