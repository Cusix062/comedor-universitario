"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { cicloARomano } from "@/lib/ciclos";

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

  useEffect(() => {
    fetchFormatos();
  }, []);

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

  const totalInscritos = formatos.reduce((sum, f) => sum + f.cantidad_inscritos, 0);
  const totalCapacidad = formatos.reduce((sum, f) => sum + f.capacidad, 0);

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

      <AdminLayout>
        <div className="space-y-6 max-w-6xl">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
              <p className="text-2xl font-bold text-slate-900">{formatos.length}</p>
              <p className="text-xs text-slate-500 mt-1">Formatos guardados</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
              <p className="text-2xl font-bold text-slate-900">{totalInscritos}</p>
              <p className="text-xs text-slate-500 mt-1">Total inscritos</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
              <p className="text-2xl font-bold text-slate-900">{totalCapacidad}</p>
              <p className="text-xs text-slate-500 mt-1">Capacidad total</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Formatos Guardados</h2>
              {formatos.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                  <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  <p className="text-sm text-slate-500">Sin formatos guardados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formatos.map((formato) => (
                    <div
                      key={formato.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition ${
                        seleccionado?.id === formato.id
                          ? "border-indigo-400 bg-indigo-50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <button
                        onClick={() => verFormato(formato)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-sm font-semibold text-slate-900 truncate">{fechaFormateada(formato.fecha)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium ${
                            formato.tipo === "almuerzo" ? "text-emerald-600" : "text-amber-600"
                          }`}>
                            {formato.tipo === "almuerzo" ? "Almuerzo" : "Cena"}
                          </span>
                          <span className="text-xs text-slate-400">|</span>
                          <span className="text-xs text-slate-500">{formato.cantidad_inscritos}/{formato.capacidad}</span>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarFormato(formato.id);
                        }}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-lg flex items-center justify-center transition flex-shrink-0"
                        title="Eliminar formato"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              {seleccionado ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center no-print">
                    <div>
                      <h3 className="font-semibold text-slate-900">{fechaFormateada(seleccionado.fecha)}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {seleccionado.tipo === "almuerzo" ? "Almuerzo" : "Cena"} &mdash; Guardado: {new Date(seleccionado.guardado_en).toLocaleString("es-PE")}
                      </p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      Imprimir
                    </button>
                  </div>

                  <div className="print-area p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <img src="/UNDC_logo.jpg" alt="UNDC" className="w-20 h-20 object-contain rounded-full" />
                        <div className="text-center flex-1">
                          <p className="text-xs text-slate-500 italic">Ley de Org. N° 29498</p>
                          <p className="text-[10px] text-slate-400">Licenciada segun Res. del Consejo Universitario N° 116-2019-SUNEDU/CD</p>
                          <p className="font-bold text-xs mt-1">DIRECCION DE BIENESTAR UNIVERSITARIO</p>
                          <p className="font-bold text-sm">SERVICIO DE COMEDOR UNIVERSITARIO</p>
                        </div>
                      </div>
                      <img src="/DBU.jpg" alt="DBU" className="w-16 h-16 object-contain" />
                    </div>

                    <div className="text-center mb-3">
                      <p className="text-[10px] text-slate-400 italic">
                        &quot;Ano del Bicentenario, de la consolidacion de nuestra independencia, y de la<br />
                        conmemoracion de las heroicas batallas de Junin y Ayacucho&quot;
                      </p>
                    </div>

                    <div className="bg-[#1a5c3a] text-white px-4 py-2 rounded text-xs flex justify-between mb-4">
                      <span>Codigo: F-A03.04-BU-016 &nbsp;&nbsp; Fecha: 06/09/2024</span>
                      <span className="bg-white text-[#1a5c3a] px-3 py-0.5 rounded font-bold">Version: 02</span>
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
                          <th className="border border-slate-400 py-2 px-2 w-12 font-semibold">N°</th>
                          <th className="border border-slate-400 py-2 px-3 text-left font-semibold">APELLIDOS Y NOMBRES</th>
                          <th className="border border-slate-400 py-2 px-3 text-left font-semibold">ESCUELA PROFESIONAL</th>
                          <th className="border border-slate-400 py-2 px-2 w-16 font-semibold">CICLO</th>
                          <th className="border border-slate-400 py-2 px-2 w-20 font-semibold">FIRMA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: seleccionado.capacidad }, (_, i) => {
                          const insc = inscritos.find((insc) => insc.numero_orden === i + 1);
                          return (
                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                              <td className="border border-slate-300 py-2 px-2 text-center font-semibold text-slate-700">
                                {String(i + 1).padStart(2, "0")}
                              </td>
                              <td className="border border-slate-300 py-2 px-3 text-slate-900">
                                {insc?.nombre || ""}
                              </td>
                              <td className="border border-slate-300 py-2 px-3 text-slate-600">
                                ING. DE SISTEMAS
                              </td>
                              <td className="border border-slate-300 py-2 px-2 text-center text-slate-700">
                                {insc?.ciclo ? cicloARomano(insc.ciclo) : ""}
                              </td>
                              <td className="border border-slate-300 py-2 px-2"></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <p className="text-[9px] text-slate-400 text-center mt-4 italic">
                      Toda copia de este documento, sea del entorno virtual o del documento original en fisico es considerada &quot;copia no controlada&quot;.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <h3 className="text-lg font-semibold text-slate-900">Selecciona un formato</h3>
                  <p className="text-sm text-slate-500 mt-1">Haz clic en un formato del historial para verlo</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
