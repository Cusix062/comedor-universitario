"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import * as XLSX from "xlsx";

interface HistorialItem {
  id: number;
  numero_orden: number;
  estado: string;
  fecha_hora: string;
  fecha: string;
  turno: string;
}

export default function HistorialPage() {
  const { data: session, status } = useSession();
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [filtrado, setFiltrado] = useState<HistorialItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [codigo, setCodigo] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    let userCodigo = "";

    if (session?.user) {
      userCodigo = session.user.email?.split("@")[0] || "";
    } else {
      const sessionLocal = localStorage.getItem("session");
      const estudianteData = localStorage.getItem("estudiante");
      if (sessionLocal && estudianteData) {
        const est = JSON.parse(estudianteData);
        userCodigo = est.codigo;
      } else {
        router.push("/");
        return;
      }
    }

    if (userCodigo) {
      setCodigo(userCodigo);
      fetchHistorial(userCodigo);
    }
  }, [router, session, status]);

  useEffect(() => {
    let resultado = [...historial];
    if (fechaInicio) {
      resultado = resultado.filter((h) => h.fecha >= fechaInicio);
    }
    if (fechaFin) {
      resultado = resultado.filter((h) => h.fecha <= fechaFin);
    }
    setFiltrado(resultado);
  }, [historial, fechaInicio, fechaFin]);

  const fetchHistorial = async (cod: string) => {
    setCargando(true);
    try {
      const res = await fetch(`/api/estudiante/historial?codigo=${cod}`);
      const data = await res.json();
      setHistorial(data);
    } catch {
      console.error("Error al obtener historial");
    } finally {
      setCargando(false);
    }
  };

  const exportarExcel = () => {
    const datos = filtrado.map((h, i) => ({
      "N°": i + 1,
      Fecha: h.fecha,
      Turno: h.turno === "almuerzo" ? "Almuerzo" : "Cena",
      "N° de cupo": h.numero_orden,
      Estado: h.estado === "reservado" ? "Reservado" : h.estado === "atendido" ? "Atendido" : "Cancelado",
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial");
    XLSX.writeFile(wb, `historial_${codigo}.xlsx`);
  };

  const cerrarSesion = async () => {
    localStorage.removeItem("session");
    localStorage.removeItem("estudiante");
    await signOut({ redirect: false });
    router.push("/");
  };

  const totalAlmuerzos = historial.filter((h) => h.turno === "almuerzo").length;
  const totalCenas = historial.filter((h) => h.turno === "cena").length;

  if (status === "loading" || cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 font-medium">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800">Mi Historial</h1>
              <p className="text-xs text-slate-400">{historial.length} inscripciones</p>
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            className="text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-slate-800">{historial.length}</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">Total</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-emerald-600">{totalAlmuerzos}</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">Almuerzos</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-amber-600">{totalCenas}</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">Cenas</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500">Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            onClick={() => {
              setFechaInicio("");
              setFechaFin("");
            }}
            className="text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            Limpiar
          </button>
          <button
            onClick={exportarExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition ml-auto flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Excel
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filtrado.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">No hay registros</p>
              <p className="text-slate-300 text-xs mt-1">Ajusta las fechas o registra tu primera inscripción</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Turno</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">N° Cupo</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrado.map((h, i) => (
                    <tr
                      key={h.id}
                      className={`border-b border-slate-50 transition-colors hover:bg-slate-50 ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}
                    >
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">{h.fecha}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            h.turno === "almuerzo" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {h.turno === "almuerzo" ? "Almuerzo" : "Cena"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-800">{h.numero_orden}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            h.estado === "reservado"
                              ? "bg-amber-100 text-amber-700"
                              : h.estado === "atendido"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {h.estado}
                        </span>
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
