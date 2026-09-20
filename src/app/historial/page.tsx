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

  if (status === "loading" || cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500 font-medium">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white shadow-lg" style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg">
              📚
            </div>
            <div>
              <h1 className="text-lg font-bold">Mi Historial</h1>
              <p className="text-blue-200 text-xs">Registro de inscripciones anteriores</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/registro")}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition text-sm font-medium"
            >
              ← Volver
            </button>
            <button
              onClick={cerrarSesion}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition text-sm font-medium"
            >
              🚪 Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            onClick={() => {
              setFechaInicio("");
              setFechaFin("");
            }}
            className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl text-sm font-medium transition"
          >
            Limpiar filtros
          </button>
          <button
            onClick={exportarExcel}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all ml-auto"
          >
            📥 Exportar Excel
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm">📋</span>
            Historial de inscripciones ({filtrado.length} registros)
          </h2>

          {filtrado.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">📭</div>
              <p className="text-gray-400">No hay registros en el historial</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Turno</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">N° de cupo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrado.map((h) => (
                    <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">{h.fecha}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          h.turno === "almuerzo"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {h.turno === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800">{h.numero_orden}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          h.estado === "reservado"
                            ? "bg-amber-100 text-amber-700"
                            : h.estado === "atendido"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}>
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
