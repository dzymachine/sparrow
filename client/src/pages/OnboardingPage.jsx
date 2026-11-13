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
                <label className="block text-base font-bold text-slate-900 mb-2">
                  What is your primary goal today?
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm transition cursor-pointer"
                >
                  <option value="understanding_rights">Understand My Rights</option>
                  <option value="preparing_divorce">Prepare for Divorce</option>
                  <option value="exploring_separation">Explore Legal Separation</option>
                  <option value="uncovering_assets">Uncover Hidden Accounts</option>
                  <option value="general_education">General Financial Clarity</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="block text-base font-bold text-slate-900 mb-2">
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
                <label className="block text-base font-bold text-slate-900 mb-2">
                  Select State Jurisdiction
                </label>
                <select
                  value={formData.stateJurisdiction}
                  onChange={(e) => setFormData({ ...formData, stateJurisdiction: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm transition cursor-pointer"
                >
                  {US_STATES.map((st) => (
                    <option key={st.name} value={st.name}>
                      {st.name} — {st.type}
                    </option>
                  ))}
                </select>
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
                  className="w-28 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 font-mono bg-white shadow-sm"
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

            <div className="space-y-6 pt-2">
              {/* Question 1: Children Toggle */}
              <div>
                <label className="block text-base font-bold text-slate-900 mb-2">
                  Do you have children together?
                </label>
                <div className="flex gap-3">
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
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition ${
                      formData.hasChildren
                        ? 'bg-brand-700 text-white shadow-sm ring-2 ring-brand-700'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
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
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition ${
                      !formData.hasChildren
                        ? 'bg-brand-700 text-white shadow-sm ring-2 ring-brand-700'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Question 2: Number of Children */}
              {formData.hasChildren && (
                <div className="pt-2">
                  <label className="block text-base font-bold text-slate-900 mb-2">
                    Number of Children
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.childrenCount}
                    onChange={(e) => handleChildrenCountChange(e.target.value)}
                    className="w-28 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 font-mono bg-white shadow-sm"
                  />
                </div>
              )}

              {/* Question 3: Ages for Each Child */}
              {formData.hasChildren && formData.childrenCount > 0 && (
                <div className="pt-2">
                  <label className="block text-base font-bold text-slate-900 mb-2">
                    Enter Age for Each Child:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: formData.childrenCount }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-700 min-w-[90px]">
                          Child {idx + 1} Age:
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="25"
                          placeholder="e.g. 8"
                          value={formData.childrenAges[idx] !== undefined ? formData.childrenAges[idx] : ''}
                          onChange={(e) => handleChildAgeChange(idx, e.target.value)}
                          className="w-28 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 font-mono bg-white shadow-sm"
                        />
                      </div>
                    ))}
                  </div>
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
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-base font-bold text-slate-900 mb-2">
                  How did you file your recent tax returns?
                </label>
                <select
                  value={formData.taxFilingStatus}
                  onChange={(e) => setFormData({ ...formData, taxFilingStatus: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm transition cursor-pointer"
                >
                  <option value="married_filing_jointly">Married Filing Jointly</option>
                  <option value="married_filing_separately">Married Filing Separately</option>
                  <option value="head_of_household">Head of Household</option>
                  <option value="single">Single / Separate</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="block text-base font-bold text-slate-900 mb-2">
                  Household Financial Management Dynamic
                </label>
                <select
                  value={formData.financialRole}
                  onChange={(e) => setFormData({ ...formData, financialRole: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm transition cursor-pointer"
                >
                  <option value="spouse_handled_all">Spouse managed everything (little or no access)</option>
                  <option value="shared_daily_expenses_only">Managed daily expenses only (checking account)</option>
                  <option value="equal_partnership">Handled finances jointly (equal visibility)</option>
                </select>
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

        {/* Step 5: Privacy Setup & Profile Summary */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-brand-700 text-xs font-semibold uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4" />
                <span>Privacy & Setup Summary</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Confirm your profile and safety setup.
              </h2>
              <p className="text-sm text-slate-500">
                Ruth AI will customize your dashboard, legal briefs, and advisor chat using this initial profile.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                <div className="text-xs text-emerald-900">
                  <strong>Always-Active Quick Safe Exit:</strong> Pressing ESC or clicking the top bar immediately redirects your tab to Weather.com.
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-sm text-slate-700 shadow-sm">
                <div className="font-bold text-slate-900 text-base border-b border-slate-200/80 pb-2">
                  Summary of Your Initial Profile
                </div>
                <ul className="space-y-2 text-slate-600 pt-1">
                  <li>• <strong>Primary Goal:</strong> {formData.goal.replace(/_/g, ' ')}</li>
                  <li>• <strong>Marital Status / Intent:</strong> {formData.maritalStatus.replace(/_/g, ' ')}</li>
                  <li>• <strong>Jurisdiction & Duration:</strong> {formData.stateJurisdiction} — {formData.marriageLengthYears} year(s)</li>
                  <li>• <strong>Children:</strong> {formData.hasChildren ? `${formData.childrenCount} child(ren) ${formData.childrenAges.length ? `(Ages: ${formData.childrenAges.join(', ')})` : ''}` : 'No minor children'}</li>
                  <li>• <strong>Tax Return Filing Status:</strong> {formData.taxFilingStatus.replace(/_/g, ' ')}</li>
                  <li>• <strong>Financial Dynamic:</strong> {formData.financialRole.replace(/_/g, ' ')}</li>
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
