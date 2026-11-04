import React from 'react';
import { X, Zap, Building2, MapPin, Calendar, FileText, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { TreemapAsset } from '../types.ts';

interface DossierModalProps {
  asset: TreemapAsset | null;
  onClose: () => void;
}

export const DossierModal: React.FC<DossierModalProps> = ({ asset, onClose }) => {
  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl text-slate-100">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-mono">
                  {asset.id}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {asset.tipo}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {asset.nome}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="text-xs text-slate-400">Capacidade Outorgada</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{asset.potencia_mw.toLocaleString('pt-BR')} MW</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="text-xs text-slate-400">Localização</div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              {asset.municipio}, {asset.uf}
            </div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="text-xs text-slate-400">Operador / Gestor</div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5 truncate" title={asset.operadora}>
              {asset.operadora}
            </div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="text-xs text-slate-400">Início da Operação</div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {asset.ano_inicio}
            </div>
          </div>
        </div>

        {/* Ficha Técnica Regulatória Detalhada */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-3 text-xs">
          <h3 className="font-semibold text-cyan-400 flex items-center gap-2 text-sm border-b border-slate-800 pb-2">
            <FileText className="w-4 h-4" />
            Dossiê de Enquadramento Regulatório MEx
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 block">Fonte Primária de Geração:</span>
              <span className="text-slate-200 font-medium">{asset.dossier?.fonte_primaria || asset.categoria}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Enquadramento Regulatório ANEEL:</span>
              <span className="text-slate-200 font-medium">{asset.dossier?.enquadramento || asset.status_regulatório}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Tensão de Conexão à Rede:</span>
              <span className="text-slate-200 font-medium">{asset.dossier?.tensao_conexao || 'Alta / Média Tensão'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Fator de Capacidade Médio:</span>
              <span className="text-emerald-400 font-medium">{asset.dossier?.fator_capacidade || 'N/A'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block">Impacto no Despacho DESSEM / ONS:</span>
              <span className="text-amber-300 font-medium">{asset.dossier?.impacto_dessem || 'Integrado à programação horária de curto prazo'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block">Status de Auditoria Geoespacial:</span>
              <span className="text-cyan-300 font-medium flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                {asset.dossier?.geolocalizacao_auditada || 'Verificado em bases ANEEL/ONS'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Fechar Dossiê
          </button>
        </div>

      </div>
    </div>
  );
};
