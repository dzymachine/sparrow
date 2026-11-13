import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Database,
  Landmark,
  Home,
  Wallet,
  Scale,
  Upload,
  MapPin,
  HelpCircle,
  SkipForward,
  X
} from 'lucide-react';
import { useDiscovery } from '../../context/DiscoveryContext';
import { useAgentMemory } from '../../context/AgentMemoryContext';
import { DiscoveryCategoryKey } from '../../types/discovery';
import FinancialSituationVisuals from './FinancialSituationVisuals';
import LifeProjectionTab from '../LifeProjectionTab';

const CATEGORY_TO_SAMPLE: Partial<Record<DiscoveryCategoryKey, string>> = {
  tax_returns: 'tax_1040_2024',
  retirement: 'retirement_401k',
  mortgage_lease: 'mortgage_statement',
  bank_statements: 'bank_checking_statement',
  marital_agreements: 'marital_agreement',
  pay_stubs: 'paystub_insurance'
};

interface CategoryGuidance {
  ifApplies: string;
  giveUs: string;
  whereToFind: string;
  whyItMatters: string;
}

const CATEGORY_GUIDANCE: Record<DiscoveryCategoryKey, CategoryGuidance> = {
  tax_returns: {
    ifApplies: 'If you or your spouse filed taxes in the last 2 years (jointly or separately)',
    giveUs: 'Federal Form 1040 Tax Return (with Schedule B & W-2s)',
    whereToFind: 'Search your email for "1040" or "tax return", log into TurboTax / H&R Block, ask your CPA, or download free from IRS.gov ("Get Transcript").',
    whyItMatters: 'Reveals true household income and flags hidden bank or brokerage accounts through interest & dividend lines.'
  },
  retirement: {
    ifApplies: 'If either of you has a 401(k), 403(b), IRA, or workplace pension',
    giveUs: 'Most recent quarterly or annual retirement account statement',
    whereToFind: 'Log into your or your spouse’s employer benefits portal (Fidelity, Vanguard, Charles Schwab, Empower) or check your HR portal.',
    whyItMatters: 'Retirement earned during marriage is typically marital property — even if only one spouse’s name is on the account.'
  },
  bank_statements: {
    ifApplies: 'If you have a checking, savings, or credit card account (joint or individual)',
    giveUs: 'Last 1–3 months of bank statements (PDF or CSV export)',
    whereToFind: 'Open your bank app or website (Chase, Bank of America, Wells Fargo) → "Statements & Documents" or "Download Activity (CSV)".',
    whyItMatters: 'Establishes your real monthly living expenses and catches recurring transfers to unfamiliar accounts.'
  },
  mortgage_lease: {
    ifApplies: 'If you own a home, pay a mortgage, or rent a home/apartment',
    giveUs: 'Monthly mortgage statement, closing disclosure, or current lease',
    whereToFind: 'Check your mortgage servicer portal (Wells Fargo, Rocket Mortgage, Mr. Cooper), escrow email, or property manager portal.',
    whyItMatters: 'Shows remaining loan balance, interest rate, and monthly housing cost so you can test keeping vs. selling the home.'
  },
  pay_stubs: {
    ifApplies: 'If you or your spouse earn a paycheck, bonus, commission, or stock (RSUs)',
    giveUs: '2 most recent pay stubs (or W-2s)',
    whereToFind: 'Log into your employer payroll app (ADP, Gusto, Workday, Rippling) → "Pay" → "Download Pay Stub PDF".',
    whyItMatters: 'Captures gross vs. take-home pay, health insurance deductions, and retirement contributions for support calculations.'
  },
  marital_agreements: {
    ifApplies: 'If you signed a prenup, postnup, or any temporary separation/support agreement',
    giveUs: 'Signed agreement, court order, or attorney stipulation PDF',
    whereToFind: 'Check your email for DocuSign/Adobe Sign copies, your attorney’s client portal, or your home filing folder.',
    whyItMatters: 'Sets binding rules for asset division, spousal support, and filing deadlines.'
  },
  insurance_policies: {
    ifApplies: 'If you carry health, life, home, or auto insurance, or have car/personal loans',
    giveUs: 'Insurance declarations page, beneficiary summary, or loan statement',
    whereToFind: 'Log into your insurance app (BlueCross, Kaiser, Geico, State Farm) or employer benefits summary → "Policy / Beneficiaries".',
    whyItMatters: 'Protects your coverage and flags if life insurance beneficiaries need to be preserved during divorce.'
  }
};

