"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FormatoGuardado {
  id: number;
  fecha: string;
  tipo: string;
  capacidad: number;
  cantidad_inscritos: number;
  inscritos_json: string;
  guardado_en: string;
}

export default function HistorialPage() {
  const [formatos, setFormatos] = useState<FormatoGuardado[]>([]);
  const [seleccionado, setSeleccionado] = useState<FormatoGuardado | null>(null);
  const [inscritos, setInscritos] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session");
    if (!adminSession) {
      router.push("/");
      return;
    }
    fetchFormatos();
  }, [router]);

  const fetchFormatos = async () => {
    try {
      const res = await fetch("/api/admin/formatos");
      const data = await res.json();
      setFormatos(data);
    } catch {
      console.error("Error");
    }
  };

  const verFormato = (formato: FormatoGuardado) => {
    setSeleccionado(formato);
    setInscritos(JSON.parse(formato.inscritos_json));
  };

  const eliminarFormato = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este formato guardado?")) return;

    try {
      const res = await fetch(`/api/admin/formatos?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setFormatos(formatos.filter((f) => f.id !== id));
        if (seleccionado?.id === id) {
          setSeleccionado(null);
          setInscritos([]);
        }
      }
    } catch {
      console.error("Error al eliminar");
    }
  };

  const fechaFormateada = (fecha: string) => {
    return new Date(fecha + "T12:00:00").toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .no-print { display: none !important; }
          @page {
            size: A4 portrait;
            margin: 10mm 15mm;
          }
        }
      `}</style>

      <div className="no-print min-h-screen bg-gray-50">
        <header className="text-white shadow-lg" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">
                📚
              </div>
              <div>
                <h1 className="text-lg font-bold">Historial de Formatos</h1>
                <p className="text-gray-400 text-xs">Formatos guardados por fecha</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              ← Volver
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-4 space-y-5">
          <div className="grid md:grid-cols-3 gap-5">
            {/* Lista de formatos */}
            <div className="md:col-span-1 space-y-3">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Formatos Guardados</h2>
              {formatos.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">📭</div>
                  <p className="text-gray-400 text-sm">Sin formatos guardados</p>
                </div>
              ) : (
                formatos.map((formato) => (
                  <div
                    key={formato.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all ${
                      seleccionado?.id === formato.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <button
                      onClick={() => verFormato(formato)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{fechaFormateada(formato.fecha)}</p>
                          <p className={`text-xs font-semibold mt-1 ${
                            formato.tipo === "almuerzo" ? "text-green-600" : "text-amber-600"
                          }`}>
                            {formato.tipo === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">{formato.cantidad_inscritos}/{formato.capacidad}</p>
                          <p className="text-xs text-gray-400">inscritos</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarFormato(formato.id);
                      }}
                      className="bg-red-100 hover:bg-red-200 text-red-600 w-9 h-9 rounded-lg flex items-center justify-center transition flex-shrink-0"
                      title="Eliminar formato"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Vista del formato */}
            <div className="md:col-span-2">
              {seleccionado ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-800">{fechaFormateada(seleccionado.fecha)}</h3>
                      <p className="text-sm text-gray-500">
                        {seleccionado.tipo === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"} —
                        Guardado: {new Date(seleccionado.guardado_en).toLocaleString("es-PE")}
                      </p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition"
                    >
                      🖨️ Imprimir
                    </button>
                  </div>

                  <div className="print-area p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <img src="/UNDC_logo.jpg" alt="UNDC" className="w-20 h-20 object-contain rounded-full" />
                        <div className="text-center flex-1">
                          <p className="text-xs text-gray-500 italic">Ley de Org. N° 29498</p>
                          <p className="text-[10px] text-gray-400">Licenciada según Res. del Consejo Universitario N° 116-2019-SUNEDU/CD</p>
                          <p className="font-bold text-xs mt-1">DIRECCIÓN DE BIENESTAR UNIVERSITARIO</p>
                          <p className="font-bold text-sm">SERVICIO DE COMEDOR UNIVERSITARIO</p>
                        </div>
                      </div>
                      <img src="/DBU.jpg" alt="DBU" className="w-16 h-16 object-contain" />
                    </div>

                    <div className="text-center mb-3">
                      <p className="text-[10px] text-gray-400 italic">
                        &quot;Año del Bicentenario, de la consolidación de nuestra independencia, y de la<br />
                        conmemoración de las heroicas batallas de Junín y Ayacucho&quot;
                      </p>
                    </div>

                    <div className="bg-[#1a5c3a] text-white px-4 py-2 rounded text-xs flex justify-between mb-4">
                      <span>Código: F-A03.04-BU-016 &nbsp;&nbsp; Fecha: 06/09/2024</span>
                      <span className="bg-white text-[#1a5c3a] px-3 py-0.5 rounded font-bold">Versión: 02</span>
                    </div>

                    <h2 className="text-center font-bold text-lg mb-4">
                      ADICIONALES DE {seleccionado.tipo === "almuerzo" ? "ALMUERZO" : "CENA"}
                    </h2>

                    <p className="text-sm font-semibold mb-3">
                      FECHA: {fechaFormateada(seleccionado.fecha)}
                    </p>

                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#1a5c3a] text-white">
                          <th className="border border-gray-400 py-2 px-2 w-12 font-semibold">N°</th>
                          <th className="border border-gray-400 py-2 px-3 text-left font-semibold">APELLIDOS Y NOMBRES</th>
                          <th className="border border-gray-400 py-2 px-3 text-left font-semibold">ESCUELA PROFESIONAL</th>
                          <th className="border border-gray-400 py-2 px-2 w-16 font-semibold">CICLO</th>
                          <th className="border border-gray-400 py-2 px-2 w-20 font-semibold">FIRMA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: seleccionado.capacidad }, (_, i) => {
                          const insc = inscritos.find((insc) => insc.numero_orden === i + 1);
                          return (
                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="border border-gray-300 py-2 px-2 text-center font-semibold text-gray-700">
                                {String(i + 1).padStart(2, "0")}
                              </td>
                              <td className="border border-gray-300 py-2 px-3 text-gray-800">
                                {insc?.nombre || ""}
                              </td>
                              <td className="border border-gray-300 py-2 px-3 text-gray-600">
                                ING. DE SISTEMAS
                              </td>
                              <td className="border border-gray-300 py-2 px-2 text-center text-gray-700">
                                {insc?.ciclo ? `${insc.ciclo}°` : ""}
                              </td>
                              <td className="border border-gray-300 py-2 px-2"></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <p className="text-[9px] text-gray-400 text-center mt-4 italic">
                      Toda copia de este documento, sea del entorno virtual o del documento original en físico es considerada &quot;copia no controlada&quot;.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">📄</div>
                  <h3 className="text-xl font-bold text-gray-800">Selecciona un formato</h3>
                  <p className="text-gray-500 mt-2 text-sm">Haz clic en un formato del historial para verlo</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
