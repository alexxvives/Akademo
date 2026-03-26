#!/usr/bin/env node
// Generates example Users.xlsx for the bulk import migration tool.
// Usage: node scripts/generate-example-xlsx.js

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, '..', 'public', 'templates');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Example users — class names must match classes in the "Clases" sheet or already created in the academy
const usersData = [
  // Header will be auto-generated from the object keys
  { firstName: 'Juan',    lastName: 'García',   email: 'juan.garcia@ejemplo.com',     role: 'STUDENT', classNames: 'Matemáticas 1,Inglés B2' },
  { firstName: 'María',   lastName: 'López',    email: 'maria.lopez@ejemplo.com',     role: 'STUDENT', classNames: 'Matemáticas 1' },
  { firstName: 'Carlos',  lastName: 'Martínez', email: 'carlos.martinez@ejemplo.com', role: 'STUDENT', classNames: 'Inglés B2' },
  { firstName: 'Ana',     lastName: 'Fernández',email: 'ana.fernandez@ejemplo.com',   role: 'STUDENT', classNames: 'Matemáticas 1,Ciencias' },
  { firstName: 'Pedro',   lastName: 'Sánchez',  email: 'pedro.sanchez@ejemplo.com',   role: 'STUDENT', classNames: 'Ciencias' },
  { firstName: 'Laura',   lastName: 'Jiménez',  email: 'laura.jimenez@ejemplo.com',   role: 'STUDENT', classNames: 'Inglés B2,Ciencias' },
  { firstName: 'Miguel',  lastName: 'Ruiz',     email: 'miguel.ruiz@ejemplo.com',     role: 'TEACHER', classNames: 'Matemáticas 1' },
  { firstName: 'Sofía',   lastName: 'Moreno',   email: 'sofia.moreno@ejemplo.com',    role: 'TEACHER', classNames: 'Inglés B2,Ciencias' },
];

// Example classes — these will be created automatically if they don't exist in the academy
const classesData = [
  { nombre: 'Matemáticas 1', fechaInicio: '01/09/2026', precio: '50',  tipoPrecio: 'MENSUAL', profesorEmail: 'miguel.ruiz@ejemplo.com',  descripcion: 'Álgebra y cálculo básico', universidad: 'UCM',  carrera: 'Ingeniería', maxEstudiantes: '30', whatsapp: '' },
  { nombre: 'Inglés B2',     fechaInicio: '15/09/2026', precio: '200', tipoPrecio: 'UNICO',   profesorEmail: 'sofia.moreno@ejemplo.com', descripcion: 'Inglés nivel B2',          universidad: '',     carrera: '',          maxEstudiantes: '20', whatsapp: 'https://chat.whatsapp.com/EVwr6bNsKng5Rk965ZuM4U' },
  { nombre: 'Ciencias',      fechaInicio: '01/09/2026', precio: '40',  tipoPrecio: 'MENSUAL', profesorEmail: 'sofia.moreno@ejemplo.com', descripcion: '',                         universidad: 'UAM',  carrera: 'Biología',  maxEstudiantes: '',   whatsapp: '' },
];

const wb = XLSX.utils.book_new();

// Sheet 1: Usuarios
const ws = XLSX.utils.json_to_sheet(usersData);
ws['!cols'] = [
  { wch: 14 }, // firstName
  { wch: 16 }, // lastName
  { wch: 32 }, // email
  { wch: 10 }, // role
  { wch: 36 }, // classNames
];
XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

// Sheet 2: Clases (optional — creates classes that don't exist)
const wsClases = XLSX.utils.json_to_sheet(classesData);
wsClases['!cols'] = [
  { wch: 24 }, // nombre
  { wch: 14 }, // fechaInicio
  { wch: 10 }, // precio
  { wch: 12 }, // tipoPrecio
  { wch: 30 }, // profesorEmail
  { wch: 36 }, // descripcion
  { wch: 16 }, // universidad
  { wch: 16 }, // carrera
  { wch: 14 }, // maxEstudiantes
  { wch: 40 }, // whatsapp
];
XLSX.utils.book_append_sheet(wb, wsClases, 'Clases');

const outputPath = path.join(outputDir, 'Users_example.xlsx');
XLSX.writeFile(wb, outputPath);
console.log('Created:', outputPath);
