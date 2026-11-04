import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  LogIn, 
  CheckCircle2, 
  Zap, 
  BatteryCharging, 
  Cpu, 
  Flame, 
  TrendingUp, 
  Layers, 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  DollarSign, 
  Sparkles, 
  Activity, 
  Server, 
  Clock, 
  AlertTriangle,
  Eye 
} from 'lucide-react';

import { AuthUser } from '../types.ts';

interface CceeAgente {
  id: string;
  sigla: string;
  razao_social: string;
  categoria: string;
  submercado: string;
  garantia_financeira_brl: number;
  saldo_mcp_brl: number;
  curtailment_ativo_mwm: number;
}

interface CceeTransacao {
  id: string;
  data_hora: string;
  agente_vendedor: string;
  agente_comprador: string;
  tipo_transacao: string;
  volume_mwm: number;
  preco_mwh: number;
  submercado: string;
  status_cliq: string;
  hash_comprovante: string;
}

interface CurtailmentStats {
  volume_anual_estimado_twh: number;
  volume_mw_medio: number;
  quebra_por_fonte: {
    eolica_twh: number;
    solar_twh: number;
  };
  distribuicao_regional: {
    nordeste_percent: number;
    norte_percent: number;
    sudeste_centro_oeste_percent: number;
  };
  impacto_financeiro_geradores_brl: number;
  potencial_datacenter_ai: {
    capacidade_dc_suportavel_mw: number;
    clusters_gpus_h100_b200: string;
    emissao_diesel_evitada_litros_ano: number;
    co2_evitado_toneladas_ano: number;
  };
}

interface CceeCurtailmentTabProps {
  currentUser?: AuthUser | null;
  authToken?: string | null;
  openAuthModal?: () => void;
}

