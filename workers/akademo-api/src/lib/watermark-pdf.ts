import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import type { D1Database } from '@cloudflare/workers-types';
import type { SessionUser } from '../lib/auth';

/** Skip watermarking for PDFs larger than this (memory guard for CF Workers). */
export const PDF_WATERMARK_SIZE_LIMIT = 15 * 1024 * 1024; // 15 MB

export interface AcademyInfo {
  name: string;
  logoUrl: string | null;
}

/** Replace non-WinAnsi (Latin-1) characters so pdf-lib's Helvetica doesn't throw. */
function winAnsi(text: string): string {
  return text.replace(/[^\u0000-\u00FF]/g, '?');
}

/** Fetch the academy name + logoUrl for the given session user. */
export async function getAcademyInfoForSession(
  db: D1Database,
  session: SessionUser,
): Promise<AcademyInfo | null> {
  try {
    if (session.role === 'STUDENT') {
      return await db
        .prepare(
          `SELECT a.name, a.logoUrl FROM Academy a
           JOIN Class c ON c.academyId = a.id
           JOIN ClassEnrollment e ON e.classId = c.id
           WHERE e.userId = ? AND e.status = 'APPROVED'
           LIMIT 1`,
        )
        .bind(session.id)
        .first<AcademyInfo>();
    }
    if (session.role === 'TEACHER') {
      return await db
        .prepare(
          `SELECT a.name, a.logoUrl FROM Academy a
           JOIN Teacher t ON t.academyId = a.id
           WHERE t.userId = ?
           LIMIT 1`,
        )
        .bind(session.id)
        .first<AcademyInfo>();
    }
    if (session.role === 'ACADEMY') {
      return await db
        .prepare(`SELECT name, logoUrl FROM Academy WHERE ownerId = ? LIMIT 1`)
        .bind(session.id)
        .first<AcademyInfo>();
    }
    return null;
  } catch {
    return null;
  }
}

export interface WatermarkConfig {
  /** User's full name, e.g. "Juan García López" */
  fullName: string;
  /** User's email address */
  email: string;
  /** Academy name (optional) */
  academyName?: string;
  /** Raw bytes of the academy logo (PNG or JPEG) */
  logoBytes?: ArrayBuffer;
  /** MIME type of the logo: 'image/png' | 'image/jpeg' */
  logoMime?: string;
  /** Original filename — used to set the PDF document title so browsers show a readable tab title */
  fileName?: string;
}

/**
 * Stamp a single large diagonal watermark on every page of a PDF (centered).
 * Returns the modified bytes, or the original bytes if processing fails.
 */
