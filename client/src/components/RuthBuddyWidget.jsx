import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  MessageCircleHeart,
  Brain,
  Send,
  X,
  Minus,
  EyeOff,
  Eye,
  AlertOctagon,
  Pencil,
  Trash2,
  Check,
  Plus,
  FileCode2,
  ListChecks,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { useAgentMemory } from '../context/AgentMemoryContext';

const QUICK_CHIPS = [
  'My husband has a Vanguard account I just found',
  'We bought the house in 2012 for $400k and our mortgage rate is 3.2%',
  'What should I ask my lawyer?',
  'What do you remember about me?'
];

const FINCH_AMBIENT_THOUGHTS = [
  {
    type: 'Did you know?',
    topic: 'Splitting a 401(k)',
    text: 'Splitting a 401(k)? You\'ll need a special court form (called a QDRO) so you don\'t get hit with tax penalties.'
  },
  {
    type: 'Tip',
    topic: 'Save statements early',
    text: 'Grab 12 months of bank and card statements now—online logins can change fast.'
  },
  {
    type: 'Thinking out loud',
    topic: 'One step at a time',
    text: 'Just hanging out here. One small step is plenty for today.'
  },
  {
    type: 'Did you know?',
    topic: 'What stays yours',
    text: 'Things you owned before marriage or inherited usually stay yours if you keep the paper trail.'
  },
  {
    type: 'Tip',
    topic: 'Quick safe exit',
    text: 'Need to leave fast? Hit Esc twice to jump straight to Weather.com.'
  },
  {
    type: 'Thinking out loud',
    topic: 'Spot hidden accounts',
    text: 'A free credit report can uncover old accounts you didn\'t know existed.'
  },
  {
    type: 'Did you know?',
    topic: 'Listing everything',
    text: 'In California, both spouses have to list every account and debt—even ones in just one name.'
  },
  {
    type: 'Tip',
    topic: 'Your own checking',
    text: 'Opening your own checking account at a new bank gives you a safe, fresh spot for your money.'
  }
];

const SECTION_ORDER = [
  'profile',
  'financial_footprint',
  'priorities_and_goals',
  'lawyer_readiness',
  'interaction_log'
];

