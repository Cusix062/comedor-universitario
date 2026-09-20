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
      <div className="max-w-lg mx-auto mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 mb-2">Descargar Backup</h2>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Exporta todas las tablas de la base de datos en un archivo JSON.
          </p>

          {lastBackup && (
            <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500">
                Ultimo backup: <span className="font-medium text-slate-700">{lastBackup}</span>
              </p>
            </div>
          )}

          <button
            onClick={descargarBackup}
            disabled={descargando}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {descargando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Descargando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Descargar Backup
              </>
            )}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
