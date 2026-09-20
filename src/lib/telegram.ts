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
  ciclo: number;
};

const GREEN: [number, number, number] = [26, 92, 58];

function drawCirclePlaceholder(doc: jsPDF, cx: number, cy: number, r: number) {
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.8);
  doc.circle(cx, cy, r);
  doc.setFontSize(5);
  doc.setTextColor(...GREEN);
  doc.text("LOGO", cx, cy + 1.5, { align: "center" });
}

function drawFormattedHeader(doc: jsPDF, tipo: "almuerzo" | "cena", fecha: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Left circle placeholder (UNDC)
  drawCirclePlaceholder(doc, 22, 18, 9);

  // Center text block
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.text("Ley de Org. N° 29498", pageWidth / 2, 10, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DIRECCIÓN DE BIENESTAR UNIVERSITARIO", pageWidth / 2, 16, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("SERVICIO DE COMEDOR UNIVERSITARIO", pageWidth / 2, 22, { align: "center" });

  // Right circle placeholder (DBU)
  drawCirclePlaceholder(doc, pageWidth - 22, 18, 9);

  // Green bar
  doc.setFillColor(...GREEN);
  doc.rect(0, 30, pageWidth, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Código: F-A03.04-BU-016", 14, 35.5);
  doc.text("v02", pageWidth - 14, 35.5, { align: "right" });

  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  const titulo = tipo === "almuerzo"
    ? "ADICIONALES DE ALMUERZO"
    : "ADICIONALES DE CENA";
  doc.text(titulo, pageWidth / 2, 46, { align: "center" });

  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`FECHA: ${fecha}`, 14, 54);

  return 60;
}

export function generarPDF(
  fecha: string,
  tipo: "almuerzo" | "cena",
  inscritos: { numero_orden: number; nombre: string; ciclo: number }[],
  capacidad: number
): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = drawFormattedHeader(doc, tipo, fecha);

  const rows: string[][] = [];
  for (let i = 0; i < capacidad; i++) {
    const inscrito = inscritos[i];
    rows.push([
      String(i + 1).padStart(2, "0"),
      inscrito ? inscrito.nombre : "",
      "ING. DE SISTEMAS",
      inscrito ? String(inscrito.ciclo) : "",
      "",
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [["N°", "APELLIDOS Y NOMBRES", "ESCUELA PROFESIONAL", "CICLO", "FIRMA"]],
    body: rows,
    headStyles: {
      fillColor: GREEN,
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { cellWidth: 65 },
      2: { cellWidth: 50 },
      3: { halign: "center", cellWidth: 15 },
      4: { cellWidth: 30 },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(
    "Toda copia de este documento es considerada 'copia no controlada'.",
    pageWidth / 2,
    finalY,
    { align: "center" }
  );

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
      mensaje += `   ${a.numero_orden}. ${a.nombre}\n`;
    });
  }
  mensaje += `\n`;

  mensaje += `🌙 <b>CENA</b> (${totalCenas}/${capacidadCena}) ${porcentajeCena}%\n`;
  mensaje += `━━━━━━━━━━━━━━━━━━━━\n`;
  if (cenas.length === 0) {
    mensaje += `   Sin inscritos\n`;
  } else {
    cenas.forEach((c) => {
      mensaje += `   ${c.numero_orden}. ${c.nombre}\n`;
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
    const bufferAlmuerzo = generarPDF(fecha, "almuerzo", almuerzos, capacidadAlmuerzo);
    const bufferCena = generarPDF(fecha, "cena", cenas, capacidadCena);

    const uploadPDF = async (buffer: Buffer, filename: string) => {
      const formData = new FormData();
      formData.append("chat_id", CHAT_ID!);
      formData.append("document", new Blob([new Uint8Array(buffer)], { type: "application/pdf" }), filename);
      const res = await fetch(`${TELEGRAM_API}/sendDocument`, { method: "POST", body: formData });
      const data = await res.json();
      return data.ok;
    };

    const ok1 = await uploadPDF(bufferAlmuerzo, `almuerzo-${fecha}.pdf`);
    const ok2 = await uploadPDF(bufferCena, `cena-${fecha}.pdf`);
    return ok1 && ok2;
  } catch (error) {
    console.error("Error enviando PDFs por Telegram:", error);
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
