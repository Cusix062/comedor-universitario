"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [modo, setModo] = useState<"estudiante" | "admin">("estudiante");
  const [codigo, setCodigo] = useState("");
  const [correo, setCorreo] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const handleLoginEstudiante = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, correo }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      localStorage.setItem("session", data.session);
      localStorage.setItem("estudiante", JSON.stringify(data.estudiante));
      router.push("/registro");
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (usuario === "admin" && password === "admin123") {
      localStorage.setItem("admin_session", "true");
      router.push("/admin");
    } else {
      setError("Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)" }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-10 pb-8 text-center" style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}>
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl shadow-lg">
              🍽️
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Comedor Universitario</h1>
            <p className="text-blue-200 text-sm mt-2">Escuela Profesional de Ingeniería de Sistemas</p>
            <p className="text-blue-300 text-xs mt-1">Universidad Nacional Daniel Alcides Carrión</p>
          </div>

          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setModo("estudiante")}
              className={`flex-1 py-4 text-sm font-semibold transition-all ${
                modo === "estudiante"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              🎓 Estudiante
            </button>
            <button
              onClick={() => setModo("admin")}
              className={`flex-1 py-4 text-sm font-semibold transition-all ${
                modo === "admin"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              👨‍💼 Administrador
            </button>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                <span className="text-base">⚠️</span>
                {error}
              </div>
            )}

            {modo === "estudiante" ? (
              <form onSubmit={handleLoginEstudiante} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Código de Estudiante
                  </label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ej: 1472960217"
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base text-gray-800 placeholder-gray-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Correo Institucional
                  </label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="tu_codigo@undc.edu.pe"
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base text-gray-800 placeholder-gray-400 transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full text-white py-3.5 rounded-xl font-semibold text-base transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                >
                  {cargando ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verificando...
                    </span>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Solo estudiantes de Ingeniería de Sistemas
                </p>
              </form>
            ) : (
              <form onSubmit={handleLoginAdmin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="admin"
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base text-gray-800 placeholder-gray-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base text-gray-800 placeholder-gray-400 transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full text-white py-3.5 rounded-xl font-semibold text-base transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                >
                  Ingresar al Panel
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-blue-200/60 text-xs mt-6">
          Sistema de Registro de Adicionales v1.0
        </p>
      </div>
    </div>
  );
}
