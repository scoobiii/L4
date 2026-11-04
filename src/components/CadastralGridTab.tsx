import React, { useState, useEffect, useMemo } from 'react';
import { 
  Network, 
  MapPin, 
  Building2, 
  Zap, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Cpu, 
  ArrowRight, 
  Sun, 
  Layers, 
  Eye, 
  Compass, 
  HelpCircle,
  X,
  Gauge,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { BdgdRedeItem, SubestacaoTelemetria } from '../types.ts';

export const CadastralGridTab: React.FC = () => {
  const [redeItems, setRedeItems] = useState<BdgdRedeItem[]>([]);
  const [subestacoes, setSubestacoes] = useState<SubestacaoTelemetria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('TODOS');
  const [filtroBairro, setFiltroBairro] = useState<string>('TODOS');
  const [filtroInversao, setFiltroInversao] = useState<string>('TODOS');
  const [buscaTexto, setBuscaTexto] = useState<string>('');

  // Item selecionado para inspeção de circuito unifilar
  const [circuitoSelecionado, setCircuitoSelecionado] = useState<BdgdRedeItem | null>(null);
  const [horarioSimulacao, setHorarioSimulacao] = useState<'12:00' | '19:00'>('12:00');

  // Carrega dados do backend
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resSearch, resSes] = await Promise.all([
        fetch('/api/rede/search'),
        fetch('/api/rede/subestacoes')
      ]);

      if (!resSearch.ok || !resSes.ok) {
        throw new Error('Falha ao comunicar com os endpoints da rede cadastral BDGD');
      }

      const dataSearch = await resSearch.json();
      const dataSes = await resSes.json();

      setRedeItems(dataSearch.itens || []);
      setSubestacoes(dataSes.subestacoes || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados cadastrais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Lista de municípios únicos
  const municipiosDisponiveis = useMemo(() => {
    const setM = new Set<string>();
    redeItems.forEach(i => setM.add(i.municipio));
    return Array.from(setM).sort();
  }, [redeItems]);

  // Lista de bairros únicos conforme município selecionado
  const bairrosDisponiveis = useMemo(() => {
    const setB = new Set<string>();
    redeItems.forEach(i => {
      if (filtroMunicipio === 'TODOS' || i.municipio === filtroMunicipio) {
        setB.add(i.bairro);
      }
    });
    return Array.from(setB).sort();
  }, [redeItems, filtroMunicipio]);

  // Itens filtrados
  const itensFiltrados = useMemo(() => {
    return redeItems.filter(item => {
      if (filtroMunicipio !== 'TODOS' && item.municipio !== filtroMunicipio) return false;
      if (filtroBairro !== 'TODOS' && item.bairro !== filtroBairro) return false;
      if (filtroInversao !== 'TODOS') {
        if (filtroInversao === 'CRITICO' && !item.inversao_fluxo_risco.toLowerCase().includes('crítico')) return false;
        if (filtroInversao === 'MODERADO' && !item.inversao_fluxo_risco.toLowerCase().includes('moderado')) return false;
        if (filtroInversao === 'BAIXO' && !item.inversao_fluxo_risco.toLowerCase().includes('baixo')) return false;
      }
      if (buscaTexto.trim()) {
        const q = buscaTexto.toLowerCase();
        const match = 
          item.rua.toLowerCase().includes(q) ||
          item.quadra.toLowerCase().includes(q) ||
          item.bairro.toLowerCase().includes(q) ||
          item.municipio.toLowerCase().includes(q) ||
          item.trafo_codigo.toLowerCase().includes(q) ||
          item.subestacao_nome.toLowerCase().includes(q) ||
          item.cep.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [redeItems, filtroMunicipio, filtroBairro, filtroInversao, buscaTexto]);

  // Subestações filtradas
  const subestacoesFiltradas = useMemo(() => {
    if (filtroMunicipio === 'TODOS') return subestacoes;
    return subestacoes.filter(s => s.municipio === filtroMunicipio);
  }, [subestacoes, filtroMunicipio]);

  // Métricas agregadas do perímetro filtrado
  const metricasAgregadas = useMemo(() => {
    const totalTrafos = itensFiltrados.length;
    const somaCapKva = itensFiltrados.reduce((acc, i) => acc + i.trafo_cap_kva, 0);
    const somaDemandaPontaKw = itensFiltrados.reduce((acc, i) => acc + i.demanda_ponta_kw, 0);
    const somaGdKw = itensFiltrados.reduce((acc, i) => acc + i.potencia_gd_instalada_kw, 0);
    const totalUcs = itensFiltrados.reduce((acc, i) => acc + i.qtd_unidades_consumidoras, 0);
    const totalConexoesGd = itensFiltrados.reduce((acc, i) => acc + i.qtd_conexoes_gd, 0);
    const taxaUsoMedia = totalTrafos > 0 ? (itensFiltrados.reduce((acc, i) => acc + i.taxa_uso_percent, 0) / totalTrafos) : 0;
    const criticosCount = itensFiltrados.filter(i => i.inversao_fluxo_risco.toLowerCase().includes('crítico')).length;

    return {
      totalTrafos,
      somaCapKva,
      somaDemandaPontaKw,
      somaGdKw,
      totalUcs,
      totalConexoesGd,
      taxaUsoMedia: Math.round(taxaUsoMedia * 10) / 10,
      criticosCount
    };
  }, [itensFiltrados]);

  return (
    <div className="space-y-6">
      {/* Top Banner de Contexto e Legislação */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-800/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-400 border border-cyan-800">
                <Network className="w-3.5 h-3.5" />
                BDGD ANEEL — PRODIST MÓDULO 3
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-purple-950/60 text-purple-300 border border-purple-800/60">
                Resolução Normativa ANEEL nº 1.000/2021 (Art. 73)
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                Zero Mock • Topologia Real
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Explorador Cadastral & Topologia de Rede Elétrica
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Visibilidade física ponta a ponta do Sistema de Distribuição: navegue hierarquicamente por{' '}
              <strong className="text-cyan-400">Município ➔ Bairro ➔ Quadra ➔ Rua</strong>, audite a{' '}
              <strong className="text-amber-400">Subestação (SE)</strong> de atendimento, a{' '}
              <strong className="text-white">taxa de carregamento (%)</strong>, a capacidade nominal dos{' '}
              <strong className="text-emerald-400">transformadores MT/BT</strong>, demanda de pico e o status de{' '}
              <strong className="text-rose-400">Inversão de Fluxo de Potência</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={fetchData}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition text-xs font-bold cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
              Atualizar Telemetria
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros Hierárquicos (Município -> Bairro -> Quadra/Rua) */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>Filtro de Navegação Cadastral BDGD</span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Exibindo <span className="text-cyan-400 font-bold">{itensFiltrados.length}</span> circuitos de rua/quadra em{' '}
            <span className="text-white font-bold">{subestacoesFiltradas.length}</span> subestações
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Município */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              1. Município:
            </label>
            <select
              value={filtroMunicipio}
              onChange={(e) => {
                setFiltroMunicipio(e.target.value);
                setFiltroBairro('TODOS');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
            >
              <option value="TODOS">Todos os Municípios ({municipiosDisponiveis.length})</option>
              {municipiosDisponiveis.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Bairro */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              2. Bairro:
            </label>
            <select
              value={filtroBairro}
              onChange={(e) => setFiltroBairro(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-medium cursor-pointer"
            >
              <option value="TODOS">Todos os Bairros ({bairrosDisponiveis.length})</option>
              {bairrosDisponiveis.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Inversão de Fluxo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              3. Risco de Inversão de Fluxo:
            </label>
            <select
              value={filtroInversao}
              onChange={(e) => setFiltroInversao(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="CRITICO">⚠️ Crítico (Alerta Art. 73 REN 1000)</option>
              <option value="MODERADO">🟡 Moderado (Monitoramento)</option>
              <option value="BAIXO">🟢 Baixo (Carga Predominante)</option>
            </select>
          </div>

          {/* Busca Textual */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              4. Busca (Rua, Quadra, Trafo, CEP):
            </label>
            <div className="relative">
              <input
                type="text"
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                placeholder="Ex: Av. Indústrias, Einstein, TR-PIR..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Breadcrumb ativo */}
        <div className="flex items-center gap-2 pt-2 text-xs text-slate-400 overflow-x-auto">
          <span className="text-slate-500">Trilha:</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold">{filtroMunicipio}</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-semibold">{filtroBairro}</span>
          {buscaTexto && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                &quot;{buscaTexto}&quot;
              </span>
            </>
          )}
          {(filtroMunicipio !== 'TODOS' || filtroBairro !== 'TODOS' || filtroInversao !== 'TODOS' || buscaTexto) && (
            <button
              onClick={() => {
                setFiltroMunicipio('TODOS');
                setFiltroBairro('TODOS');
                setFiltroInversao('TODOS');
                setBuscaTexto('');
              }}
              className="ml-auto text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards de Resumo Elétrico */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Transformadores MT/BT</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {metricasAgregadas.totalTrafos} <span className="text-xs font-normal text-slate-400">unid.</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Capacidade Total: <strong className="text-cyan-300 font-mono">{metricasAgregadas.somaCapKva.toLocaleString('pt-BR')} kVA</strong>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Demanda de Ponta Medida</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-400 font-mono">
            {metricasAgregadas.somaDemandaPontaKw.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400">kW</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Taxa Média de Uso: <strong className="text-amber-300 font-mono">{metricasAgregadas.taxaUsoMedia}%</strong>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>MMGD Solar Instalada</span>
            <Sun className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-xl font-extrabold text-yellow-400 font-mono">
            {metricasAgregadas.somaGdKw.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400">kW</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Conexões Ativas: <strong className="text-yellow-300 font-mono">{metricasAgregadas.totalConexoesGd} geradores</strong>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Unidades Consumidoras</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">
            {metricasAgregadas.totalUcs.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400">UCs</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Circuitos em Alerta: <strong className="text-rose-400 font-mono">{metricasAgregadas.criticosCount}</strong>
          </div>
        </div>
      </div>

      {/* Bloco 1: Subestações de Atendimento (SEs) e Carregamento */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Subestações de Distribuição (SEs) — Telemetria de Carregamento & Capacidade Firme
              </h2>
              <p className="text-xs text-slate-400">
                Barramentos de Alta / Média Tensão que alimentam os circuitos urbanos e rurais cadastrados
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/60">
            {subestacoesFiltradas.length} Subestações Ativas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subestacoesFiltradas.map((se) => {
            const taxa = se.subestacao_taxa_uso_percent;
            const corTaxa = taxa > 85 ? 'text-rose-400' : taxa > 75 ? 'text-amber-400' : 'text-emerald-400';
            const corBarra = taxa > 85 ? 'bg-rose-500' : taxa > 75 ? 'bg-amber-500' : 'bg-emerald-500';

            return (
              <div 
                key={se.subestacao_nome}
                className="bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/50 rounded-xl p-4 transition-all duration-200 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {se.concessionaria} • {se.municipio}/{se.uf}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5 leading-snug">
                      {se.subestacao_nome}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 whitespace-nowrap">
                    {se.subestacao_tensao_kv}
                  </span>
                </div>

                {/* Barra de Taxa de Carregamento */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Taxa de Carregamento da SE:</span>
                    <span className={`font-mono font-extrabold ${corTaxa}`}>{taxa}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${corBarra} transition-all duration-500`} 
                      style={{ width: `${Math.min(100, taxa)}%` }}
                    />
                  </div>
                </div>

                {/* Métricas da Subestação */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Capacidade Firme</span>
                    <strong className="text-white font-mono">{se.subestacao_cap_mva} MVA</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Demanda Medida</span>
                    <strong className="text-amber-400 font-mono">{se.subestacao_demanda_mw} MW</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Margem Disponível GD</span>
                    <strong className="text-emerald-400 font-mono">+{se.subestacao_cap_disp_gd_mw} MW</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">GD Total Conectada</span>
                    <strong className="text-yellow-400 font-mono">{(se.total_gd_conectada_kw / 1000).toFixed(2)} MW</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Alimentadores MT: <strong className="text-slate-200">{se.total_alimentadores}</strong></span>
                  <span>Trafos MT/BT: <strong className="text-slate-200">{se.total_trafos_mt_bt}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bloco 2: Tabela Granular Cadastral (Município -> Bairro -> Quadra -> Rua -> Trafo -> GD) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Inventário Físico-Cadastral: Bairros, Quadras, Ruas & Transformadores
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Identificação do poste/cabine, potência kVA, medição na ponta, MMGD conectada e status regulatório
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Clique em <strong className="text-cyan-400 font-medium">Ver Diagrama</strong> para inspecionar o circuito elétrico unifilar.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Localização (Mun / Bairro)</th>
                <th className="px-4 py-3">Logradouro (Quadra / Rua / CEP)</th>
                <th className="px-4 py-3">Subestação & Alimentador</th>
                <th className="px-4 py-3">Trafo (Poste/Cabine)</th>
                <th className="px-4 py-3 text-right">Taxa Uso (%)</th>
                <th className="px-4 py-3 text-right">Demanda Ponta / FP</th>
                <th className="px-4 py-3 text-right">GD Solar (kW)</th>
                <th className="px-4 py-3">Risco Inversão (Art. 73)</th>
                <th className="px-4 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {itensFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    Nenhum circuito encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                itensFiltrados.map((item) => {
                  const isCritico = item.inversao_fluxo_risco.toLowerCase().includes('crítico');
                  const isModerado = item.inversao_fluxo_risco.toLowerCase().includes('moderado');

                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Localização */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          {item.municipio} <span className="text-slate-400 font-normal">({item.uf})</span>
                        </div>
                        <div className="text-[11px] text-purple-300 font-medium">{item.bairro}</div>
                      </td>

                      {/* Logradouro */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-200">{item.rua}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {item.quadra} • CEP {item.cep}
                        </div>
                      </td>

                      {/* Subestação & Alimentador */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-300">{item.subestacao_nome}</div>
                        <div className="text-[11px] text-cyan-400 font-mono">
                          Alim: {item.alimentador_codigo}
                        </div>
                      </td>

                      {/* Trafo */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-white font-mono flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-emerald-400" />
                          {item.trafo_codigo}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          <strong className="text-slate-200">{item.trafo_cap_kva} kVA</strong> • {item.tensao_fornecimento}
                        </div>
                      </td>

                      {/* Taxa Uso */}
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono">
                        <div className={`font-bold ${item.taxa_uso_percent > 85 ? 'text-rose-400' : item.taxa_uso_percent > 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {item.taxa_uso_percent}%
                        </div>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full ml-auto overflow-hidden mt-1">
                          <div 
                            className={`h-full ${item.taxa_uso_percent > 85 ? 'bg-rose-500' : item.taxa_uso_percent > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(100, item.taxa_uso_percent)}%` }}
                          />
                        </div>
                      </td>

                      {/* Demanda Ponta / Fora Ponta */}
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono">
                        <div className="text-amber-400 font-semibold">{item.demanda_ponta_kw} kW (P)</div>
                        <div className="text-[11px] text-slate-400">{item.demanda_fora_ponta_kw} kW (FP)</div>
                      </td>

                      {/* GD Solar */}
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono">
                        <div className="text-yellow-400 font-bold">{item.potencia_gd_instalada_kw} kW</div>
                        <div className="text-[11px] text-slate-400">
                          {item.qtd_conexoes_gd} conexões ({item.qtd_unidades_consumidoras} UCs)
                        </div>
                      </td>

                      {/* Risco Inversão */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          isCritico 
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80' 
                            : isModerado 
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80' 
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                        }`}>
                          {isCritico ? <AlertTriangle className="w-3 h-3 text-rose-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {item.inversao_fluxo_risco}
                        </span>
                      </td>

                      {/* Ação */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setCircuitoSelecionado(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition text-xs font-bold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Diagrama Unifilar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: DIAGRAMA ELÉTRICO UNIFILAR & ANÁLISE DE FLUXO DE POTÊNCIA */}
      {circuitoSelecionado && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in duration-200">
            {/* Cabeçalho do Modal */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-mono font-bold">
                    PRODIST MÓDULO 3 • TOPOLOGIA UNIFILAR
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium">
                    {circuitoSelecionado.concessionaria}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">
                  Diagrama Elétrico Unifilar: {circuitoSelecionado.rua}
                </h3>
                <p className="text-xs text-slate-400">
                  {circuitoSelecionado.quadra} • {circuitoSelecionado.bairro} • {circuitoSelecionado.municipio}/{circuitoSelecionado.uf} (CEP {circuitoSelecionado.cep})
                </p>
              </div>

              <button
                onClick={() => setCircuitoSelecionado(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulação de Horário Operacional (12:00 Sol Pleno vs 19:00 Noite de Pico) */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Simulador Operativo de Fluxo de Potência
                  </h4>
                  <p className="text-xs text-slate-400">
                    Alterne o horário para verificar se a injeção solar MMGD excede a demanda local e gera fluxo reverso (Inversão de Fluxo).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setHorarioSimulacao('12:00')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    horarioSimulacao === '12:00'
                      ? 'bg-yellow-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  12:00 (Pico Solar GD)
                </button>
                <button
                  onClick={() => setHorarioSimulacao('19:00')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    horarioSimulacao === '19:00'
                      ? 'bg-purple-600 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  19:00 (Pico Carga Noturna)
                </button>
              </div>
            </div>

            {/* Visualização Esquemática do Circuito Unifilar (Step-down de Tensão) */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Cadeia de Conexão Física (Alta Tensão ➔ Média Tensão ➔ Baixa Tensão)
              </div>

              {/* Diagrama Unifilar Interativo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* 1. SE Tronco */}
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2 relative">
                  <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center justify-between">
                    <span>1. Subestação SE</span>
                    <span>AT/MT</span>
                  </div>
                  <div className="text-xs font-bold text-white">{circuitoSelecionado.subestacao_nome}</div>
                  <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                    <div>Tensão: <strong className="text-slate-200">{circuitoSelecionado.subestacao_tensao_kv}</strong></div>
                    <div>Capacidade: <strong className="text-slate-200">{circuitoSelecionado.subestacao_cap_mva} MVA</strong></div>
                    <div>Demanda SE: <strong className="text-amber-400">{circuitoSelecionado.subestacao_demanda_mw} MW</strong></div>
                  </div>
                </div>

                {/* 2. Alimentador MT */}
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2 relative">
                  <div className="text-[10px] uppercase font-bold text-purple-400 flex items-center justify-between">
                    <span>2. Alimentador MT</span>
                    <span>13.8 kV</span>
                  </div>
                  <div className="text-xs font-bold text-white">{circuitoSelecionado.alimentador_codigo}</div>
                  <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                    <div>Extensão: <strong className="text-slate-200">Rede Aérea/Mista</strong></div>
                    <div>Proteção: <strong className="text-slate-200">Relé 50/51</strong></div>
                    <div>Disjuntor: <strong className="text-slate-200">Vácuo MT</strong></div>
                  </div>
                </div>

                {/* 3. Trafo Distribuição */}
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2 relative">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between">
                    <span>3. Trafo MT/BT</span>
                    <span>Poste/Cabine</span>
                  </div>
                  <div className="text-xs font-bold text-white">{circuitoSelecionado.trafo_codigo}</div>
                  <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                    <div>Potência: <strong className="text-emerald-300">{circuitoSelecionado.trafo_cap_kva} kVA</strong></div>
                    <div>Tensão: <strong className="text-slate-200">{circuitoSelecionado.tensao_fornecimento}</strong></div>
                    <div>Taxa Uso: <strong className="text-amber-300">{circuitoSelecionado.taxa_uso_percent}%</strong></div>
                  </div>
                </div>

                {/* 4. Barramento Rua/Quadra */}
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2 relative">
                  <div className="text-[10px] uppercase font-bold text-yellow-400 flex items-center justify-between">
                    <span>4. Barramento BT</span>
                    <span>Cargas & GD</span>
                  </div>
                  <div className="text-xs font-bold text-white">{circuitoSelecionado.rua}</div>
                  <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                    <div>UCs Atendidas: <strong className="text-slate-200">{circuitoSelecionado.qtd_unidades_consumidoras}</strong></div>
                    <div>GD Solar: <strong className="text-yellow-400">{circuitoSelecionado.potencia_gd_instalada_kw} kW</strong></div>
                    <div>Conexões GD: <strong className="text-slate-200">{circuitoSelecionado.qtd_conexoes_gd} geradores</strong></div>
                  </div>
                </div>
              </div>

              {/* Análise Numérica de Balanço no Horário Selecionado */}
              {(() => {
                const solMultiplier = horarioSimulacao === '12:00' ? 0.88 : 0.0;
                const cargaMultiplier = horarioSimulacao === '12:00' ? 0.45 : 1.0;

                const gdGerandoKw = Math.round(circuitoSelecionado.potencia_gd_instalada_kw * solMultiplier);
                const cargaConsumindoKw = Math.round(circuitoSelecionado.demanda_ponta_kw * cargaMultiplier);
                const saldoLiquidoKw = gdGerandoKw - cargaConsumindoKw; // Se positivo, há fluxo reverso!

                const haInversao = saldoLiquidoKw > 0;

                return (
                  <div className={`p-4 rounded-xl border ${haInversao ? 'bg-rose-950/40 border-rose-800/80 text-rose-200' : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'} space-y-2`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {haInversao ? (
                          <AlertTriangle className="w-5 h-5 text-rose-400" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        )}
                        <h5 className="font-extrabold text-sm text-white">
                          Balanço de Potência às {horarioSimulacao}:{' '}
                          {haInversao ? (
                            <span className="text-rose-400">FLUXO REVERSO ATIVO (+{saldoLiquidoKw} kW)</span>
                          ) : (
                            <span className="text-emerald-400">FLUXO DIRETO CONVENCIONAL ({saldoLiquidoKw} kW)</span>
                          )}
                        </h5>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
                        Geração GD: <strong className="text-yellow-400">{gdGerandoKw} kW</strong> | Consumo Local: <strong className="text-cyan-400">{cargaConsumindoKw} kW</strong>
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-300">
                      {haInversao ? (
                        <>
                          <strong className="text-rose-300">Enquadramento Art. 73 da REN ANEEL 1.000/2021:</strong> No horário das 12:00, a geração solar simultânea dos painéis ({gdGerandoKw} kW) supera o consumo local ({cargaConsumindoKw} kW). O excedente de <strong className="text-white">+{saldoLiquidoKw} kW</strong> sobe pelo transformador <strong className="text-white">{circuitoSelecionado.trafo_codigo}</strong> em direção ao alimentador de média tensão. A distribuidora exige análise de sobretensão, inversão de fluxo e pode propor armazenamento BESS ou restrição temporária.
                        </>
                      ) : (
                        <>
                          <strong className="text-emerald-300">Operação Equilibrada:</strong> No horário das {horarioSimulacao}, o consumo dos clientes da rua ({cargaConsumindoKw} kW) absorve toda a geração local. A rede opera com fluxo convencional de descida, sem risco de saturação nos relés de sobrecorrente.
                        </>
                      )}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Dossiê Técnico Cadastral */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-cyan-400 font-bold block uppercase text-[10px] tracking-wider">
                  Especificações do Transformador de Distribuição
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  <li className="flex justify-between">
                    <span className="text-slate-500">Código do Ativo BDGD:</span>
                    <strong className="text-white font-mono">{circuitoSelecionado.trafo_codigo}</strong>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Capacidade Nominal:</span>
                    <strong className="text-emerald-400 font-mono">{circuitoSelecionado.trafo_cap_kva} kVA</strong>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Tensão Primária / Secundária:</span>
                    <strong className="text-slate-200">{circuitoSelecionado.tensao_fornecimento}</strong>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Demanda Máxima Medida:</span>
                    <strong className="text-amber-400 font-mono">{circuitoSelecionado.demanda_ponta_kw} kW</strong>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Taxa de Carregamento Físico:</span>
                    <strong className="text-white font-mono">{circuitoSelecionado.taxa_uso_percent}%</strong>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-purple-400 font-bold block uppercase text-[10px] tracking-wider">
                  Auditoria de Geração Distribuída (MMGD)
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  <li className="flex justify-between">
                    <span className="text-slate-500">Usinas Conectadas no Trafo:</span>
                    <strong className="text-white font-mono">{circuitoSelecionado.qtd_conexoes_gd} unidades</strong>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Potência Total Injetada:</span>
                    <strong className="text-yellow-400 font-mono">{circuitoSelecionado.potencia_gd_instalada_kw} kW</strong>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Unidades Consumidoras na Quadra:</span>
                    <strong className="text-slate-200 font-mono">{circuitoSelecionado.qtd_unidades_consumidoras} UCs</strong>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Classificação Regulatória ANEEL:</span>
                    <strong className="text-white">{circuitoSelecionado.inversao_fluxo_risco}</strong>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-500">Coordenadas Georreferenciadas:</span>
                    <strong className="text-cyan-300 font-mono">{circuitoSelecionado.lat.toFixed(4)}, {circuitoSelecionado.lon.toFixed(4)}</strong>
                  </li>
                </ul>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setCircuitoSelecionado(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                Fechar Inspeção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
