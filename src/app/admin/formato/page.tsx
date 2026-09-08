"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cicloARomano } from "@/lib/ciclos";

interface Inscripcion {
  numero_orden: number;
  nombre: string;
  ciclo: number;
  estado: string;
}

export default function FormatoPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [tipo, setTipo] = useState<"almuerzo" | "cena">("almuerzo");
  const [inscritos, setInscritos] = useState<Inscripcion[]>([]);
  const [capacidad, setCapacidad] = useState(30);
  const [guardado, setGuardado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [horaActual, setHoraActual] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const update = () => setHoraActual(new Date().toLocaleTimeString("es-PE", { hour12: true }));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchInscritos = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/validar?fecha=${fecha}`);
      const data = await res.json();
      const filtrados = data
        .filter((i: any) => i.turno === tipo)
        .map((i: any) => ({
          numero_orden: i.numero_orden,
          nombre: i.nombre,
          ciclo: i.ciclo,
          estado: i.estado,
        }));
      setInscritos(filtrados);

      const formatRes = await fetch(`/api/admin/formatos?fecha=${fecha}&tipo=${tipo}`);
      const formatoGuardado = await formatRes.json();
      setGuardado(!!formatoGuardado);
    } catch {
      console.error("Error");
    }
  }, [fecha, tipo]);

  useEffect(() => {
    fetchInscritos();
    const interval = setInterval(fetchInscritos, 5000);
    return () => clearInterval(interval);
  }, [fetchInscritos]);

  const guardarFormato = async () => {
    setCargando(true);
    setMensaje("");
    try {
      const res = await fetch("/api/admin/formatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha, tipo, capacidad,
          cantidad_inscritos: inscritos.length,
          inscritos_json: inscritos,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje("✅ Guardado");
        setGuardado(true);
      } else {
        setMensaje("❌ " + data.error);
      }
    } catch {
      setMensaje("❌ Error");
    } finally {
      setCargando(false);
    }
  };

  const imprimir = () => window.print();

  const estaLleno = inscritos.length >= capacidad;

  const fechaFormateada = new Date(fecha + "T12:00:00").toLocaleDateString("es-PE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  const filas = Array.from({ length: capacidad }, (_, i) => {
    const insc = inscritos.find((insc) => insc.numero_orden === i + 1);
    return {
      numero: String(i + 1).padStart(2, "0"),
      nombre: insc?.nombre || "",
      ciclo: insc?.ciclo ? cicloARomano(insc.ciclo) : "",
    };
  });

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { 
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            z-index: 99999 !important;
            display: block !important;
          }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 10mm 15mm; }
        }
        @media screen {
          .print-area { display: none !important; }
        }
      `}</style>

      <div className="no-print min-h-screen bg-gray-50 flex flex-col">
        <header className="text-white shadow-lg flex-shrink-0" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
          <div className="max-w-[1600px] mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">📄</div>
              <div>
                <h1 className="text-lg font-bold">Formato en Vivo</h1>
                <p className="text-gray-400 text-xs">Se actualiza cada 5s</p>
              </div>
            </div>
            <div className="flex gap-2">
              <select value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white">
                <option value={fecha}>{fechaFormateada}</option>
              </select>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white">
                <option value="almuerzo">🥗 Almuerzo</option>
                <option value="cena">🌙 Cena</option>
              </select>
              <input type="number" value={capacidad} onChange={(e) => setCapacidad(parseInt(e.target.value) || 30)}
                min="1" max="100" className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white w-16 text-center" />
              <button onClick={guardarFormato} disabled={cargando || guardado}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${guardado ? "bg-gray-500" : "bg-emerald-600 hover:bg-emerald-700"} text-white disabled:opacity-50`}>
                {guardado ? "✅" : cargando ? "..." : "💾"}
              </button>
              <button onClick={imprimir} disabled={!guardado}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${guardado ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-300 text-gray-500"}`}>
                🖨️
              </button>
              <button onClick={() => router.push("/admin")}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm">←</button>
            </div>
          </div>
        </header>

        {mensaje && (
          <div className="max-w-[1600px] mx-auto w-full px-4 pt-2">
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
              mensaje.startsWith("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>{mensaje}</div>
          </div>
        )}

        <div className="flex-1 max-w-[1600px] mx-auto w-full p-4 flex gap-4 min-h-0">
          {/* IZQUIERDA: Lista de inscritos */}
          <div className="w-[320px] flex-shrink-0 flex flex-col gap-3">
            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-800">📋 Inscritos</span>
                <span className="text-xl font-bold text-gray-800">{inscritos.length}<span className="text-sm text-gray-400 font-normal">/{capacidad}</span></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="h-2.5 rounded-full transition-all duration-500" style={{
                  width: `${(inscritos.length / capacidad) * 100}%`,
                  background: estaLleno ? "linear-gradient(90deg, #dc2626, #b91c1c)" : "linear-gradient(90deg, #22c55e, #16a34a)",
                }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  estaLleno ? "bg-red-100 text-red-700" : guardado ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {estaLleno ? "🔒 LLENO" : guardado ? "✅ GUARDADO" : "📝 EN VIVO"}
                </span>
                <span className="text-xs text-gray-400">{mounted ? horaActual : ""}</span>
              </div>
            </div>

            {/* Lista */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase">Lista de Espera</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {inscritos.length === 0 ? (
                  <p className="text-gray-400 text-xs text-center py-8">Sin inscritos</p>
                ) : (
                  inscritos.map((insc) => (
                    <div key={insc.numero_orden}
                      className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors">
                      <span className="text-xs font-bold text-white bg-gray-600 rounded w-7 h-7 flex items-center justify-center flex-shrink-0">
                        {insc.numero_orden}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{insc.nombre}</p>
                        <p className="text-[10px] text-gray-400">{cicloARomano(insc.ciclo)} ciclo</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        insc.estado === "atendido" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {insc.estado === "atendido" ? "✓" : "⏳"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* DERECHA: Formato en vivo */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-0">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase">Formato en Vivo</p>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">● EN TIEMPO REAL</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Encabezado formato */}
              <div className="flex items-start gap-3 mb-3">
                <img src="/UNDC_logo.jpg" alt="UNDC" className="w-14 h-14 object-contain rounded-full" />
                <div className="text-center flex-1">
                  <p className="text-[9px] text-gray-400 italic">Ley de Org. N° 29498</p>
                  <p className="font-bold text-[10px]">DIRECCIÓN DE BIENESTAR UNIVERSITARIO</p>
                  <p className="font-bold text-xs">SERVICIO DE COMEDOR UNIVERSITARIO</p>
                </div>
                <img src="/DBU.jpg" alt="DBU" className="w-12 h-12 object-contain" />
              </div>

              <div className="bg-[#1a5c3a] text-white px-3 py-1 rounded text-[10px] flex justify-between mb-3">
                <span>Código: F-A03.04-BU-016</span>
                <span className="bg-white text-[#1a5c3a] px-2 py-0.5 rounded font-bold">v02</span>
              </div>

              <h2 className="text-center font-bold text-sm mb-2">
                ADICIONALES DE {tipo === "almuerzo" ? "ALMUERZO" : "CENA"}
              </h2>
              <p className="text-xs font-semibold mb-2">FECHA: {fechaFormateada}</p>

              {/* Tabla */}
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[#1a5c3a] text-white">
                    <th className="border border-gray-400 py-1.5 px-1 w-8">N°</th>
                    <th className="border border-gray-400 py-1.5 px-2 text-left">APELLIDOS Y NOMBRES</th>
                    <th className="border border-gray-400 py-1.5 px-2 text-left">ESCUELA</th>
                    <th className="border border-gray-400 py-1.5 px-1 w-10">CICLO</th>
                    <th className="border border-gray-400 py-1.5 px-1 w-14">FIRMA</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, idx) => {
                    const ocupada = !!fila.nombre;
                    return (
                      <tr key={idx} className={
                        ocupada ? "bg-green-50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }>
                        <td className="border border-gray-300 py-1.5 px-1 text-center font-semibold text-gray-600">{fila.numero}</td>
                        <td className={`border border-gray-300 py-1.5 px-2 ${ocupada ? "text-gray-800 font-medium" : "text-gray-300"}`}>
                          {fila.nombre || "—"}
                        </td>
                        <td className="border border-gray-300 py-1.5 px-2 text-gray-500">ING. SISTEMAS</td>
                        <td className="border border-gray-300 py-1.5 px-1 text-center text-gray-600">{fila.ciclo || "—"}</td>
                        <td className="border border-gray-300 py-1.5 px-1"></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Imprimible - solo visible al imprimir */}
      <div className="print-area bg-white max-w-[800px] mx-auto">
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
        <div className="bg-[#1a5c3a] text-white px-4 py-2 rounded text-xs flex justify-between mb-4">
          <span>Código: F-A03.04-BU-016 &nbsp;&nbsp; Fecha: {fechaFormateada}</span>
          <span className="bg-white text-[#1a5c3a] px-3 py-0.5 rounded font-bold">Versión: 02</span>
        </div>
        <h2 className="text-center font-bold text-lg mb-4">ADICIONALES DE {tipo === "almuerzo" ? "ALMUERZO" : "CENA"}</h2>
        <p className="text-sm font-semibold mb-3">FECHA: {fechaFormateada}</p>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#1a5c3a] text-white">
              <th className="border border-gray-400 py-2 px-2 w-12">N°</th>
              <th className="border border-gray-400 py-2 px-3 text-left">APELLIDOS Y NOMBRES</th>
              <th className="border border-gray-400 py-2 px-3 text-left">ESCUELA PROFESIONAL</th>
              <th className="border border-gray-400 py-2 px-2 w-16">CICLO</th>
              <th className="border border-gray-400 py-2 px-2 w-20">FIRMA</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-300 py-2 px-2 text-center font-semibold">{fila.numero}</td>
                <td className="border border-gray-300 py-2 px-3">{fila.nombre}</td>
                <td className="border border-gray-300 py-2 px-3 text-gray-600">ING. DE SISTEMAS</td>
                <td className="border border-gray-300 py-2 px-2 text-center">{fila.ciclo}</td>
                <td className="border border-gray-300 py-2 px-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[9px] text-gray-400 text-center mt-4 italic">
          Toda copia de este documento es considerada &quot;copia no controlada&quot;.
        </p>
      </div>
    </>
  );
}
