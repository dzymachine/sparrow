/**
 * Guided Document Form Schemas
 * Provides field definitions, "Where to find this" helpers, and smart default answers
 * pre-populated from the user's onboarding profile & discovered assets.
 */

function formatCurrency(num) {
  if (num === undefined || num === null || Number.isNaN(Number(num))) return '';
  return String(Math.round(Number(num)));
}

function buildBasePartySection(profile, state) {
  const displayName = profile?.displayName || '';
  return {
    id: 'party_info',
    title: '1. Court & Party Information',
    description: 'Basic identifying details for the court caption. Leave Case Number blank if this is your very first filing.',
    fields: [
      {
        key: 'petitionerName',
        label: 'Your Full Legal Name (Petitioner)',
        type: 'text',
        required: true,
        defaultValue: displayName,
        defaultHint: 'Use your full legal name exactly as it appears on your driver’s license or marriage certificate.',
        whereToFind: 'Check your driver’s license, passport, or Social Security card.',
        placeholder: 'e.g., Sarah Marie Johnson'
      },
      {
        key: 'respondentName',
        label: 'Spouse’s Full Legal Name (Respondent)',
        type: 'text',
        required: true,
        defaultValue: '',
        whereToFind: 'Check your marriage certificate or joint Form 1040 tax return.',
        placeholder: 'e.g., David Michael Johnson'
      },
      {
        key: 'county',
        label: `County & Superior Court (${state})`,
        type: 'text',
        required: true,
        defaultValue: state === 'California' ? 'San Diego County Superior Court' : `${state} Family Court`,
        defaultHint: 'File in the county where you or your spouse have lived for at least the last 3 months.',
        whereToFind: 'Use the county of your primary residence.',
        placeholder: 'e.g., San Diego County Superior Court'
      },
      {
        key: 'caseNumber',
        label: 'Court Case Number',
        type: 'text',
        required: false,
        defaultValue: '',
        defaultHint: 'Leave blank if you are filing the initial Petition—the court clerk assigns this when stamped.',
        whereToFind: 'Found at the top-right corner of any previously filed court papers.',
        placeholder: 'Leave blank for initial filing'
      }
    ]
  };
}

function buildSignatureSection(docItem) {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: 'signature_block',
    title: 'Signature & Verification',
    description: `Sign below to certify your entries. (${docItem.whoSigns || 'You'})`,
    fields: [
      {
        key: 'signatureName',
        label: 'Typed Electronic Signature',
        type: 'text',
        required: true,
        defaultValue: '',
        whereToFind: 'Type your full legal name to adopt it as your electronic signature.',
        placeholder: 'Type your full legal name'
      },
      {
        key: 'signatureDate',
        label: 'Date Signed',
        type: 'date',
        required: true,
        defaultValue: today,
        defaultHint: `Today’s date (${today}).`,
        whereToFind: 'Enter the date you are completing and signing this document.'
      },
      {
        key: 'perjuryConfirmed',
        label: 'I declare under penalty of perjury that the information entered is true and correct to the best of my knowledge.',
        type: 'checkbox',
        required: true,
        defaultValue: true,
        whereToFind: 'Required by family courts before submitting signed forms.'
      }
    ]
  };
}

