"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const ADMIN_EMAIL = "jairecusi@gmail.com";

export default function LoginPage() {
  const [modo, setModo] = useState<"estudiante" | "admin">("estudiante");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const handleLoginGoogle = async () => {
    setError("");
    setCargando(true);
    try {
      // Primero hacemos signIn y luego verificamos el email
      await signIn("google", { callbackUrl: "/registro" });
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const handleLoginGoogleAdmin = async () => {
    setError("");
    setCargando(true);
    try {
      await signIn("google", { callbackUrl: "/admin" });
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (usuario === "admin" && password === "Chester2006@") {
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
            <p className="text-blue-300 text-xs mt-1">Universidad Nacional de Cañete</p>
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
              <div className="space-y-5">
                <button
                  onClick={handleLoginGoogle}
                  disabled={cargando}
                  className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 py-3.5 rounded-xl font-semibold text-base transition-all hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] disabled:opacity-50"
                >
                  {cargando ? (
                    <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  {cargando ? "Conectando..." : "Iniciar sesión con Google"}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400">Solo correos @undc.edu.pe</span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  Usa tu correo institucional de la UNDC para acceder
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <button
                  onClick={handleLoginGoogleAdmin}
                  disabled={cargando}
                  className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 py-3.5 rounded-xl font-semibold text-base transition-all hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] disabled:opacity-50"
                >
                  {cargando ? (
                    <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  {cargando ? "Conectando..." : "Acceder con Google (Admin)"}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400">Solo correo de administrador</span>
                  </div>
                </div>

                <form onSubmit={handleLoginAdmin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Usuario
                    </label>
                    <input
                      type="text"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      placeholder="admin"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-800 placeholder-gray-400 transition-all"
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-800 placeholder-gray-400 transition-all"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                  >
                    Ingresar con Usuario
                  </button>
                </form>
              </div>
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
