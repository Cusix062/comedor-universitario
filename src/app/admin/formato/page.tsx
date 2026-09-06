"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  const [horaActual, setHoraActual] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
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

      // Verificar si hay formato guardado
      const formatRes = await fetch(`/api/admin/formatos?fecha=${fecha}&tipo=${tipo}`);
      const formatoGuardado = await formatRes.json();
      if (formatoGuardado) {
        setGuardado(true);
      } else {
        setGuardado(false);
      }
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
          fecha,
          tipo,
          capacidad,
          cantidad_inscritos: inscritos.length,
          inscritos_json: inscritos,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje("✅ Formato guardado correctamente");
        setGuardado(true);
      } else {
        setMensaje("❌ " + data.error);
      }
    } catch {
      setMensaje("❌ Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const imprimir = () => {
    window.print();
  };

  const estaLleno = inscritos.length >= capacidad;

  const fechaFormateada = new Date(fecha + "T12:00:00").toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const filas = Array.from({ length: capacidad }, (_, i) => {
    const insc = inscritos.find((insc) => insc.numero_orden === i + 1);
    return {
      numero: String(i + 1).padStart(2, "0"),
      nombre: insc?.nombre || "",
      ciclo: insc?.ciclo ? `${insc.ciclo}°` : "",
    };
  });

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
                📄
              </div>
              <div>
                <h1 className="text-lg font-bold">Formato de Lista - {horaActual.toLocaleTimeString("es-PE", { hour12: true })}</h1>
                <p className="text-gray-400 text-xs">Actualización en vivo cada 5 segundos</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={guardarFormato}
                disabled={cargando || guardado}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
                  guardado
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700"
                } text-white disabled:opacity-50`}
              >
                {guardado ? "✅ Guardado" : cargando ? "Guardando..." : "💾 Guardar"}
              </button>
              <button
                onClick={imprimir}
                disabled={!guardado}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
                  guardado
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={() => router.push("/admin")}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                ← Volver
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-4 space-y-4">
          {mensaje && (
            <div className={`px-5 py-3 rounded-xl flex items-center gap-3 ${
              mensaje.startsWith("✅")
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              <span className="font-medium">{mensaje}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">📅 Fecha:</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">🍽️ Turno:</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as "almuerzo" | "cena")}
                className="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="almuerzo">🥗 Almuerzo</option>
                <option value="cena">🌙 Cena</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">📊 Capacidad:</label>
              <input
                type="number"
                value={capacidad}
                onChange={(e) => setCapacidad(parseInt(e.target.value) || 30)}
                min="1"
                max="100"
                className="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm w-20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{inscritos.length}/{capacidad}</p>
                <p className="text-xs text-gray-400">Inscritos</p>
              </div>
              <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
                estaLleno
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : guardado
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-blue-100 text-blue-700 border border-blue-200"
              }`}>
                {estaLleno
                  ? "🔒 CERRADO - Hoja Llena"
                  : guardado
                  ? "✅ GUARDADO"
                  : "📝 EN VIVO"}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Progreso de la hoja</h3>
              <span className="text-sm text-gray-500">{Math.round((inscritos.length / capacidad) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4">
              <div
                className="h-4 rounded-full transition-all duration-500"
                style={{
                  width: `${(inscritos.length / capacidad) * 100}%`,
                  background: estaLleno
                    ? "linear-gradient(90deg, #dc2626, #b91c1c)"
                    : "linear-gradient(90deg, #22c55e, #16a34a)",
                }}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Hoja imprimible */}
      <div className="print-area bg-white max-w-[800px] mx-auto my-8 p-8 shadow-lg border border-gray-200">
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
          ADICIONALES DE {tipo === "almuerzo" ? "ALMUERZO" : "CENA"}
        </h2>

        <p className="text-sm font-semibold mb-3">
          FECHA: {fechaFormateada}
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
            {filas.map((fila, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-300 py-2 px-2 text-center font-semibold text-gray-700">
                  {fila.numero}
                </td>
                <td className="border border-gray-300 py-2 px-3 text-gray-800">
                  {fila.nombre}
                </td>
                <td className="border border-gray-300 py-2 px-3 text-gray-600">
                  ING. DE SISTEMAS
                </td>
                <td className="border border-gray-300 py-2 px-2 text-center text-gray-700">
                  {fila.ciclo}
                </td>
                <td className="border border-gray-300 py-2 px-2"></td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-[9px] text-gray-400 text-center mt-4 italic">
          Toda copia de este documento, sea del entorno virtual o del documento original en físico es considerada &quot;copia no controlada&quot;.
        </p>
      </div>
    </>
  );
}
