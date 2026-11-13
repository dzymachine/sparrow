import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  DiscoveryCategoryKey,
  CategoryChecklistItem,
  DiscoveryWorkspaceState,
  ExtractedDocument,
  VaultAccount,
  RecurringExpenseItem
} from '../types/discovery';

const STORAGE_KEY = 'foothold_discovery_state_v1';

// The 7 Required Core Categories defined in California Discovery Requirements
export const CORE_DISCOVERY_CATEGORIES: CategoryChecklistItem[] = [
  {
    key: 'tax_returns',
    title: 'Last 3 Years Tax Returns',
    description: 'Forms 1040, W-2s, 1099s, and Schedule B interest/dividend declarations.',
    recommendedCount: '3 years required',
    statutoryBasis: 'Cal. Fam. Code § 2104(c)(1) · Mandatory disclosure',
    status: 'Reviewed',
    uploadedCount: 1,
    missingNotes: '2023 & 2022 Joint Tax Returns pending upload or formal discovery request.'
  },
  {
    key: 'retirement',
    title: 'Retirement & Pension Statements',
    description: '401(k), 403(b), IRA, Defined Benefit Pensions, and brokerage accounts.',
    recommendedCount: 'Recent quarterly',
    statutoryBasis: 'Cal. Fam. Code § 2550 & ERISA QDRO requirements',
    status: 'Reviewed',
    uploadedCount: 1,
    missingNotes: 'Spouse pre-marital rollover IRA statement from 2018 not yet produced.'
  },
  {
    key: 'bank_statements',
    title: 'Checking & Credit Card Statements',
    description: 'Last 12 months checking, savings, and credit card monthly statements.',
    recommendedCount: 'Last 12 months',
    statutoryBasis: 'Cal. Fam. Code § 2102 · Fiduciary disclosure duty',
    status: 'Reviewed',
    uploadedCount: 1,
    missingNotes: 'Need 6 additional months of primary joint checking statements.'
  },
  {
    key: 'mortgage_lease',
    title: 'Mortgage, Lease & Property Statements',
    description: 'First & second mortgage balance, interest rate, property tax, and deed.',
    recommendedCount: 'Latest statement',
    statutoryBasis: 'Cal. Fam. Code § 2550 / Moore-Marsden equity calculation',
    status: 'Reviewed',
    uploadedCount: 1,
    missingNotes: 'Current year Los Angeles County property tax assessment bill needed.'
  },
  {
    key: 'pay_stubs',
    title: 'Recent Pay Stubs & Earnings',
    description: 'Last 2 to 3 months of pay stubs showing gross pay, deductions, and bonuses.',
    recommendedCount: 'Last 60 days',
    statutoryBasis: 'Cal. Fam. Code § 4320 · Spousal & child support baseline',
    status: 'Uploaded',
    uploadedCount: 1,
    missingNotes: 'Awaiting user paycheck stubs to complete 2-month comparative baseline.'
  },
  {
    key: 'marital_agreements',
    title: 'Marital & Separation Agreements',
    description: 'Prenuptial agreements, postnuptial contracts, or temporary support orders.',
    recommendedCount: 'All executed copies',
    statutoryBasis: 'Cal. Fam. Code §§ 1600–1617 (UPAA)',
    status: 'Uploaded',
    uploadedCount: 1,
    missingNotes: 'Executed signature page of preliminary separation agreement required.'
  },
  {
    key: 'insurance_policies',
    title: 'Life, Health & Auto Insurance',
    description: 'Declaration pages showing policy coverage, monthly premiums, and named beneficiaries.',
    recommendedCount: 'All active policies',
    statutoryBasis: 'Cal. Fam. Code § 4360 · Mandatory survivor & medical security',
    status: 'Missing',
    uploadedCount: 0,
    missingNotes: 'Missing term life insurance policy declarations and health premium breakdown.'
  }
];

