"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import QRCode from "qrcode";

interface Inscripcion {
  id: number;
  numero_orden: number;
  estado: string;
  fecha_hora: string;
  turno: string;
  fecha: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [estudiante, setEstudiante] = useState<any>(null);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [seleccionada, setSeleccionada] = useState<Inscripcion | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    // Sesión de Google
    if (session?.user) {
      const est = {
        codigo: session.user.email?.split("@")[0] || "",
        nombre: session.user.name || "",
        correo: session.user.email || "",
      };
      setEstudiante(est);
      fetchInscritos(est.codigo);
      return;
    }

    // Sesión manual (localStorage)
    const sessionLocal = localStorage.getItem("session");
    const estudianteData = localStorage.getItem("estudiante");

    if (sessionLocal && estudianteData) {
      const est = JSON.parse(estudianteData);
      setEstudiante(est);
      fetchInscritos(est.codigo);
      return;
    }

    // Sin sesión
    router.push("/");
  }, [router, session, status]);

  useEffect(() => {
    if (seleccionada) {
      const qrData = JSON.stringify({
        id: seleccionada.id,
        codigo: estudiante?.codigo,
        nombre: estudiante?.nombre,
        turno: seleccionada.turno,
        fecha: seleccionada.fecha,
        numero: seleccionada.numero_orden,
      });

      QRCode.toDataURL(qrData, {
        width: 280,
        margin: 2,
        color: { dark: "#1e293b", light: "#ffffff" },
      }).then(setQrUrl);
    }
  }, [seleccionada, estudiante]);

  const fetchInscritos = async (codigo: string) => {
    try {
      const fecha = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/admin/validar?fecha=${fecha}`);
      const data = await res.json();
      const misInscripciones = data.filter((i: any) => i.codigo === codigo);
      setInscripciones(misInscripciones);
      if (misInscripciones.length > 0) {
        setSeleccionada(misInscripciones[misInscripciones.length - 1]);
      }
    } catch {
      console.error("Error al obtener inscripciones");
    }
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg">
              🎫
            </div>
            <div>
              <h1 className="text-lg font-bold">Mi Ticket</h1>
              <p className="text-blue-200 text-xs">Comedor Universitario</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/registro")}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition text-sm font-medium"
          >
            ← Volver
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg, #dbeafe, #bfdbfe)" }}>
            🎓
          </div>
          <div>
            <h2 className="font-bold text-gray-800">{estudiante.nombre}</h2>
            <p className="text-sm text-gray-500">Código: {estudiante.codigo}</p>
          </div>
        </div>

        {seleccionada && qrUrl ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="text-white text-center py-6 px-4" style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}>
              <h3 className="text-xl font-bold">Ticket de Adicional</h3>
              <p className="text-blue-200 text-sm mt-1">{seleccionada.fecha}</p>
            </div>
            <div className="p-8 text-center">
              <div className="inline-block p-4 bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
                <img src={qrUrl} alt="QR Code" className="rounded-lg" />
              </div>

              <div className="space-y-3">
                <div className="inline-block px-6 py-2 rounded-full text-3xl font-bold text-gray-800 bg-gray-100">
                  N° {seleccionada.numero_orden}
                </div>
                <p className={`text-lg font-bold ${
                  seleccionada.turno === "almuerzo" ? "text-green-600" : "text-amber-600"
                }`}>
                  {seleccionada.turno === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"}
                </p>
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  seleccionada.estado === "reservado"
                    ? "bg-amber-100 text-amber-700"
                    : seleccionada.estado === "atendido"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {seleccionada.estado === "reservado"
                    ? "⏳ Pendiente"
                    : seleccionada.estado === "atendido"
                    ? "✅ Atendido"
                    : "❌ Cancelado"}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-6">
                Presenta este código QR en la entrada del comedor
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
              📭
            </div>
            <h3 className="text-xl font-bold text-gray-800">Sin inscripciones hoy</h3>
            <p className="text-gray-500 mt-2 text-sm">Regístrate para obtener tu ración adicional</p>
            <button
              onClick={() => router.push("/registro")}
              className="mt-6 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
            >
              Ir a Registrar
            </button>
          </div>
        )}

        {inscripciones.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm">📋</span>
              Mis inscripciones de hoy
            </h3>
            <div className="space-y-2">
              {inscripciones.map((insc) => (
                <button
                  key={insc.id}
                  onClick={() => setSeleccionada(insc)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    seleccionada?.id === insc.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-700">
                        {insc.numero_orden}
                      </span>
                      <div>
                        <span className={`text-sm font-semibold ${
                          insc.turno === "almuerzo" ? "text-green-600" : "text-amber-600"
                        }`}>
                          {insc.turno === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      insc.estado === "reservado"
                        ? "bg-amber-100 text-amber-700"
                        : insc.estado === "atendido"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {insc.estado}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={cerrarSesion}
          className="w-full bg-white border-2 border-gray-200 text-gray-600 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-gray-50 hover:border-gray-300"
        >
          🚪 Cerrar Sesión
        </button>
      </main>
    </div>
  );
}
