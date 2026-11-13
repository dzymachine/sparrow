export interface ExtractedDiscoveryDocument {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  categoryKey: 'tax_returns' | 'retirement' | 'mortgage_lease' | 'bank_statements' | 'marital_agreements' | 'pay_stubs' | 'insurance_policies';
  categoryLabel: string;
  confidenceScore: number;
  plainEnglishSummary: string;
  status: 'Uploaded' | 'Reviewed';
  uploadedAt: string;
  sourceEngine: string;
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
      scheduleBPayers: Array<{
        payerName: string;
        payerType: 'interest' | 'dividend';
        amount: number;
        potentialHiddenAccount: boolean;
        discoveryReason: string;
      }>;
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

// 6 High-Fidelity Test Documents for 1-Click Verification
export const SAMPLE_DOCUMENTS: Record<string, ExtractedDiscoveryDocument> = {
  'tax_1040_2024': {
    id: 'sample_tax_1040_2024',
    fileName: '2024_Form_1040_Joint_Tax_Return_with_Schedule_B.pdf',
    fileSize: 2450000,
    fileType: 'application/pdf',
    categoryKey: 'tax_returns',
    categoryLabel: 'Tax Returns',
    confidenceScore: 0.98,
    status: 'Uploaded',
    uploadedAt: new Date().toISOString(),
    sourceEngine: 'gemini-4-hydrogen',
    plainEnglishSummary:
      'This 2024 joint tax filing reports $198,400 in combined income and verifies your spouse earned $142,000 compared to your $48,000. Crucially, Schedule B reveals $5,270 in dividend and interest distributions from Vanguard and Morgan Stanley accounts that are not currently documented in your shared household records.',
    documentClassification: {
      category: 'tax_return',
      documentType: 'IRS Form 1040 (Joint Return with Schedule B)',
      documentYearOrPeriod: '2024 Tax Year',
      institutionOrIssuer: 'Department of the Treasury / Internal Revenue Service',
      confidenceScore: 0.98
    },
    extractedData: {
      taxReturn: {
        taxYear: 2024,
        filingStatus: 'Married Filing Jointly',
        adjustedGrossIncome: 198400,
        userWages: 48000,
        spouseWages: 142000,
        totalWages: 190000,
        scheduleBPayers: [
          {
            payerName: 'Vanguard Admiral Treasury Fund',
            payerType: 'dividend',
            amount: 3420,
            potentialHiddenAccount: true,
            discoveryReason: 'High dividend payout indicates an underlying balance of ~$85,000+ not listed in household checking or savings.'
          },
          {
            payerName: 'Morgan Stanley Active Growth',
            payerType: 'dividend',
            amount: 1850,
            potentialHiddenAccount: true,
            discoveryReason: 'Account registered under spouse SSN; confirms separate taxable brokerage holdings.'
          },
          {
            payerName: 'First Republic / Chase Premium CD',
            payerType: 'interest',
            amount: 1120,
            potentialHiddenAccount: false,
            discoveryReason: 'Known marital emergency savings reserve certificate.'
          }
        ]
      }
    },
    actionItems: [
      {
        priority: 'Critical',
        action: 'Formally request full Vanguard & Morgan Stanley statements via Preliminary Declaration of Disclosure (FL-140/FL-142)',
        reason: 'Schedule B confirms investment capital exists that must be valued and divided under California Family Code § 2550.'
      },
      {
        priority: 'High',
        action: 'Note the 75% vs 25% marital income asymmetry for California Family Code § 4320 spousal support evaluation',
        reason: 'W-2 difference of $94,000 establishes your legal basis for temporary and long-term guideline spousal maintenance.'
      }
    ],
    unlistedAccounts: [
      {
        institution: 'Vanguard Group',
        source: 'Form 1040 Schedule B (Line 5)',
        owner: 'Spouse / Unverified',
        estimatedBalance: 85500,
        note: 'Taxable dividend payer not previously visible in primary household bank logins.'
      },
      {
        institution: 'Morgan Stanley Wealth Management',
        source: 'Form 1040 Schedule B (Line 6)',
        owner: 'Spouse Sole Name',
        estimatedBalance: 46250,
        note: 'Requires formal subpoena or schedule disclosure to determine pre-marital vs marital contributions.'
      }
    ]
  },

  'retirement_401k': {
    id: 'sample_retirement_401k',
    fileName: 'Fidelity_Investments_401k_Statement_Q3_2024.pdf',
    fileSize: 1820000,
    fileType: 'application/pdf',
    categoryKey: 'retirement',
    categoryLabel: 'Retirement Statements',
    confidenceScore: 0.99,
    status: 'Uploaded',
    uploadedAt: new Date().toISOString(),
    sourceEngine: 'gemini-4-hydrogen',
    plainEnglishSummary:
      'This statement confirms your spouse holds a fully vested 401(k) balance of $428,500 accumulated primarily during the marriage. Because this is an ERISA-qualified employer plan, dividing your community share will require a court-approved Qualified Domestic Relations Order (QDRO) to avoid all early tax penalties.',
    documentClassification: {
      category: 'retirement_investment',
      documentType: 'Fidelity Defined Contribution Plan Statement',
      documentYearOrPeriod: 'Q3 2024 (Ending Sept 30, 2024)',
      institutionOrIssuer: 'Fidelity Workplace Services',
      confidenceScore: 0.99
    },
    extractedData: {
      retirement: {
        institution: 'Fidelity Investments',
        accountType: '401(k) Employer Plan',
        accountOwner: 'Spouse',
        accountNumberMasked: '•••• 8912',
        currentBalance: 428500,
        vestedBalance: 428500,
        monthlyContribution: 1875,
        requiresQDRO: true,
        qdroExplanation:
          'Under California community property laws and federal ERISA guidelines, retirement savings earned during marriage belong equally to both spouses. A QDRO directs the plan administrator to transfer your share directly into your own rollover IRA without taxes or penalty.'
      }
    },
    actionItems: [
      {
        priority: 'Critical',
        action: 'Retain a specialized QDRO drafting attorney or mediator early in negotiations',
        reason: 'Standard divorce decrees cannot divide 401(k)s without a plan-approved formal QDRO document.'
      },
      {
        priority: 'Recommended',
        action: 'Determine exact account value as of the official Date of Separation',
        reason: 'Contributions and market gains occurring after separation are separate property under Cal. Fam. Code § 771.'
      }
    ],
    unlistedAccounts: []
  },

  'mortgage_statement': {
    id: 'sample_mortgage_statement',
    fileName: 'Wells_Fargo_Mortgage_Statement_November_2024.pdf',
    fileSize: 980000,
    fileType: 'application/pdf',
    categoryKey: 'mortgage_lease',
    categoryLabel: 'Mortgage & Property',
    confidenceScore: 0.97,
    status: 'Uploaded',
    uploadedAt: new Date().toISOString(),
    sourceEngine: 'gemini-4-hydrogen',
    plainEnglishSummary:
      'Your monthly housing obligation is $2,480 at a 3.250% fixed interest rate with $384,200 remaining on the principal mortgage. Both your name and your spouse’s name are listed as co-borrowers, meaning keeping the home long-term requires a formal refinancing buyout or negotiated property offset.',
    documentClassification: {
      category: 'mortgage_lease',
      documentType: 'Monthly Residential Mortgage Billing Statement',
      documentYearOrPeriod: 'November 2024 Billing Cycle',
      institutionOrIssuer: 'Wells Fargo Home Mortgage',
      confidenceScore: 0.97
    },
    extractedData: {
      property: {
        lenderOrLandlord: 'Wells Fargo Home Mortgage',
        propertyAddress: '1428 Crestview Drive, Pasadena, CA 91107',
        isLease: false,
        loanBalance: 384200,
        interestRate: 3.250,
        monthlyPayment: {
          total: 2480,
          principal: 1020,
          interest: 890,
          escrowTaxesInsurance: 570,
          hoa: 0
        },
        coBorrowerStatus: 'Joint (Both Spouses on Note & Deed of Trust)'
      }
    },
    actionItems: [
      {
        priority: 'High',
        action: 'Calculate buyout feasibility in the Housing Sandbox before committing to retain the marital residence',
        reason: 'Refinancing today may forfeit the 3.25% interest rate, potentially increasing monthly payments by $1,100+.'
      },
      {
        priority: 'Recommended',
        action: 'Obtain an independent Certified Residential Appraisal (CMA)',
        reason: 'Fair market valuation determines the precise equity offset owed to or by you under California Family Code § 2550.'
      }
    ],
    unlistedAccounts: []
  },

  'bank_checking_statement': {
    id: 'sample_bank_checking_statement',
    fileName: 'Chase_Total_Checking_and_Card_Statement_October_2024.csv',
    fileSize: 450000,
    fileType: 'text/csv',
    categoryKey: 'bank_statements',
    categoryLabel: 'Bank & Credit Statements',
    confidenceScore: 0.96,
    status: 'Uploaded',
    uploadedAt: new Date().toISOString(),
    sourceEngine: 'gemini-4-hydrogen',
    plainEnglishSummary:
      'Analysis of this 30-day checking period identifies $9,200 in monthly inflows and $3,205 in essential recurring expenses ($2,340 Must-Pays and $865 Life & Kids). The system flagged a regular $1,500 monthly recurring transfer out to an unknown Marcus by Goldman Sachs account that requires legal clarification.',
    documentClassification: {
      category: 'bank_credit',
      documentType: 'Checking & Debit Statement / CSV Transaction Feed',
      documentYearOrPeriod: 'October 1 - October 31, 2024',
      institutionOrIssuer: 'JPMorgan Chase Bank, N.A.',
      confidenceScore: 0.96
    },
    extractedData: {
      bankOrCredit: {
        institution: 'Chase Bank',
        accountType: 'checking',
        accountNumberMasked: '•••• 4419',
        accountOwner: 'Joint',
        endingBalance: 14350,
        totalMonthlyInflows: 9200,
        recurringExpenses: [
          {
            name: 'Pasadena Water & Power (Electric/Water)',
            amount: 185,
            bucket: 'bucket_a_must_pays',
            category: 'Utilities',
            frequency: 'monthly'
          },
          {
            name: 'Trader Joe’s & Whole Foods (Household Groceries)',
            amount: 820,
            bucket: 'bucket_a_must_pays',
            category: 'Groceries',
            frequency: 'monthly'
          },
          {
            name: 'Sunshine After-School Care & Tutoring',
            amount: 950,
            bucket: 'bucket_a_must_pays',
            category: 'Childcare',
            frequency: 'monthly'
          },
          {
            name: 'Geico Auto Insurance (2 Vehicles)',
            amount: 165,
            bucket: 'bucket_a_must_pays',
            category: 'Transit',
            frequency: 'monthly'
          },
          {
            name: 'Chase Freedom Card (Minimum Debt Service)',
            amount: 220,
            bucket: 'bucket_a_must_pays',
            category: 'Debt',
            frequency: 'monthly'
          },
          {
            name: 'Pasadena Pediatric Orthodontics',
            amount: 350,
            bucket: 'bucket_b_life_kids',
            category: 'Medical',
            frequency: 'monthly'
          },
          {
            name: 'Youth Soccer League & Music Lessons',
            amount: 240,
            bucket: 'bucket_b_life_kids',
            category: 'School',
            frequency: 'monthly'
          },
          {
            name: 'Chevron Gasoline & Metro Transit',
            amount: 190,
            bucket: 'bucket_b_life_kids',
            category: 'Transit',
            frequency: 'monthly'
          },
          {
            name: 'CVS Pharmacy Family Prescriptions',
            amount: 85,
            bucket: 'bucket_b_life_kids',
            category: 'Medical',
            frequency: 'monthly'
          }
        ],
        flaggedTransfersOrCharges: [
          {
            description: 'Recurring Auto-Transfer to Goldman Sachs / Marcus (Acct •••• 4082)',
            amount: 1500,
            date: '2024-10-15',
            flagReason: 'High-value recurring transfer to an external sole-name savings account not in shared vault.',
            potentialSeparateAccount: true
          },
          {
            description: 'Recurring Monthly Charge: Executive Storage Locker Unit 14B',
            amount: 420,
            date: '2024-10-02',
            flagReason: 'Offsite storage facility rental; may contain undisclosed tangible personal property.',
            potentialSeparateAccount: false
          }
        ]
      }
    },
    actionItems: [
      {
        priority: 'Critical',
        action: 'Subpoena records for Marcus by Goldman Sachs account ending in 4082',
        reason: 'Demonstrated $1,500/month outflow indicates substantial accumulated liquidity in an undisclosed sole account.'
      },
      {
        priority: 'High',
        action: 'Import verified $3,205 baseline expenditures into "My New Baseline" budget',
        reason: 'Grounded bank statements provide non-disputable evidence for California FL-150 Income & Expense Declarations.'
      }
    ],
    unlistedAccounts: [
      {
        institution: 'Marcus by Goldman Sachs',
        source: 'Chase Joint Checking Transfer Records (Oct 15)',
        owner: 'Spouse Sole Account (Pending Verification)',
        estimatedBalance: 36000,
        note: 'Calculated from 24+ months of continuous $1,500/month automatic debits.'
      }
    ]
  },

  'marital_agreement': {
    id: 'sample_marital_agreement',
    fileName: 'California_Marital_Settlement_Agreement_Stipulation.pdf',
    fileSize: 3100000,
    fileType: 'application/pdf',
    categoryKey: 'marital_agreements',
    categoryLabel: 'Marital Agreements',
    confidenceScore: 0.99,
    status: 'Uploaded',
    uploadedAt: new Date().toISOString(),
    sourceEngine: 'gemini-4-hydrogen',
    plainEnglishSummary:
      'This draft stipulation establishes $2,200/month in spousal support, $1,650/month in child support, and a 60/40 co-parenting time share. It sets a strict 180-day deadline to resolve primary home refinancing and mandates that your spouse maintain a $500,000 life insurance policy naming your children as irrevocable beneficiaries.',
    documentClassification: {
      category: 'marital_agreement',
      documentType: 'Marital Settlement Agreement & Child Custody Stipulation',
      documentYearOrPeriod: '2024 Execution Draft',
      institutionOrIssuer: 'California Superior Court / Family Law Division',
      confidenceScore: 0.99
    },
    extractedData: {
      maritalAgreement: {
        agreementType: 'Marital Settlement Agreement & Support Stipulation',
        effectiveDate: '2024-09-15',
        financialObligations: [
          'Spouse to pay monthly spousal support of $2,200 via direct ACH by the 1st of each calendar month.',
          'Spouse to pay child support of $1,650/month for two minor children until age 18 or high school graduation.',
          'Unreimbursed medical, dental, and extracurricular expenses split 60% (Spouse) / 40% (User).'
        ],
        spousalSupportMonthly: 2200,
        childSupportMonthly: 1650,
        coparentingSplitRatio: '60/40',
        assetSplitDeadlines: [
          {
            asset: 'Marital Residence (Pasadena)',
            deadline: 'Within 180 days of final judgment',
            requirement: 'Refinance into sole name and deliver 50% equity buyout check, or list for public sale.'
          },
          {
            asset: 'Fidelity 401(k) Division',
            deadline: 'Within 90 days of final judgment',
            requirement: 'File QDRO signed by court and plan administrator.'
          }
        ],
        beneficiaryRequirements: [
          {
            policyOrAccount: 'Northwestern Mutual Term Life Policy ($500,000)',
            beneficiary: 'Minor Children (User as Trustee)',
            requirement: 'Spouse must provide annual written proof of policy in force and beneficiary designation.'
          }
        ]
      }
    },
    actionItems: [
      {
        priority: 'Critical',
        action: 'Calendar 180-day home buyout deadline and 90-day QDRO submission window',
        reason: 'Missing court-stipulated deadlines can forfeit buyout options and trigger forced public real estate sales.'
      },
      {
        priority: 'High',
        action: 'Sync $3,850 combined monthly support into My New Baseline cash-inflows',
        reason: 'Ensures your post-divorce budget accurately reflects enforceable legal support commitments.'
      }
    ],
    unlistedAccounts: []
  },

  'paystub_insurance': {
    id: 'sample_paystub_insurance',
    fileName: 'Tech_Corp_SemiMonthly_PayStub_Spouse_Nov2024.pdf',
    fileSize: 840000,
    fileType: 'application/pdf',
    categoryKey: 'pay_stubs',
    categoryLabel: 'Pay Stubs & Insurance',
    confidenceScore: 0.98,
    status: 'Uploaded',
    uploadedAt: new Date().toISOString(),
    sourceEngine: 'gemini-4-hydrogen',
    plainEnglishSummary:
      'This semi-monthly earnings statement documents your spouse’s $12,850 gross monthly salary ($154,200 base) with $8,410 in take-home pay. Key deductions include $1,250/month in pre-tax 401(k) contributions and employer-subsidized health benefits currently covering you and the children.',
    documentClassification: {
      category: 'paystub_insurance',
      documentType: 'Corporate Earnings Statement & Benefits Detail',
      documentYearOrPeriod: 'Pay Period Ending Nov 15, 2024',
      institutionOrIssuer: 'Apex Technologies Inc. Payroll Department',
      confidenceScore: 0.98
    },
    extractedData: {
      paystubOrInsurance: {
        employerOrInsurer: 'Apex Technologies Inc.',
        payPeriod: 'Semi-Monthly (Nov 1 - Nov 15, 2024)',
        grossPay: 12850,
        netPay: 8410,
        deductions: [
          {
            name: 'Pre-Tax 401(k) Retirement Contribution',
            amount: 1250,
            type: 'retirement_401k'
          },
          {
            name: 'Group Medical/Dental/Vision Family Coverage',
            amount: 410,
            type: 'health_premium'
          },
          {
            name: 'Federal Withholding Tax',
            amount: 1820,
            type: 'tax'
          },
          {
            name: 'California State Disability & Income Tax',
            amount: 960,
            type: 'tax'
          }
        ],
        insurancePremiumMonthly: 410,
        policyBeneficiaries: [
          'Employer Group Term Life ($250,000) - Primary: Spouse'
        ]
      }
    },
    actionItems: [
      {
        priority: 'High',
        action: 'Review COBRA continuation options for healthcare before final decree',
        reason: 'Federal law allows up to 36 months of continued coverage on spouse group health plan upon divorce.'
      },
      {
        priority: 'Recommended',
        action: 'Verify spouse bonus history and unvested stock options (RSUs)',
        reason: 'Tech employers frequently award 15-30% annual bonuses and stock grants that constitute community property.'
      }
    ],
    unlistedAccounts: []
  }
};
