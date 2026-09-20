"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { icon: "📋", label: "Validar", href: "/admin/validar" },
  { icon: "⚙️", label: "Cupos", href: "/admin/turnos" },
  { icon: "📊", label: "Dashboard", href: "/admin/dashboard" },
  { icon: "📈", label: "Monitoreo", href: "/admin/monitoreo" },
  { icon: "📚", label: "Historial", href: "/admin/historial" },
  { icon: "🚫", label: "Suspensiones", href: "/admin/suspensiones" },
  { icon: "📄", label: "Formato", href: "/admin/formato" },
  { icon: "📥", label: "Backup", href: "/admin/backup" },
];

const titles: Record<string, string> = {
  "/admin": "📋 Validar",
  "/admin/validar": "📋 Validar",
  "/admin/turnos": "⚙️ Cupos",
  "/admin/dashboard": "📊 Dashboard",
  "/admin/monitoreo": "📈 Monitoreo",
  "/admin/historial": "📚 Historial",
  "/admin/suspensiones": "🚫 Suspensiones",
  "/admin/formato": "📄 Formato",
  "/admin/backup": "📥 Backup",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTimeSimulator, setShowTimeSimulator] = useState(false);
  const [horaSimulada, setHoraSimulada] = useState("");
  const [minutoSimulado, setMinutoSimulado] = useState("");
  const [modoSimulacion, setModoSimulacion] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const simActivo = localStorage.getItem("simulacion_activo") === "true";
    const hSim = localStorage.getItem("simulacion_hora") || "";
    const mSim = localStorage.getItem("simulacion_minuto") || "";
    setModoSimulacion(simActivo);
    setHoraSimulada(hSim);
    setMinutoSimulado(mSim);
  }, []);

  const cerrarSesion = async () => {
    localStorage.removeItem("admin_session");
    localStorage.removeItem("google_admin_session");
    await signOut({ redirect: false });
    router.push("/");
  };

  const activarSimulacion = () => {
    if (!horaSimulada || !minutoSimulado) {
      alert("Selecciona hora y minuto");
      return;
    }
    localStorage.setItem("simulacion_activo", "true");
    localStorage.setItem("simulacion_hora", horaSimulada);
    localStorage.setItem("simulacion_minuto", minutoSimulado);
    setModoSimulacion(true);
    setShowTimeSimulator(false);
  };

  const desactivarSimulacion = () => {
    localStorage.removeItem("simulacion_activo");
    localStorage.removeItem("simulacion_hora");
    localStorage.removeItem("simulacion_minuto");
    setModoSimulacion(false);
    setHoraSimulada("");
    setMinutoSimulado("");
  };

  const presets = [
    { label: "8:00 AM (Antes)", hora: "08", minuto: "00" },
    { label: "10:30 AM (Abre almuerzo)", hora: "10", minuto: "30" },
    { label: "11:00 AM (Almuerzo)", hora: "11", minuto: "00" },
    { label: "12:00 PM (Cierra almuerzo)", hora: "12", minuto: "00" },
    { label: "2:00 PM (Mediodía)", hora: "14", minuto: "00" },
    { label: "3:30 PM (Abre cena)", hora: "15", minuto: "30" },
    { label: "4:00 PM (Cena)", hora: "16", minuto: "00" },
    { label: "5:00 PM (Cierra cena)", hora: "17", minuto: "00" },
    { label: "8:00 PM (Noche)", hora: "20", minuto: "00" },
  ];

  const pageTitle = titles[pathname] || "🍽️ Comedor";
  const normalizedPath = pathname === "/admin" ? "/admin/validar" : pathname;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-slate-900 text-white flex flex-col transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-700/50 flex-shrink-0">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-lg">
            🍽️
          </div>
          <span className="text-lg font-bold tracking-tight">Comedor</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = normalizedPath === item.href || (pathname === "/admin" && item.href === "/admin/validar");
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Divider */}
          <div className="border-t border-slate-700/50 my-3" />

          {/* Time Simulator */}
          <button
            onClick={() => {
              setShowTimeSimulator(true);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              modoSimulacion
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="text-base">🕐</span>
            <span className="flex-1 text-left">
              {modoSimulacion ? `${horaSimulada}:${minutoSimulado}` : "Simulador de Hora"}
            </span>
            {modoSimulacion && (
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            )}
          </button>
        </nav>

        {/* Logout at bottom */}
        <div className="p-3 border-t border-slate-700/50 flex-shrink-0">
          <button
            onClick={cerrarSesion}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-150"
          >
            <span className="text-base">🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-1"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base font-bold text-gray-800 truncate">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-4">
            {modoSimulacion && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                {horaSimulada}:{minutoSimulado}
              </span>
            )}
            <span className="hidden sm:inline text-xs text-gray-500 font-medium">{currentTime}</span>
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-sm font-bold">
              👨‍💼
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Time Simulator Modal */}
      {showTimeSimulator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">⏰</span> Simulador de Hora
              </h3>
              <button
                onClick={() => setShowTimeSimulator(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {modoSimulacion && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-yellow-700 text-sm font-medium">
                  🔴 Modo simulación activo: {horaSimulada}:{minutoSimulado}
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar hora:</label>
              <div className="flex gap-3">
                <select
                  value={horaSimulada}
                  onChange={(e) => setHoraSimulada(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Hora</option>
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={String(i).padStart(2, "0")}>
                      {String(i).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <span className="text-2xl font-bold text-gray-400 self-center">:</span>
                <select
                  value={minutoSimulado}
                  onChange={(e) => setMinutoSimulado(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Min</option>
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={String(m).padStart(2, "0")}>
                      {String(m).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Accesos rápidos:</label>
              <div className="grid grid-cols-3 gap-2">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setHoraSimulada(p.hora);
                      setMinutoSimulado(p.minuto);
                    }}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition text-left"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={activarSimulacion}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
              >
                Activar Simulación
              </button>
              {modoSimulacion && (
                <button
                  onClick={desactivarSimulacion}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition"
                >
                  Desactivar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
