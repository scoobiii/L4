import React, { useState } from 'react';
import { Bot, Send, Sparkles, RefreshCw, Copy, Check, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const GeminiAiTab: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o **MEx Assistente AI**, copiloto técnico e regulatório do setor elétrico brasileiro. Estou conectado ao modelo **Gemini 3.8 Flash** e munido com as diretrizes da **Lei 14.300/2022**, **Resolução Normativa ANEEL nº 1.000/2021**, procedimentos de rede do **ONS** e o banco de dados nativo SQLite3 deste painel. Como posso auxiliar na sua auditoria hoje?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const quickQuestions = [
    'O que muda na cobrança do Fio B da Lei 14.300 em 2026?',
    'Como o ONS opera as hidrelétricas para balancear a Curva do Pato às 18h no DESSEM?',
    'Qual a diferença regulatória exata entre GD I, GD II e GD III?',
    'Como auditar outliers de usinas > 5 MW na tabela mmgd_fato no SQLite3?'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar consulta com o Gemini');
      }

      const botMsg: ChatMessage = { role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Não foi possível completar a consulta regulatória: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header do Copiloto */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-xl text-purple-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">MEx Assistente AI — Copiloto Regulatório RAG</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Especialista em Lei 14.300/2022, REN 1.000/2021, PLD Horário CCEE, DESSEM/ONS e Auditoria Regulatória
              </p>
            </div>
          </div>

          <button
            onClick={() => setMessages([messages[0]])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Limpar Conversa
          </button>
        </div>

        {/* Atalhos de Perguntas Frequentes */}
        <div className="space-y-1.5">
          <span className="text-xs text-slate-400 font-semibold block">Perguntas Rápidas Pré-configuradas (1 Clique):</span>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-xs bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/50 px-3 py-1.5 rounded-xl transition cursor-pointer text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Caixa de Mensagens do Chat */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 min-h-[480px] flex flex-col justify-between">
        
        {/* Lista de Mensagens */}
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative p-4 rounded-2xl max-w-2xl text-xs leading-relaxed space-y-2 shadow-sm ${
                    isUser
                      ? 'bg-cyan-600 text-slate-950 font-medium'
                      : 'bg-slate-950 border border-slate-800 text-slate-200'
                  }`}
                >
                  {/* Botão de copiar mensagem do assistente */}
                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(msg.content, idx)}
                      className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition"
                      title="Copiar resposta"
                    >
                      {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  <div className="whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center text-slate-950 font-bold shrink-0 mt-1">
                    U
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center text-purple-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-slate-400 font-mono ml-2">Consultando normas ANEEL & ONS com Gemini...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-4 border-t border-slate-800">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Pergunte sobre enquadramento GD I/II/III, inversão de fluxo, PLD horário ou regras do DESSEM..."
              className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-lg shadow-purple-600/20"
            >
              <Send className="w-4 h-4" />
              Enviar
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
