import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ActivityPdfData } from '@/types';
import { formatCop, formatDateEs } from '@/theme/format';
import { PAYMENT_METHOD_LABELS } from '@/theme/status';

/**
 * Convierte caracteres especiales tipográficos no mapeados en WinAnsi a equivalentes seguros,
 * garantizando que tildes (á, é, í, ó, ú), eñes (ñ, Ñ), diéresis (ü, Ü), signos (¿, ¡, $)
 * y letras latinas se impriman con fidelidad sin provocar excepciones de codificación.
 */
function sanitizeText(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/…/g, '...')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Divide un texto en líneas respetando el ancho máximo especificado.
 */
function wrapText(
  text: string,
  maxWidth: number,
  font: { widthOfTextAtSize: (text: string, size: number) => number },
  fontSize: number
): string[] {
  const sanitized = sanitizeText(text);
  const paragraphs = sanitized.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }

    const words = para.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      let width = 0;
      try {
        width = font.widthOfTextAtSize(candidate, fontSize);
      } catch {
        // En caso de caracter exótico, cálculo de respaldo
        width = candidate.length * fontSize * 0.55;
      }

      if (width <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Genera el documento PDF nativo usando pdf-lib siguiendo las directrices
 * visuales de «La Libreta» y las restricciones de seguridad:
 * - Sin notas internas.
 * - Sin conceptos de factura electrónica ni DIAN.
 * - Sin tablas de cantidades/ítems unitarios.
 * - Manejo de múltiples páginas para descripciones extensas.
 */
export async function buildActivityPdf(data: ActivityPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Fuentes estándar integradas (ligeras, sin descargas remotas)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Paleta de tokens de «La Libreta»
  const colorInk = rgb(0.07, 0.09, 0.086); // #121716
  const colorMuted = rgb(0.373, 0.424, 0.404); // #5F6C67
  const colorSubtle = rgb(0.29, 0.337, 0.322); // #4A5652
  const colorRule = rgb(0.859, 0.886, 0.878); // #DBE2E0
  const colorReceived = rgb(0.055, 0.431, 0.345); // #0E6E58
  const colorOwed = rgb(0.651, 0.318, 0.11); // #A6511C
  const colorPanel = rgb(0.957, 0.965, 0.961); // #F4F6F5

  // Dimensiones A4 en puntos (72 puntos por pulgada)
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 42;
  const contentWidth = pageWidth - marginX * 2; // ~511.28 pt
  const marginBottom = 50;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 45;

  const checkPageBreak = (neededHeight: number) => {
    if (y - neededHeight < marginBottom) {
      // Pie en la página actual
      drawFooter(page, false);
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 45;
      // Cabecera condensada en páginas subsiguientes
      drawContinuationHeader(page);
    }
  };

  const drawFooter = (targetPage: typeof page, isLast: boolean) => {
    const footerY = 35;
    targetPage.drawLine({
      start: { x: marginX, y: footerY + 18 },
      end: { x: marginX + contentWidth, y: footerY + 18 },
      thickness: 1,
      color: colorRule,
    });

    const disclaimer = 'Este documento resume un servicio prestado y los pagos recibidos. No es una factura.';
    targetPage.drawText(sanitizeText(disclaimer), {
      x: marginX,
      y: footerY + 6,
      size: 8,
      font: fontRegular,
      color: colorMuted,
    });

    const info = `Comprobante ${data.reference_code} · Generado el ${formatDateEs(data.generation_date)}${
      data.issuer.business_name ? ` · ${data.issuer.business_name}` : ''
    }`;
    targetPage.drawText(sanitizeText(info), {
      x: marginX,
      y: footerY - 5,
      size: 8,
      font: fontRegular,
      color: colorMuted,
    });

    if (!isLast) {
      targetPage.drawText('(Continúa en la siguiente página)', {
        x: marginX + contentWidth - 140,
        y: footerY - 5,
        size: 8,
        font: fontBold,
        color: colorMuted,
      });
    }
  };

  const drawContinuationHeader = (targetPage: typeof page) => {
    targetPage.drawText(sanitizeText(`${data.reference_code} — ${data.activity.title}`), {
      x: marginX,
      y,
      size: 9,
      font: fontBold,
      color: colorMuted,
    });
    y -= 12;
    targetPage.drawLine({
      start: { x: marginX, y },
      end: { x: marginX + contentWidth, y },
      thickness: 0.5,
      color: colorRule,
    });
    y -= 20;
  };

  // ==========================================
  // 1. Encabezado Principal
  // ==========================================

  // Monograma / Caja del emisor
  const initials = (data.issuer.name || 'DJ')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  page.drawRectangle({
    x: marginX,
    y: y - 36,
    width: 36,
    height: 36,
    color: colorInk,
  });

  page.drawText(initials, {
    x: marginX + 8,
    y: y - 24,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Datos del emisor
  page.drawText(sanitizeText(data.issuer.name || 'Profesional Independiente'), {
    x: marginX + 46,
    y: y - 10,
    size: 13,
    font: fontBold,
    color: colorInk,
  });

  if (data.issuer.business_name) {
    page.drawText(sanitizeText(data.issuer.business_name), {
      x: marginX + 46,
      y: y - 23,
      size: 10,
      font: fontRegular,
      color: colorSubtle,
    });
  }

  const issuerContactParts: string[] = [];
  if (data.issuer.phone) issuerContactParts.push(data.issuer.phone);
  if (data.issuer.email) issuerContactParts.push(data.issuer.email);
  if (issuerContactParts.length > 0) {
    page.drawText(sanitizeText(issuerContactParts.join('  ·  ')), {
      x: marginX + 46,
      y: y - 35,
      size: 8.5,
      font: fontRegular,
      color: colorMuted,
    });
  }

  // Lado derecho: Tipo de documento y referencia
  const docTypeTitle = data.activity.type === 'service' ? 'Resumen de servicio' : 'Resumen de venta';
  page.drawText(docTypeTitle, {
    x: marginX + contentWidth - 140,
    y: y - 10,
    size: 9,
    font: fontRegular,
    color: colorMuted,
  });

  page.drawText(data.reference_code, {
    x: marginX + contentWidth - 140,
    y: y - 24,
    size: 12,
    font: fontBold,
    color: colorInk,
  });

  page.drawText(`Emitido el ${formatDateEs(data.generation_date)}`, {
    x: marginX + contentWidth - 140,
    y: y - 36,
    size: 8.5,
    font: fontRegular,
    color: colorMuted,
  });

  y -= 48;

  // Línea divisoria gruesa de encabezado
  page.drawLine({
    start: { x: marginX, y },
    end: { x: marginX + contentWidth, y },
    thickness: 1.5,
    color: colorInk,
  });

  y -= 22;

  // ==========================================
  // 2. Destinatario (Cliente) y Metadatos de Actividad
  // ==========================================

  // Para: Cliente
  page.drawText('Para', {
    x: marginX,
    y,
    size: 8.5,
    font: fontRegular,
    color: colorMuted,
  });

  page.drawText(sanitizeText(data.client.name), {
    x: marginX,
    y: y - 14,
    size: 11,
    font: fontBold,
    color: colorInk,
  });

  const clientContact = [data.client.phone, data.client.email].filter(Boolean).join('  ·  ');
  if (clientContact) {
    page.drawText(sanitizeText(clientContact), {
      x: marginX,
      y: y - 27,
      size: 9,
      font: fontRegular,
      color: colorSubtle,
    });
  }

  // Lado derecho: Fecha y categoría
  page.drawText('Fecha de la actividad', {
    x: marginX + contentWidth - 160,
    y,
    size: 8.5,
    font: fontRegular,
    color: colorMuted,
  });

  page.drawText(formatDateEs(data.activity.date), {
    x: marginX + contentWidth - 160,
    y: y - 14,
    size: 11,
    font: fontBold,
    color: colorInk,
  });

  const actTypeLabel = data.activity.type === 'service' ? 'Servicio' : 'Venta';
  page.drawText(sanitizeText(`${actTypeLabel}  ·  ${data.activity.category_name}`), {
    x: marginX + contentWidth - 160,
    y: y - 27,
    size: 9,
    font: fontRegular,
    color: colorSubtle,
  });

  y -= 42;

  // Línea separadora
  page.drawLine({
    start: { x: marginX, y },
    end: { x: marginX + contentWidth, y },
    thickness: 0.5,
    color: colorRule,
  });

  y -= 18;

  // ==========================================
  // 3. Título y Descripción Libre (Multilínea)
  // ==========================================

  checkPageBreak(60);

  page.drawText(sanitizeText(data.activity.title), {
    x: marginX,
    y,
    size: 13,
    font: fontBold,
    color: colorInk,
  });

  y -= 16;

  if (data.activity.description && data.activity.description.trim()) {
    const descLines = wrapText(data.activity.description, contentWidth, fontRegular, 9.5);
    for (const line of descLines) {
      checkPageBreak(16);
      page.drawText(sanitizeText(line), {
        x: marginX,
        y,
        size: 9.5,
        font: fontRegular,
        color: colorSubtle,
      });
      y -= 13;
    }
  }

  y -= 10;

  // ==========================================
  // 4. Desglose Financiero (Caja Resumen)
  // ==========================================

  checkPageBreak(90);

  const boxHeight = 72;
  page.drawRectangle({
    x: marginX,
    y: y - boxHeight,
    width: contentWidth,
    height: boxHeight,
    borderColor: colorRule,
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });

  // Fila 1: Valor total
  page.drawText('Valor total acordado', {
    x: marginX + 14,
    y: y - 18,
    size: 9.5,
    font: fontRegular,
    color: colorSubtle,
  });
  const valTotalStr = formatCop(data.activity.total_value);
  const valTotalW = fontBold.widthOfTextAtSize(valTotalStr, 10.5);
  page.drawText(valTotalStr, {
    x: marginX + contentWidth - 14 - valTotalW,
    y: y - 18,
    size: 10.5,
    font: fontBold,
    color: colorInk,
  });

  // Fila 2: Dinero recibido
  page.drawText('Dinero recibido (Abonos acumulados)', {
    x: marginX + 14,
    y: y - 34,
    size: 9.5,
    font: fontRegular,
    color: colorSubtle,
  });
  const valRecStr = formatCop(data.activity.total_received);
  const valRecW = fontBold.widthOfTextAtSize(valRecStr, 10.5);
  page.drawText(valRecStr, {
    x: marginX + contentWidth - 14 - valRecW,
    y: y - 34,
    size: 10.5,
    font: fontBold,
    color: colorReceived,
  });

  // Línea divisoria interna
  page.drawLine({
    start: { x: marginX + 10, y: y - 44 },
    end: { x: marginX + contentWidth - 10, y: y - 44 },
    thickness: 0.5,
    color: colorRule,
  });

  // Fila 3: Saldo pendiente
  page.drawText('Saldo pendiente', {
    x: marginX + 14,
    y: y - 60,
    size: 10.5,
    font: fontBold,
    color: colorInk,
  });
  const valPendStr = formatCop(data.activity.balance_pending);
  const valPendW = fontBold.widthOfTextAtSize(valPendStr, 13);
  page.drawText(valPendStr, {
    x: marginX + contentWidth - 14 - valPendW,
    y: y - 60,
    size: 13,
    font: fontBold,
    color: data.activity.balance_pending > 0 ? colorOwed : colorMuted,
  });

  y -= boxHeight + 20;

  // ==========================================
  // 5. Historial de Abonos Realizados
  // ==========================================

  checkPageBreak(70);

  page.drawText('Abonos registrados', {
    x: marginX,
    y,
    size: 10,
    font: fontBold,
    color: colorInk,
  });

  y -= 14;

  if (data.payments.length === 0) {
    page.drawText('No se han registrado abonos para esta actividad.', {
      x: marginX,
      y,
      size: 9,
      font: fontRegular,
      color: colorMuted,
    });
    y -= 16;
  } else {
    // Encabezado de tabla de pagos
    page.drawLine({
      start: { x: marginX, y },
      end: { x: marginX + contentWidth, y },
      thickness: 0.5,
      color: colorRule,
    });

    y -= 12;

    page.drawText('Fecha', { x: marginX, y, size: 8.5, font: fontBold, color: colorMuted });
    page.drawText('Método', { x: marginX + 100, y, size: 8.5, font: fontBold, color: colorMuted });
    page.drawText('Detalle / Comprobante', { x: marginX + 220, y, size: 8.5, font: fontBold, color: colorMuted });
    page.drawText('Monto', { x: marginX + contentWidth - 70, y, size: 8.5, font: fontBold, color: colorMuted });

    y -= 8;

    page.drawLine({
      start: { x: marginX, y },
      end: { x: marginX + contentWidth, y },
      thickness: 0.5,
      color: colorRule,
    });

    y -= 14;

    for (const payment of data.payments) {
      checkPageBreak(22);

      page.drawText(formatDateEs(payment.date), {
        x: marginX,
        y,
        size: 9,
        font: fontRegular,
        color: colorInk,
      });

      const methodLabel = PAYMENT_METHOD_LABELS[payment.method] || payment.method;
      page.drawText(sanitizeText(methodLabel), {
        x: marginX + 100,
        y,
        size: 9,
        font: fontRegular,
        color: colorSubtle,
      });

      const noteText = payment.notes ? payment.notes.slice(0, 32) : '—';
      page.drawText(sanitizeText(noteText), {
        x: marginX + 220,
        y,
        size: 8.5,
        font: fontRegular,
        color: colorMuted,
      });

      const amtStr = formatCop(payment.amount);
      const amtW = fontBold.widthOfTextAtSize(amtStr, 9);
      page.drawText(amtStr, {
        x: marginX + contentWidth - amtW,
        y,
        size: 9,
        font: fontBold,
        color: colorInk,
      });

      y -= 14;
    }

    // Pie de tabla de pagos
    page.drawLine({
      start: { x: marginX, y: y + 4 },
      end: { x: marginX + contentWidth, y: y + 4 },
      thickness: 1,
      color: colorInk,
    });

    page.drawText('Total pagado', {
      x: marginX,
      y: y - 8,
      size: 9.5,
      font: fontBold,
      color: colorInk,
    });

    const totRecStr = formatCop(data.activity.total_received);
    const totRecW = fontBold.widthOfTextAtSize(totRecStr, 9.5);
    page.drawText(totRecStr, {
      x: marginX + contentWidth - totRecW,
      y: y - 8,
      size: 9.5,
      font: fontBold,
      color: colorInk,
    });

    y -= 24;
  }

  // ==========================================
  // 6. Observaciones Públicas
  // ==========================================

  if (data.activity.public_notes && data.activity.public_notes.trim()) {
    checkPageBreak(50);

    page.drawText('Observaciones', {
      x: marginX,
      y,
      size: 9.5,
      font: fontBold,
      color: colorInk,
    });

    y -= 12;

    const obsLines = wrapText(data.activity.public_notes, contentWidth, fontRegular, 8.5);
    for (const line of obsLines) {
      checkPageBreak(14);
      page.drawText(sanitizeText(line), {
        x: marginX,
        y,
        size: 8.5,
        font: fontRegular,
        color: colorSubtle,
      });
      y -= 11;
    }

    y -= 10;
  }

  // ==========================================
  // 7. Instrucciones de Pago
  // ==========================================

  if (data.issuer.payment_instructions && data.issuer.payment_instructions.trim()) {
    checkPageBreak(55);

    const instLines = wrapText(data.issuer.payment_instructions, contentWidth - 20, fontRegular, 8.5);
    const instBoxHeight = Math.max(38, instLines.length * 12 + 22);

    page.drawRectangle({
      x: marginX,
      y: y - instBoxHeight,
      width: contentWidth,
      height: instBoxHeight,
      color: colorPanel,
      borderColor: colorRule,
      borderWidth: 0.5,
    });

    page.drawText('Instrucciones y formas de pago', {
      x: marginX + 10,
      y: y - 14,
      size: 8.5,
      font: fontBold,
      color: colorInk,
    });

    let lineY = y - 26;
    for (const line of instLines) {
      page.drawText(sanitizeText(line), {
        x: marginX + 10,
        y: lineY,
        size: 8.5,
        font: fontRegular,
        color: colorSubtle,
      });
      lineY -= 11;
    }

    y -= instBoxHeight + 16;
  }

  // Dibujar pie en la última página
  drawFooter(page, true);

  return pdfDoc.save();
}

/**
 * Dispara la descarga del PDF en el navegador para compartir manualmente por WhatsApp.
 */
export function downloadPdfBlob(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
