import * as XLSX from 'xlsx';

export interface ImportRow {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  classNames: string;
}

export interface ClassRow {
  name: string;
  monthlyPrice?: number;
  oneTimePrice?: number;
}

export interface ImportResult {
  row: number;
  email: string;
  status: 'created' | 'skipped' | 'error';
  message: string;
  tempPassword?: string;
}

export interface ImportSummary {
  created: number;
  skipped: number;
  errors: number;
  total: number;
  results: ImportResult[];
}

export function normalizeRows(rows: Record<string, unknown>[]): ImportRow[] {
  if (rows.length === 0) return [];
  const raw = rows[0];
  const keys = Object.keys(raw).map(k => k.toLowerCase().trim());
  const find = (...names: string[]) => keys.findIndex(k => names.includes(k));

  const emailIdx = find('email');
  const firstIdx = find('firstname', 'nombre');
  const lastIdx = find('lastname', 'apellido', 'apellidos');
  const roleIdx = find('role', 'rol');
  const classIdx = find('classes', 'clases', 'classnames');

  if (emailIdx === -1 || firstIdx === -1 || lastIdx === -1) return [];

  const origKeys = Object.keys(raw);
  return rows.map(row => ({
    email: String(row[origKeys[emailIdx]] ?? '').trim(),
    firstName: String(row[origKeys[firstIdx]] ?? '').trim(),
    lastName: String(row[origKeys[lastIdx]] ?? '').trim(),
    role: roleIdx !== -1 ? String(row[origKeys[roleIdx]] ?? 'STUDENT').trim() : 'STUDENT',
    classNames: classIdx !== -1 ? String(row[origKeys[classIdx]] ?? '').trim() : '',
  })).filter(r => r.email);
}

export function parseCSV(text: string): ImportRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const emailIdx = header.findIndex(h => h === 'email');
  const firstIdx = header.findIndex(h => h === 'firstname' || h === 'nombre');
  const lastIdx = header.findIndex(h => h === 'lastname' || h === 'apellido' || h === 'apellidos');
  const roleIdx = header.findIndex(h => h === 'role' || h === 'rol');
  const classIdx = header.findIndex(h => h === 'classes' || h === 'clases' || h === 'classnames');

  if (emailIdx === -1 || firstIdx === -1 || lastIdx === -1) return [];

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
    };
  }).filter(r => r.email);
}

// Re-export XLSX utilities needed by the modal
export { XLSX };

export function normalizeClassRows(rows: Record<string, unknown>[]): ClassRow[] {
  if (rows.length === 0) return [];
  const raw = rows[0];
  const keys = Object.keys(raw).map(k => k.toLowerCase().trim().replace(/\s+/g, ''));
  const find = (...names: string[]) => keys.findIndex(k => names.includes(k));

  const nameIdx = find('nombre', 'name', 'clase', 'class', 'asignatura');
  if (nameIdx === -1) return [];

  const monthlyIdx = find('preciomensual', 'monthlyprice', 'mensual', 'monthly');
  const oneTimeIdx = find('pagounico', 'onetimeprice', 'unico', 'onetime', 'pago');

  const origKeys = Object.keys(raw);
  return rows.flatMap(row => {
    const name = String(row[origKeys[nameIdx]] ?? '').trim();
    if (!name) return [];
    const monthlyRaw = monthlyIdx !== -1 ? parseFloat(String(row[origKeys[monthlyIdx]] ?? '')) : NaN;
    const oneTimeRaw = oneTimeIdx !== -1 ? parseFloat(String(row[origKeys[oneTimeIdx]] ?? '')) : NaN;
    return [{
      name,
      monthlyPrice: isNaN(monthlyRaw) ? undefined : monthlyRaw,
      oneTimePrice: isNaN(oneTimeRaw) ? undefined : oneTimeRaw,
    }];
  });
}
