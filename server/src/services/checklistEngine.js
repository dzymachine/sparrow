/**
 * Deterministic Divorce Document Checklist Engine
 * Generates a stage-by-stage list of every document that needs to be filled out,
 * gathered, and/or signed throughout the divorce process, tailored to the user's
 * onboarding situation.
 */

const CHECKLIST_STAGES = [
  {
    id: 'stage_1_filing',
    order: 1,
    title: 'Stage 1: Initial Filing & Petition',
    subtitle: 'Forms required to legally open your divorce case and serve your spouse.'
  },
  {
    id: 'stage_2_disclosures',
    order: 2,
    title: 'Stage 2: Mandatory Financial Disclosures',
    subtitle: 'Court-mandated income, expense, asset, and debt disclosures (typically due within 60 days).'
  },
  {
    id: 'stage_3_discovery_orders',
    order: 3,
    title: 'Stage 3: Temporary Orders & Discovery',
    subtitle: 'Motions for temporary support/custody and formal discovery tools to uncover hidden assets.'
  },
  {
    id: 'stage_4_settlement_trial',
    order: 4,
    title: 'Stage 4: Settlement Agreement or Trial Prep',
    subtitle: 'Finalizing terms through a Marital Settlement Agreement or preparing for a contested hearing.'
  },
  {
    id: 'stage_5_judgment_post',
    order: 5,
    title: 'Stage 5: Final Judgment & Post-Divorce Execution',
    subtitle: 'Court-signed decree ending the marriage plus deeds, QDROs, and account transfers.'
  }
];

