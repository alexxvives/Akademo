'use client';

import { useState } from 'react';
import { Language } from '@/lib/translations';
import { ScrollReveal } from '@/components/landing/ScrollReveal';

interface CalculatorSectionProps {
  lang: Language;
}

export function CalculatorSection({ lang }: CalculatorSectionProps) {
  const [calcStudents, setCalcStudents] = useState(100);
  const [calcMonthlyFee, setCalcMonthlyFee] = useState(30);
  const [calcGhostPct, setCalcGhostPct] = useState(60);

  const ghostStudents = Math.round(calcStudents * (calcGhostPct / 100));
  const currentAnnualRevenue = (calcStudents - ghostStudents) * calcMonthlyFee * 12;
  const lostAnnualRevenue = ghostStudents * calcMonthlyFee * 12;
  const totalPotentialRevenue = currentAnnualRevenue + lostAnnualRevenue;

  const isEs = lang === 'es';

  return (
    <section className="py-14 sm:py-28 px-4 sm:px-6 relative bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/10 to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wide border border-emerald-500/20">
            {isEs ? 'CALCULADORA DE INGRESOS' : 'REVENUE CALCULATOR'}
          </span>
        </div>
        <ScrollReveal direction="blur" delay={80}>
          <h3 className="text-center text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-white">
            {isEs ? '¿Cuántos de tus estudiantes son ' : 'How many of your students are '}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              {isEs ? 'fantasma' : 'ghosts'}
            </span>
            ?
          </h3>
        </ScrollReveal>
        <p className="text-center text-gray-400 text-sm sm:text-base max-w-2xl mx-auto mb-10">
          {isEs
            ? 'Un estudiante fantasma es alguien que comparte su cuenta con otros. Tú cobras por 1, pero acceden 3. Descubre cuánto dinero estás dejando en la mesa.'
            : "A ghost student is someone sharing their account with others. You charge for 1, but 3 access. Discover how much money you're leaving on the table."}
        </p>

        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          {/* Left: Inputs */}
          <ScrollReveal direction="left" delay={240} className="h-full">
            <div className="bg-gray-800/50 rounded-2xl p-6 sm:p-8 border border-gray-700 space-y-8 flex flex-col justify-between h-full">
            {/* Total students slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-300">
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
                <span className="text-sm font-medium text-gray-300">
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
                <span className="text-sm font-medium text-gray-300">
                  {isEs ? '% Estudiantes Fantasma (estimado)' : '% Ghost Students (estimated)'}
                </span>
                <span className="text-lg font-bold text-red-400">{calcGhostPct}%</span>
              </div>
              <input type="range" min="10" max="90" step="5" value={calcGhostPct} onChange={e => setCalcGhostPct(Number(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>10%</span><span>90%</span></div>
            </div>

            </div>
          </ScrollReveal>

          {/* Right: Results */}
          <ScrollReveal direction="right" delay={320} className="h-full">
            <div className="space-y-4 flex flex-col h-full">
            {/* Annual loss hero */}
            <div className="bg-gradient-to-r from-red-500/15 to-orange-500/15 border border-red-500/20 rounded-xl p-6 text-center flex-1 flex flex-col justify-center">
              <p className="text-gray-400 text-sm mb-1">{isEs ? 'Ingresos perdidos por año' : 'Annual Revenue Lost'}</p>
              <p key={lostAnnualRevenue} className="text-4xl sm:text-5xl font-bold text-red-400 calc-pop">€{lostAnnualRevenue.toLocaleString()}</p>
              <p className="text-gray-500 text-sm mt-1">{isEs ? 'por cuentas compartidas' : 'from shared accounts'}</p>
            </div>

            {/* Total potential revenue with AKADEMO */}
            <div className="bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/20 rounded-xl p-6 text-center flex-1 flex flex-col justify-center">
              <p className="text-gray-400 text-sm mb-1">{isEs ? 'Ingresos totales con AKADEMO' : 'Total Revenue with AKADEMO'}</p>
              <p key={totalPotentialRevenue} className="text-4xl sm:text-5xl font-bold text-emerald-400 calc-pop">€{totalPotentialRevenue.toLocaleString()}</p>
              <p className="text-gray-500 text-sm mt-1">
                {isEs
                  ? `€${currentAnnualRevenue.toLocaleString()} actuales + €${lostAnnualRevenue.toLocaleString()} recuperados (100%)`
                  : `€${currentAnnualRevenue.toLocaleString()} current + €${lostAnnualRevenue.toLocaleString()} recovered (100%)`}
              </p>
            </div>


            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
