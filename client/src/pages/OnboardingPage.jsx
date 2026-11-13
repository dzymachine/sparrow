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
  Sparkles
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
    stateJurisdiction: 'California',
    marriageLengthYears: 15,
    hasChildren: true,
    childrenCount: 2,
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
    if (step < 4) {
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
          <span>Step {step} of 4: {
            step === 1 ? 'Legal Context & Household' :
            step === 2 ? 'Financial Dynamics' :
            step === 3 ? 'Priorities & Entitlements' : 'Privacy & Safety'
          }</span>
          <span className="text-brand-700 font-bold">{step * 25}% Completed</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-brand-700 h-full transition-all duration-300 rounded-full"
            style={{ width: `${step * 25}%` }}
          />
        </div>
      </div>

      <div className="bg-white border border-brand-200/80 rounded-3xl p-6 sm:p-10 shadow-lg">
        {/* Step 1: Legal Context */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-brand-700 text-xs font-semibold uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>Jurisdiction & Household</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Where are you filing, and what does your household look like?
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Years of Marriage
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.marriageLengthYears}
                    onChange={(e) => setFormData({ ...formData, marriageLengthYears: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Marriages 10+ years often trigger long-term support rights.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Number of Children / Dependents
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.childrenCount}
                    onChange={(e) => setFormData({ ...formData, childrenCount: Number(e.target.value), hasChildren: Number(e.target.value) > 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Directly impacts child support calculations and custody costs.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Financial Role */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-brand-700 text-xs font-semibold uppercase tracking-wider">
                <Coins className="w-4 h-4" />
                <span>Financial Dynamics</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                How were marital finances handled in your household?
              </h2>
              <p className="text-sm text-slate-500">
                There is zero judgment here. Most women in divorce were never given full access to the family accounts.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Select the statement that best describes your situation:
              </label>

              {[
                {
                  id: 'spouse_handled_all',
                  title: 'Spouse managed everything',
                  desc: 'He filed the taxes, managed investments, and handled the passwords. I had little or no visibility.'
                },
                {
                  id: 'shared_daily_expenses_only',
                  title: 'I managed daily household groceries & kids',
                  desc: 'I saw the checking account, but big retirement funds, properties, and loans were handled by him.'
                },
                {
                  id: 'equal_partnership',
                  title: 'We handled finances jointly',
                  desc: 'Both names are on accounts, but I want to verify that no hidden debts or accounts were opened.'
                }
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, financialRole: opt.id })}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    formData.financialRole === opt.id
                      ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900 text-sm">{opt.title}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{opt.desc}</div>
                </div>
              ))}

              <div className="pt-4">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.fearOfHiddenAssets}
                    onChange={(e) => setFormData({ ...formData, fearOfHiddenAssets: e.target.checked })}
                    className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500 rounded border-slate-300"
                  />
                  <div>
                    <span className="font-semibold text-xs text-amber-950 block">
                      Enable Gemini Hidden Account Discovery flags
                    </span>
                    <span className="text-xs text-amber-900/80">
                      Cross-reference tax return interest schedules (Form 1040 Schedule B) to spot undeclared accounts or unusual transfers.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Priorities & Entitlements */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-brand-700 text-xs font-semibold uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4" />
                <span>Immediate Priorities</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                What are your biggest financial priorities and questions?
              </h2>
              <p className="text-sm text-slate-500">
                Select all that apply. Ruth AI will customize your dashboard and lawyer prep questions accordingly.
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
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition ${
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
          </div>
        )}

        {/* Step 4: Safety & Privacy */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-brand-700 text-xs font-semibold uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                <span>Discreet Safety Setup</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Your privacy and physical safety come first.
              </h2>
              <p className="text-sm text-slate-500">
                In contentious or abusive divorces, digital safety is critical.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-emerald-900 text-sm">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <span>Always-Active Quick Safe Exit</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  The top orange safety bar remains visible on every page. Clicking it or pressing ESC immediately replaces your tab with Weather.com.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-900 text-sm">Summary of your setup:</div>
                <ul className="text-xs text-slate-600 space-y-1.5">
                  <li>• <strong>Jurisdiction:</strong> {formData.stateJurisdiction}</li>
                  <li>• <strong>Duration:</strong> {formData.marriageLengthYears} years ({formData.hasChildren ? `${formData.childrenCount} children` : 'No dependents'})</li>
                  <li>• <strong>Financial Dynamic:</strong> {formData.financialRole.replace(/_/g, ' ')}</li>
                  <li>• <strong>Active Priorities:</strong> {formData.primaryConcerns.length} selected</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>Your Ruth AI agent memory will now be seeded with this context.</span>
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

          {step < 4 ? (
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
