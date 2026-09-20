"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

export default function BackupPage() {
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);
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
          } else {
            router.push("/");
          }
        })
        .catch(() => router.push("/"));
    }

    const saved = localStorage.getItem("last_backup_time");
    if (saved) setLastBackup(saved);
  }, [router]);

  const descargarBackup = async () => {
    setDescargando(true);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) throw new Error("Error al descargar");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-comedor-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const now = new Date().toLocaleString("es-PE");
      localStorage.setItem("last_backup_time", now);
      setLastBackup(now);
    } catch {
      alert("Error al descargar el backup");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm">
              💾
            </span>
            Descargar Backup
          </h2>

          <p className="text-gray-600 text-sm mb-6">
            Exporta todas las tablas de la base de datos en un archivo JSON. Las tablas
            incluidas son: estudiantes, cupos, inscripciones, beneficiarios, suspenciones
            y audit_logs.
          </p>

          {lastBackup && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Último backup:</span> {lastBackup}
              </p>
            </div>
          )}

          <button
            onClick={descargarBackup}
            disabled={descargando}
            className="w-full text-white py-3 rounded-xl font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
          >
            {descargando ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Descargando...
              </span>
            ) : (
              "📥 Descargar Backup"
            )}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
