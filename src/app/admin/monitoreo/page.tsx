"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Inscripcion {
  id: number;
  numero_orden: number;
  codigo: string;
  nombre: string;
  turno: string;
  estado: string;
  fecha_hora: string;
}

export default function MonitoreoPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [inscritos, setInscritos] = useState<Inscripcion[]>([]);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session");
    if (!adminSession) {
      router.push("/");
      return;
    }
    fetchInscritos();
    const interval = setInterval(fetchInscritos, 5000); // Actualizar cada 5s
    return () => clearInterval(interval);
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

  const almuerzos = inscritos.filter((i) => i.turno === "almuerzo");
  const cenas = inscritos.filter((i) => i.turno === "cena");

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">📊 Monitoreo en Vivo</h1>
            <p className="text-gray-400 text-sm">Actualización automática cada 5 segundos</p>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
            />
            <button
              onClick={() => router.push("/admin")}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
            >
              ← Volver
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {/* Estadísticas grandes */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-center">
            <p className="text-5xl font-bold">{almuerzos.length}</p>
            <p className="text-red-200 mt-2">🥗 Almuerzos</p>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-center">
            <p className="text-5xl font-bold">{cenas.length}</p>
            <p className="text-orange-200 mt-2">🌙 Cenas</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-center">
            <p className="text-5xl font-bold">
              {inscritos.filter((i) => i.estado === "atendido").length}
            </p>
            <p className="text-green-200 mt-2">✅ Atendidos</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6 text-center">
            <p className="text-5xl font-bold">
              {inscritos.filter((i) => i.estado === "reservado").length}
            </p>
            <p className="text-yellow-200 mt-2">⏳ Pendientes</p>
          </div>
        </div>

        {/* Listas en tiempo real */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Almuerzos */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              🥗 Almuerzos
              <span className="bg-red-600 text-sm px-2 py-1 rounded">{almuerzos.length}</span>
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {almuerzos.map((insc) => (
                <div
                  key={insc.id}
                  className={`p-3 rounded-lg flex justify-between items-center ${
                    insc.estado === "atendido"
                      ? "bg-green-900/50 border border-green-700"
                      : "bg-gray-700 border border-gray-600"
                  }`}
                >
                  <div>
                    <span className="text-2xl font-bold mr-3">#{insc.numero_orden}</span>
                    <span className="font-medium">{insc.nombre}</span>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded ${
                    insc.estado === "atendido"
                      ? "bg-green-600"
                      : "bg-yellow-600"
                  }`}>
                    {insc.estado === "atendido" ? "✅" : "⏳"}
                  </span>
                </div>
              ))}
              {almuerzos.length === 0 && (
                <p className="text-gray-500 text-center py-8">Sin inscripciones</p>
              )}
            </div>
          </div>

          {/* Cenas */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              🌙 Cenas
              <span className="bg-orange-600 text-sm px-2 py-1 rounded">{cenas.length}</span>
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cenas.map((insc) => (
                <div
                  key={insc.id}
                  className={`p-3 rounded-lg flex justify-between items-center ${
                    insc.estado === "atendido"
                      ? "bg-green-900/50 border border-green-700"
                      : "bg-gray-700 border border-gray-600"
                  }`}
                >
                  <div>
                    <span className="text-2xl font-bold mr-3">#{insc.numero_orden}</span>
                    <span className="font-medium">{insc.nombre}</span>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded ${
                    insc.estado === "atendido"
                      ? "bg-green-600"
                      : "bg-yellow-600"
                  }`}>
                    {insc.estado === "atendido" ? "✅" : "⏳"}
                  </span>
                </div>
              ))}
              {cenas.length === 0 && (
                <p className="text-gray-500 text-center py-8">Sin inscripciones</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
