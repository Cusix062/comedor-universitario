"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos

export default function SecurityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Auto-logout por inactividad
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        signOut({ redirect: false });
        window.location.href = "/";
      }, INACTIVITY_TIMEOUT);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => document.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    // 2. Deshabilitar right-click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);

    // 3. Bloquear atajos de DevTools
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "J" || e.key === "j")) ||
        (e.ctrlKey && (e.key === "U" || e.key === "u"))
      ) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    // 4. Deshabilitar arrastrar imagenes/texto
    const handleDragStart = (e: DragEvent) => e.preventDefault();
    document.addEventListener("dragstart", handleDragStart);

    // 5. Proteccion contra screenshot (deshabilitar print screen basico)
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("");
      }
    };
    document.addEventListener("keyup", handleKeyUp);

    // 6. Prevenir ver fuente
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      e.preventDefault();
    };
    document.addEventListener("selectstart", handleSelectStart);

    return () => {
      clearTimeout(timeout);
      events.forEach((e) => document.removeEventListener(e, resetTimer));
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, []);

  return <>{children}</>;
}
