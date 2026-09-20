const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function enviarMensajeTelegram(mensaje: string): Promise<boolean> {
  if (!process.env.TELEGRAM_BOT_TOKEN || !CHAT_ID) {
    console.error("Faltan variables de entorno de Telegram");
    return false;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: mensaje,
        parse_mode: "HTML",
      }),
    });
    const data = await res.json();
    return data.ok;
  } catch (error) {
    console.error("Error enviando mensaje Telegram:", error);
    return false;
  }
}

export async function enviarReporteDiario(
  fecha: string,
  almuerzos: { numero_orden: number; nombre: string; codigo: string; ciclo: number }[],
  cenas: { numero_orden: number; nombre: string; codigo: string; ciclo: number }[],
  capacidadAlmuerzo: number,
  capacidadCena: number
): Promise<boolean> {
  const totalAlmuerzos = almuerzos.length;
  const totalCenas = cenas.length;
  const porcentajeAlm = capacidadAlmuerzo > 0 ? Math.round((totalAlmuerzos / capacidadAlmuerzo) * 100) : 0;
  const porcentajeCena = capacidadCena > 0 ? Math.round((totalCenas / capacidadCena) * 100) : 0;

  let mensaje = `🍽️ <b>REPORTE DIARIO - COMEDOR UNIVERSITARIO</b>\n`;
  mensaje += `📅 ${fecha}\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Almuerzo
  mensaje += `🥗 <b>ALMUERZO</b> (${totalAlmuerzos}/${capacidadAlmuerzo}) ${porcentajeAlm}%\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━\n`;
  if (almuerzos.length === 0) {
    mensaje += `   Sin inscritos\n`;
  } else {
    almuerzos.forEach((a) => {
      mensaje += `   ${a.numero_orden}. ${a.nombre} (${a.codigo})\n`;
    });
  }
  mensaje += `\n`;

  // Cena
  mensaje += `🌙 <b>CENA</b> (${totalCenas}/${capacidadCena}) ${porcentajeCena}%\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━\n`;
  if (cenas.length === 0) {
    mensaje += `   Sin inscritos\n`;
  } else {
    cenas.forEach((c) => {
      mensaje += `   ${c.numero_orden}. ${c.nombre} (${c.codigo})\n`;
    });
  }
  mensaje += `\n`;

  // Resumen
  mensaje += `📊 <b>RESUMEN</b>\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `   Total: ${totalAlmuerzos + totalCenas} inscritos\n`;
  mensaje += `   Almuerzo: ${porcentajeAlm}% ocupado\n`;
  mensaje += `   Cena: ${porcentajeCena}% ocupado\n`;

  return enviarMensajeTelegram(mensaje);
}
