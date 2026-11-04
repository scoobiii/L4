import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Database, Compass, Layers, Sparkles } from 'lucide-react';

interface AuditSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditSummaryModal: React.FC<AuditSummaryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl text-slate-100">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Auditoria Oficial de Dados: Plantas, Subestações & Cabines
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Parecer Técnico MEx
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Investigação sobre geolocalização física (ANEEL SIGA, MMGD RGD, ONS SIN) e integração com 2D/3D & Realidade Aumentada
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-5 text-sm">

          {/* Resumo Executivo */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-400 flex items-center gap-2 text-base">
                <CheckCircle2 className="w-5 h-5" />
                Veredito da Auditoria Técnica
              </h3>
              <p className="text-slate-300 mt-1 leading-relaxed text-xs md:text-sm">
                Os dados de <strong>Geração Centralizada (GC - ANEEL SIGA e ONS)</strong> contêm coordenadas geográficas <strong>100% reais e oficiais (Latitude e Longitude com até 6 casas decimais)</strong> para cada usina hidrelétrica, solar, eólica, termelétrica e para as <strong>Subestações de Transmissão Tronco (230 kV a 800 kV)</strong>.
              </p>
              <p className="text-slate-300 mt-2 leading-relaxed text-xs md:text-sm">
                Já na <strong>Geração Distribuída (MMGD da ANEEL)</strong>, os dados abertos fornecem o <strong>Código GD oficial, Titular, Município (com Código IBGE) e Concessionária</strong>. Por questões de <strong>sigilo legal (LGPD)</strong> para proteger residências e empresas privadas, a ANEEL não publica o endereço residencial exato com lat/long aberto na MMGD. Nossa plataforma faz o <strong>georreferenciamento auditado</strong> no centróide do município e nas <strong>Cabines Primárias e Subestações de Média Tensão (13.8 kV a 34.5 kV)</strong> onde a usina injeta energia.
              </p>
            </div>
          </div>

          {/* Comparativo de Fontes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bloco GC e Subestações ONS */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-cyan-500/20">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2">
                <Database className="w-4 h-4" />
                1. Geração Centralizada (GC) & Subestações (ONS)
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Geolocalização:</strong> 100% Real no SIGA e ONS (ex: SE Xingu, SE Foz do Iguaçu, SE Pirapora 230kV).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Dados Disponíveis:</strong> Tensão nominal (kV), concessionária operadora, barramento, capacidade em MVA e coordenadas exatas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Despacho:</strong> Monitorado horariamente pelo DESSEM com balanço físico instantâneo.</span>
                </li>
              </ul>
            </div>

            {/* Bloco MMGD e Cabines Primárias */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 font-semibold mb-2">
                <AlertTriangle className="w-4 h-4" />
                2. Geração Distribuída (MMGD) & Cabines Primárias
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Geolocalização:</strong> Por Município / IBGE + Ponto de Entrega (Cabine Primária / Subestação de Distribuição 13.8kV/34.5kV).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Proteção LGPD:</strong> A ANEEL oculta o endereço físico residencial das mais de 2,5 milhões de microgerações para preservar dados dos consumidores.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Solução MEx:</strong> Auditoria por cabines primárias padronizadas e clusterização georreferenciada.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Inovação: 2D, 3D, Realidade Aumentada e Gamificação */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30">
            <h4 className="font-semibold text-emerald-300 flex items-center gap-2 text-sm mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Nossa Implementação: Mapeamento 2D + Gêmeo Digital 3D + Realidade Aumentada (AR) + Gamificação
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Para atender plenamente à solicitação técnica de auditoria e inspeção imersiva, a plataforma implementa:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-emerald-400 font-semibold block mb-1">🗺️ 1. Mapa 2D GIS</span>
                Visualização geoespacial com usinas reais, subestações ONS de alta tensão e pontos de conexão de cabines primárias.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-blue-400 font-semibold block mb-1">🧊 2. Gêmeo 3D (Three.js)</span>
                Modelo 3D interativo de uma Subestação 138/13.8 kV e Cabine Primária com transformador, disjuntor a SF6 e relés.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-purple-400 font-semibold block mb-1">📱 3. Realidade Aumentada</span>
                HUD tático de inspeção com câmera ou ambiente simulado para validação de equipamentos e selo ANEEL em campo.
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <span className="text-amber-400 font-semibold block mb-1">🎮 4. Gamificação MEx</span>
                Missões interativas de auditoria de outliers, verificação da Lei 14.300 e balanceamento da Curva do Pato.
              </div>
            </div>
          </div>

          {/* Dica de navegação */}
          <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <span>Para explorar o Gêmeo Digital 3D e a Realidade Aumentada, acesse a aba <strong>"Gêmeo Digital 3D, Geo & AR"</strong>.</span>
            <button 
              onClick={onClose}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition text-xs"
            >
              Entendido
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
