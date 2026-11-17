import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ActivityPdfData } from '@/types';
import { formatCop, formatDateEs, formatReferenceCode } from '@/theme/format';
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
 * Decodifica una cadena Base64 a bytes binarios Uint8Array compatible con navegador y Node.js.
 */
function decodeBase64(base64: string): Uint8Array {
  const clean = base64.replace(/\s/g, '');
  if (typeof atob === 'function') {
    const binary = atob(clean);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  const globalBuffer = (globalThis as unknown as { Buffer?: { from: (s: string, enc: string) => Uint8Array } }).Buffer;
  if (globalBuffer) {
    return new Uint8Array(globalBuffer.from(clean, 'base64'));
  }
  return new Uint8Array(0);
}

/**
 * Intenta rasterizar una URL de imagen a bytes PNG mediante un elemento Canvas del navegador.
 * Permite compatibilidad con URLs remotas y formatos modernos (WebP, SVG) en el cliente.
 */
function rasterizeUrlViaCanvas(url: string): Promise<Uint8Array | null> {
  if (typeof document === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const commaIdx = dataUrl.indexOf(',');
        if (commaIdx !== -1) {
          resolve(decodeBase64(dataUrl.slice(commaIdx + 1)));
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Carga e incrusta el logo del emisor (URL o Base64) en pdf-lib. Si falla o no está presente,
 * retorna null para permitir el monograma de respaldo.
 */
async function loadLogoImage(pdfDoc: PDFDocument, logoSrc: string | undefined) {
  if (!logoSrc || !logoSrc.trim()) return null;
  const raw = logoSrc.trim();

  try {
    let bytes: Uint8Array | null = null;

    if (raw.startsWith('data:')) {
      const commaIdx = raw.indexOf(',');
      if (commaIdx !== -1) {
        bytes = decodeBase64(raw.slice(commaIdx + 1));
      }
    } else if (raw.startsWith('http://') || raw.startsWith('https://')) {
      // 1. Intentar fetch directo (rápido si el servidor tiene cabeceras CORS)
      if (typeof fetch === 'function') {
        try {
          const resp = await fetch(raw);
          if (resp.ok) {
            const buffer = await resp.arrayBuffer();
            bytes = new Uint8Array(buffer);
          }
        } catch {
          // Ignorar fallo de CORS/red
        }
      }
      // 2. Si fetch directo falló por CORS, usar proxy público de imágenes con CORS abierto (convierte además WebP/SVG a PNG)
      if (!bytes || bytes.length === 0) {
        if (typeof fetch === 'function') {
          try {
            const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(raw)}&output=png`;
            const resp = await fetch(proxyUrl);
            if (resp.ok) {
              const buffer = await resp.arrayBuffer();
              bytes = new Uint8Array(buffer);
            }
          } catch {
            // Ignorar
          }
        }
      }
      // 3. Respaldo final por Canvas en el navegador
      if ((!bytes || bytes.length === 0) && typeof document !== 'undefined') {
        bytes = await rasterizeUrlViaCanvas(raw);
      }
    } else if (/^[A-Za-z0-9+/=]+$/.test(raw) && raw.length > 50) {
      bytes = decodeBase64(raw);
    }

    if (!bytes || bytes.length === 0) return null;

    // Detectar PNG por magic bytes: 0x89 0x50 0x4E 0x47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return await pdfDoc.embedPng(bytes);
    }
    // Detectar JPEG por magic bytes: 0xFF 0xD8
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
      return await pdfDoc.embedJpg(bytes);
    }

    try {
      return await pdfDoc.embedPng(bytes);
    } catch {
      return await pdfDoc.embedJpg(bytes);
    }
  } catch {
    return null;
  }
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

  // Código de referencia legible y formateado (sin prefijos crudos de BD desbordados)
  const displayRefCode = formatReferenceCode(data.reference_code, data.activity.date);

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
    const footerY = 38;
    targetPage.drawLine({
      start: { x: marginX, y: footerY + 22 },
      end: { x: marginX + contentWidth, y: footerY + 22 },
      thickness: 1.5,
      color: colorInk,
    });

    const disclaimer = 'Este documento resume un servicio prestado y los pagos recibidos. No es una factura.';
    targetPage.drawText(sanitizeText(disclaimer), {
      x: marginX,
      y: footerY + 8,
      size: 8,
      font: fontRegular,
      color: colorMuted,
    });

    const info = `Comprobante generado el ${formatDateEs(data.generation_date)} · ${
      data.issuer.business_name || data.issuer.name
    }`;
    targetPage.drawText(sanitizeText(info), {
      x: marginX,
      y: footerY - 5,
      size: 8,
      font: fontRegular,
      color: colorMuted,
    });

    if (!isLast) {
      const contStr = '(Continúa en la siguiente página)';
      const contW = fontBold.widthOfTextAtSize(contStr, 8);
      targetPage.drawText(contStr, {
        x: marginX + contentWidth - contW,
        y: footerY - 5,
        size: 8,
        font: fontBold,
        color: colorMuted,
      });
    }
  };

  const drawContinuationHeader = (targetPage: typeof page) => {
    targetPage.drawText(sanitizeText(`${displayRefCode} — ${data.activity.title}`), {
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

  // ==========================================
  // 1. Encabezado Principal (Fila superior: Logo a la izquierda, Referencia a la derecha)
  // ==========================================

  let logoRendered = false;

  if (data.issuer.logo) {
    const logoImg = await loadLogoImage(pdfDoc, data.issuer.logo);
    if (logoImg) {
      // Soporte flexible para logos horizontales o cuadrados (hasta 180 pt de ancho x 42 pt de alto)
      const maxW = 180;
      const maxH = 42;
      const scale = Math.min(maxW / logoImg.width, maxH / logoImg.height);
      const imgW = logoImg.width * scale;
      const imgH = logoImg.height * scale;
      const imgX = marginX;
      // Centrado vertical respecto al bloque del encabezado (de y - 42 a y)
      const imgY = y - 42 + (42 - imgH) / 2;

      page.drawImage(logoImg, {
        x: imgX,
        y: imgY,
        width: imgW,
        height: imgH,
      });
      logoRendered = true;
    }
  }

  if (!logoRendered) {
    const initials = (data.issuer.name || 'DJ')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');

    page.drawRectangle({
      x: marginX,
      y: y - 38,
      width: 38,
      height: 38,
      color: colorInk,
    });

    const initW = fontBold.widthOfTextAtSize(initials, 14);
    page.drawText(initials, {
      x: marginX + (38 - initW) / 2,
      y: y - 25,
      size: 14,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
  }

  // Lado derecho: Tipo de documento y referencia (alineados estrictamente a la derecha)
  const docTypeTitle = data.activity.type === 'service' ? 'Resumen de servicio' : 'Resumen de venta';
  const docTypeW = fontRegular.widthOfTextAtSize(docTypeTitle, 9);
  page.drawText(docTypeTitle, {
    x: marginX + contentWidth - docTypeW,
    y: y - 8,
    size: 9,
    font: fontRegular,
    color: colorMuted,
  });

  let refFontSize = 12;
  let codeW = fontBold.widthOfTextAtSize(displayRefCode, refFontSize);
  if (codeW > 180) {
    refFontSize = 10;
    codeW = fontBold.widthOfTextAtSize(displayRefCode, refFontSize);
  }
  page.drawText(displayRefCode, {
    x: marginX + contentWidth - codeW,
    y: y - 22,
    size: refFontSize,
    font: fontBold,
    color: colorInk,
  });

  const emittedStr = `Emitido el ${formatDateEs(data.generation_date)}`;
  const emittedW = fontRegular.widthOfTextAtSize(emittedStr, 8.5);
  page.drawText(emittedStr, {
    x: marginX + contentWidth - emittedW,
    y: y - 34,
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

  y -= 18;

  // ==========================================
  // 2. Participantes: Emisor (De) y Destinatario (Para)
  // ==========================================

  // Columna Izquierda: Emisor (De)
  page.drawText('De', {
    x: marginX,
    y,
    size: 8.5,
    font: fontRegular,
    color: colorMuted,
  });

  page.drawText(sanitizeText(data.issuer.name || 'Profesional Independiente'), {
    x: marginX,
    y: y - 13,
    size: 10.5,
    font: fontBold,
    color: colorInk,
  });

  let nextIssuerY = y - 25;
  if (data.issuer.business_name) {
    page.drawText(sanitizeText(data.issuer.business_name), {
      x: marginX,
      y: nextIssuerY,
      size: 9,
      font: fontRegular,
      color: colorSubtle,
    });
    nextIssuerY -= 12;
  }

  const issuerContactParts: string[] = [];
  if (data.issuer.phone) issuerContactParts.push(data.issuer.phone);
  if (data.issuer.email) issuerContactParts.push(data.issuer.email);
  if (issuerContactParts.length > 0) {
    page.drawText(sanitizeText(issuerContactParts.join('  ·  ')), {
      x: marginX,
      y: nextIssuerY,
      size: 8.5,
      font: fontRegular,
      color: colorMuted,
    });
  }

  // Columna Derecha: Cliente (Para) y fecha/categoría
  const paraLabel = 'Para';
  const paraLabelW = fontRegular.widthOfTextAtSize(paraLabel, 8.5);
  page.drawText(paraLabel, {
    x: marginX + contentWidth - paraLabelW,
    y,
    size: 8.5,
    font: fontRegular,
    color: colorMuted,
  });

  const clientNameStr = sanitizeText(data.client.name);
  const clientNameW = fontBold.widthOfTextAtSize(clientNameStr, 10.5);
  page.drawText(clientNameStr, {
    x: marginX + contentWidth - clientNameW,
    y: y - 13,
    size: 10.5,
    font: fontBold,
    color: colorInk,
  });

  const clientContact = [data.client.phone, data.client.email].filter(Boolean).join('  ·  ') || '—';
  const clientContactStr = sanitizeText(clientContact);
  const clientContactW = fontRegular.widthOfTextAtSize(clientContactStr, 9);
  page.drawText(clientContactStr, {
    x: marginX + contentWidth - clientContactW,
    y: y - 25,
    size: 9,
    font: fontRegular,
    color: colorSubtle,
  });

  const actTypeLabel = data.activity.type === 'service' ? 'Servicio' : 'Venta';
  const dateCategoryStr = sanitizeText(`${formatDateEs(data.activity.date)}  ·  ${actTypeLabel} · ${data.activity.category_name}`);
  const dateCatW = fontRegular.widthOfTextAtSize(dateCategoryStr, 8.5);
  page.drawText(dateCategoryStr, {
    x: marginX + contentWidth - dateCatW,
    y: y - 37,
    size: 8.5,
    font: fontRegular,
    color: colorMuted,
  });

  y -= 48;

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
  page.drawText('Valor total', {
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
  page.drawText('Dinero recibido', {
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
  const valPendW = fontBold.widthOfTextAtSize(valPendStr, 12);
  page.drawText(valPendStr, {
    x: marginX + contentWidth - 14 - valPendW,
    y: y - 60,
    size: 12,
    font: fontBold,
    color: data.activity.balance_pending > 0 ? colorOwed : colorMuted,
  });

  y -= boxHeight + 20;

  // ==========================================
  // 5. Historial de Abonos Realizados
  // ==========================================

  checkPageBreak(70);

  page.drawText('Abonos realizados', {
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
    y -= 26;
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
    page.drawText('Método', { x: marginX + 110, y, size: 8.5, font: fontBold, color: colorMuted });
    page.drawText('Detalle', { x: marginX + 225, y, size: 8.5, font: fontBold, color: colorMuted });

    const montoHeaderW = fontBold.widthOfTextAtSize('Monto', 8.5);
    page.drawText('Monto', {
      x: marginX + contentWidth - montoHeaderW,
      y,
      size: 8.5,
      font: fontBold,
      color: colorMuted,
    });

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
        x: marginX + 110,
        y,
        size: 9,
        font: fontRegular,
        color: colorSubtle,
      });

      const noteText = payment.notes ? payment.notes.slice(0, 36) : '—';
      page.drawText(sanitizeText(noteText), {
        x: marginX + 225,
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
      thickness: 1.5,
      color: colorInk,
    });

    const totRecY = y - 8;
    page.drawText('Total recibido', {
      x: marginX,
      y: totRecY,
      size: 9.5,
      font: fontBold,
      color: colorInk,
    });

    const totRecStr = formatCop(data.activity.total_received);
    const totRecW = fontBold.widthOfTextAtSize(totRecStr, 9.5);
    page.drawText(totRecStr, {
      x: marginX + contentWidth - totRecW,
      y: totRecY,
      size: 9.5,
      font: fontBold,
      color: colorInk,
    });

    // Separación suficiente entre el total recibido y la siguiente sección (observaciones / formas de pago)
    y = totRecY - 30;
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

    const instLines = wrapText(data.issuer.payment_instructions, contentWidth - 24, fontRegular, 8.5);
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

    page.drawText('Formas de pago', {
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
