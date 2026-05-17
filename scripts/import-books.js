#!/usr/bin/env node
/**
 * import-books.js
 *
 * Converts Moodle IMSCP books to PDFs and generates SQL for AKADEMO import.
 *
 * Two book types handled:
 *   PRESENTACION  → JPG slides combined into one PDF via pdf-lib
 *   Interactive   → HTML pages rendered to PDF via puppeteer
 *
 * Prerequisites:
 *   npm install --save-dev pdf-lib puppeteer
 *   (basic-ftp, @aws-sdk/client-s3, dotenv already installed)
 *
 * Config (scripts/.env):
 *   FTP_HOST, FTP_USER, FTP_PASS, FTP_SECURE, FTP_MOODLE_DATA_PATH
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *
 * Usage:
 *   node scripts/import-books.js [--client maximo-expo] [--owner-id <user_id>] [--dry-run] [--skip-interactive]
 */

const path    = require('path');
const fs      = require('fs');
const os      = require('os');
const http    = require('http');
const crypto  = require('crypto');

const dotenv  = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const ftp     = require('basic-ftp');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { PDFDocument } = require('pdf-lib');

// ── Config ──────────────────────────────────────────────────────────────────

const CLIENT       = process.argv.includes('--client')
  ? process.argv[process.argv.indexOf('--client') + 1] : 'maximo-expo';
const DRY_RUN      = process.argv.includes('--dry-run');
const SKIP_INTERACTIVE  = process.argv.includes('--skip-interactive');
const REDO_INTERACTIVE  = process.argv.includes('--redo-interactive');
const OWNER_ID_ARG = process.argv.includes('--owner-id')
  ? process.argv[process.argv.indexOf('--owner-id') + 1] : null;

const BOOKS_CSV    = path.join(__dirname, '..', 'docs', 'onboarding', CLIENT, 'files', 'moodle_books.csv');
const OUTPUT_SQL   = path.join(__dirname, '..', 'docs', 'onboarding', CLIENT, 'files', 'import-books.sql');
const PROGRESS_FILE= path.join(__dirname, '..', 'docs', 'onboarding', CLIENT, 'files', 'books-progress.json');
const TEMP_DIR     = path.join(os.tmpdir(), `akademo-books-${CLIENT}`);

const FTP_HOST     = process.env.FTP_HOST;
const FTP_USER     = process.env.FTP_USER;
const FTP_PASS     = process.env.FTP_PASS;
const FTP_SECURE   = process.env.FTP_SECURE === '1';
const FTP_DATA_PATH= process.env.FTP_MOODLE_DATA_PATH || '';
const R2_ACCOUNT   = process.env.R2_ACCOUNT_ID;
const R2_KEY       = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET    = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET    = process.env.R2_BUCKET || 'akademo-storage';
const OWNER_ID     = OWNER_ID_ARG || process.env.BOOKS_OWNER_ID;

if (!FTP_HOST || !FTP_USER || !FTP_PASS) { console.error('Missing FTP creds in scripts/.env'); process.exit(1); }
if (!R2_ACCOUNT || !R2_KEY || !R2_SECRET) { console.error('Missing R2 creds in scripts/.env'); process.exit(1); }
if (!OWNER_ID) { console.error('Missing --owner-id argument (User.id of the academy owner)'); process.exit(1); }

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_KEY, secretAccessKey: R2_SECRET },
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  const rows = [];
  for (const line of lines.slice(1)) { // skip header
    const fields = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
      else if (ch === ',' && !inQ) { fields.push(cur); cur = ''; }
      else cur += ch;
    }
    fields.push(cur);
    if (fields.length >= 7) rows.push({
      book_title: fields[0], course: fields[1], section_num: fields[2],
      section_name: fields[3], filename: fields[4], filesize: parseInt(fields[5]),
      file_path: fields[6], visible: fields[7],
    });
  }
  return rows;
}

function parseTopicOrder(sectionName) {
  const m = sectionName.match(/TEMA\s*(\d+)/i);
  return m ? parseInt(m[1]) : 99;
}

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
    .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/ñ/g,'n')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function shortId(prefix) {
  return prefix + crypto.randomBytes(9).toString('hex');
}

