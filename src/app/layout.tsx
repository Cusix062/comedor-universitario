import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Comedor Universitario - EPIS UNDC",
  description: "Sistema de gestion de comedor universitario",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const MAINTENANCE = process.env.NEXT_PUBLIC_MAINTENANCE === "true";

  if (MAINTENANCE) {
    return (
      <html lang="es">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🔧</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">En Mantenimiento</h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                El sistema del Comedor Universitario se encuentra temporalmente fuera de servicio por mejoras.
                <br /><br />
                Volveremos pronto.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                Mantenimiento programado
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
