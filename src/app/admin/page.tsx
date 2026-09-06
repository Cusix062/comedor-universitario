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

  const cerrarSesion = () => {
    localStorage.removeItem("admin_session");
    router.push("/");
  };

  const almuerzos = inscritos.filter((i) => i.turno === "almuerzo");
  const cenas = inscritos.filter((i) => i.turno === "cena");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">👨‍💼 Panel de Administración</h1>
            <p className="text-gray-300 text-sm">Comedor Universitario</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/admin/turnos")}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
            >
              ⚙️ Configurar Cupos
            </button>
            <button
              onClick={() => router.push("/admin/monitoreo")}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition"
            >
              📊 Monitoreo
            </button>
            <button
              onClick={() => router.push("/admin/validar")}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition"
            >
              📱 Validar QR
            </button>
            <button
              onClick={cerrarSesion}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
            >
              🚪 Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Selector de fecha */}
        <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
          <label className="font-medium">📅 Fecha:</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <button
            onClick={fetchInscritos}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            🔄 Actualizar
          </button>
          <a
            href={`/api/admin/export?fecha=${fecha}`}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            📥 Exportar Excel
          </a>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{almuerzos.length}</p>
            <p className="text-gray-500 text-sm">Almuerzos</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{cenas.length}</p>
            <p className="text-gray-500 text-sm">Cenas</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {inscritos.filter((i) => i.estado === "atendido").length}
            </p>
            <p className="text-gray-500 text-sm">Atendidos</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {inscritos.filter((i) => i.estado === "reservado").length}
            </p>
            <p className="text-gray-500 text-sm">Pendientes</p>
          </div>
        </div>

        {/* Lista de inscritos */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold mb-4">
            📋 Inscritos del día ({inscritos.length} total)
          </h2>

          {cargando ? (
            <p className="text-center text-gray-500 py-8">Cargando...</p>
          ) : inscritos.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay inscritos aún</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">N°</th>
                    <th className="text-left p-2">Código</th>
                    <th className="text-left p-2">Nombre</th>
                    <th className="text-left p-2">Turno</th>
                    <th className="text-left p-2">Estado</th>
                    <th className="text-left p-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {inscritos.map((insc) => (
                    <tr key={insc.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-bold">{insc.numero_orden}</td>
                      <td className="p-2">{insc.codigo}</td>
                      <td className="p-2">{insc.nombre}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          insc.turno === "almuerzo"
                            ? "bg-red-100 text-red-800"
                            : "bg-orange-100 text-orange-800"
                        }`}>
                          {insc.turno === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          insc.estado === "reservado"
                            ? "bg-yellow-100 text-yellow-800"
                            : insc.estado === "atendido"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {insc.estado}
                        </span>
                      </td>
                      <td className="p-2">
                        {insc.estado === "reservado" && (
                          <button
                            onClick={() => marcarAtendido(insc.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-xs"
                          >
                            ✅ Atender
                          </button>
                        )}
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
