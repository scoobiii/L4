import React from 'react';
import { 
  Zap, 
  BarChart3, 
  Database, 
  Calculator, 
  Box, 
  Bot, 
  ShieldCheck, 
  Radio, 
  Building2,
  Network,
  Eye,
  KeyRound,
  UserCheck
} from 'lucide-react';
import { AuthUser } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAuditModal: () => void;
  openAuthModal: () => void;
  capacidadeTotalMw: number;
  currentUser: AuthUser | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAuditModal,
  openAuthModal,
  capacidadeTotalMw,
  currentUser
}) => {
  const tabs = [
    { id: 'treemap', label: '1. SIN GD + GC (Finviz Treemap)', icon: BarChart3 },
    { id: 'ons_dessem', label: '2. ONS & DESSEM Operacional', icon: Radio },
    { id: 'etl_sql', label: '3. Simulador ETL & SQL (SQLite3)', icon: Database },
    { id: 'calculadora', label: '4. Calculadora Lei 14.300', icon: Calculator },
    { id: 'digital_twin_geo', label: '5. Gêmeo 3D, Geo & AR', icon: Box, highlight: true },
    { id: 'gemini_ai', label: '6. MEx Assistente AI', icon: Bot },
    { id: 'tests', label: '7. Testes 100% Zero Mock', icon: ShieldCheck, highlightGreen: true },
    { id: 'ccee_curtailment', label: '8. CCEE & Curtailment xAI', icon: Building2, highlightAmber: true },
    { id: 'rede_cadastral', label: '9. Rede Cadastral & SEs (BDGD)', icon: Network, highlightCyan: true }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Banner / Ticker */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            SIN ONS SÍNCRONO
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-cyan-300">
            <Database className="w-3 h-3 text-cyan-400" />
            SQLite3 Nativo: <strong className="text-slate-200">DatabaseSync Ativo</strong>
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="hidden sm:flex items-center gap-1 text-slate-300">
            Capacidade Auditada: <strong className="text-amber-400 font-mono">~{Math.round(capacidadeTotalMw).toLocaleString('pt-BR')} MW</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* User Auth Badge */}
          {currentUser ? (
            <button
              onClick={openAuthModal}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border transition cursor-pointer ${
                currentUser.isVoyeur
                  ? 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border-zinc-600'
                  : currentUser.orgao === 'CCEE'
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                    : currentUser.orgao === 'ONS'
                      ? 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border-blue-500/40'
                      : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border-purple-500/40'
              }`}
              title="Clique para alternar usuário ou ver credenciais oficiais"
            >
              {currentUser.isVoyeur ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Modo Voyeur (Somente Leitura)</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    <strong className="font-mono">{currentUser.orgao}:</strong> {currentUser.nome_completo.split(' ')[0]}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400 hidden md:inline">
                    ({currentUser.registro_oficial})
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition text-xs font-medium cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Login Oficial / Voyeur</span>
            </button>
          )}

          <button
            onClick={openAuditModal}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition text-xs font-medium cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auditoria Geo & Cabines</span>
            <span className="sm:hidden">Auditoria</span>
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('treemap')}>
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white tracking-tight">Painel Nacional GD & GC</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  MEx Foco
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Auditoria Regulatória, MMGD, Geração Centralizada & Gêmeo Digital
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                } ${tab.highlight && !isActive ? 'border border-purple-500/30 bg-purple-950/20 text-purple-300 hover:bg-purple-900/30' : ''} ${tab.highlightGreen && !isActive ? 'border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 font-bold' : ''} ${tab.highlightAmber && !isActive ? 'border border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 font-bold' : ''} ${tab.highlightCyan && !isActive ? 'border border-cyan-500/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40 font-bold' : ''}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : tab.highlight ? 'text-purple-400' : tab.highlightGreen ? 'text-emerald-400' : tab.highlightAmber ? 'text-amber-400' : tab.highlightCyan ? 'text-cyan-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
