export type DiscoveryCategoryKey =
  | 'tax_returns'
  | 'pay_stubs'
  | 'bank_statements'
  | 'mortgage_lease'
  | 'retirement'
  | 'marital_agreements'
  | 'insurance_policies';

export type DocumentStatus = 'Missing' | 'Uploaded' | 'Reviewed';

export interface CategoryChecklistItem {
  key: DiscoveryCategoryKey;
  title: string;
  description: string;
  recommendedCount: string;
  statutoryBasis: string; // e.g. "Cal. Fam. Code § 2104 (Mandatory 60-day Preliminary Disclosure)"
  status: DocumentStatus;
  uploadedCount: number;
  missingNotes: string;
}

export interface ScheduleBPayer {
  payerName: string;
  payerType: 'interest' | 'dividend';
  amount: number;
  potentialHiddenAccount: boolean;
  discoveryReason: string;
}

export interface RecurringExpenseItem {
  id: string;
  name: string;
  amount: number;
  bucket: 'bucket_a_must_pays' | 'bucket_b_life_kids';
  category: string; // Utilities, Groceries, Childcare, Medical, Transit, Debt, etc.
  frequency: string;
  sourceDocName?: string;
  isApproved?: boolean;
}

export interface FlaggedTransferItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  flagReason: string;
  potentialSeparateAccount: boolean;
  sourceDocName?: string;
}

export interface VaultAccount {
  id: string;
  institution: string;
  name: string;
  accountType: string;
  accountNumberMasked?: string;
  owner: 'Mine' | 'Spouse' | 'Joint' | 'Unlisted / Needs Discovery';
  balance: number;
  vestedBalance?: number;
  monthlyContribution?: number;
  requiresQDRO?: boolean;
  qdroExplanation?: string;
  isUnlistedDiscovery: boolean;
  sourceDocument: string;
  discoveryFlag?: string;
  status: 'Verified' | 'Needs Subpoena' | 'Review with Attorney';
}

export interface BeneficiaryRequirementItem {
  id: string;
  policyOrAccount: string;
  beneficiary: string;
  requirement: string;
  deadline?: string;
  status: 'Pending Verification' | 'Compliant' | 'Action Needed';
}

export interface AssetSplitDeadlineItem {
  id: string;
  asset: string;
  deadline: string;
  requirement: string;
  status: 'Pending' | 'In Progress' | 'Satisfied';
}

export interface ExtractedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  categoryKey: DiscoveryCategoryKey;
  categoryLabel: string;
  confidenceScore: number;
  status: DocumentStatus;
  uploadedAt: string;
  approvedAt?: string | null;
  sourceEngine: string;
  plainEnglishSummary: string;
  documentClassification: {
    category: string;
    documentType: string;
    documentYearOrPeriod: string;
    institutionOrIssuer: string;
    confidenceScore: number;
  };
  extractedData: {
    taxReturn?: {
      taxYear: number;
      filingStatus: string;
      adjustedGrossIncome: number;
      userWages: number;
      spouseWages: number;
      totalWages: number;
      scheduleBPayers: ScheduleBPayer[];
    };
    retirement?: {
      institution: string;
      accountType: string;
      accountOwner: 'Mine' | 'Spouse' | 'Joint';
      accountNumberMasked: string;
      currentBalance: number;
      vestedBalance: number;
      monthlyContribution: number;
      requiresQDRO: boolean;
      qdroExplanation: string;
    };
    property?: {
      lenderOrLandlord: string;
      propertyAddress: string;
      isLease: boolean;
      loanBalance: number;
      interestRate: number;
      monthlyPayment: {
        total: number;
        principal: number;
        interest: number;
        escrowTaxesInsurance: number;
        hoa: number;
      };
      coBorrowerStatus: string;
    };
    bankOrCredit?: {
      institution: string;
      accountType: 'checking' | 'savings' | 'credit_card';
      accountNumberMasked: string;
      accountOwner: 'Mine' | 'Spouse' | 'Joint' | 'Unknown';
      endingBalance: number;
      totalMonthlyInflows: number;
      recurringExpenses: Array<{
        name: string;
        amount: number;
        bucket: 'bucket_a_must_pays' | 'bucket_b_life_kids';
        category: string;
        frequency: string;
      }>;
      flaggedTransfersOrCharges: Array<{
        description: string;
        amount: number;
        date: string;
        flagReason: string;
        potentialSeparateAccount: boolean;
      }>;
    };
    maritalAgreement?: {
      agreementType: string;
      effectiveDate: string;
      financialObligations: string[];
      spousalSupportMonthly: number;
      childSupportMonthly: number;
      coparentingSplitRatio: string;
      assetSplitDeadlines: Array<{
        asset: string;
        deadline: string;
        requirement: string;
      }>;
      beneficiaryRequirements: Array<{
        policyOrAccount: string;
        beneficiary: string;
        requirement: string;
      }>;
    };
    paystubOrInsurance?: {
      employerOrInsurer: string;
      payPeriod: string;
      grossPay: number;
      netPay: number;
      deductions: Array<{
        name: string;
        amount: number;
        type: 'retirement_401k' | 'health_premium' | 'tax' | 'other';
      }>;
      insurancePremiumMonthly: number;
      policyBeneficiaries: string[];
    };
  };
  actionItems: Array<{
    priority: 'Critical' | 'High' | 'Recommended';
    action: string;
    reason: string;
  }>;
  unlistedAccounts: Array<{
    institution: string;
    source: string;
    owner: string;
    estimatedBalance: number;
    note: string;
  }>;
}

export interface DiscoveryWorkspaceState {
  documents: ExtractedDocument[];
  accountVault: VaultAccount[];
  baseline: {
    monthlyInflow: number;
    userNetPaycheck: number;
    spouseNetPaycheck: number;
    spousalSupport: number;
    childSupport: number;
    mustPays: RecurringExpenseItem[];
    lifeAndKids: RecurringExpenseItem[];
  };
  housingSandbox: {
    propertyAddress: string;
    estimatedHomeValue: number;
    mortgageBalance: number;
    interestRate: number;
    monthlyMortgageTotal: number;
    principal: number;
    interest: number;
    escrow: number;
    hoa: number;
    coBorrowerStatus: string;
    isLease: boolean;
  };
  ledgerProtection: {
    coparentingSplitRatio: string;
    spousalSupportMonthly: number;
    childSupportMonthly: number;
    beneficiaryRequirements: BeneficiaryRequirementItem[];
    assetSplitDeadlines: AssetSplitDeadlineItem[];
    obligations: string[];
  };
  privacyMode: boolean;
}
