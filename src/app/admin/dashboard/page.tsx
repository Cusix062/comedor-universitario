"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

interface StatsData {
  inscriptionsPerDay: {
    fecha: string;
    almuerzo: number;
    cena: number;
    total: number;
  }[];
  almuerzoTotal: number;
  cenaTotal: number;
  totalStudents: number;
  occupancyRate: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [inscritosHoy, setInscritosHoy] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session");
    const googleAdmin = localStorage.getItem("google_admin_session");
    if (!adminSession && !googleAdmin) {
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((session) => {
          if (session?.user?.isAdmin) {
            localStorage.setItem("google_admin_session", "true");
            fetchStats();
          } else {
            router.push("/");
          }
        })
        .catch(() => router.push("/"));
      return;
    }
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
      await fetchInscritosHoy();
    } catch {
      console.error("Error");
    } finally {
      setCargando(false);
    }
  };

  const fetchInscritosHoy = async () => {
    try {
      const res = await fetch(`/api/admin/validar?fecha=${new Date().toISOString().split("T")[0]}`);
      const data = await res.json();
      setInscritosHoy(data);
    } catch {
      console.error("Error");
    }
  };

  const cerrarSesion = async () => {
    localStorage.removeItem("admin_session");
    localStorage.removeItem("google_admin_session");
    const { signOut } = await import("next-auth/react");
    await signOut({ redirect: false });
    router.push("/");
  };

  const ultimos7Dias = stats?.inscriptionsPerDay.slice(-7) || [];
  const todayStr = new Date().toISOString().split("T")[0];
  const inscritosHoyCount = inscritosHoy.length;
  const almuerzosHoy = inscritosHoy.filter((i) => i.turno === "almuerzo").length;
  const cenasHoy = inscritosHoy.filter((i) => i.turno === "cena").length;
  const ocupacionHoy = stats?.occupancyRate ?? 0;

  const pieData = [
    { name: "Almuerzo", value: stats?.almuerzoTotal ?? 0 },
    { name: "Cena", value: stats?.cenaTotal ?? 0 },
  ];

  const COLORS = ["#22c55e", "#f59e0b"];

  const lineData = (stats?.inscriptionsPerDay || []).map((d) => ({
    fecha: d.fecha.slice(5),
    inscritos: d.total,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="text-white shadow-lg"
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">
              📊
            </div>
            <div>
              <h1 className="text-lg font-bold">Dashboard</h1>
              <p className="text-gray-400 text-xs">Estadísticas del Comedor</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => router.push("/admin")}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-xl transition text-sm font-medium"
            >
              📋 Validar
            </button>
            <button
              onClick={() => router.push("/admin/turnos")}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition text-sm font-medium"
            >
              ⚙️ Cupos
            </button>
            <button
              onClick={() => router.push("/admin/historial")}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl transition text-sm font-medium"
            >
              📚 Historial
            </button>
            <button
              onClick={() => router.push("/admin/monitoreo")}
              className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition text-sm font-medium"
            >
              📈 Monitoreo
            </button>
            <button
              onClick={cerrarSesion}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-xl transition text-sm font-medium"
            >
              🚪 Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-5">
        {cargando ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-gray-400 text-sm">Cargando estadísticas...</p>
          </div>
        ) : !stats ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
              ⚠️
            </div>
            <p className="text-gray-400">No se pudieron cargar las estadísticas</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                <p className="text-3xl font-bold text-blue-600">{inscritosHoyCount}</p>
                <p className="text-gray-500 text-sm mt-1 font-medium">
                  👥 Inscritos Hoy
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                <p className="text-3xl font-bold text-green-600">{almuerzosHoy}</p>
                <p className="text-gray-500 text-sm mt-1 font-medium">
                  🥗 Almuerzos Hoy
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                <p className="text-3xl font-bold text-amber-600">{cenasHoy}</p>
                <p className="text-gray-500 text-sm mt-1 font-medium">
                  🌙 Cenas Hoy
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
                <p className="text-3xl font-bold text-purple-600">{ocupacionHoy}%</p>
                <p className="text-gray-500 text-sm mt-1 font-medium">
                  📈 Ocupación
                </p>
              </div>
            </div>

            {/* Bar Chart - Last 7 Days */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm">
                  📊
                </span>
                Inscripciones por día (Últimos 7 días)
              </h2>
              {ultimos7Dias.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ultimos7Dias}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="fecha"
                      tickFormatter={(val) => val.slice(5)}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip
                      labelFormatter={(val) => `Fecha: ${val}`}
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    />
                    <Legend />
                    <Bar dataKey="almuerzo" name="Almuerzo" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cena" name="Cena" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Sin datos disponibles
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Pie Chart - Distribution */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-sm">
                    🥧
                  </span>
                  Distribución Almuerzo vs Cena
                </h2>
                {pieData.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }: any) =>
                          `${name} ${((percent || 0) * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Sin datos disponibles
                  </div>
                )}
              </div>

              {/* Line Chart - 30 Day Trend */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-sm">
                    📈
                  </span>
                  Tendencia (Últimos 30 días)
                </h2>
                {lineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="fecha" fontSize={10} interval="preserveStartEnd" />
                      <YAxis fontSize={12} />
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="inscritos"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Sin datos disponibles
                  </div>
                )}
              </div>
            </div>

            {/* Summary Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-sm">
                  📋
                </span>
                Resumen últimos 7 días
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        🥗 Almuerzos
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        🌙 Cenas
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimos7Dias
                      .slice()
                      .reverse()
                      .map((d) => (
                        <tr
                          key={d.fecha}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-gray-800">
                            {d.fecha === todayStr
                              ? "Hoy"
                              : d.fecha.slice(5).replace("-", "/")}
                          </td>
                          <td className="py-3 px-4 text-center text-green-600 font-medium">
                            {d.almuerzo}
                          </td>
                          <td className="py-3 px-4 text-center text-amber-600 font-medium">
                            {d.cena}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-800">
                            {d.total}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Global Totals */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-sm">
                  🌍
                </span>
                Totales Globales
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {stats.almuerzoTotal}
                  </p>
                  <p className="text-gray-500 text-xs mt-1 font-medium">
                    Total Almuerzos (30 días)
                  </p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.cenaTotal}
                  </p>
                  <p className="text-gray-500 text-xs mt-1 font-medium">
                    Total Cenas (30 días)
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalStudents}
                  </p>
                  <p className="text-gray-500 text-xs mt-1 font-medium">
                    Estudiantes Registrados
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.occupancyRate}%
                  </p>
                  <p className="text-gray-500 text-xs mt-1 font-medium">
                    Tasa de Ocupación
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
