import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Search, 
  TrendingUp, 
  Zap, 
  Layers, 
  Clock, 
  Eye, 
  Table, 
  LayoutGrid, 
  ShieldCheck, 
  Activity, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown,
  Gauge,
  Sparkles,
  Info
} from 'lucide-react';
import { TreemapAsset } from '../types.ts';

interface TreemapTabProps {
  onOpenDossier: (asset: TreemapAsset) => void;
}

export const TreemapTab: React.FC<TreemapTabProps> = ({ onOpenDossier }) => {
  const [timeframe, setTimeframe] = useState<'1H' | '1D' | '1W'>('1D');
  const [projection, setProjection] = useState<'LIVE' | 'MENSAL' | 'ANUAL' | 'VISION_2030' | 'VISION_2040'>('LIVE');
  const [filterCategory, setFilterCategory] = useState<string>('TODAS');
  const [filterSubmarket, setFilterSubmarket] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [assets, setAssets] = useState<TreemapAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [potenciaTotalMw, setPotenciaTotalMw] = useState<number>(0);

  // Finviz UX Modes: Treemap vs Screener Table
  const [viewMode, setViewMode] = useState<'treemap' | 'screener'>('treemap');
  const [densityMode, setDensityMode] = useState<'normal' | 'ultra'>('ultra');

  // Screener Table Sort State
  const [sortField, setSortField] = useState<keyof TreemapAsset>('potencia_mw');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  useEffect(() => {
    fetchAssets();
  }, [timeframe, projection]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/treemap/assets?timeframe=${timeframe}&projection=${projection}`);
      const data = await res.json();
      setAssets(data.ativos || []);
      setPotenciaTotalMw(data.potencia_total_mw || 0);
    } catch (err) {
      console.error('Erro ao buscar ativos do treemap:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesCat = filterCategory === 'TODAS' || 
      (filterCategory === 'GC_HIDRICA' && a.categoria.includes('Hídrica')) ||
      (filterCategory === 'GC_SOLAR' && a.categoria.includes('GC Solar')) ||
      (filterCategory === 'GC_EOLICA' && a.categoria.includes('GC Eólica')) ||
      (filterCategory === 'GC_TERMICA' && (a.categoria.includes('Térmica') || a.categoria.includes('Nuclear'))) ||
      (filterCategory === 'MMGD_SOLAR' && a.categoria.includes('MMGD Solar')) ||
      (filterCategory === 'MMGD_OUTRAS' && a.categoria.includes('MMGD') && !a.categoria.includes('Solar'));

    const matchesSubmarket = filterSubmarket === 'TODOS' || a.submercado === filterSubmarket;

    const matchesSearch = searchTerm === '' || 
      (a.ticker && a.ticker.toLowerCase().includes(searchTerm.toLowerCase())) ||
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.uf.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.municipio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.operadora.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.despacho_status && a.despacho_status.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCat && matchesSubmarket && matchesSearch;
  });

  // Ordenação para o Screener
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string' && valA.endsWith('%')) {
      valA = parseFloat(valA.replace('%', ''));
    }
    if (typeof valB === 'string' && valB.endsWith('%')) {
      valB = parseFloat(valB.replace('%', ''));
    }

    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof TreemapAsset) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredTotalMw = filteredAssets.reduce((acc, a) => acc + a.potencia_mw, 0);

  // Retorna a variação correspondente ao timeframe ativo
  const getAssetVariation = (a: TreemapAsset) => {
    if (timeframe === '1H') return a.variacao_1h || a.variacao_periodo;
    if (timeframe === '1W') return a.variacao_1w || a.variacao_periodo;
    return a.variacao_1d || a.variacao_periodo;
  };

  // Cores Finviz Standard Heatmap
  const getFinvizBg = (variacaoStr: string) => {
    const val = parseFloat(variacaoStr.replace('%', ''));
    if (val >= 3.0) return 'bg-[#155724]/90 hover:bg-[#1b6d2f] border-[#28a745]/60 text-white';
    if (val > 1.0) return 'bg-[#1e7e34]/85 hover:bg-[#218838] border-[#28a745]/40 text-emerald-100';
    if (val > 0.0) return 'bg-[#2d5731]/80 hover:bg-[#346639] border-[#388e3c]/30 text-emerald-200';
    if (val === 0.0) return 'bg-[#2c323f]/80 hover:bg-[#373e4e] border-slate-600/40 text-slate-300';
    if (val > -1.5) return 'bg-[#5c242b]/80 hover:bg-[#6e2c34] border-[#d32f2f]/30 text-rose-200';
    return 'bg-[#721c24]/90 hover:bg-[#8b222c] border-[#dc3545]/60 text-white';
  };

  return (
    <div className="space-y-4">
      {/* Barra Superior de Controles e Filtros Finviz */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col xl:flex-row items-center justify-between gap-4">
        
        {/* Controles de Tempo & Projeções */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setViewMode('treemap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'treemap' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização Matriz Finviz (Treemap Proporcional em Blocos)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Treemap Matriz</span>
            </button>
            <button
              onClick={() => setViewMode('screener')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'screener' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização Tabela Screener com Todas as Métricas por Unidade"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Screener Tabela</span>
            </button>
          </div>

          {/* Timeframe Selector (1H, 1D, 1W) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <span className="text-slate-500 px-2 flex items-center gap-1 text-[11px]">
              <Clock className="w-3 h-3 text-cyan-400" />
              Período:
            </span>
            {(['1H', '1D', '1W'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-mono ${
                  timeframe === tf ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Densidade de Dados (Padrão vs Ultra-Denso Finviz Pro) */}
          {viewMode === 'treemap' && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <span className="text-slate-500 px-2 text-[11px]">Densidade:</span>
              <button
                onClick={() => setDensityMode('normal')}
                className={`px-2 py-1 rounded-lg transition text-[11px] cursor-pointer ${
                  densityMode === 'normal' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Padrão
              </button>
              <button
                onClick={() => setDensityMode('ultra')}
                className={`px-2 py-1 rounded-lg transition text-[11px] cursor-pointer ${
                  densityMode === 'ultra' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Exibe Ticker, Fator de Capacidade, Tensão e Status Operacional por Bloco"
              >
                ⚡ Ultra-Denso
              </button>
            </div>
          )}
        </div>

        {/* Projeções de Longo Prazo e Visões de Abundância */}
        <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold gap-1">
          <span className="text-slate-500 px-2 flex items-center gap-1 text-[11px]">
            <TrendingUp className="w-3 h-3 text-amber-400" />
            Cenário:
          </span>
          {[
            { id: 'LIVE', label: 'LIVE' },
            { id: 'MENSAL', label: 'MENSAL' },
            { id: 'ANUAL', label: 'ANUAL' },
            { id: 'VISION_2030', label: '⚡ BR 2030', special: true },
            { id: 'VISION_2040', label: '⚡ BR 2040 (20k kWh/capita)', special: true }
          ].map(proj => (
            <button
              key={proj.id}
              onClick={() => setProjection(proj.id as any)}
              className={`px-2.5 py-1 rounded-lg transition text-[11px] cursor-pointer ${
                projection === proj.id
                  ? proj.special
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm shadow-amber-400/30'
                    : 'bg-cyan-500 text-slate-950 font-bold'
                  : proj.special
                  ? 'text-amber-300 hover:bg-amber-400/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {proj.label}
            </button>
          ))}
        </div>

        {/* Busca, Filtros de Submercado e Categoria */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Ticker, Usina, UF, Operadora..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Submercados ONS */}
          <select
            value={filterSubmarket}
            onChange={e => setFilterSubmarket(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="TODOS">Todos Submercados</option>
            <option value="Sudeste/Centro-Oeste">Sudeste / Centro-Oeste</option>
            <option value="Nordeste">Nordeste</option>
            <option value="Sul">Sul</option>
            <option value="Norte">Norte</option>
          </select>

          {/* Categorias GC/GD */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="TODAS">Todas as Fontes (GC + MMGD)</option>
            <option value="GC_HIDRICA">Grandes Hídricas (GC)</option>
            <option value="GC_SOLAR">Usinas Solares Centralizadas (GC)</option>
            <option value="GC_EOLICA">Complexos Eólicos (GC)</option>
            <option value="GC_TERMICA">Térmicas & Nucleares (GC)</option>
            <option value="MMGD_SOLAR">Geração Distribuída Solar (ANEEL)</option>
            <option value="MMGD_OUTRAS">Geração Distribuída Outras (Eólica/CGH/Bio)</option>
          </select>
        </div>

      </div>

      {/* Banner Informativo Finviz com Métricas Agregadas */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>
            <strong className="text-slate-200">Padrão Finviz:</strong> Cada bloco é proporcional à capacidade instalada. 
            <span className="text-cyan-300 font-medium ml-1">Clique duplo ou clique no bloco para abrir o Dossiê Regulatório e Parecer de Acesso.</span>
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="text-slate-300">
            Ativos: <strong className="text-white font-bold">{filteredAssets.length}</strong> / {assets.length}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">
            Capacidade Filtrada: <strong className="text-emerald-400 font-bold">~{Math.round(filteredTotalMw).toLocaleString('pt-BR')} MW</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">
            Geração Anual Est.: <strong className="text-amber-400 font-bold">~{Math.round(filteredAssets.reduce((acc, a) => acc + (a.geracao_estimada_gwh_ano || 0), 0) / 1000).toLocaleString('pt-BR')} TWh</strong>
          </span>
        </div>
      </div>

      {/* Conteúdo Principal: Treemap Matriz vs Screener Tabela */}
      {loading ? (
        <div className="h-[600px] flex items-center justify-center bg-slate-950/60 rounded-2xl border border-slate-800">
          <div className="flex flex-col items-center gap-3 text-cyan-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            <span className="text-xs font-mono">Carregando matriz de ativos Finviz (tickers, despachos, tensões e FC%)...</span>
          </div>
        </div>
      ) : viewMode === 'treemap' ? (
        /* VISTA 1: FINVIZ TREEMAP COM MÁXIMA DENSIDADE DE DADOS */
        <div className="min-h-[660px] p-2 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner flex flex-wrap gap-1.5 content-start">
          {filteredAssets.map(asset => {
            const pct = (asset.potencia_mw / (filteredTotalMw || 1)) * 100;
            const variacaoAtiva = getAssetVariation(asset);
            const bgClass = getFinvizBg(variacaoAtiva);

            // Largura flexível e altura calculada por faixa de capacidade MW
            let flexBasis = 'calc(11% - 6px)';
            let minHeight = densityMode === 'ultra' ? '105px' : '90px';

            if (pct > 7) {
              flexBasis = 'calc(35% - 6px)';
              minHeight = densityMode === 'ultra' ? '210px' : '180px';
            } else if (pct > 4) {
              flexBasis = 'calc(25% - 6px)';
              minHeight = densityMode === 'ultra' ? '165px' : '140px';
            } else if (pct > 2) {
              flexBasis = 'calc(18% - 6px)';
              minHeight = densityMode === 'ultra' ? '135px' : '115px';
            } else if (pct > 1) {
              flexBasis = 'calc(14% - 6px)';
              minHeight = densityMode === 'ultra' ? '115px' : '100px';
            }

            const isPositive = variacaoAtiva.startsWith('+');

            return (
              <div
                key={asset.id}
                onDoubleClick={() => onOpenDossier(asset)}
                onClick={() => onOpenDossier(asset)}
                title={`Duplo clique para abrir dossiê: ${asset.nome} (${asset.potencia_mw} MW) - Ticker: ${asset.ticker}`}
                style={{ flex: `1 1 ${flexBasis}`, minHeight }}
                className={`relative p-2.5 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between group shadow-sm hover:scale-[1.015] hover:z-20 hover:shadow-cyan-500/30 ${bgClass}`}
              >
                {/* Linha Superior: Ticker Monospace, Submercado & Variação Finviz */}
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    {asset.ticker && (
                      <span className="font-mono font-black text-xs tracking-wider bg-black/40 px-1.5 py-0.5 rounded border border-white/20 text-yellow-300">
                        {asset.ticker}
                      </span>
                    )}
                    <span className="text-[10px] font-mono opacity-85 truncate">
                      {asset.uf} • {asset.submercado === 'Sudeste/Centro-Oeste' ? 'SE/CO' : asset.submercado}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-black whitespace-nowrap shadow-sm ${
                    isPositive ? 'bg-black/50 text-emerald-200 border border-emerald-400/40' : 'bg-black/50 text-rose-200 border border-rose-400/40'
                  }`}>
                    {variacaoAtiva}
                  </span>
                </div>

                {/* Nome do Ativo */}
                <div className="my-0.5">
                  <h4 className="text-xs font-black truncate leading-tight group-hover:text-white" title={asset.nome}>
                    {asset.nome}
                  </h4>
                  <div className="text-[10px] opacity-80 truncate">
                    {asset.operadora}
                  </div>
                </div>

                {/* Potência Central e FC */}
                <div className="my-0.5 flex items-baseline justify-between gap-1">
                  <div className="text-base sm:text-lg font-black tracking-tight leading-none font-mono text-white">
                    {asset.potencia_mw.toLocaleString('pt-BR')} <span className="text-[11px] font-normal opacity-80">MW</span>
                  </div>
                  {asset.fator_capacidade && (
                    <span className="text-[10px] font-mono font-bold px-1 py-0.2 rounded bg-black/35 text-cyan-200 border border-cyan-400/20" title="Fator de Capacidade Médio">
                      FC {asset.fator_capacidade}
                    </span>
                  )}
                </div>

                {/* Dados Extras no Modo Ultra-Denso */}
                {densityMode === 'ultra' && (
                  <div className="space-y-0.5 text-[9px] font-mono opacity-90 pt-1 border-t border-white/10">
                    <div className="flex items-center justify-between text-yellow-200/90 truncate">
                      <span className="truncate">{asset.tensao_kv || '230 kV'}</span>
                      <span className="truncate max-w-[50%] text-right">{asset.custo_tarifa?.split(' ')[0] || 'PLD'}</span>
                    </div>
                    {asset.despacho_status && (
                      <div className="text-[8.5px] truncate opacity-80" title={asset.despacho_status}>
                        {asset.despacho_status}
                      </div>
                    )}
                  </div>
                )}

                {/* Linha Inferior com Município e Botão Dossiê */}
                <div className="flex items-center justify-between text-[9px] opacity-80 pt-0.5">
                  <span className="truncate max-w-[70%]">{asset.municipio}</span>
                  <span className="font-mono text-cyan-200 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                    <Eye className="w-2.5 h-2.5" /> Dossiê
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA 2: FINVIZ SCREENER TABELA SORTABLE */
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                <tr>
                  <th onClick={() => handleSort('ticker')} className="p-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Ticker</span>
                      {sortField === 'ticker' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('nome')} className="p-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Ativo / Usina</span>
                      {sortField === 'nome' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('categoria')} className="p-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Categoria</span>
                      {sortField === 'categoria' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('submercado')} className="p-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Submercado</span>
                      {sortField === 'submercado' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('uf')} className="p-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>UF</span>
                      {sortField === 'uf' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('potencia_mw')} className="p-3 cursor-pointer hover:text-white text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Potência (MW)</span>
                      {sortField === 'potencia_mw' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('variacao_1d')} className="p-3 cursor-pointer hover:text-white text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>Var {timeframe}</span>
                      {sortField === 'variacao_1d' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('fator_capacidade')} className="p-3 cursor-pointer hover:text-white text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>FC %</span>
                      {sortField === 'fator_capacidade' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="p-3">Tensão Conexão</th>
                  <th className="p-3">Status Despacho ONS / Lei</th>
                  <th className="p-3">Tarifa / Custo</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
                {sortedAssets.map(asset => {
                  const varVal = getAssetVariation(asset);
                  const isPos = varVal.startsWith('+');

                  return (
                    <tr 
                      key={asset.id} 
                      className="hover:bg-slate-900/60 transition cursor-pointer"
                      onClick={() => onOpenDossier(asset)}
                    >
                      <td className="p-3 font-bold text-yellow-400 font-mono">
                        {asset.ticker || 'N/A'}
                      </td>
                      <td className="p-3 font-medium text-slate-100 font-sans">
                        <div className="truncate max-w-[220px]" title={asset.nome}>{asset.nome}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{asset.operadora}</div>
                      </td>
                      <td className="p-3 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px]">
                          {asset.categoria}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">
                        {asset.submercado || 'Nacional'}
                      </td>
                      <td className="p-3 font-bold text-cyan-400">
                        {asset.uf}
                      </td>
                      <td className="p-3 text-right font-bold text-white">
                        {asset.potencia_mw.toLocaleString('pt-BR')} MW
                      </td>
                      <td className={`p-3 text-right font-black ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {varVal}
                      </td>
                      <td className="p-3 text-center font-bold text-cyan-300">
                        {asset.fator_capacidade || 'N/D'}
                      </td>
                      <td className="p-3 text-slate-300 text-[11px]">
                        {asset.tensao_kv || '230 kV'}
                      </td>
                      <td className="p-3 text-slate-300 text-[11px]">
                        <span className="truncate block max-w-[180px]" title={asset.despacho_status}>
                          {asset.despacho_status || asset.status_regulatório}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 text-[11px]">
                        {asset.custo_tarifa || 'PLD Médio'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDossier(asset);
                          }}
                          className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-medium transition cursor-pointer"
                        >
                          Dossiê
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legenda de Cores Finviz Standard */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Escala Térmica Finviz:</span>
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <span className="px-2 py-0.5 rounded bg-[#721c24] text-white font-bold">&lt; -1.5%</span>
            <span className="px-2 py-0.5 rounded bg-[#5c242b] text-rose-200">-0.1% a -1.5%</span>
            <span className="px-2 py-0.5 rounded bg-[#2c323f] text-slate-300">0.0% Neutro</span>
            <span className="px-2 py-0.5 rounded bg-[#2d5731] text-emerald-200">0.0% a +1.0%</span>
            <span className="px-2 py-0.5 rounded bg-[#1e7e34] text-emerald-100">+1.0% a +3.0%</span>
            <span className="px-2 py-0.5 rounded bg-[#155724] text-white font-bold">&gt; +3.0%</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-amber-300 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Transição Energética BR 2040:
          </span>
          <span className="text-slate-300 text-[11px]">
            Demanda projetada de 20.000 kWh/hab/ano para computação de IA & Data Centers 100% Renováveis
          </span>
        </div>
      </div>

    </div>
  );
};