export const CceeCurtailmentTab: React.FC<CceeCurtailmentTabProps> = ({
  currentUser,
  authToken,
  openAuthModal
}) => {
  const [agentes, setAgentes] = useState<CceeAgente[]>([]);
  const [activeAgente, setActiveAgente] = useState<CceeAgente | null>(null);
  const [selectedAgenteId, setSelectedAgenteId] = useState<string>('AG-XAI-BR-01');
  const [transacoes, setTransacoes] = useState<CceeTransacao[]>([]);
  const [curtailmentStats, setCurtailmentStats] = useState<CurtailmentStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Parâmetros do Deal Studio xAI Data Center
  const [potenciaDcMw, setPotenciaDcMw] = useState<number>(250);
  const [autonomiaBessHoras, setAutonomiaBessHoras] = useState<number>(8);
  const [parqueGerador, setParqueGerador] = useState<string>('Complexo Solar Sertão da Bahia (1.200 MWp)');
  const [submercado, setSubmercado] = useState<string>('Nordeste');
  const [modeloConexao, setModeloConexao] = useState<string>('Behind-the-Meter Co-location');
  const [dealResult, setDealResult] = useState<any | null>(null);
  const [registeringDeal, setRegisteringDeal] = useState<boolean>(false);

  const fetchCceeData = async () => {
    setLoading(true);
    try {
      const [agRes, txRes, statRes] = await Promise.all([
        fetch('/api/ccee/agentes'),
        fetch('/api/ccee/transacoes'),
        fetch('/api/ccee/curtailment-stats')
      ]);

      const agData = await agRes.json();
      const txData = await txRes.json();
      const statData = await statRes.json();

      setAgentes(agData.agentes || []);
      setTransacoes(txData.transacoes || []);
      setCurtailmentStats(statData.curtailment_nacional || null);

      // Login inicial padrão como xAI
      if (agData.agentes && agData.agentes.length > 0) {
        const xai = agData.agentes.find((a: CceeAgente) => a.id === 'AG-XAI-BR-01') || agData.agentes[0];
        setActiveAgente(xai);
        setSelectedAgenteId(xai.id);
      }
    } catch (err) {
      console.error('Erro ao buscar dados da CCEE:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCceeData();
  }, []);

  const handleLogin = async (id: string) => {
    try {
      const res = await fetch('/api/ccee/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agenteId: id })
      });
      const data = await res.json();
      if (data.success) {
        setActiveAgente(data.agente);
        setSelectedAgenteId(data.agente.id);
      }
    } catch (err) {
      console.error('Erro ao efetuar login CCEE:', err);
    }
  };

  const handleRegisterDeal = async () => {
    setErrorMessage('');

    if (currentUser?.isVoyeur) {
      setErrorMessage('Acesso Restrito: Usuários em modo Voyeur possuem acesso isolado de somente leitura. Para formalizar contratos de Curtailment no CliqCCEE, faça login com uma credencial pré-cadastrada oficial na CCEE/ONS/ANEEL.');
      return;
    }

    setRegisteringDeal(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = authToken;
      }

      const res = await fetch('/api/ccee/curtailment-xai-deal', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          parque_gerador: parqueGerador,
          submercado,
          potencia_datacenter_mw: potenciaDcMw,
          autonomia_bess_horas: autonomiaBessHoras,
          modelo_conexao: modeloConexao
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar deal no CliqCCEE');
      }

      setDealResult(data.deal);

      // Recarrega transações para ver a nova no CliqCCEE
      const txRes = await fetch('/api/ccee/transacoes');
      const txData = await txRes.json();
      setTransacoes(txData.transacoes || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao registrar deal de curtailment.');
      console.error('Erro ao registrar deal de curtailment:', err);
    } finally {
      setRegisteringDeal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Modo Voyeur (Isolamento de Leitura) */}
      {currentUser?.isVoyeur && (
        <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-sky-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-sky-300 font-bold block text-sm">Acesso Isolado de Somente Leitura (Modo Voyeur)</strong>
              <span>Você pode auditar livremente todos os dados do SIN e simular estruturas de Curtailment, mas o envio de contratos ao CliqCCEE está restrito a agentes oficiais pré-cadastrados.</span>
            </div>
          </div>
          {openAuthModal && (
            <button
              onClick={openAuthModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs whitespace-nowrap transition cursor-pointer shadow-md shadow-amber-500/20"
            >
              Autenticar Agente Oficial CCEE
            </button>
          )}
        </div>
      )}

      {/* Alerta de Erro de Permissão / Validação */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage('')}
            className="text-rose-400 hover:text-white font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Barra de Identidade e Login de Agente CCEE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Portal de Agente CCEE — Mercado Livre (ACL)</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  CliqCCEE Síncrono
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Câmara de Comercialização de Energia Elétrica • Liquidação MCP, Contratos Bilaterais e Autoprodução
              </p>
            </div>
          </div>

          {/* Seletor de Login de Agente CCEE */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Logar como Agente:</span>
            <select
              value={selectedAgenteId}
              onChange={e => {
                setSelectedAgenteId(e.target.value);
                handleLogin(e.target.value);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {agentes.map(ag => (
                <option key={ag.id} value={ag.id}>
                  [{ag.sigla}] {ag.razao_social.substring(0, 40)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Card do Perfil do Agente Logado */}
        {activeAgente && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {activeAgente.sigla}
                </span>
                <span className="text-sm font-bold text-white">
                  {activeAgente.razao_social}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800">
                  {activeAgente.categoria}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Submercado Principal: <strong className="text-slate-200">{activeAgente.submercado}</strong> • ID Cadastro: <code className="text-cyan-400 font-mono">{activeAgente.id}</code>
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Garantia Financeira (MCP)</span>
                <span className="text-emerald-400 font-bold block mt-0.5">
                  R$ {(activeAgente.garantia_financeira_brl / 1000000).toFixed(1)} M
                </span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Saldo de Liquidação</span>
                <span className="text-cyan-400 font-bold block mt-0.5">
                  R$ {(activeAgente.saldo_mcp_brl / 1000000).toFixed(2)} M
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. O QUE SÃO AS TRANSAÇÕES REAIS POSSÍVEIS NA CCEE? */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Auditoria Regulatória: Quais Transações Reais Estão Disponíveis na CCEE?
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Sob o marco regulatório da ANEEL e os Procedimentos de Comercialização da CCEE, as seguintes transações financeiro-energéticas são válidas e operacionais no Brasil:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="font-bold text-cyan-400 block text-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              1. PPA Bilateral Livre (CliqCCEE)
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Compra e venda de energia no ACL com registro no CliqCCEE. Permite modulação horária, sazonalização flexível e precificação fixa ou indexada ao IPCA/PLD.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/30 space-y-2">
            <span className="font-bold text-amber-300 block text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              2. Autoprodução por Equiparação
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              <strong>Modelo padrão ouro para grandes Data Centers:</strong> Sob o Art. 26 da Lei 9.427/96, a xAI torna-se sócia acionista na SPE da usina, garantindo <strong>isenção legal de encargos setoriais (CDE, CCC, PROINFA)</strong>, gerando economia de até 35% na energia.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 space-y-2">
            <span className="font-bold text-emerald-300 block text-xs flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              3. PPA de Curtailment Dedicado
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Contrato de absorção de energia cortada (constrained-off) via conexão direta (Behind-the-Meter). A energia que seria desperdiçada pelo ONS é convertida em computação de IA a custo ultra-baixo.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="font-bold text-purple-400 block text-xs flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              4. Liquidação no Mercado MCP
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Valoração das sobras e déficits energéticos horários ao PLD (Preço de Liquidação de Diferenças) nos submercados Nordeste, Norte, Sudeste/CO e Sul.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="font-bold text-rose-400 block text-xs flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5" />
              5. Arbitragem com Storage (BESS)
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Carregamento do BESS em horários de PLD mínimo/curtailment (meio-dia) e injeção no SIN ou uso no DC durante o pico noturno (18h-21h), atuando como Usina Virtual (VPP).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="font-bold text-emerald-400 block text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              6. Certificados I-REC 24/7
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Rastreamento horário auditado (timestamped matching) comprovando que cada megawatt-hora consumido pelo cluster de IA teve origem solar ou eólica real no mesmo instante.
            </p>
          </div>
        </div>
      </div>

      {/* 3. AUDITORIA DO CURTAILMENT NACIONAL (~18 TWh CORTADOS) */}
      {curtailmentStats && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  O Drama do Curtailment no Brasil: ~{curtailmentStats.volume_anual_estimado_twh} TWh/ano Cortados pelo ONS
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Energia limpa gerada no Nordeste/Norte impedida de escoar para o Sudeste por gargalos nas linhas de transmissão tronco 500 kV
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Prejuízo Anual aos Geradores</span>
              <span className="text-base font-bold text-rose-400 font-mono">
                R$ {(curtailmentStats.impacto_financeiro_geradores_brl / 1000000000).toFixed(2)} Bilhões/ano
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Volume Cortado Total</span>
              <span className="text-xl font-bold text-amber-400 font-mono mt-0.5 block">
                {curtailmentStats.volume_anual_estimado_twh} <span className="text-xs font-normal">TWh/ano</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">~2.077 MW médios ininterruptos</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Origem das Fontes</span>
              <div className="space-y-1 mt-1 text-[11px]">
                <div className="flex justify-between text-emerald-300">
                  <span>Eólica (Ventos):</span>
                  <strong>{curtailmentStats.quebra_por_fonte.eolica_twh} TWh</strong>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>Solar (UFV):</span>
                  <strong>{curtailmentStats.quebra_por_fonte.solar_twh} TWh</strong>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Concentração Geográfica</span>
              <span className="text-xl font-bold text-purple-400 font-mono mt-0.5 block">
                {curtailmentStats.distribuicao_regional.nordeste_percent}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">No Submercado Nordeste</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Potencial Data Center IA</span>
              <span className="text-xl font-bold text-cyan-400 font-mono mt-0.5 block">
                {curtailmentStats.potencial_datacenter_ai.capacidade_dc_suportavel_mw} <span className="text-xs font-normal">MW</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">100% limpo com BESS</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. DEAL ARCHITECTURE STUDIO: COMO VENDER ESSE CURTAILMENT PARA xAI DATA CENTER */}
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                Deal Architecture Studio: Curtailment Renovável → xAI Data Center
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              100% Renovável • 100% Storage BESS • ZERO Gás Natural • ZERO Geradores a Diesel
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
              ESG Scope 1 = ZERO EMISSÕES
            </span>
          </div>
        </div>

        {/* Configuração dos Parâmetros do Acordo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Potência do Data Center (MW):</span>
              <span className="text-cyan-400 font-bold font-mono">{potenciaDcMw} MW</span>
            </label>
            <input
              type="range"
              min={50}
              max={1000}
              step={50}
              value={potenciaDcMw}
              onChange={e => setPotenciaDcMw(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>50 MW (Edge)</span>
              <span>250 MW (Grok DC)</span>
              <span>1 GW (GigaCluster)</span>
            </div>
          </div>

          <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <label className="text-slate-400 font-medium flex justify-between">
              <span>Autonomia BESS Storage (Horas):</span>
              <span className="text-purple-400 font-bold font-mono">{autonomiaBessHoras} Horas</span>
            </label>
            <input
              type="range"
              min={4}
              max={16}
              step={2}
              value={autonomiaBessHoras}
              onChange={e => setAutonomiaBessHoras(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>4h (Pico)</span>
              <span>8h (Noite Solar)</span>
              <span>16h (Ilha 100%)</span>
            </div>
          </div>

          <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <label className="text-slate-400 font-medium block">
              Parque Gerador com Curtailment:
            </label>
            <select
              value={parqueGerador}
              onChange={e => setParqueGerador(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="Complexo Solar Sertão da Bahia (1.200 MWp)">Complexo Solar Sertão da Bahia (1.200 MWp)</option>
              <option value="Complexo Eólico Ventos do Araripe (850 MW)">Complexo Eólico Ventos do Araripe (850 MW)</option>
              <option value="Complexo Solar Janaúba (1.200 MWp)">Complexo Solar Janaúba (1.200 MWp)</option>
              <option value="Cluster Híbrido Solar + Eólica Morro do Chapéu">Cluster Híbrido Solar + Eólica Morro do Chapéu</option>
            </select>
          </div>

          <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <label className="text-slate-400 font-medium block">
              Topologia de Conexão Física:
            </label>
            <select
              value={modeloConexao}
              onChange={e => setModeloConexao(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="Behind-the-Meter Co-location">Behind-the-Meter (Co-location na Subestação 230/500kV)</option>
              <option value="Linha Dedicada Privada 230kV">Linha Dedicada Privada 230kV</option>
              <option value="Virtual Microgrid com Despacho VPP">Virtual Microgrid com Despacho VPP</option>
            </select>
          </div>

        </div>

        {/* Botão de Registro do Acordo */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
          {currentUser?.isVoyeur && (
            <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>Modo Voyeur: Mutação bloqueada. Clique para simular resposta regulatória.</span>
            </span>
          )}
          <button
            onClick={handleRegisterDeal}
            disabled={registeringDeal}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg disabled:opacity-50 ${
              currentUser?.isVoyeur 
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700' 
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            <Sparkles className="w-4 h-4 fill-current" />
            {registeringDeal ? 'Estruturando Contrato CliqCCEE...' : currentUser?.isVoyeur ? 'Simular Validação CliqCCEE (Modo Voyeur)' : 'Estruturar & Registrar Deal xAI no CliqCCEE'}
          </button>
        </div>

        {/* Resultados Estruturados do Acordo Homologado */}
        {dealResult && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">
                  ✓ {dealResult.status}
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">
                  Termo de Autoprodução & PPA de Curtailment Dedicado — {potenciaDcMw} MW
                </h4>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono block">ID / Comprovante CliqCCEE:</span>
                <span className="text-xs font-mono font-bold text-cyan-300">{dealResult.hash_contrato}</span>
              </div>
            </div>

            {/* Grid de KPIs do Deal */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">BESS Dimensionado</span>
                <span className="text-lg font-bold text-purple-400 font-mono mt-0.5 block">
                  {dealResult.metricas.capacidade_bess_mwh.toLocaleString('pt-BR')} <span className="text-xs font-normal">MWh</span>
                </span>
                <span className="text-[9px] text-slate-500 font-mono">Baterias LFP de 8h</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Diesel Eliminado</span>
                <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
                  {(dealResult.metricas.litros_diesel_evitados_ano / 1000000).toFixed(1)} <span className="text-xs font-normal">M Litros/ano</span>
                </span>
                <span className="text-[9px] text-emerald-500 font-mono">ZERO Geradores Diesel</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Gás Natural Eliminado</span>
                <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
                  {(dealResult.metricas.m3_gas_natural_evitado_ano / 1000000).toFixed(1)} <span className="text-xs font-normal">M m³/ano</span>
                </span>
                <span className="text-[9px] text-emerald-500 font-mono">ZERO Peakers Fósseis</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">LCOE Curtailment</span>
                <span className="text-lg font-bold text-cyan-400 font-mono mt-0.5 block">
                  ${dealResult.metricas.lcoe_energia_curtailment_usd} <span className="text-xs font-normal">/MWh</span>
                </span>
                <span className="text-[9px] text-slate-500 font-mono">R$ 134/MWh no ACL</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Economia Anual xAI</span>
                <span className="text-lg font-bold text-amber-400 font-mono mt-0.5 block">
                  ${(dealResult.metricas.economia_anual_xai_usd / 1000000).toFixed(1)} <span className="text-xs font-normal">M/ano</span>
                </span>
                <span className="text-[9px] text-amber-400/80 font-mono">vs PPA Padrão</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Receita Nova Gerador</span>
                <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
                  R$ {(dealResult.metricas.receita_nova_gerador_brl / 1000000).toFixed(1)} <span className="text-xs font-normal">M/ano</span>
                </span>
                <span className="text-[9px] text-emerald-400/80 font-mono">Antes recebia R$ 0</span>
              </div>
            </div>

            {/* Como funciona na prática jurídica e física */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-cyan-400 block">
                Arquitetura Regulatória e Física do Deal (Passo a Passo Homologado):
              </span>
              <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
                <li>
                  <strong>1. Topologia Física Behind-the-Meter:</strong> O Data Center da xAI é construído em terreno adjacente à subestação coletora 230/500kV do parque solar/eólico. Um barramento dedicado bifluxo conecta os inversores/aerogeradores diretamente aos transformadores de entrada do Data Center e ao pátio de baterias BESS.
                </li>
                <li>
                  <strong>2. Ordem de Corte do ONS (Constrained-Off):</strong> Quando o ONS emite comando SCADA para cortar 250 MW de injeção na Rede Básica, o sistema de automação desvia a geração instantaneamente para alimentar os racks de servidores e carregar os 2.000 MWh de BESS, sem injetar 1 único watt na rede pública congestionada.
                </li>
                <li>
                  <strong>3. Isenção Legal de Encargos CDE:</strong> Por meio de uma Sociedade de Propósito Específico (SPE de Autoprodução por Equiparação - Art. 26 da Lei 9.427/96), a xAI possui participação no capital social da usina, garantindo 100% de isenção de Conta de Desenvolvimento Energético (CDE).
                </li>
                <li>
                  <strong>4. Zero Fóssil (100% Storage):</strong> A eliminação completa do diesel é garantida pela combinação de BESS modular LFP de 8 horas com inversores Grid-Forming, fornecendo inércia sintética, partida a frio (Black Start) e 99.999% de disponibilidade (Tier IV) sem queimar 1 gota de diesel ou gás natural.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 5. LIVRO DE TRANSAÇÕES CLIQCCEE EM TEMPO REAL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Livro de Transações Registradas no CliqCCEE & MCP ({transacoes.length} contratos)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditoria de contratos bilaterais, cessões e acordos de autoprodução de curtailment
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950 scrollbar-thin">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 font-bold">ID / Timestamp</th>
                <th className="p-3 font-bold">Vendedor</th>
                <th className="p-3 font-bold">Comprador</th>
                <th className="p-3 font-bold">Modalidade</th>
                <th className="p-3 font-bold">Volume</th>
                <th className="p-3 font-bold">Preço</th>
                <th className="p-3 font-bold">Submercado</th>
                <th className="p-3 font-bold">Status CliqCCEE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {transacoes.map((tx, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition">
                  <td className="p-3 text-cyan-300 font-bold whitespace-nowrap">
                    <div>{tx.id}</div>
                    <div className="text-[10px] text-slate-500">{tx.data_hora}</div>
                  </td>
                  <td className="p-3 text-amber-300 font-bold">{tx.agente_vendedor}</td>
                  <td className="p-3 text-purple-300 font-bold">{tx.agente_comprador}</td>
                  <td className="p-3 max-w-xs truncate text-slate-200" title={tx.tipo_transacao}>
                    {tx.tipo_transacao}
                  </td>
                  <td className="p-3 font-bold text-white whitespace-nowrap">
                    {tx.volume_mwm} MWm
                  </td>
                  <td className="p-3 text-emerald-400 font-bold whitespace-nowrap">
                    R$ {tx.preco_mwh.toFixed(2)}/MWh
                  </td>
                  <td className="p-3 text-slate-400">{tx.submercado}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {tx.status_cliq}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
