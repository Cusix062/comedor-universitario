import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

type Comensal = {
  numero_orden: number;
  nombre: string;
  codigo: string;
  ciclo: number;
};

export function generarPDF(
  fecha: string,
  almuerzos: Comensal[],
  cenas: Comensal[],
  capacidadAlmuerzo: number,
  capacidadCena: number
): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const totalAlmuerzos = almuerzos.length;
  const totalCenas = cenas.length;
  const porcentajeAlm = capacidadAlmuerzo > 0 ? Math.round((totalAlmuerzos / capacidadAlmuerzo) * 100) : 0;
  const porcentajeCena = capacidadCena > 0 ? Math.round((totalCenas / capacidadCena) * 100) : 0;

  // Header blue bar
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("COMEDOR UNIVERSITARIO - EPIS UNDC", pageWidth / 2, 14, { align: "center" });
  doc.setFontSize(11);
  doc.text(`Fecha: ${fecha}`, pageWidth / 2, 22, { align: "center" });

  let y = 38;

  // Almuerzo table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.text(`ALMUERZO (${totalAlmuerzos}/${capacidadAlmuerzo}) ${porcentajeAlm}%`, 14, y);
  y += 4;

  if (almuerzos.length === 0) {
    doc.setFontSize(10);
    doc.text("Sin inscritos", 14, y);
    y += 10;
  } else {
    const result = autoTable(doc, {
      startY: y,
      head: [["N°", "Código", "Nombre", "Ciclo"]],
      body: almuerzos.map((a) => [
        String(a.numero_orden),
        a.codigo,
        a.nombre,
        String(a.ciclo),
      ]),
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });
    y = (result as any).finalY + 10;
  }

  // Cena table
  doc.setFontSize(13);
  doc.text(`CENA (${totalCenas}/${capacidadCena}) ${porcentajeCena}%`, 14, y);
  y += 4;

  if (cenas.length === 0) {
    doc.setFontSize(10);
    doc.text("Sin inscritos", 14, y);
    y += 10;
  } else {
    const result = autoTable(doc, {
      startY: y,
      head: [["N°", "Código", "Nombre", "Ciclo"]],
      body: cenas.map((c) => [
        String(c.numero_orden),
        c.codigo,
        c.nombre,
        String(c.ciclo),
      ]),
      headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });
    y = (result as any).finalY + 12;
  }

  // Summary
  doc.setFillColor(243, 244, 246);
  doc.rect(14, y, pageWidth - 28, 28, "F");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`RESUMEN`, 20, y + 8);
  doc.setFontSize(10);
  doc.text(`Total: ${totalAlmuerzos + totalCenas} inscritos`, 20, y + 15);
  doc.text(`Almuerzo: ${porcentajeAlm}% ocupado`, 20, y + 21);
  doc.text(`Cena: ${porcentajeCena}% ocupado`, 20, y + 27);

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

export async function enviarReporteConPDF(
  fecha: string,
  almuerzos: Comensal[],
  cenas: Comensal[],
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

  mensaje += `📊 <b>RESUMEN</b>\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━\n`;
  mensaje += `   Total: ${totalAlmuerzos + totalCenas} inscritos\n`;
  mensaje += `   Almuerzo: ${porcentajeAlm}% ocupado\n`;
  mensaje += `   Cena: ${porcentajeCena}% ocupado\n`;

  const msgOk = await enviarMensajeTelegram(mensaje);
  if (!msgOk) return false;

  try {
    const buffer = generarPDF(fecha, almuerzos, cenas, capacidadAlmuerzo, capacidadCena);
    const filename = `reporte-${fecha}.pdf`;

    const formData = new FormData();
    formData.append("chat_id", CHAT_ID!);
    formData.append("document", new Blob([new Uint8Array(buffer)], { type: "application/pdf" }), filename);

    const res = await fetch(`${TELEGRAM_API}/sendDocument`, { method: "POST", body: formData });
    const data = await res.json();
    return data.ok;
  } catch (error) {
    console.error("Error enviando PDF por Telegram:", error);
    return false;
  }
}

export async function enviarReporteDiario(
  fecha: string,
  almuerzos: Comensal[],
  cenas: Comensal[],
  capacidadAlmuerzo: number,
  capacidadCena: number
): Promise<boolean> {
  return enviarReporteConPDF(fecha, almuerzos, cenas, capacidadAlmuerzo, capacidadCena);
}
