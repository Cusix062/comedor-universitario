"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

  // CAPTCHA Puzzle
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const piezaCanvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaVerificado, setCaptchaVerificado] = useState(false);
  const [captchaError, setCaptchaError] = useState("");
  const [captchaPieza, setCaptchaPieza] = useState({ x: 0, y: 0, size: 0 });
  const [captchaIntentos, setCaptchaIntentos] = useState(0);
  const captchaDataRef = useRef<{ colores: string[]; formas: any[] }>({ colores: [], formas: [] });

  const generarCaptcha = useCallback(() => {
    const canvas = canvasRef.current;
    const piezaCanvas = piezaCanvasRef.current;
    if (!canvas || !piezaCanvas) return;

    const ctx = canvas.getContext("2d");
    const piezaCtx = piezaCanvas.getContext("2d");
    if (!ctx || !piezaCtx) return;

    const W = 280;
    const H = 160;
    canvas.width = W;
    canvas.height = H;

    // Fondo degradado aleatorio
    const grad = ctx.createLinearGradient(0, 0, W, H);
    const coloresBase = [
      ["#667eea", "#764ba2"], ["#f093fb", "#f5576c"], ["#4facfe", "#00f2fe"],
      ["#43e97b", "#38f9d7"], ["#fa709a", "#fee140"], ["#a18cd1", "#fbc2eb"],
      ["#fccb90", "#d57eeb"], ["#e0c3fc", "#8ec5fc"], ["#f5576c", "#ff6a88"],
    ];
    const par = coloresBase[Math.floor(Math.random() * coloresBase.length)];
    grad.addColorStop(0, par[0]);
    grad.addColorStop(1, par[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Formas aleatorias
    const formas: any[] = [];
    for (let i = 0; i < 12; i++) {
      const tipo = Math.random() > 0.5 ? "circulo" : "rect";
      const x = Math.random() * W;
      const y = Math.random() * H;
      const size = 15 + Math.random() * 40;
      const color = `hsl(${Math.random() * 360}, ${60 + Math.random() * 30}%, ${50 + Math.random() * 25}%)`;
      const alpha = 0.4 + Math.random() * 0.5;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;

      if (tipo === "circulo") {
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const rot = Math.random() * Math.PI;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillRect(-size / 2, -size / 3, size, size * 0.6);
        ctx.restore();
      }

      formas.push({ tipo, x, y, size, color, alpha });
    }

    ctx.globalAlpha = 1;

    // Líneas decorativas
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;
      ctx.lineWidth = 2 + Math.random() * 3;
      ctx.globalAlpha = 0.3 + Math.random() * 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.lineTo(Math.random() * W, Math.random() * H);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Texto distorsionado
    const textos = ["UNDC", "COMEDOR", "SISTEMAS", "2026", "CAÑETE"];
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.font = `bold ${20 + Math.random() * 20}px Arial`;
      ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.2})`;
      ctx.translate(Math.random() * W, Math.random() * H);
      ctx.rotate((Math.random() - 0.5) * 0.8);
      ctx.fillText(textos[Math.floor(Math.random() * textos.length)], 0, 0);
      ctx.restore();
    }

    captchaDataRef.current = { colores: par, formas };

    // Elegir pieza a extraer
    const piezaSize = 40 + Math.floor(Math.random() * 15);
    const margen = 10;
    const px = margen + Math.floor(Math.random() * (W - piezaSize - margen * 2));
    const py = margen + Math.floor(Math.random() * (H - piezaSize - margen * 2));

    setCaptchaPieza({ x: px, y: py, size: piezaSize });

    // Dibujar pieza en canvas pequeño
    piezaCanvas.width = piezaSize + 10;
    piezaCanvas.height = piezaSize + 10;
    piezaCtx.drawImage(canvas, px, py, piezaSize, piezaSize, 5, 5, piezaSize, piezaSize);

    // Dibujar borde de pieza
    piezaCtx.strokeStyle = "#fff";
    piezaCtx.lineWidth = 3;
    piezaCtx.strokeRect(5, 5, piezaSize, piezaSize);
    piezaCtx.shadowColor = "rgba(0,0,0,0.5)";
    piezaCtx.shadowBlur = 6;
    piezaCtx.strokeRect(5, 5, piezaSize, piezaSize);
    piezaCtx.shadowBlur = 0;

    // Vaciar zona en canvas principal
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillRect(px, py, piezaSize, piezaSize);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(px, py, piezaSize, piezaSize);
    ctx.setLineDash([]);

    // Icono de puzzle en el hueco
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.font = `${piezaSize * 0.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", px + piezaSize / 2, py + piezaSize / 2);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";

    setCaptchaVerificado(false);
    setCaptchaError("");
    setCaptchaIntentos(0);
  }, []);

  const manejarClickCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (captchaVerificado) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const { x, y, size } = captchaPieza;
    const tolerancia = 15;

    if (
      clickX >= x - tolerancia &&
      clickX <= x + size + tolerancia &&
      clickY >= y - tolerancia &&
      clickY <= y + size + tolerancia
    ) {
      setCaptchaVerificado(true);
      setCaptchaError("");

      // Dibujar la pieza en su lugar
      const ctx = canvas.getContext("2d");
      if (ctx && piezaCanvasRef.current) {
        ctx.drawImage(piezaCanvasRef.current, 5, 5, size, size, x, y, size, size);
      }
    } else {
      const nuevosIntentos = captchaIntentos + 1;
      setCaptchaIntentos(nuevosIntentos);
      if (nuevosIntentos >= 3) {
        setCaptchaError("Demasiados intentos. Se genera un nuevo captcha.");
        setTimeout(() => generarCaptcha(), 1500);
      } else {
        setCaptchaError(`Posición incorrecta. Intento ${nuevosIntentos}/3`);
      }
    }
  };

  useEffect(() => {
    generarCaptcha();
  }, [generarCaptcha]);

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
            <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-sm">🧩</span>
              Verificación Anti-Bot
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Haz clic en el espacio vacío <span className="font-bold text-purple-600">?</span> donde falta la pieza del puzzle
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-start gap-6">
                {/* Canvas principal */}
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    onClick={manejarClickCanvas}
                    className="rounded-xl border-2 border-gray-200 cursor-crosshair hover:border-purple-400 transition-colors"
                    style={{ maxWidth: "280px", maxHeight: "160px" }}
                  />
                  <p className="text-xs text-center text-gray-400 mt-1">Imagen con pieza faltante</p>
                </div>

                {/* Pieza a ubicar */}
                <div className="flex flex-col items-center">
                  <div className="bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-dashed border-purple-300 rounded-xl p-2">
                    <canvas
                      ref={piezaCanvasRef}
                      className="rounded-lg"
                      style={{ maxWidth: "80px", maxHeight: "80px" }}
                    />
                  </div>
                  <p className="text-xs text-center text-gray-400 mt-1 font-semibold">Pieza</p>
                  <p className="text-xs text-center text-purple-600">👆 Colócala aquí</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={generarCaptcha}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition"
                >
                  🔄 Nuevo puzzle
                </button>
                {captchaIntentos > 0 && (
                  <span className="text-xs text-gray-400">
                    Intentos: {captchaIntentos}/3
                  </span>
                )}
              </div>
            </div>

            {captchaError && (
              <p className="text-red-500 text-sm mt-3 font-medium text-center">❌ {captchaError}</p>
            )}

            <p className="text-xs text-gray-400 mt-3 text-center">
              ⚠️ Debe resolver el captcha antes de registrarse
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-green-700">Puzzle resuelto correctamente</p>
              <p className="text-sm text-green-600">Ahora puedes solicitar tu cupo</p>
            </div>
            <button
              onClick={generarCaptcha}
              className="ml-auto text-green-600 hover:text-green-800 text-xs font-semibold underline"
            >
              Otro puzzle
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