// Initial seeded accounts
const INITIAL_ACCOUNTS: VaultAccount[] = [
  {
    id: 'vault_act_1',
    institution: 'Chase Bank',
    name: 'Premier Checking (Joint)',
    accountType: 'Checking',
    accountNumberMasked: '•••• 4419',
    owner: 'Joint',
    balance: 14350,
    isUnlistedDiscovery: false,
    sourceDocument: 'Chase Total Checking Statement (Oct 2024)',
    status: 'Verified'
  },
  {
    id: 'vault_act_2',
    institution: 'Fidelity Investments',
    name: 'Employer 401(k) Retirement Savings',
    accountType: '401(k) Plan',
    accountNumberMasked: '•••• 8912',
    owner: 'Spouse',
    balance: 428500,
    vestedBalance: 428500,
    monthlyContribution: 1875,
    requiresQDRO: true,
    qdroExplanation: 'ERISA-governed retirement divisible via Qualified Domestic Relations Order under Cal. Fam. Code § 2550.',
    isUnlistedDiscovery: false,
    sourceDocument: 'Fidelity Q3 2024 Statement',
    status: 'Verified'
  },
  {
    id: 'vault_act_3',
    institution: 'Vanguard Group',
    name: 'Vanguard Admiral Treasury Fund',
    accountType: 'Taxable Brokerage',
    accountNumberMasked: '•••• 6108',
    owner: 'Unlisted / Needs Discovery',
    balance: 85500,
    isUnlistedDiscovery: true,
    sourceDocument: '2024 Form 1040 Schedule B (Line 5)',
    discoveryFlag: 'Discovered from $3,420 dividend payout on Schedule B; not in initial disclosure list.',
    status: 'Needs Subpoena'
  },
  {
    id: 'vault_act_4',
    institution: 'Morgan Stanley Wealth Management',
    name: 'Active Growth Portfolio',
    accountType: 'Brokerage / Securities',
    accountNumberMasked: '•••• 3392',
    owner: 'Spouse',
    balance: 46250,
    isUnlistedDiscovery: true,
    sourceDocument: '2024 Form 1040 Schedule B (Line 6)',
    discoveryFlag: 'Discovered from $1,850 dividend line; held in spouse sole name.',
    status: 'Review with Attorney'
  },
  {
    id: 'vault_act_5',
    institution: 'Marcus by Goldman Sachs',
    name: 'High Yield Sole Savings',
    accountType: 'Savings',
    accountNumberMasked: '•••• 4082',
    owner: 'Unlisted / Needs Discovery',
    balance: 36000,
    isUnlistedDiscovery: true,
    sourceDocument: 'Chase Joint Checking Transfer Ledger',
    discoveryFlag: 'Identified via $1,500 recurring monthly automatic transfers over 24 months.',
    status: 'Needs Subpoena'
  }
];

// Initial baseline expenses
const INITIAL_MUST_PAYS: RecurringExpenseItem[] = [
  { id: 'exp_1', name: 'Primary Mortgage (P&I + Escrow)', amount: 2480, bucket: 'bucket_a_must_pays', category: 'Housing', frequency: 'monthly', sourceDocName: 'Wells Fargo Mortgage' },
  { id: 'exp_2', name: 'Pasadena Water & Power', amount: 185, bucket: 'bucket_a_must_pays', category: 'Utilities', frequency: 'monthly', sourceDocName: 'Chase Statement' },
  { id: 'exp_3', name: 'Trader Joe’s & Groceries', amount: 820, bucket: 'bucket_a_must_pays', category: 'Groceries', frequency: 'monthly', sourceDocName: 'Chase Statement' },
  { id: 'exp_4', name: 'Childcare & After-School Program', amount: 950, bucket: 'bucket_a_must_pays', category: 'Childcare', frequency: 'monthly', sourceDocName: 'Chase Statement' },
  { id: 'exp_5', name: 'Auto Insurance & Gas', amount: 355, bucket: 'bucket_a_must_pays', category: 'Transit', frequency: 'monthly', sourceDocName: 'Chase Statement' }
];

const INITIAL_LIFE_KIDS: RecurringExpenseItem[] = [
  { id: 'exp_6', name: 'Pediatric Orthodontics', amount: 350, bucket: 'bucket_b_life_kids', category: 'Medical', frequency: 'monthly', sourceDocName: 'Chase Statement' },
  { id: 'exp_7', name: 'Youth Sports & Music Lessons', amount: 240, bucket: 'bucket_b_life_kids', category: 'School', frequency: 'monthly', sourceDocName: 'Chase Statement' },
  { id: 'exp_8', name: 'Family Pharmacy & Health Supplies', amount: 85, bucket: 'bucket_b_life_kids', category: 'Medical', frequency: 'monthly', sourceDocName: 'Chase Statement' }
];

