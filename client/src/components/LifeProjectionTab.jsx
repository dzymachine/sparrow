import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  DollarSign,
  Home,
  Scale,
  HeartHandshake,
  Users,
  Shield,
  TrendingUp,
  CheckCircle2,
  Info,
  Sparkles,
  Calendar
} from 'lucide-react';
import { useAgentMemory } from '../context/AgentMemoryContext';

function formatMoney(val) {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '$0';
  return `$${Math.round(Number(val)).toLocaleString()}`;
}

export default function LifeProjectionTab({ discoveryVersion = 0 } = {}) {
  const {
    profile,
    lifeProjection,
    isCalculatingProjection,
    refreshLifeProjection,
    saveLifeProjectionInputs
  } = useAgentMemory();

  const [formValues, setFormValues] = useState({
    stateJurisdiction: 'California',
    marriageLengthYears: '',
    hasChildren: false,
    childrenCount: '',
    hasPrenup: 'no',
    userGrossMonthlyIncome: '',
    spouseGrossMonthlyIncome: '',
    custodySharePercent: '50',
    monthlyLivingExpenses: '',
    monthlyDebtPayments: '',
    totalDebts: '',
    healthInsuranceMonthlyCost: '',
    estimatedRentIfSelling: ''
  });

  // Recalculate from the latest profile, discovered assets, and wiki every time the user opens this view or discovery updates
  useEffect(() => {
    refreshLifeProjection();
  }, [refreshLifeProjection, discoveryVersion]);

  // Sync local form state whenever projection or profile updates
  useEffect(() => {
    const snap = lifeProjection?.inputsSnapshot || lifeProjection?.currentSnapshot || profile || {};
    setFormValues({
      stateJurisdiction: snap.stateJurisdiction ?? profile?.stateJurisdiction ?? 'California',
      marriageLengthYears:
        snap.marriageLengthYears !== null && snap.marriageLengthYears !== undefined
          ? String(snap.marriageLengthYears)
          : '',
      hasChildren: Boolean(snap.hasChildren ?? profile?.hasChildren),
      childrenCount:
        snap.childrenCount !== null && snap.childrenCount !== undefined
          ? String(snap.childrenCount)
          : '',
      hasPrenup: snap.hasPrenup ?? profile?.hasPrenup ?? 'no',
      userGrossMonthlyIncome:
        snap.userGrossMonthlyIncome !== null && snap.userGrossMonthlyIncome !== undefined
          ? String(snap.userGrossMonthlyIncome)
          : '',
      spouseGrossMonthlyIncome:
        snap.spouseGrossMonthlyIncome !== null && snap.spouseGrossMonthlyIncome !== undefined
          ? String(snap.spouseGrossMonthlyIncome)
          : '',
      custodySharePercent:
        snap.custodySharePercent !== null && snap.custodySharePercent !== undefined
          ? String(snap.custodySharePercent)
          : '50',
      monthlyLivingExpenses:
        snap.monthlyLivingExpenses !== null && snap.monthlyLivingExpenses !== undefined
          ? String(snap.monthlyLivingExpenses)
          : '',
      monthlyDebtPayments:
        snap.monthlyDebtPayments !== null && snap.monthlyDebtPayments !== undefined
          ? String(snap.monthlyDebtPayments)
          : '',
      totalDebts:
        snap.totalDebts !== null && snap.totalDebts !== undefined
          ? String(snap.totalDebts)
          : '',
      healthInsuranceMonthlyCost:
        snap.healthInsuranceMonthlyCost !== null && snap.healthInsuranceMonthlyCost !== undefined
          ? String(snap.healthInsuranceMonthlyCost)
          : '',
      estimatedRentIfSelling:
        snap.estimatedRentIfSelling !== null && snap.estimatedRentIfSelling !== undefined
          ? String(snap.estimatedRentIfSelling)
          : ''
    });
  }, [lifeProjection, profile]);

  const handleFieldChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAndRecalculate = async (e) => {
    e.preventDefault();
    const payload = {
      stateJurisdiction: formValues.stateJurisdiction || undefined,
      marriageLengthYears:
        formValues.marriageLengthYears !== '' ? Number(formValues.marriageLengthYears) : undefined,
      hasChildren: Boolean(formValues.hasChildren),
      childrenCount: formValues.hasChildren
        ? formValues.childrenCount !== ''
          ? Number(formValues.childrenCount)
          : undefined
        : 0,
      hasPrenup: formValues.hasPrenup,
      userGrossMonthlyIncome:
        formValues.userGrossMonthlyIncome !== ''
          ? Number(formValues.userGrossMonthlyIncome)
          : undefined,
      spouseGrossMonthlyIncome:
        formValues.spouseGrossMonthlyIncome !== ''
          ? Number(formValues.spouseGrossMonthlyIncome)
          : undefined,
      custodySharePercent:
        formValues.custodySharePercent !== '' ? Number(formValues.custodySharePercent) : undefined,
      monthlyLivingExpenses:
        formValues.monthlyLivingExpenses !== ''
          ? Number(formValues.monthlyLivingExpenses)
          : undefined,
      monthlyDebtPayments:
        formValues.monthlyDebtPayments !== '' ? Number(formValues.monthlyDebtPayments) : undefined,
      totalDebts: formValues.totalDebts !== '' ? Number(formValues.totalDebts) : undefined,
      healthInsuranceMonthlyCost:
        formValues.healthInsuranceMonthlyCost !== ''
          ? Number(formValues.healthInsuranceMonthlyCost)
          : undefined,
      estimatedRentIfSelling:
        formValues.estimatedRentIfSelling !== ''
          ? Number(formValues.estimatedRentIfSelling)
          : undefined
    };

    await saveLifeProjectionInputs(payload);
  };

  if (!lifeProjection && isCalculatingProjection) {
    return (
      <div className="bg-white border border-brand-200/80 rounded-3xl p-10 text-center space-y-3 shadow-sm">
        <RefreshCw className="w-7 h-7 text-brand-700 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-800">
          Calculating your latest post-divorce financial projection...
        </p>
        <p className="text-xs text-slate-500">
          Syncing your profile, discovered assets, and Personal Wiki.
        </p>
      </div>
    );
  }

  const isInsufficient = lifeProjection && !lifeProjection.canCalculate;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-brand-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-700" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Post-Divorce Life Finance Projection
            </h2>
            {lifeProjection?.status === 'complete_estimate' && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Up-to-Date Estimate
              </span>
            )}
            {lifeProjection?.status === 'partial_estimate' && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Initial Estimate (Can Refine)
              </span>
            )}
            {isInsufficient && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                Missing Required Info
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Recalculates automatically from your latest profile, discovered accounts, and divorce details to model what your finances would look like if you divorced today.
          </p>
          {lifeProjection?.dataSourcesUsed?.length > 0 && (
            <p className="text-[11px] text-slate-400">
              Sources synced: {lifeProjection.dataSourcesUsed.join(' • ')} • Updated{' '}
              {new Date(lifeProjection.calculatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => refreshLifeProjection()}
          disabled={isCalculatingProjection}
          className="inline-flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCalculatingProjection ? 'animate-spin' : ''}`} />
          <span>{isCalculatingProjection ? 'Recalculating...' : 'Recalculate Today'}</span>
        </button>
      </div>

      {/* STATE 1: INSUFFICIENT DATA */}
      {isInsufficient && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-amber-50/80 border border-amber-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Not Enough Information Yet
                </h3>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {lifeProjection.message}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Missing Required Fields ({lifeProjection.missingFields.length})
              </p>
              {lifeProjection.missingFields.map((item) => (
                <div
                  key={item.field}
                  className="bg-white border border-amber-200 rounded-2xl p-3.5 space-y-1"
                >
                  <div className="text-xs font-bold text-slate-900">{item.label}</div>
                  <div className="text-[11px] text-slate-600 leading-relaxed">{item.reason}</div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSaveAndRecalculate}
            className="lg:col-span-3 bg-white border border-brand-200/80 rounded-3xl p-6 shadow-sm space-y-5"
          >
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Complete Missing Details to Generate Your Estimate
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your best current estimates—you can update them anytime as you discover more documents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State Jurisdiction *
                </label>
                <select
                  value={formValues.stateJurisdiction}
                  onChange={(e) => handleFieldChange('stateJurisdiction', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                >
                  {['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington', 'Other State'].map(
                    (st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Length of Marriage (Years) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g. 12"
                  value={formValues.marriageLengthYears}
                  onChange={(e) => handleFieldChange('marriageLengthYears', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Gross Monthly Income ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 3200 (or 0 if none)"
                  value={formValues.userGrossMonthlyIncome}
                  onChange={(e) => handleFieldChange('userGrossMonthlyIncome', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Spouse Gross Monthly Income ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 12000"
                  value={formValues.spouseGrossMonthlyIncome}
                  onChange={(e) => handleFieldChange('spouseGrossMonthlyIncome', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  id="hasChildren-missing"
                  type="checkbox"
                  checked={formValues.hasChildren}
                  onChange={(e) => handleFieldChange('hasChildren', e.target.checked)}
                  className="rounded border-slate-300 text-brand-700"
                />
                <label htmlFor="hasChildren-missing" className="text-xs font-semibold text-slate-700">
                  Dependent children together
                </label>
              </div>

              {formValues.hasChildren && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Number of Children *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 2"
                    value={formValues.childrenCount}
                    onChange={(e) => handleFieldChange('childrenCount', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isCalculatingProjection}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold px-6 py-3 rounded-xl shadow transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Save & Calculate My Projection</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STATE 2: PROJECTION RESULTS */}
      {lifeProjection?.canCalculate && (
        <>
          {/* Recommended Missing Fields Prompt (if partial_estimate) */}
          {lifeProjection.recommendedMissingFields?.length > 0 && (
            <div className="bg-brand-50/70 border border-brand-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <strong className="text-slate-900">Sharpen your estimate:</strong> Adding{' '}
                  {lifeProjection.recommendedMissingFields.map((f) => f.label).join(', ')} in the inputs below will make your monthly budget and net worth projection even more accurate.
                </div>
              </div>
            </div>
          )}

          {/* 4 Hero Summary Cards ("If You Divorced Today") */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Monthly Take-Home */}
            <div className="bg-white border border-brand-200/80 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Est. Monthly Take-Home</span>
                <DollarSign className="w-4 h-4 text-brand-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {formatMoney(lifeProjection.monthlyTakeHome.totalMonthlyTakeHome)}
                <span className="text-xs font-medium text-slate-400"> /mo</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Range: {formatMoney(lifeProjection.monthlyTakeHome.range.low)} –{' '}
                {formatMoney(lifeProjection.monthlyTakeHome.range.high)} /mo
              </p>
              <div className="text-[11px] text-emerald-700 font-medium pt-1 border-t border-slate-100">
                Own net pay: {formatMoney(lifeProjection.monthlyTakeHome.earnedIncome.netMonthly)}/mo
              </div>
            </div>

            {/* Card 2: Spousal Support (Alimony) */}
            <div className="bg-white border border-brand-200/80 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Est. Spousal Support</span>
                <HeartHandshake className="w-4 h-4 text-brand-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {formatMoney(lifeProjection.monthlyTakeHome.spousalSupport.monthlyMid)}
                <span className="text-xs font-medium text-slate-400"> /mo</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Range: {formatMoney(lifeProjection.monthlyTakeHome.spousalSupport.range.low)} –{' '}
                {formatMoney(lifeProjection.monthlyTakeHome.spousalSupport.range.high)} /mo
              </p>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                {lifeProjection.monthlyTakeHome.spousalSupport.isLongDurationMarriage
                  ? 'Long-duration (10+ yrs): Indefinite jurisdiction'
                  : lifeProjection.monthlyTakeHome.spousalSupport.durationYears
                  ? `Est. duration: ~${lifeProjection.monthlyTakeHome.spousalSupport.durationYears} yrs`
                  : 'Based on current income gap'}
              </div>
            </div>

            {/* Card 3: Child Support */}
            <div className="bg-white border border-brand-200/80 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Est. Child Support</span>
                <Users className="w-4 h-4 text-brand-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {lifeProjection.monthlyTakeHome.childSupport.applicable
                  ? formatMoney(lifeProjection.monthlyTakeHome.childSupport.monthlyMid)
                  : '$0'}
                <span className="text-xs font-medium text-slate-400"> /mo</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {lifeProjection.monthlyTakeHome.childSupport.applicable
                  ? `Range: ${formatMoney(lifeProjection.monthlyTakeHome.childSupport.range.low)} – ${formatMoney(lifeProjection.monthlyTakeHome.childSupport.range.high)} /mo`
                  : 'No dependent children'}
              </p>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                {lifeProjection.monthlyTakeHome.childSupport.applicable
                  ? `${lifeProjection.inputsSnapshot.childrenCount} child(ren) • ${lifeProjection.monthlyTakeHome.childSupport.custodySharePercent}% parenting time`
                  : 'Non-taxable when awarded'}
              </div>
            </div>

            {/* Card 4: Net Asset Share */}
            <div className="bg-white border border-brand-200/80 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Your Est. Asset Share</span>
                <Scale className="w-4 h-4 text-brand-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
                {formatMoney(lifeProjection.assetDivision.userConfirmedNetWorth)}
              </div>
              <p className="text-[11px] text-slate-500">
                {lifeProjection.assetDivision.divisionRule}
              </p>
              <div className="text-[11px] text-amber-700 font-medium pt-1 border-t border-slate-100">
                {lifeProjection.assetDivision.userPotentialUndisclosedShare > 0
                  ? `+${formatMoney(lifeProjection.assetDivision.userPotentialUndisclosedShare)} potential pending discovery`
                  : `After ${formatMoney(lifeProjection.assetDivision.totalDebts)} marital debts`}
              </div>
            </div>
          </div>

          {/* Warnings */}
          {lifeProjection.warnings?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
              {lifeProjection.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Main Grid: Inputs Editor + Detailed Cash Flow & Housing Outlook */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Update Latest Inputs */}
            <form
              onSubmit={handleSaveAndRecalculate}
              className="lg:col-span-1 bg-white border border-brand-200/80 rounded-3xl p-6 shadow-sm space-y-4"
            >
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Your Latest Financial Inputs
                </h3>
                <p className="text-xs text-slate-500">
                  Adjust any figure below and click Save & Recalculate.
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      State
                    </label>
                    <select
                      value={formValues.stateJurisdiction}
                      onChange={(e) => handleFieldChange('stateJurisdiction', e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                    >
                      {['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington', 'Other State'].map(
                        (st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Marriage (Yrs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formValues.marriageLengthYears}
                      onChange={(e) => handleFieldChange('marriageLengthYears', e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Your Gross Monthly Income ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formValues.userGrossMonthlyIncome}
                    onChange={(e) => handleFieldChange('userGrossMonthlyIncome', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Spouse Gross Monthly Income ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formValues.spouseGrossMonthlyIncome}
                    onChange={(e) => handleFieldChange('spouseGrossMonthlyIncome', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                {formValues.hasChildren && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Children
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formValues.childrenCount}
                        onChange={(e) => handleFieldChange('childrenCount', e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Your Custody %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formValues.custodySharePercent}
                        onChange={(e) => handleFieldChange('custodySharePercent', e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Living Expenses ($/mo)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 2400"
                      value={formValues.monthlyLivingExpenses}
                      onChange={(e) => handleFieldChange('monthlyLivingExpenses', e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      COBRA / Health ($/mo)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 480"
                      value={formValues.healthInsuranceMonthlyCost}
                      onChange={(e) =>
                        handleFieldChange('healthInsuranceMonthlyCost', e.target.value)
                      }
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Debt Payments ($/mo)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 350"
                      value={formValues.monthlyDebtPayments}
                      onChange={(e) => handleFieldChange('monthlyDebtPayments', e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Total Marital Debts ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 12000"
                      value={formValues.totalDebts}
                      onChange={(e) => handleFieldChange('totalDebts', e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCalculatingProjection}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Recalculate</span>
              </button>
            </form>

            {/* Right Column: Cash Flow, Housing Comparison, Asset Split & 5-Year Outlook */}
            <div className="lg:col-span-2 space-y-6">
              {/* Monthly Cash Flow Card */}
              <div className="bg-white border border-brand-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    Monthly Post-Divorce Cash Flow
                  </h3>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto ${
                      lifeProjection.monthlyCashFlow.monthlyNetCashFlow >= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Net Monthly:{' '}
                    {lifeProjection.monthlyCashFlow.monthlyNetCashFlow >= 0 ? '+' : ''}
                    {formatMoney(lifeProjection.monthlyCashFlow.monthlyNetCashFlow)}/mo
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block">Housing</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatMoney(lifeProjection.monthlyCashFlow.housingCost)}/mo
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block">Living Expenses</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatMoney(lifeProjection.monthlyCashFlow.livingExpenses)}/mo
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block">Health / COBRA</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatMoney(lifeProjection.monthlyCashFlow.healthInsurance)}/mo
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block">Debt Payments</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatMoney(lifeProjection.monthlyCashFlow.debtPayments)}/mo
                    </span>
                  </div>
                </div>
              </div>

              {/* Keep vs Sell Home Comparison */}
              {lifeProjection.housingComparison.hasHome && (
                <div className="bg-white border border-brand-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-brand-700" />
                      <h3 className="font-bold text-slate-900 text-base">
                        Housing Decision: {lifeProjection.housingComparison.homeName}
                      </h3>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        lifeProjection.housingComparison.scenarioKeepHome.housingToIncomeRatio > 40
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      Housing Ratio:{' '}
                      {lifeProjection.housingComparison.scenarioKeepHome.housingToIncomeRatio}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <span className="text-xs font-semibold text-slate-500 block">
                        Scenario A: Keep the Home
                      </span>
                      <div className="text-xl font-extrabold text-slate-900">
                        {formatMoney(
                          lifeProjection.housingComparison.scenarioKeepHome.monthlyHousingCost
                        )}{' '}
                        / mo
                      </div>
                      <p className="text-xs text-slate-600">
                        Net monthly cash flow:{' '}
                        <strong>
                          {formatMoney(
                            lifeProjection.housingComparison.scenarioKeepHome.monthlyNetCashFlow
                          )}
                          /mo
                        </strong>
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                      <span className="text-xs font-semibold text-emerald-800 block">
                        Scenario B: Sell & Divide Equity
                      </span>
                      <div className="text-xl font-extrabold text-emerald-950">
                        +
                        {formatMoney(
                          lifeProjection.housingComparison.scenarioSellAndDivide.lumpSumCashEquity
                        )}{' '}
                        <span className="text-xs font-normal">cash equity</span>
                      </div>
                      <p className="text-xs text-emerald-900">
                        Est. cash flow if renting (~
                        {formatMoney(
                          lifeProjection.housingComparison.scenarioSellAndDivide
                            .estimatedMonthlyRent
                        )}
                        /mo):{' '}
                        <strong>
                          {formatMoney(
                            lifeProjection.housingComparison.scenarioSellAndDivide
                              .monthlyNetCashFlow
                          )}
                          /mo
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Asset Division & 5-Year Outlook */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-brand-200/80 rounded-3xl p-5 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Your 50/50 Net Asset Breakdown
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Home Equity Share</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatMoney(lifeProjection.assetDivision.breakdown.homeEquity.userShare)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Retirement / 401(k) (QDRO)</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatMoney(lifeProjection.assetDivision.breakdown.retirement.userShare)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Liquid / Brokerage (Net of Debt)</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatMoney(
                          lifeProjection.assetDivision.breakdown.liquidAndOther.userShare
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-brand-200/80 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-700" />
                    <h4 className="font-bold text-slate-900 text-sm">Year 1 vs. Year 5 Outlook</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Year 1 Monthly Take-Home</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatMoney(lifeProjection.fiveYearOutlook.year1MonthlyTakeHome)}/mo
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Year 5 Monthly Take-Home</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatMoney(lifeProjection.fiveYearOutlook.year5MonthlyTakeHome)}/mo
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1">
                      {lifeProjection.fiveYearOutlook.supportDropsByYear5
                        ? `Note: Spousal support may step down after ~${lifeProjection.fiveYearOutlook.supportDurationYears} years.`
                        : 'Models ongoing support jurisdiction based on marriage length.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Citations & Disclaimer */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Shield className="w-3.5 h-3.5 text-brand-700" />
                  <span>Legal & Methodology Grounding</span>
                </div>
                <p>{lifeProjection.monthlyTakeHome.spousalSupport.note}</p>
                {lifeProjection.monthlyTakeHome.childSupport.applicable && (
                  <p>{lifeProjection.monthlyTakeHome.childSupport.note}</p>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {lifeProjection.citations.map((c, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
                <p className="text-slate-500 italic pt-1">{lifeProjection.disclaimer}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
