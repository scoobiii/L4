import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Search, 
  Sparkles, 
  Info, 
  TrendingUp, 
  Zap, 
  Layers, 
  Sun, 
  Wind, 
  Droplet, 
  Flame, 
  Clock, 
  Eye
} from 'lucide-react';
import { TreemapAsset } from '../types.ts';

interface TreemapTabProps {
  onOpenDossier: (asset: TreemapAsset) => void;
}

export const TreemapTab: React.FC<TreemapTabProps> = ({ onOpenDossier }) => {
  const [timeframe, setTimeframe] = useState<'1H' | '1D' | '1W'>('1D');
  const [projection, setProjection] = useState<'LIVE' | 'MENSAL' | 'ANUAL' | 'VISION_2030' | 'VISION_2040'>('LIVE');
  const [filterCategory, setFilterCategory] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [assets, setAssets] = useState<TreemapAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [potenciaTotalMw, setPotenciaTotalMw] = useState<number>(0);

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

    const matchesSearch = searchTerm === '' || 
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.uf.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.municipio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.operadora.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCat && matchesSearch;
  });

  // Cálculo da soma filtrada para dimensionamento percentual relativo
  const filteredTotalMw = filteredAssets.reduce((acc, a) => acc + a.potencia_mw, 0);

  // Função para estilo de cores Finviz baseado na variação
  const getFinvizBg = (variacao: string) => {
    const val = parseFloat(variacao.replace('%', ''));
    if (val >= 3.0) return 'bg-emerald-600/80 hover:bg-emerald-500 border-emerald-400/50 text-white';
    if (val > 1.0) return 'bg-emerald-700/80 hover:bg-emerald-600 border-emerald-500/40 text-slate-100';
    if (val > 0.0) return 'bg-emerald-800/80 hover:bg-emerald-700 border-emerald-600/30 text-slate-200';
    if (val === 0.0) return 'bg-slate-800/80 hover:bg-slate-700 border-slate-600/30 text-slate-300';
    if (val > -1.5) return 'bg-rose-900/70 hover:bg-rose-800 border-rose-700/30 text-slate-200';
    return 'bg-rose-700/80 hover:bg-rose-600 border-rose-500/50 text-white';
  };

  return (
    <div className="space-y-4">
      {/* Barra de Controles e Filtros Superiores */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Controles de Tempo (st:) e Projeções */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <span className="text-slate-500 px-2 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              Tempo:
            </span>
            {(['1H', '1D', '1W'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  timeframe === tf ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Visões de Longo Prazo e Abundância */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold flex-wrap gap-1">
            <span className="text-slate-500 px-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              Projeção:
            </span>
            {[
              { id: 'LIVE', label: 'LIVE' },
              { id: 'MENSAL', label: 'MENSAL' },
              { id: 'ANUAL', label: 'ANUAL' },
              { id: 'VISION_2030', label: '⚡ BR VISION 2030', special: true },
              { id: 'VISION_2040', label: '⚡ BR VISION 2040 (20.000 kWh/capita)', special: true }
            ].map(proj => (
              <button
                key={proj.id}
                onClick={() => setProjection(proj.id as any)}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] cursor-pointer ${
                  projection === proj.id
                    ? proj.special
                      ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm shadow-amber-400/30'
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
        </div>

        {/* Busca e Filtros de Categoria */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar ativo, UF, município ou operadora..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
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

      {/* Banner Informativo Finviz */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>
            <strong>Dica de Interação:</strong> A área de cada bloco é estritamente proporcional à sua capacidade em Megawatts (MW). 
            <span className="text-cyan-300 font-medium ml-1">Dê um duplo clique em qualquer bloco para abrir a Ficha Técnica / Dossiê Regulatório.</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-300">
            Exibindo: <strong className="text-white font-mono">{filteredAssets.length}</strong> de <strong className="text-white font-mono">{assets.length}</strong> ativos
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">
            Soma Filtrada: <strong className="text-emerald-400 font-mono">~{Math.round(filteredTotalMw).toLocaleString('pt-BR')} MW</strong>
          </span>
        </div>
      </div>

      {/* Grid Proporcional Treemap Finviz-Style */}
      {loading ? (
        <div className="h-[600px] flex items-center justify-center bg-slate-950/60 rounded-2xl border border-slate-800">
          <div className="flex flex-col items-center gap-2 text-cyan-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            <span className="text-xs font-mono">Carregando matriz proporcional de ativos do SIN...</span>
          </div>
        </div>
      ) : (
        <div className="min-h-[640px] p-2 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner flex flex-wrap gap-1.5 content-start">
          {filteredAssets.map(asset => {
            // Proporção de tamanho visual calculada a partir do total
            const pct = (asset.potencia_mw / (filteredTotalMw || 1)) * 100;
            
            // Largura flexível baseada em MW
            let flexBasis = 'calc(10% - 6px)';
            let minHeight = '84px';

            if (pct > 7) {
              flexBasis = 'calc(35% - 6px)';
              minHeight = '180px';
            } else if (pct > 4) {
              flexBasis = 'calc(25% - 6px)';
              minHeight = '140px';
            } else if (pct > 2) {
              flexBasis = 'calc(18% - 6px)';
              minHeight = '110px';
            } else if (pct > 1) {
              flexBasis = 'calc(14% - 6px)';
              minHeight = '95px';
            }

            const isGC = asset.tipo.includes('Centralizada');
            const bgClass = getFinvizBg(asset.variacao_periodo);

            return (
              <div
                key={asset.id}
                onDoubleClick={() => onOpenDossier(asset)}
                onClick={() => onOpenDossier(asset)}
                title={`Duplo clique para abrir dossiê: ${asset.nome} (${asset.potencia_mw} MW)`}
                style={{ flex: `1 1 ${flexBasis}`, minHeight }}
                className={`relative p-2.5 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between group shadow-sm hover:scale-[1.01] hover:z-20 hover:shadow-cyan-500/20 ${bgClass}`}
              >
                {/* Header do Bloco */}
                <div className="flex items-start justify-between gap-1">
                  <div className="truncate pr-1">
                    <span className="text-[10px] font-mono opacity-80 uppercase block truncate">
                      {asset.uf} • {asset.categoria}
                    </span>
                    <h4 className="text-xs font-black truncate leading-tight group-hover:text-white">
                      {asset.nome}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono px-1 py-0.5 rounded font-bold whitespace-nowrap ${
                    asset.variacao_periodo.startsWith('+') ? 'bg-black/30 text-emerald-200' : 'bg-black/30 text-rose-200'
                  }`}>
                    {asset.variacao_periodo}
                  </span>
                </div>

                {/* Potência em Destaque */}
                <div className="my-1">
                  <div className="text-base sm:text-lg font-black tracking-tight leading-none font-mono">
                    {asset.potencia_mw.toLocaleString('pt-BR')} <span className="text-xs font-normal opacity-80">MW</span>
                  </div>
                  {asset.conexoes_total && (
                    <div className="text-[9px] opacity-75 mt-0.5 font-mono">
                      {asset.conexoes_total.toLocaleString('pt-BR')} conexões MMGD
                    </div>
                  )}
                </div>

                {/* Footer do Bloco com Tag e Dica */}
                <div className="flex items-center justify-between text-[9px] opacity-80 pt-1 border-t border-white/10">
                  <span className="truncate max-w-[70%]">{asset.municipio}</span>
                  <span className="font-mono text-cyan-200 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                    <Eye className="w-2.5 h-2.5" /> Ficha
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legenda de Cores Finviz */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Mapa de Calor Finviz:</span>
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <span className="px-2 py-0.5 rounded bg-rose-700 text-white font-bold">&lt; -1.5%</span>
            <span className="px-2 py-0.5 rounded bg-rose-900 text-slate-200">-0.1% a -1.5%</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">0.0% Neutro</span>
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-slate-200">0.0% a +1.0%</span>
            <span className="px-2 py-0.5 rounded bg-emerald-700 text-slate-100">+1.0% a +3.0%</span>
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">&gt; +3.0%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-cyan-400">⚡ Padrão Eletrointensivo BR VISION 2040:</span>
          <span className="text-slate-300 text-[11px]">Projeção para 20.000 kWh/habitante/ano (Transição Energética Total)</span>
        </div>
      </div>

    </div>
  );
};