const DEFAULT_WORKSPACE_STATE: DiscoveryWorkspaceState = {
  documents: [],
  accountVault: INITIAL_ACCOUNTS,
  baseline: {
    monthlyInflow: 9200,
    userNetPaycheck: 3400,
    spouseNetPaycheck: 8410,
    spousalSupport: 2200,
    childSupport: 1650,
    mustPays: INITIAL_MUST_PAYS,
    lifeAndKids: INITIAL_LIFE_KIDS
  },
  housingSandbox: {
    propertyAddress: '1428 Crestview Drive, Pasadena, CA 91107',
    estimatedHomeValue: 875000,
    mortgageBalance: 384200,
    interestRate: 3.250,
    monthlyMortgageTotal: 2480,
    principal: 1020,
    interest: 890,
    escrow: 570,
    hoa: 0,
    coBorrowerStatus: 'Joint (Both Spouses on Note & Deed of Trust)',
    isLease: false
  },
  ledgerProtection: {
    coparentingSplitRatio: '60/40',
    spousalSupportMonthly: 2200,
    childSupportMonthly: 1650,
    obligations: [
      'Spouse to remit $2,200/mo spousal support via ACH on the 1st of each month.',
      'Spouse to remit $1,650/mo child support for two minor children.',
      'Unreimbursed medical, extracurricular, and dental split 60% (Spouse) / 40% (User).'
    ],
    beneficiaryRequirements: [
      {
        id: 'ben_1',
        policyOrAccount: 'Northwestern Mutual Life Policy ($500,000)',
        beneficiary: 'Minor Children (User as Trustee)',
        requirement: 'Must maintain policy in full force until youngest child reaches 18.',
        deadline: 'Annual proof due every October 1st',
        status: 'Action Needed'
      }
    ],
    assetSplitDeadlines: [
      {
        id: 'dl_1',
        asset: 'Marital Residence (Pasadena)',
        deadline: 'Within 180 days of judgment',
        requirement: 'Refinance into sole name and pay out 50% equity share or list for sale.',
        status: 'In Progress'
      },
      {
        id: 'dl_2',
        asset: 'Fidelity 401(k) Division',
        deadline: 'Within 90 days of judgment',
        requirement: 'Submit court-certified QDRO to plan administrator.',
        status: 'Pending'
      }
    ]
  },
  privacyMode: false
};

interface DiscoveryContextType {
  workspace: DiscoveryWorkspaceState;
  checklist: CategoryChecklistItem[];
  activeReviewDoc: ExtractedDocument | null;
  isAnalyzing: boolean;
  analyzingFileName: string;
  analysisError: string | null;
  openReviewDrawer: (docId: string) => void;
  closeReviewDrawer: () => void;
  uploadFileAndAnalyze: (file: File, categoryHint?: DiscoveryCategoryKey) => Promise<ExtractedDocument | null>;
  loadSampleDocument: (sampleDocId: string) => Promise<ExtractedDocument | null>;
  approveAndSyncDocument: (docId: string, updatedDoc?: ExtractedDocument) => void;
  updateExtractedDocument: (docId: string, updatedDoc: ExtractedDocument) => void;
  deleteDocument: (docId: string) => void;
  togglePrivacyMode: () => void;
  setPrivacyMode: (val: boolean) => void;
  resetWorkspace: () => void;
  exportDiscoveryPacket: (format?: 'csv' | 'print') => void;
}

const DiscoveryContext = createContext<DiscoveryContextType | null>(null);

