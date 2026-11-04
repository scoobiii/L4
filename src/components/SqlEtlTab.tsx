import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Play, 
  RefreshCw, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Copy, 
  Clock, 
  Table as TableIcon,
  HardDrive
} from 'lucide-react';
import { SqlQueryResult, EtlStatus } from '../types.ts';

export const SqlEtlTab: React.FC = () => {
  const [status, setStatus] = useState<EtlStatus | null>(null);
  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT sig_uf, nom_municipio, nom_empreendimento, potencia_kw, faixa_regulatoria, is_outlier FROM mmgd_fato ORDER BY potencia_kw DESC LIMIT 10;'
  );
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(null);
  const [loadingQuery, setLoadingQuery] = useState<boolean>(false);
  const [syncingAneel, setSyncingAneel] = useState<boolean>(false);
  const [syncingOns, setSyncingOns] = useState<boolean>(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/etl/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Erro ao buscar status do ETL:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    executeSql();
  }, []);

  const handleSyncAneel = async () => {
    setSyncingAneel(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/etl/sync-aneel', { method: 'POST' });
      const data = await res.json();
      setSyncMessage(data.mensagem);
      await fetchStatus();
    } catch (err: any) {
      setSyncMessage(`Erro na sincronização: ${err.message}`);
    } finally {
      setSyncingAneel(false);
    }
  };

  const handleSyncOns = async () => {
    setSyncingOns(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/etl/sync-ons', { method: 'POST' });
      const data = await res.json();
      setSyncMessage(data.mensagem);
      await fetchStatus();
    } catch (err: any) {
      setSyncMessage(`Erro na sincronização ONS: ${err.message}`);
    } finally {
      setSyncingOns(false);
    }
  };

  const executeSql = async (overrideSql?: string) => {
    const queryToRun = overrideSql || sqlQuery;
    setLoadingQuery(true);
    setQueryError(null);
    try {
      const res = await fetch('/api/sql/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToRun })
      });
      const data = await res.json();
      if (!res.ok) {
        setQueryError(data.error || 'Erro na execução da consulta SQL');
        setQueryResult(null);
      } else {
        setQueryResult(data);
      }
    } catch (err: any) {
      setQueryError(err.message || 'Falha de comunicação com SQLite3');
      setQueryResult(null);
    } finally {
      setLoadingQuery(false);
    }
  };

  // Atalhos Rápidos de Consultas
  const quickQueries = [
    {
      title: 'Outliers de Potência MMGD (> 5 MW)',
      sql: 'SELECT id, nom_empreendimento, sig_uf, potencia_kw, faixa_regulatoria, is_outlier FROM mmgd_fato WHERE is_outlier = 1 OR potencia_kw > 5000;'
    },
    {
      title: 'Segmentação por Faixa Lei 14.300',
      sql: 'SELECT faixa_regulatoria, COUNT(*) as total_usinas, ROUND(SUM(potencia_kw)/1000, 2) as total_mw FROM mmgd_fato GROUP BY faixa_regulatoria;'
    },
    {
      title: 'Top 5 Estados em Capacidade Solar MMGD',
      sql: 'SELECT uf, uf_name, mmgd_count as conexoes, mmgd_mw as solar_mw, siga_mw as centralizada_mw FROM uf_stats ORDER BY mmgd_mw DESC LIMIT 5;'
    },
    {
      title: 'Balanço DESSEM no Pico Solar (11h às 14h)',
      sql: 'SELECT hora, hidraulica_mw, solar_mw, eolica_mw, termica_mw, carga_total_mw FROM dessem_balanco WHERE hora BETWEEN 11 AND 14 ORDER BY hora ASC;'
    },
    {
      title: 'Subestações Tronco do SIN e Cabines Primárias',
      sql: 'SELECT id, nome, tipo, nivel_tensao_kv, uf, capacidade_mva, status_auditoria FROM geo_subestacoes_cabines ORDER BY capacidade_mva DESC;'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Status da Infraestrutura Nativa SQLite3 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Infraestrutura de Dados Físicos (SQLite3 Nativo)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  node:sqlite DatabaseSync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Persistência em disco <span className="font-mono text-slate-200">energy-data-br.sqlite</span> • Pipeline ETL regulatório e console SQL interativo
              </p>
            </div>
          </div>

          {/* Botões de Sincronismo ETL */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncAneel}
              disabled={syncingAneel}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition cursor-pointer disabled:opacity-50 shadow-md shadow-cyan-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingAneel ? 'animate-spin' : ''}`} />
              {syncingAneel ? 'Normalizando ANEEL...' : 'Sincronizar ANEEL (MMGD)'}
            </button>

            <button
              onClick={handleSyncOns}
              disabled={syncingOns}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingOns ? 'animate-spin' : ''}`} />
              {syncingOns ? 'Auditando ONS...' : 'Sincronizar ONS (DESSEM)'}
            </button>
          </div>
        </div>

        {/* Mensagem de Feedback ETL */}
        {syncMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Métricas do Banco de Dados */}
        {status && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Landing Zone</span>
              <span className="text-base font-bold text-white font-mono mt-0.5 block">
                {status.metricas.raw_count} <span className="text-xs font-normal text-slate-500">raw</span>
              </span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">DW Tratado (Fato)</span>
              <span className="text-base font-bold text-cyan-400 font-mono mt-0.5 block">
                {status.metricas.fato_count} <span className="text-xs font-normal text-slate-500">registros</span>
              </span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">UFs Agregadas</span>
              <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">
                {status.metricas.uf_count} <span className="text-xs font-normal text-slate-500">estados</span>
              </span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Subestações / Cabines</span>
              <span className="text-base font-bold text-purple-400 font-mono mt-0.5 block">
                {status.metricas.geo_count} <span className="text-xs font-normal text-slate-500">ativos GIS</span>
              </span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Outliers Auditados</span>
              <span className="text-base font-bold text-rose-400 font-mono mt-0.5 block">
                {status.metricas.outliers_count} <span className="text-xs font-normal text-slate-500">alertas</span>
              </span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Capacidade Total</span>
              <span className="text-base font-bold text-amber-400 font-mono mt-0.5 block">
                {Math.round(status.metricas.capacidade_nacional_mw).toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-500">MW</span>
              </span>
            </div>
          </div>
        )}

      </div>

      {/* 2. Console de Queries SQL Interativo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Console SQL Interativo (Driver Nativo)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Execute qualquer instrução SELECT, PRAGMA ou EXPLAIN ANSI SQL
          </span>
        </div>

        {/* Atalhos Rápidos */}
        <div className="space-y-1.5">
          <span className="text-xs text-slate-400 font-semibold block">Modelos de Consultas Frequentes (1 Clique):</span>
          <div className="flex flex-wrap gap-2">
            {quickQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSqlQuery(q.sql);
                  executeSql(q.sql);
                }}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer font-medium"
              >
                {q.title}
              </button>
            ))}
          </div>
        </div>

        {/* Editor de Texto SQL */}
        <div className="relative">
          <textarea
            value={sqlQuery}
            onChange={e => setSqlQuery(e.target.value)}
            rows={4}
            className="w-full bg-slate-950 font-mono text-xs text-cyan-200 p-3.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 shadow-inner"
            placeholder="Digite sua query SQL aqui..."
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button
              onClick={() => executeSql()}
              disabled={loadingQuery}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              {loadingQuery ? 'Executando...' : 'Executar Query SQL'}
            </button>
          </div>
        </div>

        {/* Alerta de Erro SQL */}
        {queryError && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{queryError}</span>
          </div>
        )}

        {/* Tabela de Resultados SQL */}
        {queryResult && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Resultado: <strong className="text-white font-mono">{queryResult.rowCount || queryResult.changes || 0}</strong> registros retornados
              </span>
              <span className="flex items-center gap-1 font-mono text-cyan-400">
                <Clock className="w-3 h-3" />
                Tempo de Execução: <strong>{queryResult.executionTimeMs} ms</strong>
              </span>
            </div>

            {queryResult.columns && queryResult.rows && queryResult.rows.length > 0 ? (
              <div className="overflow-x-auto max-h-80 border border-slate-800 rounded-xl bg-slate-950 scrollbar-thin">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-300 font-mono sticky top-0 border-b border-slate-800">
                    <tr>
                      {queryResult.columns.map(col => (
                        <th key={col} className="p-2.5 font-bold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
                    {queryResult.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/50 transition">
                        {queryResult.columns!.map(col => (
                          <td key={col} className="p-2.5 whitespace-nowrap">
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-slate-600">NULL</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                Nenhum registro encontrado para esta consulta.
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
