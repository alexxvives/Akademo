'use client';

import { useState } from 'react';
import { Language } from '@/lib/translations';

interface CalculatorSectionProps {
  lang: Language;
}

function UsersIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function DollarIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function EyeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

export function CalculatorSection({ lang }: CalculatorSectionProps) {
  const [calcStudents, setCalcStudents] = useState(100);
  const [calcMonthlyFee, setCalcMonthlyFee] = useState(30);
  const [calcGhostPct, setCalcGhostPct] = useState(60);

  const ghostStudents = Math.round(calcStudents * (calcGhostPct / 100));
  const recoveryRate = 0.5;
  const recoveredStudents = Math.round(ghostStudents * recoveryRate);
  const monthlyRecovery = recoveredStudents * calcMonthlyFee;
  const annualRecovery = monthlyRecovery * 12;

  const isEs = lang === 'es';

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/10 to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wide border border-emerald-500/20">
            {isEs ? 'CALCULADORA DE INGRESOS' : 'REVENUE CALCULATOR'}
          </span>
        </div>
        <h3 className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-white">
          {isEs ? '¿Cuántos de tus estudiantes son ' : 'How many of your students are '}
          <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            {isEs ? 'fantasma' : 'ghosts'}
          </span>
          ?
        </h3>
        <p className="text-center text-gray-400 text-lg max-w-2xl mx-auto mb-10">
          {isEs
            ? 'Un estudiante fantasma es alguien que comparte su cuenta con otros. Tú cobras por 1, pero acceden 3. Descubre cuánto dinero estás dejando en la mesa.'
            : "A ghost student is someone sharing their account with others. You charge for 1, but 3 access. Discover how much money you're leaving on the table."}
        </p>

        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          {/* Left: Inputs */}
          <div className="bg-gray-800/50 rounded-2xl p-6 sm:p-8 border border-gray-700 space-y-8 flex flex-col justify-between">
            {/* Total students slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <UsersIcon className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Estudiantes Inscritos' : 'Enrolled Students'}
                </span>
                <span className="text-lg font-bold text-emerald-400">{calcStudents}</span>
              </div>
              <input type="range" min="20" max="1000" step="10" value={calcStudents} onChange={e => setCalcStudents(Number(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>20</span><span>1000</span></div>
            </div>

            {/* Monthly fee slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <DollarIcon className="w-4 h-4 text-gray-400" />
                  {isEs ? 'Cuota Mensual por Estudiante' : 'Monthly Fee per Student'}
                </span>
                <span className="text-lg font-bold text-emerald-400">€{calcMonthlyFee}</span>
              </div>
              <input type="range" min="10" max="200" step="5" value={calcMonthlyFee} onChange={e => setCalcMonthlyFee(Number(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>€10</span><span>€200</span></div>
            </div>

            {/* Ghost percentage slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <EyeIcon className="w-4 h-4 text-red-400" />
                  {isEs ? '% Estudiantes Fantasma (estimado)' : '% Ghost Students (estimated)'}
                </span>
                <span className="text-lg font-bold text-red-400">{calcGhostPct}%</span>
              </div>
              <input type="range" min="10" max="90" step="5" value={calcGhostPct} onChange={e => setCalcGhostPct(Number(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>10%</span><span>90%</span></div>
            </div>

            {/* Visual: ghost bar */}
            <div className="bg-gray-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>{isEs ? 'Estudiantes que pagan' : 'Paying students'}</span>
                <span>{isEs ? 'Fantasmas' : 'Ghosts'}</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 transition-all duration-300" style={{ width: `${100 - calcGhostPct}%` }} />
                <div className="bg-red-500/60 transition-all duration-300" style={{ width: `${calcGhostPct}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-emerald-400 font-medium">{calcStudents - ghostStudents}</span>
                <span className="text-red-400 font-medium">{ghostStudents}</span>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="space-y-4 flex flex-col">
            {/* Annual loss hero */}
            <div className="bg-gradient-to-r from-red-500/15 to-orange-500/15 border border-red-500/20 rounded-xl p-6 text-center flex-1 flex flex-col justify-center">
              <p className="text-gray-400 text-sm mb-1">{isEs ? 'Ingresos Perdidos por Año' : 'Annual Revenue Lost'}</p>
              <p className="text-4xl sm:text-5xl font-bold text-red-400">€{(ghostStudents * calcMonthlyFee * 12).toLocaleString()}</p>
              <p className="text-gray-500 text-sm mt-1">{isEs ? 'por cuentas compartidas' : 'from shared accounts'}</p>
            </div>

            {/* Recoverable with AKADEMO */}
            <div className="bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/20 rounded-xl p-6 text-center flex-1 flex flex-col justify-center">
              <p className="text-gray-400 text-sm mb-1">{isEs ? 'Ingresos Recuperables por Año' : 'Recoverable Annual Revenue'}</p>
              <p className="text-4xl sm:text-5xl font-bold text-emerald-400">€{annualRecovery.toLocaleString()}</p>
              <p className="text-gray-500 text-sm mt-1">{isEs ? 'bloqueando cuentas compartidas' : 'by blocking shared accounts'}</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 text-center">
                <UsersIcon className="w-5 h-5 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-400">{ghostStudents}</p>
                <p className="text-gray-500 text-xs mt-1">{isEs ? 'Estudiantes Fantasma' : 'Ghost Students'}</p>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 text-center">
                <UsersIcon className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-400">+{recoveredStudents}</p>
                <p className="text-gray-500 text-xs mt-1">{isEs ? 'Estudiantes Recuperados' : 'Recovered Students'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
