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
    const googleAdmin = localStorage.getItem("google_admin_session");
    if (!adminSession && !googleAdmin) {
      fetch("/api/auth/session").then(r => r.json()).then(session => {
        if (session?.user?.isAdmin) {
          localStorage.setItem("google_admin_session", "true");
          fetchInscritos();
        } else {
          router.push("/");
        }
      }).catch(() => router.push("/"));
      return;
    }
    fetchInscritos();
    const interval = setInterval(fetchInscritos, 5000);
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
  const atendidos = inscritos.filter((i) => i.estado === "atendido").length;
  const pendientes = inscritos.filter((i) => i.estado === "reservado").length;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" }}>
      <header className="border-b border-gray-700/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-lg">
              📊
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Monitoreo en Vivo</h1>
              <p className="text-gray-400 text-xs">Actualización cada 5 segundos</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            <button
              onClick={() => router.push("/admin")}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl transition text-sm font-medium"
            >
              ← Volver
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg, #166534, #15803d)" }}>
            <p className="text-5xl font-bold text-white">{almuerzos.length}</p>
            <p className="text-green-200 mt-2 text-sm font-medium">🥗 Almuerzos</p>
          </div>
          <div className="rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg, #92400e, #b45309)" }}>
            <p className="text-5xl font-bold text-white">{cenas.length}</p>
            <p className="text-amber-200 mt-2 text-sm font-medium">🌙 Cenas</p>
          </div>
          <div className="rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg, #1e40af, #2563eb)" }}>
            <p className="text-5xl font-bold text-white">{atendidos}</p>
            <p className="text-blue-200 mt-2 text-sm font-medium">✅ Atendidos</p>
          </div>
          <div className="rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg, #475569, #64748b)" }}>
            <p className="text-5xl font-bold text-white">{pendientes}</p>
            <p className="text-gray-300 mt-2 text-sm font-medium">⏳ Pendientes</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              🥗 Almuerzos
              <span className="bg-green-600 text-white text-xs px-2.5 py-1 rounded-full">{almuerzos.length}</span>
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {almuerzos.map((insc) => (
                <div
                  key={insc.id}
                  className={`p-4 rounded-xl flex justify-between items-center transition-all ${
                    insc.estado === "atendido"
                      ? "bg-green-900/30 border border-green-700/50"
                      : "bg-gray-700/50 border border-gray-600/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-white">#{insc.numero_orden}</span>
                    <span className="text-gray-200 font-medium text-sm">{insc.nombre}</span>
                  </div>
                  <span className={`text-lg ${
                    insc.estado === "atendido" ? "text-green-400" : "text-amber-400"
                  }`}>
                    {insc.estado === "atendido" ? "✅" : "⏳"}
                  </span>
                </div>
              ))}
              {almuerzos.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Sin inscripciones</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              🌙 Cenas
              <span className="bg-amber-600 text-white text-xs px-2.5 py-1 rounded-full">{cenas.length}</span>
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {cenas.map((insc) => (
                <div
                  key={insc.id}
                  className={`p-4 rounded-xl flex justify-between items-center transition-all ${
                    insc.estado === "atendido"
                      ? "bg-green-900/30 border border-green-700/50"
                      : "bg-gray-700/50 border border-gray-600/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-white">#{insc.numero_orden}</span>
                    <span className="text-gray-200 font-medium text-sm">{insc.nombre}</span>
                  </div>
                  <span className={`text-lg ${
                    insc.estado === "atendido" ? "text-green-400" : "text-amber-400"
                  }`}>
                    {insc.estado === "atendido" ? "✅" : "⏳"}
                  </span>
                </div>
              ))}
              {cenas.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Sin inscripciones</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