export function DiscoveryProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<DiscoveryWorkspaceState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed reading discovery workspace from localStorage', e);
    }
    return DEFAULT_WORKSPACE_STATE;
  });

  const [activeReviewDocId, setActiveReviewDocId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingFileName, setAnalyzingFileName] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch (e) {
      console.error('Failed saving discovery state to localStorage', e);
    }
  }, [workspace]);

  // Keyboard shortcut for Quick Exit (Escape key twice quickly or Alt+X)
  useEffect(() => {
    let lastEscTime = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        if (now - lastEscTime < 500) {
          // Double Esc triggers immediate safe exit
          window.location.replace('https://weather.com');
        }
        lastEscTime = now;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute live 7-category checklist based on workspace documents
  const checklist = CORE_DISCOVERY_CATEGORIES.map((cat) => {
    const docs = workspace.documents.filter((d) => d.categoryKey === cat.key);
    const count = docs.length;
    let status: 'Missing' | 'Uploaded' | 'Reviewed' = 'Missing';
    if (count > 0) {
      const allReviewed = docs.every((d) => d.status === 'Reviewed');
      status = allReviewed ? 'Reviewed' : 'Uploaded';
    }
    return {
      ...cat,
      uploadedCount: count,
      status
    };
  });

  const activeReviewDoc = workspace.documents.find((d) => d.id === activeReviewDocId) || null;

  const openReviewDrawer = useCallback((docId: string) => {
    setActiveReviewDocId(docId);
  }, []);

  const closeReviewDrawer = useCallback(() => {
    setActiveReviewDocId(null);
  }, []);

  const togglePrivacyMode = useCallback(() => {
    setWorkspace((prev) => ({ ...prev, privacyMode: !prev.privacyMode }));
  }, []);

  const setPrivacyMode = useCallback((val: boolean) => {
    setWorkspace((prev) => ({ ...prev, privacyMode: val }));
  }, []);

  // 1-Click Sample Document Loader
  const loadSampleDocument = useCallback(async (sampleDocId: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalyzingFileName(`Sample Document (${sampleDocId})`);

    try {
      const res = await fetch('/api/discovery/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleDocId })
      });

      if (!res.ok) {
        throw new Error('Failed to analyze sample document');
      }

      const data = await res.json();
      if (!data.success || !data.document) {
        throw new Error(data.message || 'Extraction failed');
      }

      const newDoc: ExtractedDocument = data.document;

      setWorkspace((prev) => {
        // Replace if already loaded or prepend
        const existingIdx = prev.documents.findIndex((d) => d.fileName === newDoc.fileName);
        const updatedDocs = existingIdx >= 0
          ? prev.documents.map((d, i) => (i === existingIdx ? newDoc : d))
          : [newDoc, ...prev.documents];
        return {
          ...prev,
          documents: updatedDocs
        };
      });

      setActiveReviewDocId(newDoc.id);
      setIsAnalyzing(false);
      return newDoc;
    } catch (err: any) {
      console.error('Sample loading error:', err);
      setAnalysisError(err.message || 'Unable to load test document.');
      setIsAnalyzing(false);
      return null;
    }
  }, []);

  // File Upload and Gemini Analysis
  const uploadFileAndAnalyze = useCallback(
    async (file: File, categoryHint?: DiscoveryCategoryKey) => {
      setIsAnalyzing(true);
      setAnalysisError(null);
      setAnalyzingFileName(file.name);

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (categoryHint) {
          formData.append('categoryHint', categoryHint);
        }

        const res = await fetch('/api/discovery/analyze', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Document processing failed.');
        }

        const data = await res.json();
        if (!data.success || !data.document) {
          throw new Error(data.message || 'Unable to extract structured data.');
        }

        const newDoc: ExtractedDocument = data.document;

        setWorkspace((prev) => ({
          ...prev,
          documents: [newDoc, ...prev.documents]
        }));

        setActiveReviewDocId(newDoc.id);
        setIsAnalyzing(false);
        return newDoc;
      } catch (err: any) {
        console.error('File analysis error:', err);
        setAnalysisError(err.message || 'Error uploading file.');
        setIsAnalyzing(false);
        return null;
      }
    },
    []
  );

  // Update extracted document before or after sync
  const updateExtractedDocument = useCallback((docId: string, updatedDoc: ExtractedDocument) => {
    setWorkspace((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === docId ? updatedDoc : d))
    }));
  }, []);

  // Delete uploaded document
  const deleteDocument = useCallback((docId: string) => {
    setWorkspace((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== docId)
    }));
    if (activeReviewDocId === docId) {
      setActiveReviewDocId(null);
    }
  }, [activeReviewDocId]);

  // Explicit "Approve & Sync to Workspace"
  const approveAndSyncDocument = useCallback(
    (docId: string, updatedDoc?: ExtractedDocument) => {
      setWorkspace((prev) => {
        const targetDoc = updatedDoc || prev.documents.find((d) => d.id === docId);
        if (!targetDoc) return prev;

        const approvedDoc: ExtractedDocument = {
          ...targetDoc,
          status: 'Reviewed',
          approvedAt: new Date().toISOString()
        };

        const updatedDocs = prev.documents.map((d) => (d.id === docId ? approvedDoc : d));

        // 1. Sync accounts to Account Vault
        const newAccounts = [...prev.accountVault];

        // Retirement account sync
        if (approvedDoc.extractedData?.retirement) {
          const ret = approvedDoc.extractedData.retirement;
          const existingActIdx = newAccounts.findIndex(
            (a) => a.name.toLowerCase().includes(ret.accountType.toLowerCase()) && a.institution === ret.institution
          );

          const actData: VaultAccount = {
            id: existingActIdx >= 0 ? newAccounts[existingActIdx].id : `act_${Date.now()}_ret`,
            institution: ret.institution || 'Retirement Institution',
            name: `${ret.institution} ${ret.accountType}`,
            accountType: ret.accountType,
            accountNumberMasked: ret.accountNumberMasked || '•••• 8912',
            owner: ret.accountOwner || 'Spouse',
            balance: ret.currentBalance || 0,
            vestedBalance: ret.vestedBalance || ret.currentBalance || 0,
            monthlyContribution: ret.monthlyContribution || 0,
            requiresQDRO: ret.requiresQDRO ?? true,
            qdroExplanation: ret.qdroExplanation,
            isUnlistedDiscovery: false,
            sourceDocument: approvedDoc.fileName,
            status: 'Verified'
          };

          if (existingActIdx >= 0) {
            newAccounts[existingActIdx] = actData;
          } else {
            newAccounts.push(actData);
          }
        }

        // Bank / Credit accounts sync
        if (approvedDoc.extractedData?.bankOrCredit) {
          const bnk = approvedDoc.extractedData.bankOrCredit;
          const existingIdx = newAccounts.findIndex(
            (a) => a.institution === bnk.institution && a.accountType.toLowerCase().includes(bnk.accountType.toLowerCase())
          );

          const bnkData: VaultAccount = {
            id: existingIdx >= 0 ? newAccounts[existingIdx].id : `act_${Date.now()}_bnk`,
            institution: bnk.institution || 'Bank',
            name: `${bnk.institution} ${bnk.accountType.toUpperCase()}`,
            accountType: bnk.accountType,
            accountNumberMasked: bnk.accountNumberMasked || '•••• 4419',
            owner: (bnk.accountOwner as any) || 'Joint',
            balance: bnk.endingBalance || 0,
            isUnlistedDiscovery: false,
            sourceDocument: approvedDoc.fileName,
            status: 'Verified'
          };

          if (existingIdx >= 0) {
            newAccounts[existingIdx] = bnkData;
          } else {
            newAccounts.push(bnkData);
          }
        }

        // Tax return schedule B unlisted accounts sync
        if (approvedDoc.extractedData?.taxReturn?.scheduleBPayers) {
          approvedDoc.extractedData.taxReturn.scheduleBPayers.forEach((payer, idx) => {
            if (payer.potentialHiddenAccount) {
              const alreadyExists = newAccounts.some((a) => a.name.toLowerCase().includes(payer.payerName.toLowerCase()));
              if (!alreadyExists) {
                newAccounts.push({
                  id: `act_${Date.now()}_schb_${idx}`,
                  institution: payer.payerName.split(' ')[0] || 'Unknown Institution',
                  name: payer.payerName,
                  accountType: payer.payerType === 'dividend' ? 'Taxable Brokerage / Funds' : 'High Yield Savings / CD',
                  owner: 'Unlisted / Needs Discovery',
                  balance: Math.round(payer.amount * 25), // Estimate based on 4% yield
                  isUnlistedDiscovery: true,
                  sourceDocument: `${approvedDoc.fileName} (Schedule B)`,
                  discoveryFlag: payer.discoveryReason || `Discovered from $${payer.amount.toLocaleString()} ${payer.payerType} income.`,
                  status: 'Needs Subpoena'
                });
              }
            }
          });
        }

        // Unlisted accounts explicitly extracted
        if (approvedDoc.unlistedAccounts && approvedDoc.unlistedAccounts.length > 0) {
          approvedDoc.unlistedAccounts.forEach((unl, idx) => {
            const alreadyExists = newAccounts.some((a) => a.name.toLowerCase().includes(unl.institution.toLowerCase()));
            if (!alreadyExists) {
              newAccounts.push({
                id: `act_${Date.now()}_unl_${idx}`,
                institution: unl.institution,
                name: `${unl.institution} (Unlisted Account)`,
                accountType: 'Undisclosed Account',
                owner: (unl.owner as any) || 'Unlisted / Needs Discovery',
                balance: unl.estimatedBalance || 25000,
                isUnlistedDiscovery: true,
                sourceDocument: unl.source || approvedDoc.fileName,
                discoveryFlag: unl.note || 'Identified via document intelligence cross-referencing.',
                status: 'Needs Subpoena'
              });
            }
          });
        }

        // 2. Sync to My New Baseline (Must-Pays and Life & Kids)
        let updatedMustPays = [...prev.baseline.mustPays];
        let updatedLifeKids = [...prev.baseline.lifeAndKids];
        let updatedInflow = prev.baseline.monthlyInflow;

        if (approvedDoc.extractedData?.bankOrCredit?.recurringExpenses) {
          approvedDoc.extractedData.bankOrCredit.recurringExpenses.forEach((exp) => {
            const expenseItem: RecurringExpenseItem = {
              id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: exp.name,
              amount: exp.amount,
              bucket: exp.bucket,
              category: exp.category || 'General',
              frequency: 'monthly',
              sourceDocName: approvedDoc.fileName,
              isApproved: true
            };

            if (exp.bucket === 'bucket_a_must_pays') {
              const exists = updatedMustPays.some((m) => m.name.toLowerCase() === exp.name.toLowerCase());
              if (!exists) updatedMustPays.push(expenseItem);
            } else {
              const exists = updatedLifeKids.some((l) => l.name.toLowerCase() === exp.name.toLowerCase());
              if (!exists) updatedLifeKids.push(expenseItem);
            }
          });

          if (approvedDoc.extractedData.bankOrCredit.totalMonthlyInflows) {
            updatedInflow = approvedDoc.extractedData.bankOrCredit.totalMonthlyInflows;
          }
        }

        // 3. Sync to Housing Sandbox
        let updatedHousing = { ...prev.housingSandbox };
        if (approvedDoc.extractedData?.property) {
          const prop = approvedDoc.extractedData.property;
          updatedHousing = {
            ...updatedHousing,
            propertyAddress: prop.propertyAddress || updatedHousing.propertyAddress,
            mortgageBalance: prop.loanBalance || updatedHousing.mortgageBalance,
            interestRate: prop.interestRate || updatedHousing.interestRate,
            monthlyMortgageTotal: prop.monthlyPayment?.total || updatedHousing.monthlyMortgageTotal,
            principal: prop.monthlyPayment?.principal || updatedHousing.principal,
            interest: prop.monthlyPayment?.interest || updatedHousing.interest,
            escrow: prop.monthlyPayment?.escrowTaxesInsurance || updatedHousing.escrow,
            coBorrowerStatus: prop.coBorrowerStatus || updatedHousing.coBorrowerStatus,
            isLease: prop.isLease ?? false
          };
        }

        // 4. Sync to Ledger & Protection
        let updatedLedger = { ...prev.ledgerProtection };
        if (approvedDoc.extractedData?.maritalAgreement) {
          const ma = approvedDoc.extractedData.maritalAgreement;
          updatedLedger = {
            ...updatedLedger,
            coparentingSplitRatio: ma.coparentingSplitRatio || updatedLedger.coparentingSplitRatio,
            spousalSupportMonthly: ma.spousalSupportMonthly || updatedLedger.spousalSupportMonthly,
            childSupportMonthly: ma.childSupportMonthly || updatedLedger.childSupportMonthly,
            obligations: ma.financialObligations || updatedLedger.obligations
          };

          if (ma.beneficiaryRequirements) {
            const newBenItems = ma.beneficiaryRequirements.map((b, idx) => ({
              id: `ben_${Date.now()}_${idx}`,
              policyOrAccount: b.policyOrAccount,
              beneficiary: b.beneficiary,
              requirement: b.requirement,
              status: 'Action Needed' as const
            }));
            updatedLedger.beneficiaryRequirements = newBenItems;
          }

          if (ma.assetSplitDeadlines) {
            const newDeadlines = ma.assetSplitDeadlines.map((d, idx) => ({
              id: `dl_${Date.now()}_${idx}`,
              asset: d.asset,
              deadline: d.deadline,
              requirement: d.requirement,
              status: 'In Progress' as const
            }));
            updatedLedger.assetSplitDeadlines = newDeadlines;
          }
        }

        return {
          ...prev,
          documents: updatedDocs,
          accountVault: newAccounts,
          baseline: {
            ...prev.baseline,
            monthlyInflow: updatedInflow,
            mustPays: updatedMustPays,
            lifeAndKids: updatedLifeKids,
            spousalSupport: updatedLedger.spousalSupportMonthly || prev.baseline.spousalSupport,
            childSupport: updatedLedger.childSupportMonthly || prev.baseline.childSupport
          },
          housingSandbox: updatedHousing,
          ledgerProtection: updatedLedger
        };
      });

      setActiveReviewDocId(null);
    },
    []
  );

  // Reset workspace to clean defaults
  const resetWorkspace = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setWorkspace(DEFAULT_WORKSPACE_STATE);
    setActiveReviewDocId(null);
  }, []);

  // Export Discovery Packet (CSV / Print Summary)
  const exportDiscoveryPacket = useCallback(
    (format: 'csv' | 'print' = 'print') => {
      const { accountVault, baseline, housingSandbox, ledgerProtection, documents } = workspace;

      const totalAssets = accountVault.reduce((acc, a) => acc + (a.balance || 0), 0);
      const unlistedCount = accountVault.filter((a) => a.isUnlistedDiscovery).length;
      const mustPayTotal = baseline.mustPays.reduce((acc, e) => acc + e.amount, 0);
      const lifeKidsTotal = baseline.lifeAndKids.reduce((acc, e) => acc + e.amount, 0);
      const totalEssentials = mustPayTotal + lifeKidsTotal;
      const breathingRoom = baseline.monthlyInflow - totalEssentials;

      if (format === 'csv') {
        const rows = [
          ['FOOTHOLD FINANCIAL DISCOVERY & MARITAL DISCLOSURE PACKET'],
          ['Jurisdiction', 'California (Community Property - Cal. Fam. Code § 760, § 2550)'],
          ['Date Generated', new Date().toLocaleDateString()],
          [''],
          ['1. VERIFIED ACCOUNT VAULT & UNLISTED ASSETS'],
          ['Institution', 'Account Name', 'Type', 'Owner', 'Balance', 'QDRO Required', 'Status', 'Grounded Source Document', 'Discovery Flag'],
          ...accountVault.map((a) => [
            a.institution,
            a.name,
            a.accountType,
            a.owner,
            a.balance.toString(),
            a.requiresQDRO ? 'YES (ERISA QDRO)' : 'No',
            a.status,
            a.sourceDocument,
            a.discoveryFlag || ''
          ]),
          [''],
          ['2. DOCUMENT-BACKED MONTHLY BASELINE'],
          ['Category', 'Item Description', 'Bucket', 'Monthly Amount ($)', 'Source'],
          ...baseline.mustPays.map((e) => ['Must-Pays (Bucket A)', e.name, 'Essential', e.amount.toString(), e.sourceDocName || 'Bank Feed']),
          ...baseline.lifeAndKids.map((e) => ['Life & Kids (Bucket B)', e.name, 'Quality of Life', e.amount.toString(), e.sourceDocName || 'Bank Feed']),
          [''],
          ['Monthly Inflow', baseline.monthlyInflow.toString()],
          ['Total Must-Pays', mustPayTotal.toString()],
          ['Total Life & Kids', lifeKidsTotal.toString()],
          ['Monthly Cash Gap / Breathing Room', breathingRoom.toString()],
          [''],
          ['3. HOUSING & REAL ESTATE SNAPSHOT'],
          ['Property Address', housingSandbox.propertyAddress],
          ['Estimated Market Value', housingSandbox.estimatedHomeValue.toString()],
          ['Mortgage Principal Balance', housingSandbox.mortgageBalance.toString()],
          ['Interest Rate', `${housingSandbox.interestRate}%`],
          ['Monthly Housing Payment (PITI)', housingSandbox.monthlyMortgageTotal.toString()],
          ['Co-Borrower Status', housingSandbox.coBorrowerStatus],
          [''],
          ['4. LEGAL STIPULATION & BENEFICIARY OBLIGATIONS'],
          ['Co-Parenting Split Ratio', ledgerProtection.coparentingSplitRatio],
          ['Spousal Support Monthly', ledgerProtection.spousalSupportMonthly.toString()],
          ['Child Support Monthly', ledgerProtection.childSupportMonthly.toString()],
          ...ledgerProtection.beneficiaryRequirements.map((b) => ['Beneficiary Mandate', b.policyOrAccount, b.beneficiary, b.requirement, b.status]),
          ...ledgerProtection.assetSplitDeadlines.map((d) => ['Asset Deadline', d.asset, d.deadline, d.requirement, d.status])
        ];

        const csvContent = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Foothold_Discovery_Packet_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Print Summary Format
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const printHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Foothold Discovery Packet · Confidential Legal Brief</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #261E19; background: #FFF; padding: 40px; margin: 0 auto; max-width: 850px; font-size: 13px; line-height: 1.5; }
    h1 { font-size: 22px; margin-bottom: 4px; color: #261E19; }
    .subtitle { color: #5C4E43; margin-bottom: 24px; font-size: 13px; }
    .meta-bar { display: flex; justify-content: space-between; border-bottom: 1px solid #E2DBD0; padding-bottom: 12px; margin-bottom: 24px; font-size: 12px; color: #5C4E43; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
    .stat-card { border: 1px solid #E2DBD0; padding: 12px; border-radius: 8px; background: #F8F6F2; }
    .stat-label { font-size: 11px; color: #5C4E43; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-val { font-size: 18px; font-weight: 600; font-family: monospace; color: #261E19; margin-top: 4px; }
    h2 { font-size: 15px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #E2DBD0; padding-bottom: 6px; color: #261E19; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    th { text-align: left; background: #F8F6F2; border-bottom: 1px solid #E2DBD0; padding: 8px; color: #5C4E43; font-weight: 600; }
    td { padding: 8px; border-bottom: 1px solid #F0EAE1; }
    .mono { font-family: monospace; font-variant-numeric: tabular-nums; }
    .flag { color: #9A3412; background: #FFEDD5; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
    .footer { margin-top: 40px; border-top: 1px solid #E2DBD0; padding-top: 12px; font-size: 11px; color: #8C7D73; text-align: center; }
  </style>
</head>
<body>
  <h1>FOOTHOLD FINANCIAL DISCOVERY & MARITAL DISCLOSURE BRIEF</h1>
  <div class="subtitle">Confidential Document Intelligence & Forensic Asset Inventory · Prepared for Attorney / Mediator Consultation</div>
  <div class="meta-bar">
    <div><strong>Jurisdiction:</strong> California Family Code §§ 760, 2104, 2550</div>
    <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
    <div><strong>Status:</strong> Grounded Forensic Summary</div>
  </div>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-label">Total Documented Assets</div>
      <div class="stat-val">$${totalAssets.toLocaleString()}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Documented Mortgage Debt</div>
      <div class="stat-val">$${housingSandbox.mortgageBalance.toLocaleString()}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Unlisted / Needs Discovery</div>
      <div class="stat-val">${unlistedCount} Accounts</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Monthly Essentials Gap</div>
      <div class="stat-val ${breathingRoom >= 0 ? '' : 'style="color:#DC2626;"'}">$${breathingRoom.toLocaleString()} / mo</div>
    </div>
  </div>

  <h2>1. Verified Marital Accounts & Discovery Leads</h2>
  <table>
    <thead>
      <tr>
        <th>Institution & Account</th>
        <th>Type</th>
        <th>Owner</th>
        <th>Balance</th>
        <th>ERISA QDRO</th>
        <th>Grounded Source / Flag</th>
      </tr>
    </thead>
    <tbody>
      ${accountVault
        .map(
          (a) => `
        <tr>
          <td><strong>${a.name}</strong><br><span style="color:#5C4E43; font-size:11px;">${a.institution}</span></td>
          <td>${a.accountType}</td>
          <td>${a.owner}</td>
          <td class="mono">$${a.balance.toLocaleString()}</td>
          <td>${a.requiresQDRO ? '<span style="color:#B45309;">YES (QDRO)</span>' : 'No'}</td>
          <td>
            ${a.sourceDocument}
            ${a.discoveryFlag ? `<br><span class="flag">${a.discoveryFlag}</span>` : ''}
          </td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <h2>2. Document-Backed Monthly Living Baseline</h2>
  <table>
    <thead>
      <tr>
        <th>Living Expense Item</th>
        <th>Bucket</th>
        <th>Category</th>
        <th>Monthly Amount</th>
        <th>Source Reference</th>
      </tr>
    </thead>
    <tbody>
      ${baseline.mustPays
        .map(
          (m) => `
        <tr>
          <td>${m.name}</td>
          <td><strong>Must-Pays (Bucket A)</strong></td>
          <td>${m.category}</td>
          <td class="mono">$${m.amount.toLocaleString()}</td>
          <td>${m.sourceDocName || 'Bank Records'}</td>
        </tr>
      `
        )
        .join('')}
      ${baseline.lifeAndKids
        .map(
          (l) => `
        <tr>
          <td>${l.name}</td>
          <td><strong>Life & Kids (Bucket B)</strong></td>
          <td>${l.category}</td>
          <td class="mono">$${l.amount.toLocaleString()}</td>
          <td>${l.sourceDocName || 'Bank Records'}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <h2>3. Housing Sandbox & Property Buyout Profile</h2>
  <table>
    <tr><td style="width:30%;"><strong>Property Address</strong></td><td>${housingSandbox.propertyAddress}</td></tr>
    <tr><td><strong>Estimated Fair Market Value</strong></td><td class="mono">$${housingSandbox.estimatedHomeValue.toLocaleString()}</td></tr>
    <tr><td><strong>Remaining Loan Balance</strong></td><td class="mono">$${housingSandbox.mortgageBalance.toLocaleString()} (Rate: ${housingSandbox.interestRate}%)</td></tr>
    <tr><td><strong>Net Community Home Equity</strong></td><td class="mono">$${(housingSandbox.estimatedHomeValue - housingSandbox.mortgageBalance).toLocaleString()} (50% Share: $${Math.round((housingSandbox.estimatedHomeValue - housingSandbox.mortgageBalance) / 2).toLocaleString()})</td></tr>
    <tr><td><strong>Monthly PITI Payment</strong></td><td class="mono">$${housingSandbox.monthlyMortgageTotal.toLocaleString()} / mo (${housingSandbox.coBorrowerStatus})</td></tr>
  </table>

  <h2>4. Court Stipulation & Protection Deadlines</h2>
  <table>
    <tr><td style="width:30%;"><strong>Co-Parenting Time Share</strong></td><td>${ledgerProtection.coparentingSplitRatio}</td></tr>
    <tr><td><strong>Spousal Support Obligation</strong></td><td class="mono">$${ledgerProtection.spousalSupportMonthly.toLocaleString()} / mo</td></tr>
    <tr><td><strong>Child Support Obligation</strong></td><td class="mono">$${ledgerProtection.childSupportMonthly.toLocaleString()} / mo</td></tr>
    <tr><td><strong>Life Insurance Beneficiary Mandate</strong></td><td>${ledgerProtection.beneficiaryRequirements.map((b) => `${b.policyOrAccount} naming ${b.beneficiary} (${b.requirement})`).join('; ')}</td></tr>
    <tr><td><strong>Asset Split Deadlines</strong></td><td>${ledgerProtection.assetSplitDeadlines.map((d) => `${d.asset}: ${d.deadline} (${d.requirement})`).join('; ')}</td></tr>
  </table>

  <div class="footer">
    Foothold Document Intelligence Brief · Grounded in verified user-uploaded statements · Strictly for attorney / mediator preparation · Not legal advice.
  </div>
</body>
</html>
`;

      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    },
    [workspace]
  );

  return (
    <DiscoveryContext.Provider
      value={{
        workspace,
        checklist,
        activeReviewDoc,
        isAnalyzing,
        analyzingFileName,
        analysisError,
        openReviewDrawer,
        closeReviewDrawer,
        uploadFileAndAnalyze,
        loadSampleDocument,
        approveAndSyncDocument,
        updateExtractedDocument,
        deleteDocument,
        togglePrivacyMode,
        setPrivacyMode,
        resetWorkspace,
        exportDiscoveryPacket
      }}
    >
      {children}
    </DiscoveryContext.Provider>
  );
}

export function useDiscovery() {
  const context = useContext(DiscoveryContext);
  if (!context) {
    throw new Error('useDiscovery must be used within a DiscoveryProvider');
  }
  return context;
}
