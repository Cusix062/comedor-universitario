"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ValidarPage() {
  const [busqueda, setBusqueda] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [inscritos, setInscritos] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session");
    if (!adminSession) {
      router.push("/");
      return;
    }
    inputRef.current?.focus();
    fetchInscritos();
  }, [router, fecha]);

  const fetchInscritos = async () => {
    try {
      const res = await fetch(`/api/admin/validar?fecha=${fecha}`);
      const data = await res.json();
      setInscritos(data);
    } catch {
      console.error("Error");
    }
  };

  const buscar = () => {
    setError("");
    setResultado(null);
    setMensaje("");

    if (!busqueda.trim()) {
      setError("Ingrese un código, nombre o N° de cupo");
      return;
    }

    const termino = busqueda.toLowerCase().trim();
    const encontrado = inscritos.find(
      (i) =>
        i.codigo.toLowerCase().includes(termino) ||
        i.nombre.toLowerCase().includes(termino) ||
        String(i.numero_orden) === termino
    );

    if (encontrado) {
      setResultado(encontrado);
    } else {
      setError("No se encontró ningún registro con esos datos");
    }
  };

  const marcarAtendido = async () => {
    if (!resultado) return;

    try {
      const res = await fetch("/api/admin/validar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inscripcion_id: resultado.id,
          accion: "atender",
        }),
      });

      if (res.ok) {
        setMensaje(`✅ ${resultado.nombre} marcado como atendido`);
        setResultado(null);
        setBusqueda("");
        fetchInscritos();
        inputRef.current?.focus();
      }
    } catch {
      setError("Error al marcar asistencia");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (resultado) {
        marcarAtendido();
      } else {
        buscar();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white shadow-lg" style={{ background: "linear-gradient(135deg, #581c87, #7c3aed)" }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg">
              📱
            </div>
            <div>
              <h1 className="text-lg font-bold">Validación de Tickets</h1>
              <p className="text-purple-200 text-xs">Escanea o busca por código/nombre</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition text-sm font-medium"
          >
            ← Volver
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe código, nombre o N° de cupo..."
              className="flex-1 border-2 border-gray-200 rounded-xl px-5 py-4 text-base text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
            />
            <button
              onClick={buscar}
              className="text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
            >
              🔍 Buscar
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Presiona Enter para buscar o confirmar atención
          </p>
        </div>

        {mensaje && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-xl flex items-center gap-3">
            <span className="text-xl">✅</span>
            <span className="font-medium">{mensaje}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {resultado && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`px-6 py-8 text-center ${
              resultado.estado === "atendido"
                ? "bg-emerald-500"
                : resultado.turno === "almuerzo"
                ? "bg-green-500"
                : "bg-amber-500"
            }`}>
              <p className="text-6xl font-bold text-white">#{resultado.numero_orden}</p>
              <p className="text-xl mt-2 text-white/90 font-medium">
                {resultado.turno === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Nombre</span>
                <span className="font-bold text-gray-800">{resultado.nombre}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Código</span>
                <span className="font-bold text-gray-800 font-mono">{resultado.codigo}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Estado</span>
                <span className={`font-bold ${
                  resultado.estado === "reservado" ? "text-amber-600" : "text-green-600"
                }`}>
                  {resultado.estado === "reservado" ? "⏳ Pendiente" : "✅ Atendido"}
                </span>
              </div>

              {resultado.estado === "reservado" && (
                <button
                  onClick={marcarAtendido}
                  className="w-full text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] mt-4"
                  style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
                >
                  ✅ Marcar como Atendido
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-sm">📋</span>
              Lista del día
            </h2>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {inscritos.map((insc) => (
              <button
                key={insc.id}
                onClick={() => {
                  setResultado(insc);
                  setBusqueda("");
                  setError("");
                  setMensaje("");
                }}
                className={`p-4 rounded-xl text-left border-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  insc.estado === "atendido"
                    ? "border-green-300 bg-green-50"
                    : insc.turno === "almuerzo"
                    ? "border-gray-200 hover:border-green-400 bg-white"
                    : "border-gray-200 hover:border-amber-400 bg-white"
                }`}
              >
                <p className="font-bold text-xl text-gray-800">#{insc.numero_orden}</p>
                <p className="text-xs text-gray-600 truncate mt-1">{insc.nombre}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{insc.codigo}</p>
              </button>
            ))}
          </div>
          {inscritos.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">📭</div>
              <p className="text-gray-400">No hay inscritos hoy</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