function getJurisdictionConfig(stateJurisdiction) {
  const state = stateJurisdiction || 'California';
  switch (state) {
    case 'California':
      return {
        state: 'California',
        petitionCode: 'FL-100',
        petitionTitle: 'Petition — Marriage / Domestic Partnership (FL-100)',
        summonsCode: 'FL-110',
        summonsTitle: 'Summons (Family Law) (FL-110)',
        proofOfServiceCode: 'FL-115',
        proofOfServiceTitle: 'Proof of Service of Summons (FL-115)',
        uccjeaCode: 'FL-105',
        uccjeaTitle: 'Declaration Under UCCJEA (FL-105)',
        custodyCode: 'FL-311',
        custodyTitle: 'Child Custody and Visitation Application Attachment (FL-311)',
        feeWaiverCode: 'FW-001 / FW-003',
        feeWaiverTitle: 'Request to Waive Court Fees (FW-001) & Order (FW-003)',
        protectiveCode: 'DV-100 / DV-109 / DV-110',
        protectiveTitle: 'Domestic Violence Restraining Order Packet (DV-100, DV-109, DV-110)',
        disclosureCode: 'FL-140',
        disclosureTitle: 'Declaration of Disclosure (FL-140)',
        incomeExpenseCode: 'FL-150',
        incomeExpenseTitle: 'Income and Expense Declaration (FL-150)',
        assetsDebtsCode: 'FL-142 / FL-160',
        assetsDebtsTitle: 'Schedule of Assets and Debts (FL-142) / Property Declaration (FL-160)',
        serviceDisclosureCode: 'FL-141',
        serviceDisclosureTitle: 'Declaration Regarding Service of Declaration of Disclosure (FL-141)',
        spousalSupportCode: 'FL-157',
        spousalSupportTitle: 'Spousal or Partner Support Declaration Attachment (FL-157)',
        rfoCode: 'FL-300',
        rfoTitle: 'Request for Order (Temporary Support, Custody & Attorney Fees) (FL-300)',
        interrogatoriesCode: 'FL-145',
        interrogatoriesTitle: 'Form Interrogatories — Family Law (FL-145) & Document Demands',
        childSupportCode: 'FL-342',
        childSupportTitle: 'Child Support Information and Order Attachment (FL-342)',
        uncontestedCode: 'FL-130 / FL-170',
        uncontestedTitle: 'Appearance, Stipulations, and Waivers (FL-130) & Uncontested Declaration (FL-170)',
        judgmentCode: 'FL-180',
        judgmentTitle: 'Judgment of Dissolution (FL-180)',
        noticeJudgmentCode: 'FL-190',
        noticeJudgmentTitle: 'Notice of Entry of Judgment (FL-190)',
        iwoCode: 'FL-195',
        iwoTitle: 'Income Withholding for Support (FL-195)',
        selfHelpBase: 'https://selfhelp.courts.ca.gov/divorce-california',
        pdfs: {
          petition: 'https://www.courts.ca.gov/documents/fl100.pdf',
          summons: 'https://www.courts.ca.gov/documents/fl110.pdf',
          proofOfService: 'https://www.courts.ca.gov/documents/fl115.pdf',
          uccjea: 'https://www.courts.ca.gov/documents/fl105.pdf',
          custody: 'https://www.courts.ca.gov/documents/fl311.pdf',
          feeWaiver: 'https://www.courts.ca.gov/documents/fw001.pdf',
          protective: 'https://www.courts.ca.gov/documents/dv100.pdf',
          disclosure: 'https://www.courts.ca.gov/documents/fl140.pdf',
          incomeExpense: 'https://www.courts.ca.gov/documents/fl150.pdf',
          assetsDebts: 'https://www.courts.ca.gov/documents/fl142.pdf',
          serviceDisclosure: 'https://www.courts.ca.gov/documents/fl141.pdf',
          spousalSupport: 'https://www.courts.ca.gov/documents/fl157.pdf',
          rfo: 'https://www.courts.ca.gov/documents/fl300.pdf',
          interrogatories: 'https://www.courts.ca.gov/documents/fl145.pdf',
          childSupport: 'https://www.courts.ca.gov/documents/fl342.pdf',
          uncontested: 'https://www.courts.ca.gov/documents/fl130.pdf',
          judgment: 'https://www.courts.ca.gov/documents/fl180.pdf',
          noticeJudgment: 'https://www.courts.ca.gov/documents/fl190.pdf',
          iwo: 'https://www.courts.ca.gov/documents/fl195.pdf',
          summaryDissolution: 'https://www.courts.ca.gov/documents/fl800.pdf',
          finalDisclosure: 'https://www.courts.ca.gov/documents/fl144.pdf'
        }
      };
    case 'New York':
      return {
        state: 'New York',
        petitionCode: 'UD-1 / UD-2',
        petitionTitle: 'Summons with Notice (UD-1) & Verified Complaint for Divorce (UD-2)',
        summonsCode: 'UD-1a',
        summonsTitle: 'Notice of Automatic Orders & Guideline Maintenance Notice',
        proofOfServiceCode: 'UD-3',
        proofOfServiceTitle: 'Affidavit of Service (UD-3)',
        uccjeaCode: 'UCCJEA-1',
        uccjeaTitle: 'Affirmation / Affidavit Under UCCJEA',
        custodyCode: 'Custody Petition',
        custodyTitle: 'Parenting Plan & Child Custody / Visitation Schedule',
        feeWaiverCode: 'Poor Person Order',
        feeWaiverTitle: 'Affidavit in Support of Application to Proceed as a Poor Person',
        protectiveCode: 'Family Offense Petition',
        protectiveTitle: 'Order of Protection Petition & Address Confidentiality Request',
        disclosureCode: 'Statement of Net Worth',
        disclosureTitle: 'Sworn Statement of Net Worth (NY Domestic Relations Law § 236)',
        incomeExpenseCode: 'UD-8',
        incomeExpenseTitle: 'Maintenance & Child Support Worksheets (UD-8)',
        assetsDebtsCode: 'Equitable Dist. Schedule',
        assetsDebtsTitle: 'Statement of Proposed Disposition & Marital Property Schedule',
        serviceDisclosureCode: 'Affidavit of Service',
        serviceDisclosureTitle: 'Proof of Service of Sworn Statement of Net Worth',
        spousalSupportCode: 'UD-8(1) / UD-8(2)',
        spousalSupportTitle: 'Annual Income & Maintenance Guidelines Worksheet (UD-8)',
        rfoCode: 'Order to Show Cause',
        rfoTitle: 'Pendente Lite Motion for Temporary Support & Counsel Fees',
        interrogatoriesCode: 'Notice for Discovery',
        interrogatoriesTitle: 'Notice for Discovery & Inspection / Financial Subpoenas',
        childSupportCode: 'UD-8(3)',
        childSupportTitle: 'Child Support Worksheet (CSSA) & Parenting Stipulation',
        uncontestedCode: 'UD-6 / UD-10',
        uncontestedTitle: 'Affidavit of Plaintiff (UD-6) & Findings of Fact / Conclusions of Law (UD-10)',
        judgmentCode: 'UD-11',
        judgmentTitle: 'Judgment of Divorce (UD-11)',
        noticeJudgmentCode: 'Notice of Entry',
        noticeJudgmentTitle: 'Notice of Entry of Judgment & Certificate of Dissolution (DOH-2168)',
        iwoCode: 'LDSS-5037',
        iwoTitle: 'Income Withholding Order for Support',
        selfHelpBase: 'https://www.nycourts.gov/courthelp/Family/divorce.shtml'
      };
    case 'Texas':
      return {
        state: 'Texas',
        petitionCode: 'Original Petition',
        petitionTitle: 'Original Petition for Divorce',
        summonsCode: 'Citation',
        summonsTitle: 'Civil Citation & Standing Orders (County-Specific)',
        proofOfServiceCode: 'Return of Service',
        proofOfServiceTitle: 'Return of Service or Waiver of Service (Signed & Notarized)',
        uccjeaCode: 'SAPCR / UCCJEA',
        uccjeaTitle: 'Suit Affecting the Parent-Child Relationship (SAPCR) & UCCJEA Affidavit',
        custodyCode: 'Possession Order',
        custodyTitle: 'Standard or Custom Possession Order & Conservatorship Plan',
        feeWaiverCode: 'Statement of Inability',
        feeWaiverTitle: 'Statement of Inability to Afford Payment of Court Costs',
        protectiveCode: 'Protective Order',
        protectiveTitle: 'Application for Family Violence Protective Order',
        disclosureCode: 'Initial Disclosures',
        disclosureTitle: 'Required Initial Disclosures (Tex. R. Civ. P. 194.2)',
        incomeExpenseCode: 'Financial Info Statement',
        incomeExpenseTitle: 'Financial Information Statement (FIS)',
        assetsDebtsCode: 'Inventory & Appraisement',
        assetsDebtsTitle: 'Sworn Inventory and Appraisement of Community & Separate Property',
        serviceDisclosureCode: 'Certificate of Discovery',
        serviceDisclosureTitle: 'Certificate of Written Discovery / Disclosure Compliance',
        spousalSupportCode: 'Spousal Maintenance',
        spousalSupportTitle: 'Spousal Maintenance Eligibility & Financial Need Statement',
        rfoCode: 'Motion for Temp Orders',
        rfoTitle: 'Motion for Temporary Orders (Support, Exclusive Use of Home, Fees)',
        interrogatoriesCode: 'Interrogatories & RFP',
        interrogatoriesTitle: 'Written Interrogatories & Request for Production of Financial Records',
        childSupportCode: 'Child Support Order',
        childSupportTitle: 'Child Support Guidelines Calculation & Medical Support Order',
        uncontestedCode: 'Waiver / Prove-Up',
        uncontestedTitle: 'Signed Waiver of Service & Prove-Up Testimony Script',
        judgmentCode: 'Final Decree',
        judgmentTitle: 'Final Decree of Divorce',
        noticeJudgmentCode: 'BVS Form VS-165',
        noticeJudgmentTitle: 'Information on Suit Affecting the Family Relationship (VS-165)',
        iwoCode: 'Income Withholding',
        iwoTitle: 'Order/Notice to Withhold Income for Child Support',
        selfHelpBase: 'https://texaslawhelp.org/family-divorce-children/divorce'
      };
    case 'Florida':
      return {
        state: 'Florida',
        petitionCode: 'Form 12.901',
        petitionTitle: 'Petition for Dissolution of Marriage (Form 12.901(b))',
        summonsCode: 'Form 12.910(a)',
        summonsTitle: 'Summons: Personal Service on an Individual (Form 12.910(a))',
        proofOfServiceCode: 'Return of Service',
        proofOfServiceTitle: 'Process Server Return of Service or Answer & Waiver',
        uccjeaCode: 'Form 12.902(d)',
        uccjeaTitle: 'Uniform Child Custody Jurisdiction and Enforcement Act Affidavit (12.902(d))',
        custodyCode: 'Form 12.995(a)',
        custodyTitle: 'Parenting Plan (Form 12.995(a))',
        feeWaiverCode: 'Indigent Application',
        feeWaiverTitle: 'Application for Determination of Civil Indigent Status',
        protectiveCode: 'Form 12.980(a)',
        protectiveTitle: 'Petition for Injunction for Protection Against Domestic Violence (12.980(a))',
        disclosureCode: 'Form 12.932',
        disclosureTitle: 'Certificate of Compliance with Mandatory Disclosure (Form 12.932)',
        incomeExpenseCode: 'Form 12.902(b)/(c)',
        incomeExpenseTitle: 'Family Law Financial Affidavit (Form 12.902(b) or (c))',
        assetsDebtsCode: 'Equitable Dist. Sheet',
        assetsDebtsTitle: 'Marital Assets and Liabilities Worksheet',
        serviceDisclosureCode: 'Form 12.932',
        serviceDisclosureTitle: 'Filed Certificate of Compliance with Mandatory Disclosure',
        spousalSupportCode: 'Alimony Request',
        spousalSupportTitle: 'Alimony Need & Ability-to-Pay Financial Documentation',
        rfoCode: 'Motion for Temp Relief',
        rfoTitle: 'Motion for Temporary Support, Time-Sharing & Attorney Fees',
        interrogatoriesCode: 'Form 12.930',
        interrogatoriesTitle: 'Standard Family Law Interrogatories & Request to Produce',
        childSupportCode: 'Form 12.902(e)',
        childSupportTitle: 'Child Support Guidelines Worksheet (Form 12.902(e))',
        uncontestedCode: 'Form 12.902(f)',
        uncontestedTitle: 'Marital Settlement Agreement for Dissolution of Marriage (Form 12.902(f))',
        judgmentCode: 'Form 12.990',
        judgmentTitle: 'Final Judgment of Dissolution of Marriage (Form 12.990)',
        noticeJudgmentCode: 'Form 12.902(j)',
        noticeJudgmentTitle: 'Notice of Social Security Number & Final Disposition Form (12.999)',
        iwoCode: 'Form 12.996(a)',
        iwoTitle: 'Income Deduction Order (Form 12.996(a))',
        selfHelpBase: 'https://www.flcourts.gov/Resources-Services/Office-of-Family-Courts/Family-Court-in-Florida/Family-Law-Forms'
      };
    default:
      return {
        state,
        petitionCode: 'Petition',
        petitionTitle: `Petition / Complaint for Divorce (${state})`,
        summonsCode: 'Summons',
        summonsTitle: `Family Court Summons & Automatic Temporary Restraining Orders`,
        proofOfServiceCode: 'Proof of Service',
        proofOfServiceTitle: 'Affidavit / Proof of Service of Summons',
        uccjeaCode: 'UCCJEA Affidavit',
        uccjeaTitle: 'Uniform Child Custody Jurisdiction (UCCJEA) Affidavit',
        custodyCode: 'Parenting Plan',
        custodyTitle: 'Proposed Parenting Plan & Custody / Visitation Schedule',
        feeWaiverCode: 'Fee Waiver',
        feeWaiverTitle: 'Application / Affidavit for Waiver of Court Filing Fees',
        protectiveCode: 'Protective Order',
        protectiveTitle: 'Petition for Domestic Violence Protective Order & Confidential Address',
        disclosureCode: 'Financial Disclosure',
        disclosureTitle: 'Mandatory Sworn Financial Disclosure Statement',
        incomeExpenseCode: 'Financial Affidavit',
        incomeExpenseTitle: 'Income, Expense & Budget Affidavit',
        assetsDebtsCode: 'Asset & Debt Schedule',
        assetsDebtsTitle: 'Comprehensive Schedule of Marital & Separate Assets and Debts',
        serviceDisclosureCode: 'Disclosure Certificate',
        serviceDisclosureTitle: 'Certificate of Compliance / Service of Financial Disclosures',
        spousalSupportCode: 'Support Request',
        spousalSupportTitle: 'Spousal Maintenance / Alimony Needs & Statutory Factors Statement',
        rfoCode: 'Temp Orders Motion',
        rfoTitle: 'Motion for Temporary Orders (Support, Custody, Legal Fees)',
        interrogatoriesCode: 'Discovery & Subpoenas',
        interrogatoriesTitle: 'Formal Interrogatories, Production Requests & Financial Subpoenas',
        childSupportCode: 'Support Worksheet',
        childSupportTitle: 'State Child Support Guidelines Worksheet',
        uncontestedCode: 'Stipulation / Waiver',
        uncontestedTitle: 'Appearance, Stipulation & Uncontested Divorce Affidavit',
        judgmentCode: 'Final Decree',
        judgmentTitle: 'Final Judgment / Decree of Dissolution of Marriage',
        noticeJudgmentCode: 'Notice of Entry',
        noticeJudgmentTitle: 'Notice of Entry of Final Decree & Vital Statistics Certificate',
        iwoCode: 'IWO',
        iwoTitle: 'Income Withholding Order for Support',
        selfHelpBase: 'https://www.usa.gov/divorce'
      };
  }
}