function FinchBird({ className = 'w-9 h-9', isThinking = false }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} animate-finch-bob ${isThinking ? 'finch-active' : ''}`}
      aria-hidden="true"
    >
      <g transform="translate(64, 0) scale(-1, 1)">
        {/* Tail feathers */}
        <path
          d="M14 39L5 33L9 43L15 43Z"
          fill="#5C4E43"
        />
        {/* Plump finch body */}
        <ellipse cx="31" cy="37" rx="17" ry="14" fill="#6D5A4F" />
        {/* Warm terracotta/ochre finch breast */}
        <path
          d="M27 28C36 28 45 33 45 41C45 46 39 50 32 50C25 50 22 45 22 39C22 33 24 28 27 28Z"
          fill="#D97757"
        />
        {/* Head */}
        <circle cx="38" cy="24" r="11" fill="#5C4E43" />
        {/* Soft cheek patch */}
        <circle cx="40" cy="26" r="4.5" fill="#F2E6DC" opacity="0.85" />
        {/* Animated wing */}
        <path
          d="M20 33C26 30 33 33 34 40C30 43 21 42 18 37C17 35 18 34 20 33Z"
          fill="#4A3D35"
          className="animate-finch-wing"
        />
        {/* Beak */}
        <path d="M48 22L57 25L48 28Z" fill="#F59E0B" />
        {/* Animated blinking eye */}
        <circle
          cx="42"
          cy="22"
          r="2.1"
          fill="#1E1815"
          className="animate-finch-blink"
        />
        <circle cx="42.7" cy="21.3" r="0.7" fill="#FFFFFF" />
        {/* Little perch feet */}
        <path
          d="M28 50V55M28 55L25 57M28 55L31 57M35 50V55M35 55L32 57M35 55L38 57"
          stroke="#B45309"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default function RuthBuddyWidget() {
  const {
    wikiData,
    chatMessages,
    isUpdatingWiki,
    isBuddyOpen,
    toggleBuddyDrawer,
    closeBuddyDrawer,
    sendMessage,
    updateWikiSection,
    purgeMemory
  } = useAgentMemory();

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'memory'
  const [input, setInput] = useState('');
  const [isDiscreetHidden, setIsDiscreetHidden] = useState(false);
  const [viewMode, setViewMode] = useState('structured'); // 'structured' | 'markdown'

  // Inline fact editing state
  const [editingFact, setEditingFact] = useState(null); // { sectionKey, factId, text }
  const [addingToSection, setAddingToSection] = useState(null); // sectionKey | null
  const [newFactText, setNewFactText] = useState('');
  const [confirmPurge, setConfirmPurge] = useState(false);

  // Ambient thought bubble state
  const [thoughtIndex, setThoughtIndex] = useState(0);
  const [isBubbleDismissed, setIsBubbleDismissed] = useState(false);

  const messagesEndRef = useRef(null);

  const totalFacts = wikiData?.stats?.totalFacts || 0;
  const activeThought = FINCH_AMBIENT_THOUGHTS[thoughtIndex];

  useEffect(() => {
    if (isBuddyOpen || isDiscreetHidden || isBubbleDismissed) return;
    const interval = setInterval(() => {
      setThoughtIndex((prev) => (prev + 1) % FINCH_AMBIENT_THOUGHTS.length);
    }, 30000);
    return () => clearInterval(interval);
  }, [isBuddyOpen, isDiscreetHidden, isBubbleDismissed]);

  useEffect(() => {
    if (isBuddyOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isBuddyOpen, activeTab, isUpdatingWiki]);

  const handleQuickSafeExit = () => {
    window.location.replace('https://weather.com');
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isUpdatingWiki) return;
    const text = input.trim();
    setInput('');
    await sendMessage(text);
  };

  const handleChipClick = async (chipText) => {
    if (isUpdatingWiki) return;
    await sendMessage(chipText);
  };

  const handleSaveEdit = async () => {
    if (!editingFact || !editingFact.text.trim()) return;
    await updateWikiSection(editingFact.sectionKey, {
      action: 'update',
      factId: editingFact.factId,
      text: editingFact.text.trim()
    });
    setEditingFact(null);
  };

  const handleDeleteFact = async (sectionKey, factId) => {
    await updateWikiSection(sectionKey, {
      action: 'delete',
      factId
    });
  };

  const handleAddManualFact = async (sectionKey) => {
    if (!newFactText.trim()) return;
    await updateWikiSection(sectionKey, {
      action: 'add',
      text: newFactText.trim(),
      category: 'User Note',
      source: 'Memory Inspector'
    });
    setNewFactText('');
    setAddingToSection(null);
  };

  const handlePurge = async () => {
    await purgeMemory();
    setConfirmPurge(false);
  };

  const handleTalkAboutThought = async () => {
    setActiveTab('chat');
    if (!isBuddyOpen) {
      toggleBuddyDrawer();
    }
    await sendMessage(`Tell me more about this: "${activeThought.text}"`);
  };

  // Ultra-discreet hidden mode (tiny neutral restore button)
  if (isDiscreetHidden) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsDiscreetHidden(false)}
          title="Restore Finch"
          aria-label="Restore Finch"
          className="w-8 h-8 rounded-full bg-[#F4EFEA]/90 hover:bg-[#EDE6DD] text-[#5F635E] flex items-center justify-center shadow-serene border border-[#E2DAD0] transition-smooth"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Minimized State (Bottom-Right Corner: Finch bird + ambient thought bubble)
  if (!isBuddyOpen) {
    return (
      <div className="fixed bottom-4 right-5 z-50 flex flex-col items-end gap-2">
        {/* Ambient Speech / Thought Bubble */}
        {!isBubbleDismissed && (
          <div className="relative max-w-[270px] sm:max-w-[295px] bg-white/95 backdrop-blur-sm border border-[#4F5E47]/15 rounded-2xl shadow-serene p-3.5 text-left transition-all duration-300">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  activeThought.type === 'Did you know?'
                    ? 'bg-[#FAF2F0] text-[#A07E5F] border border-[#D9B3AC]/70'
                    : activeThought.type === 'Tip'
                    ? 'bg-[#F4EFEA] text-[#384631] border border-[#8A9A7B]/40'
                    : 'bg-[#EDE6DD] text-[#5F635E] border border-[#E2DAD0]'
                }`}
              >
                {activeThought.type}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBubbleDismissed(true);
                }}
                title="Dismiss thought"
                aria-label="Dismiss thought"
                className="p-0.5 rounded-full text-[#5F635E] hover:text-[#2C332A] hover:bg-[#F4EFEA] transition-smooth"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={handleTalkAboutThought}
              className="text-left group/bubble w-full focus:outline-none"
            >
              <p className="text-xs text-[#2C332A] leading-relaxed">
                {activeThought.text}
              </p>
              <span className="inline-block mt-1.5 text-[11px] font-medium text-[#4F5E47] group-hover/bubble:underline">
                Ask Finch about this →
              </span>
            </button>

            {/* Speech bubble tail pointing down to Finch */}
            <div className="absolute -bottom-1.5 right-12 w-3 h-3 bg-white border-r border-b border-[#4F5E47]/15 rotate-45" />
          </div>
        )}

        {/* Bird & hover discreet-hide control */}
        <div className="group/finch flex items-end gap-1.5">
          <button
            onClick={() => setIsDiscreetHidden(true)}
            title="Discreetly hide Finch"
            aria-label="Discreetly hide Finch"
            className="mb-3 p-1.5 rounded-full bg-white/90 hover:bg-[#F4EFEA] text-[#5F635E] hover:text-[#4F5E47] border border-[#E2DAD0] shadow-serene opacity-0 group-hover/finch:opacity-100 transition-opacity duration-200"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setActiveTab('chat');
              toggleBuddyDrawer();
            }}
            data-testid="ruth-buddy-pill"
            title="Chat with Finch"
            aria-label="Chat with Finch"
            className="group relative p-1 transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none"
          >
            <FinchBird
              className="w-28 h-28 sm:w-32 sm:h-32 drop-shadow-[0_8px_16px_rgba(56,70,49,0.18)]"
              isThinking={isUpdatingWiki}
            />
          </button>
        </div>
      </div>
    );
  }

  // Expanded Drawer / Modal State
  return (
    <div
      data-testid="ruth-buddy-drawer"
      className="fixed bottom-4 right-4 z-50 w-[390px] sm:w-[440px] max-w-[calc(100vw-2rem)] h-[610px] max-h-[calc(100vh-2rem)] bg-[#FAF7F2] border border-[#4F5E47]/15 rounded-3xl shadow-2xl shadow-[#384631]/15 flex flex-col overflow-hidden animate-fade-in"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#384631] to-[#4F5E47] text-[#FAF7F2] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#FAF7F2]/95 backdrop-blur-sm border border-[#FAF7F2]/40 flex items-center justify-center shadow-sm">
              <FinchBird className="w-8 h-8" isThinking={isUpdatingWiki} />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#8A9A7B] border-2 border-[#384631]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-medium text-base tracking-tight text-[#FAF7F2]">Finch</h3>
              {isUpdatingWiki ? (
                <span className="inline-flex items-center gap-1 text-[10px] bg-[#FAF7F2]/15 text-[#FAF7F2] border border-[#FAF7F2]/25 px-2 py-0.5 rounded-full">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  Updating Wiki...
                </span>
              ) : (
                <span className="text-[10px] bg-[#FAF7F2]/15 text-[#FAF7F2] px-2 py-0.5 rounded-full">
                  {totalFacts} memories
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#FAF7F2]/80">
              Empathetic &amp; State-Grounded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              closeBuddyDrawer();
              setIsDiscreetHidden(true);
            }}
            title="Discreetly hide widget"
            className="p-1.5 rounded-lg text-[#FAF7F2]/80 hover:text-[#FAF7F2] hover:bg-[#FAF7F2]/10 transition-smooth"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <button
            onClick={handleQuickSafeExit}
            title="Quick Safe Exit (opens Weather.com)"
            className="flex items-center gap-1 bg-[#FAF7F2]/15 hover:bg-[#FAF7F2]/25 text-[#FAF7F2] border border-[#FAF7F2]/30 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-smooth"
          >
            <AlertOctagon className="w-3 h-3" />
            Exit
          </button>
          <button
            onClick={closeBuddyDrawer}
            title="Minimize"
            aria-label="Minimize Finch"
            className="p-1.5 rounded-lg text-[#FAF7F2]/80 hover:text-[#FAF7F2] hover:bg-[#FAF7F2]/10 transition-smooth"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-white border-b border-[#E2DAD0] px-3 py-2 flex gap-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-smooth ${
            activeTab === 'chat'
              ? 'bg-[#F4EFEA] text-[#384631] border border-[#8A9A7B]/40'
              : 'text-[#5F635E] hover:bg-[#FAF7F2]'
          }`}
        >
          <MessageCircleHeart className="w-3.5 h-3.5" />
          Chat with Finch
        </button>
        <button
          onClick={() => setActiveTab('memory')}
          data-testid="memory-inspector-tab"
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-smooth ${
            activeTab === 'memory'
              ? 'bg-[#F4EFEA] text-[#384631] border border-[#8A9A7B]/40'
              : 'text-[#5F635E] hover:bg-[#FAF7F2]'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          What Finch Remembers
          <span className="text-[10px] bg-white px-1.5 py-0.2 rounded-full border border-[#E2DAD0] text-[#4F5E47]">
            {totalFacts}
          </span>
        </button>
      </div>

      {/* TAB 1: CHAT */}
      {activeTab === 'chat' && (
        <div key="chat" className="flex-1 flex flex-col min-h-0 animate-fade-in">
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {chatMessages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed ${
                      isUser
                        ? 'bg-[#4F5E47] text-[#FAF7F2] rounded-br-sm shadow-sm'
                        : 'bg-white border border-[#4F5E47]/10 text-[#2C332A] rounded-bl-sm shadow-serene'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Extracted fact badges on agent messages */}
                  {!isUser && Array.isArray(msg.extractedFacts) && msg.extractedFacts.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1 max-w-[85%]">
                      {msg.extractedFacts.map((fact, fIdx) => (
                        <button
                          key={fact.id || fIdx}
                          onClick={() => setActiveTab('memory')}
                          className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#F4EFEA] text-[#4F5E47] border border-[#8A9A7B]/40 px-2 py-0.5 rounded-full hover:bg-[#EDE6DD] transition-smooth"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-[#A07E5F]" />
                          Saved: {fact.category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isUpdatingWiki && (
              <div className="flex items-center gap-2 text-xs text-[#4F5E47] bg-[#F4EFEA] border border-[#E2DAD0] rounded-xl px-3 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Finch is thinking &amp; updating your Personal Wiki...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-white/90 border-t border-[#E2DAD0] flex gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleChipClick(`Tell me more about: "${activeThought.text}"`)}
              disabled={isUpdatingWiki}
              className="flex-shrink-0 text-[11px] bg-[#F4EFEA] hover:bg-[#EDE6DD] text-[#384631] border border-[#8A9A7B]/50 rounded-full px-2.5 py-1 transition-smooth truncate max-w-[230px] font-medium"
              title={activeThought.text}
            >
              Ask about: {activeThought.topic}
            </button>
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip)}
                disabled={isUpdatingWiki}
                className="flex-shrink-0 text-[11px] bg-[#FAF7F2] hover:bg-[#F4EFEA] text-[#4F5E47] border border-[#E2DAD0] rounded-full px-2.5 py-1 transition-smooth truncate max-w-[220px]"
                title={chip}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-[#E2DAD0] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share a detail or ask Finch anything..."
              className="flex-1 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3 py-2 text-[#2C332A] placeholder-[#5F635E]/60 focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isUpdatingWiki}
              aria-label="Send message"
              className="p-2.5 rounded-xl bg-[#4F5E47] hover:bg-[#384631] disabled:opacity-40 text-[#FAF7F2] transition-smooth shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: MEMORY INSPECTOR ("What Ruth Remembers About You") */}
      {activeTab === 'memory' && (
        <div key="memory" className="flex-1 flex flex-col overflow-hidden animate-fade-in">
          {/* Inspector Sub-header */}
          <div className="px-4 py-2.5 bg-[#F4EFEA] border-b border-[#E2DAD0] flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#384631]">Personal LLM Wiki</p>
              <p className="text-[11px] text-[#5F635E]">
                {totalFacts} {totalFacts === 1 ? 'fact' : 'facts'} organized across 5 living files
              </p>
            </div>
            <div className="flex items-center gap-1 bg-white border border-[#E2DAD0] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('structured')}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md font-medium transition-smooth ${
                  viewMode === 'structured' ? 'bg-[#EDE6DD] text-[#384631]' : 'text-[#5F635E]'
                }`}
              >
                <ListChecks className="w-3 h-3" />
                Facts
              </button>
              <button
                onClick={() => setViewMode('markdown')}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md font-medium transition-smooth ${
                  viewMode === 'markdown' ? 'bg-[#EDE6DD] text-[#384631]' : 'text-[#5F635E]'
                }`}
              >
                <FileCode2 className="w-3 h-3" />
                .md
              </button>
            </div>
          </div>

          {/* Wiki Sections List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {SECTION_ORDER.map((sectionKey) => {
              const section = wikiData?.sections?.[sectionKey];
              if (!section) return null;
              const facts = section.facts || [];

              return (
                <div
                  key={sectionKey}
                  className="bg-white border border-[#4F5E47]/10 rounded-2xl p-3 shadow-serene space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-semibold text-[#1c1c19]">{section.title}</h4>
                        <span className="text-[10px] font-mono bg-[#F4EFEA] text-[#5F635E] px-1.5 py-0.5 rounded">
                          {section.filename}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAddingToSection(addingToSection === sectionKey ? null : sectionKey);
                        setNewFactText('');
                      }}
                      title={`Add note to ${section.title}`}
                      className="text-[11px] flex items-center gap-0.5 text-[#4F5E47] hover:text-[#384631] font-medium px-1.5 py-0.5 rounded hover:bg-[#F4EFEA] transition-smooth"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>

                  {/* Add Manual Fact Input */}
                  {addingToSection === sectionKey && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={newFactText}
                        onChange={(e) => setNewFactText(e.target.value)}
                        placeholder={`Add to ${section.title}...`}
                        className="flex-1 text-xs bg-[#FAF7F2] border border-[#E2DAD0] rounded-lg px-2.5 py-1.5 text-[#2C332A] focus:outline-none focus:ring-1 focus:ring-[#A07E5F]"
                      />
                      <button
                        onClick={() => handleAddManualFact(sectionKey)}
                        className="p-1.5 bg-[#4F5E47] text-[#FAF7F2] rounded-lg hover:bg-[#384631]"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {viewMode === 'markdown' ? (
                    <pre className="text-[11px] font-mono bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl p-2.5 whitespace-pre-wrap text-[#2C332A] overflow-x-auto">
                      {section.markdown}
                    </pre>
                  ) : facts.length === 0 ? (
                    <p className="text-[11px] italic text-[#5F635E]/70">
                      No facts recorded in this section yet.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {facts.map((fact) => {
                        const isEditing = editingFact?.factId === fact.id;
                        return (
                          <li
                            key={fact.id}
                            className="group bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl p-2 text-xs text-[#2C332A]"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editingFact.text}
                                  onChange={(e) =>
                                    setEditingFact({ ...editingFact, text: e.target.value })
                                  }
                                  className="flex-1 text-xs bg-white border border-[#E2DAD0] rounded-lg px-2 py-1 focus:outline-none focus:border-[#A07E5F]"
                                />
                                <button
                                  onClick={handleSaveEdit}
                                  title="Save"
                                  className="p-1 bg-[#4F5E47] text-[#FAF7F2] rounded-md hover:bg-[#384631]"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingFact(null)}
                                  title="Cancel"
                                  className="p-1 bg-[#EDE6DD] text-[#5F635E] rounded-md hover:bg-[#E2DAD0]"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <span className="inline-block text-[10px] font-semibold text-[#4F5E47] bg-[#EDE6DD] px-1.5 py-0.2 rounded mr-1.5">
                                    {fact.category}
                                  </span>
                                  <span>{fact.text}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition flex-shrink-0">
                                  <button
                                    onClick={() =>
                                      setEditingFact({
                                        sectionKey,
                                        factId: fact.id,
                                        text: fact.text
                                      })
                                    }
                                    title="Edit fact"
                                    className="p-1 text-[#5F635E] hover:text-[#4F5E47] rounded hover:bg-white"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFact(sectionKey, fact.id)}
                                    title="Delete fact"
                                    className="p-1 text-[#5F635E] hover:text-[#A86851] rounded hover:bg-white"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer: Purge All Memory (CCPA Compliance & Safety) */}
          <div className="p-3 bg-white border-t border-[#E2DAD0]">
            {!confirmPurge ? (
              <button
                onClick={() => setConfirmPurge(true)}
                data-testid="purge-memory-btn"
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#A86851] bg-[#FAF2F0] hover:bg-[#F4E6E2] border border-[#D9B3AC] rounded-xl py-2 transition-smooth"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Purge All Memory (CCPA &amp; Safety)
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePurge}
                  className="flex-1 text-xs font-bold bg-[#A86851] hover:bg-[#8F5541] text-[#FAF7F2] rounded-xl py-2 transition-smooth"
                >
                  Confirm Permanent Purge
                </button>
                <button
                  onClick={() => setConfirmPurge(false)}
                  className="px-3 text-xs font-semibold bg-[#F4EFEA] hover:bg-[#EDE6DD] text-[#5F635E] rounded-xl py-2 transition-smooth"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
