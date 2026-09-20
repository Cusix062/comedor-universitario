"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

export default function ValidarPage() {
  const [busqueda, setBusqueda] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [filtroTurno, setFiltroTurno] = useState("todos");
  const [filtroCiclo, setFiltroCiclo] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session");
    const googleAdmin = localStorage.getItem("google_admin_session");
    if (!adminSession && !googleAdmin) {
      fetch("/api/auth/session").then(r => r.json()).then(session => {
        if (session?.user?.isAdmin) {
          localStorage.setItem("google_admin_session", "true");
          inputRef.current?.focus();
          fetchInscritos();
        } else {
          router.push("/");
        }
      }).catch(() => router.push("/"));
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
    <AdminLayout>
      <div className="space-y-5 max-w-5xl">
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

          <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="flex-1 min-w-[180px] border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
            <select
              value={filtroTurno}
              onChange={(e) => setFiltroTurno(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
              <option value="todos">Todos los turnos</option>
              <option value="almuerzo">Almuerzo</option>
              <option value="cena">Cena</option>
            </select>
            <select
              value={filtroCiclo}
              onChange={(e) => setFiltroCiclo(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
              <option value="todos">Todos los ciclos</option>
              {[...new Set(inscritos.map((i) => i.ciclo))].sort((a, b) => a - b).map((c) => (
                <option key={c} value={c}>Ciclo {c}</option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
              <option value="todos">Todos los estados</option>
              <option value="reservado">Reservado</option>
              <option value="atendido">Atendido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {(() => {
            const termino = busqueda.toLowerCase().trim();
            const filtrados = inscritos.filter((insc) => {
              if (termino && !insc.nombre.toLowerCase().includes(termino) && !insc.codigo.toLowerCase().includes(termino)) return false;
              if (filtroTurno !== "todos" && insc.turno !== filtroTurno) return false;
              if (filtroCiclo !== "todos" && String(insc.ciclo) !== filtroCiclo) return false;
              if (filtroEstado !== "todos" && insc.estado !== filtroEstado) return false;
              return true;
            });
            return filtrados.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {filtrados.map((insc) => (
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
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">📭</div>
                <p className="text-gray-400">No se encontraron registros con esos filtros</p>
              </div>
            );
          })()}
        </div>
      </div>
    </AdminLayout>
  );
}
