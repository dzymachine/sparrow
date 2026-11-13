import React, { useState } from 'react';
import { 
  FileSearch, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  Download, 
  Shield, 
  Home, 
  DollarSign,
  Layers,
  Archive,
  HeartHandshake,
  ArrowRight,
  Printer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgentMemory } from '../context/AgentMemoryContext';
import { useDiscovery } from '../context/DiscoveryContext';

import DiscoveryMetricsOverview from '../components/discovery/DiscoveryMetricsOverview';
import FinancialDiscoveryView from '../components/discovery/FinancialDiscoveryView';
import ExtractionReviewDrawer from '../components/discovery/ExtractionReviewDrawer';
import AccountVaultView from '../components/discovery/AccountVaultView';
import MyNewBaselineView from '../components/discovery/MyNewBaselineView';
import HousingSandboxView from '../components/discovery/HousingSandboxView';
import LedgerProtectionView from '../components/discovery/LedgerProtectionView';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { profile, chatMessages, sendMessage } = useAgentMemory();
  const { workspace, openReviewDrawer, exportDiscoveryPacket } = useDiscovery();

  const [activeTab, setActiveTab] = useState<'overview' | 'discovery' | 'vault' | 'baseline' | 'housing' | 'ledger' | 'advisor'>('overview');
  const [chatInput, setChatInput] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const navItems = [
    { id: 'overview', label: '1. Overview & Metrics', icon: Layers },
    { id: 'discovery', label: '2. Financial Discovery Engine', icon: FileSearch, badge: workspace.documents.length },
    { id: 'vault', label: '3. Account Vault', icon: Archive, badge: workspace.accountVault.length },
    { id: 'baseline', label: '4. My New Baseline', icon: DollarSign },
    { id: 'housing', label: '5. Housing Sandbox', icon: Home },
    { id: 'ledger', label: '6. Ledger & Protection', icon: HeartHandshake },
    { id: 'advisor', label: '7. AI Legal Advisor', icon: Sparkles }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      {/* Top Banner / Welcome Header */}
      <div className="bg-white border border-[#E2DBD0] rounded-xl p-6 sm:p-7 shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium text-[#261E19] tracking-tight">
              Welcome, {currentUser?.displayName || 'Sarah'}
            </h1>
            <span className="text-xs text-[#8C7D73]">·</span>
            <span className="text-xs text-[#435C4D] font-mono">
              California Jurisdiction (Cal. Fam. Code § 760)
            </span>
          </div>
          <p className="text-xs text-[#5C4E43] leading-relaxed max-w-2xl">
            {profile?.financialRole === 'spouse_handled_all' 
              ? 'Spouse-managed household profile active. The Financial Discovery Engine extracts hidden assets and establishes your baseline.'
              : 'Grounded financial discovery and document intelligence. Everything is private, local, and user-verified.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => exportDiscoveryPacket('print')}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 bg-[#435C4D] hover:bg-[#354A3E] text-white font-medium text-xs px-4 py-2 rounded-lg shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export Discovery Packet</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#E2DBD0] overflow-x-auto gap-1">
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium text-xs whitespace-nowrap transition ${
                isActive
                  ? 'border-[#435C4D] text-[#261E19] bg-white/70 rounded-t-lg'
                  : 'border-transparent text-[#5C4E43] hover:text-[#261E19] hover:border-[#E2DBD0]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#435C4D]' : 'text-[#8C7D73]'}`} />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-[#E6ECE6] text-[#435C4D]' : 'bg-[#E2DBD0] text-[#5C4E43]'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* VIEW 1: Overview & Discovery Metrics */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Top-Level Discovery Metrics Section */}
          <DiscoveryMetricsOverview />

          {/* Quick-Jump Module Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => setActiveTab('discovery')}
              className="bg-white border border-[#E2DBD0] hover:border-[#435C4D] p-5 rounded-xl cursor-pointer transition space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#435C4D]">Document Intelligence</span>
                <ArrowRight className="w-4 h-4 text-[#8C7D73] group-hover:text-[#435C4D] transition-transform group-hover:translate-x-0.5" />
              </div>
              <h3 className="text-sm font-medium text-[#261E19]">
                Financial Discovery Engine
              </h3>
              <p className="text-xs text-[#5C4E43] leading-relaxed">
                Upload tax forms (1040), 401(k) statements, or mortgage slips. Review plain-English 2-sentence takeaways before syncing.
              </p>
              <div className="text-[11px] text-[#8C7D73] font-mono pt-1">
                {workspace.documents.length} files currently analyzed
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('vault')}
              className="bg-white border border-[#E2DBD0] hover:border-[#435C4D] p-5 rounded-xl cursor-pointer transition space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#435C4D]">Reconciled Holdings</span>
                <ArrowRight className="w-4 h-4 text-[#8C7D73] group-hover:text-[#435C4D] transition-transform group-hover:translate-x-0.5" />
              </div>
              <h3 className="text-sm font-medium text-[#261E19]">
                Account Vault & Schedule B Leads
              </h3>
              <p className="text-xs text-[#5C4E43] leading-relaxed">
                Inventory of joint, spouse-held, and unlisted accounts discovered via dividend payouts and recurring transfers.
              </p>
              <div className="text-[11px] text-amber-900 font-mono pt-1">
                {workspace.accountVault.filter((a) => a.isUnlistedDiscovery).length} unlisted accounts flagged
              </div>
            </div>

            <div 
              onClick={() => setActiveTab('baseline')}
              className="bg-white border border-[#E2DBD0] hover:border-[#435C4D] p-5 rounded-xl cursor-pointer transition space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#435C4D]">FL-150 Living Expenses</span>
                <ArrowRight className="w-4 h-4 text-[#8C7D73] group-hover:text-[#435C4D] transition-transform group-hover:translate-x-0.5" />
              </div>
              <h3 className="text-sm font-medium text-[#261E19]">
                My New Baseline Budget
              </h3>
              <p className="text-xs text-[#5C4E43] leading-relaxed">
                Bucket A (Must-Pays) and Bucket B (Life & Kids) calculated from verified bank statements and paychecks.
              </p>
              <div className="text-[11px] text-[#8C7D73] font-mono pt-1">
                ${(workspace.baseline.mustPays.reduce((a, b) => a + b.amount, 0) + workspace.baseline.lifeAndKids.reduce((a, b) => a + b.amount, 0)).toLocaleString()} / mo documented essentials
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Financial Discovery View */}
      {activeTab === 'discovery' && <FinancialDiscoveryView />}

      {/* VIEW 3: Account Vault */}
      {activeTab === 'vault' && <AccountVaultView />}

      {/* VIEW 4: My New Baseline */}
      {activeTab === 'baseline' && <MyNewBaselineView />}

      {/* VIEW 5: Housing Sandbox */}
      {activeTab === 'housing' && <HousingSandboxView />}

      {/* VIEW 6: Ledger & Protection */}
      {activeTab === 'ledger' && <LedgerProtectionView />}

      {/* VIEW 7: AI Legal Advisor Chat */}
      {activeTab === 'advisor' && (
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#435C4D] flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-medium text-[#261E19] text-base">Ruth AI Advisor</h3>
              <p className="text-xs text-[#5C4E43]">
                Grounded in your uploaded discovery files and California Family Code (§§ 760, 2104, 2550, 4320).
              </p>
            </div>
          </div>

          <div className="bg-[#FAF9F6] rounded-xl p-4 sm:p-5 h-96 overflow-y-auto space-y-3.5 border border-[#E2DBD0]">
            {chatMessages.map((msg: any, index: number) => {
              const isAgent = msg.sender === 'agent';
              return (
                <div key={index} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-xl rounded-xl p-3.5 text-xs sm:text-xs leading-relaxed ${
                    isAgent 
                      ? 'bg-white border border-[#E2DBD0] text-[#261E19] shadow-none' 
                      : 'bg-[#435C4D] text-white shadow-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything: 'What is a QDRO?', 'How do I subpoena Schedule B accounts?', 'Can I keep the house?'"
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-[#E2DBD0] focus:outline-none focus:border-[#435C4D] text-xs font-sans text-[#261E19] bg-[#FAF9F6]"
            />
            <button
              type="submit"
              className="bg-[#435C4D] hover:bg-[#354A3E] text-white px-4 rounded-lg text-xs font-medium transition flex items-center justify-center shadow-xs"
            >
              Ask Advisor
            </button>
          </form>
        </div>
      )}

      {/* Extraction Review Drawer (Slides in from right when active) */}
      <ExtractionReviewDrawer />
    </div>
  );
}
