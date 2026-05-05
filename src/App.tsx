/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Swords, 
  Lightbulb, 
  ShieldAlert, 
  Zap, 
  Skull, 
  Languages, 
  UserRound,
  ArrowLeft,
  Send,
  Loader2,
  Trash2,
  Clock,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { getIELTSResponse, Mode, Message } from './services/gemini';

const MODES = [
  { id: 'observer', name: 'AI vs AI', icon: UserRound, desc: 'OBSERVE SIMULATED HIGH-LEVEL ARGUMENTATION (3–5 EXCHANGES).', color: 'bg-editorial-ink text-white', label: '01. OBSERVER' },
  { id: 'combat', name: 'Practice with AI', icon: Swords, desc: 'CHOOSE A SIDE. DEFEND YOUR GROUND. RECEIVE TACTICAL LANGUAGE UPGRADES.', color: 'bg-editorial-ink text-white', label: '02. COMBAT' },
  { id: 'ideas', name: 'Idea Builder', icon: Lightbulb, desc: 'SYSTEMATIC GENERATION OF CORE ARGUMENTS FOR POLARIZED TOPICS.', color: 'bg-editorial-ink text-white', label: '03. ARCHITECT' },
  { id: 'simulation', name: 'Simulation', icon: GraduationCap, desc: 'CONTINUOUS SPEAKING PART 3 INTERROGATION IN EXAM CONDITIONS.', color: 'bg-editorial-ink text-white', label: '04. EXAM' },
  { id: 'fallacy', name: 'Fallacy Hunter', icon: ShieldAlert, desc: 'IDENTIFY INTENTIONAL LOGICAL ERRORS IN SYSTEM ARGUMENTS.', color: 'bg-editorial-ink text-white', label: '05. TRACKER' },
  { id: 'vocab', name: 'Vocab Upgrade', icon: Languages, desc: 'TRANSFORM BAND 6 INPUT INTO BAND 8-9 ACADEMIC PROSE.', color: 'bg-editorial-ink text-white', label: '06. LEXICON' },
  { id: 'speed', name: 'Speed Debate', icon: Zap, desc: 'HIGH-INTENSITY, TIME-CAPPED RESPONSES FOR FLUENCY UNDER DURESS.', color: 'bg-editorial-ink text-white', label: '07. PRESSURE' },
  { id: 'destroy', name: 'Destroy Mode', icon: Skull, desc: 'AGGRESSIVE DECONSTRUCTION OF YOUR LOGIC. NO MERCY FOR WEAK EVIDENCE.', color: 'bg-red-500 text-white', label: '08. HOSTILE' },
] as const;

