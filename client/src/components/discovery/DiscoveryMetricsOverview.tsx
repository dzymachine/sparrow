import React, { useState } from 'react';
import { 
  FileCheck2, 
  ShieldAlert, 
  TrendingUp, 
  Home, 
  Download, 
  Printer, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useDiscovery } from '../../context/DiscoveryContext';
import { useAgentMemory } from '../../context/AgentMemoryContext';

export default function DiscoveryMetricsOverview() {
  const { workspace, checklist, exportDiscoveryPacket, togglePrivacyMode, isSyncingToWiki, lastWikiSync } = useDiscovery();
  const { wikiData } = useAgentMemory() as any;
  const [showMissingList, setShowMissingList] = useState(false);

  const wikiTotalFacts = wikiData?.stats?.totalFacts || 0;
  const wikiFootprintCount = wikiData?.sections?.financial_footprint?.facts?.length || 0;

  const { accountVault, baseline, housingSandbox, ledgerProtection, privacyMode } = workspace;

  // 1. Discovery Readiness (X of 7)
  const collectedCategoriesCount = checklist.filter((c) => c.status !== 'Missing').length;
  const missingCategories = checklist.filter((c) => c.status === 'Missing' || c.uploadedCount === 0);

  // 2. Verified Net Marital Snapshot
  const totalDocumentedAssets = accountVault.reduce((acc, a) => acc + (a.balance || 0), 0);
  const totalDocumentedDebts = housingSandbox.mortgageBalance || 0;
  const netDocumentedEstate = totalDocumentedAssets - totalDocumentedDebts;
  const unlistedAccounts = accountVault.filter((a) => a.isUnlistedDiscovery);

  // 3. Document-Backed Monthly Baseline
  const mustPaysTotal = baseline.mustPays.reduce((acc, e) => acc + e.amount, 0);
  const lifeKidsTotal = baseline.lifeAndKids.reduce((acc, e) => acc + e.amount, 0);
  const totalEssentials = mustPaysTotal + lifeKidsTotal;
  const breathingRoom = baseline.monthlyInflow - totalEssentials;

  // 4. Housing & Retirement Exposure
  const steadyIncome = baseline.monthlyInflow || 1;
  const housingRatio = Math.round((housingSandbox.monthlyMortgageTotal / steadyIncome) * 100);
  const retirementAssetsSubjectToQDRO = accountVault
    .filter((a) => a.requiresQDRO || a.accountType.toLowerCase().includes('401') || a.accountType.toLowerCase().includes('pension'))
    .reduce((acc, a) => acc + (a.balance || 0), 0);
  const pendingBeneficiaryCount = ledgerProtection.beneficiaryRequirements.filter((b) => b.status !== 'Compliant').length;

  const maskValue = (val: string | number) => {
    if (privacyMode) return '••••••';
    return typeof val === 'number' ? `$${val.toLocaleString()}` : val;
  };

  return (
    <section className="space-y-4">
      {/* Top Header Row with Title, Inline Metadata, and Export Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[#E2DBD0] pb-3">
        <div>
          <h2 className="text-xl font-medium text-[#261E19] tracking-tight">
            Live Discovery & Document Intelligence
          </h2>
          <p className="text-xs text-[#5C4E43] mt-0.5 flex flex-wrap items-center gap-2">
            <span>Based on your verified financial documents</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E6ECE6] text-[#435C4D] font-mono text-[10px]">
              {isSyncingToWiki
                ? 'Saving to Private Profile...'
                : `Private Profile: ${wikiTotalFacts} details saved`}
            </span>
            {lastWikiSync && !isSyncingToWiki && (
              <span className="text-[10px] text-[#435C4D] font-medium">
                +{lastWikiSync.addedCount} saved from {lastWikiSync.fileName}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={togglePrivacyMode}
            title={privacyMode ? 'Show sensitive numbers' : 'Hide sensitive numbers (Discreet Mode)'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#5C4E43] hover:text-[#261E19] border border-[#E2DBD0] bg-white rounded-lg transition"
          >
            {privacyMode ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5 text-[#5C4E43]" />}
            <span>{privacyMode ? 'Numbers Hidden' : 'Hide Numbers'}</span>
          </button>

          <button
            onClick={() => exportDiscoveryPacket('print')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#435C4D] hover:bg-[#354A3E] rounded-lg shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Packet</span>
          </button>

          <button
            onClick={() => exportDiscoveryPacket('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#261E19] bg-white hover:bg-[#F4EFEB] border border-[#E2DBD0] rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5 text-[#5C4E43]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Flat Hairline Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Discovery Readiness */}
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4.5 flex flex-col justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-medium text-[#8C7D73] mb-1.5">
              Discovery Readiness
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono tabular-nums font-semibold text-[#261E19]">
                {collectedCategoriesCount}
              </span>
              <span className="text-sm font-mono tabular-nums text-[#8C7D73]">of 7 Categories</span>
            </div>
            <div className="text-xs text-[#5C4E43] mt-2 leading-relaxed">
              {collectedCategoriesCount === 7 ? (
                <span className="text-[#435C4D] font-medium">All 7 mandatory discovery categories accounted for.</span>
              ) : (
                <span>{7 - collectedCategoriesCount} critical disclosure categories pending production.</span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EAE1] mt-3">
            <button
              onClick={() => setShowMissingList(!showMissingList)}
              className="text-xs text-[#435C4D] hover:text-[#354A3E] font-medium inline-flex items-center gap-1"
            >
              <span>{showMissingList ? 'Hide discovery requests' : 'View attorney discovery list'}</span>
              {showMissingList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Card 2: Verified Net Marital Snapshot */}
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4.5 flex flex-col justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-medium text-[#8C7D73] mb-1.5">
              Verified Net Marital Estate
            </div>
            <div className="text-2xl font-mono tabular-nums font-semibold text-[#261E19]">
              {maskValue(netDocumentedEstate)}
            </div>
            <div className="text-xs text-[#5C4E43] mt-2 space-y-0.5">
              <div>Assets: <span className="font-mono tabular-nums text-[#261E19]">{maskValue(totalDocumentedAssets)}</span> · Debts: <span className="font-mono tabular-nums text-[#8C7D73]">{maskValue(totalDocumentedDebts)}</span></div>
              <div className="text-[#8C725F]">50% Community Share: <strong className="font-mono tabular-nums text-[#261E19] font-medium">{maskValue(Math.round(netDocumentedEstate / 2))}</strong></div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EAE1] mt-3 flex items-center justify-between text-xs text-[#5C4E43]">
            <span>Schedule B & Transfer Leads</span>
            <span className="font-mono tabular-nums text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {unlistedAccounts.length} unlisted
            </span>
          </div>
        </div>

        {/* Card 3: Document-Backed Monthly Baseline */}
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4.5 flex flex-col justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-medium text-[#8C7D73] mb-1.5">
              Documented Monthly Inflow vs Outflow
            </div>
            <div className="text-2xl font-mono tabular-nums font-semibold text-[#261E19]">
              {maskValue(baseline.monthlyInflow)} <span className="text-xs font-sans text-[#8C7D73] font-normal">/ mo in</span>
            </div>
            <div className="text-xs text-[#5C4E43] mt-2 space-y-0.5">
              <div>Must-Pays (A): <span className="font-mono tabular-nums text-[#261E19]">{maskValue(mustPaysTotal)}</span></div>
              <div>Life & Kids (B): <span className="font-mono tabular-nums text-[#261E19]">{maskValue(lifeKidsTotal)}</span></div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EAE1] mt-3 flex items-center justify-between text-xs">
            <span className="text-[#5C4E43]">Monthly Cushion:</span>
            <span className={`font-mono tabular-nums font-medium ${breathingRoom >= 0 ? 'text-[#435C4D]' : 'text-rose-700'}`}>
              {breathingRoom >= 0 ? '+' : ''}{maskValue(breathingRoom)} / mo
            </span>
          </div>
        </div>

        {/* Card 4: Housing & Retirement Exposure */}
        <div className="bg-white border border-[#E2DBD0] rounded-xl p-4.5 flex flex-col justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-medium text-[#8C7D73] mb-1.5">
              Housing & Retirement Exposure
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-mono tabular-nums font-semibold ${housingRatio > 45 ? 'text-amber-800' : 'text-[#261E19]'}`}>
                {housingRatio}%
              </span>
              <span className="text-xs text-[#8C7D73]">of steady income</span>
            </div>
            <div className="text-xs text-[#5C4E43] mt-2 space-y-0.5">
              <div>Retirement to split (QDRO court order): <span className="font-mono tabular-nums font-medium text-[#261E19]">{maskValue(retirementAssetsSubjectToQDRO)}</span></div>
              <div>Beneficiary items to protect: <span className="font-mono tabular-nums text-[#8C7D73]">{pendingBeneficiaryCount} item{pendingBeneficiaryCount === 1 ? '' : 's'}</span></div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EAE1] mt-3 text-xs text-[#8C7D73] truncate">
            {housingSandbox.coBorrowerStatus}
          </div>
        </div>
      </div>

      {/* Expandable Missing Items Checklist for Attorney Discovery Requests */}
      {showMissingList && (
        <div className="bg-[#FAF9F6] border border-[#E2DBD0] rounded-xl p-4.5 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#261E19]">
              <AlertCircle className="w-4 h-4 text-[#7e4d41]" />
              <span>Attorney Discovery Production Checklist (Items to Request from Spouse)</span>
            </div>
            <span className="text-[11px] text-[#8C7D73]">Under Cal. Fam. Code § 2102 mandatory disclosure</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
            {checklist.map((item) => {
              const isMissing = item.status === 'Missing';
              return (
                <div
                  key={item.key}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    isMissing
                      ? 'bg-white border-amber-200/80 text-[#261E19]'
                      : 'bg-white/60 border-[#E2DBD0] text-[#5C4E43]'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isMissing ? 'bg-amber-600' : 'bg-[#435C4D]'}`} />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-baseline justify-between">
                      <strong className="text-[#261E19] font-medium">{item.title}</strong>
                      <span className="text-[10px] text-[#8C7D73] font-mono">{item.status}</span>
                    </div>
                    <p className="text-[11px] text-[#5C4E43]">{item.description}</p>
                    <div className="text-[11px] text-[#7e4d41] font-medium pt-0.5">{item.missingNotes}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
