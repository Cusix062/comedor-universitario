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

  const filtrados = inscritos.filter((insc) => {
    const termino = busqueda.toLowerCase().trim();
    if (termino && !insc.nombre.toLowerCase().includes(termino) && !insc.codigo.toLowerCase().includes(termino)) return false;
    if (filtroTurno !== "todos" && insc.turno !== filtroTurno) return false;
    if (filtroCiclo !== "todos" && String(insc.ciclo) !== filtroCiclo) return false;
    if (filtroEstado !== "todos" && insc.estado !== filtroEstado) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Codigo, nombre o N de cupo..."
              className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
            <button
              onClick={buscar}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium text-sm transition flex items-center gap-2"
            >
              Buscar
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Presiona Enter para buscar o confirmar atencion</p>
        </div>

        {mensaje && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className="text-sm font-medium">{mensaje}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {resultado && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className={`px-6 py-10 text-center ${
              resultado.estado === "atendido"
                ? "bg-emerald-600"
                : resultado.turno === "almuerzo"
                ? "bg-emerald-500"
                : "bg-amber-500"
            }`}>
              <p className="text-5xl font-bold text-white tracking-tight">#{resultado.numero_orden}</p>
              <p className="text-lg mt-2 text-white/90 font-medium">
                {resultado.turno === "almuerzo" ? "Almuerzo" : "Cena"}
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Nombre</span>
                  <span className="text-sm font-semibold text-slate-900">{resultado.nombre}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Codigo</span>
                  <span className="text-sm font-semibold text-slate-900 font-mono">{resultado.codigo}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-sm text-slate-500">Estado</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    resultado.estado === "reservado"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {resultado.estado === "reservado" ? "Pendiente" : "Atendido"}
                  </span>
                </div>
              </div>

              {resultado.estado === "reservado" && (
                <button
                  onClick={marcarAtendido}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold text-sm transition mt-5"
                >
                  Marcar como Atendido
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-sm font-semibold text-slate-900">Lista del dia</h2>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-3 mb-5 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o codigo..."
              className="flex-1 min-w-[180px] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <select
              value={filtroTurno}
              onChange={(e) => setFiltroTurno(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="todos">Todos los turnos</option>
              <option value="almuerzo">Almuerzo</option>
              <option value="cena">Cena</option>
            </select>
            <select
              value={filtroCiclo}
              onChange={(e) => setFiltroCiclo(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="todos">Todos los ciclos</option>
              {[...new Set(inscritos.map((i) => i.ciclo))].sort((a, b) => a - b).map((c) => (
                <option key={c} value={c}>Ciclo {c}</option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="todos">Todos los estados</option>
              <option value="reservado">Reservado</option>
              <option value="atendido">Atendido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {filtrados.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtrados.map((insc) => (
                <button
                  key={insc.id}
                  onClick={() => {
                    setResultado(insc);
                    setBusqueda("");
                    setError("");
                    setMensaje("");
                  }}
                  className={`p-4 rounded-lg text-left border transition hover:shadow-md ${
                    insc.estado === "atendido"
                      ? "border-emerald-200 bg-emerald-50"
                      : insc.turno === "almuerzo"
                      ? "border-slate-200 hover:border-emerald-400 bg-white"
                      : "border-slate-200 hover:border-amber-400 bg-white"
                  }`}
                >
                  <p className="text-lg font-bold text-slate-900">#{insc.numero_orden}</p>
                  <p className="text-xs text-slate-600 truncate mt-1">{insc.nombre}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{insc.codigo}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              <p className="text-sm text-slate-500">No se encontraron registros con esos filtros</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
