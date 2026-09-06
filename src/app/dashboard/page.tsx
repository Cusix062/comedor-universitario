"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const [estudiante, setEstudiante] = useState<any>(null);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [seleccionada, setSeleccionada] = useState<Inscripcion | null>(null);
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem("session");
    const estudianteData = localStorage.getItem("estudiante");

    if (!session || !estudianteData) {
      router.push("/");
      return;
    }

    setEstudiante(JSON.parse(estudianteData));
    fetchInscripciones();
  }, [router]);

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
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }).then(setQrUrl);
    }
  }, [seleccionada, estudiante]);

  const fetchInscripciones = async () => {
    try {
      const fecha = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/admin/validar?fecha=${fecha}`);
      const data = await res.json();

      // Filtrar por el estudiante actual
      const est = JSON.parse(localStorage.getItem("estudiante") || "{}");
      const misInscripciones = data.filter((i: any) => i.codigo === est.codigo);
      setInscripciones(misInscripciones);

      if (misInscripciones.length > 0 && !seleccionada) {
        setSeleccionada(misInscripciones[misInscripciones.length - 1]);
      }
    } catch {
      console.error("Error al obtener inscripciones");
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
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">🎫 Mi Ticket</h1>
            <p className="text-blue-100 text-sm">Comedor Universitario</p>
          </div>
          <button
            onClick={() => router.push("/registro")}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
          >
            ← Volver
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Info del estudiante */}
        <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            🎓
          </div>
          <div>
            <h2 className="font-bold text-lg">{estudiante.nombre}</h2>
            <p className="text-gray-500 text-sm">Código: {estudiante.codigo}</p>
          </div>
        </div>

        {/* Ticket QR */}
        {seleccionada && qrUrl ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 text-center text-white">
              <h3 className="text-xl font-bold">🍽️ Ticket de Adicional</h3>
              <p className="text-red-100">{seleccionada.fecha}</p>
            </div>
            <div className="p-6 text-center">
              <img src={qrUrl} alt="QR Code" className="mx-auto mb-4 rounded-lg shadow" />
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-800">
                  N° {seleccionada.numero_orden}
                </p>
                <p className={`text-lg font-semibold ${
                  seleccionada.turno === "almuerzo" ? "text-red-600" : "text-orange-600"
                }`}>
                  {seleccionada.turno === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"}
                </p>
                <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  seleccionada.estado === "reservado"
                    ? "bg-yellow-100 text-yellow-800"
                    : seleccionada.estado === "atendido"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {seleccionada.estado === "reservado"
                    ? "⏳ Pendiente"
                    : seleccionada.estado === "atendido"
                    ? "✅ Atendido"
                    : "❌ Cancelado"}
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Presenta este código QR en la entrada del comedor
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <span className="text-6xl">📭</span>
            <h3 className="text-xl font-bold mt-4 text-gray-800">Sin inscripciones hoy</h3>
            <p className="text-gray-500 mt-2">
              Regístrate para obtener tu ración adicional
            </p>
            <button
              onClick={() => router.push("/registro")}
              className="mt-4 bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition"
            >
              Ir a Registrar
            </button>
          </div>
        )}

        {/* Historial */}
        {inscripciones.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold mb-3">📋 Mis inscripciones de hoy</h3>
            <div className="space-y-2">
              {inscripciones.map((insc) => (
                <button
                  key={insc.id}
                  onClick={() => setSeleccionada(insc)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition ${
                    seleccionada?.id === insc.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold">N° {insc.numero_orden}</span>
                      <span className={`ml-2 text-sm ${
                        insc.turno === "almuerzo" ? "text-red-600" : "text-orange-600"
                      }`}>
                        {insc.turno === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"}
                      </span>
                    </div>
                    <span className={`text-sm ${
                      insc.estado === "reservado"
                        ? "text-yellow-600"
                        : insc.estado === "atendido"
                        ? "text-green-600"
                        : "text-red-600"
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
          className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
        >
          🚪 Cerrar Sesión
        </button>
      </main>
    </div>
  );
}