export default function FinancialDiscoveryView() {
  const {
    checklist,
    workspace,
    triageFileForUpload,
    confirmTriageAndUpload,
    cancelTriage,
    isTriaging,
    pendingTriage,
    loadSampleDocument,
    openReviewDrawer,
    isAnalyzing,
    isSyncingToWiki,
    lastWikiSync,
    analyzingFileName,
    analysisError
  } = useDiscovery();

  const { wikiData } = useAgentMemory() as any;
  const location = useLocation();

  const [activeSegment, setActiveSegment] = useState<'picture' | 'documents'>(
    location.hash === '#projection-engine' ? 'picture' : 'documents'
  );
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (location.hash === '#projection-engine') {
      setActiveSegment('picture');
    }
  }, [location.hash]);
  const [pendingCategoryHint, setPendingCategoryHint] = useState<DiscoveryCategoryKey | undefined>(undefined);
  const [notApplicableKeys, setNotApplicableKeys] = useState<DiscoveryCategoryKey[]>([]);
  const [selectedTabKey, setSelectedTabKey] = useState<DiscoveryCategoryKey>('tax_returns');
  const [triageCategoryOverride, setTriageCategoryOverride] = useState<DiscoveryCategoryKey | undefined>(undefined);
  const [modalDocId, setModalDocId] = useState<string | null>(null);
  const [showSampleDrawer, setShowSampleDrawer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { documents, accountVault, baseline, housingSandbox, privacyMode } = workspace;
  const modalDoc = documents.find((d) => d.id === modalDocId) || null;

  const toggleNotApplicable = (key: DiscoveryCategoryKey) => {
    setNotApplicableKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const missingCategories = checklist.filter(
    (c) => c.status === 'Missing' && !notApplicableKeys.includes(c.key)
  );
  const resolvedCount = checklist.length - missingCategories.length;
  const activeTabCategory = checklist.find((c) => c.key === selectedTabKey) || checklist[0];
  const activeGuidance = activeTabCategory ? CATEGORY_GUIDANCE[activeTabCategory.key] : null;
  const activeIsSkipped = activeTabCategory ? notApplicableKeys.includes(activeTabCategory.key) : false;
  const progressPercent = Math.round((resolvedCount / checklist.length) * 100);

  // Live financial picture & visualization metrics
  const totalAssets = accountVault.reduce((acc, a) => acc + (a.balance || 0), 0);
  const retirementAssets = accountVault
    .filter((a) => a.requiresQDRO || a.accountType.toLowerCase().includes('401') || a.accountType.toLowerCase().includes('ira') || a.accountType.toLowerCase().includes('pension'))
    .reduce((acc, a) => acc + (a.balance || 0), 0);
  const unlistedAssets = accountVault
    .filter((a) => a.isUnlistedDiscovery)
    .reduce((acc, a) => acc + (a.balance || 0), 0);
  const liquidOtherAssets = Math.max(0, totalAssets - retirementAssets - unlistedAssets);
  const mortgageDebt = housingSandbox.mortgageBalance || 0;
  const netEstate = totalAssets - mortgageDebt;

  const unlistedLeadsCount = accountVault.filter((a) => a.isUnlistedDiscovery).length;
  const mustPaysTotal = baseline.mustPays.reduce((acc, e) => acc + e.amount, 0);
  const lifeKidsTotal = baseline.lifeAndKids.reduce((acc, e) => acc + e.amount, 0);
  const totalMonthlyOutflow = mustPaysTotal + lifeKidsTotal;
  const totalMonthlyInflowWithSupport = baseline.monthlyInflow + baseline.spousalSupport + baseline.childSupport;
  const monthlyGap = totalMonthlyInflowWithSupport - totalMonthlyOutflow;

  const wikiFinancialFacts: any[] = wikiData?.sections?.financial_footprint?.facts || [];
  const wikiLawyerFacts: any[] = wikiData?.sections?.lawyer_readiness?.facts || [];
  const wikiTotalFacts: number = wikiData?.stats?.totalFacts || 0;

  const maskMoney = (val: number) => {
    if (privacyMode) return '••••••';
    return `$${Math.round(val).toLocaleString()}`;
  };

  const triggerCategoryUpload = (categoryKey?: DiscoveryCategoryKey) => {
    setPendingCategoryHint(categoryKey);
    fileInputRef.current?.click();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setTriageCategoryOverride(undefined);
      await triageFileForUpload(file, pendingCategoryHint);
      setPendingCategoryHint(undefined);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTriageCategoryOverride(undefined);
      await triageFileForUpload(file, pendingCategoryHint);
      setPendingCategoryHint(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const SAMPLE_BUTTONS = [
    { id: 'tax_1040_2024', label: 'Form 1040 & Sched B', category: 'Tax Return', desc: 'W-2s & $5k Dividend Accounts' },
    { id: 'retirement_401k', label: 'Fidelity 401(k) Plan', category: 'Retirement', desc: '$428k Vested & QDRO Flag' },
    { id: 'mortgage_statement', label: 'Wells Fargo Mortgage', category: 'Property', desc: '$384k Loan & 3.25% Rate' },
    { id: 'bank_checking_statement', label: 'Chase Checking Feed', category: 'Bank CSV', desc: '$3.2k Budget & Transfer Flag' },
    { id: 'marital_agreement', label: 'Support Stipulation', category: 'Legal', desc: '$3.8k Support & 60/40 Split' },
    { id: 'paystub_insurance', label: 'Tech Corp Pay Stub', category: 'Pay Stub', desc: '$12.8k Gross & Health Beneficiary' }
  ];

  return (
    <div className="space-y-8">
      {/* View Header with Apple Segmented Control */}
      <div className="border-b border-[#E2DBD0] pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-[#261E19] tracking-tight">
            Financial Discovery &amp; Projection
          </h1>
          <p className="text-xs text-[#5C4E43] mt-1 max-w-2xl leading-relaxed">
            Your private financial picture, imported records, and post-divorce projection—organized in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Apple-style Segmented Control */}
          <div className="inline-flex p-1 rounded-xl bg-[#EFEBE4] border border-[#E2DBD0]">
            <button
              type="button"
              onClick={() => setActiveSegment('picture')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeSegment === 'picture'
                  ? 'bg-white text-[#261E19] shadow-xs'
                  : 'text-[#5C4E43] hover:text-[#261E19]'
              }`}
            >
              Financial Picture &amp; Projection
            </button>
            <button
              type="button"
              onClick={() => setActiveSegment('documents')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5 ${
                activeSegment === 'documents'
                  ? 'bg-white text-[#261E19] shadow-xs'
                  : 'text-[#5C4E43] hover:text-[#261E19]'
              }`}
            >
              <span>Documents &amp; Intake</span>
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-[#E6ECE6] text-[#435C4D]">
                {resolvedCount}/{checklist.length}
              </span>
            </button>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF9F6] border border-[#E2DBD0] text-xs text-[#435C4D] font-medium">
            <Database className="w-3.5 h-3.5" />
            <span>
              {isSyncingToWiki
                ? 'Saving...'
                : `${wikiTotalFacts} Saved`}
            </span>
          </span>
        </div>
      </div>

      {/* Apple Inset Grouped Summary Strip (Always Visible, Zero Duplication) */}
      <div className="bg-white border border-[#E2DBD0] rounded-2xl grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#F0EAE1] overflow-hidden">
        <div className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#8C7D73] font-medium">
            <Landmark className="w-3.5 h-3.5 text-[#435C4D]" />
            <span>Discovered Assets</span>
          </div>
          <div className="text-lg font-mono tabular-nums font-semibold text-[#261E19]">
            {maskMoney(totalAssets)}
          </div>
          <div className="text-xs text-[#5C4E43]">
            {accountVault.length} accounts · {unlistedLeadsCount} to verify
          </div>
        </div>

        <div className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#8C7D73] font-medium">
            <Wallet className="w-3.5 h-3.5 text-[#435C4D]" />
            <span>Monthly Cushion</span>
          </div>
          <div className={`text-lg font-mono tabular-nums font-semibold ${monthlyGap >= 0 ? 'text-[#435C4D]' : 'text-rose-700'}`}>
            {monthlyGap >= 0 ? '+' : ''}{maskMoney(monthlyGap)} <span className="text-xs font-normal text-[#8C7D73]">/ mo</span>
          </div>
          <div className="text-xs text-[#5C4E43]">
            {maskMoney(baseline.monthlyInflow)} in · {maskMoney(totalMonthlyOutflow)} out
          </div>
        </div>

        <div className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#8C7D73] font-medium">
            <Home className="w-3.5 h-3.5 text-[#435C4D]" />
            <span>Mortgage Balance</span>
          </div>
          <div className="text-lg font-mono tabular-nums font-semibold text-[#261E19]">
            {maskMoney(housingSandbox.mortgageBalance)}
          </div>
          <div className="text-xs text-[#5C4E43]">
            {maskMoney(housingSandbox.monthlyMortgageTotal)}/mo @ {housingSandbox.interestRate}%
          </div>
        </div>

        <div className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#8C7D73] font-medium">
            <Scale className="w-3.5 h-3.5 text-[#435C4D]" />
            <span>Support on File</span>
          </div>
          <div className="text-lg font-mono tabular-nums font-semibold text-[#261E19]">
            {maskMoney(baseline.spousalSupport + baseline.childSupport)} <span className="text-xs font-normal text-[#8C7D73]">/ mo</span>
          </div>
          <div className="text-xs text-[#5C4E43]">
            Spousal {maskMoney(baseline.spousalSupport)} · Child {maskMoney(baseline.childSupport)}
          </div>
        </div>
      </div>

      {/* SEGMENT 1: COHESIVE FINANCIAL PICTURE & POST-DIVORCE PROJECTION */}
      {activeSegment === 'picture' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E2DBD0] rounded-2xl p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base font-medium text-[#261E19]">
                Visual Financial Breakdown
              </h2>
              <p className="text-xs text-[#5C4E43] mt-0.5">
                How your assets, monthly cash flow, and 50/50 marital share look right now.
              </p>
            </div>
            <FinancialSituationVisuals
              totalAssets={totalAssets}
              retirementAssets={retirementAssets}
              liquidOtherAssets={liquidOtherAssets}
              unlistedAssets={unlistedAssets}
              mortgageDebt={mortgageDebt}
              netEstate={netEstate}
              totalMonthlyInflowWithSupport={totalMonthlyInflowWithSupport}
              mustPaysTotal={mustPaysTotal}
              lifeKidsTotal={lifeKidsTotal}
              totalMonthlyOutflow={totalMonthlyOutflow}
              monthlyCushion={monthlyGap}
              privacyMode={privacyMode}
            />
          </div>

          <div id="projection-engine">
            <LifeProjectionTab discoveryVersion={documents.length + accountVault.length} />
          </div>
        </div>
      )}

      {/* SEGMENT 2: DOCUMENTS & GUIDED INTAKE */}
      {activeSegment === 'documents' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT (7 cols): Imported Documents as Clickable Document Icons + Quick Demo */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-[#E2DBD0] rounded-xl overflow-hidden shadow-none">
            <div className="p-5 border-b border-[#E2DBD0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-medium text-[#261E19]">
                  Imported Documents ({documents.length})
                </h3>
                <p className="text-xs text-[#5C4E43] mt-0.5">
                  Click any document icon to open and read the imported file and its extracted takeaways.
                </p>
              </div>
              <div className="text-xs text-[#8C7D73]">
                {documents.filter((d) => d.status === 'Reviewed').length} Synced · {documents.filter((d) => d.status === 'Uploaded').length} Uploaded
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="p-10 text-center text-xs text-[#8C7D73] space-y-2">
                <FileText className="w-8 h-8 mx-auto text-[#ADC2B5]" />
                <p>No documents imported yet. Use the checklist on the right to import your first document.</p>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {documents.map((doc) => {
                  const hasUnlisted = (doc.unlistedAccounts && doc.unlistedAccounts.length > 0) ||
                    (doc.extractedData?.taxReturn?.scheduleBPayers?.some((p) => p.potentialHiddenAccount));

                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setModalDocId(doc.id)}
                      className="p-3.5 rounded-xl border border-[#E2DBD0] bg-[#FAF9F6] hover:bg-white hover:border-[#435C4D] hover:shadow-xs transition text-center flex flex-col items-center gap-2 group relative"
                    >
                      <div className="w-11 h-12 rounded-lg bg-white border border-[#E2DBD0] group-hover:border-[#435C4D]/50 flex items-center justify-center relative shadow-2xs">
                        <FileText className="w-5 h-5 text-[#435C4D]" />
                        <span
                          className={`w-2 h-2 rounded-full absolute -top-1 -right-1 ${
                            doc.status === 'Reviewed' ? 'bg-[#435C4D]' : 'bg-amber-500'
                          }`}
                          title={doc.status === 'Reviewed' ? 'Synced' : 'Uploaded'}
                        />
                      </div>
                      <div className="w-full space-y-0.5">
                        <div className="text-xs font-medium text-[#261E19] truncate group-hover:text-[#435C4D]">
                          {doc.fileName}
                        </div>
                        <div className="text-[10px] text-[#8C7D73] truncate">
                          {doc.categoryLabel}
                        </div>
                      </div>
                      {hasUnlisted && (
                        <span className="text-[9px] font-mono text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                          Lead Flagged
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optional Collapsible Sample Documents */}
          <div className="bg-white border border-[#E2DBD0] rounded-xl p-4 space-y-2.5">
            <button
              type="button"
              onClick={() => setShowSampleDrawer(!showSampleDrawer)}
              className="w-full flex items-center justify-between text-xs font-medium text-[#5C4E43] hover:text-[#261E19] transition"
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#435C4D]" />
                <span>Want to try it out first? Load sample documents</span>
              </span>
              <span className="text-[11px] text-[#435C4D]">{showSampleDrawer ? 'Hide' : 'Show samples'}</span>
            </button>

            {showSampleDrawer && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#F0EAE1]">
                {SAMPLE_BUTTONS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => loadSampleDocument(sample.id)}
                    disabled={isAnalyzing}
                    className="p-2.5 rounded-lg border border-[#E2DBD0] bg-[#FAF9F6] hover:bg-white hover:border-[#435C4D] text-left transition space-y-0.5 group disabled:opacity-50"
                  >
                    <span className="text-[10px] text-[#435C4D] font-mono block uppercase">
                      {sample.category}
                    </span>
                    <strong className="text-xs text-[#261E19] group-hover:text-[#435C4D] block truncate font-medium">
                      {sample.label}
                    </strong>
                    <span className="text-[10px] text-[#8C7D73] block truncate">
                      {sample.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT / SIDE (5 cols): Compact Guided Document Intake & Uploader */}
        <div className="lg:col-span-5 bg-white border border-[#E2DBD0] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-[#FAF9F6] border-b border-[#E2DBD0] flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#435C4D] font-medium">
              Document Intake · {resolvedCount}/{checklist.length} Done
            </span>
            <div className="w-24 h-1.5 bg-[#E2DBD0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#435C4D] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Vertically Stacked Tabs */}
          <div className="p-3 border-b border-[#E2DBD0] bg-[#FAF9F6]/50 space-y-1">
            {checklist.map((cat, idx) => {
              const isSelected = activeTabCategory?.key === cat.key;
              const isSkipped = notApplicableKeys.includes(cat.key);
              const isDone = cat.status === 'Reviewed' || cat.status === 'Uploaded';

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setSelectedTabKey(cat.key);
                    setPendingCategoryHint(cat.key);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-white border-[#435C4D] shadow-2xs'
                      : 'bg-transparent border-transparent hover:bg-white/80 hover:border-[#E2DBD0]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-[#435C4D] shrink-0" />
                    ) : (
                      <span className={`text-[10px] font-mono w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#435C4D] text-white' : 'bg-[#E2DBD0] text-[#5C4E43]'
                      }`}>
                        {idx + 1}
                      </span>
                    )}
                    <span className={`text-xs truncate ${
                      isSelected ? 'font-medium text-[#261E19]' : 'text-[#5C4E43]'
                    }`}>
                      {cat.title}
                    </span>
                  </div>

                  {isDone ? (
                    <span className="text-[10px] font-mono text-[#435C4D] bg-[#E6ECE6] px-2 py-0.5 rounded shrink-0">
                      ✓ Completed
                    </span>
                  ) : isSkipped ? (
                    <span className="text-[10px] font-mono text-[#8C7D73] bg-[#F0EAE1] px-2 py-0.5 rounded shrink-0">
                      N/A
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded shrink-0">
                      Import
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Compact Action / Upload Area for Selected Category */}
          <div className="p-4 space-y-3">
            {activeTabCategory && (activeTabCategory.status === 'Uploaded' || activeTabCategory.status === 'Reviewed') ? (
              <div className="p-4 rounded-xl bg-[#F4F7F4] border border-[#DCE5DC] space-y-2.5 text-center">
                <CheckCircle2 className="w-7 h-7 text-[#435C4D] mx-auto" />
                <div className="space-y-0.5">
                  <h4 className="text-sm font-medium text-[#261E19]">
                    {activeTabCategory.title} Completed
                  </h4>
                  <p className="text-xs text-[#5C4E43]">
                    {activeTabCategory.uploadedCount} document{activeTabCategory.uploadedCount === 1 ? '' : 's'} already imported and parsed.
                  </p>
                </div>
                {(() => {
                  const uploadedForCat = documents.find((d) => d.categoryKey === activeTabCategory.key);
                  return uploadedForCat ? (
                    <button
                      type="button"
                      onClick={() => setModalDocId(uploadedForCat.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#435C4D] bg-white border border-[#E2DBD0] hover:border-[#435C4D] rounded-lg transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Read {uploadedForCat.fileName}</span>
                    </button>
                  ) : null;
                })()}
              </div>
            ) : (
              <>
                {activeTabCategory && activeGuidance && (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[11px] font-medium text-[#435C4D] bg-[#F4F7F4] border border-[#DCE5DC] px-2.5 py-1 rounded-lg">
                        {activeGuidance.ifApplies}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleNotApplicable(activeTabCategory.key)}
                        className="text-[11px] text-[#8C7D73] hover:text-[#261E19] shrink-0 pt-0.5"
                      >
                        {activeIsSkipped ? 'Applies' : 'Skip (N/A)'}
                      </button>
                    </div>
                    <div className="text-xs font-medium text-[#261E19]">
                      Give us: {activeGuidance.giveUs}
                    </div>
                    <div className="bg-[#FAF9F6] border border-[#E2DBD0] rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-[#5C4E43]">
                      <MapPin className="w-3.5 h-3.5 text-[#435C4D] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-[#261E19] font-medium">Where to find: </strong>
                        {activeGuidance.whereToFind}
                      </span>
                    </div>
                  </div>
                )}

                {/* Compact Drag-and-Drop Box */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                    dragActive
                      ? 'border-[#435C4D] bg-[#F4F7F4]'
                      : 'border-[#E2DBD0] bg-[#FAF9F6]/60 hover:border-[#435C4D]/60'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="w-9 h-9 rounded-full bg-white border border-[#E2DBD0] text-[#435C4D] flex items-center justify-center mx-auto">
                      {isAnalyzing || isTriaging ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-[#435C4D]" />
                      ) : (
                        <UploadCloud className="w-4 h-4" />
                      )}
                    </div>

                    {isTriaging ? (
                      <p className="text-xs text-[#261E19] font-medium">Reviewing {analyzingFileName}...</p>
                    ) : isAnalyzing ? (
                      <p className="text-xs text-[#261E19] font-medium">Extracting {analyzingFileName}...</p>
                    ) : (
                      <p className="text-xs text-[#5C4E43]">
                        Drop PDF, CSV, or photo here
                      </p>
                    )}

                    {/* AI Triage Confirmation Prompt */}
                    {pendingTriage && !isTriaging && !isAnalyzing && (
                      <div className="text-left bg-white border border-[#435C4D]/50 rounded-xl p-3 space-y-2.5 shadow-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase text-[#435C4D] bg-[#E6ECE6] px-1.5 py-0.5 rounded">
                            AI Triage
                          </span>
                          <p className="text-xs font-medium text-[#261E19]">
                            You uploaded a <span className="text-[#435C4D] underline">{pendingTriage.triage.documentLabel}</span> — is this correct?
                          </p>
                          <p className="text-[11px] text-[#5C4E43]">{pendingTriage.triage.triageSummary}</p>
                        </div>

                        <select
                          value={triageCategoryOverride || pendingTriage.triage.categoryKey}
                          onChange={(e) => setTriageCategoryOverride(e.target.value as DiscoveryCategoryKey)}
                          className="w-full text-xs px-2 py-1 rounded-lg border border-[#E2DBD0] bg-white text-[#261E19]"
                        >
                          {checklist.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.title}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelTriage}
                            className="px-2.5 py-1 text-xs text-[#5C4E43] bg-white border border-[#E2DBD0] rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmTriageAndUpload(triageCategoryOverride || pendingTriage.triage.categoryKey)}
                            className="px-3 py-1 text-xs font-medium text-white bg-[#435C4D] hover:bg-[#354A3E] rounded-lg"
                          >
                            Yes, Upload &amp; Save
                          </button>
                        </div>
                      </div>
                    )}

                    {analysisError && (
                      <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                        {analysisError}
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.csv,.txt"
                        onChange={handleFileInputChange}
                        className="hidden"
                        id="doc-upload-input"
                      />
                      <label
                        htmlFor="doc-upload-input"
                        onClick={() => setPendingCategoryHint(activeTabCategory?.key)}
                        className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#435C4D] hover:bg-[#354A3E] rounded-lg transition"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Select File</span>
                      </label>

                      {activeTabCategory && CATEGORY_TO_SAMPLE[activeTabCategory.key] && (
                        <button
                          type="button"
                          onClick={() => loadSampleDocument(CATEGORY_TO_SAMPLE[activeTabCategory.key]!)}
                          disabled={isAnalyzing || isTriaging}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#261E19] bg-white border border-[#E2DBD0] hover:border-[#435C4D] rounded-lg transition disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3 text-[#435C4D]" />
                          <span>Sample</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Document Reader Modal */}
      {modalDoc && (
        <div
          className="fixed inset-0 z-50 bg-[#261E19]/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalDocId(null)}
        >
          <div
            className="bg-white border border-[#E2DBD0] rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2DBD0] bg-[#FAF9F6] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#E6ECE6] text-[#435C4D] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-[#261E19] truncate">
                    {modalDoc.fileName}
                  </h3>
                  <p className="text-[11px] text-[#5C4E43] truncate">
                    {modalDoc.categoryLabel} · {modalDoc.documentClassification?.institutionOrIssuer || 'Financial Institution'} · Uploaded {new Date(modalDoc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const id = modalDoc.id;
                    setModalDocId(null);
                    openReviewDrawer(id);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#435C4D] hover:bg-[#354A3E] rounded-lg transition"
                >
                  {modalDoc.status === 'Reviewed' ? 'Edit Findings' : 'Review & Sync'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalDocId(null)}
                  className="p-1.5 rounded-lg text-[#5C4E43] hover:text-[#261E19] hover:bg-[#E2DBD0]/50 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Plain-English AI Summary */}
              <div className="bg-[#F4F7F4] border border-[#DCE5DC] rounded-xl p-4 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#435C4D]">
                  AI Summary &amp; Key Takeaway
                </div>
                <p className="text-xs text-[#261E19] leading-relaxed">
                  {modalDoc.plainEnglishSummary}
                </p>
              </div>

              {/* Embedded File Preview if available */}
              {(modalDoc as any).previewUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#261E19]">Original Imported Document</span>
                    <a
                      href={(modalDoc as any).previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-[#435C4D] hover:underline"
                    >
                      Open in New Tab
                    </a>
                  </div>
                  {modalDoc.fileType?.startsWith('image/') ? (
                    <img
                      src={(modalDoc as any).previewUrl}
                      alt={modalDoc.fileName}
                      className="max-h-96 mx-auto rounded-xl border border-[#E2DBD0] object-contain bg-[#FAF9F6]"
                    />
                  ) : (
                    <iframe
                      src={(modalDoc as any).previewUrl}
                      title={modalDoc.fileName}
                      className="w-full h-96 rounded-xl border border-[#E2DBD0] bg-[#FAF9F6]"
                    />
                  )}
                </div>
              )}

              {/* Plain-English Key Details (No Raw JSON) */}
              <div className="space-y-2.5">
                <div className="text-xs font-medium text-[#261E19]">
                  Key Financial Details Found
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {modalDoc.extractedData?.taxReturn && (
                    <>
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E2DBD0] text-xs">
                        <span className="text-[10px] uppercase text-[#8C7D73] block">Adjusted Gross Income</span>
                        <strong className="font-mono text-[#261E19]">{maskMoney(modalDoc.extractedData.taxReturn.adjustedGrossIncome || 0)}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E2DBD0] text-xs">
                        <span className="text-[10px] uppercase text-[#8C7D73] block">Filing Status &amp; Year</span>
                        <strong className="text-[#261E19]">{modalDoc.extractedData.taxReturn.filingStatus || 'Joint'} · {modalDoc.extractedData.taxReturn.taxYear || 'Recent'}</strong>
                      </div>
                    </>
                  )}
                  {modalDoc.extractedData?.retirement && (
                    <>
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E2DBD0] text-xs">
                        <span className="text-[10px] uppercase text-[#8C7D73] block">Retirement Balance</span>
                        <strong className="font-mono text-[#261E19]">{maskMoney(modalDoc.extractedData.retirement.currentBalance || 0)}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E2DBD0] text-xs">
                        <span className="text-[10px] uppercase text-[#8C7D73] block">Plan &amp; Division Rule</span>
                        <strong className="text-[#261E19]">{modalDoc.extractedData.retirement.institution} · {modalDoc.extractedData.retirement.requiresQDRO ? 'Requires court order (QDRO) to split' : 'Standard division'}</strong>
                      </div>
                    </>
                  )}
                  {modalDoc.extractedData?.mortgage && (
                    <>
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E2DBD0] text-xs">
                        <span className="text-[10px] uppercase text-[#8C7D73] block">Remaining Mortgage</span>
                        <strong className="font-mono text-[#261E19]">{maskMoney(modalDoc.extractedData.mortgage.remainingBalance || 0)}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E2DBD0] text-xs">
                        <span className="text-[10px] uppercase text-[#8C7D73] block">Monthly Housing Payment</span>
                        <strong className="font-mono text-[#261E19]">{maskMoney(modalDoc.extractedData.mortgage.monthlyPaymentTotal || 0)} / mo</strong>
                      </div>
                    </>
                  )}
                  {modalDoc.extractedData?.bankOrCredit && (
                    <>
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E2DBD0] text-xs">
                        <span className="text-[10px] uppercase text-[#8C7D73] block">Account Balance</span>
                        <strong className="font-mono text-[#261E19]">{maskMoney(modalDoc.extractedData.bankOrCredit.endingBalance || 0)}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E2DBD0] text-xs">
                        <span className="text-[10px] uppercase text-[#8C7D73] block">Monthly Income / Spending</span>
                        <strong className="font-mono text-[#261E19]">{maskMoney(modalDoc.extractedData.bankOrCredit.monthlyInflowTotal || 0)} in · {maskMoney(modalDoc.extractedData.bankOrCredit.monthlyOutflowTotal || 0)} out</strong>
                      </div>
                    </>
                  )}
                  {modalDoc.extractedData?.payStub && (
                    <>
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E2DBD0] text-xs">
                        <span className="text-[10px] uppercase text-[#8C7D73] block">Gross Monthly Pay</span>
                        <strong className="font-mono text-[#261E19]">{maskMoney(modalDoc.extractedData.payStub.grossPayMonthly || 0)} / mo</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E2DBD0] text-xs">
                        <span className="text-[10px] uppercase text-[#8C7D73] block">Take-Home Pay</span>
                        <strong className="font-mono text-[#261E19]">{maskMoney(modalDoc.extractedData.payStub.netPayMonthly || 0)} / mo</strong>
                      </div>
                    </>
                  )}
                  {modalDoc.extractedData?.maritalAgreement && (
                    <>
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E2DBD0] text-xs">
                        <span className="text-[10px] uppercase text-[#8C7D73] block">Monthly Support</span>
                        <strong className="font-mono text-[#261E19]">{maskMoney((modalDoc.extractedData.maritalAgreement.spousalSupportMonthly || 0) + (modalDoc.extractedData.maritalAgreement.childSupportMonthly || 0))} / mo</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E2DBD0] text-xs">
                        <span className="text-[10px] uppercase text-[#8C7D73] block">Parenting Split</span>
                        <strong className="text-[#261E19]">{modalDoc.extractedData.maritalAgreement.coparentingSplit || 'Not specified'}</strong>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
