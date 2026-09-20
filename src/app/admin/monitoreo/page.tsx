"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

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
    <AdminLayout>
      <div className="space-y-5 max-w-7xl">
        <div className="flex items-center gap-3 mb-2">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl p-6 text-center text-white" style={{ background: "linear-gradient(135deg, #166534, #15803d)" }}>
            <p className="text-5xl font-bold">{almuerzos.length}</p>
            <p className="text-green-200 mt-2 text-sm font-medium">🥗 Almuerzos</p>
          </div>
          <div className="rounded-2xl p-6 text-center text-white" style={{ background: "linear-gradient(135deg, #92400e, #b45309)" }}>
            <p className="text-5xl font-bold">{cenas.length}</p>
            <p className="text-amber-200 mt-2 text-sm font-medium">🌙 Cenas</p>
          </div>
          <div className="rounded-2xl p-6 text-center text-white" style={{ background: "linear-gradient(135deg, #1e40af, #2563eb)" }}>
            <p className="text-5xl font-bold">{atendidos}</p>
            <p className="text-blue-200 mt-2 text-sm font-medium">✅ Atendidos</p>
          </div>
          <div className="rounded-2xl p-6 text-center text-white" style={{ background: "linear-gradient(135deg, #475569, #64748b)" }}>
            <p className="text-5xl font-bold">{pendientes}</p>
            <p className="text-gray-300 mt-2 text-sm font-medium">⏳ Pendientes</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              🥗 Almuerzos
              <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold">{almuerzos.length}</span>
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {almuerzos.map((insc) => (
                <div
                  key={insc.id}
                  className={`p-4 rounded-xl flex justify-between items-center transition-all ${
                    insc.estado === "atendido"
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-800">#{insc.numero_orden}</span>
                    <span className="text-gray-700 font-medium text-sm">{insc.nombre}</span>
                  </div>
                  <span className={`text-lg ${
                    insc.estado === "atendido" ? "text-green-500" : "text-amber-500"
                  }`}>
                    {insc.estado === "atendido" ? "✅" : "⏳"}
                  </span>
                </div>
              ))}
              {almuerzos.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">Sin inscripciones</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              🌙 Cenas
              <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-semibold">{cenas.length}</span>
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {cenas.map((insc) => (
                <div
                  key={insc.id}
                  className={`p-4 rounded-xl flex justify-between items-center transition-all ${
                    insc.estado === "atendido"
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-800">#{insc.numero_orden}</span>
                    <span className="text-gray-700 font-medium text-sm">{insc.nombre}</span>
                  </div>
                  <span className={`text-lg ${
                    insc.estado === "atendido" ? "text-green-500" : "text-amber-500"
                  }`}>
                    {insc.estado === "atendido" ? "✅" : "⏳"}
                  </span>
                </div>
              ))}
              {cenas.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">Sin inscripciones</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
