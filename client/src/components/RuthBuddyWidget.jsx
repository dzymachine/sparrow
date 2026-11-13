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

const SECTION_ORDER = [
  'profile',
  'financial_footprint',
  'priorities_and_goals',
  'lawyer_readiness',
  'interaction_log'
];

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

  const messagesEndRef = useRef(null);

  const totalFacts = wikiData?.stats?.totalFacts || 0;

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

  // Ultra-discreet hidden mode (tiny neutral restore button)
  if (isDiscreetHidden) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsDiscreetHidden(false)}
          title="Restore assistant"
          aria-label="Restore assistant"
          className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-500 flex items-center justify-center shadow-sm border border-slate-300/60 transition"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Minimized Pill State
  if (!isBuddyOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
        <button
          onClick={() => setIsDiscreetHidden(true)}
          title="Discreetly hide Ruth"
          aria-label="Discreetly hide Ruth"
          className="p-2 rounded-full bg-white/90 hover:bg-amber-50 text-slate-400 hover:text-amber-700 border border-brand-200/80 shadow-md transition"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={toggleBuddyDrawer}
          data-testid="ruth-buddy-pill"
          className="group flex items-center gap-3 bg-white hover:bg-brand-50/90 border border-brand-200 shadow-xl shadow-brand-900/10 rounded-full pl-2.5 pr-4 py-2 transition-all duration-200 hover:-translate-y-0.5"
        >
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              R
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white" />
            </span>
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900">Ruth</span>
              <span className="text-[11px] font-medium text-brand-700 bg-brand-100/80 px-2 py-0.5 rounded-full">
                {isUpdatingWiki
                  ? 'Updating Wiki...'
                  : `${totalFacts} ${totalFacts === 1 ? 'memory' : 'memories'} saved`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Your private financial companion
            </p>
          </div>
        </button>
      </div>
    );
  }

  // Expanded Drawer / Modal State
  return (
    <div
      data-testid="ruth-buddy-drawer"
      className="fixed bottom-4 right-4 z-50 w-[390px] sm:w-[440px] max-w-[calc(100vw-2rem)] h-[610px] max-h-[calc(100vh-2rem)] bg-[#FAF9F6] border border-brand-200 rounded-3xl shadow-2xl shadow-brand-900/20 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center font-bold text-sm">
              R
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-brand-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-tight">Ruth</h3>
              {isUpdatingWiki ? (
                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-400/20 text-amber-100 border border-amber-300/30 px-2 py-0.5 rounded-full">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  Updating Wiki...
                </span>
              ) : (
                <span className="text-[10px] bg-white/15 text-brand-50 px-2 py-0.5 rounded-full">
                  {totalFacts} memories
                </span>
              )}
            </div>
            <p className="text-[11px] text-brand-100/90">
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
            className="p-1.5 rounded-lg text-brand-100 hover:text-white hover:bg-white/10 transition"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <button
            onClick={handleQuickSafeExit}
            title="Quick Safe Exit (opens Weather.com)"
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold px-2 py-1 rounded-lg transition"
          >
            <AlertOctagon className="w-3 h-3" />
            Exit
          </button>
          <button
            onClick={closeBuddyDrawer}
            title="Minimize"
            aria-label="Minimize Ruth"
            className="p-1.5 rounded-lg text-brand-100 hover:text-white hover:bg-white/10 transition"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-white border-b border-brand-200/80 px-3 py-2 flex gap-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition ${
            activeTab === 'chat'
              ? 'bg-brand-100 text-brand-900 border border-brand-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageCircleHeart className="w-3.5 h-3.5" />
          Chat with Ruth
        </button>
        <button
          onClick={() => setActiveTab('memory')}
          data-testid="memory-inspector-tab"
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition ${
            activeTab === 'memory'
              ? 'bg-sage-100 text-sage-700 border border-sage-500/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          What Ruth Remembers
          <span className="text-[10px] bg-white/80 px-1.5 py-0.2 rounded-full border border-slate-200">
            {totalFacts}
          </span>
        </button>
      </div>

      {/* TAB 1: CHAT */}
      {activeTab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {chatMessages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-brand-700 text-white rounded-br-sm'
                        : 'bg-white border border-brand-200/80 text-slate-800 rounded-bl-sm'
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
                          className="inline-flex items-center gap-1 text-[10px] font-medium bg-sage-50 text-sage-700 border border-sage-500/30 px-2 py-0.5 rounded-full hover:bg-sage-100 transition"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          Saved: {fact.category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isUpdatingWiki && (
              <div className="flex items-center gap-2 text-xs text-brand-700 bg-brand-50 border border-brand-200 rounded-xl px-3 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Ruth is thinking &amp; updating your Personal Wiki...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-white/80 border-t border-brand-100 flex gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip)}
                disabled={isUpdatingWiki}
                className="flex-shrink-0 text-[11px] bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200/80 rounded-full px-2.5 py-1 transition truncate max-w-[220px]"
                title={chip}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-brand-200/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share a detail or ask Ruth anything..."
              className="flex-1 text-xs sm:text-sm bg-[#FAF9F6] border border-brand-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isUpdatingWiki}
              aria-label="Send message"
              className="p-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 disabled:opacity-40 text-white transition shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}

      {/* TAB 2: MEMORY INSPECTOR ("What Ruth Remembers About You") */}
      {activeTab === 'memory' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Inspector Sub-header */}
          <div className="px-4 py-2.5 bg-sage-50 border-b border-sage-500/20 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-sage-700">Personal LLM Wiki</p>
              <p className="text-[11px] text-slate-600">
                {totalFacts} {totalFacts === 1 ? 'fact' : 'facts'} organized across 5 living files
              </p>
            </div>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('structured')}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md font-medium transition ${
                  viewMode === 'structured' ? 'bg-sage-100 text-sage-700' : 'text-slate-500'
                }`}
              >
                <ListChecks className="w-3 h-3" />
                Facts
              </button>
              <button
                onClick={() => setViewMode('markdown')}
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md font-medium transition ${
                  viewMode === 'markdown' ? 'bg-sage-100 text-sage-700' : 'text-slate-500'
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
                  className="bg-white border border-brand-200/80 rounded-2xl p-3 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900">{section.title}</h4>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
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
                      className="text-[11px] flex items-center gap-0.5 text-brand-700 hover:text-brand-900 font-medium px-1.5 py-0.5 rounded hover:bg-brand-50 transition"
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
                        className="flex-1 text-xs bg-[#FAF9F6] border border-brand-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <button
                        onClick={() => handleAddManualFact(sectionKey)}
                        className="p-1.5 bg-brand-700 text-white rounded-lg hover:bg-brand-800"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {viewMode === 'markdown' ? (
                    <pre className="text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 whitespace-pre-wrap text-slate-700 overflow-x-auto">
                      {section.markdown}
                    </pre>
                  ) : facts.length === 0 ? (
                    <p className="text-[11px] italic text-slate-400">
                      No facts recorded in this section yet.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {facts.map((fact) => {
                        const isEditing = editingFact?.factId === fact.id;
                        return (
                          <li
                            key={fact.id}
                            className="group bg-[#FAF9F6] border border-brand-100 rounded-xl p-2 text-xs text-slate-800"
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editingFact.text}
                                  onChange={(e) =>
                                    setEditingFact({ ...editingFact, text: e.target.value })
                                  }
                                  className="flex-1 text-xs bg-white border border-brand-300 rounded-lg px-2 py-1 focus:outline-none"
                                />
                                <button
                                  onClick={handleSaveEdit}
                                  title="Save"
                                  className="p-1 bg-sage-600 text-white rounded-md hover:bg-sage-700"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingFact(null)}
                                  title="Cancel"
                                  className="p-1 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <span className="inline-block text-[10px] font-semibold text-brand-700 bg-brand-100/70 px-1.5 py-0.2 rounded mr-1.5">
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
                                    className="p-1 text-slate-500 hover:text-brand-700 rounded hover:bg-white"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFact(sectionKey, fact.id)}
                                    title="Delete fact"
                                    className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-white"
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
          <div className="p-3 bg-white border-t border-brand-200/80">
            {!confirmPurge ? (
              <button
                onClick={() => setConfirmPurge(true)}
                data-testid="purge-memory-btn"
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl py-2 transition"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Purge All Memory (CCPA &amp; Safety)
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePurge}
                  className="flex-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2 transition"
                >
                  Confirm Permanent Purge
                </button>
                <button
                  onClick={() => setConfirmPurge(false)}
                  className="px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-2 transition"
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