function buildChecklistItems(profile) {
  const state = profile?.stateJurisdiction || 'California';
  const cfg = getJurisdictionConfig(state);
  const marriageYears = Number(profile?.marriageLengthYears || 0);
  const hasChildren = Boolean(profile?.hasChildren) || Number(profile?.childrenCount || 0) > 0;
  const childrenCount = Number(profile?.childrenCount || 0);
  const concerns = Array.isArray(profile?.primaryConcerns) ? profile.primaryConcerns : [];
  const divorcePathway = profile?.divorcePathway || 'unsure';
  const hasPrenup = profile?.hasPrenup || 'no';
  const ownsHome = Boolean(profile?.ownsHome) || concerns.includes('keeping_marital_home');
  const hasRetirement = Boolean(profile?.hasRetirementAccounts) || concerns.includes('protecting_retirement_share');
  const hiddenAssetRisk =
    Boolean(profile?.fearOfHiddenAssets) ||
    profile?.financialRole === 'spouse_handled_all' ||
    concerns.includes('discovering_hidden_accounts');
  const needsSpousalSupport =
    marriageYears >= 10 || concerns.includes('securing_spousal_support');
  const needsFeeWaiver = Boolean(profile?.needsFeeWaiver);
  const needsProtectiveOrder = Boolean(profile?.needsProtectiveOrder);
  const isSummaryEligible =
    state === 'California' &&
    marriageYears > 0 &&
    marriageYears < 5 &&
    !hasChildren &&
    !ownsHome &&
    divorcePathway === 'amicable_uncontested';

  const items = [];

  const pdfs = cfg.pdfs || {};
  const courtFormPdfMeta = (pdfKey) => ({
    pdfUrl: pdfs[pdfKey] || null,
    pdfAvailability: pdfs[pdfKey] ? 'official_pdf' : 'portal_only'
  });

  // =========================================================
  // STAGE 1: INITIAL FILING & PETITION
  // =========================================================
  items.push({
    id: 'doc-petition',
    stage: 'stage_1_filing',
    title: cfg.petitionTitle,
    formCode: cfg.petitionCode,
    actionType: 'Fill & File',
    whoSigns: 'You (Petitioner)',
    priority: 'Required',
    reasonIncluded: `Core filing form required in ${state} to open a divorce case.`,
    description: 'States basic facts about your marriage, residency, children, and what you are asking the court to decide (property, support, custody).',
    officialLink: cfg.selfHelpBase,
    ...courtFormPdfMeta('petition')
  });

  items.push({
    id: 'doc-summons',
    stage: 'stage_1_filing',
    title: cfg.summonsTitle,
    formCode: cfg.summonsCode,
    actionType: 'Fill & File',
    whoSigns: 'Court Clerk Issues (Served on Spouse)',
    priority: 'Required',
    reasonIncluded: `Mandatory companion form to your ${state} divorce petition.`,
    description: 'Notifies your spouse that a divorce case has been filed and activates Automatic Temporary Restraining Orders (ATROs) preventing either spouse from hiding assets or cancelling insurance.',
    officialLink: cfg.selfHelpBase,
    ...courtFormPdfMeta('summons')
  });

  items.push({
    id: 'doc-proof-of-service',
    stage: 'stage_1_filing',
    title: cfg.proofOfServiceTitle,
    formCode: cfg.proofOfServiceCode,
    actionType: 'Sign & Serve',
    whoSigns: 'Adult Server (Not You)',
    priority: 'Required',
    reasonIncluded: 'Court requires proof that your spouse officially received the divorce papers.',
    description: 'Must be completed and signed by someone 18+ (other than you) who personally delivers the Petition and Summons to your spouse, then filed with the court.',
    officialLink: cfg.selfHelpBase,
    ...courtFormPdfMeta('proofOfService')
  });

  if (isSummaryEligible) {
    items.push({
      id: 'doc-summary-dissolution',
      stage: 'stage_1_filing',
      title: 'Joint Petition for Summary Dissolution (FL-800)',
      formCode: 'FL-800',
      actionType: 'Fill & File',
      whoSigns: 'Both Spouses',
      priority: 'Recommended',
      reasonIncluded: `Your profile (< 5 years married, no children, no real estate, amicable) may qualify for California's streamlined Summary Dissolution.`,
      description: 'A faster, simplified joint filing option if both spouses agree on everything and meet California debt/asset caps.',
      officialLink: 'https://selfhelp.courts.ca.gov/divorce/summary-dissolution',
      ...courtFormPdfMeta('summaryDissolution')
    });
  }

  if (needsFeeWaiver) {
    items.push({
      id: 'doc-fee-waiver',
      stage: 'stage_1_filing',
      title: cfg.feeWaiverTitle,
      formCode: cfg.feeWaiverCode,
      actionType: 'Fill & File',
      whoSigns: 'You (Petitioner)',
      priority: 'Situation-Specific',
      reasonIncluded: 'Included because you indicated you may need a court filing fee waiver.',
      description: 'Requests that the court waive initial filing fees (often $435+ in CA) based on household income, public benefits, or financial hardship.',
      officialLink: cfg.selfHelpBase,
      ...courtFormPdfMeta('feeWaiver')
    });
  }

  if (hasChildren) {
    items.push({
      id: 'doc-uccjea',
      stage: 'stage_1_filing',
      title: cfg.uccjeaTitle,
      formCode: cfg.uccjeaCode,
      actionType: 'Fill & File',
      whoSigns: 'You (Petitioner)',
      priority: 'Required',
      reasonIncluded: `Required because you have ${childrenCount || 'minor'} child(ren) / dependents.`,
      description: 'Lists where your children have lived for the past 5 years to confirm which state court has legal jurisdiction over custody.',
      officialLink: cfg.selfHelpBase,
      ...courtFormPdfMeta('uccjea')
    });

    items.push({
      id: 'doc-custody-app',
      stage: 'stage_1_filing',
      title: cfg.custodyTitle,
      formCode: cfg.custodyCode,
      actionType: 'Fill & File',
      whoSigns: 'You (Petitioner)',
      priority: 'Situation-Specific',
      reasonIncluded: `Included because you have ${childrenCount || 'minor'} child(ren) and need custody/visitation terms.`,
      description: 'Details your proposed legal custody, physical custody, holiday schedule, and parenting arrangements.',
      officialLink: cfg.selfHelpBase,
      ...courtFormPdfMeta('custody')
    });
  }

  if (needsProtectiveOrder) {
    items.push({
      id: 'doc-protective-order',
      stage: 'stage_1_filing',
      title: cfg.protectiveTitle,
      formCode: cfg.protectiveCode,
      actionType: 'Fill & File',
      whoSigns: 'You & Judge',
      priority: 'Situation-Specific',
      reasonIncluded: 'Included because you indicated a need for protective order or confidential address forms.',
      description: 'Requests immediate court protection (stay-away orders, exclusive residence use, or address confidentiality) when safety is a concern.',
      officialLink: cfg.selfHelpBase,
      ...courtFormPdfMeta('protective')
    });
  }

  // =========================================================
  // STAGE 2: MANDATORY FINANCIAL DISCLOSURES
  // =========================================================
  items.push({
    id: 'doc-disclosure-decl',
    stage: 'stage_2_disclosures',
    title: cfg.disclosureTitle,
    formCode: cfg.disclosureCode,
    actionType: 'Sign & Serve',
    whoSigns: 'You (Served on Spouse)',
    priority: 'Required',
    reasonIncluded: `Mandatory preliminary disclosure in ${state} (typically due within 60 days of filing).`,
    description: 'Cover sheet certifying under penalty of perjury that you have disclosed all known assets, debts, income, and expenses.',
    officialLink: cfg.selfHelpBase,
    ...courtFormPdfMeta('disclosure')
  });

  items.push({
    id: 'doc-income-expense',
    stage: 'stage_2_disclosures',
    title: cfg.incomeExpenseTitle,
    formCode: cfg.incomeExpenseCode,
    actionType: 'Fill & File',
    whoSigns: 'You (Petitioner)',
    priority: 'Required',
    reasonIncluded: 'Required to establish income, monthly living costs, and support calculations.',
    description: 'Detailed breakdown of your monthly earnings, taxes, childcare, housing, and household expenses. Attach last 2 months of pay stubs.',
    officialLink: cfg.selfHelpBase,
    ...courtFormPdfMeta('incomeExpense')
  });

  items.push({
    id: 'doc-assets-debts',
    stage: 'stage_2_disclosures',
    title: cfg.assetsDebtsTitle,
    formCode: cfg.assetsDebtsCode,
    actionType: 'Sign & Serve',
    whoSigns: 'You (Served on Spouse)',
    priority: 'Required',
    reasonIncluded: `Required to inventory all marital and separate property in ${state}.`,
    description: 'Lists every bank account, vehicle, real estate property, investment, credit card, and loan, noting whether each is community/marital or separate property.',
    officialLink: cfg.selfHelpBase,
    ...courtFormPdfMeta('assetsDebts')
  });

  items.push({
    id: 'doc-service-disclosure',
    stage: 'stage_2_disclosures',
    title: cfg.serviceDisclosureTitle,
    formCode: cfg.serviceDisclosureCode,
    actionType: 'Fill & File',
    whoSigns: 'You (Filed with Court)',
    priority: 'Required',
    reasonIncluded: 'Proves to the court that you completed mandatory financial disclosures.',
    description: 'Filed with the court clerk to confirm you served your Preliminary Declaration of Disclosure on your spouse.',
    officialLink: cfg.selfHelpBase,
    ...courtFormPdfMeta('serviceDisclosure')
  });

  items.push({
    id: 'doc-tax-returns',
    stage: 'stage_2_disclosures',
    title: 'Last 2–3 Years of Tax Returns (Form 1040 + Schedules)',
    formCode: 'IRS Form 1040',
    actionType: 'Gather & Upload',
    whoSigns: 'No Signature (Supporting Doc)',
    priority: 'Required',
    reasonIncluded: hiddenAssetRisk
      ? 'Critical for your profile: Schedule B & Schedule D often reveal undisclosed bank or brokerage accounts.'
      : 'Mandatory supporting attachment for financial disclosures.',
    description: 'Gather your filed federal & state returns including W-2s, 1099s, and Schedule B (interest/dividends) to verify all household income and accounts.',
    officialLink: 'https://www.irs.gov/forms-pubs/about-form-1040',
    pdfUrl: 'https://www.irs.gov/pub/irs-pdf/f1040.pdf',
    pdfAvailability: 'official_pdf'
  });

  items.push({
    id: 'doc-bank-statements',
    stage: 'stage_2_disclosures',
    title: 'Bank, Credit Card & Loan Statements (6–12 Months)',
    formCode: 'Statements',
    actionType: 'Gather & Upload',
    whoSigns: 'No Signature (Supporting Doc)',
    priority: 'Required',
    reasonIncluded: 'Establishes account balances as of the Date of Separation and tracks marital spending.',
    description: 'Collect statements for all checking, savings, and credit accounts to verify balances and spot unusual pre-separation transfers.',
    officialLink: cfg.selfHelpBase,
    pdfUrl: null,
    pdfAvailability: 'personal_or_custom'
  });

  if (ownsHome) {
    items.push({
      id: 'doc-real-estate-packet',
      stage: 'stage_2_disclosures',
      title: 'Marital Home Deed, Mortgage Statement & Valuation Packet',
      formCode: 'Deed / Mortgage',
      actionType: 'Gather & Upload',
      whoSigns: 'No Signature (Supporting Doc)',
      priority: 'Situation-Specific',
      reasonIncluded: 'Included because your profile indicates homeownership / keeping the marital home.',
      description: 'Includes Grant Deed, current mortgage/HELOC payoff statement, closing disclosure (if pre-marital down payment reimbursement applies), and market appraisal.',
      officialLink: cfg.selfHelpBase,
      pdfUrl: null,
      pdfAvailability: 'personal_or_custom'
    });
  }

  if (hasRetirement) {
    items.push({
      id: 'doc-retirement-statements',
      stage: 'stage_2_disclosures',
      title: '401(k), IRA & Pension Statements + Plan Summaries',
      formCode: 'Retirement / SPD',
      actionType: 'Gather & Upload',
      whoSigns: 'No Signature (Supporting Doc)',
      priority: 'Situation-Specific',
      reasonIncluded: 'Included because you have retirement accounts or selected retirement division as a priority.',
      description: 'Collect quarterly statements and Summary Plan Descriptions (SPD) for all employer 401(k)s, IRAs, and pensions earned during marriage.',
      officialLink: cfg.selfHelpBase,
      pdfUrl: null,
      pdfAvailability: 'personal_or_custom'
    });
  }

  if (hasPrenup === 'yes' || hasPrenup === 'unsure') {
    items.push({
      id: 'doc-prenup-review',
      stage: 'stage_2_disclosures',
      title: 'Prenuptial / Postnuptial Agreement & Disclosure Verification',
      formCode: 'Prenup / UPAA',
      actionType: 'Gather & Upload',
      whoSigns: 'Already Signed (Attorney Review)',
      priority: 'Situation-Specific',
      reasonIncluded: hasPrenup === 'yes'
        ? 'Included because you indicated a prenuptial or postnuptial agreement exists.'
        : 'Included because you are unsure whether a marital agreement was signed.',
      description: 'Locate the signed agreement and any attached financial disclosures to verify enforceability (e.g., independent legal counsel and 7-day review rules).',
      officialLink: cfg.selfHelpBase,
      pdfUrl: null,
      pdfAvailability: 'personal_or_custom'
    });
  }

  // =========================================================
  // STAGE 3: TEMPORARY ORDERS & DISCOVERY
  // =========================================================
  if (divorcePathway === 'contested_or_uncooperative' || hiddenAssetRisk) {
    items.push({
      id: 'doc-formal-discovery',
      stage: 'stage_3_discovery_orders',
      title: cfg.interrogatoriesTitle,
      formCode: cfg.interrogatoriesCode,
      actionType: 'Sign & Serve',
      whoSigns: 'You / Attorney',
      priority: 'Situation-Specific',
      reasonIncluded: hiddenAssetRisk
        ? 'Included because your spouse managed finances or you flagged potential hidden accounts.'
        : 'Included because your divorce pathway is contested or uncooperative.',
      description: 'Formal legal demands compelling your spouse to answer written questions under oath and produce missing tax returns, bank records, or business statements.',
      officialLink: cfg.selfHelpBase,
      ...courtFormPdfMeta('interrogatories')
    });
  }

  if (divorcePathway === 'contested_or_uncooperative' || profile?.financialRole === 'spouse_handled_all') {
    items.push({
      id: 'doc-rfo-temp',
      stage: 'stage_3_discovery_orders',
      title: cfg.rfoTitle,
      formCode: cfg.rfoCode,
      actionType: 'Fill & File',
      whoSigns: 'You (Petitioner)',
      priority: 'Situation-Specific',
      reasonIncluded: 'Helps secure temporary spousal/child support, custody, or attorney fee contributions while the divorce is pending.',
      description: 'Requests a court hearing for temporary orders so you have financial stability and clear custody rules during the months before final judgment.',
      officialLink: cfg.selfHelpBase,
      ...courtFormPdfMeta('rfo')
    });
  }

  if (needsSpousalSupport) {
    items.push({
      id: 'doc-spousal-support',
      stage: 'stage_3_discovery_orders',
      title: cfg.spousalSupportTitle,
      formCode: cfg.spousalSupportCode,
      actionType: 'Fill & File',
      whoSigns: 'You (Petitioner)',
      priority: 'Situation-Specific',
      reasonIncluded: marriageYears >= 10
        ? `Included because your ${marriageYears}-year marriage crosses the 10-year long-duration threshold.`
        : 'Included because securing spousal support is one of your top priorities.',
      description: 'Documents marital standard of living, career sacrifices/caregiving duties, earning capacity, and statutory support factors.',
      officialLink: cfg.selfHelpBase,
      ...courtFormPdfMeta('spousalSupport')
    });
  }

  if (hasChildren) {
    items.push({
      id: 'doc-child-support',
      stage: 'stage_3_discovery_orders',
      title: cfg.childSupportTitle,
      formCode: cfg.childSupportCode,
      actionType: 'Fill & File',
      whoSigns: 'Both Spouses / Judge',
      priority: 'Required',
      reasonIncluded: `Required because you have ${childrenCount || 'minor'} child(ren).`,
      description: 'Calculates guideline child support based on each parent’s income, tax filing status, and parenting timeshare percentage.',
      officialLink: cfg.selfHelpBase,
      ...courtFormPdfMeta('childSupport')
    });
  }

  // =========================================================
  // STAGE 4: SETTLEMENT AGREEMENT OR TRIAL PREP
  // =========================================================
  if (divorcePathway === 'amicable_uncontested' || divorcePathway === 'unsure') {
    items.push({
      id: 'doc-uncontested-stip',
      stage: 'stage_4_settlement_trial',
      title: cfg.uncontestedTitle,
      formCode: cfg.uncontestedCode,
      actionType: 'Sign & Serve',
      whoSigns: 'Both Spouses',
      priority: divorcePathway === 'amicable_uncontested' ? 'Required' : 'Recommended',
      reasonIncluded: 'Used when spouses reach an agreement to finalize the divorce without a trial.',
      description: 'Confirms both parties waive a contested trial and submit their written settlement agreement for judge approval.',
      officialLink: cfg.selfHelpBase,
      ...courtFormPdfMeta('uncontested')
    });
  }

  items.push({
    id: 'doc-msa',
    stage: 'stage_4_settlement_trial',
    title: 'Marital Settlement Agreement (MSA) / Stipulated Judgment',
    formCode: 'MSA',
    actionType: 'Notarize & Record',
    whoSigns: 'Both Spouses (Notarized)',
    priority: 'Required',
    reasonIncluded: 'Master contract governing how all assets, debts, support, and custody are divided.',
    description: 'Comprehensive signed agreement attached to your final judgment. Even contested cases usually settle via an MSA before trial.',
    officialLink: cfg.selfHelpBase,
    pdfUrl: null,
    pdfAvailability: 'personal_or_custom'
  });

  if (divorcePathway === 'contested_or_uncooperative') {
    items.push({
      id: 'doc-trial-brief',
      stage: 'stage_4_settlement_trial',
      title: 'Trial Brief, Witness List & Exhibit Binder',
      formCode: 'Trial Prep',
      actionType: 'Fill & File',
      whoSigns: 'You / Attorney',
      priority: 'Situation-Specific',
      reasonIncluded: 'Included because your divorce is contested and may require a court trial.',
      description: 'Summarizes disputed issues (property valuation, hidden assets, support) and organizes financial exhibits for the judge.',
      officialLink: cfg.selfHelpBase,
      pdfUrl: null,
      pdfAvailability: 'personal_or_custom'
    });
  }

  items.push({
    id: 'doc-final-disclosure',
    stage: 'stage_4_settlement_trial',
    title: 'Final Declaration of Disclosure (or Mutual Waiver)',
    formCode: state === 'California' ? 'FL-140 / FL-144' : 'Final Disclosure',
    actionType: 'Sign & Serve',
    whoSigns: 'Both Spouses',
    priority: 'Required',
    reasonIncluded: 'Required before the court can enter a final divorce judgment.',
    description: 'Either exchange updated final financial disclosures before settlement/trial, or sign a mutual waiver if both parties agree.',
    officialLink: cfg.selfHelpBase,
    ...courtFormPdfMeta('finalDisclosure')
  });

  // =========================================================
  // STAGE 5: FINAL JUDGMENT & POST-DIVORCE EXECUTION
  // =========================================================
  items.push({
    id: 'doc-final-judgment',
    stage: 'stage_5_judgment_post',
    title: cfg.judgmentTitle,
    formCode: cfg.judgmentCode,
    actionType: 'Judge Signature',
    whoSigns: 'Judge Signs',
    priority: 'Required',
    reasonIncluded: `Official court order that legally terminates your marriage in ${state}.`,
    description: 'Submitted to the court clerk with your Marital Settlement Agreement or trial orders for the judge’s final signature.',
    officialLink: cfg.selfHelpBase,
    ...courtFormPdfMeta('judgment')
  });

  items.push({
    id: 'doc-notice-entry-judgment',
    stage: 'stage_5_judgment_post',
    title: cfg.noticeJudgmentTitle,
    formCode: cfg.noticeJudgmentCode,
    actionType: 'Fill & File',
    whoSigns: 'Court Clerk Mails',
    priority: 'Required',
    reasonIncluded: 'Provides the official date your marital status legally ends.',
    description: 'Submit with stamped envelopes addressed to both spouses so the court can mail the signed notice of your divorce effective date.',
    officialLink: cfg.selfHelpBase,
    ...courtFormPdfMeta('noticeJudgment')
  });

  if (hasRetirement) {
    items.push({
      id: 'doc-qdro',
      stage: 'stage_5_judgment_post',
      title: 'Qualified Domestic Relations Order (QDRO)',
      formCode: 'QDRO',
      actionType: 'Attorney / Plan Admin',
      whoSigns: 'Both Spouses, Judge & Plan Admin',
      priority: 'Situation-Specific',
      reasonIncluded: 'Required to divide 401(k) or pension accounts without early-withdrawal taxes or penalties.',
      description: 'Separate specialized court order directing the retirement plan administrator how to split marital retirement funds into your own account.',
      officialLink: cfg.selfHelpBase,
      pdfUrl: null,
      pdfAvailability: 'personal_or_custom'
    });
  }

  if (ownsHome) {
    items.push({
      id: 'doc-title-deed',
      stage: 'stage_5_judgment_post',
      title: 'Interspousal Transfer / Quitclaim Deed & Mortgage Refinance',
      formCode: 'Deed / Refi',
      actionType: 'Notarize & Record',
      whoSigns: 'Transferring Spouse (Notarized)',
      priority: 'Situation-Specific',
      reasonIncluded: 'Required to transfer home title or remove a spouse from the mortgage after divorce.',
      description: 'Notarized deed recorded with the County Recorder to update property ownership per your settlement agreement.',
      officialLink: cfg.selfHelpBase,
      pdfUrl: null,
      pdfAvailability: 'personal_or_custom'
    });
  }

  if (hasChildren || needsSpousalSupport) {
    items.push({
      id: 'doc-iwo',
      stage: 'stage_5_judgment_post',
      title: cfg.iwoTitle,
      formCode: cfg.iwoCode,
      actionType: 'Fill & File',
      whoSigns: 'Judge Signs (Served on Employer)',
      priority: 'Situation-Specific',
      reasonIncluded: hasChildren
        ? 'Ensures court-ordered child/spousal support is paid reliably via payroll.'
        : 'Ensures court-ordered spousal support is paid reliably via payroll.',
      description: 'Order directing the paying spouse’s employer to withhold support directly from their paycheck.',
      officialLink: cfg.selfHelpBase,
      ...courtFormPdfMeta('iwo')
    });
  }

  items.push({
    id: 'doc-post-divorce-updates',
    stage: 'stage_5_judgment_post',
    title: 'Post-Divorce Beneficiary, Insurance & Credit Separation Checklist',
    formCode: 'Post-Decree',
    actionType: 'Gather & Upload',
    whoSigns: 'You (Account Holder)',
    priority: 'Recommended',
    reasonIncluded: 'Protects your post-divorce financial independence once the decree is signed.',
    description: 'Update life insurance beneficiaries, health insurance (COBRA/marketplace within 60 days), bank account titles, credit cards, and estate plan.',
    officialLink: cfg.selfHelpBase,
    pdfUrl: null,
    pdfAvailability: 'personal_or_custom'
  });

  return items;
}