function isPresentacion(bookTitle) {
  return bookTitle.toUpperCase().includes('PRESENTACION');
}

function slideOrder(filename) {
  const m = filename.match(/Diapositiva(\d+)\.jpg$/i);
  return m ? parseInt(m[1]) : 9999;
}

// ── FTP ─────────────────────────────────────────────────────────────────────

async function findMoodleDataDir(client) {
  if (FTP_DATA_PATH) return FTP_DATA_PATH;
  const candidates = ['/moodledata','/public_html/moodledata',
    '/campus.maximoexponente.es/moodledata','/maximoexponente.es/moodledata'];
  for (const c of candidates) {
    try { await client.cd(c + '/filedir'); return c; } catch {}
  }
  console.error('Cannot find moodledata. Set FTP_MOODLE_DATA_PATH in scripts/.env');
  process.exit(1);
}

async function downloadFile(ftpClient, moodleDataDir, filePath, destPath) {
  const remotePath = `${moodleDataDir}/filedir/${filePath}`;
  await ftpClient.downloadTo(destPath, remotePath);
}

// ── PDF generation ──────────────────────────────────────────────────────────

async function buildPresentationPdf(slides) {
  const pdf = await PDFDocument.create();
  const sorted = [...slides].sort((a, b) => slideOrder(a.filename) - slideOrder(b.filename));
  for (const slide of sorted) {
    if (!fs.existsSync(slide.localPath)) continue;
    const bytes = fs.readFileSync(slide.localPath);
    const img   = await pdf.embedJpg(bytes);
    const page  = pdf.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  return Buffer.from(await pdf.save());
}

/**
 * Extracts full-size image paths from an eXe Learning gallery chapter HTML.
 * Returns [] if the chapter has no exeImageGallery.
 */
function parseGalleryImages(htmlContent, bookDir) {
  const galleryMatch = htmlContent.match(/class="exeImageGallery"[\s\S]*?<\/ul>/);
  if (!galleryMatch) return [];
  const images = [];
  const hrefRe = /<a[^>]+href="([^"]+)"[^>]*><img/g;
  let m;
  while ((m = hrefRe.exec(galleryMatch[0])) !== null) {
    const imgRelPath = decodeURIComponent(m[1]);
    const fullPath = path.join(bookDir, imgRelPath);
    if (fs.existsSync(fullPath)) images.push(fullPath);
  }
  return images;
}

/**
 * Extract a human-readable title from an eXe Learning chapter HTML.
 */
