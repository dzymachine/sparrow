/**
 * Deterministic Post-Divorce Life Finance Projection Engine
 *
 * Computes an up-to-date "If I Divorced Today" financial projection from the
 * user's latest profile, discovered assets (agentMemory), and Personal Wiki.
 * If critical information is missing, returns `insufficient_data` with
 * structured missing-field suggestions instead of fabricating numbers.
 *
 * NOTE: All outputs are educational estimates only and do not constitute
 * legal, tax, or financial advice.
 */

const COMMUNITY_PROPERTY_STATES = new Set([
  'Arizona',
  'California',
  'Idaho',
  'Louisiana',
  'Nevada',
  'New Mexico',
  'Texas',
  'Washington',
  'Wisconsin'
]);

function toFiniteNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

function parseDollarFromText(text) {
  if (!text) return null;
  const match = String(text).match(/\$\s*([\d,]+(?:\.\d+)?)\s*([kKmM])?/);
  if (!match) return null;
  let num = Number(match[1].replace(/,/g, ''));
  if (!Number.isFinite(num)) return null;
  const suffix = (match[2] || '').toLowerCase();
  if (suffix === 'k') num *= 1000;
  if (suffix === 'm') num *= 1000000;
  return Math.round(num);
}

/**
 * Aggregates the most up-to-date financial & divorce context from:
 * 1. User Profile (highest precedence for structured inputs)
 * 2. Agent Memory (discovered assets & mortgages)
 * 3. Personal Wiki (supplementary facts extracted from chat)
 */
