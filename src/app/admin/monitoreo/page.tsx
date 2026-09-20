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
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`w-2 h-2 rounded-full ${cargando ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
            Actualizacion cada 5s
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
            <p className="text-3xl font-bold text-emerald-600">{almuerzos.length}</p>
            <p className="text-xs text-slate-500 mt-1">Almuerzos</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
            <p className="text-3xl font-bold text-amber-600">{cenas.length}</p>
            <p className="text-xs text-slate-500 mt-1">Cenas</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
            <p className="text-3xl font-bold text-indigo-600">{atendidos}</p>
            <p className="text-xs text-slate-500 mt-1">Atendidos</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
            <p className="text-3xl font-bold text-slate-600">{pendientes}</p>
            <p className="text-xs text-slate-500 mt-1">Pendientes</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Almuerzos</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">{almuerzos.length}</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {almuerzos.map((insc) => (
                <div
                  key={insc.id}
                  className={`p-3 rounded-lg flex justify-between items-center border transition ${
                    insc.estado === "atendido"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-900">#{insc.numero_orden}</span>
                    <span className="text-sm text-slate-700">{insc.nombre}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${insc.estado === "atendido" ? "bg-emerald-500" : "bg-amber-400"}`} />
                </div>
              ))}
              {almuerzos.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400">Sin inscripciones</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Cenas</h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">{cenas.length}</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {cenas.map((insc) => (
                <div
                  key={insc.id}
                  className={`p-3 rounded-lg flex justify-between items-center border transition ${
                    insc.estado === "atendido"
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-900">#{insc.numero_orden}</span>
                    <span className="text-sm text-slate-700">{insc.nombre}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${insc.estado === "atendido" ? "bg-emerald-500" : "bg-amber-400"}`} />
                </div>
              ))}
              {cenas.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400">Sin inscripciones</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
