"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calcularCiclo } from "@/lib/ciclos";

interface Inscrito {
  id: number;
  numero_orden: number;
  codigo: string;
  nombre: string;
  ciclo: number;
  estado: string;
  turno: string;
  fecha: string;
}

interface PDFReportProps {
  inscripciones: Inscrito[];
  fecha: string;
}

export default function PDFReport({ inscripciones, fecha }: PDFReportProps) {
  const generarPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Comedor Universitario - EPIS UNDC", pageWidth / 2, 18, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${fecha}`, pageWidth / 2, 28, { align: "center" });

    const almuerzos = inscripciones.filter((i) => i.turno === "almuerzo");
    const cenas = inscripciones.filter((i) => i.turno === "cena");
    doc.text(`Almuerzos: ${almuerzos.length}  |  Cenas: ${cenas.length}  |  Total: ${inscripciones.length}`, pageWidth / 2, 35, { align: "center" });

    doc.setTextColor(0, 0, 0);
    const startY = 50;

    // Almuerzo table
    if (almuerzos.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Almuerzo", 14, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [["N°", "Código", "Nombre", "Ciclo", "Estado"]],
        body: almuerzos.map((i, idx) => {
          const cicloInfo = calcularCiclo(i.codigo);
          const cicloRomano = cicloInfo?.romano || i.ciclo?.toString() || "I";
          return [
            String(idx + 1),
            i.codigo,
            i.nombre,
            cicloRomano,
            i.estado,
          ];
        }),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        alternateRowStyles: { fillColor: [243, 244, 246] },
      });
    }

    // Cena table
    const cenaStartY = (doc as any).lastAutoTable?.finalY || startY + 10;
    if (cenas.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Cena", 14, cenaStartY + 8);

      autoTable(doc, {
        startY: cenaStartY + 12,
        head: [["N°", "Código", "Nombre", "Ciclo", "Estado"]],
        body: cenas.map((i, idx) => {
          const cicloInfo = calcularCiclo(i.codigo);
          const cicloRomano = cicloInfo?.romano || i.ciclo?.toString() || "I";
          return [
            String(idx + 1),
            i.codigo,
            i.nombre,
            cicloRomano,
            i.estado,
          ];
        }),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [245, 158, 11], textColor: 255 },
        alternateRowStyles: { fillColor: [243, 244, 246] },
      });
    }

    // Footer
    const finalY = (doc as any).lastAutoTable?.finalY || startY + 20;
    const reservados = inscripciones.filter((i) => i.estado === "reservado").length;
    const atendidos = inscripciones.filter((i) => i.estado === "atendido").length;
    const cancelados = inscripciones.filter((i) => i.estado === "cancelado").length;

    doc.setFillColor(243, 244, 246);
    doc.rect(14, finalY + 8, pageWidth - 28, 14, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Reservados: ${reservados}  |  Atendidos: ${atendidos}  |  Cancelados: ${cancelados}  |  Total: ${inscripciones.length}`,
      pageWidth / 2,
      finalY + 16,
      { align: "center" }
    );

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generado por el Sistema de Comedor Universitario", pageWidth / 2, finalY + 22, { align: "center" });

    doc.save(`reporte_${fecha}.pdf`);
  };

  return (
    <button
      onClick={generarPDF}
      className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all"
    >
      📄 Generar PDF
    </button>
  );
}
