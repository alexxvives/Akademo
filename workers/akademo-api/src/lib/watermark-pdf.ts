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
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const line1 = winAnsi(cfg.fullName);
  const line2 = winAnsi(cfg.email);
  // academyName is intentionally not drawn as text

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
  const textOpacity = 0.2;
  // cos/sin of 45° — used for projecting text positions
  const SQ = Math.SQRT1_2;

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();

    // Font sizes: 14% of the shorter dimension (2× the original 7%)
    const size1 = Math.max(32, Math.min(width, height) * 0.14);
    const size2 = size1 * 0.78;
    // Perpendicular line spacing between the two text rows
    const lineSpacing = size1 * 1.5;

    const cx = width / 2;
    const cy = height / 2;

    // Width of each text line for centering along the 45° baseline
    const w1 = font.widthOfTextAtSize(line1, size1);
    const w2 = font.widthOfTextAtSize(line2, size2);

    // Place the two lines symmetrically around the page center.
    // Line1 shifts towards "above" the diagonal: perpendicular dir (-SQ, +SQ).
    // Line2 shifts towards "below" the diagonal: perpendicular dir (+SQ, -SQ).
    const halfSpacing = lineSpacing / 2;
    const bx1 = cx - halfSpacing * SQ;
    const by1 = cy + halfSpacing * SQ;
    const bx2 = cx + halfSpacing * SQ;
    const by2 = cy - halfSpacing * SQ;

    // Text draw origin = block center minus half-projected text width
    page.drawText(line1, {
      x: bx1 - (w1 / 2) * SQ,
      y: by1 - (w1 / 2) * SQ,
      size: size1,
      font,
      color: textColor,
      opacity: textOpacity,
      rotate: degrees(45),
    });

    page.drawText(line2, {
      x: bx2 - (w2 / 2) * SQ,
      y: by2 - (w2 / 2) * SQ,
      size: size2,
      font,
      color: textColor,
      opacity: textOpacity,
      rotate: degrees(45),
    });

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