export async function addWatermarkToPdf(
  pdfBytes: ArrayBuffer,
  cfg: WatermarkConfig,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  // If the PDF is password-protected we cannot write to it — return original bytes untouched.
  if (pdfDoc.isEncrypted) {
    return new Uint8Array(pdfBytes);
  }

  // Set document title from the original filename (makes browser tab show a readable name
  // instead of the hash-based URL segment).
  if (cfg.fileName) {
    try { pdfDoc.setTitle(cfg.fileName.replace(/\.[^.]+$/, '')); } catch { /* ignore */ }
  }

  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const line1 = winAnsi(cfg.fullName);
  const line2 = winAnsi(cfg.email);
  // Academy label: "ACADEMIA [NAME]" in uppercase, preserving accented chars (within Latin-1)
  const line3 = cfg.academyName
    ? winAnsi('ACADEMIA ' + cfg.academyName.toUpperCase())
    : '';

  // Embed logo once for the whole document (reused per page)
  let logo: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  if (cfg.logoBytes) {
    try {
      const mime = cfg.logoMime ?? '';
      if (mime.includes('png')) {
        logo = await pdfDoc.embedPng(cfg.logoBytes);
      } else if (mime.includes('jpeg') || mime.includes('jpg')) {
        logo = await pdfDoc.embedJpg(cfg.logoBytes);
      }
    } catch {
      // Skip logo if embedding fails (unsupported format, corrupt image, etc.)
    }
  }

  const textColor = rgb(0.55, 0.55, 0.55);
  const textOpacity = 0.40;
  // cos/sin of 45° — used for projecting text positions
  const SQ = Math.SQRT1_2;

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();

    // Base font sizes relative to the shorter page dimension
    const shorter = Math.min(width, height);
    const size1Base = Math.max(28, shorter * 0.13);
    const size2Base = size1Base * 0.78;
    const size3Base = size1Base * 0.62;

    // Perpendicular spacing between the three rows
    const lineSpacing = size1Base * 1.35;

    const cx = width / 2;
    const cy = height / 2;

    // Pre-compute the center (bx, by) for each line along the perpendicular to the 45° axis.
    // Perpendicular direction to (SQ, SQ) is (-SQ, +SQ).
    //   line3 (academy) → +lineSpacing offset (above diagonal)
    //   line1 (name)    → 0 offset (on diagonal)
    //   line2 (email)   → -lineSpacing offset (below diagonal)
    const bx1 = cx,                    by1 = cy;                     // name — middle
    const bx2 = cx + lineSpacing * SQ, by2 = cy - lineSpacing * SQ; // email — below
    const bx3 = cx - lineSpacing * SQ, by3 = cy + lineSpacing * SQ; // academy — above

    // Max safe text width for a line centred at (bx, by): the text extends ±w/2 in both
    // x and y (at 45°), so it must not exceed 2 * min(bx, width-bx, by, height-by) / SQ.
    // Apply a 5% safety margin so text never grazes the edge.
    const safeFor = (bx: number, by: number) =>
      Math.min(2 * bx, 2 * (width - bx), 2 * by, 2 * (height - by)) / SQ * 0.95;

    const fitted = (text: string, font: typeof fontBold, base: number, bx: number, by: number): number => {
      if (!text) return base;
      const w = font.widthOfTextAtSize(text, base);
      const safe = safeFor(bx, by);
      return w > safe ? base * (safe / w) : base;
    };

    const size1 = fitted(line1, fontBold,   size1Base, bx1, by1);
    const size2 = fitted(line2, fontNormal, size2Base, bx2, by2);
    const size3 = fitted(line3, fontBold,   size3Base, bx3, by3);

    // Width of each text line for centering along the 45° baseline
    const w1 = fontBold.widthOfTextAtSize(line1, size1);
    const w2 = fontNormal.widthOfTextAtSize(line2, size2);
    const w3 = line3 ? fontBold.widthOfTextAtSize(line3, size3) : 0;

    const drawLine = (
      text: string,
      font: typeof fontBold,
      size: number,
      textWidth: number,
      bx: number,
      by: number,
    ) => {
      if (!text) return;
      // pdf-lib draws text from the baseline start (bottom-left). For 45° text the
      // visual center sits ~0.35*size ABOVE the baseline in text-local space.
      // After rotation that shift maps to direction (-SQ, +SQ) in page space.
      // To land the VISUAL center at (bx, by) we add the inverse offset (+SQ, -SQ).
      const halfH = size * 0.35;
      page.drawText(text, {
        x: bx - (textWidth / 2) * SQ + halfH * SQ,
        y: by - (textWidth / 2) * SQ - halfH * SQ,
        size,
        font,
        color: textColor,
        opacity: textOpacity,
        rotate: degrees(45),
      });
    };

    drawLine(line3, fontBold,   size3, w3, bx3, by3);   // academy — above
    drawLine(line1, fontBold,   size1, w1, bx1, by1);   // name    — middle
    drawLine(line2, fontNormal, size2, w2, bx2, by2);   // email   — below

    // Academy logo: top-left corner, semi-transparent
    if (logo) {
      const maxSide = Math.min(width, height) * 0.11;
      const scale = Math.min(maxSide / logo.width, maxSide / logo.height);
      const lw = logo.width * scale;
      const lh = logo.height * scale;
      const margin = 10;
      page.drawImage(logo, {
        x: margin,
        y: height - lh - margin,
        width: lw,
        height: lh,
        opacity: 0.35,
      });
    }
  }

  return pdfDoc.save();
}