export default function App() {
  const [currentMode, setCurrentMode] = useState<Mode | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentMode === 'speed' && !isLoading && messages.length > 0 && messages[messages.length-1].role === 'ai') {
      setTimeLeft(15); 
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeLeft(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [currentMode, messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !currentMode || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const response = await getIELTSResponse(currentMode, input, messages);
    setMessages([...newMessages, { role: 'ai', content: response }]);
    setIsLoading(false);
  };

  const startMode = (mode: Mode) => {
    setCurrentMode(mode);
    setMessages([]);
    setInput('');
    setTopic('');
  };

  const reset = () => {
    setCurrentMode(null);
    setMessages([]);
    setInput('');
    setTopic('');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div id="app-root" className="min-h-screen bg-editorial-bg text-editorial-ink font-sans selection:bg-stone-200 flex flex-col">
      {/* Header */}
      <header id="app-header" className="sticky top-0 z-50 bg-editorial-bg/90 backdrop-blur-md ">
        <div className="max-w-7xl mx-auto px-8 py-10 flex items-baseline justify-between border-b-2 border-editorial-ink">
          <button 
            id="nav-title"
            onClick={reset}
            className="flex flex-col items-start hover:opacity-80 transition-opacity"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60 mb-1">Academic Resource • Vol. 04</span>
            <h1 className="text-5xl font-serif italic font-black leading-none tracking-tight">IELTS Debate Lab</h1>
          </button>
          <div className="flex items-center gap-6 text-right">
            <div className="hidden md:block">
              <p className="text-[12px] font-mono uppercase">System Version: 2.8.0</p>
              <p className="text-[12px] font-mono uppercase">User: Aspirant</p>
            </div>
            {currentMode && (
              <div className="flex items-center gap-2">
                <button 
                  id="clear-chat"
                  onClick={clearChat}
                  className="p-2 border border-editorial-ink hover:bg-editorial-ink hover:text-white transition-all rounded-none"
                  title="Clear current session"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  id="back-button"
                  onClick={reset}
                  className="px-4 py-2 text-xs font-mono uppercase bg-editorial-ink text-white hover:opacity-90 transition-colors"
                >
                  Modes
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-8 py-12 flex flex-col">
        <AnimatePresence mode="wait">
          {!currentMode ? (
            <motion.div
              key="mode-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
            >
              <div className="mb-12 flex justify-between items-end">
                <h2 className="text-3xl font-serif font-bold uppercase tracking-wide">Available Protocols</h2>
                <p className="text-sm italic opacity-70">Select a mode to initiate logic training.</p>
              </div>

              <div id="modes-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                {MODES.map((mode) => (
                  <button
                    id={`mode-card-${mode.id}`}
                    key={mode.id}
                    onClick={() => startMode(mode.id as Mode)}
                    className={`group relative flex flex-col text-left transition-all duration-300 ${mode.id === 'destroy' ? 'bg-editorial-ink text-white p-6 -mt-6' : ''}`}
                  >
                    <div className={`${mode.id !== 'destroy' ? 'border-t border-editorial-ink pt-4' : ''}`}>
                      <span className={`font-mono text-xs mb-3 block ${mode.id === 'destroy' ? 'text-red-500' : 'opacity-60'}`}>
                        {mode.label}
                      </span>
                      <h3 className="text-2xl font-serif font-bold mb-2 group-hover:underline decoration-1 underline-offset-4">
                        {mode.name}
                      </h3>
                      <p className={`text-[11px] leading-relaxed uppercase tracking-widest ${mode.id === 'destroy' ? 'opacity-70' : 'opacity-80'}`}>
                        {mode.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="active-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              <div id="active-mode-header" className="mb-10 flex items-center justify-between border-b border-editorial-ink/10 pb-6">
                <div>
                  <h2 className="text-3xl font-serif italic font-bold tracking-tight">
                    {MODES.find(m => m.id === currentMode)?.name}
                  </h2>
                  <p className="text-stone-500 text-xs uppercase tracking-[0.2em] mt-1">
                    {MODES.find(m => m.id === currentMode)?.desc}
                  </p>
                </div>
                {currentMode === 'speed' && timeLeft > 0 && (
                  <div id="speed-timer" className="flex items-center gap-2 px-6 py-2 border-2 border-red-500 text-red-500 font-mono font-bold">
                    <Clock size={16} />
                    00:{timeLeft.toString().padStart(2, '0')}
                  </div>
                )}
              </div>

              {/* Chat Window */}
              <div id="chat-container" className="flex-1 overflow-y-auto mb-10 flex flex-col gap-6 pr-4">
                {messages.length === 0 && (
                  <div id="empty-state" className="flex-1 flex flex-col items-center justify-center text-center py-20 grayscale opacity-40">
                    <div className="w-20 h-20 border border-editorial-ink flex items-center justify-center mb-6 rounded-full">
                      {React.createElement(MODES.find(m => m.id === currentMode)?.icon || MessageSquare, { size: 32 })}
                    </div>
                    <p className="text-2xl font-serif italic mb-2 tracking-tight">System awaiting input...</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]">State your topic to begin Vol. 04</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end pl-12' : 'justify-start pr-12'}`}
                  >
                    <div 
                      className={`relative px-0 py-0 text-sm leading-relaxed ${
                        m.role === 'user' 
                          ? 'text-right' 
                          : 'text-left'
                      } w-full`}
                    >
                      <div className={`mb-2 text-[10px] font-mono uppercase tracking-widest opacity-40 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {m.role === 'user' ? 'PARTICIPANT' : 'SYSTEM LOGIC'}
                      </div>
                      <div className={`p-6 ${m.role === 'user' ? 'bg-editorial-ink text-white' : 'bg-stone-50 border border-editorial-ink/10'} rounded-none`}>
                        {m.role === 'user' ? (
                          m.content
                        ) : (
                          <div className="markdown-body">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="p-6 bg-stone-50 border border-editorial-ink/10 flex items-center gap-3">
                      <div className="w-2 h-2 bg-editorial-ink rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-editorial-ink rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-editorial-ink rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <footer className="mt-auto border-t-4 border-editorial-ink pt-8 flex items-center bg-editorial-bg sticky bottom-0 z-10 pb-8">
                <div className="w-12 h-12 rounded-full border-2 border-editorial-ink flex items-center justify-center mr-6 hidden sm:flex shrink-0">
                  <div className={`w-3 h-3 bg-editorial-ink rounded-full ${isLoading ? 'animate-ping' : 'animate-pulse'}`}></div>
                </div>
                <div className="flex-1 mr-6">
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] mb-1">System awaiting input</p>
                  <p className="text-xl font-serif italic hidden lg:block">"State your argument or topic."</p>
                </div>
                
                <form 
                  onSubmit={handleSend}
                  className="flex gap-4 flex-1 lg:max-w-2xl"
                >
                  <input
                    id="user-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="TYPE COMMAND..."
                    className="h-14 flex-1 border-2 border-editorial-ink px-6 text-xs font-mono uppercase focus:outline-none bg-transparent placeholder:opacity-30"
                    disabled={isLoading}
                    autoFocus
                  />
                  <button
                    id="submit-button"
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="h-14 px-10 bg-editorial-ink text-white uppercase text-xs font-bold tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    ENTER
                  </button>
                </form>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!currentMode && (
        <footer id="global-footer" className="py-12 px-8 max-w-7xl mx-auto w-full border-t border-editorial-ink/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-editorial-ink/30">
            DebateMaster Lab • Advanced IELTS Linguistic Training System
          </p>
          <div className="flex gap-8">
            <span className="text-[10px] font-mono tracking-widest opacity-40 uppercase">Encrypted Session</span>
            <span className="text-[10px] font-mono tracking-widest opacity-40 uppercase">Vol. 04-2024</span>
          </div>
        </footer>
      )}
    </div>
  );
}
