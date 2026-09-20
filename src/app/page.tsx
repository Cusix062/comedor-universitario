"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "jairecusi@gmail.com";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      if (session.user.email === ADMIN_EMAIL) {
        router.push("/admin");
      } else {
        router.push("/registro");
      }
    }
  }, [session, status, router]);

  const handleLoginGoogle = async () => {
    setError("");
    setCargando(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-white font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)" }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-5 sm:px-8 pt-7 sm:pt-10 pb-6 sm:pb-8 text-center" style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-3xl sm:text-4xl shadow-lg">
              🍽️
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Comedor Universitario</h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-2">Escuela Profesional de Ingeniería de Sistemas</p>
            <p className="text-blue-300 text-[10px] sm:text-xs mt-1">Universidad Nacional de Cañete</p>
          </div>

          <div className="p-5 sm:p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl mb-4 sm:mb-6 text-xs sm:text-sm flex items-center gap-2">
                <span className="text-sm sm:text-base">⚠️</span>
                {error}
              </div>
            )}

            <div className="space-y-5">
              <button
                onClick={handleLoginGoogle}
                disabled={cargando}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 border-2 border-gray-200 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] disabled:opacity-50"
              >
                {cargando ? (
                  <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
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
                  <span className="bg-white px-3 text-gray-500 font-medium">Solo correos institucionales</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Usa tu correo institucional de la UNDC para acceder
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-blue-100 text-xs mt-6">
          Sistema de Registro de Adicionales v1.0
        </p>
      </div>
    </div>
  );
}
