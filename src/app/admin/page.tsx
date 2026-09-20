"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import PDFReport from "@/components/PDFReport";
import AdminLayout from "@/components/AdminLayout";

export default function AdminPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [inscritos, setInscritos] = useState<any[]>([]);
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

  const almuerzos = inscritos.filter((i) => i.turno === "almuerzo");
  const cenas = inscritos.filter((i) => i.turno === "cena");
  const atendidos = inscritos.filter((i) => i.estado === "atendido").length;
  const pendientes = inscritos.filter((i) => i.estado === "reservado").length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #15803d, #4ade80)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-extrabold tracking-tight">{almuerzos.length}</p>
                <p className="text-white/80 text-sm mt-0.5 font-medium">Almuerzos</p>
              </div>
              <span className="text-4xl opacity-80">🥗</span>
            </div>
          </div>

          <div className="rounded-xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #b45309, #fbbf24)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-extrabold tracking-tight">{cenas.length}</p>
                <p className="text-white/80 text-sm mt-0.5 font-medium">Cenas</p>
              </div>
              <span className="text-4xl opacity-80">🌙</span>
            </div>
          </div>

          <div className="rounded-xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #1d4ed8, #60a5fa)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-extrabold tracking-tight">{atendidos}</p>
                <p className="text-white/80 text-sm mt-0.5 font-medium">Atendidos</p>
              </div>
              <span className="text-4xl opacity-80">✅</span>
            </div>
          </div>

          <div className="rounded-xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-extrabold tracking-tight">{pendientes}</p>
                <p className="text-white/80 text-sm mt-0.5 font-medium">Pendientes</p>
              </div>
              <span className="text-4xl opacity-80">⏳</span>
            </div>
          </div>
        </div>

        {/* ── Controls Bar ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-600">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />
          <button
            onClick={fetchInscritos}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Actualizar
          </button>
          <a
            href={`/api/admin/export?fecha=${fecha}`}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Excel
          </a>
          <PDFReport inscripciones={inscritos} fecha={fecha} />
        </div>

        {/* ── Inscritos Table ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Inscritos del día — {inscritos.length} total
            </h2>
          </div>

          {cargando ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-3 text-gray-400 text-sm">Cargando inscritos…</p>
            </div>
          ) : inscritos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
                📭
              </div>
              <p className="text-gray-500 font-medium">No hay inscritos para esta fecha</p>
              <p className="text-gray-400 text-sm mt-1">Selecciona otra fecha o actualiza la lista</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">N°</th>
                    <th className="text-left py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="text-left py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="text-left py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Turno</th>
                    <th className="text-left py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-right py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inscritos.map((insc, idx) => (
                    <tr
                      key={insc.id}
                      className={`border-b border-gray-100 last:border-0 transition-colors hover:bg-blue-50/40 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="py-3.5 px-5 font-bold text-gray-800">{insc.numero_orden}</td>
                      <td className="py-3.5 px-5 text-gray-500 font-mono text-xs">{insc.codigo}</td>
                      <td className="py-3.5 px-5 font-semibold text-gray-800">{insc.nombre}</td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            insc.turno === "almuerzo"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {insc.turno === "almuerzo" ? "🥗" : "🌙"}{" "}
                          {insc.turno === "almuerzo" ? "Almuerzo" : "Cena"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            insc.estado === "reservado"
                              ? "bg-blue-100 text-blue-700"
                              : insc.estado === "atendido"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {insc.estado === "reservado" && "📋"}
                          {insc.estado === "atendido" && "✔️"}
                          {insc.estado === "cancelado" && "✖️"}{" "}
                          {insc.estado.charAt(0).toUpperCase() + insc.estado.slice(1)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-2">
                          {insc.estado === "reservado" && (
                            <button
                              onClick={() => marcarAtendido(insc.id)}
                              title="Marcar como atendido"
                              className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Atender
                            </button>
                          )}
                          <button
                            onClick={() => eliminarInscripcion(insc.id, insc.nombre)}
                            title="Eliminar inscripción"
                            className="inline-flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

      </div>
    </AdminLayout>
  );
}
