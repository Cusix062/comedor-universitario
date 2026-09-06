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
      <header className="text-white shadow-lg" style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg">
              ⚙️
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

      <main className="max-w-5xl mx-auto p-4 space-y-5">
        {mensaje && (
          <div className={`px-5 py-4 rounded-xl flex items-center gap-3 ${
            mensaje.startsWith("✅")
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            <span className="font-medium">{mensaje}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm">📝</span>
            Configurar Cupos Diarios
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                <label className="block text-sm font-semibold text-green-800 mb-2">
                  🥗 Capacidad Almuerzo
                </label>
                <input
                  type="number"
                  value={almuerzoCap}
                  onChange={(e) => setAlmuerzoCap(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full border-2 border-green-200 rounded-xl px-4 py-3 text-lg font-bold text-green-800 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                <label className="block text-sm font-semibold text-amber-800 mb-2">
                  🌙 Capacidad Cena
                </label>
                <input
                  type="number"
                  value={cenaCap}
                  onChange={(e) => setCenaCap(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full border-2 border-amber-200 rounded-xl px-4 py-3 text-lg font-bold text-amber-800 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={guardarCupos}
                disabled={cargando}
                className="flex-1 text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
              >
                {cargando ? "Guardando..." : "💾 Guardar Cupos"}
              </button>
              <button
                onClick={generarSemana}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                📅 Generar 7 Días
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm">📊</span>
            Cupos Configurados
          </h2>

          {cupos.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">📭</div>
              <p className="text-gray-400">No hay cupos configurados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacidad</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ocupados</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Disponibles</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cupos.map((cupo) => (
                    <tr key={cupo.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-600 font-mono text-xs">{cupo.fecha}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          cupo.tipo === "almuerzo"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {cupo.tipo === "almuerzo" ? "🥗 Almuerzo" : "🌙 Cena"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800">{cupo.capacidad}</td>
                      <td className="py-3 px-4 text-gray-600">{cupo.ocupados}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{cupo.capacidad - cupo.ocupados}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          cupo.estado === "abierto"
                            ? "bg-green-100 text-green-700"
                            : cupo.estado === "cerrado"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {cupo.estado}
                        </span>
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
