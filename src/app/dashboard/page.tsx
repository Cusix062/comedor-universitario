"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
    await signOut({ redirect: false });
    router.push("/");
  };

  if (status === "loading" || !estudiante)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 font-medium">Cargando...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">{estudiante.nombre}</h1>
              <p className="text-xs text-slate-400 font-mono">{estudiante.codigo}</p>
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            className="text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {seleccionada && qrUrl ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-5 text-white text-center">
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Ticket de Adicional</p>
              <p className="text-2xl font-bold">{seleccionada.fecha}</p>
            </div>

            <div className="p-6 text-center space-y-5">
              <div className="inline-block p-3 bg-white rounded-2xl shadow-md border border-slate-100">
                <img src={qrUrl} alt="QR Code" className="rounded-xl" />
              </div>

              <div className="flex items-center justify-center gap-3">
                <span className="text-sm font-semibold text-slate-500">Turno</span>
                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                    seleccionada.turno === "almuerzo"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {seleccionada.turno === "almuerzo" ? "Almuerzo" : "Cena"}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">N° de Cupo</p>
                <p className="text-5xl font-extrabold text-slate-800 tabular-nums">{seleccionada.numero_orden}</p>
              </div>

              <div>
                <span
                  className={`inline-block px-5 py-2 rounded-full text-sm font-bold ${
                    seleccionada.estado === "reservado"
                      ? "bg-amber-100 text-amber-700"
                      : seleccionada.estado === "atendido"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {seleccionada.estado === "reservado"
                    ? "Pendiente"
                    : seleccionada.estado === "atendido"
                      ? "Atendido"
                      : "Cancelado"}
                </span>
              </div>

              <p className="text-xs text-slate-400 pt-2">
                Presenta este código QR en la entrada del comedor
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Sin inscripciones hoy</h3>
            <p className="text-slate-400 mt-1 text-sm">Regístrate para obtener tu ración adicional</p>
            <button
              onClick={() => router.push("/registro")}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30"
            >
              Ir a Registrar
            </button>
          </div>
        )}

        {inscripciones.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Tus inscripciones de hoy</h3>
            <div className="space-y-2">
              {inscripciones.map((insc) => (
                <button
                  key={insc.id}
                  onClick={() => setSeleccionada(insc)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    seleccionada?.id === insc.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600 text-sm">
                        {insc.numero_orden}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          insc.turno === "almuerzo" ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {insc.turno === "almuerzo" ? "Almuerzo" : "Cena"}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        insc.estado === "reservado"
                          ? "bg-amber-100 text-amber-700"
                          : insc.estado === "atendido"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {insc.estado}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => router.push("/registro")}
            className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Registrar
          </button>
          <button
            onClick={() => router.push("/historial")}
            className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Historial
          </button>
          <button
            onClick={cerrarSesion}
            className="bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-700 hover:text-red-600 py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Salir
          </button>
        </div>
      </main>
    </div>
  );
}
