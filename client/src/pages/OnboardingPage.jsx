import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  MapPin, 
  Users, 
  Coins, 
  HeartHandshake, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Lock,
  Sparkles,
  Target,
  FileText,
  Calendar,
  Baby
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgentMemory } from '../context/AgentMemoryContext';

const US_STATES = [
  { name: 'California', type: 'Community Property' },
  { name: 'New York', type: 'Equitable Distribution' },
  { name: 'Texas', type: 'Community Property' },
  { name: 'Florida', type: 'Equitable Distribution' },
  { name: 'Illinois', type: 'Equitable Distribution' },
  { name: 'Washington', type: 'Community Property' },
  { name: 'Other State', type: 'Varies by Jurisdiction' }
];

export default function OnboardingPage() {
  const { currentUser } = useAuth();
  const { saveOnboardingProfile, isSyncing } = useAgentMemory();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    goal: 'understanding_rights',
    maritalStatus: 'married_considering_divorce',
    stateJurisdiction: 'California',
    marriageLengthYears: 15,
    hasChildren: true,
    childrenCount: 2,
    childrenAges: ['4', '8'],
    taxFilingStatus: 'married_filing_jointly',
    financialRole: 'spouse_handled_all',
    accountVisibility: 'partial_visibility',
    fearOfHiddenAssets: true,
    primaryConcerns: [
      'keeping_marital_home',
      'discovering_hidden_accounts',
      'securing_spousal_support'
    ],
    safetyDiscreetMode: true
  });

  const handleChildrenCountChange = (count) => {
    const numCount = Math.max(0, Math.min(10, Number(count) || 0));
    setFormData((prev) => {
      const currentAges = [...(prev.childrenAges || [])];
      const newAges = [];
      for (let i = 0; i < numCount; i++) {
        newAges.push(currentAges[i] !== undefined ? currentAges[i] : '');
      }
      return {
        ...prev,
        childrenCount: numCount,
        hasChildren: numCount > 0,
        childrenAges: newAges
      };
    });
  };

  const handleChildAgeChange = (index, ageValue) => {
    setFormData((prev) => {
      const newAges = [...(prev.childrenAges || [])];
      newAges[index] = ageValue;
      return {
        ...prev,
        childrenAges: newAges
      };
    });
  };

  const handleConcernToggle = (concernKey) => {
    setFormData((prev) => {
      const exists = prev.primaryConcerns.includes(concernKey);
      return {
        ...prev,
        primaryConcerns: exists
          ? prev.primaryConcerns.filter((c) => c !== concernKey)
          : [...prev.primaryConcerns, concernKey]
      };
    });
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    try {
      await saveOnboardingProfile(formData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving onboarding data:', err);
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span>Step {step} of 5: {
            step === 1 ? 'Primary Goal & Marital Status' :
            step === 2 ? 'Legal Context & Duration' :
            step === 3 ? 'Children & Dependents' :
            step === 4 ? 'Tax Filing & Financial Control' : 'Priorities & Privacy Setup'
          }</span>
          <span className="text-brand-700 font-bold">{step * 20}% Completed</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-brand-700 h-full transition-all duration-300 rounded-full"
            style={{ width: `${step * 20}%` }}
          />
        </div>
      </div>

      <div className="bg-white border border-brand-200/80 rounded-3xl p-6 sm:p-10 shadow-lg">
        {/* Step 1: Goal & Marital Status */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-brand-700 text-xs font-semibold uppercase tracking-wider">
                <Target className="w-4 h-4" />
                <span>Intent & Marital Status</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                What do you want out of Ruth AI?
              </h2>
              <p className="text-sm text-slate-500">
                We tailor your financial tools, document checklists, and guidance based on your starting point.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  What is your primary goal today?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'understanding_rights', title: 'Understand My Rights', desc: 'Explore community property, support & financial entitlements.' },
                    { id: 'preparing_divorce', title: 'Prepare for Divorce', desc: 'Organize files, asset lists, and lawyer consultation briefs.' },
                    { id: 'exploring_separation', title: 'Explore Legal Separation', desc: 'Determine baseline costs and temporary financial support.' },
                    { id: 'uncovering_assets', title: 'Uncover Hidden Accounts', desc: 'Trace tax returns (Schedule B) & unlisted assets.' },
                    { id: 'general_education', title: 'General Financial Clarity', desc: 'Build independent credit and long-term financial safety.' }
                  ].map((g) => (
                    <button
                      type="button"
                      key={g.id}
                      onClick={() => setFormData({ ...formData, goal: g.id })}
                      className={`text-left p-3.5 rounded-xl border transition ${
                        formData.goal === g.id
                          ? 'border-brand-600 bg-brand-50/60 text-slate-900 ring-1 ring-brand-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="text-sm font-semibold">{g.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  What is your current marital status or divorce intent?
                </label>
                <div className="space-y-2.5">
                  {[
                    { id: 'married_considering_divorce', label: 'Married — Looking to get divorced / considering separation', badge: 'Active Planning' },
                    { id: 'married', label: 'Married — Gathering information & exploring options', badge: 'Exploring' },
                    { id: 'legally_separated', label: 'Legally Separated — Untangling joint assets & accounts', badge: 'Separated' },
                    { id: 'divorced', label: 'Divorced — Rebuilding solo & managing court decree', badge: 'Post-Divorce' }
                  ].map((st) => (
                    <div
                      key={st.id}
                      onClick={() => setFormData({ ...formData, maritalStatus: st.id })}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        formData.maritalStatus === st.id
                          ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-500 text-slate-900 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="text-xs sm:text-sm">{st.label}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-800 border border-brand-200">
                        {st.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Legal Context & Timeline */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-brand-700 text-xs font-semibold uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>Jurisdiction & Marriage Duration</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Where are you filing, and how long have you been married?
              </h2>
              <p className="text-sm text-slate-500">
                Divorce rules differ radically between Community Property states (50/50 split) and Equitable Distribution states.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select State Jurisdiction
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {US_STATES.map((st) => (
                    <button
                      type="button"
                      key={st.name}
                      onClick={() => setFormData({ ...formData, stateJurisdiction: st.name })}
                      className={`text-left p-3.5 rounded-xl border transition ${
                        formData.stateJurisdiction === st.name
                          ? 'border-brand-600 bg-brand-50/50 text-slate-900 font-semibold ring-1 ring-brand-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="text-sm">{st.name}</div>
                      <div className="text-xs text-brand-600 font-medium">{st.type}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Years of Marriage
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.marriageLengthYears}
                  onChange={(e) => setFormData({ ...formData, marriageLengthYears: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 font-mono"
                />
                {Number(formData.marriageLengthYears) >= 10 ? (
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      <strong>Long-Duration Marriage Threshold Met (10+ Years):</strong> Under California Family Code § 4336, courts retain jurisdiction over spousal support indefinitely unless agreed otherwise.
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">Marriages under 10 years typically receive spousal support for half the length of marriage.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Children & Dynamic Ages */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-brand-700 text-xs font-semibold uppercase tracking-wider">
                <Baby className="w-4 h-4" />
                <span>Household & Minor Children</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Do you have children together?
              </h2>
              <p className="text-sm text-slate-500">
                Child ages impact statutory child support guidelines, custody schedules, and health insurance obligations.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <span className="text-xs font-bold text-slate-800">Do you have children together?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        hasChildren: true,
                        childrenCount: prev.childrenCount > 0 ? prev.childrenCount : 1,
                        childrenAges: prev.childrenAges.length > 0 ? prev.childrenAges : ['4']
                      }));
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      formData.hasChildren
                        ? 'bg-brand-700 text-white shadow'
                        : 'bg-white border border-slate-300 text-slate-700'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        hasChildren: false,
                        childrenCount: 0,
                        childrenAges: []
                      }));
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      !formData.hasChildren
                        ? 'bg-brand-700 text-white shadow'
                        : 'bg-white border border-slate-300 text-slate-700'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {formData.hasChildren && (
                <div className="space-y-4 p-5 rounded-2xl border border-brand-200 bg-brand-50/30">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Number of Children
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.childrenCount}
                      onChange={(e) => handleChildrenCountChange(e.target.value)}
                      className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 font-mono bg-white"
                    />
                  </div>

                  {formData.childrenCount > 0 && (
                    <div className="space-y-3 pt-2 border-t border-brand-200/60">
                      <label className="block text-xs font-bold text-slate-700">
                        Enter Age for Each Child:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Array.from({ length: formData.childrenCount }).map((_, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                              Child {idx + 1} Age:
                            </span>
                            <input
                              type="number"
                              min="0"
                              max="25"
                              placeholder="e.g. 8"
                              value={formData.childrenAges[idx] !== undefined ? formData.childrenAges[idx] : ''}
                              onChange={(e) => handleChildAgeChange(idx, e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Tax Filing & Financial Dynamics */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-brand-700 text-xs font-semibold uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>Tax Return Status & Financial Control</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                How have tax returns and finances been managed?
              </h2>
              <p className="text-sm text-slate-500">
                Tax returns are the #1 goldmine for uncovering hidden bank accounts, dividends, and undisclosed brokerage funds.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  How did you file your recent tax returns?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'married_filing_jointly', title: 'Married Filing Jointly', desc: 'Form 1040 Schedule B tracing available.' },
                    { id: 'married_filing_separately', title: 'Married Filing Separately', desc: 'Individual Form 1040 returns.' },
                    { id: 'head_of_household', title: 'Head of Household', desc: 'Filing with dependents.' },
                    { id: 'single', title: 'Single / Separate', desc: 'Individual tax status.' }
                  ].map((tx) => (
                    <button
                      type="button"
                      key={tx.id}
                      onClick={() => setFormData({ ...formData, taxFilingStatus: tx.id })}
                      className={`text-left p-3.5 rounded-xl border transition ${
                        formData.taxFilingStatus === tx.id
                          ? 'border-brand-600 bg-brand-50/60 text-slate-900 ring-1 ring-brand-500 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="text-sm">{tx.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{tx.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Household Financial Management Dynamic
                </label>
                {[
                  {
                    id: 'spouse_handled_all',
                    title: 'Spouse managed everything',
                    desc: 'He filed taxes, managed investments, and handled passwords. I had little or no access.'
                  },
                  {
                    id: 'shared_daily_expenses_only',
                    title: 'I managed daily groceries & kids',
                    desc: 'I saw the checking account, but big retirement funds, properties, and loans were handled by him.'
                  },
                  {
                    id: 'equal_partnership',
                    title: 'We handled finances jointly',
                    desc: 'Both names are on accounts, but I want to verify no undisclosed accounts exist.'
                  }
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setFormData({ ...formData, financialRole: opt.id })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition mb-2.5 ${
                      formData.financialRole === opt.id
                        ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 text-sm">{opt.title}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{opt.desc}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.fearOfHiddenAssets}
                    onChange={(e) => setFormData({ ...formData, fearOfHiddenAssets: e.target.checked })}
                    className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500 rounded border-slate-300"
                  />
                  <div>
                    <span className="font-semibold text-xs text-amber-950 block">
                      Enable Gemini Hidden Account Discovery Flags
                    </span>
                    <span className="text-xs text-amber-900/80">
                      Cross-reference tax return interest schedules (Form 1040 Schedule B) to spot undeclared brokerage accounts or unusual bank transfers.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Priorities & Discreet Privacy Setup */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-brand-700 text-xs font-semibold uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4" />
                <span>Immediate Priorities & Privacy Setup</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Select your top priorities and confirm safety setup.
              </h2>
              <p className="text-sm text-slate-500">
                Ruth AI will customize your dashboard, legal briefs, and advisor chat using these preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { id: 'keeping_marital_home', label: 'Keeping the marital home (affordability test)' },
                { id: 'discovering_hidden_accounts', label: 'Uncovering hidden accounts or undisclosed debt' },
                { id: 'securing_spousal_support', label: 'Spousal support (alimony) calculation & duration' },
                { id: 'protecting_retirement_share', label: 'Dividing 401(k), IRA & pensions via QDRO' },
                { id: 'child_support_costs', label: 'Child custody support & healthcare coverage' },
                { id: 'establishing_credit', label: 'Building independent credit in my own name' },
                { id: 'lawyer_prep_brief', label: 'Preparing an organized brief before hiring a lawyer' }
              ].map((item) => {
                const isSelected = formData.primaryConcerns.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleConcernToggle(item.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/50 text-slate-900 ring-1 ring-brand-500'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className={`mt-0.5 rounded-full p-0.5 ${isSelected ? 'text-brand-700' : 'text-slate-300'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium leading-snug">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                <div className="text-xs text-emerald-900">
                  <strong>Always-Active Quick Safe Exit:</strong> Pressing ESC or clicking the top bar immediately redirects your tab to Weather.com.
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs text-slate-700">
                <div className="font-semibold text-slate-900">Summary of Your Initial Profile:</div>
                <ul className="space-y-1 text-slate-600">
                  <li>• <strong>Goal & Status:</strong> {formData.goal.replace(/_/g, ' ')} ({formData.maritalStatus.replace(/_/g, ' ')})</li>
                  <li>• <strong>Jurisdiction & Duration:</strong> {formData.stateJurisdiction} — {formData.marriageLengthYears} years</li>
                  <li>• <strong>Children:</strong> {formData.hasChildren ? `${formData.childrenCount} child(ren) (Ages: ${formData.childrenAges.join(', ') || 'N/A'})` : 'No minor children'}</li>
                  <li>• <strong>Tax Status:</strong> {formData.taxFilingStatus.replace(/_/g, ' ')}</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow transition"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleFinish}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm px-7 py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              <span>{isSyncing ? 'Creating Workspace...' : 'Launch Your Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
