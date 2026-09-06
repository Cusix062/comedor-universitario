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

export default function AdminTurnosPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [cupos, setCupos] = useState<Cupo[]>([]);
  const [almuerzoCap, setAlmuerzoCap] = useState(50);
  const [cenaCap, setCenaCap] = useState(50);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session");
    if (!adminSession) {
      router.push("/");
      return;
    }
    fetchCupos();
  }, [router, fecha]);

  const fetchCupos = async () => {
    try {
      const res = await fetch("/api/admin/turnos");
      const data = await res.json();
      setCupos(data);

      // Cargar capacities del día seleccionado
      const almuerzo = data.find((c: Cupo) => c.fecha === fecha && c.tipo === "almuerzo");
      const cena = data.find((c: Cupo) => c.fecha === fecha && c.tipo === "cena");

      if (almuerzo) setAlmuerzoCap(almuerzo.capacidad);
      if (cena) setCenaCap(cena.capacidad);
    } catch {
      console.error("Error");
    }
  };

  const guardarCupos = async () => {
    setCargando(true);
    setMensaje("");
    try {
      const res = await fetch("/api/admin/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha,
          almuerzo_capacidad: almuerzoCap,
          cena_capacidad: cenaCap,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje("✅ Cupos actualizados correctamente");
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

  // Generar fechas de la semana
  const generarSemana = async () => {
    const hoy = new Date();
    const promesas = [];

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      const fechaStr = fecha.toISOString().split("T")[0];

      promesas.push(
        fetch("/api/admin/turnos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fecha: fechaStr,
            almuerzo_capacidad: almuerzoCap,
            cena_capacidad: cenaCap,
          }),
        })
      );
    }

    await Promise.all(promesas);
    setMensaje("✅ Cupos generados para los próximos 7 días");
    fetchCupos();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">⚙️ Configurar Cupos</h1>
            <p className="text-blue-100 text-sm">Panel de Administración</p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
          >
            ← Volver
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {mensaje && (
          <div className={`px-4 py-3 rounded-lg ${
            mensaje.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {mensaje}
          </div>
        )}

        {/* Configuración de cupos */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">📝 Configurar Cupos Diarios</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">📅 Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🥗 Capacidad Almuerzo
                </label>
                <input
                  type="number"
                  value={almuerzoCap}
                  onChange={(e) => setAlmuerzoCap(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🌙 Capacidad Cena
                </label>
                <input
                  type="number"
                  value={cenaCap}
                  onChange={(e) => setCenaCap(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={guardarCupos}
                disabled={cargando}
                className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50"
              >
                {cargando ? "Guardando..." : "💾 Guardar Cupos"}
              </button>
              <button
                onClick={generarSemana}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition"
              >
                📅 Generar 7 Días
              </button>
            </div>
          </div>
        </div>

        {/* Lista de cupos existentes */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">📊 Cupos Configurados</h2>

          {cupos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay cupos configurados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">Capacidad</th>
                    <th className="text-left p-2">Ocupados</th>
                    <th className="text-left p-2">Estado</th>
                    <th className="text-left p-2">Disponibles</th>
                  </tr>
                </thead>
                <tbody>
                  {cupos.map((cupo) => (
                    <tr key={cupo.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{cupo.fecha}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          cupo.tipo === "almuerzo"
                            ? "bg-red-100 text-red-800"
                            : "bg-orange-100 text-orange-800"
                        }`}>
                          {cupo.tipo === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"}
                        </span>
                      </td>
                      <td className="p-2 font-bold">{cupo.capacidad}</td>
                      <td className="p-2">{cupo.ocupados}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          cupo.estado === "abierto"
                            ? "bg-green-100 text-green-800"
                            : cupo.estado === "cerrado"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {cupo.estado}
                        </span>
                      </td>
                      <td className="p-2 font-bold text-green-600">
                        {cupo.capacidad - cupo.ocupados}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
