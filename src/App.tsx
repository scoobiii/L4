/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { TreemapTab } from './components/TreemapTab.tsx';
import { OnsDessemTab } from './components/OnsDessemTab.tsx';
import { SqlEtlTab } from './components/SqlEtlTab.tsx';
import { Calculadora14300Tab } from './components/Calculadora14300Tab.tsx';
import { GeoDigitalTwinTab } from './components/GeoDigitalTwinTab.tsx';
import { GeminiAiTab } from './components/GeminiAiTab.tsx';
import { TestSuiteTab } from './components/TestSuiteTab.tsx';
import { CceeCurtailmentTab } from './components/CceeCurtailmentTab.tsx';
import { CadastralGridTab } from './components/CadastralGridTab.tsx';
import { DossierModal } from './components/DossierModal.tsx';
import { AuditSummaryModal } from './components/AuditSummaryModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { TreemapAsset, AuthUser } from './types.ts';
import { ShieldCheck, Database, Radio, HelpCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('treemap');
  const [selectedAsset, setSelectedAsset] = useState<TreemapAsset | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [capacidadeTotalMw, setCapacidadeTotalMw] = useState<number>(265940);

  // Estado de Autenticação Oficial (CCEE / ONS / ANEEL vs Voyeur)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('mex_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('mex_auth_token') || null;
  });

  useEffect(() => {
    // Busca status do ETL
    fetch('/api/etl/status')
      .then(res => res.json())
      .then(data => {
        if (data.metricas?.capacidade_nacional_mw) {
          setCapacidadeTotalMw(data.metricas.capacidade_nacional_mw);
        }
      })
      .catch(err => console.error('Erro ao buscar status:', err));

    // Se não tiver usuário salvo, inicializa automaticamente com o agente padrão ccee.xai pré-cadastrado
    if (!currentUser) {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'ccee.xai', password: 'xai2026!' })
      })
        .then(res => res.json())
        .then(data => {
          if (data.usuario && data.token) {
            handleLoginSuccess(data.usuario, data.token);
          }
        })
        .catch(err => console.error('Erro ao carregar sessão inicial:', err));
    }
  }, []);

  const handleLoginSuccess = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    try {
      localStorage.setItem('mex_auth_user', JSON.stringify(user));
      localStorage.setItem('mex_auth_token', token);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    try {
      localStorage.removeItem('mex_auth_user');
      localStorage.removeItem('mex_auth_token');
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Navbar Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAuditModal={() => setIsAuditModalOpen(true)}
        openAuthModal={() => setIsAuthModalOpen(true)}
        capacidadeTotalMw={capacidadeTotalMw}
        currentUser={currentUser}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'treemap' && (
          <TreemapTab onOpenDossier={(asset) => setSelectedAsset(asset)} />
        )}

        {activeTab === 'ons_dessem' && (
          <OnsDessemTab />
        )}

        {activeTab === 'etl_sql' && (
          <SqlEtlTab />
        )}

        {activeTab === 'calculadora' && (
          <Calculadora14300Tab />
        )}

        {activeTab === 'digital_twin_geo' && (
          <GeoDigitalTwinTab />
        )}

        {activeTab === 'gemini_ai' && (
          <GeminiAiTab />
        )}

        {activeTab === 'tests' && (
          <TestSuiteTab />
        )}

        {activeTab === 'ccee_curtailment' && (
          <CceeCurtailmentTab
            currentUser={currentUser}
            authToken={authToken}
            openAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'rede_cadastral' && (
          <CadastralGridTab />
        )}
      </main>

      {/* Dossiê Técnico Modal */}
      <DossierModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />

      {/* Parecer Técnico de Auditoria Modal */}
      <AuditSummaryModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* Modal de Autenticação Oficial & Voyeur */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Rodapé Institucional e Fontes Oficiais */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-sm py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <span className="font-bold text-slate-300">
              Painel Nacional GD & GC — MEx Energia
            </span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span>
              Persistência Nativa SQLite3 (<code className="text-cyan-400">energy-data-br.sqlite</code>)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Fontes Oficiais:</span>
            <a 
              href="https://dadosabertos.aneel.gov.br" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-cyan-400 transition underline underline-offset-2"
            >
              ANEEL (MMGD/SIGA)
            </a>
            <a 
              href="https://dados.ons.org.br" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-cyan-400 transition underline underline-offset-2"
            >
              ONS (SIN/DESSEM)
            </a>
            <a 
              href="https://www.ccee.org.br" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-cyan-400 transition underline underline-offset-2"
            >
              CCEE (PLD)
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
