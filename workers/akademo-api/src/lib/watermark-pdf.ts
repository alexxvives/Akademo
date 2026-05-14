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
  /** User's email address */
  email: string;
  /** Academy name (optional) */
  academyName?: string;
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
  // Note: pdfDoc.isEncrypted may be true for permission-only PDFs (no open password) that
  // Moodle-imported content commonly uses. Since we loaded with ignoreEncryption: true, pdf-lib
  // has already bypassed the encryption dict and CAN modify + save the file. The encryption
  // dict is stripped on save(), so the watermark is applied correctly.
  // We do NOT early-return here — any actual save failures are caught by the caller.

  // Set document title from the original filename (makes browser tab show a readable name
  // instead of the hash-based URL segment).
  if (cfg.fileName) {
    try { pdfDoc.setTitle(cfg.fileName.replace(/\.[^.]+$/, '')); } catch { /* ignore */ }
  }

  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const line1 = winAnsi(cfg.email);
  // Academy label: "ACADEMIA [NAME]" in uppercase, preserving accented chars (within Latin-1)
  const line2 = cfg.academyName
    ? winAnsi('ACADEMIA ' + cfg.academyName.toUpperCase())
    : '';

  const textColor = rgb(0.55, 0.55, 0.55);
  const textOpacity = 0.40;
  // cos/sin of 45° — used for projecting text positions
  const SQ = Math.SQRT1_2;

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();

    // Base font sizes relative to the shorter page dimension
    const shorter = Math.min(width, height);
    const size1Base = Math.max(28, shorter * 0.13);
    const size2Base = size1Base * 0.62;

    const cx = width / 2;
    const cy = height / 2;

    // Perpendicular spacing between lines (only used when both lines present)
    const lineSpacing = size1Base * 0.75;

    // Max safe text width for a line visually centred at (px, py):
    // The text extends ±w/2 along the diagonal (each axis ±w*SQ/2), so it must fit.
    const safeFor = (px: number, py: number) =>
      Math.min(2 * px, 2 * (width - px), 2 * py, 2 * (height - py)) / SQ * 0.95;

    const fittedSize = (text: string, font: typeof fontBold, base: number, px: number, py: number): number => {
      if (!text) return base;
      const w = font.widthOfTextAtSize(text, base);
      const safe = safeFor(px, py);
      return w > safe ? base * (safe / w) : base;
    };

    // Anchor (x, y) for pdf-lib so that the visual centre of the text lands at page point (px, py).
    // In text-local coords the visual centre ≈ (w/2, size*0.35).
    // After 45° CCW rotation: page offset = (localX*SQ − localY*SQ, localX*SQ + localY*SQ).
    // Solving for the anchor: x = px − w/2*SQ + h*SQ,  y = py − w/2*SQ − h*SQ
    const anchor = (font: typeof fontBold, size: number, text: string, px: number, py: number) => {
      const w = font.widthOfTextAtSize(text, size);
      const h = size * 0.35;
      return { x: px - (w / 2) * SQ + h * SQ, y: py - (w / 2) * SQ - h * SQ };
    };

    const drawAt = (text: string, font: typeof fontBold, size: number, px: number, py: number) => {
      if (!text) return;
      const a = anchor(font, size, text, px, py);
      page.drawText(text, { x: a.x, y: a.y, size, font, color: textColor, opacity: textOpacity, rotate: degrees(45) });
    };

    if (line2) {
      // Two lines: symmetric offset from page centre along the perpendicular direction
      const c1 = { x: cx + lineSpacing * SQ, y: cy - lineSpacing * SQ }; // email  — below diagonal
      const c2 = { x: cx - lineSpacing * SQ, y: cy + lineSpacing * SQ }; // academy — above diagonal
      const size1 = fittedSize(line1, fontNormal, size1Base, c1.x, c1.y);
      const size2 = fittedSize(line2, fontBold,   size2Base, c2.x, c2.y);
      drawAt(line2, fontBold,   size2, c2.x, c2.y);
      drawAt(line1, fontNormal, size1, c1.x, c1.y);
    } else {
      // Single line: visually centred at the exact page centre
      const size1 = fittedSize(line1, fontNormal, size1Base, cx, cy);
      drawAt(line1, fontNormal, size1, cx, cy);
    }
  }

  return pdfDoc.save();
}