function generateDivorceChecklist(profile, savedProgress = {}) {
  const goal = profile?.goal || 'pursuing_divorce';
  const isPursuingDivorce = goal === 'pursuing_divorce' || goal === 'legal_separation';

  const rawItems = buildChecklistItems(profile || {});

  const items = rawItems.map((item) => {
    const saved = savedProgress[item.id] || {};
    const status = saved.status || 'not_started';
    const filledRequiredCount = Number(saved.filledRequiredCount || 0);
    const totalRequiredCount = Number(saved.totalRequiredCount || 0);
    const fieldCompletionPercent = Number(saved.fieldCompletionPercent || 0);

    let itemProgressPercent = 0;
    if (status === 'completed') {
      itemProgressPercent = 100;
    } else if (status === 'signed_ready') {
      itemProgressPercent = Math.max(85, fieldCompletionPercent || 85);
    } else if (status === 'in_progress') {
      itemProgressPercent = fieldCompletionPercent > 0 ? fieldCompletionPercent : 15;
    }

    return {
      ...item,
      status,
      notes: saved.notes || '',
      openedAt: saved.openedAt || null,
      completedExternally: Boolean(saved.completedExternally),
      filledRequiredCount,
      totalRequiredCount,
      fieldCompletionPercent,
      itemProgressPercent,
      uploadedFile: saved.uploadedFile || null,
      updatedAt: saved.updatedAt || null
    };
  });

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const signedReadyCount = items.filter((i) => i.status === 'signed_ready').length;
  const inProgressCount = items.filter((i) => i.status === 'in_progress').length;
  const notStartedCount = items.filter((i) => i.status === 'not_started').length;
  const percentComplete =
    totalCount > 0
      ? Math.round(items.reduce((sum, i) => sum + i.itemProgressPercent, 0) / totalCount)
      : 0;

  const stages = CHECKLIST_STAGES.map((stage) => {
    const stageItems = items.filter((i) => i.stage === stage.id);
    const stageCompleted = stageItems.filter((i) => i.status === 'completed').length;
    return {
      ...stage,
      items: stageItems,
      totalCount: stageItems.length,
      completedCount: stageCompleted
    };
  }).filter((s) => s.items.length > 0);

  // Human-readable tags explaining why the checklist looks the way it does
  const situationTags = [];
  situationTags.push(profile?.stateJurisdiction || 'California');
  if (goal === 'legal_separation') {
    situationTags.push('Legal Separation');
  } else if (goal === 'pursuing_divorce') {
    situationTags.push('Pursuing Divorce');
  } else {
    situationTags.push('Exploring Options');
  }
  if (profile?.marriageLengthYears) {
    situationTags.push(`${profile.marriageLengthYears}-Year Marriage`);
  }
  if (profile?.hasChildren || Number(profile?.childrenCount || 0) > 0) {
    situationTags.push(`${profile?.childrenCount || 1} Child(ren)`);
  }
  if (profile?.divorcePathway === 'amicable_uncontested') {
    situationTags.push('Uncontested / Amicable');
  } else if (profile?.divorcePathway === 'contested_or_uncooperative') {
    situationTags.push('Contested / Discovery');
  }
  if (profile?.hasPrenup === 'yes') {
    situationTags.push('Prenup');
  } else if (profile?.hasPrenup === 'unsure') {
    situationTags.push('Prenup Unsure');
  }
  if (profile?.ownsHome || (profile?.primaryConcerns || []).includes('keeping_marital_home')) {
    situationTags.push('Marital Home');
  }
  if (profile?.hasRetirementAccounts || (profile?.primaryConcerns || []).includes('protecting_retirement_share')) {
    situationTags.push('Retirement / QDRO');
  }
  if (profile?.fearOfHiddenAssets || profile?.financialRole === 'spouse_handled_all') {
    situationTags.push('Hidden Asset Discovery');
  }
  if (profile?.needsFeeWaiver) {
    situationTags.push('Fee Waiver');
  }
  if (profile?.needsProtectiveOrder) {
    situationTags.push('Protective Order');
  }

  return {
    isPursuingDivorce,
    goal,
    stateJurisdiction: profile?.stateJurisdiction || 'California',
    situationTags,
    summary: {
      totalCount,
      completedCount,
      signedReadyCount,
      inProgressCount,
      notStartedCount,
      percentComplete
    },
    stages,
    items
  };
}

module.exports = {
  CHECKLIST_STAGES,
  generateDivorceChecklist
};