function extractChapterTitle(htmlContent, fallback) {
  const h1 = htmlContent.match(/<h1[^>]*id="nodeTitle"[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return h1[1].replace(/<[^>]+>/g, '').trim();
  const title = htmlContent.match(/<title>([\s\S]*?)<\/title>/i);
  if (title) return title[1].trim();
  return fallback;
}

/**
 * Builds one PDF per chapter from an interactive eXe Learning book.
 * Returns an array of { title, slug, pdfBuffer } — one entry per chapter.
 */
async function buildInteractivePdf(htmlFiles, bookDir) {
  // Sort: index.html excluded (nav frame), chapter htmls sorted alphabetically
  const chapters = htmlFiles
    .filter(f => f.filename !== 'index.html' && f.filename.endsWith('.html'))
    .sort((a, b) => a.filename.localeCompare(b.filename));
  if (!chapters.length) chapters.push(...htmlFiles.filter(f => f.filename === 'index.html'));

  // Pre-parse all chapters — classify as gallery vs text, extract title
  const classified = chapters.map(ch => {
    const htmlContent = fs.readFileSync(path.join(bookDir, ch.filename), 'utf8');
    const images = parseGalleryImages(htmlContent, bookDir);
    const title = extractChapterTitle(htmlContent, ch.filename.replace(/\.html?$/i, ''));
    return { chapter: ch, images, title };
  });

  const hasTextChapters = classified.some(c => c.images.length === 0);

  // Only start puppeteer if there are non-gallery (text) chapters
  let browser = null;
  let server = null;
  let port = null;

  if (hasTextChapters) {
    let puppeteer;
    try { puppeteer = require('puppeteer'); } catch {
      console.warn('  ⚠  puppeteer not available — skipping interactive book');
      return null;
    }
    server = http.createServer((req, res) => {
      const filePath = path.join(bookDir, decodeURIComponent(req.url.split('?')[0]));
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mime = { '.html':'text/html','.css':'text/css','.js':'application/javascript',
          '.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.gif':'image/gif',
          '.xml':'application/xml','.woff2':'font/woff2' }[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        fs.createReadStream(filePath).pipe(res);
      } else { res.writeHead(404); res.end(); }
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
    browser = await puppeteer.launch({ headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  }

  const chapterResults = [];
  try {
    for (const { chapter, images, title } of classified) {
      const chSlug = slugify(title) || chapter.filename.replace(/\.html?$/i, '');
      const chapterPdf = await PDFDocument.create();

      if (images.length > 0) {
        // Gallery chapter: embed each full-size image as its own full page
        for (const imgPath of images) {
          const imgBytes = fs.readFileSync(imgPath);
          const ext = path.extname(imgPath).toLowerCase();
          let img;
          try {
            img = (ext === '.png')
              ? await chapterPdf.embedPng(imgBytes)
              : await chapterPdf.embedJpg(imgBytes);
          } catch { continue; } // skip unreadable images

          // Choose page orientation to best fit the image
          const landscape = img.width > img.height;
          const [pw, ph] = landscape ? [842, 595] : [595, 842];
          const margin = 30;
          const scaled = img.scaleToFit(pw - margin * 2, ph - margin * 2);
          const page = chapterPdf.addPage([pw, ph]);
          page.drawImage(img, {
            x: (pw - scaled.width) / 2,
            y: (ph - scaled.height) / 2,
            width: scaled.width,
            height: scaled.height,
          });
        }
      } else {
        // Text/mixed chapter: render HTML with puppeteer
        const url = `http://127.0.0.1:${port}/${chapter.filename}`;
        const pg = await browser.newPage();
        await pg.goto(url, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
        const pdfBytes = await pg.pdf({ format: 'A4', printBackground: true,
          margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } });
        await pg.close();
        const rendered = await PDFDocument.load(pdfBytes);
        const copied = await chapterPdf.copyPages(rendered, rendered.getPageIndices());
        copied.forEach(p => chapterPdf.addPage(p));
      }

      if (chapterPdf.getPageCount() === 0) continue; // skip empty chapters
      chapterResults.push({ title, slug: chSlug, pdfBuffer: Buffer.from(await chapterPdf.save()) });
    }
    return chapterResults; // Array of { title, slug, pdfBuffer }
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(r => server.close(r));
  }
}

// ── R2 upload ────────────────────────────────────────────────────────────────

async function uploadToR2(buffer, r2Key, forceUpload = false) {
  if (DRY_RUN) { console.log(`  [dry-run] would upload ${r2Key} (${buffer.length} bytes)`); return; }
  if (!forceUpload) {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: r2Key }));
      console.log(`  ✓ already in R2: ${r2Key}`);
      return;
    } catch {}
  }
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET, Key: r2Key, Body: buffer, ContentType: 'application/pdf',
  }));
}

// ── SQL generation ───────────────────────────────────────────────────────────

