import * as XLSX from 'xlsx';

export interface ImportRow {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  classNames: string;
  pagado?: boolean; // true = payment already collected (cash/transfer), skip in-app payment prompt
}

export interface ClassRow {
  name: string;
  price?: number;
  priceType?: 'MENSUAL' | 'UNICO';
  startDate?: string;
  teacherEmail?: string;
  description?: string;
  university?: string;
  carrera?: string;
  maxStudents?: number;
  whatsappGroupLink?: string;
}

export interface ImportResult {
  row: number;
  email: string;
  role: string;
  status: 'created' | 'skipped' | 'error';
  message: string;
  tempPassword?: string;
}

export interface ImportSummary {
  created: number;
  skipped: number;
  errors: number;
  total: number;
  classesCreated: number;
  classesUnmatched: number;
  classResults?: { name: string; status: 'created' | 'existed' | 'error'; message?: string }[];
  results: ImportResult[];
}

export function normalizeRows(rows: Record<string, unknown>[]): ImportRow[] {
  if (rows.length === 0) return [];
  const raw = rows[0];
  const keys = Object.keys(raw).map(k => k.toLowerCase().trim().replace(/\s*\(opcional\)/gi, '').trim());
  const find = (...names: string[]) => keys.findIndex(k => names.includes(k));

  const emailIdx = find('email');
  const firstIdx = find('firstname', 'nombre');
  const lastIdx = find('lastname', 'apellido', 'apellidos');
  const roleIdx = find('role', 'rol');
  const classIdx = find('classes', 'clases', 'classnames', 'asignaturas', 'asignatura');
  const pagadoIdx = find('pagado', 'paid', 'pago recibido', 'ya pagado', 'ya_pagado');

  if (emailIdx === -1 || firstIdx === -1 || lastIdx === -1) return [];

  const TRUTHY = ['true', 'sí', 'si', '1', 'yes', 'x'];
  const origKeys = Object.keys(raw);
  return rows.map(row => ({
    email: String(row[origKeys[emailIdx]] ?? '').trim(),
    firstName: String(row[origKeys[firstIdx]] ?? '').trim(),
    lastName: String(row[origKeys[lastIdx]] ?? '').trim(),
    role: roleIdx !== -1 ? String(row[origKeys[roleIdx]] ?? 'STUDENT').trim() : 'STUDENT',
    classNames: classIdx !== -1 ? String(row[origKeys[classIdx]] ?? '').trim() : '',
    pagado: pagadoIdx !== -1 ? TRUTHY.includes(String(row[origKeys[pagadoIdx]] ?? '').toLowerCase().trim()) : false,
  })).filter(r => r.email);
}

export function parseCSV(text: string): ImportRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s*\(opcional\)/gi, '').trim());
  const emailIdx = header.findIndex(h => h === 'email');
  const firstIdx = header.findIndex(h => h === 'firstname' || h === 'nombre');
  const lastIdx = header.findIndex(h => h === 'lastname' || h === 'apellido' || h === 'apellidos');
  const roleIdx = header.findIndex(h => h === 'role' || h === 'rol');
  const classIdx = header.findIndex(h => ['classes', 'clases', 'classnames', 'asignaturas', 'asignatura'].includes(h));
  const pagadoIdx = header.findIndex(h => h === 'pagado' || h === 'paid' || h === 'pago recibido' || h === 'ya pagado');

  if (emailIdx === -1 || firstIdx === -1 || lastIdx === -1) return [];

  const TRUTHY = ['true', 'sí', 'si', '1', 'yes', 'x'];
  return lines.slice(1).map(line => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    fields.push(current.trim());

    return {
      email: fields[emailIdx] || '',
      firstName: fields[firstIdx] || '',
      lastName: fields[lastIdx] || '',
      role: roleIdx !== -1 ? (fields[roleIdx] || 'STUDENT') : 'STUDENT',
      classNames: classIdx !== -1 ? (fields[classIdx] || '') : '',
      pagado: pagadoIdx !== -1 ? TRUTHY.includes((fields[pagadoIdx] || '').toLowerCase().trim()) : false,
    };
  }).filter(r => r.email);
}

// Re-export XLSX utilities needed by the modal
export { XLSX };

export function normalizeClassRows(rows: Record<string, unknown>[]): ClassRow[] {
  if (rows.length === 0) return [];
  const raw = rows[0];
  const keys = Object.keys(raw).map(k => k.toLowerCase().trim().replace(/\s*\(opcional\)/gi, '').trim().replace(/\s+/g, ''));
  const find = (...names: string[]) => keys.findIndex(k => names.includes(k));

  const nameIdx = find('nombre', 'name', 'clase', 'class', 'asignatura');
  if (nameIdx === -1) return [];

  const priceIdx = find('precio', 'price');
  const priceTypeIdx = find('tipoprecio', 'pricetype', 'tipo', 'type', 'modalidad');
  const startDateIdx = find('fechainicio', 'startdate', 'inicio', 'start', 'fecha');
  const teacherIdx = find('profesoremail', 'teacheremail', 'emailprofesor', 'emailteacher', 'profesor', 'teacher');
  const descIdx = find('descripcion', 'description', 'desc');
  const universityIdx = find('universidad', 'university');
  const carreraIdx = find('carrera', 'degree', 'programa');
  const maxStudentsIdx = find('maxestudiantes', 'maxstudents', 'maxalumnos', 'capacidad', 'capacity');
  const whatsappIdx = find('whatsapp', 'whatsapplink', 'whatsappgrouplink', 'grupwhatsapp');

  const origKeys = Object.keys(raw);
  return rows.flatMap(row => {
    const name = String(row[origKeys[nameIdx]] ?? '').trim();
    if (!name) return [];
    const priceRaw = priceIdx !== -1 ? parseFloat(String(row[origKeys[priceIdx]] ?? '')) : NaN;
    const priceTypeRaw = priceTypeIdx !== -1 ? String(row[origKeys[priceTypeIdx]] ?? '').trim().toUpperCase() : '';
    const startDateRaw = startDateIdx !== -1 ? String(row[origKeys[startDateIdx]] ?? '').trim() : '';
    const teacherRaw = teacherIdx !== -1 ? String(row[origKeys[teacherIdx]] ?? '').trim().toLowerCase() : '';
    const descRaw = descIdx !== -1 ? String(row[origKeys[descIdx]] ?? '').trim() : '';
    const universityRaw = universityIdx !== -1 ? String(row[origKeys[universityIdx]] ?? '').trim() : '';
    const carreraRaw = carreraIdx !== -1 ? String(row[origKeys[carreraIdx]] ?? '').trim() : '';
    const maxStudentsRaw = maxStudentsIdx !== -1 ? parseInt(String(row[origKeys[maxStudentsIdx]] ?? ''), 10) : NaN;
    const whatsappRaw = whatsappIdx !== -1 ? String(row[origKeys[whatsappIdx]] ?? '').trim() : '';
    return [{
      name,
      price: isNaN(priceRaw) ? undefined : priceRaw,
      priceType: priceTypeRaw === 'MENSUAL' || priceTypeRaw === 'UNICO' ? priceTypeRaw : undefined,
      startDate: startDateRaw || undefined,
      teacherEmail: teacherRaw || undefined,
      description: descRaw || undefined,
      university: universityRaw || undefined,
      carrera: carreraRaw || undefined,
      maxStudents: isNaN(maxStudentsRaw) ? undefined : maxStudentsRaw,
      whatsappGroupLink: whatsappRaw || undefined,
    }];
  });
}
