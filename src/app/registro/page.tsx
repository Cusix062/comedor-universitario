"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cicloARomano } from "@/lib/ciclos";

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

  // CAPTCHA Multi-tipo
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const piezaCanvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaVerificado, setCaptchaVerificado] = useState(false);
  const [captchaError, setCaptchaError] = useState("");
  const [captchaIntentos, setCaptchaIntentos] = useState(0);
  const [captchaTipo, setCaptchaTipo] = useState<"puzzle" | "numeros" | "letras" | "mixto">("puzzle");
  const [captchaTexto, setCaptchaTexto] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaPieza, setCaptchaPieza] = useState({ x: 0, y: 0, size: 0 });

  const generarTextoCaptcha = (tipo: string): string => {
    if (tipo === "numeros") {
      return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("");
    }
    if (tipo === "letras") {
      const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
      return Array.from({ length: 5 }, () => letras[Math.floor(Math.random() * letras.length)]).join("");
    }
    // mixto
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const dibujarTextoCaptcha = (canvas: HTMLCanvasElement, texto: string) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 260;
    const H = 90;
    canvas.width = W;
    canvas.height = H;

    // Fondo
    const grad = ctx.createLinearGradient(0, 0, W, H);
    const colores = [
      ["#1a1a2e", "#16213e"], ["#0f3460", "#1a1a2e"], ["#162447", "#1f4068"],
      ["#1b1b2f", "#162447"], ["#0a1628", "#1b2838"], ["#1a1a2e", "#0f3460"],
    ];
    const par = colores[Math.floor(Math.random() * colores.length)];
    grad.addColorStop(0, par[0]);
    grad.addColorStop(1, par[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Líneas de ruido
    for (let i = 0; i < 20; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.15)`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.lineTo(Math.random() * W, Math.random() * H);
      ctx.stroke();
    }

    // Puntos de ruido
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},${0.2 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dibujar cada caracter con transformaciones
    const chars = texto.split("");
    const charW = W / (chars.length + 1);

    chars.forEach((char, i) => {
      ctx.save();
      const x = charW * (i + 1);
      const y = H / 2 + (Math.random() - 0.5) * 20;

      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.5);

      const escala = 0.8 + Math.random() * 0.6;
      ctx.scale(escala, escala);

      // Sombra
      ctx.shadowColor = `hsl(${Math.random() * 360}, 80%, 50%)`;
      ctx.shadowBlur = 4 + Math.random() * 4;
      ctx.shadowOffsetX = (Math.random() - 0.5) * 3;
      ctx.shadowOffsetY = (Math.random() - 0.5) * 3;

      ctx.font = `bold ${28 + Math.random() * 8}px 'Courier New', monospace`;
      ctx.fillStyle = `hsl(${Math.random() * 360}, ${70 + Math.random() * 25}%, ${55 + Math.random() * 20}%)`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(char, 0, 0);

      ctx.restore();
    });

    // Línea tachada
    ctx.strokeStyle = `rgba(255,255,255,0.3)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, H / 2 + (Math.random() - 0.5) * 30);
    ctx.lineTo(W - 10, H / 2 + (Math.random() - 0.5) * 30);
    ctx.stroke();
  };

  const generarCaptcha = useCallback(() => {
    const tipos: ("puzzle" | "numeros" | "letras" | "mixto")[] = ["puzzle", "numeros", "letras", "mixto"];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    setCaptchaTipo(tipo);

    if (tipo === "puzzle") {
      // Generar puzzle visual
      setTimeout(() => {
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

        const grad = ctx.createLinearGradient(0, 0, W, H);
        const coloresBase = [
          ["#667eea", "#764ba2"], ["#f093fb", "#f5576c"], ["#4facfe", "#00f2fe"],
          ["#43e97b", "#38f9d7"], ["#fa709a", "#fee140"], ["#a18cd1", "#fbc2eb"],
        ];
        const par = coloresBase[Math.floor(Math.random() * coloresBase.length)];
        grad.addColorStop(0, par[0]);
        grad.addColorStop(1, par[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        for (let i = 0; i < 10; i++) {
          const tipo = Math.random() > 0.5 ? "circulo" : "rect";
          const x = Math.random() * W;
          const y = Math.random() * H;
          const size = 15 + Math.random() * 40;
          ctx.globalAlpha = 0.4 + Math.random() * 0.5;
          ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 55%)`;
          if (tipo === "circulo") {
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.random() * Math.PI);
            ctx.fillRect(-size / 2, -size / 3, size, size * 0.6);
            ctx.restore();
          }
        }
        ctx.globalAlpha = 1;

        for (let i = 0; i < 4; i++) {
          ctx.strokeStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;
          ctx.lineWidth = 2 + Math.random() * 3;
          ctx.globalAlpha = 0.3 + Math.random() * 0.3;
          ctx.beginPath();
          ctx.moveTo(Math.random() * W, Math.random() * H);
          ctx.lineTo(Math.random() * W, Math.random() * H);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        const piezaSize = 40 + Math.floor(Math.random() * 15);
        const margen = 10;
        const px = margen + Math.floor(Math.random() * (W - piezaSize - margen * 2));
        const py = margen + Math.floor(Math.random() * (H - piezaSize - margen * 2));

        setCaptchaPieza({ x: px, y: py, size: piezaSize });

        piezaCanvas.width = piezaSize + 10;
        piezaCanvas.height = piezaSize + 10;
        piezaCtx.drawImage(canvas, px, py, piezaSize, piezaSize, 5, 5, piezaSize, piezaSize);
        piezaCtx.strokeStyle = "#fff";
        piezaCtx.lineWidth = 3;
        piezaCtx.strokeRect(5, 5, piezaSize, piezaSize);

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillRect(px, py, piezaSize, piezaSize);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(px, py, piezaSize, piezaSize);
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.font = `${piezaSize * 0.5}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", px + piezaSize / 2, py + piezaSize / 2);
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
      }, 50);
    } else {
      // Generar texto (numeros, letras, mixto)
      const texto = generarTextoCaptcha(tipo);
      setCaptchaTexto(texto);
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) dibujarTextoCaptcha(canvas, texto);
      }, 50);
    }

    setCaptchaVerificado(false);
    setCaptchaError("");
    setCaptchaInput("");
    setCaptchaIntentos(0);
  }, []);

  const verificarTextoCaptcha = () => {
    if (captchaInput.toUpperCase() === captchaTexto) {
      setCaptchaVerificado(true);
      setCaptchaError("");
    } else {
      const nuevos = captchaIntentos + 1;
      setCaptchaIntentos(nuevos);
      if (nuevos >= 3) {
        setCaptchaError("Demasiados intentos. Se genera un nuevo captcha.");
        setTimeout(() => generarCaptcha(), 1200);
      } else {
        setCaptchaError(`Código incorrecto. Intento ${nuevos}/3`);
        setCaptchaInput("");
        // Regenerarcanvas con nuevo texto
        const texto = generarTextoCaptcha(captchaTipo);
        setCaptchaTexto(texto);
        const canvas = canvasRef.current;
        if (canvas) dibujarTextoCaptcha(canvas, texto);
      }
    }
  };

  const manejarClickCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (captchaVerificado || captchaTipo !== "puzzle") return;

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
      clickX >= x - tolerancia && clickX <= x + size + tolerancia &&
      clickY >= y - tolerancia && clickY <= y + size + tolerancia
    ) {
      setCaptchaVerificado(true);
      setCaptchaError("");
      const ctx = canvas.getContext("2d");
      if (ctx && piezaCanvasRef.current) {
        ctx.drawImage(piezaCanvasRef.current, 5, 5, size, size, x, y, size, size);
      }
    } else {
      const nuevos = captchaIntentos + 1;
      setCaptchaIntentos(nuevos);
      if (nuevos >= 3) {
        setCaptchaError("Demasiados intentos. Se genera un nuevo captcha.");
        setTimeout(() => generarCaptcha(), 1200);
      } else {
        setCaptchaError(`Posición incorrecta. Intento ${nuevos}/3`);
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
      const codigo = session.user.email?.split("@")[0] || "";
      const userName = session.user.name || "";
      const userEmail = session.user.email || "";
      // Obtener datos reales del estudiante desde la API
      fetch(`/api/estudiante?codigo=${codigo}`)
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setEstudiante(data);
          } else {
            // Fallback si no existe en la DB
            setEstudiante({
              id: 0,
              codigo: codigo,
              nombre: userName,
              correo: userEmail,
              ciclo: 1,
              telefono: "",
            });
          }
        })
        .catch(() => {
          setEstudiante({
            id: 0,
            codigo: codigo,
            nombre: userName,
            correo: userEmail,
            ciclo: 1,
            telefono: "",
          });
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

  const hayHorarioActivo = estaEnHorario("almuerzo") || estaEnHorario("cena");

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
              <p className="font-semibold text-gray-800 text-sm mt-1">{cicloARomano(estudiante.ciclo)}</p>
            </div>
          </div>
        </div>

        {/* Registro solo disponible en horario */}
        {!hayHorarioActivo ? (
          <div className="bg-gray-100 border-2 border-gray-200 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">⏰</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Fuera de Horario de Registro</h3>
            <p className="text-gray-500 text-sm mb-4">Los horarios de inscripción son:</p>
            <div className="flex justify-center gap-6">
              <div className="bg-white rounded-xl px-5 py-3 border border-gray-200">
                <p className="text-sm font-bold text-gray-800">🥗 Almuerzo</p>
                <p className="text-xs text-gray-500">10:30 AM - 12:00 PM</p>
              </div>
              <div className="bg-white rounded-xl px-5 py-3 border border-gray-200">
                <p className="text-sm font-bold text-gray-800">🌙 Cena</p>
                <p className="text-xs text-gray-500">3:30 PM - 5:00 PM</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Vuelva dentro del horario establecido para registrarse</p>
          </div>
        ) : (
          <>
            {/* CAPTCHA */}
            {!captchaVerificado ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-sm">
                {captchaTipo === "puzzle" ? "🧩" : "🔐"}
              </span>
              Verificación Anti-Bot
            </h2>

            {/* Instrucciones según tipo */}
            {captchaTipo === "puzzle" && (
              <p className="text-sm text-gray-500 mb-4">
                Haz clic en el espacio vacío <span className="font-bold text-purple-600">?</span> donde falta la pieza del puzzle
              </p>
            )}
            {captchaTipo === "numeros" && (
              <p className="text-sm text-gray-500 mb-4">
                Escribe los <span className="font-bold text-blue-600">números</span> que ves en la imagen
              </p>
            )}
            {captchaTipo === "letras" && (
              <p className="text-sm text-gray-500 mb-4">
                Escribe las <span className="font-bold text-green-600">letras</span> que ves en la imagen (sin espacios)
              </p>
            )}
            {captchaTipo === "mixto" && (
              <p className="text-sm text-gray-500 mb-4">
                Escribe el <span className="font-bold text-orange-600">código</span> (letras y números) que ves en la imagen
              </p>
            )}

            <div className="flex flex-col items-center gap-4">
              {/* Tipo PUZZLE */}
              {captchaTipo === "puzzle" && (
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      onClick={manejarClickCanvas}
                      className="rounded-xl border-2 border-gray-200 cursor-crosshair hover:border-purple-400 transition-colors"
                      style={{ maxWidth: "280px", maxHeight: "160px" }}
                    />
                    <p className="text-xs text-center text-gray-400 mt-1">Imagen con pieza faltante</p>
                  </div>
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
              )}

              {/* Tipo TEXTO (numeros, letras, mixto) */}
              {captchaTipo !== "puzzle" && (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      className="rounded-xl border-2 border-gray-200"
                      style={{ maxWidth: "260px", maxHeight: "90px" }}
                    />
                  </div>
                  <div className="flex gap-2 w-full max-w-xs">
                    <input
                      type="text"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && verificarTextoCaptcha()}
                      placeholder={captchaTipo === "numeros" ? "Solo números..." : captchaTipo === "letras" ? "Solo letras..." : "Código..."}
                      maxLength={8}
                      className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-bold font-mono tracking-[0.3em] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none uppercase"
                      autoFocus
                    />
                    <button
                      onClick={verificarTextoCaptcha}
                      disabled={!captchaInput}
                      className="px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all shadow-lg disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={generarCaptcha}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition"
                >
                  🔄 {captchaTipo === "puzzle" ? "Nuevo puzzle" : "Otro código"}
                </button>
                {captchaIntentos > 0 && (
                  <span className="text-xs text-gray-400">Intentos: {captchaIntentos}/3</span>
                )}
                <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-lg font-medium">
                  {captchaTipo === "puzzle" && "🧩 Puzzle"}
                  {captchaTipo === "numeros" && "🔢 Números"}
                  {captchaTipo === "letras" && "🔤 Letras"}
                  {captchaTipo === "mixto" && "🔐 Mixto"}
                </span>
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
              <p className="font-bold text-green-700">Verificación completada</p>
              <p className="text-sm text-green-600">Ahora puedes solicitar tu cupo</p>
            </div>
            <button
              onClick={generarCaptcha}
              className="ml-auto text-green-600 hover:text-green-800 text-xs font-semibold underline"
            >
              Otro captcha
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
          </>
        )}

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
