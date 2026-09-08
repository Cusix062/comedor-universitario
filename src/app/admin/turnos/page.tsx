"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session");
    if (!adminSession) {
      router.push("/");
      return;
    }
    fetchCupos();
  }, [router]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white shadow-lg" style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg">
              📅
            </div>
            <div>
              <h1 className="text-lg font-bold">Configurar Cupos</h1>
              <p className="text-blue-200 text-xs">Panel de Administración</p>
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

      <main className="max-w-6xl mx-auto p-4 space-y-5">
        {mensaje && (
          <div className={`px-5 py-4 rounded-xl flex items-center gap-3 ${
            mensaje.startsWith("✅")
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            <span className="font-medium">{mensaje}</span>
          </div>
        )}

        {/* Navegación de semana */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSemanaActual(Math.max(0, semanaActual - 1))}
              disabled={semanaActual === 0}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
            >
              ← Anterior
            </button>
            <h2 className="text-base font-bold text-gray-800">
              {semanaLabels[semanaActual] || `En ${semanaActual} semanas`}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSemanaActual(semanaActual + 1)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium transition"
              >
                Siguiente →
              </button>
              <button
                onClick={() => setModalGenerar(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition"
              >
                📅 Generar Múltiples Días
              </button>
            </div>
          </div>
        </div>

        {/* Calendario */}
        <div className="grid grid-cols-7 gap-3">
          {dias.map((dia) => (
            <div
              key={dia.fecha}
              className={`bg-white rounded-2xl shadow-sm border-2 p-4 min-h-[280px] flex flex-col ${
                dia.esHoy ? "border-blue-500" : "border-gray-100"
              }`}
            >
              {/* Encabezado del día */}
              <div className="text-center mb-3">
                <p className={`text-xs font-semibold ${dia.esHoy ? "text-blue-600" : "text-gray-400"}`}>
                  {dia.diaSemana}
                </p>
                <p className={`text-2xl font-bold ${dia.esHoy ? "text-blue-600" : "text-gray-800"}`}>
                  {dia.diaNumero}
                </p>
              </div>

              {/* Almuerzo */}
              {dia.almuerzo ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-green-700">🥗 Almuerzo</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setModalEditar(dia.almuerzo);
                          setNuevaCapacidad(dia.almuerzo!.capacidad);
                          setNuevoEstado(dia.almuerzo!.estado);
                        }}
                        className="text-xs bg-green-200 hover:bg-green-300 px-1.5 py-0.5 rounded"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setModalEliminar(dia.almuerzo)}
                        className="text-xs bg-red-200 hover:bg-red-300 px-1.5 py-0.5 rounded"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-green-800">
                    {dia.almuerzo.ocupados}/{dia.almuerzo.capacidad}
                  </p>
                  <div className="w-full bg-green-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(100, (dia.almuerzo.ocupados / dia.almuerzo.capacidad) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold mt-1 inline-block ${
                    dia.almuerzo.estado === "abierto" ? "text-green-600" : "text-red-600"
                  }`}>
                    {dia.almuerzo.estado}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setModalCrear(dia.fecha);
                    setNuevoAlmuerzo(30);
                    setNuevoCena(30);
                  }}
                  className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-3 mb-2 text-center hover:bg-blue-50 hover:border-blue-300 transition flex-1 flex items-center justify-center"
                >
                  <span className="text-gray-400 text-sm">+ Agregar</span>
                </button>
              )}

              {/* Cena */}
              {dia.cena ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-amber-700">🌙 Cena</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setModalEditar(dia.cena);
                          setNuevaCapacidad(dia.cena!.capacidad);
                          setNuevoEstado(dia.cena!.estado);
                        }}
                        className="text-xs bg-amber-200 hover:bg-amber-300 px-1.5 py-0.5 rounded"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setModalEliminar(dia.cena)}
                        className="text-xs bg-red-200 hover:bg-red-300 px-1.5 py-0.5 rounded"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-amber-800">
                    {dia.cena.ocupados}/{dia.cena.capacidad}
                  </p>
                  <div className="w-full bg-amber-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(100, (dia.cena.ocupados / dia.cena.capacidad) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold mt-1 inline-block ${
                    dia.cena.estado === "abierto" ? "text-amber-600" : "text-red-600"
                  }`}>
                    {dia.cena.estado}
                  </span>
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-3 text-center">
                  <span className="text-gray-400 text-xs">Sin cena</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Modal Editar */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Editar {modalEditar.tipo === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Fecha: {modalEditar.fecha}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Capacidad</label>
                <input
                  type="number"
                  value={nuevaCapacidad}
                  onChange={(e) => setNuevaCapacidad(parseInt(e.target.value) || 0)}
                  min={modalEditar.ocupados}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Mínimo: {modalEditar.ocupados} (ocupados)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="abierto">Abierto</option>
                  <option value="cerrado">Cerrado</option>
                  <option value="pausado">Pausado</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalEditar(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={editarCupo}
                disabled={cargando}
                className="flex-1 text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
              >
                {cargando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">⚠️ Eliminar Cupo</h3>
            <p className="text-sm text-gray-600 mb-4">
              ¿Estás seguro de eliminar el cupo de{" "}
              <strong>{modalEliminar.tipo === "almuerzo" ? "Almuerzo" : "Cena"}</strong>{" "}
              del <strong>{modalEliminar.fecha}</strong>?
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Ocupados: {modalEliminar.ocupados} | Capacidad: {modalEliminar.capacidad}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setModalEliminar(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarCupo}
                disabled={cargando}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50"
              >
                {cargando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📅 Crear Cupos</h3>
            <p className="text-sm text-gray-600 mb-4">Fecha: <strong>{modalCrear}</strong></p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <label className="block text-sm font-semibold text-green-800 mb-2">🥗 Almuerzo</label>
                <input
                  type="number"
                  value={nuevoAlmuerzo}
                  onChange={(e) => setNuevoAlmuerzo(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full border-2 border-green-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className="block text-sm font-semibold text-amber-800 mb-2">🌙 Cena</label>
                <input
                  type="number"
                  value={nuevoCena}
                  onChange={(e) => setNuevoCena(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full border-2 border-amber-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalCrear(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={crearCuposDia}
                disabled={cargando}
                className="flex-1 text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
              >
                {cargando ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Generar con Calendario */}
      {modalGenerar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📅 Seleccionar Fechas</h3>

            {/* Atajos de selección */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => seleccionarRango(7)}
                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition"
              >
                Próx. 7 días
              </button>
              <button
                onClick={() => seleccionarRango(14)}
                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition"
              >
                Próx. 14 días
              </button>
              <button
                onClick={() => seleccionarRango(30)}
                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition"
              >
                Próx. 30 días
              </button>
              <button
                onClick={() => setFechasSeleccionadas([])}
                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition"
              >
                Limpiar
              </button>
            </div>

            {/* Calendario */}
            <div className="border border-gray-200 rounded-xl p-4 mb-4">
              {/* Navegación del mes */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const nuevo = new Date(mesCalendario);
                    nuevo.setMonth(nuevo.getMonth() - 1);
                    setMesCalendario(nuevo);
                  }}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition"
                >
                  ←
                </button>
                <h4 className="font-bold text-gray-800">
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
                  →
                </button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(dia => (
                  <div key={dia} className="text-center text-xs font-semibold text-gray-400 py-1">
                    {dia}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
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
                      className={`aspect-square rounded-lg text-sm font-medium transition relative ${
                        yaExiste
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : seleccionada
                          ? "bg-blue-500 text-white shadow-lg"
                          : esHoy
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-50 text-gray-700 hover:bg-blue-100"
                      }`}
                    >
                      {dia}
                      {yaExiste && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                      )}
                      {seleccionada && !yaExiste && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full" />
                      )}
                    </button>
                  );
                });
                return <div className="grid grid-cols-7 gap-1">{celdas}</div>;
              })()}

              {/* Leyenda */}
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full" /> Ya existe
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" /> Seleccionado
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-300 rounded-full" /> Hoy
                </span>
              </div>
            </div>

            {/* Capacidades */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <label className="block text-sm font-semibold text-green-800 mb-2">🥗 Almuerzo</label>
                <input
                  type="number"
                  value={capAlmuerzoGen}
                  onChange={(e) => setCapAlmuerzoGen(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full border-2 border-green-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className="block text-sm font-semibold text-amber-800 mb-2">🌙 Cena</label>
                <input
                  type="number"
                  value={capCenaGen}
                  onChange={(e) => setCapCenaGen(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full border-2 border-amber-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Resumen */}
            {fechasSeleccionadas.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-blue-700">
                  Se generarán cupos en <strong>{fechasSeleccionadas.length} fecha(s)</strong> seleccionada(s)
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalGenerar(false);
                  setFechasSeleccionadas([]);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={generarMultiplesDias}
                disabled={cargando || fechasSeleccionadas.length === 0}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargando ? "Generando..." : `Generar (${fechasSeleccionadas.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
