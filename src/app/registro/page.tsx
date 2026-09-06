"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Estudiante {
  id: number;
  codigo: string;
  nombre: string;
  correo: string;
  ciclo: number;
  telefono: string;
}

interface CupoInfo {
  capacidad: number;
  ocupados: number;
  estado: string;
}

export default function RegistroPage() {
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [telefono, setTelefono] = useState("");
  const [ciclo, setCiclo] = useState(1);
  const [cupos, setCupos] = useState<{ almuerzo: CupoInfo; cena: CupoInfo } | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [horaActual, setHoraActual] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem("session");
    const estudianteData = localStorage.getItem("estudiante");

    if (!session || !estudianteData) {
      router.push("/");
      return;
    }

    const est = JSON.parse(estudianteData);
    setEstudiante(est);
    setTelefono(est.telefono || "");
    setCiclo(est.ciclo || 1);

    // Actualizar hora cada segundo
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    fetchCupos();
    const interval = setInterval(fetchCupos, 30000); // Actualizar cada 30s
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

      // Obtener el ID del cupo
      const cuposRes = await fetch(`/api/cupos?fecha=${fecha}`);
      const cuposDelDia = await cuposRes.json();

      if (tipo === "almuerzo" && cuposDelDia.almuerzo?.id) {
        cupoId = cuposDelDia.almuerzo.id;
      } else if (tipo === "cena" && cuposDelDia.cena?.id) {
        cupoId = cuposDelDia.cena?.id;
      }

      if (!cupoId) {
        // Si no tenemos el ID, necesitamos obtenerlo de otra forma
        // Por ahora, crear el cupo si no existe
        const crearRes = await fetch("/api/admin/turnos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fecha,
            [`${tipo}_capacidad`]: 50,
          }),
        });

        if (!crearRes.ok) {
          setError("Error al configurar cupos");
          return;
        }

        // Volver a obtener cupos
        const cuposRes2 = await fetch(`/api/cupos?fecha=${fecha}`);
        const cuposData2 = await cuposRes2.json();
        const turnoData = tipo === "almuerzo" ? cuposData2.almuerzo : cuposData2.cena;
        cupoId = turnoData?.id;
      }

      if (!cupoId) {
        setError("No se pudo encontrar el cupo");
        return;
      }

      // Registrar inscripción
      const regRes = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estudiante_id: estudiante.id,
          cupo_id: cupoId,
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

  const puedeRegistrar = (tipo: "almuerzo" | "cena"): boolean => {
    const hora = horaActual.getHours();
    const minutos = horaActual.getMinutes();
    const horaEnMinutos = hora * 60 + minutos;

    if (tipo === "almuerzo") {
      return horaEnMinutos >= 630; // 10:30 AM
    } else {
      return horaEnMinutos >= 930; // 3:30 PM
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("session");
    localStorage.removeItem("estudiante");
    router.push("/");
  };

  if (!estudiante) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-orange-500 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">🍽️ Comedor Universitario</h1>
            <p className="text-red-100 text-sm">Registro de Adicionales</p>
          </div>
          <div className="text-right">
            <p className="font-medium">{estudiante.nombre}</p>
            <p className="text-red-100 text-sm">Código: {estudiante.codigo}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Reloj */}
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-gray-500 text-sm">Hora actual</p>
          <p className="text-3xl font-mono font-bold text-gray-800">
            {horaActual.toLocaleTimeString("es-PE", { hour12: true })}
          </p>
        </div>

        {/* Mensajes */}
        {mensaje && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            ✅ {mensaje}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            ❌ {error}
          </div>
        )}

        {/* Datos del estudiante */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">📋 Tus Datos</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Nombre</label>
              <p className="font-medium">{estudiante.nombre}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Código</label>
              <p className="font-medium">{estudiante.codigo}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Correo</label>
              <p className="font-medium">{estudiante.correo}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Ciclo</label>
              <p className="font-medium">{estudiante.ciclo}°</p>
            </div>
          </div>
        </div>

        {/* Turnos disponibles */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Almuerzo */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-center mb-4">
              <span className="text-4xl">🥗</span>
              <h3 className="text-xl font-bold mt-2">Almuerzo</h3>
              <p className="text-gray-500 text-sm">Apertura: 10:30 AM</p>
            </div>
            {cupos?.almuerzo && cupos.almuerzo.capacidad > 0 ? (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cupos:</span>
                    <span className="font-bold">
                      {cupos.almuerzo.ocupados}/{cupos.almuerzo.capacidad}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${(cupos.almuerzo.ocupados / cupos.almuerzo.capacidad) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => registrarEnTurno("almuerzo")}
                  disabled={!puedeRegistrar("almuerzo") || cupos.almuerzo.estado === "cerrado" || cargando}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    puedeRegistrar("almuerzo") && cupos.almuerzo.estado !== "cerrado"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {!puedeRegistrar("almuerzo")
                    ? "⏰ Abre a las 10:30 AM"
                    : cupos.almuerzo.estado === "cerrado"
                    ? "❌ Cupos Agotados"
                    : cargando
                    ? "⏳ Registrando..."
                    : "🍽️ Solicitar Almuerzo"}
                </button>
              </>
            ) : (
              <p className="text-center text-gray-500">Sin cupos configurados</p>
            )}
          </div>

          {/* Cena */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-center mb-4">
              <span className="text-4xl">🌙</span>
              <h3 className="text-xl font-bold mt-2">Cena</h3>
              <p className="text-gray-500 text-sm">Apertura: 3:30 PM</p>
            </div>
            {cupos?.cena && cupos.cena.capacidad > 0 ? (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cupos:</span>
                    <span className="font-bold">
                      {cupos.cena.ocupados}/{cupos.cena.capacidad}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-orange-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${(cupos.cena.ocupados / cupos.cena.capacidad) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => registrarEnTurno("cena")}
                  disabled={!puedeRegistrar("cena") || cupos.cena.estado === "cerrado" || cargando}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    puedeRegistrar("cena") && cupos.cena.estado !== "cerrado"
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {!puedeRegistrar("cena")
                    ? "⏰ Abre a las 3:30 PM"
                    : cupos.cena.estado === "cerrado"
                    ? "❌ Cupos Agotados"
                    : cargando
                    ? "⏳ Registrando..."
                    : "🌙 Solicitar Cena"}
                </button>
              </>
            ) : (
              <p className="text-center text-gray-500">Sin cupos configurados</p>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            🎫 Ver Mi Ticket
          </button>
          <button
            onClick={cerrarSesion}
            className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </main>
    </div>
  );
}