function getGuidedFormSchema(docItem, profile = {}, agentMemory = {}) {
  const state = profile?.stateJurisdiction || 'California';
  const assets = Array.isArray(agentMemory?.discoveredAssets) ? agentMemory.discoveredAssets : [];
  const homeAsset = assets.find((a) => /real estate|home|residence/i.test(a.type || a.name || ''));
  const retirementAsset = assets.find((a) => /401|retirement|ira|pension/i.test(a.type || a.name || ''));
  const hasChildren = Boolean(profile?.hasChildren) || Number(profile?.childrenCount || 0) > 0;
  const childrenCount = Number(profile?.childrenCount || 0);
  const marriageYears = Number(profile?.marriageLengthYears || 0);

  const sections = [buildBasePartySection(profile, state)];

  switch (docItem.id) {
    case 'doc-petition':
    case 'doc-summary-dissolution': {
      sections.push({
        id: 'marriage_residency',
        title: '2. Marriage & Residency Facts',
        description: 'Confirms you meet state residency rules and records key marriage dates.',
        fields: [
          {
            key: 'dateOfMarriage',
            label: 'Date of Marriage',
            type: 'date',
            required: true,
            defaultValue: '',
            whereToFind: 'Found on your certified Marriage Certificate (or wedding records).',
          },
          {
            key: 'dateOfSeparation',
            label: 'Date of Separation',
            type: 'date',
            required: true,
            defaultValue: new Date().toISOString().split('T')[0],
            defaultHint: 'The date either spouse decided the marriage was over and acted consistently with that decision (can be today if just starting).',
            whereToFind: 'Use the date you moved apart or clearly communicated the intent to end the marriage.'
          },
          {
            key: 'residencyConfirmed',
            label: `I (or my spouse) have lived in ${state} for at least 6 months and this county for at least 3 months.`,
            type: 'checkbox',
            required: true,
            defaultValue: true,
            defaultHint: 'Required to establish divorce jurisdiction in most states (e.g. CA Fam. Code § 2320).',
            whereToFind: 'Verify using your lease, mortgage statement, or utility bills.'
          },
          {
            key: 'groundsForDivorce',
            label: 'Legal Grounds for Divorce',
            type: 'select',
            required: true,
            options: [
              'Irreconcilable differences (no-fault standard)',
              'Incurable insanity'
            ],
            defaultValue: 'Irreconcilable differences (no-fault standard)',
            defaultHint: 'Almost every California/no-fault divorce uses "Irreconcilable differences"—no proof of fault is needed.',
            whereToFind: 'Standard no-fault option; select "Irreconcilable differences" unless advised otherwise by an attorney.'
          }
        ]
      });

      sections.push({
        id: 'requests',
        title: '3. What You Are Asking the Court For',
        description: 'Check the boxes you want the court to preserve jurisdiction over (you can refine exact numbers later).',
        fields: [
          {
            key: 'requestSpousalSupport',
            label: 'Spousal Support (Alimony) Request',
            type: 'select',
            required: true,
            options: [
              'Payable to Petitioner (Me)',
              'Reserve court jurisdiction for future determination',
              'Terminate court ability to award support'
            ],
            defaultValue: marriageYears >= 10 || (profile?.primaryConcerns || []).includes('securing_spousal_support')
              ? 'Payable to Petitioner (Me)'
              : 'Reserve court jurisdiction for future determination',
            defaultHint: 'Never waive spousal support on the initial Petition unless you are 100% certain—requesting or reserving keeps your rights open.',
            whereToFind: 'Based on your marriage length and income difference.'
          },
          {
            key: 'propertySummary',
            label: 'Community / Marital Property to Divide',
            type: 'textarea',
            required: false,
            defaultValue: assets.map((a) => `${a.name} (Est. $${Number(a.estimatedValue || 0).toLocaleString()})`).join('; '),
            defaultHint: 'You can write "All community/marital assets and debts to be determined in mandatory disclosures" if you do not have full account numbers yet.',
            whereToFind: 'Pre-filled from your Discovered Marital Footprint, or use Form 1040 / bank statements.',
            placeholder: 'e.g., Primary Residence, Spouse 401(k), Joint Checking...'
          }
        ]
      });
      break;
    }

    case 'doc-income-expense': {
      sections.push({
        id: 'income_details',
        title: '2. Monthly Income & Deductions',
        description: 'Courts use your gross monthly income and taxes to calculate support.',
        fields: [
          {
            key: 'employerName',
            label: 'Current Employer / Occupation',
            type: 'text',
            required: false,
            defaultValue: profile?.employmentStatus === 'part_time_caregiver' ? 'Part-time / Primary Caregiver' : '',
            whereToFind: 'Found on your most recent pay stub or W-2 (Box c).'
          },
          {
            key: 'grossMonthlyIncome',
            label: 'Average Gross Monthly Income ($)',
            type: 'currency',
            required: true,
            defaultValue: '0',
            defaultHint: 'Enter 0 if currently a full-time stay-at-home parent or caregiver.',
            whereToFind: 'Look at "Gross Pay" on your last 2 pay stubs and multiply bi-weekly pay by 2.167 (or divide annual salary by 12).'
          },
          {
            key: 'spouseEstMonthlyIncome',
            label: 'Spouse’s Estimated Gross Monthly Income ($)',
            type: 'currency',
            required: false,
            defaultValue: profile?.estimatedHouseholdIncome === '$180,000+' ? '15000' : '',
            whereToFind: 'Check Line 1z / Line 9 of your most recent joint Form 1040 tax return and divide by 12.'
          },
          {
            key: 'monthlyHousingExpense',
            label: 'Monthly Rent or Mortgage Payment ($)',
            type: 'currency',
            required: true,
            defaultValue: homeAsset?.monthlyPayment ? String(homeAsset.monthlyPayment) : '',
            whereToFind: 'Check your monthly mortgage statement or lease agreement.'
          },
          {
            key: 'monthlyChildcareHealth',
            label: 'Monthly Childcare & Health Insurance ($)',
            type: 'currency',
            required: false,
            defaultValue: '0',
            whereToFind: 'Check daycare/after-school invoices and payroll health deduction lines.'
          }
        ]
      });
      break;
    }

    case 'doc-assets-debts':
    case 'doc-disclosure-decl': {
      sections.push({
        id: 'assets_inventory',
        title: '2. Assets & Debts Inventory',
        description: 'List every asset and debt you know about—even if your spouse controls the account.',
        fields: [
          {
            key: 'realEstateList',
            label: 'Real Estate (Address, Est. Value & Mortgage Balance)',
            type: 'textarea',
            required: false,
            defaultValue: homeAsset
              ? `${homeAsset.name} — Est. Value $${Number(homeAsset.estimatedValue || 0).toLocaleString()}, Mortgage $${Number(homeAsset.mortgageRemaining || 0).toLocaleString()}`
              : 'None',
            whereToFind: 'Check your County Assessor tax bill, mortgage statement, or Zillow/Redfin estimate.'
          },
          {
            key: 'retirementList',
            label: 'Retirement Accounts (401k, IRA, Pensions)',
            type: 'textarea',
            required: false,
            defaultValue: retirementAsset
              ? `${retirementAsset.name} — Est. $${Number(retirementAsset.estimatedValue || 0).toLocaleString()} (Subject to QDRO)`
              : '',
            whereToFind: 'Check quarterly 401(k)/IRA statements or your spouse’s W-2 Box 12 (Code D/AA).'
          },
          {
            key: 'bankAndBrokerageList',
            label: 'Bank, Brokerage & Potential Undisclosed Accounts',
            type: 'textarea',
            required: false,
            defaultValue: assets
              .filter((a) => !/real estate|home|401|retirement/i.test(a.type || ''))
              .map((a) => `${a.name}: $${Number(a.estimatedValue || 0).toLocaleString()} (${a.sourceDocument || 'Reported'})`)
              .join('\n'),
            defaultHint: 'If your spouse withheld statements, write "Account at [Bank Name] — exact balance unknown, pending spouse disclosure."',
            whereToFind: 'Check Form 1040 Schedule B (lists every bank/brokerage paying >$10 interest or dividends).'
          },
          {
            key: 'debtsList',
            label: 'Marital Debts (Credit Cards, Auto Loans, Tax Debt)',
            type: 'textarea',
            required: false,
            defaultValue: '',
            whereToFind: 'Pull a free credit report at AnnualCreditReport.com and check monthly loan statements.'
          }
        ]
      });
      break;
    }

    case 'doc-uccjea':
    case 'doc-custody-app':
    case 'doc-child-support': {
      sections.push({
        id: 'children_info',
        title: '2. Children & Parenting Schedule',
        description: 'Required details for custody jurisdiction and parenting time.',
        fields: [
          {
            key: 'childrenNamesAndAges',
            label: `Minor Children’s Names & Birthdates (${childrenCount || 1} child(ren))`,
            type: 'textarea',
            required: true,
            defaultValue: '',
            whereToFind: 'Check birth certificates or Dependent section of Form 1040.'
          },
          {
            key: 'fiveYearAddresses',
            label: 'Where the Children Lived Over the Past 5 Years',
            type: 'textarea',
            required: true,
            defaultValue: `Same family residence in ${state} for the past 5 years (with both parents).`,
            defaultHint: 'If the children have not moved in 5 years, you only need to list your current address and dates.',
            whereToFind: 'Check old leases, utility bills, or school enrollment records.'
          },
          {
            key: 'proposedCustody',
            label: 'Proposed Legal & Physical Custody',
            type: 'select',
            required: true,
            options: [
              'Joint Legal Custody / Primary Physical Custody with Me',
              'Joint Legal & Joint 50/50 Physical Custody',
              'Sole Legal & Sole Physical Custody with Me'
            ],
            defaultValue: 'Joint Legal Custody / Primary Physical Custody with Me',
            whereToFind: 'Choose the arrangement that reflects who currently handles daily school/medical care.'
          }
        ]
      });
      break;
    }

    case 'doc-fee-waiver': {
      sections.push({
        id: 'fee_waiver_eligibility',
        title: '2. Fee Waiver Eligibility',
        description: 'Courts waive filing fees if you receive public benefits or have limited household income.',
        fields: [
          {
            key: 'publicBenefits',
            label: 'Do you receive Medi-Cal, CalFresh/SNAP, SSI, TANF, or WIC?',
            type: 'select',
            required: true,
            options: [
              'No — applying based on low monthly income / hardship',
              'Yes — I receive qualifying public benefits'
            ],
            defaultValue: 'No — applying based on low monthly income / hardship',
            whereToFind: 'Check any current benefit award letters.'
          },
          {
            key: 'monthlyTakeHome',
            label: 'Your Current Monthly Take-Home Income ($)',
            type: 'currency',
            required: true,
            defaultValue: '0',
            whereToFind: 'List only income you personally have access to right now.'
          },
          {
            key: 'householdSize',
            label: 'Number of People in Your Household (You + Dependents)',
            type: 'number',
            required: true,
            defaultValue: String(1 + (hasChildren ? childrenCount || 1 : 0)),
            whereToFind: 'Count yourself and any children you support.'
          }
        ]
      });
      break;
    }

    default: {
      sections.push({
        id: 'document_specifics',
        title: '2. Document Details & Declarations',
        description: docItem.description || 'Complete the key information needed for this step.',
        fields: [
          {
            key: 'keyFactsSummary',
            label: `Key Information / Statement for ${docItem.formCode}`,
            type: 'textarea',
            required: true,
            defaultValue: docItem.reasonIncluded || '',
            defaultHint: 'Summarize the specific facts, dates, or requests relevant to this form.',
            whereToFind: docItem.description || 'Refer to your financial discovery summary and onboarding profile.'
          },
          {
            key: 'supportingAttachments',
            label: 'Supporting Documents Attached or Referenced',
            type: 'text',
            required: false,
            defaultValue: assets.length > 0 ? '2024 Form 1040, Discovered Asset Summary' : '',
            whereToFind: 'List any pay stubs, tax returns, or statements you are attaching.'
          }
        ]
      });
      break;
    }
  }

  sections.push(buildSignatureSection(docItem));

  return {
    docId: docItem.id,
    title: docItem.title,
    formCode: docItem.formCode,
    actionType: docItem.actionType,
    whoSigns: docItem.whoSigns,
    officialPdfUrl: docItem.pdfUrl || null,
    officialLink: docItem.officialLink || null,
    sections
  };
}

function buildDefaultValues(schema) {
  const defaults = {};
  for (const section of schema.sections || []) {
    for (const field of section.fields || []) {
      if (field.defaultValue !== undefined) {
        defaults[field.key] = field.defaultValue;
      } else {
        defaults[field.key] = field.type === 'checkbox' ? false : '';
      }
    }
  }
  return defaults;
}

module.exports = {
  getGuidedFormSchema,
  buildDefaultValues
};
