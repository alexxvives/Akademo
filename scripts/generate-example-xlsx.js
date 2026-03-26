#!/usr/bin/env node
// Generates example and template Excel files for the bulk import migration tool.
// Output: docs/onboarding/Users_example.xlsx  — filled with sample data
//         docs/onboarding/Users_template.xlsx  — empty sheet with headers only
// Usage: node scripts/generate-example-xlsx.js

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, '..', 'docs', 'onboarding');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Column headers — optional fields marked with "(opcional)"
// The migration parser strips "(opcional)" before matching, so these work as-is.
const userHeaders    = ['email', 'nombre', 'apellido', 'rol (opcional)', 'clases (opcional)'];
const classHeaders   = ['nombre', 'fechaInicio (opcional)', 'precio (opcional)', 'tipoPrecio (opcional)', 'profesorEmail (opcional)', 'descripcion (opcional)', 'universidad (opcional)', 'carrera (opcional)', 'maxEstudiantes (opcional)', 'whatsapp (opcional)'];

// --- EXAMPLE DATA ---
const usersRows = [
  ['juan.garcia@ejemplo.com',     'Juan',   'García',    'STUDENT', 'Matemáticas 1,Inglés B2'],
  ['maria.lopez@ejemplo.com',     'María',  'López',     'STUDENT', 'Matemáticas 1'],
  ['carlos.martinez@ejemplo.com', 'Carlos', 'Martínez',  'STUDENT', 'Inglés B2'],
  ['ana.fernandez@ejemplo.com',   'Ana',    'Fernández', 'STUDENT', 'Matemáticas 1,Ciencias'],
  ['pedro.sanchez@ejemplo.com',   'Pedro',  'Sánchez',   'STUDENT', 'Ciencias'],
  ['laura.jimenez@ejemplo.com',   'Laura',  'Jiménez',   'STUDENT', 'Inglés B2,Ciencias'],
  ['miguel.ruiz@ejemplo.com',     'Miguel', 'Ruiz',      'TEACHER', 'Matemáticas 1'],
  ['sofia.moreno@ejemplo.com',    'Sofía',  'Moreno',    'TEACHER', 'Inglés B2,Ciencias'],
];

const classesRows = [
  ['Matemáticas 1', '01/09/2026', '50',  'MENSUAL', 'miguel.ruiz@ejemplo.com',  'Álgebra y cálculo básico', 'UCM', 'Ingeniería', '30', ''],
  ['Inglés B2',     '15/09/2026', '200', 'UNICO',   'sofia.moreno@ejemplo.com', 'Inglés nivel B2',          '',    '',           '20', 'https://chat.whatsapp.com/EVwr6bNsKng5Rk965ZuM4U'],
  ['Ciencias',      '01/09/2026', '40',  'MENSUAL', 'sofia.moreno@ejemplo.com', '',                         'UAM', 'Biología',   '',   ''],
];

const userColWidths    = [32, 16, 18, 14, 40];
const classColWidths   = [24, 18, 10, 16, 32, 36, 16, 16, 16, 44];

function makeSheet(headers, rows) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map((_, i) => ({ wch: (rows.length ? (i < userColWidths.length ? userColWidths[i] : classColWidths[i]) : Math.max(headers[i].length + 2, 16)) }));
  return ws;
}

function makeColWidths(widths) {
  return widths.map(w => ({ wch: w }));
}

// --- FILE 1: Users_example.xlsx (with sample data) ---
const wbExample = XLSX.utils.book_new();
const wsUsersEx = XLSX.utils.aoa_to_sheet([userHeaders, ...usersRows]);
wsUsersEx['!cols'] = makeColWidths(userColWidths);
XLSX.utils.book_append_sheet(wbExample, wsUsersEx, 'Usuarios');

const wsClasesEx = XLSX.utils.aoa_to_sheet([classHeaders, ...classesRows]);
wsClasesEx['!cols'] = makeColWidths(classColWidths);
XLSX.utils.book_append_sheet(wbExample, wsClasesEx, 'Clases');

const examplePath = path.join(outputDir, 'Users_example.xlsx');
XLSX.writeFile(wbExample, examplePath);
console.log('Created:', examplePath);

// --- FILE 2: Users_template.xlsx (empty — headers only) ---
const wbTemplate = XLSX.utils.book_new();
const wsUsersTpl = XLSX.utils.aoa_to_sheet([userHeaders]);
wsUsersTpl['!cols'] = makeColWidths(userColWidths);
XLSX.utils.book_append_sheet(wbTemplate, wsUsersTpl, 'Usuarios');

const wsClasesTpl = XLSX.utils.aoa_to_sheet([classHeaders]);
wsClasesTpl['!cols'] = makeColWidths(classColWidths);
XLSX.utils.book_append_sheet(wbTemplate, wsClasesTpl, 'Clases');

const templatePath = path.join(outputDir, 'Users_template.xlsx');
XLSX.writeFile(wbTemplate, templatePath);
console.log('Created:', templatePath);
