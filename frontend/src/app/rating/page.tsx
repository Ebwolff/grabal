'use client';

import React, { useMemo } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import {
  Star, Shield, TrendingUp, TrendingDown, Scale,
  Droplets, AlertTriangle, CheckCircle2, ArrowRight,
  ChevronRight, BarChart3, DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

// Financial data pulled from other modules
const financialData = {
  // Liquidity
  ativoCirculante: 8500000,
  passivoCirculante: 2610000,
  disponivel: 3200000,
  estoquesValor: 4800000,

  // Leverage
  ativoTotal: 80920000,
  passivoTotal: 12710000,
  patrimonioLiquido: 68210000,
  divLiquida: 8900000,

  // Profitability
  receitaTotal: 30886600,
  lucroLiquido: 16170000,
  lucroOperacional: 24726140,
  ebitda: 24977890,

  // Guarantees
  garantiasAceitas: 76360000,
  garantiasTotal: 87760000,
};

interface PillarScore {
  name: string;
  icon: typeof Star;
  score: number;
  grade: string;
  color: string;
  metrics: { label: string; value: string; ideal: string; status: 'good' | 'ok' | 'bad' }[];
}

function calcScore(value: number, thresholds: [number, number, number, number]): { score: number; grade: string; color: string } {
  // thresholds = [A, B, C boundary] - above first = A, etc.
  if (value >= thresholds[0]) return { score: Math.min(100, 70 + (value - thresholds[0]) / thresholds[0] * 30), grade: 'A', color: '#10b981' };
  if (value >= thresholds[1]) return { score: 50 + (value - thresholds[1]) / (thresholds[0] - thresholds[1]) * 20, grade: 'B', color: '#06b6d4' };
  if (value >= thresholds[2]) return { score: 30 + (value - thresholds[2]) / (thresholds[1] - thresholds[2]) * 20, grade: 'C', color: '#f59e0b' };
  return { score: Math.max(5, value / thresholds[2] * 30), grade: 'D', color: '#ef4444' };
}

function calcScoreInverse(value: number, thresholds: [number, number, number, number]): { score: number; grade: string; color: string } {
  // Lower is better
  if (value <= thresholds[0]) return { score: Math.min(100, 70 + (thresholds[0] - value) / thresholds[0] * 30), grade: 'A', color: '#10b981' };
  if (value <= thresholds[1]) return { score: 50 + (thresholds[1] - value) / (thresholds[1] - thresholds[0]) * 20, grade: 'B', color: '#06b6d4' };
  if (value <= thresholds[2]) return { score: 30 + (thresholds[2] - value) / (thresholds[2] - thresholds[1]) * 20, grade: 'C', color: '#f59e0b' };
  return { score: Math.max(5, thresholds[2] / value * 30), grade: 'D', color: '#ef4444' };
}

const gradeColors: Record<string, string> = { A: '#10b981', B: '#06b6d4', C: '#f59e0b', D: '#ef4444' };

export default function RatingPage() {
  const { isPrivate } = usePrivacy();
  const d = financialData;

  const pillars = useMemo((): PillarScore[] => {
    // 1. LIQUIDITY
    const liquidezCorrente = d.ativoCirculante / d.passivoCirculante;
    const liquidezSeca = (d.ativoCirculante - d.estoquesValor) / d.passivoCirculante;
    const liquidezImediata = d.disponivel / d.passivoCirculante;
    const liqScore = calcScore(liquidezCorrente, [2.0, 1.5, 1.0, 0.5]);

    // 2. LEVERAGE
    const endividamento = d.passivoTotal / d.ativoTotal;
    const alavancagem = d.passivoTotal / d.patrimonioLiquido;
    const divEbitda = d.divLiquida / d.ebitda;
    const alavScore = calcScoreInverse(alavancagem, [0.15, 0.25, 0.40, 0.6]);

    // 3. PROFITABILITY
    const margemLiquida = d.lucroLiquido / d.receitaTotal;
    const margemOperacional = d.lucroOperacional / d.receitaTotal;
    const margemEbitda = d.ebitda / d.receitaTotal;
    const roe = d.lucroLiquido / d.patrimonioLiquido;
    const rentScore = calcScore(margemLiquida, [0.40, 0.25, 0.10, 0.0]);

    // 4. GUARANTEES
    const cobertura = d.garantiasAceitas / d.passivoTotal;
    const garantiaRatio = d.garantiasTotal / d.passivoTotal;
    const garScore = calcScore(cobertura, [3.0, 2.0, 1.0, 0.5]);

    return [
      {
        name: 'Liquidez', icon: Droplets, ...liqScore,
        metrics: [
          { label: 'Liquidez Corrente', value: liquidezCorrente.toFixed(2), ideal: '> 2.0', status: liquidezCorrente >= 2 ? 'good' : liquidezCorrente >= 1.5 ? 'ok' : 'bad' },
          { label: 'Liquidez Seca', value: liquidezSeca.toFixed(2), ideal: '> 1.0', status: liquidezSeca >= 1 ? 'good' : liquidezSeca >= 0.7 ? 'ok' : 'bad' },
          { label: 'Liquidez Imediata', value: liquidezImediata.toFixed(2), ideal: '> 0.5', status: liquidezImediata >= 0.5 ? 'good' : liquidezImediata >= 0.2 ? 'ok' : 'bad' },
        ]
      },
      {
        name: 'Alavancagem', icon: Scale, ...alavScore,
        metrics: [
          { label: 'Endividamento', value: `${(endividamento * 100).toFixed(1)}%`, ideal: '< 30%', status: endividamento < 0.3 ? 'good' : endividamento < 0.5 ? 'ok' : 'bad' },
          { label: 'Passivo / PL', value: alavancagem.toFixed(2), ideal: '< 0.25', status: alavancagem < 0.25 ? 'good' : alavancagem < 0.40 ? 'ok' : 'bad' },
          { label: 'Dív. Líq. / EBITDA', value: `${divEbitda.toFixed(2)}x`, ideal: '< 1.5x', status: divEbitda < 1.5 ? 'good' : divEbitda < 2.5 ? 'ok' : 'bad' },
        ]
      },
      {
        name: 'Rentabilidade', icon: TrendingUp, ...rentScore,
        metrics: [
          { label: 'Margem Líquida', value: `${(margemLiquida * 100).toFixed(1)}%`, ideal: '> 40%', status: margemLiquida >= 0.4 ? 'good' : margemLiquida >= 0.25 ? 'ok' : 'bad' },
          { label: 'Margem EBITDA', value: `${(margemEbitda * 100).toFixed(1)}%`, ideal: '> 60%', status: margemEbitda >= 0.6 ? 'good' : margemEbitda >= 0.4 ? 'ok' : 'bad' },
          { label: 'ROE', value: `${(roe * 100).toFixed(1)}%`, ideal: '> 15%', status: roe >= 0.15 ? 'good' : roe >= 0.08 ? 'ok' : 'bad' },
        ]
      },
      {
        name: 'Garantias', icon: Shield, ...garScore,
        metrics: [
          { label: 'Cobertura Aceitas', value: `${cobertura.toFixed(2)}x`, ideal: '> 3.0x', status: cobertura >= 3 ? 'good' : cobertura >= 2 ? 'ok' : 'bad' },
          { label: 'Cobertura Total', value: `${garantiaRatio.toFixed(2)}x`, ideal: '> 4.0x', status: garantiaRatio >= 4 ? 'good' : garantiaRatio >= 2 ? 'ok' : 'bad' },
          { label: 'Garantias Aceitas', value: `${((d.garantiasAceitas / d.garantiasTotal) * 100).toFixed(0)}%`, ideal: '> 80%', status: (d.garantiasAceitas / d.garantiasTotal) >= 0.8 ? 'good' : 'ok' },
        ]
      },
    ];
  }, []);

  const overallScore = useMemo(() => {
    const weights = [0.25, 0.25, 0.25, 0.25];
    const weighted = pillars.reduce((s, p, i) => s + p.score * weights[i], 0);
    let grade: string, color: string, label: string;
    if (weighted >= 70) { grade = 'A'; color = '#10b981'; label = 'Excelente'; }
    else if (weighted >= 50) { grade = 'B'; color = '#06b6d4'; label = 'Bom'; }
    else if (weighted >= 30) { grade = 'C'; color = '#f59e0b'; label = 'Regular'; }
    else { grade = 'D'; color = '#ef4444'; label = 'Crítico'; }
    return { score: weighted, grade, color, label };
  }, [pillars]);

  const radarData = pillars.map(p => ({ subject: p.name, score: p.score, fullMark: 100 }));

  const statusIcon = (s: 'good' | 'ok' | 'bad') => {
    if (s === 'good') return <CheckCircle2 size={10} className="text-emerald-400" />;
    if (s === 'ok') return <AlertTriangle size={10} className="text-amber-400" />;
    return <TrendingDown size={10} className="text-red-400" />;
  };

  return (
    <MainContent>
        <PageHeader
        title="Rating"
        accent="Financeiro"
        description="Classificação de risco e score financeiro do produtor."
      />

        {/* Overall Score Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-industrial-card border-2 p-8 mb-8 flex items-center gap-12" style={{ borderColor: overallScore.color }}>
          <div className="text-center min-w-[200px]">
            <p className="text-[9px] uppercase tracking-widest text-slate-600 font-black mb-2">Rating Geral</p>
            <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="text-8xl font-bold tracking-tight" style={{ color: overallScore.color }}>
              {overallScore.grade}
            </motion.p>
            <p className="text-sm font-bold mt-1" style={{ color: overallScore.color }}>{overallScore.label}</p>
            <div className="flex justify-center gap-1 mt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Star key={i} size={16} style={{ color: overallScore.color }}
                  fill={i < (overallScore.grade === 'A' ? 4 : overallScore.grade === 'B' ? 3 : overallScore.grade === 'C' ? 2 : 1) ? overallScore.color : 'transparent'} />
              ))}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-[9px] uppercase tracking-widest text-slate-600 font-black">Score de Risco</p>
              <span className="text-2xl font-black font-mono" style={{ color: overallScore.color }}>{overallScore.score.toFixed(1)}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <div className="h-4 w-full bg-slate-800 overflow-hidden mb-2">
              <motion.div initial={{ width: 0 }} animate={{ width: `${overallScore.score}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full" style={{ backgroundColor: overallScore.color }} />
            </div>
            <div className="flex justify-between text-[8px] text-slate-600 font-mono">
              <span>0</span>
              <span className="text-red-500 font-bold">D (0–30)</span>
              <span className="text-amber-500 font-bold">C (30–50)</span>
              <span className="text-cyan-500 font-bold">B (50–70)</span>
              <span className="text-emerald-500 font-bold">A (70–100)</span>
            </div>
          </div>

          <div className="min-w-[200px]">
            <ResponsiveContainer width="100%" height={160}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke={overallScore.color} fill={overallScore.color} fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 4 Pillar Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {pillars.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="card p-6" style={{ borderColor: `${p.color}40` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <p.icon size={16} style={{ color: p.color }} />
                  <h4 className="font-bold uppercase tracking-tight text-sm">{p.name}</h4>
                </div>
                <span className="text-2xl font-black" style={{ color: p.color }}>{p.grade}</span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] text-slate-600 font-bold">Score</span>
                  <span className="text-xs font-mono font-bold" style={{ color: p.color }}>{p.score.toFixed(1)}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${p.score}%` }} transition={{ delay: i * 0.1, duration: 1 }}
                    className="h-full" style={{ backgroundColor: p.color }} />
                </div>
              </div>

              <div className="space-y-2.5">
                {p.metrics.map(m => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(m.status)}
                        <span className="text-[10px] text-slate-400">{m.label}</span>
                      </div>
                      <span className={cn("text-[11px] font-mono font-bold privacy-mask", isPrivate && "privacy-hidden")}>{m.value}</span>
                    </div>
                    <span className="text-[8px] text-slate-600 font-mono ml-4">Ideal: {m.ideal}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Grade Scale + Methodology */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Grade Scale */}
          <div className="card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
              <Star size={14} className="text-primary-light" />
              Escala de Classificação
            </h4>
            <div className="space-y-2">
              {[
                { grade: 'A', range: '70–100', label: 'Excelente — baixo risco, alta capacidade de pagamento', stars: 4 },
                { grade: 'B', range: '50–70', label: 'Bom — risco moderado, boa capacidade de pagamento', stars: 3 },
                { grade: 'C', range: '30–50', label: 'Regular — risco elevado, capacidade de pagamento limitada', stars: 2 },
                { grade: 'D', range: '0–30', label: 'Crítico — alto risco, capacidade de pagamento comprometida', stars: 1 },
              ].map(s => (
                <div key={s.grade} className={cn("p-3 border-l-2 transition-colors",
                  s.grade === overallScore.grade ? "bg-slate-800/50" : "bg-transparent"
                )} style={{ borderColor: gradeColors[s.grade] }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black" style={{ color: gradeColors[s.grade] }}>{s.grade}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: s.stars }).map((_, i) => (
                          <Star key={i} size={8} style={{ color: gradeColors[s.grade] }} fill={gradeColors[s.grade]} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">{s.range} pts</span>
                  </div>
                  <p className="text-[9px] text-slate-500">{s.label}</p>
                  {s.grade === overallScore.grade && (
                    <span className="text-[8px] uppercase tracking-widest font-black mt-1 inline-block" style={{ color: gradeColors[s.grade] }}>← Classificação Atual</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Methodology */}
          <div className="card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
              <BarChart3 size={14} className="text-primary-light" />
              Metodologia
            </h4>
            <div className="space-y-4">
              {pillars.map((p, i) => (
                <div key={p.name}>
                  <div className="flex items-center gap-2 mb-1">
                    <p.icon size={12} style={{ color: p.color }} />
                    <span className="text-xs font-bold">{p.name}</span>
                    <span className="text-[9px] text-slate-500">(25%)</span>
                  </div>
                  <p className="text-[9px] text-slate-500 ml-5">
                    {p.name === 'Liquidez' && 'Capacidade de honrar obrigações de curto prazo. Analisa liquidez corrente, seca e imediata.'}
                    {p.name === 'Alavancagem' && 'Nível de endividamento em relação ao patrimônio. Analisa endividamento, alavancagem e dívida/EBITDA.'}
                    {p.name === 'Rentabilidade' && 'Capacidade de gerar lucro. Analisa margem líquida, margem EBITDA e ROE.'}
                    {p.name === 'Garantias' && 'Colaterais oferecidos em operações de crédito. Analisa cobertura aceita, total e taxa de aceitação.'}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-industrial-border mt-4 pt-3">
              <p className="text-[9px] text-slate-600">
                Score final = média ponderada dos 4 pilares (25% cada). Classificação atualizada com base nos dados financeiros consolidados.
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="card p-6">
            <h4 className="font-bold uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
              <DollarSign size={14} className="text-primary-light" />
              Recomendações
            </h4>
            <div className="space-y-3">
              {pillars.filter(p => p.grade !== 'A').length === 0 ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs">
                  <CheckCircle2 size={14} />
                  <span className="font-bold">Todos os indicadores estão excelentes!</span>
                </div>
              ) : (
                pillars.filter(p => p.grade !== 'A').map(p => (
                  <div key={p.name} className="bg-slate-900/50 border-l-2 p-3" style={{ borderColor: p.color }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <p.icon size={10} style={{ color: p.color }} />
                      <span className="text-[10px] font-bold" style={{ color: p.color }}>{p.name} ({p.grade})</span>
                    </div>
                    {p.metrics.filter(m => m.status !== 'good').map(m => (
                      <div key={m.label} className="flex items-center gap-1 text-[9px] text-slate-400 ml-3">
                        <ChevronRight size={8} />
                        <span>{m.label}: {m.value} → meta {m.ideal}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-industrial-border mt-4 pt-3">
              <p className="text-[9px] text-slate-600">
                Recomendações baseadas nos indicadores abaixo do ideal. Foque nos pilares com grade inferior a A.
              </p>
            </div>
          </div>
        </div>
    </MainContent>
  );
}
