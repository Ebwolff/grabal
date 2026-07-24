'use client';

import React, { useState } from 'react';
import { MainContent } from '@/components/MainContent';
import { PageHeader } from '@/components/PageHeader';
import { Truck, Calculator, DollarSign, ArrowRight } from 'lucide-react';

export default function FreightPage() {
  const [distance, setDistance] = useState(140);
  const [dieselPrice, setDieselPrice] = useState(5.70);
  const [volumeTon, setVolumeTon] = useState(6480);
  const [thirdPartyCostTon, setThirdPartyCostTon] = useState(132.70);
  const [monthlyPackage, setMonthlyPackage] = useState(2500);

  const estimatedTrips = Math.ceil(volumeTon / 45);
  const dieselPerTrip = (distance * 2) / 2.5;
  const costDieselTrip = dieselPerTrip * dieselPrice;
  const totalDieselCost = costDieselTrip * estimatedTrips;
  const totalOwnCost = totalDieselCost + monthlyPackage;
  
  const totalThirdPartyCost = volumeTon * thirdPartyCostTon;

  return (
    <MainContent>
      <PageHeader
        title="Logística e Frete"
        description="Comparativo de viabilidade: Frota Própria vs Terceirizada"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="glass p-6 rounded-xl border border-industrial-border">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-industrial-accent" /> Variáveis de Cálculo
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Volume (Ton)</label>
              <input type="number" value={volumeTon} onChange={e => setVolumeTon(Number(e.target.value))} className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Distância até Porto (km)</label>
              <input type="number" value={distance} onChange={e => setDistance(Number(e.target.value))} className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Preço Diesel (R$/L)</label>
              <input type="number" value={dieselPrice} onChange={e => setDieselPrice(Number(e.target.value))} className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Custo Frete Terceiro (R$/Ton)</label>
              <input type="number" value={thirdPartyCostTon} onChange={e => setThirdPartyCostTon(Number(e.target.value))} className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Pacote Serviços Próprio (R$)</label>
              <input type="number" value={monthlyPackage} onChange={e => setMonthlyPackage(Number(e.target.value))} className="w-full bg-industrial-dark border border-industrial-border rounded-lg p-2" />
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-xl border border-industrial-border flex flex-col justify-center gap-6">
          <div className="bg-industrial-dark p-6 rounded-lg border border-industrial-border relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h4 className="text-emerald-400 text-sm font-bold mb-2">Custo Frota Própria (Estimado)</h4>
            <div className="text-3xl font-bold text-white">R$ {(totalOwnCost / 1000000).toFixed(2)}M</div>
            <p className="text-slate-400 text-sm mt-2">{estimatedTrips} viagens estimadas</p>
          </div>
          
          <div className="bg-industrial-dark p-6 rounded-lg border border-industrial-border relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h4 className="text-cyan-400 text-sm font-bold mb-2">Custo Terceirizado (CIF)</h4>
            <div className="text-3xl font-bold text-white">R$ {(totalThirdPartyCost / 1000000).toFixed(2)}M</div>
          </div>

          <div className="p-4 bg-industrial-accent/10 border border-industrial-accent/20 rounded-lg flex items-center justify-between">
            <span className="font-bold text-white">Vantagem Própria vs Terceiro:</span>
            <span className={`font-bold text-lg ${totalThirdPartyCost > totalOwnCost ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {((totalThirdPartyCost - totalOwnCost) / 1000000).toFixed(2)}M
            </span>
          </div>
        </div>
      </div>
    </MainContent>
  );
}
