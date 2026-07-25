'use client';

import React, { useMemo, useState } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { usePrivacy } from '@/context/PrivacyContext';
import { cn } from '@/lib/utils';
import {
  Star, Shield, TrendingUp, TrendingDown, Scale,
  Clock, AlertTriangle, CheckCircle2,
  ChevronRight, BarChart3, DollarSign, AlertOctagon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

import { getAssets, getLiabilities, getAllCosts, getGuarantees, getSales } from '@/lib/supabase/database';

interface PillarScore {
  name: string;
  icon: typeof Star;
  score: number;
  grade: string;
  color: string;
  metrics: { label: string; value: string; ideal: string; status: 'good' | 'ok' | 'bad' }[];
}

function calcScore(value: number, thresholds: [number, number, number]): { score: number; grade: string; color: string } {
  if (value >= thresholds[0]) return { score: 95, grade: 'A', color: '#10b981' };
  if (value >= thresholds[1]) return { score: 75, grade: 'B', color: '#06b6d4' };
  if (value >= thresholds[2]) return { score: 50, grade: 'C', color: '#f59e0b' };
  return { score: 20, grade: 'D', color: '#ef4444' };
}

function calcScoreInverse(value: number, thresholds: [number, number, number]): { score: number; grade: string; color: string } {
  // Lower is better
  if (value <= thresholds[2]) return { score: 95, grade: 'A', color: '#10b981' };
  if (value <= thresholds[1]) return { score: 75, grade: 'B', color: '#06b6d4' };
  if (value <= thresholds[0]) return { score: 50, grade: 'C', color: '#f59e0b' };
  return { score: 20, grade: 'D', color: '#ef4444' };
}

function safeDiv(a: number, b: number): number {
  if (b === 0) return a === 0 ? 0 : Infinity;
  return a / b;
}

const gradeColors: Record<string, string> = { A: '#10b981', B: '#06b6d4', C: '#f59e0b', D: '#ef4444' };

export default function RatingPage() {
  const { isPrivate } = usePrivacy();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [d, setD] = useState({
    ativoTotal: 0, passivoTotal: 0, patrimonioLiquido: 0,
    passivoCurtoPrazo: 0, passivoLongoPrazo: 0,
    receitaTotal: 0, custoTotal: 0, lucroLiquido: 0,
    garantiasTotal: 0,
  });

  React.useEffect(() => {
    async function fetchData() {
      try {
        setFetchError(null);
        const [assets, liab, costs, guar, sales] = await Promise.all([
          getAssets(), getLiabilities(), getAllCosts(), getGuarantees(), getSales(),
        ]);

        const ativoTotal = assets.reduce((s, a) => s + a.value, 0);
        const passivoTotal = liab.reduce((s, l) => s + l.value, 0);

        const in12Months = new Date();
        in12Months.setFullYear(in12Months.getFullYear() + 1);
        const passivoCurtoPrazo = liab
          .filter(l => new Date(l.dueDate) <= in12Months)
          .reduce((s, l) => s + l.value, 0);

        const receitaTotal = sales.reduce((s, sale) => s + sale.grossRevenue, 0);
        const custoTotal = costs.reduce(
          (s, c) => s + (c.items?.reduce((si, i) => si + (i.value || 0), 0) || 0), 0
        );
        const garantiasTotal = guar.reduce((s, g) => s + g.value, 0);

        setD({
          ativoTotal,
          passivoTotal,
          patrimonioLiquido: ativoTotal - passivoTotal,
          passivoCurtoPrazo,
          passivoLongoPrazo: passivoTotal - passivoCurtoPrazo,
          receitaTotal,
          custoTotal,
          lucroLiquido: receitaTotal - custoTotal,
          garantiasTotal,
        });
      } catch (err: any) {
        console.error(err);
        setFetchError(err?.message || 'Falha ao carregar dados financeiros do Supabase.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const pillars = useMemo((): PillarScore[] => {
    // 1. COBERTURA DE CURTO PRAZO
    // Não há Ativo Circulante/caixa modelado no schema — usamos patrimônio líquido e
    // garantias como colchão de cobertura das dívidas que vencem nos próximos 12 meses.
    const coberturaPL = safeDiv(d.patrimonioLiquido, d.passivoCurtoPrazo);
    const coberturaGarantias = safeDiv(d.garantiasTotal, d.passivoCurtoPrazo);
    const concentracaoCP = safeDiv(d.passivoCurtoPrazo, d.passivoTotal);
    const coberturaScore = calcScore(coberturaPL, [3.0, 1.5, 0.75]);

    // 2. ALAVANCAGEM
    const endividamento = safeDiv(d.passivoTotal, d.ativoTotal);
    const alavancagem = safeDiv(d.passivoTotal, d.patrimonioLiquido);
    const alavScore = calcScoreInverse(alavancagem, [0.15, 0.25, 0.40]);

    // 3. RENTABILIDADE
    const margemLiquida = safeDiv(d.lucroLiquido, d.receitaTotal);
    const roe = safeDiv(d.lucroLiquido, d.patrimonioLiquido);
    const eficienciaCustos = 1 - safeDiv(d.custoTotal, d.receitaTotal);
    const rentScore = calcScore(margemLiquida, [0.40, 0.25, 0.10]);

    // 4. GARANTIAS
    const coberturaTotal = safeDiv(d.garantiasTotal, d.passivoTotal);
    const garantiaSobreAtivo = safeDiv(d.garantiasTotal, d.ativoTotal);
    const garScore = calcScore(coberturaTotal, [3.0, 2.0, 1.0]);

    return [
      {
        name: 'Cobertura CP', icon: Clock, ...coberturaScore,
        metrics: [
          { label: 'Patrim. Líq. / Passivo CP', value: isFinite(coberturaPL) ? coberturaPL.toFixed(2) : '∞', ideal: '> 3.0x', status: coberturaPL >= 3 ? 'good' : coberturaPL >= 1.5 ? 'ok' : 'bad' },
          { label: 'Garantias / Passivo CP', value: isFinite(coberturaGarantias) ? coberturaGarantias.toFixed(2) : '∞', ideal: '> 2.0x', status: coberturaGarantias >= 2 ? 'good' : coberturaGarantias >= 1 ? 'ok' : 'bad' },
          { label: 'Concentração no CP', value: isFinite(concentracaoCP) ? `${(concentracaoCP * 100).toFixed(1)}%` : '—', ideal: '< 30%', status: concentracaoCP < 0.3 ? 'good' : concentracaoCP < 0.5 ? 'ok' : 'bad' },
        ]
      },
      {
        name: 'Alavancagem', icon: Scale, ...alavScore,
        metrics: [
          { label: 'Endividamento', value: isFinite(endividamento) ? `${(endividamento * 100).toFixed(1)}%` : '—', ideal: '< 30%', status: endividamento < 0.3 ? 'good' : endividamento < 0.5 ? 'ok' : 'bad' },
          { label: 'Passivo / PL', value: isFinite(alavancagem) ? alavancagem.toFixed(2) : '∞', ideal: '< 0.25', status: alavancagem < 0.25 ? 'good' : alavancagem < 0.40 ? 'ok' : 'bad' },
          { label: 'Passivo Longo Prazo', value: `R$ ${d.passivoLongoPrazo.toLocaleString('pt-BR')}`, ideal: '—', status: 'ok' },
        ]
      },
      {
        name: 'Rentabilidade', icon: TrendingUp, ...rentScore,
        metrics: [
          { label: 'Margem Líquida', value: isFinite(margemLiquida) ? `${(margemLiquida * 100).toFixed(1)}%` : '—', ideal: '> 40%', status: margemLiquida >= 0.4 ? 'good' : margemLiquida >= 0.25 ? 'ok' : 'bad' },
          { label: 'ROE', value: isFinite(roe) ? `${(roe * 100).toFixed(1)}%` : '—', ideal: '> 15%', status: roe >= 0.15 ? 'good' : roe >= 0.08 ? 'ok' : 'bad' },
          { label: 'Eficiência de Custos', value: isFinite(eficienciaCustos) ? `${(eficienciaCustos * 100).toFixed(1)}%` : '—', ideal: '> 60%', status: eficienciaCustos >= 0.6 ? 'good' : eficienciaCustos >= 0.4 ? 'ok' : 'bad' },
        ]
      },
      {
        name: 'Garantias', icon: Shield, ...garScore,
        metrics: [
          { label: 'Cobertura sobre Passivo', value: isFinite(coberturaTotal) ? `${coberturaTotal.toFixed(2)}x` : '∞', ideal: '> 3.0x', status: coberturaTotal >= 3 ? 'good' : coberturaTotal >= 2 ? 'ok' : 'bad' },
          { label: 'Garantias / Ativo Total', value: isFinite(garantiaSobreAtivo) ? `${(garantiaSobreAtivo * 100).toFixed(0)}%` : '—', ideal: '> 80%', status: garantiaSobreAtivo >= 0.8 ? 'good' : 'ok' },
          { label: 'Total em Garantias', value: `R$ ${d.garantiasTotal.toLocaleString('pt-BR')}`, ideal: '—', status: 'ok' },
        ]
      },
    ];
  }, [d]);

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

  if (loading) {
    return (
      <MainContent>
        <div className="flex items-center justify-center h-[60vh] text-slate-500">
          Carregando análise de crédito...
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent>
        <PageHeader
        title="Rating"
        accent="Financeiro"
        description="Classificação de risco e score financeiro do produtor."
      />

        {fetchError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-4 rounded-lg mb-6 flex items-center gap-2">
            <AlertOctagon size={16} />
            <span>Não foi possível carregar os dados financeiros do Supabase ({fetchError}). Os indicadores abaixo estão zerados e não refletem a situação real.</span>
          </div>
        )}

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
                    {p.name === 'Cobertura CP' && 'Capacidade de honrar passivos com vencimento em até 12 meses, usando patrimônio líquido e garantias como colchão (o modelo de dados atual não segrega caixa/estoque como Ativo Circulante).'}
                    {p.name === 'Alavancagem' && 'Nível de endividamento em relação ao ativo e ao patrimônio líquido.'}
                    {p.name === 'Rentabilidade' && 'Capacidade de gerar lucro a partir da receita real de vendas (Revenue) e dos custos lançados.'}
                    {p.name === 'Garantias' && 'Colaterais oferecidos frente ao passivo total e ao ativo total.'}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-industrial-border mt-4 pt-3">
              <p className="text-[9px] text-slate-600">
                Score final = média ponderada dos 4 pilares (25% cada), calculada a partir dos registros reais de
                Ativos, Passivos, Garantias, Custos e Receitas (Vendas) cadastrados no sistema.
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
