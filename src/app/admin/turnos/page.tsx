"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";

interface Cupo {
  id: number;
  fecha: string;
  tipo: string;
  capacidad: number;
  ocupados: number;
  estado: string;
}

interface DiaCalendario {
  fecha: string;
  fechaCorta: string;
  diaSemana: string;
  diaNumero: number;
  esHoy: boolean;
  almuerzo: Cupo | null;
  cena: Cupo | null;
}

export default function AdminTurnosPage() {
  const [cupos, setCupos] = useState<Cupo[]>([]);
  const [dias, setDias] = useState<DiaCalendario[]>([]);
  const [semanaActual, setSemanaActual] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [modalEditar, setModalEditar] = useState<Cupo | null>(null);
  const [modalEliminar, setModalEliminar] = useState<Cupo | null>(null);
  const [nuevaCapacidad, setNuevaCapacidad] = useState(0);
  const [nuevoEstado, setNuevoEstado] = useState("abierto");
  const [modalCrear, setModalCrear] = useState<string | null>(null);
  const [nuevoAlmuerzo, setNuevoAlmuerzo] = useState(30);
  const [nuevoCena, setNuevoCena] = useState(30);
  const [modalGenerar, setModalGenerar] = useState(false);
  const [fechasSeleccionadas, setFechasSeleccionadas] = useState<string[]>([]);
  const [mesCalendario, setMesCalendario] = useState(new Date());
  const [capAlmuerzoGen, setCapAlmuerzoGen] = useState(30);
  const [capCenaGen, setCapCenaGen] = useState(30);
  const [diaSeleccionado, setDiaSeleccionado] = useState(0);

  useEffect(() => {
    fetchCupos();
  }, []);

  useEffect(() => {
    generarCalendario();
  }, [cupos, semanaActual]);

  const fetchCupos = async () => {
    try {
      const res = await fetch("/api/admin/turnos");
      const data = await res.json();
      setCupos(data);
    } catch {
      console.error("Error");
    }
  };

  const generarCalendario = () => {
    const hoy = new Date();
    const diasCalendario: DiaCalendario[] = [];
    const nombresDias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i + semanaActual * 7);
      const fechaStr = fecha.toISOString().split("T")[0];
      const diaSemana = nombresDias[fecha.getDay()];
      const mes = nombresMeses[fecha.getMonth()];

      const almuerzo = cupos.find(c => c.fecha === fechaStr && c.tipo === "almuerzo") || null;
      const cena = cupos.find(c => c.fecha === fechaStr && c.tipo === "cena") || null;

      diasCalendario.push({
        fecha: fechaStr,
        fechaCorta: `${fecha.getDate()} ${mes}`,
        diaSemana,
        diaNumero: fecha.getDate(),
        esHoy: fecha.toISOString().split("T")[0] === hoy.toISOString().split("T")[0],
        almuerzo,
        cena,
      });
    }

    setDias(diasCalendario);
  };

  const editarCupo = async () => {
    if (!modalEditar) return;
    setCargando(true);
    try {
      const res = await fetch("/api/admin/turnos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: modalEditar.id,
          capacidad: nuevaCapacidad,
          estado: nuevoEstado,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje("✅ Cupo actualizado");
        setModalEditar(null);
        fetchCupos();
      } else {
        setMensaje("❌ " + data.error);
      }
    } catch {
      setMensaje("❌ Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const eliminarCupo = async () => {
    if (!modalEliminar) return;
    setCargando(true);
    try {
      const res = await fetch(`/api/admin/turnos?id=${modalEliminar.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje("✅ Cupo eliminado");
        setModalEliminar(null);
        fetchCupos();
      } else {
        setMensaje("❌ " + data.error);
      }
    } catch {
      setMensaje("❌ Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const crearCuposDia = async () => {
    if (!modalCrear) return;
    setCargando(true);
    try {
      const res = await fetch("/api/admin/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: modalCrear,
          almuerzo_capacidad: nuevoAlmuerzo,
          cena_capacidad: nuevoCena,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje("✅ Cupos creados para " + modalCrear);
        setModalCrear(null);
        fetchCupos();
      } else {
        setMensaje("❌ " + data.error);
      }
    } catch {
      setMensaje("❌ Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const generarMultiplesDias = async () => {
    if (fechasSeleccionadas.length === 0) {
      setMensaje("❌ Selecciona al menos una fecha");
      return;
    }

    const promesas = fechasSeleccionadas.map(fecha =>
      fetch("/api/admin/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha,
          almuerzo_capacidad: capAlmuerzoGen,
          cena_capacidad: capCenaGen,
        }),
      })
    );

    await Promise.all(promesas);
    setMensaje(`✅ Cupos generados para ${fechasSeleccionadas.length} día(s)`);
    setModalGenerar(false);
    setFechasSeleccionadas([]);
    fetchCupos();
  };

  const toggleFecha = (fecha: string) => {
    setFechasSeleccionadas(prev =>
      prev.includes(fecha)
        ? prev.filter(f => f !== fecha)
        : [...prev, fecha]
    );
  };

  const seleccionarRango = (dias: number) => {
    const hoy = new Date();
    const fechas: string[] = [];
    for (let i = 0; i < dias; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      fechas.push(fecha.toISOString().split("T")[0]);
    }
    setFechasSeleccionadas(fechas);
  };

  const generarCalendarioModal = () => {
    const anio = mesCalendario.getFullYear();
    const mes = mesCalendario.getMonth();
    const primerDia = new Date(anio, mes, 1).getDay();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const dias: { fecha: string; dia: number; esHoy: boolean; yaExiste: boolean }[] = [];

    for (let i = 1; i <= diasEnMes; i++) {
      const fecha = new Date(anio, mes, i);
      const fechaStr = fecha.toISOString().split("T")[0];
      const hoy = new Date().toISOString().split("T")[0];
      const yaExiste = cupos.some(c => c.fecha === fechaStr);
      dias.push({
        fecha: fechaStr,
        dia: i,
        esHoy: fechaStr === hoy,
        yaExiste,
      });
    }

    return { primerDia, dias };
  };

  const semanaLabels = ["Esta semana", "Próxima semana", "En 2 semanas"];
  const diaActual = dias[diaSeleccionado];
  const nombresDiasLargos = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const getPorcentaje = (ocupados: number, capacidad: number) =>
    capacidad > 0 ? Math.min(100, Math.round((ocupados / capacidad) * 100)) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">

        {mensaje && (
          <div className={`px-5 py-3.5 rounded-xl flex items-center gap-3 text-sm font-medium ${
            mensaje.startsWith("✅")
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {mensaje}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Cupos</h1>
            <p className="text-sm text-gray-500 mt-1">Administra la capacidad del comedor por día y turno</p>
          </div>
          <button
            onClick={() => setModalGenerar(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Generar Múltiples Días
          </button>
        </div>

        {/* Date Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (diaSeleccionado > 0) {
                  setDiaSeleccionado(diaSeleccionado - 1);
                } else if (semanaActual > 0) {
                  setSemanaActual(semanaActual - 1);
                  setDiaSeleccionado(6);
                }
              }}
              disabled={semanaActual === 0 && diaSeleccionado === 0}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              {diaActual ? (
                <>
                  <p className="text-sm text-gray-500 font-medium">{diaActual.diaSemana}</p>
                  <p className="text-2xl font-bold text-gray-900">{diaActual.fechaCorta}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">{semanaLabels[semanaActual] || `En ${semanaActual} semanas`}</p>
              )}
            </div>

            <button
              onClick={() => {
                if (diaSeleccionado < 6) {
                  setDiaSeleccionado(diaSeleccionado + 1);
                } else {
                  setSemanaActual(semanaActual + 1);
                  setDiaSeleccionado(0);
                }
              }}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex justify-center mt-2">
            <button
              onClick={() => { setSemanaActual(0); setDiaSeleccionado(0); }}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition"
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Calendario Mini - Day Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
          <div className="grid grid-cols-7 gap-1">
            {dias.map((dia, idx) => (
              <button
                key={dia.fecha}
                onClick={() => setDiaSeleccionado(idx)}
                className={`relative flex flex-col items-center py-2.5 rounded-xl transition ${
                  diaSeleccionado === idx
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : dia.esHoy
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50 text-gray-600"
                }`}
              >
                <span className={`text-[11px] font-semibold ${
                  diaSeleccionado === idx ? "text-blue-100" : "text-gray-400"
                }`}>
                  {dia.diaSemana}
                </span>
                <span className={`text-lg font-bold ${
                  diaSeleccionado === idx ? "" : ""
                }`}>
                  {dia.diaNumero}
                </span>
                <div className="flex gap-1 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    diaSeleccionado === idx
                      ? "bg-white"
                      : dia.almuerzo
                      ? "bg-green-500"
                      : "bg-gray-200"
                  }`} />
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    diaSeleccionado === idx
                      ? "bg-white/70"
                      : dia.cena
                      ? "bg-amber-500"
                      : "bg-gray-200"
                  }`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cupos Cards */}
        {diaActual && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Almuerzo Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Almuerzo</h3>
                      <p className="text-xs text-gray-500">Turno de mediodía</p>
                    </div>
                  </div>
                  {diaActual.almuerzo && (
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wide ${
                      diaActual.almuerzo.estado === "abierto"
                        ? "bg-green-100 text-green-700"
                        : diaActual.almuerzo.estado === "cerrado"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {diaActual.almuerzo.estado}
                    </span>
                  )}
                </div>

                {diaActual.almuerzo ? (
                  <>
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span className="text-3xl font-extrabold text-gray-900">{diaActual.almuerzo.ocupados}</span>
                      <span className="text-sm text-gray-400 font-medium">/ {diaActual.almuerzo.capacidad} cupos</span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          getPorcentaje(diaActual.almuerzo.ocupados, diaActual.almuerzo.capacidad) >= 90
                            ? "bg-red-500"
                            : getPorcentaje(diaActual.almuerzo.ocupados, diaActual.almuerzo.capacidad) >= 70
                            ? "bg-amber-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${getPorcentaje(diaActual.almuerzo.ocupados, diaActual.almuerzo.capacidad)}%`,
                        }}
                      />
                    </div>

                    <p className="text-xs text-gray-400 mb-4">
                      {getPorcentaje(diaActual.almuerzo.ocupados, diaActual.almuerzo.capacidad)}% ocupado
                      {diaActual.almuerzo.capacidad - diaActual.almuerzo.ocupados > 0 && (
                        <span className="text-gray-300"> · {diaActual.almuerzo.capacidad - diaActual.almuerzo.ocupados} disponibles</span>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 mb-4">Sin cupo configurado</p>
                )}

                <div className="flex gap-2">
                  {diaActual.almuerzo ? (
                    <>
                      <button
                        onClick={() => {
                          setModalEditar(diaActual.almuerzo);
                          setNuevaCapacidad(diaActual.almuerzo!.capacidad);
                          setNuevoEstado(diaActual.almuerzo!.estado);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => setModalEliminar(diaActual.almuerzo)}
                        className="px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 text-xs font-semibold rounded-xl transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setModalCrear(diaActual.fecha);
                        setNuevoAlmuerzo(30);
                        setNuevoCena(30);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-xl border-2 border-dashed border-green-200 transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Agregar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cena Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Cena</h3>
                      <p className="text-xs text-gray-500">Turno de noche</p>
                    </div>
                  </div>
                  {diaActual.cena && (
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wide ${
                      diaActual.cena.estado === "abierto"
                        ? "bg-green-100 text-green-700"
                        : diaActual.cena.estado === "cerrado"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {diaActual.cena.estado}
                    </span>
                  )}
                </div>

                {diaActual.cena ? (
                  <>
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span className="text-3xl font-extrabold text-gray-900">{diaActual.cena.ocupados}</span>
                      <span className="text-sm text-gray-400 font-medium">/ {diaActual.cena.capacidad} cupos</span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          getPorcentaje(diaActual.cena.ocupados, diaActual.cena.capacidad) >= 90
                            ? "bg-red-500"
                            : getPorcentaje(diaActual.cena.ocupados, diaActual.cena.capacidad) >= 70
                            ? "bg-amber-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${getPorcentaje(diaActual.cena.ocupados, diaActual.cena.capacidad)}%`,
                        }}
                      />
                    </div>

                    <p className="text-xs text-gray-400 mb-4">
                      {getPorcentaje(diaActual.cena.ocupados, diaActual.cena.capacidad)}% ocupado
                      {diaActual.cena.capacidad - diaActual.cena.ocupados > 0 && (
                        <span className="text-gray-300"> · {diaActual.cena.capacidad - diaActual.cena.ocupados} disponibles</span>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 mb-4">Sin cupo configurado</p>
                )}

                <div className="flex gap-2">
                  {diaActual.cena ? (
                    <>
                      <button
                        onClick={() => {
                          setModalEditar(diaActual.cena);
                          setNuevaCapacidad(diaActual.cena!.capacidad);
                          setNuevoEstado(diaActual.cena!.estado);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => setModalEliminar(diaActual.cena)}
                        className="px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 text-xs font-semibold rounded-xl transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setModalCrear(diaActual.fecha);
                        setNuevoAlmuerzo(30);
                        setNuevoCena(30);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl border-2 border-dashed border-amber-200 transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Agregar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Editar */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-0 overflow-hidden">
            <div className={`px-6 py-4 ${
              modalEditar.tipo === "almuerzo" ? "bg-green-50 border-b border-green-100" : "bg-amber-50 border-b border-amber-100"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Editar {modalEditar.tipo === "almuerzo" ? "Almuerzo" : "Cena"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{modalEditar.fecha}</p>
                </div>
                <button
                  onClick={() => setModalEditar(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Capacidad máxima</label>
                <input
                  type="number"
                  value={nuevaCapacidad}
                  onChange={(e) => setNuevaCapacidad(parseInt(e.target.value) || 0)}
                  min={modalEditar.ocupados}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
                <p className="text-xs text-gray-400 mt-1.5">Mínimo: {modalEditar.ocupados} (ya ocupados)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estado del turno</label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="abierto">Abierto</option>
                  <option value="cerrado">Cerrado</option>
                  <option value="pausado">Pausado</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setModalEditar(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={editarCupo}
                disabled={cargando}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
              >
                {cargando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Eliminar cupo</h3>
                <p className="text-xs text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              ¿Eliminar el cupo de{" "}
              <span className="font-semibold">{modalEliminar.tipo === "almuerzo" ? "Almuerzo" : "Cena"}</span>{" "}
              del <span className="font-semibold">{modalEliminar.fecha}</span>?
            </p>
            <p className="text-xs text-gray-400 mb-6">
              {modalEliminar.ocupados} ocupados de {modalEliminar.capacidad} capacidad
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setModalEliminar(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarCupo}
                disabled={cargando}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
              >
                {cargando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Crear cupos</h3>
                <p className="text-xs text-gray-500">{modalCrear}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <label className="block text-xs font-semibold text-green-800 mb-2">Almuerzo</label>
                <input
                  type="number"
                  value={nuevoAlmuerzo}
                  onChange={(e) => setNuevoAlmuerzo(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className="block text-xs font-semibold text-amber-800 mb-2">Cena</label>
                <input
                  type="number"
                  value={nuevoCena}
                  onChange={(e) => setNuevoCena(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalCrear(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={crearCuposDia}
                disabled={cargando}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
              >
                {cargando ? "Creando..." : "Crear cupos"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Generar con Calendario */}
      {modalGenerar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Generar cupos múltiples</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Selecciona las fechas para crear cupos</p>
                </div>
                <button
                  onClick={() => { setModalGenerar(false); setFechasSeleccionadas([]); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">

              {/* Quick Select */}
              <div className="flex gap-2 flex-wrap">
                {[7, 14, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => seleccionarRango(d)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 rounded-lg text-xs font-medium transition"
                  >
                    Próx. {d} días
                  </button>
                ))}
                <button
                  onClick={() => setFechasSeleccionadas([])}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-red-100 hover:text-red-700 text-gray-600 rounded-lg text-xs font-medium transition"
                >
                  Limpiar
                </button>
              </div>

              {/* Mini Calendar */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => {
                      const nuevo = new Date(mesCalendario);
                      nuevo.setMonth(nuevo.getMonth() - 1);
                      setMesCalendario(nuevo);
                    }}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h4 className="text-sm font-bold text-gray-800">
                    {mesCalendario.toLocaleDateString("es-PE", { month: "long", year: "numeric" })}
                  </h4>
                  <button
                    onClick={() => {
                      const nuevo = new Date(mesCalendario);
                      nuevo.setMonth(nuevo.getMonth() + 1);
                      setMesCalendario(nuevo);
                    }}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map(dia => (
                    <div key={dia} className="text-center text-[10px] font-semibold text-gray-400 py-1">
                      {dia}
                    </div>
                  ))}
                </div>

                {(() => {
                  const { primerDia, dias } = generarCalendarioModal();
                  const celdas = [];
                  for (let i = 0; i < primerDia; i++) {
                    celdas.push(<div key={`empty-${i}`} />);
                  }
                  dias.forEach(({ fecha, dia, esHoy, yaExiste }) => {
                    const seleccionada = fechasSeleccionadas.includes(fecha);
                    celdas.push(
                      <button
                        key={fecha}
                        onClick={() => toggleFecha(fecha)}
                        disabled={yaExiste}
                        className={`relative aspect-square rounded-lg text-xs font-medium transition ${
                          yaExiste
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : seleccionada
                            ? "bg-blue-600 text-white shadow-md"
                            : esHoy
                            ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            : "text-gray-700 hover:bg-blue-50"
                        }`}
                      >
                        {dia}
                        {yaExiste && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full" />
                        )}
                      </button>
                    );
                  });
                  return <div className="grid grid-cols-7 gap-1">{celdas}</div>;
                })()}

                <div className="flex gap-4 mt-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Existente
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> Seleccionado
                  </span>
                </div>
              </div>

              {/* Capacidades */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <label className="block text-xs font-semibold text-green-800 mb-2">Cap. Almuerzo</label>
                  <input
                    type="number"
                    value={capAlmuerzoGen}
                    onChange={(e) => setCapAlmuerzoGen(parseInt(e.target.value) || 0)}
                    min="1"
                    className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <label className="block text-xs font-semibold text-amber-800 mb-2">Cap. Cena</label>
                  <input
                    type="number"
                    value={capCenaGen}
                    onChange={(e) => setCapCenaGen(parseInt(e.target.value) || 0)}
                    min="1"
                    className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Resumen */}
              {fechasSeleccionadas.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <p className="text-sm text-blue-700 font-medium">
                    {fechasSeleccionadas.length} fecha(s) seleccionada(s)
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => { setModalGenerar(false); setFechasSeleccionadas([]); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={generarMultiplesDias}
                disabled={cargando || fechasSeleccionadas.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cargando ? "Generando..." : `Generar (${fechasSeleccionadas.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
