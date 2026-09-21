"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const isAdmin = (session.user as any).isAdmin;
      if (isAdmin) {
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
      await signIn("google", { callbackUrl: "/", prompt: "select_account" });
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div
        className="relative w-full lg:w-[60%] flex items-center justify-center p-8 sm:p-12 lg:p-16 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #2563eb 100%)" }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-white/10 rounded-full" />
        </div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-8 right-8 w-2 h-2 bg-white/30 rounded-full" />
          <div className="absolute top-24 left-16 w-1.5 h-1.5 bg-white/20 rounded-full" />
          <div className="absolute bottom-32 right-24 w-1 h-1 bg-white/40 rounded-full" />
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white/25 rounded-full" />
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-white/15 rounded-full" />
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/15 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-8 text-5xl sm:text-6xl shadow-2xl border border-white/20">
            🍽️
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
            Comedor
            <br />
            Universitario
          </h1>
          <div className="mt-6 sm:mt-8 space-y-2">
            <p className="text-blue-200 text-sm sm:text-base font-medium">
              Escuela Profesional de Ingeniería de Sistemas
            </p>
            <p className="text-blue-300/80 text-xs sm:text-sm">
              Universidad Nacional de Cañete
            </p>
          </div>
          <div className="mt-8 sm:mt-12 flex justify-center gap-3">
            <div className="w-12 h-1 bg-white/40 rounded-full" />
            <div className="w-8 h-1 bg-white/25 rounded-full" />
            <div className="w-4 h-1 bg-white/15 rounded-full" />
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 sm:p-8 bg-gray-50 min-h-[50vh] lg:min-h-screen">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Bienvenido</h2>
              <p className="text-gray-500 text-sm mt-2">Inicia sesión para continuar</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-sm flex items-center gap-2">
                <span className="text-base">⚠️</span>
                {error}
              </div>
            )}

            <div className="space-y-6">
              <button
                onClick={handleLoginGoogle}
                disabled={cargando}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 py-3.5 rounded-2xl font-semibold text-sm text-gray-700 transition-all hover:shadow-lg hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50"
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
                  <span className="bg-gray-50 px-4 text-gray-400 font-medium">Solo correos institucionales</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Usa tu correo institucional de la UNDC para acceder
              </p>
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs mt-8">
            Sistema de Registro de Adicionales v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