function generateSql(books) {
  // Collect unique sections from books that were successfully processed
  const seenSections = new Set();
  const sections = [];
  for (const b of books) {
    const hasContent = b.r2Key || (b.chapters && b.chapters.length > 0);
    if (b.section_name && hasContent && !seenSections.has(b.section_name)) {
      seenSections.add(b.section_name);
      sections.push({ name: b.section_name, course: b.course, order: parseTopicOrder(b.section_name) });
    }
  }
  sections.sort((a, b) => a.order - b.order);

  const lines = [
    '-- import-books.sql — IMSCP books from Moodle → AKADEMO Documents',
    '-- Generated by scripts/import-books.js',
    '-- Safe to re-run (INSERT OR IGNORE / NOT EXISTS guards).',
    '',
    '-- ── Step 1: Ensure all topics exist ─────────────────────────────────────',
    '',
  ];

  for (const s of sections) {
    lines.push(`INSERT INTO Topic (id, name, classId, orderIndex)`);
    lines.push(`SELECT lower(hex(randomblob(16))), '${s.name.replace(/'/g, "''")}', c.id, ${s.order}`);
    lines.push(`FROM Class c WHERE c.name = '${s.course.replace(/'/g, "''")}' AND NOT EXISTS (`);
    lines.push(`  SELECT 1 FROM Topic WHERE name = '${s.name.replace(/'/g, "''")}' AND classId = c.id);`);
    lines.push('');
  }

  lines.push('-- ── Step 2: Uploads + Lessons + Documents ───────────────────────────────');
  lines.push('');

  for (const b of books) {
    if (b.type === 'interactive' && b.chapters && b.chapters.length > 0) {
      // ── Interactive book: one Document per chapter ────────────────────────
      lines.push(`-- ── ${b.title} (${b.course} / ${b.section_name}) ──────────────────────`);

      // Migration: delete old single-document records if converting from previous format
      if (b.oldDocId) {
        lines.push(`DELETE FROM Document WHERE id = '${b.oldDocId}';`);
        lines.push(`DELETE FROM Upload WHERE id = '${b.oldUploadId}';`);
        lines.push('');
      }

      // Per-chapter uploads
      for (const ch of b.chapters) {
        lines.push(`INSERT OR IGNORE INTO Upload (id, fileName, fileSize, mimeType, storagePath, uploadedById, storageType)`);
        lines.push(`VALUES ('${ch.uploadId}', '${ch.pdfFilename}', ${ch.pdfSize}, 'application/pdf', '${ch.r2Key}', '${OWNER_ID}', 'r2');`);
        lines.push('');
      }

      // Lesson (one per book — unchanged)
      lines.push(`INSERT OR IGNORE INTO Lesson (id, title, classId, topicId, maxWatchTimeMultiplier, watermarkIntervalMins)`);
      lines.push(`SELECT '${b.lessonId}', '${b.title.replace(/'/g, "''")}', c.id, t.id, 2.0, 5`);
      lines.push(`FROM Class c JOIN Topic t ON t.classId = c.id`);
      lines.push(`WHERE c.name = '${b.course.replace(/'/g, "''")}' AND t.name = '${b.section_name.replace(/'/g, "''")}' LIMIT 1;`);
      lines.push('');

      // Per-chapter documents — explicit createdAt ensures chapter order is preserved
      for (const ch of b.chapters) {
        const mm = String(Math.floor(ch.order / 60)).padStart(2, '0');
        const ss = String(ch.order % 60).padStart(2, '0');
        const createdAt = `2024-01-01 00:${mm}:${ss}`;
        lines.push(`INSERT OR IGNORE INTO Document (id, title, lessonId, uploadId, createdAt)`);
        lines.push(`VALUES ('${ch.docId}', '${ch.title.replace(/'/g, "''")}', '${b.lessonId}', '${ch.uploadId}', '${createdAt}');`);
        lines.push('');
      }
    } else {
      // ── Presentation book: single Upload + Document ───────────────────────
      if (!b.r2Key) { lines.push(`-- SKIPPED (no PDF): ${b.title}`); lines.push(''); continue; }
      lines.push(`-- ── ${b.title} (${b.course} / ${b.section_name}) ──────────────────────`);
      lines.push(`INSERT OR IGNORE INTO Upload (id, fileName, fileSize, mimeType, storagePath, uploadedById, storageType)`);
      lines.push(`VALUES ('${b.uploadId}', '${b.pdfFilename}', ${b.pdfSize}, 'application/pdf', '${b.r2Key}', '${OWNER_ID}', 'r2');`);
      lines.push('');
      lines.push(`INSERT OR IGNORE INTO Lesson (id, title, classId, topicId, maxWatchTimeMultiplier, watermarkIntervalMins)`);
      lines.push(`SELECT '${b.lessonId}', '${b.title.replace(/'/g, "''")}', c.id, t.id, 2.0, 5`);
      lines.push(`FROM Class c JOIN Topic t ON t.classId = c.id`);
      lines.push(`WHERE c.name = '${b.course.replace(/'/g, "''")}' AND t.name = '${b.section_name.replace(/'/g, "''")}' LIMIT 1;`);
      lines.push('');
      lines.push(`INSERT OR IGNORE INTO Document (id, title, lessonId, uploadId)`);
      lines.push(`VALUES ('${b.docId}', '${b.title.replace(/'/g, "''")}', '${b.lessonId}', '${b.uploadId}');`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(BOOKS_CSV)) { console.error(`Not found: ${BOOKS_CSV}`); process.exit(1); }
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  // Load progress
  const progress = fs.existsSync(PROGRESS_FILE)
    ? JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')) : {};

  // Parse CSV and group by book
  const rows = parseCsv(fs.readFileSync(BOOKS_CSV, 'utf8'));
  const bookMap = new Map();
  for (const row of rows) {
    if (!bookMap.has(row.book_title)) {
      bookMap.set(row.book_title, { title: row.book_title, course: row.course,
        section_num: row.section_num, section_name: row.section_name, files: [] });
    }
    bookMap.get(row.book_title).files.push(row);
  }

  console.log(`Found ${bookMap.size} books. Processing...\n`);

  // FTP connection
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = false;
  await ftpClient.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: FTP_SECURE });
  const moodleDataDir = await findMoodleDataDir(ftpClient);

  const results = [];

  for (const [bookTitle, book] of bookMap) {
    const slug    = slugify(bookTitle);
    const type    = isPresentacion(bookTitle) ? 'presentation' : 'interactive';
    const pdfName = `${slug}.pdf`;
    const r2Key   = `${CLIENT}/books/${pdfName}`;
    const bookDir = path.join(TEMP_DIR, slug);

    // Check progress — skip if done, unless --redo-interactive for non-presentation books
    const alreadyDone = progress[bookTitle]?.done;
    if (alreadyDone && !(REDO_INTERACTIVE && type !== 'presentation')) {
      console.log(`⏭  Skip (done): ${bookTitle}`);
      results.push(progress[bookTitle]);
      continue;
    }

    if (type === 'interactive' && SKIP_INTERACTIVE) {
      console.log(`⏭  Skip (--skip-interactive): ${bookTitle}`);
      results.push({ title: bookTitle, course: book.course, section_name: book.section_name, r2Key: null });
      continue;
    }

    console.log(`📖 ${bookTitle} [${type}]`);
    fs.mkdirSync(bookDir, { recursive: true });

    // Download files needed for PDF generation
    const neededExts = type === 'presentation'
      ? ['.jpg', '.jpeg']
      : ['.html', '.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.xml', '.woff2', '.woff'];

    const filesToDownload = book.files.filter(f => {
      const ext = path.extname(f.filename).toLowerCase();
      if (!neededExts.includes(ext)) return false;
      // Only skip thumbnails for presentation books (for interactive, Thumbnail.png = visible gallery image)
      if (type === 'presentation' && f.filename.toLowerCase().includes('thumbnail')) return false;
      return true;
    });

    let downloaded = 0;
    for (const file of filesToDownload) {
      const destPath = path.join(bookDir, file.filename);
      if (fs.existsSync(destPath)) { downloaded++; continue; }
      try {
        await downloadFile(ftpClient, moodleDataDir, file.file_path, destPath);
        downloaded++;
      } catch (e) {
        // Some files may not exist in filedir if not actually uploaded
      }
    }
    console.log(`  Downloaded ${downloaded}/${filesToDownload.length} files`);

    // Generate PDF(s)
    let pdfBuffer = null;
    let chapters = null; // for interactive: array of { title, slug, pdfBuffer }
    try {
      if (type === 'presentation') {
        const slides = filesToDownload
          .filter(f => /\.(jpg|jpeg)$/i.test(f.filename) && !/thumbnail/i.test(f.filename))
          .map(f => ({ ...f, localPath: path.join(bookDir, f.filename) }));
        pdfBuffer = await buildPresentationPdf(slides);
      } else {
        const htmlFiles = filesToDownload
          .filter(f => f.filename.endsWith('.html'))
          .map(f => ({ ...f, localPath: path.join(bookDir, f.filename) }));
        chapters = await buildInteractivePdf(htmlFiles, bookDir);
      }
    } catch (e) {
      console.error(`  ✗ PDF error: ${e.message}`);
    }

    // ── Interactive book: upload one PDF per chapter ──────────────────────
    if (type === 'interactive') {
      if (!chapters || chapters.length === 0) {
        console.log(`  ✗ No valid chapters generated — skipping`);
        results.push({ title: bookTitle, course: book.course, section_name: book.section_name, r2Key: null });
        continue;
      }

      // Detect old single-document format in progress (for migration DELETE SQL)
      const existingEntry = progress[bookTitle];
      const isOldFormat = !!(existingEntry?.uploadId && !existingEntry?.chapters);
      const oldUploadId = isOldFormat ? (existingEntry.uploadId || null) : null;
      const oldDocId    = isOldFormat ? (existingEntry.docId    || null) : null;
      const lessonId    = existingEntry?.lessonId || shortId('les_');

      // Build lookup map from previously saved chapter IDs for re-use
      const existingChaptersMap = {};
      if (existingEntry?.chapters) {
        for (const ch of existingEntry.chapters) existingChaptersMap[ch.slug] = ch;
      }

      // Upload each chapter PDF to R2
      const chapterResults = [];
      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        if (!ch.pdfBuffer || ch.pdfBuffer.length < 500) continue;
        const chSlug    = ch.slug;
        const chR2Key   = `${CLIENT}/books/${slug}/${chSlug}.pdf`;
        const chPdfName = `${chSlug}.pdf`;
        const existing  = existingChaptersMap[chSlug] || {};
        const uploadId  = existing.uploadId || shortId('up_');
        const docId     = existing.docId    || shortId('doc_');

        console.log(`    [${i + 1}/${chapters.length}] ${ch.title} (${Math.round(ch.pdfBuffer.length / 1024)}KB)`);
        await uploadToR2(ch.pdfBuffer, chR2Key, REDO_INTERACTIVE);
        chapterResults.push({ title: ch.title, slug: chSlug, r2Key: chR2Key,
          pdfFilename: chPdfName, pdfSize: ch.pdfBuffer.length, uploadId, docId, order: i });
      }

      const entry = {
        title: bookTitle, course: book.course, section_name: book.section_name,
        type: 'interactive', lessonId, chapters: chapterResults,
        oldUploadId, oldDocId, done: true,
      };
      progress[bookTitle] = entry;
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      results.push(entry);
      console.log(`  ✓ Done (${chapterResults.length} chapters)`);
      continue;
    }

    // ── Presentation book: single PDF upload ─────────────────────────────
    if (!pdfBuffer || pdfBuffer.length < 1000) {
      console.log(`  ✗ No valid PDF generated — skipping`);
      results.push({ title: bookTitle, course: book.course, section_name: book.section_name, r2Key: null });
      continue;
    }

    // Upload to R2 — force overwrite when --redo-interactive
    console.log(`  Uploading to R2: ${r2Key} (${Math.round(pdfBuffer.length/1024)}KB)`);
    await uploadToR2(pdfBuffer, r2Key, REDO_INTERACTIVE);

    // Preserve existing IDs (from progress.json or D1) when redoing — don't create duplicates
    const existingEntry = progress[bookTitle];
    const entry = {
      title: bookTitle, course: book.course, section_name: book.section_name,
      r2Key, pdfFilename: pdfName, pdfSize: pdfBuffer.length,
      uploadId: existingEntry?.uploadId || shortId('up_'),
      lessonId: existingEntry?.lessonId || shortId('les_'),
      docId:    existingEntry?.docId    || shortId('doc_'),
      done: true,
    };
    progress[bookTitle] = entry;
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    results.push(entry);
    console.log(`  ✓ Done`);
  }

  ftpClient.close();

  // Write SQL
  const sql = generateSql(results);
  fs.writeFileSync(OUTPUT_SQL, sql, 'utf8');
  const done = results.filter(r => r.r2Key || (r.chapters && r.chapters.length > 0)).length;
  console.log(`\n✅ ${done}/${results.length} books imported`);
  console.log(`📄 SQL written to: ${OUTPUT_SQL}`);
  console.log(`\nNext: npx wrangler d1 execute akademo-db --remote --yes --file="${OUTPUT_SQL}"`);
}

main().catch(e => { console.error(e); process.exit(1); });
