import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  AlertTriangle, 
  Zap, 
  ArrowRight, 
  TrendingDown, 
  Activity, 
  Sun, 
  Wind, 
  Droplet, 
  Flame, 
  Layers, 
  Clock, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { CargaPonto, DessemPonto } from '../types.ts';

export const OnsDessemTab: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('2024-05-15');
  const [timeframe, setTimeframe] = useState<'diario' | 'mensal' | 'anual' | 'maximo'>('diario');
  const [isBlackoutSimulation, setIsBlackoutSimulation] = useState<boolean>(false);
  const [cargaData, setCargaData] = useState<CargaPonto[]>([]);
  const [dessemData, setDessemData] = useState<DessemPonto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [duckCurveIntensity, setDuckCurveIntensity] = useState<string>('');

  // Validação estrita de restrição física de data (01/01/2018 a 31/12/2026)
  const minDate = '2018-01-01';
  const maxDate = '2026-12-31';

  const handleDateChange = (newDate: string) => {
    if (newDate < minDate) newDate = minDate;
    if (newDate > maxDate) newDate = maxDate;
    setSelectedDate(newDate);

    // Se o usuário selecionou a data histórica do apagão, ativa a simulação
    if (newDate === '2023-08-15') {
      setIsBlackoutSimulation(true);
    }
  };

  useEffect(() => {
    fetchOperationalData();
  }, [selectedDate, timeframe, isBlackoutSimulation]);

  const fetchOperationalData = async () => {
    setLoading(true);
    try {
      const cargaRes = await fetch(
        `/api/ons/carga?data=${selectedDate}&timeframe=${timeframe}&blackout=${isBlackoutSimulation ? '1' : '0'}`
      );
      const cargaJson = await cargaRes.json();
      setCargaData(cargaJson.pontos || []);

      const dessemRes = await fetch(`/api/dessem/balanco?data=${selectedDate}`);
      const dessemJson = await dessemRes.json();
      setDessemData(dessemJson.balanco_horario || []);
      setDuckCurveIntensity(dessemJson.curva_do_pato_intensidade || '');
    } catch (err) {
      console.error('Erro ao buscar dados operacionais ONS/DESSEM:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cálculo de máximos e mínimos para dimensionamento do gráfico de carga
  const maxCarga = Math.max(...cargaData.map(p => Math.max(p.verificada_mw, p.programada_mw)), 90000);
  const minCarga = Math.min(...cargaData.map(p => Math.min(p.verificada_mw, p.programada_mw)), 40000);

  // Máximo do DESSEM para escala de altura
  const maxDessem = Math.max(...dessemData.map(p => p.carga_total_mw), 95000);

  // Ano atual da consulta
  const selectedYear = parseInt(selectedDate.split('-')[0], 10) || 2024;

  return (
    <div className="space-y-6">
      
      {/* Barra de Controle Operacional ONS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Seletor de Timeframe */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Resolução:
          </span>
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'diario', label: 'Diário (Semi-horário)' },
              { id: 'mensal', label: 'Mensal (Média Diária)' },
              { id: 'anual', label: 'Anual (Sazonal)' },
              { id: 'maximo', label: 'Recordes Históricos (Máximo)' }
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id as any)}
                className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                  timeframe === tf.id ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Seletor de Data & Simulação do Apagão */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <label className="text-slate-400 font-medium">Data (2018 a 2026):</label>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={selectedDate}
              onChange={e => handleDateChange(e.target.value)}
              className="bg-transparent text-slate-100 font-mono text-xs focus:outline-none cursor-pointer"
            />
          </div>

          {/* Botão de Atalho para o Apagão de 15/08/2023 */}
          <button
            onClick={() => {
              setSelectedDate('2023-08-15');
              setIsBlackoutSimulation(!isBlackoutSimulation);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              isBlackoutSimulation
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md shadow-rose-500/20'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            {isBlackoutSimulation ? '⚠️ Simulação Apagão 15/08/2023 [ATIVADA]' : 'Simular Apagão de 15/08/2023'}
          </button>
        </div>

      </div>

      {/* Alerta de Simulação de Apagão quando ativado */}
      {isBlackoutSimulation && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 text-rose-200 flex items-start gap-3 animate-fadeIn">
          <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-sm text-rose-300">
              Cenário de Instabilidade SIN: Apagão Nacional de 15 de Agosto de 2023
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Às <strong>08:30:44</strong> ocorreu a abertura da linha de transmissão 500 kV Quixadá-Fortaleza II no Ceará. 
              Devido à alta concentração de geração eólica e solar no Nordeste e baixa inércia síncrona, a taxa de variação de frequência (RoCoF) foi extrema, disparando o <strong>Esquema Regional de Alívio de Carga (ERAC)</strong>. 
              O SIN perdeu instantaneamente <strong>~19.000 MW</strong> de carga (de 78.200 MW para 55.400 MW). O gráfico abaixo ilustra com precisão o vale verificado vs. programado.
            </p>
          </div>
        </div>
      )}

      {/* 1. Curva de Carga do Sistema Interligado Nacional (SIN) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Curva de Carga Horária do SIN (Carga Verificada vs Programada ONS)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Data de Referência: <span className="text-cyan-300 font-mono font-bold">{selectedDate}</span> • Resolução Semi-horária (48 pontos de medição)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-3 h-1 bg-cyan-400 rounded-full inline-block"></span>
              Carga Verificada (Real)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-1 bg-slate-500 rounded-full inline-block border-dashed"></span>
              Carga Programada (Teórica)
            </span>
          </div>
        </div>

        {/* Visualizador Gráfico de Carga em CSS / SVG Interativo */}
        <div className="relative h-64 bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col justify-between overflow-hidden">
          
          {/* Linhas de Grade de MW */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
            <div className="border-b border-slate-600 flex justify-between text-[10px] text-slate-400">
              <span>{Math.round(maxCarga).toLocaleString('pt-BR')} MW</span>
            </div>
            <div className="border-b border-slate-600 flex justify-between text-[10px] text-slate-400">
              <span>{Math.round((maxCarga + minCarga) / 2).toLocaleString('pt-BR')} MW</span>
            </div>
            <div className="border-b border-slate-600 flex justify-between text-[10px] text-slate-400">
              <span>{Math.round(minCarga).toLocaleString('pt-BR')} MW</span>
            </div>
          </div>

          {/* Barras e Linha de Curva Semi-horária */}
          <div className="relative h-full flex items-end gap-1 pt-6 z-10">
            {cargaData.map((pt, idx) => {
              const range = maxCarga - minCarga || 1;
              const heightVer = Math.max(10, ((pt.verificada_mw - minCarga) / range) * 100);
              const heightProg = Math.max(10, ((pt.programada_mw - minCarga) / range) * 100);

              const isDip = isBlackoutSimulation && idx >= 17 && idx <= 21;

              return (
                <div
                  key={idx}
                  className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                >
                  {/* Tooltip Hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 border border-slate-700 text-slate-200 text-[10px] p-2 rounded-lg shadow-2xl z-30 pointer-events-none whitespace-nowrap">
                    <span className="font-bold text-cyan-300 font-mono">{pt.hora}</span>
                    <span>Verificada: <strong className="text-white">{pt.verificada_mw.toLocaleString('pt-BR')} MW</strong></span>
                    <span>Programada: <strong className="text-slate-400">{pt.programada_mw.toLocaleString('pt-BR')} MW</strong></span>
                    <span>Delta: <strong className={pt.delta_mw >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{pt.delta_mw} MW</strong></span>
                  </div>

                  {/* Barra da Carga Verificada */}
                  <div
                    style={{ height: `${heightVer}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      isDip 
                        ? 'bg-rose-500 shadow-lg shadow-rose-500/50 animate-pulse' 
                        : 'bg-cyan-500/70 group-hover:bg-cyan-400'
                    }`}
                  ></div>

                  {/* Indicador de Hora a cada 4 pontos */}
                  {idx % 6 === 0 && (
                    <span className="text-[9px] text-slate-500 font-mono mt-1 absolute -bottom-5">
                      {pt.hora}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* 2. Balanço Energético Horário DESSEM (Duck Curve Analysis) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                Balanço Energético Horário DESSEM (Despacho Físico por Fonte)
              </h3>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold border ${
                selectedYear >= 2024 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}>
                Curva do Pato: {duckCurveIntensity} (Ano {selectedYear})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Despacho programado pelo modelo de curtíssimo prazo DESSEM do ONS (Hídrica, Térmica, Eólica e Solar)
            </p>
          </div>

          {/* Legenda de Fontes */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Hídrica
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-3 h-3 bg-amber-400 rounded-sm"></span> Solar (GD + GC)
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Eólica
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-3 h-3 bg-rose-500 rounded-sm"></span> Térmica
            </span>
          </div>
        </div>

        {/* Gráfico de Barras Empilhadas do Balanço Horário (24h) */}
        <div className="relative h-72 bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col justify-between overflow-hidden">
          
          <div className="relative h-full flex items-end gap-1.5 pt-4 z-10">
            {dessemData.map((d, i) => {
              const hidHeight = (d.hidraulica_mw / maxDessem) * 100;
              const solHeight = (d.solar_mw / maxDessem) * 100;
              const eolHeight = (d.eolica_mw / maxDessem) * 100;
              const terHeight = (d.termica_mw / maxDessem) * 100;

              return (
                <div
                  key={i}
                  className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                >
                  {/* Tooltip do Despacho */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 border border-slate-700 text-slate-200 text-[10px] p-2.5 rounded-xl shadow-2xl z-30 pointer-events-none whitespace-nowrap space-y-0.5">
                    <span className="font-bold text-amber-400 font-mono">{d.hora}</span>
                    <span className="text-blue-300">Hídrica: <strong>{d.hidraulica_mw.toLocaleString('pt-BR')} MW</strong></span>
                    <span className="text-amber-300">Solar: <strong>{d.solar_mw.toLocaleString('pt-BR')} MW</strong></span>
                    <span className="text-emerald-300">Eólica: <strong>{d.eolica_mw.toLocaleString('pt-BR')} MW</strong></span>
                    <span className="text-rose-300">Térmica: <strong>{d.termica_mw.toLocaleString('pt-BR')} MW</strong></span>
                    <div className="pt-1 border-t border-slate-700 text-white font-bold">
                      Total: {d.carga_total_mw.toLocaleString('pt-BR')} MW
                    </div>
                  </div>

                  {/* Barras Empilhadas */}
                  <div className="w-full flex flex-col justify-end">
                    {/* Térmica (Topo) */}
                    <div style={{ height: `${terHeight}%` }} className="w-full bg-rose-600/80 rounded-t-sm"></div>
                    {/* Eólica */}
                    <div style={{ height: `${eolHeight}%` }} className="w-full bg-emerald-600/80"></div>
                    {/* Solar (Meio do dia) */}
                    <div style={{ height: `${solHeight}%` }} className="w-full bg-amber-400"></div>
                    {/* Hídrica (Base) */}
                    <div style={{ height: `${hidHeight}%` }} className="w-full bg-blue-600/80"></div>
                  </div>

                  {/* Rótulo de Hora */}
                  <span className="text-[9px] text-slate-500 font-mono mt-1">
                    {d.hora.split(':')[0]}h
                  </span>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* 3. Ponte de Navegação Regulatória: ANEEL vs ONS */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Ponte de Navegação: Como a Geração Distribuída (ANEEL) redefine o DESSEM (ONS)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="font-bold text-amber-400 block text-xs">
              1. A Formação da "Curva do Pato" (Duck Curve)
            </span>
            <p className="leading-relaxed">
              O crescimento da MMGD Solar (dados da ANEEL em MG, SP, BA, PR) injeta energia diretamente nas redes de distribuição em baixa e média tensão. 
              Para o ONS, essa energia aparece como uma redução da carga líquida do sistema entre 09:00 e 15:00. O modelo DESSEM é forçado a rebaixar a geração das usinas hidrelétricas para evitar sobreoferta de energia e preços negativos de PLD.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="font-bold text-cyan-400 block text-xs">
              2. O Desafio da Rampa Noturna (Ramp-Up às 18:00)
            </span>
            <p className="leading-relaxed">
              Às 18h, com o pôr do sol, os mais de 30.000 MW de geração solar somem em menos de 60 minutos, exatamente no momento em que a população brasileira chega em casa e liga iluminação e ar-condicionado. 
              O ONS precisa despachar hidrelétricas com turbinas Francis e termelétricas de partida rápida para subir até 25.000 MW/hora em rampa rápida.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
