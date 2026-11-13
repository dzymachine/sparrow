const wikiStore = require('../store/wikiStore');
const memoryStore = require('../store/memoryStore');

function formatCurrency(val) {
  const num = Number(val);
  if (!Number.isFinite(num)) return '$0';
  return `$${Math.round(num).toLocaleString()}`;
}

/**
 * Converts an ExtractedDiscoveryDocument into structured LLM Wiki facts
 * across canonical wikiStore sections, and syncs discovered assets, income,
 * and expenses into memoryStore so the Projection Engine benefits immediately.
 */
async function syncDiscoveredDocumentToProfile(userId, doc) {
  if (!userId || !doc) {
    return { synced: false, addedCount: 0, addedFacts: [] };
  }

  const sourceLabel = doc.fileName || doc.documentClassification?.documentType || 'Discovery Document';
  const extracted = doc.extractedData || {};

  const footprintFacts = [];
  const lawyerFacts = [];
  const profileFacts = [];
  const logFacts = [];

  // 1. Tax Return (Form 1040 + Schedule B)
  if (extracted.taxReturn) {
    const tr = extracted.taxReturn;
    const parts = [];
    if (tr.taxYear) parts.push(`${tr.taxYear} Form 1040`);
    if (tr.filingStatus) parts.push(`Filing Status: ${tr.filingStatus}`);
    if (Number.isFinite(Number(tr.adjustedGrossIncome))) {
      parts.push(`AGI: ${formatCurrency(tr.adjustedGrossIncome)}`);
    }
    if (Number.isFinite(Number(tr.userWages))) {
      parts.push(`User W-2: ${formatCurrency(tr.userWages)}`);
    }
    if (Number.isFinite(Number(tr.spouseWages))) {
      parts.push(`Spouse W-2: ${formatCurrency(tr.spouseWages)}`);
    }
    if (parts.length > 0) {
      footprintFacts.push({
        text: `Tax Return Summary — ${parts.join(' | ')}`,
        category: 'Tax Return',
        source: sourceLabel
      });
    }

    if (Array.isArray(tr.scheduleBPayers)) {
      for (const payer of tr.scheduleBPayers) {
        const flagNote = payer.potentialHiddenAccount ? ' [Potential Undisclosed Account]' : '';
        footprintFacts.push({
          text: `Schedule B ${payer.payerType || 'income'} payer: ${payer.payerName} (${formatCurrency(payer.amount)}/yr)${flagNote} — ${payer.discoveryReason || 'Reported on Form 1040 Schedule B'}`,
          category: payer.potentialHiddenAccount ? 'Tax Lead' : 'Investment Income',
          source: sourceLabel
        });
      }
    }
  }

  // 2. Retirement & Investment Accounts
  if (extracted.retirement) {
    const ret = extracted.retirement;
    const qdroNote = ret.requiresQDRO ? ' (Requires QDRO for division)' : '';
    const contribNote = ret.monthlyContribution ? `, ${formatCurrency(ret.monthlyContribution)}/mo contribution` : '';
    footprintFacts.push({
      text: `${ret.institution || 'Retirement'} ${ret.accountType || 'Account'} (${ret.accountOwner || 'Spouse'}): Balance ${formatCurrency(ret.currentBalance)}, Vested ${formatCurrency(ret.vestedBalance ?? ret.currentBalance)}${contribNote}${qdroNote}`,
      category: 'Retirement',
      source: sourceLabel
    });

    if (ret.requiresQDRO) {
      lawyerFacts.push({
        text: `QDRO required to divide ${ret.institution || ''} ${ret.accountType || 'retirement plan'} (${formatCurrency(ret.currentBalance)}) without early tax penalties`,
        category: 'QDRO',
        source: sourceLabel
      });
    }
  }

  // 3. Property & Mortgage / Lease
  if (extracted.property) {
    const prop = extracted.property;
    const monthlyTotal = prop.monthlyPayment?.total ?? 0;
    if (prop.isLease) {
      footprintFacts.push({
        text: `Residential Lease (${prop.propertyAddress || prop.lenderOrLandlord || 'Property'}): ${formatCurrency(monthlyTotal)}/mo rent`,
        category: 'Housing',
        source: sourceLabel
      });
    } else {
      footprintFacts.push({
        text: `Mortgage & Property (${prop.propertyAddress || prop.lenderOrLandlord || 'Primary Residence'}): Loan balance ${formatCurrency(prop.loanBalance)} at ${prop.interestRate || 0}% interest, monthly PITI ${formatCurrency(monthlyTotal)}, Co-borrower: ${prop.coBorrowerStatus || 'Unknown'}`,
        category: 'Real Estate',
        source: sourceLabel
      });
    }
  }

  // 4. Bank & Credit Card Statements
  if (extracted.bankOrCredit) {
    const bnk = extracted.bankOrCredit;
    footprintFacts.push({
      text: `${bnk.institution || 'Bank'} ${bnk.accountType || 'account'} (${bnk.accountOwner || 'Joint'}, ${bnk.accountNumberMasked || '••••'}): Ending balance ${formatCurrency(bnk.endingBalance)}, Monthly inflows ${formatCurrency(bnk.totalMonthlyInflows)}`,
      category: 'Banking',
      source: sourceLabel
    });

    if (Array.isArray(bnk.recurringExpenses) && bnk.recurringExpenses.length > 0) {
      const mustPaysTotal = bnk.recurringExpenses
        .filter((e) => e.bucket === 'bucket_a_must_pays')
        .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const lifeKidsTotal = bnk.recurringExpenses
        .filter((e) => e.bucket !== 'bucket_a_must_pays')
        .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

      footprintFacts.push({
        text: `Documented monthly baseline from ${bnk.institution || 'bank'} statement: ${formatCurrency(mustPaysTotal)} Must-Pays + ${formatCurrency(lifeKidsTotal)} Life & Kids (${bnk.recurringExpenses.length} recurring items)`,
        category: 'Monthly Baseline',
        source: sourceLabel
      });
    }

    if (Array.isArray(bnk.flaggedTransfersOrCharges)) {
      for (const fl of bnk.flaggedTransfersOrCharges) {
        footprintFacts.push({
          text: `Flagged transaction: ${fl.description} (${formatCurrency(fl.amount)}) — ${fl.flagReason}`,
          category: fl.potentialSeparateAccount ? 'Account Lead' : 'Flagged Expense',
          source: sourceLabel
        });
      }
    }
  }

  // 5. Marital Agreements & Support Stipulations
  if (extracted.maritalAgreement) {
    const ma = extracted.maritalAgreement;
    footprintFacts.push({
      text: `${ma.agreementType || 'Marital Agreement'}: Spousal support ${formatCurrency(ma.spousalSupportMonthly)}/mo, Child support ${formatCurrency(ma.childSupportMonthly)}/mo, Co-parenting split ${ma.coparentingSplitRatio || 'TBD'}`,
      category: 'Support & Agreement',
      source: sourceLabel
    });

    if (Array.isArray(ma.assetSplitDeadlines)) {
      for (const dl of ma.assetSplitDeadlines) {
        lawyerFacts.push({
          text: `Asset division deadline (${dl.asset}): ${dl.deadline} — ${dl.requirement}`,
          category: 'Legal Deadline',
          source: sourceLabel
        });
      }
    }

    if (Array.isArray(ma.beneficiaryRequirements)) {
      for (const ben of ma.beneficiaryRequirements) {
        lawyerFacts.push({
          text: `Beneficiary mandate (${ben.policyOrAccount}): ${ben.beneficiary} — ${ben.requirement}`,
          category: 'Beneficiary Mandate',
          source: sourceLabel
        });
      }
    }
  }

  // 6. Pay Stubs & Insurance Policies
  if (extracted.paystubOrInsurance) {
    const ps = extracted.paystubOrInsurance;
    const parts = [`Employer/Insurer: ${ps.employerOrInsurer || 'Unknown'}`];
    if (Number.isFinite(Number(ps.grossPay))) parts.push(`Gross ${formatCurrency(ps.grossPay)}`);
    if (Number.isFinite(Number(ps.netPay))) parts.push(`Net ${formatCurrency(ps.netPay)}`);
    if (Number.isFinite(Number(ps.insurancePremiumMonthly)) && ps.insurancePremiumMonthly > 0) {
      parts.push(`Health Premium ${formatCurrency(ps.insurancePremiumMonthly)}/mo`);
    }
    footprintFacts.push({
      text: `Pay Stub & Benefits (${ps.payPeriod || 'Current'}) — ${parts.join(' | ')}`,
      category: 'Income & Insurance',
      source: sourceLabel
    });

    if (Array.isArray(ps.policyBeneficiaries) && ps.policyBeneficiaries.length > 0) {
      lawyerFacts.push({
        text: `Insurance beneficiary record: ${ps.policyBeneficiaries.join('; ')}`,
        category: 'Beneficiary Mandate',
        source: sourceLabel
      });
    }
  }

  // 7. Explicit Unlisted Accounts
  if (Array.isArray(doc.unlistedAccounts)) {
    for (const unl of doc.unlistedAccounts) {
      footprintFacts.push({
        text: `Unlisted account lead: ${unl.institution} (Owner: ${unl.owner || 'Unverified'}, Est. ${formatCurrency(unl.estimatedBalance)}) — ${unl.note || unl.source || 'Needs formal disclosure'}`,
        category: 'Account Lead',
        source: unl.source || sourceLabel
      });
    }
  }

  // 8. Action Items -> Lawyer Readiness
  if (Array.isArray(doc.actionItems)) {
    for (const item of doc.actionItems) {
      lawyerFacts.push({
        text: `[${item.priority || 'High'}] ${item.action} — ${item.reason}`,
        category: 'Action Item',
        source: sourceLabel
      });
    }
  }

  // 9. Interaction Log Milestone
  if (doc.plainEnglishSummary) {
    logFacts.push({
      text: `Ingested ${doc.categoryLabel || 'Financial Document'} (${sourceLabel}): ${doc.plainEnglishSummary}`,
      category: 'Document Ingestion',
      source: sourceLabel
    });
  }

  // Persist to wikiStore (which syncs to Firebase Firestore & Storage + local disk)
  const addedFacts = [];
  let addedCount = 0;

  if (profileFacts.length > 0) {
    const r = await wikiStore.addFactsAsync(userId, 'profile', profileFacts);
    addedCount += r.addedCount;
    addedFacts.push(...r.addedFacts.map((f) => ({ ...f, section: 'profile' })));
  }
  if (footprintFacts.length > 0) {
    const r = await wikiStore.addFactsAsync(userId, 'financial_footprint', footprintFacts);
    addedCount += r.addedCount;
    addedFacts.push(...r.addedFacts.map((f) => ({ ...f, section: 'financial_footprint' })));
  }
  if (lawyerFacts.length > 0) {
    const r = await wikiStore.addFactsAsync(userId, 'lawyer_readiness', lawyerFacts);
    addedCount += r.addedCount;
    addedFacts.push(...r.addedFacts.map((f) => ({ ...f, section: 'lawyer_readiness' })));
  }
  if (logFacts.length > 0) {
    const r = await wikiStore.addFactsAsync(userId, 'interaction_log', logFacts);
    addedCount += r.addedCount;
    addedFacts.push(...r.addedFacts.map((f) => ({ ...f, section: 'interaction_log' })));
  }

  // Also sync structured assets & profile fields into memoryStore (and Firestore) for Projection Engine
  const existingMemory = await memoryStore.getAgentMemoryAsync(userId);
  const existingAssets = Array.isArray(existingMemory.discoveredAssets) ? [...existingMemory.discoveredAssets] : [];
  const existingQuestions = Array.isArray(existingMemory.keyQuestionsForLawyer) ? [...existingMemory.keyQuestionsForLawyer] : [];

  const upsertAsset = (newAsset) => {
    const idx = existingAssets.findIndex(
      (a) => a.name.toLowerCase() === newAsset.name.toLowerCase() && a.type.toLowerCase() === newAsset.type.toLowerCase()
    );
    if (idx >= 0) {
      existingAssets[idx] = { ...existingAssets[idx], ...newAsset };
    } else {
      existingAssets.push(newAsset);
    }
  };

  if (extracted.retirement) {
    const ret = extracted.retirement;
    upsertAsset({
      id: `ast_ret_${Date.now()}`,
      type: `Retirement (${ret.accountType || '401k'})`,
      name: `${ret.institution || 'Retirement'} ${ret.accountType || 'Plan'}`,
      estimatedValue: Number(ret.currentBalance) || 0,
      sourceDocument: sourceLabel,
      status: ret.requiresQDRO ? 'Subject to QDRO Division' : 'Verified'
    });
  }

  if (extracted.property && !extracted.property.isLease) {
    const prop = extracted.property;
    upsertAsset({
      id: `ast_prop_${Date.now()}`,
      type: 'Real Estate',
      name: prop.propertyAddress || prop.lenderOrLandlord || 'Primary Residence',
      estimatedValue: Number(prop.loanBalance) ? Math.round(Number(prop.loanBalance) * 1.6) : 0,
      mortgageRemaining: Number(prop.loanBalance) || 0,
      monthlyPayment: Number(prop.monthlyPayment?.total) || 0,
      sourceDocument: sourceLabel,
      status: 'Community Property - Valuation Required'
    });
  }

  if (extracted.bankOrCredit) {
    const bnk = extracted.bankOrCredit;
    upsertAsset({
      id: `ast_bnk_${Date.now()}`,
      type: bnk.accountType === 'credit_card' ? 'Debt / Credit Card' : 'Bank Account',
      name: `${bnk.institution || 'Bank'} ${bnk.accountType || 'checking'}`,
      estimatedValue: Number(bnk.endingBalance) || 0,
      sourceDocument: sourceLabel,
      status: 'Verified'
    });
  }

  if (Array.isArray(doc.unlistedAccounts)) {
    for (const unl of doc.unlistedAccounts) {
      upsertAsset({
        id: `ast_unl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'Potential Undisclosed Account',
        name: `${unl.institution} (${unl.source || 'Discovery Lead'})`,
        estimatedValue: Number(unl.estimatedBalance) || 0,
        sourceDocument: sourceLabel,
        status: 'Needs formal disclosure request',
        flag: unl.note || 'Discovered during document intelligence extraction'
      });
    }
  }

  if (Array.isArray(doc.actionItems)) {
    for (const item of doc.actionItems) {
      if (item.action && !existingQuestions.includes(item.action)) {
        existingQuestions.push(item.action);
      }
    }
  }

  const updatedMemory = await memoryStore.updateAgentMemoryAsync(userId, {
    discoveredAssets: existingAssets,
    keyQuestionsForLawyer: existingQuestions.slice(0, 12)
  });

  // Update structured user profile fields if extracted
  const profileUpdates = {};
  if (extracted.taxReturn) {
    if (Number.isFinite(Number(extracted.taxReturn.userWages)) && extracted.taxReturn.userWages >= 0) {
      profileUpdates.userGrossMonthlyIncome = Math.round(Number(extracted.taxReturn.userWages) / 12);
    }
    if (Number.isFinite(Number(extracted.taxReturn.spouseWages)) && extracted.taxReturn.spouseWages >= 0) {
      profileUpdates.spouseGrossMonthlyIncome = Math.round(Number(extracted.taxReturn.spouseWages) / 12);
    }
  }
  if (extracted.property && !extracted.property.isLease) {
    profileUpdates.ownsHome = true;
    if (Number.isFinite(Number(extracted.property.loanBalance))) {
      profileUpdates.mortgageRemainingOverride = Number(extracted.property.loanBalance);
    }
    if (Number.isFinite(Number(extracted.property.monthlyPayment?.total))) {
      profileUpdates.monthlyMortgageOverride = Number(extracted.property.monthlyPayment.total);
    }
  }
  if (extracted.bankOrCredit?.recurringExpenses?.length) {
    const totalExpenses = extracted.bankOrCredit.recurringExpenses.reduce(
      (acc, e) => acc + (Number(e.amount) || 0),
      0
    );
    if (totalExpenses > 0) {
      profileUpdates.monthlyLivingExpenses = Math.round(totalExpenses);
    }
  }
  if (extracted.paystubOrInsurance?.insurancePremiumMonthly) {
    profileUpdates.healthInsuranceMonthlyCost = Number(extracted.paystubOrInsurance.insurancePremiumMonthly);
  }

  let updatedProfile = await memoryStore.getUserProfileAsync(userId);
  if (Object.keys(profileUpdates).length > 0) {
    updatedProfile = await memoryStore.setUserProfileAsync(userId, profileUpdates);
  }

  const latestWiki = await wikiStore.getWikiAsync(userId);

  return {
    synced: true,
    addedCount,
    addedFacts,
    wiki: latestWiki,
    memory: updatedMemory,
    profile: updatedProfile
  };
}

module.exports = {
  syncDiscoveredDocumentToProfile
};
