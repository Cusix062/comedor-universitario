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
      setError("Ingrese un código, nombre o DNI");
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
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">📱 Validación de Tickets</h1>
            <p className="text-purple-100 text-sm">Escanea o busca por código/nombre</p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
          >
            ← Volver
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Buscador */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex gap-4">
            <input
              ref={inputRef}
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe código, nombre o N° de cupo..."
              className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-4 text-lg focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={buscar}
              className="bg-purple-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-purple-600 transition text-lg"
            >
              🔍 Buscar
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Presiona Enter para buscar o confirmar atención
          </p>
        </div>

        {/* Mensajes */}
        {mensaje && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-lg">
            {mensaje}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-lg">
            {error}
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className={`p-6 ${
              resultado.estado === "atendido"
                ? "bg-green-500"
                : resultado.turno === "almuerzo"
                ? "bg-red-500"
                : "bg-orange-500"
            } text-white text-center`}>
              <p className="text-6xl font-bold">#{resultado.numero_orden}</p>
              <p className="text-xl mt-2">
                {resultado.turno === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"}
              </p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Nombre:</span>
                <span className="font-bold text-lg">{resultado.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Código:</span>
                <span className="font-bold">{resultado.codigo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado:</span>
                <span className={`font-bold ${
                  resultado.estado === "reservado"
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}>
                  {resultado.estado === "reservado" ? "⏳ Pendiente" : "✅ Atendido"}
                </span>
              </div>

              {resultado.estado === "reservado" && (
                <button
                  onClick={marcarAtendido}
                  className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-xl hover:bg-green-600 transition mt-4"
                >
                  ✅ Marcar como Atendido
                </button>
              )}
            </div>
          </div>
        )}

        {/* Lista rápida */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">📋 Lista del día</h2>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border rounded-lg px-3 py-1 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {inscritos.map((insc) => (
              <button
                key={insc.id}
                onClick={() => {
                  setResultado(insc);
                  setBusqueda("");
                  setError("");
                  setMensaje("");
                }}
                className={`p-3 rounded-lg text-left border-2 transition ${
                  insc.estado === "atendido"
                    ? "border-green-300 bg-green-50"
                    : insc.turno === "almuerzo"
                    ? "border-red-200 hover:border-red-400 bg-red-50"
                    : "border-orange-200 hover:border-orange-400 bg-orange-50"
                }`}
              >
                <p className="font-bold text-lg">#{insc.numero_orden}</p>
                <p className="text-sm text-gray-700 truncate">{insc.nombre}</p>
                <p className="text-xs text-gray-500">{insc.codigo}</p>
              </button>
            ))}
          </div>
          {inscritos.length === 0 && (
            <p className="text-center text-gray-500 py-4">No hay inscritos hoy</p>
          )}
        </div>
      </main>
    </div>
  );
}
