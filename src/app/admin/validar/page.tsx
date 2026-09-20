"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import PDFReport from "@/components/PDFReport";
import AdminLayout from "@/components/AdminLayout";

export default function ValidarPage() {
  const [busqueda, setBusqueda] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [filtroTurno, setFiltroTurno] = useState("todos");
  const [filtroCiclo, setFiltroCiclo] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session");
    const googleAdmin = localStorage.getItem("google_admin_session");
    if (!adminSession && !googleAdmin) {
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((session) => {
          if (session?.user?.isAdmin) {
            localStorage.setItem("google_admin_session", "true");
            fetchInscritos();
          } else {
            router.push("/");
          }
        })
        .catch(() => router.push("/"));
      return;
    }
    fetchInscritos();
  }, [router, fecha]);

  const fetchInscritos = async () => {
    setCargando(true);
    try {
      const res = await fetch(`/api/admin/validar?fecha=${fecha}`);
      const data = await res.json();
      setInscritos(data);
    } catch {
      console.error("Error");
    } finally {
      setCargando(false);
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

  const marcarAtendido = async (inscripcionId?: number) => {
    const id = inscripcionId ?? resultado?.id;
    if (!id) return;

    try {
      const res = await fetch("/api/admin/validar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inscripcion_id: id, accion: "atender" }),
      });

      if (res.ok) {
        if (inscripcionId) {
          fetchInscritos();
        } else {
          setMensaje(`✅ ${resultado.nombre} marcado como atendido`);
          setResultado(null);
          setBusqueda("");
          fetchInscritos();
          inputRef.current?.focus();
        }
      }
    } catch {
      setError("Error al marcar asistencia");
    }
  };

  const eliminarInscripcion = async (inscripcionId: number, nombre: string) => {
    if (!confirm(`¿Eliminar la inscripción de ${nombre}? Se liberará el cupo.`)) return;
    try {
      const res = await fetch(`/api/admin/validar?id=${inscripcionId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchInscritos();
    } catch {
      console.error("Error");
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

  const enviarTelegram = async (turno: string) => {
    if (!confirm(`Enviar reporte de ${turno.toUpperCase()} a Telegram?`)) return;
    try {
      const res = await fetch("/api/admin/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, turno }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Reporte de ${turno} enviado ✅`);
      } else {
        alert("Error al enviar: " + (data.error || "Desconocido"));
      }
    } catch {
      alert("Error de conexión");
    }
  };

  const almuerzos = inscritos.filter((i) => i.turno === "almuerzo");
  const cenas = inscritos.filter((i) => i.turno === "cena");
  const atendidos = inscritos.filter((i) => i.estado === "atendido").length;
  const pendientes = inscritos.filter((i) => i.estado === "reservado").length;

  const filtrados = inscritos.filter((insc) => {
    if (filtroTurno !== "todos" && insc.turno !== filtroTurno) return false;
    if (filtroCiclo !== "todos" && String(insc.ciclo) !== filtroCiclo) return false;
    if (filtroEstado !== "todos" && insc.estado !== filtroEstado) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #15803d, #4ade80)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-extrabold tracking-tight">{almuerzos.length}</p>
                <p className="text-white/80 text-sm mt-0.5 font-medium">Almuerzos</p>
              </div>
              <span className="text-4xl opacity-80">🥗</span>
            </div>
          </div>

          <div className="rounded-xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #b45309, #fbbf24)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-extrabold tracking-tight">{cenas.length}</p>
                <p className="text-white/80 text-sm mt-0.5 font-medium">Cenas</p>
              </div>
              <span className="text-4xl opacity-80">🌙</span>
            </div>
          </div>

          <div className="rounded-xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #1d4ed8, #60a5fa)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-extrabold tracking-tight">{atendidos}</p>
                <p className="text-white/80 text-sm mt-0.5 font-medium">Atendidos</p>
              </div>
              <span className="text-4xl opacity-80">✅</span>
            </div>
          </div>

          <div className="rounded-xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-extrabold tracking-tight">{pendientes}</p>
                <p className="text-white/80 text-sm mt-0.5 font-medium">Pendientes</p>
              </div>
              <span className="text-4xl opacity-80">⏳</span>
            </div>
          </div>
        </div>

        {/* ── Controls Bar ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-600">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />
          <button
            onClick={fetchInscritos}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Actualizar
          </button>
          <a
            href={`/api/admin/export?fecha=${fecha}`}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Excel
          </a>
          <PDFReport inscripciones={inscritos} fecha={fecha} />
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />
          <button
            onClick={() => enviarTelegram("almuerzo")}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            🥗 Almuerzo
          </button>
          <button
            onClick={() => enviarTelegram("cena")}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            🌙 Cena
          </button>
        </div>

        {/* ── Search / Validate Card ── */}
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
          <p className="text-xs text-slate-400 mt-2">Presiona Enter para buscar o confirmar atención</p>
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
                  onClick={() => marcarAtendido()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold text-sm transition mt-5"
                >
                  Marcar como Atendido
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Inscritos Table ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Inscritos del día — {inscritos.length} total
            </h2>
          </div>

          <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap gap-3">
            <select
              value={filtroTurno}
              onChange={(e) => setFiltroTurno(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="todos">Todos los turnos</option>
              <option value="almuerzo">Almuerzo</option>
              <option value="cena">Cena</option>
            </select>
            <select
              value={filtroCiclo}
              onChange={(e) => setFiltroCiclo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="todos">Todos los ciclos</option>
              {[...new Set(inscritos.map((i) => i.ciclo))].sort((a, b) => a - b).map((c) => (
                <option key={c} value={c}>Ciclo {c}</option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="todos">Todos los estados</option>
              <option value="reservado">Reservado</option>
              <option value="atendido">Atendido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {cargando ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-3 text-gray-400 text-sm">Cargando inscritos…</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
                📭
              </div>
              <p className="text-gray-500 font-medium">No hay inscritos para esta fecha</p>
              <p className="text-gray-400 text-sm mt-1">Selecciona otra fecha o actualiza la lista</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">N°</th>
                    <th className="text-left py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="text-left py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="text-left py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Ciclo</th>
                    <th className="text-left py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Turno</th>
                    <th className="text-left py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-right py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((insc, idx) => (
                    <tr
                      key={insc.id}
                      className={`border-b border-gray-100 last:border-0 transition-colors hover:bg-blue-50/40 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="py-3.5 px-5 font-bold text-gray-800">{insc.numero_orden}</td>
                      <td className="py-3.5 px-5 font-semibold text-gray-800">{insc.nombre}</td>
                      <td className="py-3.5 px-5 text-gray-500 font-mono text-xs">{insc.codigo}</td>
                      <td className="py-3.5 px-5 text-gray-500 text-xs">{insc.ciclo}</td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            insc.turno === "almuerzo"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {insc.turno === "almuerzo" ? "🥗" : "🌙"}{" "}
                          {insc.turno === "almuerzo" ? "Almuerzo" : "Cena"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            insc.estado === "reservado"
                              ? "bg-blue-100 text-blue-700"
                              : insc.estado === "atendido"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {insc.estado === "reservado" && "📋"}
                          {insc.estado === "atendido" && "✔️"}
                          {insc.estado === "cancelado" && "✖️"}{" "}
                          {insc.estado.charAt(0).toUpperCase() + insc.estado.slice(1)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-2">
                          {insc.estado === "reservado" && (
                            <button
                              onClick={() => marcarAtendido(insc.id)}
                              title="Marcar como atendido"
                              className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Atender
                            </button>
                          )}
                          <button
                            onClick={() => eliminarInscripcion(insc.id, insc.nombre)}
                            title="Eliminar inscripción"
                            className="inline-flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
