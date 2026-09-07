"use client";

import { useRouter } from "next/navigation";

export default function AuthErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-8 pt-10 pb-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl">
            🚫
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Acceso Denegado</h1>
          <p className="text-gray-500 mt-3 text-sm leading-relaxed">
            Solo se permiten correos institucionales de la{" "}
            <span className="font-semibold text-gray-700">Universidad Nacional de Cañete</span>
          </p>
          <p className="text-gray-400 mt-2 text-xs">
            Dominio requerido: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">@undc.edu.pe</span>
          </p>
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
