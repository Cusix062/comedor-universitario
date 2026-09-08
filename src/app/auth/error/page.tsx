"use client";

import { useRouter } from "next/navigation";

export default function AuthErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-8 pt-10 pb-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl shadow-lg animate-bounce">
            🚫
          </div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">
            ¡ACCESO DENEGADO!
          </h1>
          <div className="mt-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-xl inline-block">
            <p className="text-xl font-black tracking-wider">
              SOLO ENTRAN CUSISTAS
            </p>
          </div>
          <p className="text-gray-500 mt-5 text-sm leading-relaxed">
            Tu correo <span className="font-semibold text-red-600">no tiene permisos</span> para acceder al comedor universitario.
          </p>
          <p className="text-gray-400 mt-2 text-xs">
            Se permiten correos <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">@undc.edu.pe</span> y el admin autorizado
          </p>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-700 text-sm font-medium">
              ¿Crees que es un error? Contacta al administrador
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-6 w-full text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
