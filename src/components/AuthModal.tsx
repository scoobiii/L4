import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Building2, 
  UserCheck, 
  AlertTriangle, 
  KeyRound, 
  X, 
  CheckCircle2, 
  Zap, 
  Cpu, 
  FileText 
} from 'lucide-react';
import { AuthUser, PreCadastradoUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onLoginSuccess: (user: AuthUser, token: string) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'oficial' | 'voyeur'>('oficial');
  const [preCadastrados, setPreCadastrados] = useState<PreCadastradoUser[]>([]);
  const [selectedUsername, setSelectedUsername] = useState<string>('ccee.xai');
  const [password, setPassword] = useState<string>('xai2026!');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      fetch('/api/auth/pre-cadastrados')
        .then(res => res.json())
        .then(data => {
          if (data.usuarios) {
            setPreCadastrados(data.usuarios);
          }
        })
        .catch(err => console.error('Erro ao buscar pre-cadastrados:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPreCadastrado = (u: PreCadastradoUser) => {
    setSelectedUsername(u.username);
    // Credencial padrão demonstrativa correspondente
    const pwdMap: Record<string, string> = {
      'ccee.xai': 'xai2026!',
      'ccee.solatio': 'solatio2026!',
      'ccee.mex': 'mex2026!',
      'ons.cnos': 'ons2026!',
      'ons.eletrobras': 'eletro2026!',
      'aneel.fiscal': 'aneel2026!',
      'aneel.cemig': 'cemig2026!'
    };
    setPassword(pwdMap[u.username] || '123456');
    setErrorMsg('');
  };

  const handleLoginOficial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedUsername,
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha na autenticação oficial.');
      }

      setSuccessMsg(`Autenticado com sucesso como ${data.usuario.nome_completo} (${data.usuario.orgao})`);
      setTimeout(() => {
        onLoginSuccess(data.usuario, data.token);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginVoyeur = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVoyeur: true })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao iniciar sessão Voyeur.');
      }

      setSuccessMsg('Sessão Voyeur iniciada. Acesso de visualização auditada ativado.');
      setTimeout(() => {
        onLoginSuccess(data.usuario, data.token);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao ativar modo Voyeur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Autenticação de Acesso Regulatório
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  CCEE • ONS • ANEEL
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Acesso exclusivo para agentes pré-cadastrados oficiais ou acesso isolado Voyeur (leitura)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Atual se já logado */}
        {currentUser && (
          <div className="bg-zinc-900/90 border-b border-zinc-800 px-6 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Sessão Atual:</span>
              <span className={`font-semibold px-2 py-0.5 rounded text-[11px] font-mono ${
                currentUser.isVoyeur 
                  ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' 
                  : currentUser.orgao === 'CCEE' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                    : currentUser.orgao === 'ONS' 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' 
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
              }`}>
                {currentUser.isVoyeur ? '👁️ MODO VOYEUR (ISOLADO)' : `🏛️ ${currentUser.orgao}: ${currentUser.nome_completo}`}
              </span>
              {!currentUser.isVoyeur && (
                <span className="text-zinc-400 font-mono text-[10px]">
                  Reg: {currentUser.registro_oficial}
                </span>
              )}
            </div>
            <button
              onClick={onLogout}
              className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-medium transition"
            >
              Encerrar Sessão
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 p-2 gap-2">
          <button
            onClick={() => setActiveTab('oficial')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition ${
              activeTab === 'oficial'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Agentes Pré-Cadastrados Oficiais (CCEE • ONS • ANEEL)</span>
          </button>
          <button
            onClick={() => setActiveTab('voyeur')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition ${
              activeTab === 'voyeur'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Eye className="w-4 h-4 text-sky-400" />
            <span>Acesso Isolado Voyeur (Visitante / Somente Leitura)</span>
          </button>
        </div>

        {/* Mensagens de Feedback */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Conteúdo das Abas */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'oficial' ? (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300">Acesso Restrito Institucional: </strong>
                  Conforme requisitos regulatórios, o registro de transações no CliqCCEE, formalização de acordos de Curtailment para Data Centers e despachos do ONS exigem credenciamento oficial ativo. Selecione abaixo uma das entidades pré-homologadas no ecossistema:
                </div>
              </div>

              {/* Grid de Agentes Pré-Cadastrados */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Entidades Pré-Cadastradas no Sistema (Clique para preencher):
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
                  {preCadastrados.map((u) => {
                    const isSelected = selectedUsername === u.username;
                    return (
                      <div
                        key={u.username}
                        onClick={() => handleSelectPreCadastrado(u)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                            : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`inline-block text-[10px] font-mono px-1.5 py-0.5 rounded font-bold mr-1.5 ${
                              u.orgao === 'CCEE' 
                                ? 'bg-amber-500/20 text-amber-400' 
                                : u.orgao === 'ONS' 
                                  ? 'bg-blue-500/20 text-blue-400' 
                                  : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {u.orgao}
                            </span>
                            <span className="font-semibold text-xs text-zinc-100">{u.nome_completo}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                          <span className="font-mono text-zinc-300">{u.username}</span>
                          <span className="font-mono text-[10px] text-zinc-300">{u.registro_oficial}</span>
                        </div>
                        <div className="mt-1 text-[10px] text-zinc-400 truncate">
                          {u.cargo} • Submercado: {u.submercado}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Formulário de Login */}
              <form onSubmit={handleLoginOficial} className="space-y-4 pt-2 border-t border-zinc-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Usuário Institucional
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                      <input
                        type="text"
                        value={selectedUsername}
                        onChange={(e) => setSelectedUsername(e.target.value)}
                        placeholder="Ex: ccee.xai"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Senha de Acesso Criptografada
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 font-mono focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Habilita assinatura digital no CliqCCEE & De-Risking xAI Curtailment</span>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>Autenticar Entidade Oficial</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-800/30 text-xs text-sky-200/90 leading-relaxed flex items-start gap-3">
                <Eye className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sky-300 text-sm mb-1">
                    Acesso Isolado de Visualização (Modo Voyeur)
                  </h4>
                  <p>
                    Para usuários sem cadastro institucional prévio no ONS, CCEE ou ANEEL, a plataforma oferece um ambiente isolado de observabilidade analítica total (Finviz Treemap, Telemetria ONS, Simulação 14.300, Mapeamento Espacial e RAG IA).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Funcionalidades Liberadas
                  </span>
                  <ul className="text-[11px] text-zinc-300 space-y-1.5 list-disc pl-4">
                    <li>Visualização completa de 100 ativos Finviz (GD + GC)</li>
                    <li>Screener analítico por ticker, fator de capacidade e tensão</li>
                    <li>Curvas de carga ONS, DESSEM e histórico de apagão 2023</li>
                    <li>Navegação geoespacial auditada até subestações e barramentos</li>
                    <li>Simulador de abundância BR VISION 2030 / 2040</li>
                    <li>Consultas em linguagem natural com Gemini 3.5 Flash</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Restrições de Isolamento (Somente Leitura)
                  </span>
                  <ul className="text-[11px] text-zinc-300 space-y-1.5 list-disc pl-4">
                    <li>Bloqueio de registro de transações bilaterais no CliqCCEE</li>
                    <li>Bloqueio de formalização de contratos de Curtailment para Data Centers</li>
                    <li>Vedada a alteração de parâmetros regulatórios ou liquidação MCP</li>
                    <li>Sessão com identificador isolado de auditoria <code className="text-zinc-200 font-mono">VOYEUR-GUEST</code></li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Nenhum pré-cadastro ou senha institucional necessária para o modo de leitura.
                </span>
                <button
                  onClick={handleLoginVoyeur}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-sky-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                  <span>Entrar em Modo Voyeur (Somente Leitura)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-300">
          <span className="font-mono">Ambiente de Produção MEx Energia • Resolução Normativa ANEEL / Regras CCEE</span>
          <span className="text-zinc-400">Segurança de Nível Bancário SSL/TLS</span>
        </div>
      </div>
    </div>
  );
};
