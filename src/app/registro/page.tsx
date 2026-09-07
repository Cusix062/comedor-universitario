"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Estudiante {
  id: number;
  codigo: string;
  nombre: string;
  correo: string;
  ciclo: number;
  telefono: string;
}

interface CupoInfo {
  id?: number;
  capacidad: number;
  ocupados: number;
  estado: string;
}

export default function RegistroPage() {
  const { data: session, status } = useSession();
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [cupos, setCupos] = useState<{ almuerzo: CupoInfo; cena: CupoInfo } | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [horaActual, setHoraActual] = useState(new Date());
  const router = useRouter();

  // CAPTCHA
  const [captchaA, setCaptchaA] = useState(0);
  const [captchaB, setCaptchaB] = useState(0);
  const [captchaOp, setCaptchaOp] = useState<"+" | "-" | "×">("+");
  const [captchaRespuesta, setCaptchaRespuesta] = useState("");
  const [captchaVerificado, setCaptchaVerificado] = useState(false);
  const [captchaError, setCaptchaError] = useState("");

  const generarCaptcha = () => {
    const ops: ("+" | "-" | "×")[] = ["+", "-", "×"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 15) + 1;
    let b = Math.floor(Math.random() * 15) + 1;
    if (op === "-" && a < b) [a, b] = [b, a];
    setCaptchaA(a);
    setCaptchaB(b);
    setCaptchaOp(op);
    setCaptchaRespuesta("");
    setCaptchaVerificado(false);
    setCaptchaError("");
  };

  const verificarCaptcha = () => {
    let resultado = 0;
    if (captchaOp === "+") resultado = captchaA + captchaB;
    else if (captchaOp === "-") resultado = captchaA - captchaB;
    else resultado = captchaA * captchaB;

    if (parseInt(captchaRespuesta) === resultado) {
      setCaptchaVerificado(true);
      setCaptchaError("");
    } else {
      setCaptchaError("Respuesta incorrecta. Intente de nuevo.");
      generarCaptcha();
    }
  };

  useEffect(() => {
    generarCaptcha();
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    const getHoraActual = (): Date => {
      const simActivo = localStorage.getItem("simulacion_activo") === "true";
      if (simActivo) {
        const h = parseInt(localStorage.getItem("simulacion_hora") || "0");
        const m = parseInt(localStorage.getItem("simulacion_minuto") || "0");
        const fake = new Date();
        fake.setHours(h, m, 0, 0);
        return fake;
      }
      return new Date();
    };

    setHoraActual(getHoraActual());

    if (session?.user) {
      setEstudiante({
        id: 0,
        codigo: session.user.email?.split("@")[0] || "",
        nombre: session.user.name || "",
        correo: session.user.email || "",
        ciclo: 1,
        telefono: "",
      });
      const timer = setInterval(() => setHoraActual(getHoraActual()), 1000);
      return () => clearInterval(timer);
    }

    const sessionLocal = localStorage.getItem("session");
    const estudianteData = localStorage.getItem("estudiante");

    if (sessionLocal && estudianteData) {
      const est = JSON.parse(estudianteData);
      setEstudiante(est);
      const timer = setInterval(() => setHoraActual(getHoraActual()), 1000);
      return () => clearInterval(timer);
    }

    router.push("/");
  }, [router, session, status]);

  useEffect(() => {
    fetchCupos();
    const interval = setInterval(fetchCupos, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchCupos = async () => {
    try {
      const res = await fetch("/api/cupos");
      const data = await res.json();
      setCupos(data);
    } catch {
      console.error("Error al obtener cupos");
    }
  };

  const registrarEnTurno = async (tipo: "almuerzo" | "cena") => {
    if (!estudiante) return;

    // Verificar CAPTCHA
    if (!captchaVerificado) {
      setError("Debe completar el captcha antes de registrarse");
      return;
    }

    setError("");
    setMensaje("");
    setCargando(true);

    try {
      const fecha = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/cupos");
      const cuposData = await res.json();

      let cupoId: number | null = null;
      const turno = tipo === "almuerzo" ? cuposData.almuerzo : cuposData.cena;

      if (!turno || turno.estado === "sin_configurar") {
        setError(`No hay cupos configurados para ${tipo}`);
        return;
      }

      const cuposRes = await fetch(`/api/cupos?fecha=${fecha}`);
      const cuposDelDia = await cuposRes.json();

      if (tipo === "almuerzo" && cuposDelDia.almuerzo?.id) {
        cupoId = cuposDelDia.almuerzo.id;
      } else if (tipo === "cena" && cuposDelDia.cena?.id) {
        cupoId = cuposDelDia.cena?.id;
      }

      if (!cupoId) {
        const crearRes = await fetch("/api/admin/turnos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fecha, [`${tipo}_capacidad`]: 50 }),
        });
        if (!crearRes.ok) {
          setError("Error al configurar cupos");
          return;
        }
        const cuposRes2 = await fetch(`/api/cupos?fecha=${fecha}`);
        const cuposData2 = await cuposRes2.json();
        const turnoData = tipo === "almuerzo" ? cuposData2.almuerzo : cuposData2.cena;
        cupoId = turnoData?.id;
      }

      if (!cupoId) {
        setError("No se pudo encontrar el cupo");
        return;
      }

      const regRes = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estudiante_id: estudiante.id || 0,
          cupo_id: cupoId,
          codigo: estudiante.codigo,
          nombre: estudiante.nombre,
          correo: estudiante.correo,
        }),
      });

      const regData = await regRes.json();

      if (!regRes.ok) {
        setError(regData.error || "Error al registrar");
        return;
      }

      setMensaje(regData.mensaje);
      fetchCupos();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const getMinutosRestantes = (horaApertura: number): number => {
    const hora = horaActual.getHours();
    const minutos = horaActual.getMinutes();
    const horaEnMinutos = hora * 60 + minutos;
    return Math.max(0, horaApertura - horaEnMinutos);
  };

  const estaEnHorario = (tipo: "almuerzo" | "cena"): boolean => {
    const hora = horaActual.getHours();
    const minutos = horaActual.getMinutes();
    const h = hora * 60 + minutos;

    if (tipo === "almuerzo") {
      // Almuerzo: 10:30 AM (630) a 12:00 PM (720)
      return h >= 630 && h <= 720;
    } else {
      // Cena: 3:30 PM (930) a 5:00 PM (1020)
      return h >= 930 && h <= 1020;
    }
  };

  const puedeRegistrar = (tipo: "almuerzo" | "cena"): boolean => {
    return estaEnHorario(tipo);
  };

  const estaLleno = (tipo: "almuerzo" | "cena"): boolean => {
    if (!cupos) return false;
    const turno = tipo === "almuerzo" ? cupos.almuerzo : cupos.cena;
    return turno?.estado === "cerrado" || (turno?.ocupados >= turno?.capacidad && turno?.capacidad > 0);
  };

  const cerrarSesion = async () => {
    localStorage.removeItem("session");
    localStorage.removeItem("estudiante");
    if (session) {
      const { signOut } = await import("next-auth/react");
      await signOut({ callbackUrl: "/" });
    } else {
      router.push("/");
    }
  };

  const porcentajeAlmuerzo = cupos?.almuerzo && cupos.almuerzo.capacidad > 0
    ? (cupos.almuerzo.ocupados / cupos.almuerzo.capacidad) * 100 : 0;
  const porcentajeCena = cupos?.cena && cupos.cena.capacidad > 0
    ? (cupos.cena.ocupados / cupos.cena.capacidad) * 100 : 0;

  if (status === "loading" || !estudiante) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-500 font-medium">Cargando...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="text-white shadow-lg" style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg">🍽️</div>
            <div>
              <h1 className="text-lg font-bold">Comedor Universitario</h1>
              <p className="text-blue-200 text-xs">Registro de Adicionales</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-sm">{estudiante.nombre}</p>
            <p className="text-blue-200 text-xs">Código: {estudiante.codigo}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-5">
        {/* Indicador de simulación */}
        {typeof window !== "undefined" && localStorage.getItem("simulacion_activo") === "true" && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-yellow-800">Modo Simulación Activo</p>
              <p className="text-sm text-yellow-600">
                Hora simulada: {localStorage.getItem("simulacion_hora")}:{localStorage.getItem("simulacion_minuto")}
              </p>
            </div>
          </div>
        )}

        {/* Reloj */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Hora actual</p>
            <p className="text-3xl font-bold text-gray-800 font-mono tracking-wider mt-1">
              {horaActual.toLocaleTimeString("es-PE", { hour12: true })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Fecha</p>
            <p className="text-sm font-semibold text-gray-600 mt-1">
              {horaActual.toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* Mensajes */}
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

        {/* Datos del estudiante */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm">📋</span>
            Tus Datos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium">Nombre</p>
              <p className="font-semibold text-gray-800 text-sm mt-1">{estudiante.nombre}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium">Código</p>
              <p className="font-semibold text-gray-800 text-sm mt-1">{estudiante.codigo}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium">Correo</p>
              <p className="font-semibold text-gray-800 text-sm mt-1 truncate">{estudiante.correo}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium">Ciclo</p>
              <p className="font-semibold text-gray-800 text-sm mt-1">{estudiante.ciclo}°</p>
            </div>
          </div>
        </div>

        {/* CAPTCHA */}
        {!captchaVerificado ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-sm">🤖</span>
              Verificación Anti-Bot
            </h2>
            <p className="text-sm text-gray-500 mb-4">Resuelve la operación matemática para continuar:</p>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl px-6 py-4 text-center">
                  <p className="text-2xl font-bold text-gray-800 font-mono">
                    {captchaA} <span className="text-purple-600">{captchaOp}</span> {captchaB} <span className="text-gray-400">=</span> <span className="text-gray-300">?</span>
                  </p>
                </div>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={captchaRespuesta}
                  onChange={(e) => setCaptchaRespuesta(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && verificarCaptcha()}
                  placeholder="Tu respuesta"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-bold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              </div>
              <button
                onClick={verificarCaptcha}
                disabled={!captchaRespuesta}
                className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all shadow-lg disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
              >
                Verificar
              </button>
            </div>

            {captchaError && (
              <p className="text-red-500 text-sm mt-3 font-medium">❌ {captchaError}</p>
            )}

            <p className="text-xs text-gray-400 mt-3">⚠️ Debe resolver el captcha antes de registrarse</p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-green-700">Verificación completada</p>
              <p className="text-sm text-green-600">Ahora puedes solicitar tu cupo</p>
            </div>
            <button
              onClick={generarCaptcha}
              className="ml-auto text-green-600 hover:text-green-800 text-xs font-semibold underline"
            >
              Cambiar captcha
            </button>
          </div>
        )}

        {/* Turnos */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* ALMUERZO */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" }}>🥗</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Almuerzo</h3>
                  <p className="text-xs text-gray-400">10:30 AM - 12:00 PM</p>
                </div>
              </div>

              {cupos?.almuerzo && cupos.almuerzo.capacidad > 0 ? (
                <>
                  {/* Barra de progreso */}
                  <div className="mb-4">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm text-gray-500">Cupos</span>
                      <span className="text-lg font-bold text-gray-800">
                        {cupos.almuerzo.ocupados}/{cupos.almuerzo.capacidad}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${porcentajeAlmuerzo}%`,
                          background: porcentajeAlmuerzo >= 80
                            ? "linear-gradient(90deg, #f97316, #dc2626)"
                            : "linear-gradient(90deg, #22c55e, #16a34a)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Botón */}
                  {estaLleno("almuerzo") ? (
                    <div className="w-full py-4 rounded-xl text-center bg-red-50 border-2 border-red-200">
                      <p className="text-red-700 font-bold text-lg">🔒 CUPOS LLENOS</p>
                      <p className="text-red-500 text-sm mt-1">Vuelva mañana</p>
                    </div>
                  ) : horaActual.getHours() * 60 + horaActual.getMinutes() < 630 ? (
                    <div className="w-full py-4 rounded-xl text-center bg-amber-50 border-2 border-amber-200">
                      <p className="text-amber-700 font-bold text-lg">⏰ Horario No Disponible</p>
                      <p className="text-amber-500 text-sm mt-1">
                        Abre en {getMinutosRestantes(630)} minutos (10:30 AM)
                      </p>
                    </div>
                  ) : horaActual.getHours() * 60 + horaActual.getMinutes() > 720 ? (
                    <div className="w-full py-4 rounded-xl text-center bg-gray-100 border-2 border-gray-200">
                      <p className="text-gray-600 font-bold text-lg">⛔ Horario Finalizado</p>
                      <p className="text-gray-500 text-sm mt-1">Horario: 10:30 AM - 12:00 PM</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => registrarEnTurno("almuerzo")}
                      disabled={cargando}
                      className="w-full py-3.5 rounded-xl font-semibold text-base text-white transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                    >
                      {cargando ? "Registrando..." : "🍽️ Solicitar Almuerzo"}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">Sin cupos configurados</p>
                </div>
              )}
            </div>
          </div>

          {/* CENA */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>🌙</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Cena</h3>
                  <p className="text-xs text-gray-400">3:30 PM - 5:00 PM</p>
                </div>
              </div>

              {cupos?.cena && cupos.cena.capacidad > 0 ? (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm text-gray-500">Cupos</span>
                      <span className="text-lg font-bold text-gray-800">
                        {cupos.cena.ocupados}/{cupos.cena.capacidad}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${porcentajeCena}%`,
                          background: porcentajeCena >= 80
                            ? "linear-gradient(90deg, #f97316, #dc2626)"
                            : "linear-gradient(90deg, #f59e0b, #d97706)",
                        }}
                      />
                    </div>
                  </div>

                  {estaLleno("cena") ? (
                    <div className="w-full py-4 rounded-xl text-center bg-red-50 border-2 border-red-200">
                      <p className="text-red-700 font-bold text-lg">🔒 CUPOS LLENOS</p>
                      <p className="text-red-500 text-sm mt-1">Vuelva mañana</p>
                    </div>
                  ) : horaActual.getHours() * 60 + horaActual.getMinutes() < 930 ? (
                    <div className="w-full py-4 rounded-xl text-center bg-amber-50 border-2 border-amber-200">
                      <p className="text-amber-700 font-bold text-lg">⏰ Horario No Disponible</p>
                      <p className="text-amber-500 text-sm mt-1">
                        Abre en {getMinutosRestantes(930)} minutos (3:30 PM)
                      </p>
                    </div>
                  ) : horaActual.getHours() * 60 + horaActual.getMinutes() > 1020 ? (
                    <div className="w-full py-4 rounded-xl text-center bg-gray-100 border-2 border-gray-200">
                      <p className="text-gray-600 font-bold text-lg">⛔ Horario Finalizado</p>
                      <p className="text-gray-500 text-sm mt-1">Horario: 3:30 PM - 5:00 PM</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => registrarEnTurno("cena")}
                      disabled={cargando}
                      className="w-full py-3.5 rounded-xl font-semibold text-base text-white transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                    >
                      {cargando ? "Registrando..." : "🌙 Solicitar Cena"}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">Sin cupos configurados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
          >
            🎫 Ver Mi Ticket
          </button>
          <button
            onClick={cerrarSesion}
            className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-gray-50 hover:border-gray-300"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </main>
    </div>
  );
}