function gatherLatestFinancialContext({ profile = {}, agentMemory = {}, wiki = {} }) {
  const dataSourcesUsed = [];
  if (profile && Object.keys(profile).length > 0) {
    dataSourcesUsed.push('User Profile');
  }

  const assets = Array.isArray(agentMemory?.discoveredAssets)
    ? agentMemory.discoveredAssets
    : [];
  if (assets.length > 0) {
    dataSourcesUsed.push(`Discovered Assets (${assets.length})`);
  }

  const wikiSections = wiki?.sections || {};
  const wikiFinancialFacts = wikiSections.financial_footprint?.facts || [];
  const wikiProfileFacts = wikiSections.profile?.facts || [];
  if (wikiFinancialFacts.length > 0 || wikiProfileFacts.length > 0) {
    dataSourcesUsed.push('Personal Wiki');
  }

  // Extract state & marriage length (profile first, fallback to wiki)
  let stateJurisdiction = profile.stateJurisdiction || null;
  if (!stateJurisdiction) {
    const jurisdictionFact = wikiProfileFacts.find((f) => /jurisdiction:/i.test(f.text));
    if (jurisdictionFact) {
      const m = jurisdictionFact.text.match(/jurisdiction:\s*([A-Za-z\s]+?)(?:\(|$)/i);
      if (m) stateJurisdiction = m[1].trim();
    }
  }

  let marriageLengthYears = toFiniteNumber(profile.marriageLengthYears);
  if (marriageLengthYears === null) {
    const marriageFact = wikiProfileFacts.find((f) => /marriage|married/i.test(f.text));
    if (marriageFact) {
      const m = marriageFact.text.match(/(\d+(?:\.\d+)?)\s*years?/i);
      if (m) marriageLengthYears = Number(m[1]);
    }
  }

  const hasChildren = Boolean(profile.hasChildren);
  const childrenCount = hasChildren
    ? toFiniteNumber(profile.childrenCount)
    : 0;

  const hasPrenup = profile.hasPrenup || 'no';
  const ownsHome = Boolean(profile.ownsHome);
  const divorcePathway = profile.divorcePathway || 'unsure';
  const needsProtectiveOrder = Boolean(profile.needsProtectiveOrder);

  // Structured income & expense fields
  const userGrossMonthlyIncome = toFiniteNumber(profile.userGrossMonthlyIncome);
  const spouseGrossMonthlyIncome = toFiniteNumber(profile.spouseGrossMonthlyIncome);
  const custodySharePercent = toFiniteNumber(profile.custodySharePercent);
  const monthlyLivingExpenses = toFiniteNumber(profile.monthlyLivingExpenses);
  const monthlyDebtPayments = toFiniteNumber(profile.monthlyDebtPayments);
  const totalDebtsInput = toFiniteNumber(profile.totalDebts);
  const healthInsuranceMonthlyCost = toFiniteNumber(profile.healthInsuranceMonthlyCost);
  const estimatedRentIfSelling = toFiniteNumber(profile.estimatedRentIfSelling);

  // Categorize discovered assets
  let homeAsset = null;
  let totalRetirement = 0;
  let totalLiquid = 0;
  let totalAssetDebts = 0;
  let potentialUndisclosedTotal = 0;
  const confirmedAssetBreakdown = [];
  const undisclosedLeads = [];

  for (const asset of assets) {
    const typeLower = String(asset.type || '').toLowerCase();
    const statusLower = String(asset.status || '').toLowerCase();
    const val = toFiniteNumber(asset.estimatedValue) || 0;

    if (typeLower.includes('undisclosed') || statusLower.includes('disclosure request')) {
      potentialUndisclosedTotal += val;
      undisclosedLeads.push({
        name: asset.name,
        estimatedValue: val,
        sourceDocument: asset.sourceDocument || 'Tax / Financial Lead'
      });
    } else if (typeLower.includes('real estate') || typeLower.includes('home') || typeLower.includes('property')) {
      if (!homeAsset) {
        homeAsset = {
          name: asset.name || 'Primary Residence',
          estimatedValue: val,
          mortgageRemaining: toFiniteNumber(asset.mortgageRemaining) || 0,
          monthlyPayment: toFiniteNumber(asset.monthlyPayment)
        };
      } else {
        const equity = Math.max(0, val - (toFiniteNumber(asset.mortgageRemaining) || 0));
        totalLiquid += equity;
        confirmedAssetBreakdown.push({
          name: asset.name,
          category: 'Real Estate Equity',
          netValue: equity
        });
      }
    } else if (
      typeLower.includes('retirement') ||
      typeLower.includes('401k') ||
      typeLower.includes('401(k)') ||
      typeLower.includes('ira') ||
      typeLower.includes('pension')
    ) {
      totalRetirement += val;
      confirmedAssetBreakdown.push({
        name: asset.name,
        category: 'Retirement (QDRO)',
        netValue: val
      });
    } else if (typeLower.includes('debt') || typeLower.includes('liability') || typeLower.includes('loan')) {
      totalAssetDebts += val;
    } else {
      totalLiquid += val;
      confirmedAssetBreakdown.push({
        name: asset.name,
        category: asset.type || 'Liquid / Investment',
        netValue: val
      });
    }
  }

  // Apply profile overrides for home if provided
  const homeValue = toFiniteNumber(profile.homeValueOverride) ?? homeAsset?.estimatedValue ?? null;
  const mortgageRemaining = toFiniteNumber(profile.mortgageRemainingOverride) ?? homeAsset?.mortgageRemaining ?? 0;
  const monthlyMortgageOverride = toFiniteNumber(profile.monthlyMortgageOverride);

  let homeMonthlyPayment = monthlyMortgageOverride ?? homeAsset?.monthlyPayment ?? null;
  if (homeMonthlyPayment === null && homeValue !== null) {
    homeMonthlyPayment = mortgageRemaining > 0
      ? Math.round(mortgageRemaining * 0.006 + 600)
      : 650; // taxes & insurance only if paid off
  }

  const totalDebts = totalDebtsInput !== null ? totalDebtsInput : totalAssetDebts;

  // Check if wiki mentions any extra liability not in discoveredAssets
  let wikiDebtMention = null;
  for (const fact of wikiFinancialFacts) {
    if (/liability|debt|loan/i.test(fact.category || fact.text)) {
      const parsed = parseDollarFromText(fact.text);
      if (parsed && totalDebts === 0) {
        wikiDebtMention = parsed;
      }
    }
  }

  return {
    dataSourcesUsed,
    stateJurisdiction,
    marriageLengthYears,
    hasChildren,
    childrenCount,
    hasPrenup,
    ownsHome: ownsHome || homeValue !== null,
    divorcePathway,
    needsProtectiveOrder,
    userGrossMonthlyIncome,
    spouseGrossMonthlyIncome,
    custodySharePercent,
    monthlyLivingExpenses,
    monthlyDebtPayments,
    totalDebts: totalDebts > 0 ? totalDebts : (wikiDebtMention || 0),
    healthInsuranceMonthlyCost,
    estimatedRentIfSelling,
    homeValue,
    mortgageRemaining,
    homeMonthlyPayment,
    homeName: homeAsset?.name || 'Primary Residence',
    totalRetirement,
    totalLiquid,
    potentialUndisclosedTotal,
    confirmedAssetBreakdown,
    undisclosedLeads,
    hasDiscoveredAssets: assets.length > 0
  };
}

/**
 * Evaluates whether there is enough information to generate an initial projection.
 * Returns required missing fields and recommended optional fields.
 */
function evaluateReadiness(ctx) {
  const missingFields = [];
  const recommendedMissingFields = [];

  if (!ctx.stateJurisdiction) {
    missingFields.push({
      field: 'stateJurisdiction',
      label: 'State Jurisdiction',
      reason: 'Determines whether Community Property (50/50) or Equitable Distribution rules apply, plus state tax and support guidelines.',
      priority: 'required',
      inputType: 'select',
      options: ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington', 'Other State']
    });
  }

  if (ctx.marriageLengthYears === null || ctx.marriageLengthYears < 0) {
    missingFields.push({
      field: 'marriageLengthYears',
      label: 'Length of Marriage (Years)',
      reason: 'Required to estimate spousal support duration (e.g., California’s 10-year long-duration threshold under FC § 4336).',
      priority: 'required',
      inputType: 'number'
    });
  }

  if (ctx.userGrossMonthlyIncome === null) {
    missingFields.push({
      field: 'userGrossMonthlyIncome',
      label: 'Your Gross Monthly Income ($)',
      reason: 'Needed to calculate your post-divorce take-home pay, spousal support offset, and child support. Enter 0 if currently not earning income.',
      priority: 'required',
      inputType: 'number'
    });
  }

  if (ctx.spouseGrossMonthlyIncome === null) {
    missingFields.push({
      field: 'spouseGrossMonthlyIncome',
      label: "Spouse's Gross Monthly Income ($)",
      reason: 'Required to estimate potential spousal support (alimony) and child support.',
      priority: 'required',
      inputType: 'number'
    });
  }

  if (ctx.hasChildren && (ctx.childrenCount === null || ctx.childrenCount <= 0)) {
    missingFields.push({
      field: 'childrenCount',
      label: 'Number of Dependent Children',
      reason: 'Required to calculate guideline child support.',
      priority: 'required',
      inputType: 'number'
    });
  }

  // Recommended fields that refine accuracy
  if (ctx.monthlyLivingExpenses === null) {
    recommendedMissingFields.push({
      field: 'monthlyLivingExpenses',
      label: 'Estimated Monthly Living Expenses ($)',
      reason: 'Helps measure your post-divorce monthly surplus or deficit (groceries, utilities, childcare, transport).',
      priority: 'recommended',
      inputType: 'number'
    });
  }

  if (ctx.hasChildren && ctx.childrenCount > 0 && ctx.custodySharePercent === null) {
    recommendedMissingFields.push({
      field: 'custodySharePercent',
      label: 'Expected Parenting Time Share (%)',
      reason: 'Child support depends heavily on parenting time share. Currently assuming 50% if left blank.',
      priority: 'recommended',
      inputType: 'number'
    });
  }

  if (ctx.healthInsuranceMonthlyCost === null) {
    recommendedMissingFields.push({
      field: 'healthInsuranceMonthlyCost',
      label: 'Post-Divorce Health Insurance / COBRA ($/mo)',
      reason: 'If you are currently on your spouse’s employer plan, post-divorce coverage is a major budget factor.',
      priority: 'recommended',
      inputType: 'number'
    });
  }

  if (!ctx.hasDiscoveredAssets && ctx.homeValue === null) {
    recommendedMissingFields.push({
      field: 'discoveredAssets',
      label: 'Marital Assets, Home Equity, or 401(k) Balances',
      reason: 'Add accounts in the Financial Discovery tab (or enter home details) to project your 50/50 net asset division.',
      priority: 'recommended',
      inputType: 'info'
    });
  }

  const canCalculate = missingFields.length === 0;
  let status = 'complete_estimate';
  if (!canCalculate) {
    status = 'insufficient_data';
  } else if (recommendedMissingFields.length > 0) {
    status = 'partial_estimate';
  }

  return {
    status,
    canCalculate,
    missingFields,
    recommendedMissingFields
  };
}

/**
 * Estimates monthly net income after federal, FICA, and state income taxes.
 */
function estimateMonthlyNetIncome(grossMonthly, stateJurisdiction, isHeadOfHousehold = false) {
  const gross = Math.max(0, Number(grossMonthly) || 0);
  if (gross === 0) {
    return {
      grossMonthly: 0,
      estimatedMonthlyTaxes: 0,
      netMonthly: 0,
      effectiveTaxRatePercent: 0
    };
  }

  const annual = gross * 12;

  // Simplified effective federal tax rate by bracket
  let fedRate = 0.10;
  if (annual > 200000) fedRate = 0.24;
  else if (annual > 120000) fedRate = 0.19;
  else if (annual > 75000) fedRate = 0.15;
  else if (annual > 40000) fedRate = 0.12;
  else if (annual <= 18000) fedRate = 0.04;

  if (isHeadOfHousehold) {
    fedRate = Math.max(0.02, fedRate - 0.025);
  }

  // FICA (Social Security 6.2% up to ~$176k + Medicare 1.45%)
  const ssTax = Math.min(annual, 176100) * 0.062;
  const medicareTax = annual * 0.0145;
  const ficaRate = (ssTax + medicareTax) / annual;

  // State tax rate approximation
  const noIncomeTaxStates = new Set(['Texas', 'Florida', 'Washington', 'Nevada']);
  let stateRate = 0.045;
  if (noIncomeTaxStates.has(stateJurisdiction)) {
    stateRate = 0;
  } else if (stateJurisdiction === 'California' || stateJurisdiction === 'New York') {
    if (annual > 150000) stateRate = 0.08;
    else if (annual > 75000) stateRate = 0.055;
    else if (annual > 35000) stateRate = 0.03;
    else stateRate = 0.015;
  }

  const totalRate = Math.min(0.45, fedRate + ficaRate + stateRate);
  const estimatedMonthlyTaxes = Math.round(gross * totalRate);
  const netMonthly = Math.max(0, Math.round(gross - estimatedMonthlyTaxes));

  return {
    grossMonthly: Math.round(gross),
    estimatedMonthlyTaxes,
    netMonthly,
    effectiveTaxRatePercent: Math.round(totalRate * 100)
  };
}

/**
 * Main entry point: calculates the full Post-Divorce Life Finance Projection.
 */
function calculatePostDivorceProjection({ profile = {}, agentMemory = {}, wiki = {} }) {
  const calculatedAt = new Date().toISOString();
  const ctx = gatherLatestFinancialContext({ profile, agentMemory, wiki });
  const readiness = evaluateReadiness(ctx);

  if (!readiness.canCalculate) {
    return {
      status: readiness.status,
      canCalculate: false,
      calculatedAt,
      dataSourcesUsed: ctx.dataSourcesUsed,
      missingFields: readiness.missingFields,
      recommendedMissingFields: readiness.recommendedMissingFields,
      message:
        'Not enough financial or divorce information is available yet to build an initial post-divorce projection. Please provide the missing details below so RuthAI can calculate your take-home pay, support estimates, and asset outlook.',
      currentSnapshot: {
        stateJurisdiction: ctx.stateJurisdiction,
        marriageLengthYears: ctx.marriageLengthYears,
        hasChildren: ctx.hasChildren,
        childrenCount: ctx.childrenCount,
        userGrossMonthlyIncome: ctx.userGrossMonthlyIncome,
        spouseGrossMonthlyIncome: ctx.spouseGrossMonthlyIncome,
        homeValue: ctx.homeValue,
        mortgageRemaining: ctx.mortgageRemaining
      }
    };
  }

  const isCA = ctx.stateJurisdiction === 'California';
  const isCommunityProperty = COMMUNITY_PROPERTY_STATES.has(ctx.stateJurisdiction);
  const custodyShare = ctx.hasChildren && ctx.childrenCount > 0
    ? Math.min(100, Math.max(0, ctx.custodySharePercent ?? 50))
    : 0;
  const isHoH = ctx.hasChildren && ctx.childrenCount > 0 && custodyShare >= 50;

  // 1. Earned Take-Home Pay
  const userNet = estimateMonthlyNetIncome(ctx.userGrossMonthlyIncome, ctx.stateJurisdiction, isHoH);
  const spouseNet = estimateMonthlyNetIncome(ctx.spouseGrossMonthlyIncome, ctx.stateJurisdiction, false);

  // 2. Spousal Support (Alimony) Estimate
  let alimonyMid = 0;
  let alimonyLow = 0;
  let alimonyHigh = 0;
  let alimonyNote = '';
  let isLongDurationMarriage = false;
  let estimatedSupportDurationYears = null;

  if (spouseNet.netMonthly > userNet.netMonthly) {
    const rawAlimony = isCA
      ? Math.max(0, 0.40 * spouseNet.netMonthly - 0.50 * userNet.netMonthly)
      : Math.max(0, Math.min(
          0.30 * spouseNet.netMonthly - 0.20 * userNet.netMonthly,
          0.40 * (spouseNet.netMonthly + userNet.netMonthly) - userNet.netMonthly
        ));

    alimonyMid = Math.round(rawAlimony);
    alimonyLow = Math.round(rawAlimony * 0.85);
    alimonyHigh = Math.round(rawAlimony * 1.15);

    if (isCA) {
      if (ctx.marriageLengthYears >= 10) {
        isLongDurationMarriage = true;
        alimonyNote = `Long-duration marriage (${ctx.marriageLengthYears} yrs ≥ 10 yrs): under CA Fam. Code § 4336, the court retains indefinite jurisdiction over spousal support.`;
      } else {
        estimatedSupportDurationYears = Math.max(0.5, Number((ctx.marriageLengthYears * 0.5).toFixed(1)));
        alimonyNote = `Under CA Fam. Code § 4320, support for a marriage under 10 years generally lasts half the marriage length (~${estimatedSupportDurationYears} yrs).`;
      }
    } else {
      estimatedSupportDurationYears = Math.max(1, Math.round(ctx.marriageLengthYears * 0.4));
      alimonyNote = `Estimated duration ~${estimatedSupportDurationYears} years based on ${ctx.stateJurisdiction} equitable planning guidelines.`;
    }
  } else {
    alimonyNote = 'Your net earned income is equal to or higher than your spouse’s, so you are unlikely to receive spousal support.';
  }

  if (ctx.hasPrenup === 'yes') {
    alimonyNote += ' Note: A valid prenuptial agreement may waive or modify spousal support.';
  }

  // 3. Child Support Estimate
  let childSupportMid = 0;
  let childSupportLow = 0;
  let childSupportHigh = 0;
  let childSupportNote = 'No dependent children reported.';

  if (ctx.hasChildren && ctx.childrenCount > 0) {
    const kByCount = { 1: 0.25, 2: 0.36, 3: 0.44 };
    const kFactor = kByCount[ctx.childrenCount] || 0.50;
    const userTime = custodyShare / 100;
    const spouseTime = 1 - userTime;

    const rawCS = Math.max(
      0,
      kFactor * (spouseNet.netMonthly * userTime - userNet.netMonthly * spouseTime)
    );
    childSupportMid = Math.round(rawCS);
    childSupportLow = Math.round(rawCS * 0.85);
    childSupportHigh = Math.round(rawCS * 1.15);
    childSupportNote = `Based on ${ctx.childrenCount} child${ctx.childrenCount > 1 ? 'ren' : ''} and ${custodyShare}% parenting time${ctx.custodySharePercent === null ? ' (default 50/50 assumption)' : ''}. Child support is non-taxable to the recipient.`;
  }

  // 4. Total Monthly Take-Home Cash Flow ("If Divorced Today")
  const totalMonthlyTakeHome = userNet.netMonthly + alimonyMid + childSupportMid;
  const totalMonthlyTakeHomeRange = {
    low: userNet.netMonthly + alimonyLow + childSupportLow,
    high: userNet.netMonthly + alimonyHigh + childSupportHigh
  };

  // 5. Monthly Expenses & Affordability
  const hasHome = ctx.homeValue !== null && ctx.homeValue > 0;
  const keepHomeMonthlyHousing = hasHome ? (ctx.homeMonthlyPayment || 0) : (ctx.estimatedRentIfSelling || 0);
  const livingExpenses = ctx.monthlyLivingExpenses || 0;
  const debtPayments = ctx.monthlyDebtPayments || 0;
  const healthInsurance = ctx.healthInsuranceMonthlyCost || 0;

  const totalMonthlyExpenses = keepHomeMonthlyHousing + livingExpenses + debtPayments + healthInsurance;
  const monthlyNetCashFlow = totalMonthlyTakeHome - totalMonthlyExpenses;
  const housingToIncomeRatio = totalMonthlyTakeHome > 0
    ? Math.round((keepHomeMonthlyHousing / totalMonthlyTakeHome) * 100)
    : 0;

  // 6. Asset & Debt Division ("If Divided Today")
  const homeEquity = hasHome ? Math.max(0, ctx.homeValue - ctx.mortgageRemaining) : 0;
  const totalConfirmedAssets = homeEquity + ctx.totalRetirement + ctx.totalLiquid;
  const netConfirmedEstate = totalConfirmedAssets - ctx.totalDebts;
  const shareRatio = 0.5; // 50/50 Community Property or 50% equitable baseline

  const userHomeEquityShare = Math.round(homeEquity * shareRatio);
  const userRetirementShare = Math.round(ctx.totalRetirement * shareRatio);
  const userLiquidShare = Math.round((ctx.totalLiquid - ctx.totalDebts) * shareRatio);
  const userConfirmedNetWorth = Math.round(netConfirmedEstate * shareRatio);
  const userPotentialUndisclosedShare = Math.round(ctx.potentialUndisclosedTotal * shareRatio);

  // 7. Keep House vs. Sell & Divide Comparison + Year 5 Outlook
  const estimatedRentBaseline = ctx.estimatedRentIfSelling || (hasHome ? Math.round(keepHomeMonthlyHousing * 0.78) : 0);
  const monthlyExpensesIfSelling = estimatedRentBaseline + livingExpenses + debtPayments + healthInsurance;
  const monthlyCashFlowIfSelling = totalMonthlyTakeHome - monthlyExpensesIfSelling;

  const year5SupportActive = isLongDurationMarriage || estimatedSupportDurationYears === null || estimatedSupportDurationYears >= 5;
  const year5Alimony = year5SupportActive ? alimonyMid : 0;
  const year5MonthlyTakeHome = userNet.netMonthly + year5Alimony + childSupportMid;

  // 8. Statutory Citations & Assumptions
  const citations = [];
  if (isCA) {
    citations.push('Cal. Fam. Code § 2550 (Equal 50/50 division of net community estate)');
    citations.push('Cal. Fam. Code § 4320 (14 statutory factors for spousal support)');
    if (isLongDurationMarriage) {
      citations.push('Cal. Fam. Code § 4336 (Long-duration marriage ≥ 10 years)');
    }
    if (ctx.hasChildren && ctx.childrenCount > 0) {
      citations.push('Cal. Fam. Code § 4055 (Statewide uniform child support guideline)');
    }
    if (ctx.hasPrenup === 'yes' || ctx.hasPrenup === 'unsure') {
      citations.push('Cal. Fam. Code §§ 1600–1617 (Uniform Premarital Agreement Act)');
    }
    if (ctx.needsProtectiveOrder) {
      citations.push('Cal. Fam. Code § 4325 (Domestic violence spousal support protections)');
    }
  } else {
    citations.push(`${ctx.stateJurisdiction} (${isCommunityProperty ? 'Community Property 50/50' : 'Equitable Distribution'}) planning guidelines`);
  }

  const warnings = [];
  if (ctx.hasPrenup === 'yes') {
    warnings.push('You indicated a prenuptial agreement exists. Actual property division and spousal support may be governed by your prenup terms.');
  } else if (ctx.hasPrenup === 'unsure') {
    warnings.push('You are unsure about a prenuptial agreement. Confirming whether one exists is critical before relying on default statutory splits.');
  }
  if (hasHome && housingToIncomeRatio > 40) {
    warnings.push(`Keeping the home puts housing at ${housingToIncomeRatio}% of projected monthly take-home pay (above the 40% safety threshold).`);
  }
  if (ctx.potentialUndisclosedTotal > 0) {
    warnings.push(`$${ctx.potentialUndisclosedTotal.toLocaleString()} in potential undisclosed accounts were flagged in discovery—your share could increase by +$${userPotentialUndisclosedShare.toLocaleString()} after formal disclosures.`);
  }
  if (ctx.divorcePathway === 'contested_or_uncooperative') {
    warnings.push('Contested or uncooperative cases can incur higher attorney/discovery costs; consider setting aside a legal reserve from liquid assets.');
  }

  return {
    status: readiness.status,
    canCalculate: true,
    calculatedAt,
    dataSourcesUsed: ctx.dataSourcesUsed,
    missingFields: [],
    recommendedMissingFields: readiness.recommendedMissingFields,
    inputsSnapshot: {
      stateJurisdiction: ctx.stateJurisdiction,
      isCommunityProperty,
      marriageLengthYears: ctx.marriageLengthYears,
      hasChildren: ctx.hasChildren,
      childrenCount: ctx.childrenCount,
      custodySharePercent: custodyShare,
      hasPrenup: ctx.hasPrenup,
      userGrossMonthlyIncome: ctx.userGrossMonthlyIncome,
      spouseGrossMonthlyIncome: ctx.spouseGrossMonthlyIncome,
      monthlyLivingExpenses: ctx.monthlyLivingExpenses,
      monthlyDebtPayments: ctx.monthlyDebtPayments,
      totalDebts: ctx.totalDebts,
      healthInsuranceMonthlyCost: ctx.healthInsuranceMonthlyCost,
      homeValue: ctx.homeValue,
      mortgageRemaining: ctx.mortgageRemaining,
      homeMonthlyPayment: keepHomeMonthlyHousing,
      estimatedRentIfSelling: ctx.estimatedRentIfSelling
    },
    monthlyTakeHome: {
      totalMonthlyTakeHome,
      range: totalMonthlyTakeHomeRange,
      earnedIncome: userNet,
      spouseNetEstimate: spouseNet,
      spousalSupport: {
        monthlyMid: alimonyMid,
        range: { low: alimonyLow, high: alimonyHigh },
        durationYears: estimatedSupportDurationYears,
        isLongDurationMarriage,
        note: alimonyNote
      },
      childSupport: {
        applicable: ctx.hasChildren && ctx.childrenCount > 0,
        monthlyMid: childSupportMid,
        range: { low: childSupportLow, high: childSupportHigh },
        custodySharePercent: custodyShare,
        note: childSupportNote
      }
    },
    monthlyCashFlow: {
      totalMonthlyTakeHome,
      housingCost: keepHomeMonthlyHousing,
      livingExpenses,
      debtPayments,
      healthInsurance,
      totalMonthlyExpenses,
      monthlyNetCashFlow,
      housingToIncomeRatio
    },
    assetDivision: {
      divisionRule: isCommunityProperty
        ? 'Community Property (50/50 Equal Division)'
        : 'Equitable Distribution (~50% Planning Baseline)',
      totalConfirmedAssets,
      totalDebts: ctx.totalDebts,
      netConfirmedEstate,
      userConfirmedNetWorth,
      breakdown: {
        homeEquity: { total: homeEquity, userShare: userHomeEquityShare },
        retirement: { total: ctx.totalRetirement, userShare: userRetirementShare },
        liquidAndOther: { total: ctx.totalLiquid, userShare: userLiquidShare }
      },
      potentialUndisclosedTotal: ctx.potentialUndisclosedTotal,
      userPotentialUndisclosedShare,
      undisclosedLeads: ctx.undisclosedLeads,
      confirmedAssetBreakdown: ctx.confirmedAssetBreakdown
    },
    housingComparison: {
      hasHome,
      homeName: ctx.homeName,
      scenarioKeepHome: {
        monthlyHousingCost: keepHomeMonthlyHousing,
        housingToIncomeRatio,
        monthlyNetCashFlow,
        retainedHomeEquity: userHomeEquityShare
      },
      scenarioSellAndDivide: {
        estimatedMonthlyRent: estimatedRentBaseline,
        lumpSumCashEquity: userHomeEquityShare,
        monthlyNetCashFlow: monthlyCashFlowIfSelling
      }
    },
    fiveYearOutlook: {
      year1MonthlyTakeHome: totalMonthlyTakeHome,
      year5MonthlyTakeHome,
      supportDropsByYear5: !year5SupportActive && alimonyMid > 0,
      supportDurationYears: estimatedSupportDurationYears
    },
    warnings,
    citations,
    disclaimer:
      'Educational financial projection only. Not legal, tax, or financial advice. Actual California or state court awards depend on verified disclosures (FL-140/FL-142/FL-150), judicial discretion, and statutory factors.'
  };
}

module.exports = {
  calculatePostDivorceProjection,
  gatherLatestFinancialContext,
  evaluateReadiness,
  estimateMonthlyNetIncome
};
