import React, { useState } from 'react';
import { 
  FileSearch, 
  CheckCircle2, 
  TrendingUp, 
  FileText, 
  UploadCloud, 
  AlertTriangle, 
  Send, 
  Sparkles, 
  Download, 
  ExternalLink,
  Shield,
  HelpCircle,
  Home,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgentMemory } from '../context/AgentMemoryContext';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { profile, agentMemory, chatMessages, sendMessage, addDiscoveredAsset } = useAgentMemory();

  const [activeTab, setActiveTab] = useState('discovery');
  const [chatInput, setChatInput] = useState('');
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Home affordability simulator states
  const [homeValue, setHomeValue] = useState(850000);
  const [mortgageRemaining, setMortgageRemaining] = useState(320000);
  const [monthlyIncome, setMonthlyIncome] = useState(5500);
  const [expectedSupport, setExpectedSupport] = useState(2500);

  const monthlyMortgageEst = Math.round((mortgageRemaining * 0.006) + 600); // Principal, interest, tax & ins
  const totalMonthlyIncome = monthlyIncome + expectedSupport;
  const housingExpenseRatio = Math.round((monthlyMortgageEst / (totalMonthlyIncome || 1)) * 100);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      addDiscoveredAsset({
        type: 'Investment Account',
        name: 'Vanguard Brokerage (Joint)',
        estimatedValue: 125000,
        sourceDocument: '2023 Form 1040 Schedule B (Page 3)',
        status: 'Unreported in initial informal list',
        flag: 'High liquidity asset divisible equally under CA law'
      });
      setIsUploading(false);
    }, 1500);
  };

  const handleDownloadBrief = () => {
    const briefContent = `
KNOW WHAT'S YOURS | LAWYER CONSULTATION BRIEF
Prepared for: ${currentUser?.displayName || 'Client'}
State Jurisdiction: ${profile?.stateJurisdiction || 'California (Community Property)'}
Marriage Length: ${profile?.marriageLengthYears || 15} Years | Children: ${profile?.childrenCount || 2}
Date Generated: ${new Date().toLocaleDateString()}

============================================================
1. FINANCIAL PROFILE SUMMARY
${agentMemory?.financialProfileSummary || 'Spouse handled majority of accounts. Active discovery phase.'}

============================================================
2. DISCOVERED ASSETS & DISCLOSURE FLAGS
${(agentMemory?.discoveredAssets || []).map((ast, i) => `
${i + 1}. ${ast.name} (${ast.type})
   - Estimated Value: $${ast.estimatedValue?.toLocaleString()}
   - Source Citation: ${ast.sourceDocument || 'User Upload'}
   - Legal Flag: ${ast.flag || 'Review needed'}
`).join('')}

============================================================
3. TARGET QUESTIONS FOR FIRST LEGAL CONSULTATION
1. Should we subpoena Form 1040 Schedule B accounts (Fidelity & Vanguard)?
2. Does maintaining the primary residence make sense under refinancing terms?
3. What is the standard spousal support duration under ${profile?.stateJurisdiction || 'state'} law?
4. How should the 401(k) Qualified Domestic Relations Order (QDRO) be drafted?

============================================================
DISCLAIMER: This brief is compiled by RuthAI for attorney consultation prep only.
`;
    const element = document.createElement('a');
    const file = new Blob([briefContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Lawyer_Brief_${currentUser?.displayName || 'RuthAI'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Welcome Header */}
      <div className="bg-white border border-brand-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Welcome back, {currentUser?.displayName || 'Sarah'}
            </h1>
            <span className="text-xs bg-brand-100 text-brand-800 font-semibold px-2.5 py-0.5 rounded-full border border-brand-200">
              {profile?.stateJurisdiction || 'California'}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {profile?.financialRole === 'spouse_handled_all' 
              ? 'Spouse-managed household profile active • Google Gemini Discovery running'
              : 'Empowering your financial discovery step-by-step.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleDownloadBrief}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Lawyer Consultation Brief</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs for the 4 Pillars */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {[
          { id: 'discovery', label: '1. Financial Discovery Engine', icon: FileSearch },
          { id: 'checklist', label: '2. Entitlements Checklist', icon: CheckCircle2 },
          { id: 'projection', label: '3. Life & Home Projection', icon: TrendingUp },
          { id: 'advisor', label: '4. Ruth AI Advisor Chat', icon: Sparkles }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition ${
                isActive
                  ? 'border-brand-700 text-brand-900 font-bold bg-white/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-700' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Financial Discovery Engine (The Showpiece) */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          {/* Document Upload Zone */}
          <div className="bg-white border-2 border-dashed border-brand-300 rounded-3xl p-8 text-center hover:border-brand-500 transition cursor-pointer">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Upload whatever financial documents you have
              </h3>
              <p className="text-xs text-slate-500">
                Tax returns (1040), W-2s, bank statements, 401(k) letters, mortgage slips. 
                Even incomplete or blurry scans.
              </p>
              <button
                type="button"
                disabled={isUploading}
                onClick={handleSimulateUpload}
                className="inline-flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Gemini Extracting Accounts...' : 'Simulate Tax Return Scan'}</span>
              </button>
            </div>
          </div>

          {/* Discovered Assets & Account Footprint Table */}
          <div className="bg-white border border-brand-200/80 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Discovered Marital Footprint</h3>
                <p className="text-xs text-slate-500">
                  Every account and asset discovered across your files, cited directly to source documents.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 self-start sm:self-auto">
                {(agentMemory?.discoveredAssets || []).length} Verified Findings
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                    <th className="p-4">Asset / Account Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Est. Value</th>
                    <th className="p-4">Grounded Source Citation</th>
                    <th className="p-4">Discovery Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(agentMemory?.discoveredAssets || []).map((asset) => (
                    <tr key={asset.id} className="hover:bg-brand-50/30 transition">
                      <td className="p-4 font-semibold text-slate-900">
                        {asset.name}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {asset.type}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-medium text-slate-900">
                        ${asset.estimatedValue?.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedCitation(asset.sourceDocument || 'Joint 2024 Tax Return 1040, Page 2')}
                          className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-900 underline font-medium"
                        >
                          <span>{asset.sourceDocument || '1040 Schedule B'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-medium">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {asset.flag || 'Review with lawyer'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Entitlements Checklist */}
      {activeTab === 'checklist' && (
        <div className="bg-white border border-brand-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              "What You May Be Entitled To" Legal Checklist
            </h3>
            <p className="text-xs text-slate-500">
              Plain-language guidelines for {profile?.stateJurisdiction || 'California'}. Check off items as you gather information.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: 'Retirement Account Division (401k / Pensions)',
                status: 'Critical',
                description: 'Under ERISA, retirement earned during marriage is marital property regardless of whose name is on the account. Requires a Qualified Domestic Relations Order (QDRO) to divide without tax penalty.',
                action: 'Request plan administrator SPD & QDRO guidelines'
              },
              {
                title: 'Spousal Maintenance / Alimony Duration',
                status: 'High Priority',
                description: `For a marriage of ${profile?.marriageLengthYears || 15} years in ${profile?.stateJurisdiction || 'California'}, this qualifies as a long-duration marriage. Courts typically retain jurisdiction over support unless waived.`,
                action: 'Calculate guideline support baseline'
              },
              {
                title: 'Primary Residence Equity & Buyout Evaluation',
                status: 'Reviewing',
                description: 'If you want to keep the home, you will need to refinance into your own name and buy out 50% of the accumulated net equity.',
                action: 'Get independent CMA appraisal'
              },
              {
                title: 'Health Insurance Continuation (COBRA)',
                status: 'Essential',
                description: 'Federal COBRA permits you to stay on your spouse’s employer health plan for up to 36 months following divorce (paid by you or negotiated in settlement).',
                action: 'Check employer group plan COBRA rates'
              }
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-200 hover:border-brand-300 transition space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-7">
                  {item.description}
                </p>
                <div className="pl-7 pt-1 text-xs font-semibold text-brand-700">
                  Recommended action: {item.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Life & Home Projection */}
      {activeTab === 'projection' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white border border-brand-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              "Can I Keep the House?" Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Test monthly affordability on your realistic post-divorce income.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Home Value ($)
                </label>
                <input
                  type="number"
                  value={homeValue}
                  onChange={(e) => setHomeValue(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remaining Mortgage Balance ($)
                </label>
                <input
                  type="number"
                  value={mortgageRemaining}
                  onChange={(e) => setMortgageRemaining(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Monthly Income ($)
                </label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Spousal & Child Support ($)
                </label>
                <input
                  type="number"
                  value={expectedSupport}
                  onChange={(e) => setExpectedSupport(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-brand-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">5-Year Affordability Outlook</h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                housingExpenseRatio > 45 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                Housing Ratio: {housingExpenseRatio}% of Income
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs text-slate-500 font-semibold block">Scenario A: Keep House</span>
                <div className="text-2xl font-extrabold text-slate-900">${monthlyMortgageEst.toLocaleString()} / mo</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Includes mortgage, taxes, insurance & basic upkeep. 
                  {housingExpenseRatio > 45 && (
                    <span className="text-rose-700 font-semibold block mt-1">
                      Warning: Exceeds 45% recommended safety ceiling.
                    </span>
                  )}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <span className="text-xs text-emerald-800 font-semibold block">Scenario B: Sell & Divide Equity</span>
                <div className="text-2xl font-extrabold text-emerald-950">
                  +${Math.round((homeValue - mortgageRemaining) / 2).toLocaleString()}
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Estimated lump sum cash distribution to you. Provides immediate emergency liquidity and investment flexibility.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <strong>Ruth AI Advisory Note:</strong> Support payments often diminish or end after a predetermined term. If keeping the house relies entirely on spousal maintenance, consider negotiating an offset in retirement assets instead.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Ruth AI Advisor Chat */}
      {activeTab === 'advisor' && (
        <div className="bg-white border border-brand-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Ruth AI Advisor</h3>
              <p className="text-xs text-slate-500">
                Grounding responses in your uploaded documents and {profile?.stateJurisdiction || 'state'} laws.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 sm:p-6 h-96 overflow-y-auto space-y-4 border border-slate-200">
            {chatMessages.map((msg, index) => {
              const isAgent = msg.sender === 'agent';
              return (
                <div key={index} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isAgent 
                      ? 'bg-white border border-brand-200 text-slate-800 shadow-sm' 
                      : 'bg-brand-700 text-white shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything: 'Can I keep the house?', 'What is a QDRO?', 'How do I find hidden accounts?'"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
            <button
              type="submit"
              className="bg-brand-700 hover:bg-brand-800 text-white px-5 rounded-xl font-semibold shadow transition flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Citation Grounding Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-700" />
                <h4 className="font-bold text-slate-900 text-sm">Grounded Document Citation</h4>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This financial entry was extracted directly from:
              <strong className="block text-slate-900 mt-1 font-mono bg-slate-100 p-2 rounded">
                {selectedCitation}
              </strong>
            </p>
            <div className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              ✓ Grounded NotebookLM-style verification: All account claims are tied to specific source pages to build legal credibility.
            </div>
            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedCitation(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
