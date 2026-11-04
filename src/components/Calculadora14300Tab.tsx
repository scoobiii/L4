import React, { useState } from 'react';
import { 
  Calculator, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Info, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';

export const Calculadora14300Tab: React.FC = () => {
  // Parâmetros de Entrada
  const [potenciaKw, setPotenciaKw] = useState<number>(10);
  const [consumoMensalKwh, setConsumoMensalKwh] = useState<number>(1200);
  const [tarifaBase, setTarifaBase] = useState<number>(0.92); // R$/kWh
  const [taxaSimultaneidade, setTaxaSimultaneidade] = useState<number>(35); // %
  const [anoConexao, setAnoConexao] = useState<number>(2024);
  const [modalidade, setModalidade] = useState<'LOCAL' | 'REMOTO_ATE_500' | 'REMOTO_MAIOR_500' | 'COMPARTILHADA'>('LOCAL');
  const [custoInstalacaoKw, setCustoInstalacaoKw] = useState<number>(3600); // R$/kWp instalado

  // Geração mensal estimada (base de 125 kWh/kWp/mês média BR)
  const geracaoMensalKwh = potenciaKw * 125;
  const energiaInjetadaKwh = geracaoMensalKwh * (1 - taxaSimultaneidade / 100);
  const energiaSimultaneaKwh = geracaoMensalKwh * (taxaSimultaneidade / 100);

  // Determinação do Enquadramento Regulatório
  let faixaRegulatoria = 'GD II';
  let descricaoEnquadramento = 'Regra de Transição Gradativa (Fio B)';
  let isGd1 = false;
  let isGd3 = false;

  if (anoConexao <= 2022) {
    faixaRegulatoria = 'GD I';
    descricaoEnquadramento = 'Direito Adquirido até 31/12/2045 (Isenção de Fio B)';
    isGd1 = true;
  } else if (modalidade === 'REMOTO_MAIOR_500' || potenciaKw > 500) {
    faixaRegulatoria = 'GD III';
    descricaoEnquadramento = 'Autoconsumo Remoto > 500 kW (Fio B Escalonado + 40% Fio A + TFSEE + P&D)';
    isGd3 = true;
  }

  // Tabela de escalonamento do Fio B da Lei 14.300
  const tabelaFioB: Record<number, number> = {
    2023: 0.15,
    2024: 0.30,
    2025: 0.45,
    2026: 0.60,
    2027: 0.75,
    2028: 0.90,
    2029: 1.00
  };

  // Percentual do Fio B aplicável no ano atual
  const percentualFioBAtual = isGd1 ? 0 : (tabelaFioB[anoConexao] ?? (anoConexao > 2029 ? 1.0 : 0.60));

  // O componente do Fio B representa tipicamente 28% da tarifa cheia da distribuidora
  const tarifaFioBIntegral = tarifaBase * 0.28;
  const tarifaFioBCobrada = tarifaFioBIntegral * percentualFioBAtual;

  // Custo mensal e anual do Fio B
  const custoFioBMensal = isGd1 ? 0 : energiaInjetadaKwh * tarifaFioBCobrada;
  const custoFioBAnual = custoFioBMensal * 12;

  // Encargos extras para GD III (40% do Fio A + TFSEE + P&D ~ 8% da tarifa)
  const custoExtraGd3Anual = isGd3 ? (energiaInjetadaKwh * (tarifaBase * 0.08) * 12) : 0;

  // Economia bruta sem Fio B
  const economiaBrutaAnual = Math.min(geracaoMensalKwh, consumoMensalKwh) * tarifaBase * 12;

  // Economia Líquida Anual
  const economiaLiquidaAnual = Math.max(0, economiaBrutaAnual - custoFioBAnual - custoExtraGd3Anual);

  // Investimento Total Estimado
  const investimentoTotal = potenciaKw * custoInstalacaoKw;

  // Payback Simples em Anos
  const paybackAnos = economiaLiquidaAnual > 0 ? (investimentoTotal / economiaLiquidaAnual).toFixed(1) : 'N/A';

  // Economia acumulada em 10 e 25 anos
  const economia10Anos = economiaLiquidaAnual * 10;
  const economia25Anos = economiaLiquidaAnual * 25;

  return (
    <div className="space-y-6">
      
      {/* Header da Calculadora */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Calculadora Regulatória Lei 14.300/2022</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Marco Legal MMGD
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulação tarifária de transição do Fio B (TUSD), enquadramento GD I / GD II / GD III e Payback
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              Status Regulatório: <strong className="text-amber-400 font-mono">{faixaRegulatoria}</strong>
            </span>
          </div>
        </div>

        {/* Formulário de Parâmetros de Entrada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          
          {/* Potência */}
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Potência Instalada (kW):</span>
              <span className="text-amber-400 font-bold font-mono">{potenciaKw} kW</span>
            </label>
            <input
              type="range"
              min={1}
              max={1000}
              step={1}
              value={potenciaKw}
              onChange={e => setPotenciaKw(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1 kW (Micro)</span>
              <span>75 kW</span>
              <span>1.000 kW (Mini)</span>
            </div>
          </div>

          {/* Consumo Mensal */}
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Consumo Mensal Médio (kWh):</span>
              <span className="text-cyan-400 font-bold font-mono">{consumoMensalKwh} kWh</span>
            </label>
            <input
              type="range"
              min={100}
              max={25000}
              step={50}
              value={consumoMensalKwh}
              onChange={e => setConsumoMensalKwh(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>100 kWh</span>
              <span>10.000 kWh</span>
              <span>25.000 kWh</span>
            </div>
          </div>

          {/* Tarifa Base Distribuidora */}
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Tarifa Base Distribuidora (R$/kWh):</span>
              <span className="text-emerald-400 font-bold font-mono">R$ {tarifaBase.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0.50}
              max={1.50}
              step={0.01}
              value={tarifaBase}
              onChange={e => setTarifaBase(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>R$ 0,50 (CPFL/Equatorial)</span>
              <span>R$ 0,92 (Cemig)</span>
              <span>R$ 1,50 (Ponta)</span>
            </div>
          </div>

          {/* Taxa de Simultaneidade */}
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Taxa de Simultaneidade (% no instante do sol):</span>
              <span className="text-purple-400 font-bold font-mono">{taxaSimultaneidade}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={taxaSimultaneidade}
              onChange={e => setTaxaSimultaneidade(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (100% Injetada)</span>
              <span>35% (Residencial)</span>
              <span>80% (Comercial)</span>
            </div>
          </div>

          {/* Ano do Protocolo de Conexão */}
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Ano de Conexão / Protocolo:</span>
              <span className="text-amber-300 font-bold font-mono">{anoConexao}</span>
            </label>
            <select
              value={anoConexao}
              onChange={e => setAnoConexao(parseInt(e.target.value, 10))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value={2022}>Até 06/01/2023 (Direito Adquirido GD I)</option>
              <option value={2023}>2023 (GD II - 15% Fio B)</option>
              <option value={2024}>2024 (GD II - 30% Fio B)</option>
              <option value={2025}>2025 (GD II - 45% Fio B)</option>
              <option value={2026}>2026 (GD II - 60% Fio B)</option>
              <option value={2027}>2027 (GD II - 75% Fio B)</option>
              <option value={2028}>2028 (GD II - 90% Fio B)</option>
              <option value={2029}>2029 em diante (100% Fio B)</option>
            </select>
          </div>

          {/* Modalidade de Compensação */}
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label className="text-slate-400 font-medium block">
              Modalidade Regulatória:
            </label>
            <select
              value={modalidade}
              onChange={e => setModalidade(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="LOCAL">Junto à Carga / Local</option>
              <option value="REMOTO_ATE_500">Autoconsumo Remoto (≤ 500 kW)</option>
              <option value="REMOTO_MAIOR_500">Autoconsumo Remoto (&gt; 500 kW - GD III)</option>
              <option value="COMPARTILHADA">Geração Compartilhada (Consórcio/Cooperativa)</option>
            </select>
          </div>

        </div>

      </div>

      {/* Resultados Analíticos do Enquadramento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card Enquadramento */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Enquadramento ANEEL</span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {faixaRegulatoria}
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-snug">
              {descricaoEnquadramento}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Fio B Aplicável: <strong className="text-white font-mono">{(percentualFioBAtual * 100).toFixed(0)}%</strong>
          </div>
        </div>

        {/* Card Custo Fio B Anual */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Custo do Fio B Estimado</span>
            <div className="text-2xl font-black text-rose-400 font-mono mt-1">
              R$ {Math.round(custoFioBAnual).toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400">/ano</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Mensal: R$ {Math.round(custoFioBMensal).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            {isGd1 ? 'Isento até 2045' : `Sobre ${Math.round(energiaInjetadaKwh)} kWh injetados`}
          </div>
        </div>

        {/* Card Economia Líquida Anual */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Economia Líquida Real</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              R$ {Math.round(economiaLiquidaAnual).toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400">/ano</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Mensal: R$ {Math.round(economiaLiquidaAnual / 12).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Livre de Fio B e encargos
          </div>
        </div>

        {/* Card Payback Estimado */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Payback Estimado</span>
            <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
              {paybackAnos} <span className="text-xs font-normal text-slate-400">anos</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Capex Total: R$ {Math.round(investimentoTotal).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            ROI 25 Anos: <strong className="text-emerald-400 font-mono">R$ {Math.round(economia25Anos - investimentoTotal).toLocaleString('pt-BR')}</strong>
          </div>
        </div>

      </div>

      {/* Escalonamento Oficial do Fio B até 2029 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          Cronograma de Transição do Fio B (Artigo 27 da Lei 14.300)
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {Object.entries(tabelaFioB).map(([anoStr, pct]) => {
            const yr = parseInt(anoStr, 10);
            const isSelected = yr === anoConexao;
            return (
              <div
                key={yr}
                className={`p-3 rounded-xl border text-center transition ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <span className="text-xs font-mono text-slate-400 block">{yr}</span>
                <span className="text-base font-bold text-white font-mono mt-1 block">
                  {(pct * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  do Fio B
                </span>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Entendimento Regulatório:</strong> O Fio B remunera a distribuidora pelo uso físico dos cabos, postes e transformadores locais. 
            A energia consumida simultaneamente (Taxa de Simultaneidade de {taxaSimultaneidade}%) é <strong>100% isenta de Fio B</strong> em qualquer modalidade ou ano, pois não chega a trafegar pela rede da concessionária.
          </p>
        </div>
      </div>

    </div>
  );
};
