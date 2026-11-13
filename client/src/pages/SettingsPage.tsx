import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Database,
  Loader2,
  Save,
  ChevronDown,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgentMemory } from '../context/AgentMemoryContext';

const US_STATES = [
  'California',
  'New York',
  'Texas',
  'Florida',
  'Illinois',
  'Washington',
  'Massachusetts',
  'Colorado',
  'Other'
];

const INTAKE_STATES = [
  'California',
  'New York',
  'Texas',
  'Florida',
  'Illinois',
  'Washington',
  'Other State'
];

const CONCERN_OPTIONS = [
  { id: 'keeping_marital_home', label: 'Keeping the marital home' },
  { id: 'discovering_hidden_accounts', label: 'Discovering hidden accounts' },
  { id: 'securing_spousal_support', label: 'Securing spousal support' },
  { id: 'child_custody_support', label: 'Child custody & support' },
  { id: 'retirement_qdro', label: 'Retirement & 401(k) split (QDRO)' },
  { id: 'debt_protection', label: 'Protecting from spouse debt' }
];

type SectionKey = 'account' | 'login' | 'intake';

export default function SettingsPage() {
  const {
    currentUser,
    userProfile,
    isFirebaseLive,
    updateAccountProfile,
    updateLoginCredentials
  } = useAuth() as any;

  const { profile: intakeContextProfile, saveOnboardingProfile } = useAgentMemory() as any;

  // Collapsible section state
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    account: true,
    login: false,
    intake: false
  });

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Account info form state
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [stateVal, setStateVal] = useState('California');
  const [city, setCity] = useState('');
  const [preferredContact, setPreferredContact] = useState('email');
  const [discreetNotifications, setDiscreetNotifications] = useState(true);
  const [defaultDiscreetMode, setDefaultDiscreetMode] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Login / security form state
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingLogin, setSavingLogin] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Intake form state
  const [intakeData, setIntakeData] = useState({
    goal: 'pursuing_divorce',
    stateJurisdiction: 'California',
    marriageLengthYears: 10,
    hasChildren: false,
    childrenCount: 0,
    divorcePathway: 'unsure',
    hasPrenup: 'no',
    ownsHome: false,
    hasRetirementAccounts: true,
    needsFeeWaiver: false,
    needsProtectiveOrder: false,
    financialRole: 'shared_finances',
    accountVisibility: 'partial_visibility',
    fearOfHiddenAssets: false,
    primaryConcerns: [] as string[],
    safetyDiscreetMode: true
  });

  const [savingIntake, setSavingIntake] = useState(false);
  const [intakeFeedback, setIntakeFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setDisplayName(userProfile?.displayName ?? currentUser?.displayName ?? '');
    setPhone(userProfile?.phone ?? '');
    setStateVal(userProfile?.state ?? 'California');
    setCity(userProfile?.city ?? '');
    setPreferredContact(userProfile?.preferredContact ?? 'email');
    setDiscreetNotifications(userProfile?.discreetNotifications ?? true);
    setDefaultDiscreetMode(userProfile?.defaultDiscreetMode ?? false);
    setNewEmail(currentUser?.email ?? userProfile?.email ?? '');
  }, [currentUser, userProfile]);

  useEffect(() => {
    const src = intakeContextProfile || userProfile?.intakeProfile;
    if (src) {
      setIntakeData((prev) => ({
        ...prev,
        goal: src.goal ?? prev.goal,
        stateJurisdiction: src.stateJurisdiction ?? prev.stateJurisdiction,
        marriageLengthYears: src.marriageLengthYears ?? prev.marriageLengthYears,
        hasChildren: src.hasChildren ?? prev.hasChildren,
        childrenCount: src.childrenCount ?? prev.childrenCount,
        divorcePathway: src.divorcePathway ?? prev.divorcePathway,
        hasPrenup: src.hasPrenup ?? prev.hasPrenup,
        ownsHome: src.ownsHome ?? prev.ownsHome,
        hasRetirementAccounts: src.hasRetirementAccounts ?? prev.hasRetirementAccounts,
        needsFeeWaiver: src.needsFeeWaiver ?? prev.needsFeeWaiver,
        needsProtectiveOrder: src.needsProtectiveOrder ?? prev.needsProtectiveOrder,
        financialRole: src.financialRole ?? prev.financialRole,
        accountVisibility: src.accountVisibility ?? prev.accountVisibility,
        fearOfHiddenAssets: src.fearOfHiddenAssets ?? prev.fearOfHiddenAssets,
        primaryConcerns: Array.isArray(src.primaryConcerns) ? src.primaryConcerns : prev.primaryConcerns,
        safetyDiscreetMode: src.safetyDiscreetMode ?? prev.safetyDiscreetMode
      }));
    }
  }, [intakeContextProfile, userProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);
    setSavingProfile(true);
    try {
      const res = await updateAccountProfile({
        displayName,
        phone,
        state: stateVal,
        city,
        preferredContact,
        discreetNotifications,
        defaultDiscreetMode
      });
      setProfileFeedback({
        type: 'success',
        text: res?.persistedToFirebase
          ? 'Account information saved to Firebase.'
          : 'Account information saved locally (demo/dev mode).'
      });
    } catch (err: any) {
      setProfileFeedback({
        type: 'error',
        text: err?.message || 'Failed to update account information.'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginFeedback(null);

    if (newPassword && newPassword.length < 6) {
      setLoginFeedback({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setLoginFeedback({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSavingLogin(true);
    try {
      const res = await updateLoginCredentials({
        newEmail,
        currentPassword,
        newPassword
      });

      if (!res?.updated) {
        setLoginFeedback({ type: 'error', text: 'No email or password changes to save.' });
      } else {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setLoginFeedback({
          type: 'success',
          text: res?.persistedToFirebase
            ? 'Login credentials updated in Firebase.'
            : 'Login info updated locally (demo/dev mode).'
        });
      }
    } catch (err: any) {
      let msg = err?.message || 'Failed to update login credentials.';
      if (err?.code === 'auth/requires-recent-login') {
        msg = 'For security, please enter your current password to update email or password.';
      } else if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        msg = 'Current password is incorrect.';
      }
      setLoginFeedback({ type: 'error', text: msg });
    } finally {
      setSavingLogin(false);
    }
  };

  const handleConcernToggle = (concernId: string) => {
    setIntakeData((prev) => {
      const exists = prev.primaryConcerns.includes(concernId);
      return {
        ...prev,
        primaryConcerns: exists
          ? prev.primaryConcerns.filter((c) => c !== concernId)
          : [...prev.primaryConcerns, concernId]
      };
    });
  };

  const handleSaveIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntakeFeedback(null);
    setSavingIntake(true);
    try {
      if (saveOnboardingProfile) {
        await saveOnboardingProfile(intakeData);
      }
      const res = await updateAccountProfile({
        state: intakeData.stateJurisdiction,
        intakeProfile: intakeData
      });
      setIntakeFeedback({
        type: 'success',
        text: res?.persistedToFirebase
          ? 'Intake profile updated & synced to Firebase and checklist.'
          : 'Intake profile updated & checklist refreshed.'
      });
    } catch (err: any) {
      setIntakeFeedback({
        type: 'error',
        text: err?.message || 'Failed to save intake profile.'
      });
    } finally {
      setSavingIntake(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1c1c19] tracking-tight">Settings</h1>
            <p className="text-sm text-[#5F635E] mt-1">
              Expand any section below to manage your account, login credentials, or intake profile.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#FFFFFF] border border-[#4F5E47]/10 text-[#5F635E] shadow-serene self-start sm:self-auto">
            <Database className="w-3.5 h-3.5 text-[#4F5E47]" />
            <span>{isFirebaseLive ? 'Synced with Firebase DB' : 'Local / Demo Mode'}</span>
          </div>
        </div>

        {/* 1. Collapsible: Account Information */}
        <div className="bg-[#FFFFFF] border border-[#4F5E47]/10 rounded-2xl shadow-serene overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('account')}
            aria-expanded={openSections.account}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F4EFEA]/60 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EDE6DD] flex items-center justify-center text-[#4F5E47]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-normal text-[#1c1c19]">Account Information</h2>
                <p className="text-xs text-[#5F635E]">
                  Name, contact details, jurisdiction, and privacy preferences
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-[#5F635E] transition-transform duration-200 ${
                openSections.account ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.account && (
            <form onSubmit={handleSaveProfile} className="px-6 pb-6 pt-2 border-t border-[#E2DAD0]/70 space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    State / Jurisdiction
                  </label>
                  <select
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    className="w-full text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  >
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. San Francisco"
                    className="w-full text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    Preferred Contact Method
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['email', 'phone', 'in-app'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPreferredContact(method)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition capitalize ${
                          preferredContact === method
                            ? 'bg-[#4F5E47] text-[#FAF7F2] border-[#4F5E47]'
                            : 'bg-[#FAF7F2] text-[#5F635E] border-[#E2DAD0] hover:border-[#8A9A7B]'
                        }`}
                      >
                        {method === 'in-app' ? 'In-App Only' : method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Privacy Preferences */}
              <div className="pt-3 border-t border-[#E2DAD0]/70 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1c1c19]">
                  <Shield className="w-3.5 h-3.5 text-[#4F5E47]" />
                  <span>Privacy Preferences</span>
                </div>

                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-sm text-[#1c1c19] font-medium">Discreet notifications</p>
                    <p className="text-xs text-[#5F635E]">
                      Use neutral phrasing without legal or divorce keywords.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={discreetNotifications}
                    onChange={(e) => setDiscreetNotifications(e.target.checked)}
                    className="h-4 w-4 accent-[#4F5E47] rounded"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-sm text-[#1c1c19] font-medium">Default to Discreet Mode</p>
                    <p className="text-xs text-[#5F635E]">
                      Mask sensitive dollar amounts when opening your dashboard.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={defaultDiscreetMode}
                    onChange={(e) => setDefaultDiscreetMode(e.target.checked)}
                    className="h-4 w-4 accent-[#4F5E47] rounded"
                  />
                </label>
              </div>

              {profileFeedback && (
                <div
                  className={`flex items-center gap-2 text-xs px-3.5 py-2.5 rounded-xl border ${
                    profileFeedback.type === 'success'
                      ? 'bg-[#F5F7F3] text-[#384631] border-[#8A9A7B]/50'
                      : 'bg-[#FAF2F0] text-[#A86851] border-[#D9B3AC]'
                  }`}
                >
                  {profileFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{profileFeedback.text}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 bg-[#4F5E47] hover:bg-[#384631] disabled:opacity-50 text-[#FAF7F2] text-xs font-medium px-5 py-2.5 rounded-xl transition"
                >
                  {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savingProfile ? 'Saving...' : 'Save Account Info'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 2. Collapsible: Login & Security */}
        <div className="bg-[#FFFFFF] border border-[#4F5E47]/10 rounded-2xl shadow-serene overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('login')}
            aria-expanded={openSections.login}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F4EFEA]/60 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EDE6DD] flex items-center justify-center text-[#4F5E47]">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-normal text-[#1c1c19]">Login &amp; Security</h2>
                <p className="text-xs text-[#5F635E]">
                  Update your sign-in email or password
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-[#5F635E] transition-transform duration-200 ${
                openSections.login ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.login && (
            <form onSubmit={handleSaveLogin} className="px-6 pb-6 pt-2 border-t border-[#E2DAD0]/70 space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    Current Password <span className="text-[#5F635E]/80 font-normal">(required for live Firebase changes)</span>
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  />
                </div>
              </div>

              {loginFeedback && (
                <div
                  className={`flex items-center gap-2 text-xs px-3.5 py-2.5 rounded-xl border ${
                    loginFeedback.type === 'success'
                      ? 'bg-[#F5F7F3] text-[#384631] border-[#8A9A7B]/50'
                      : 'bg-[#FAF2F0] text-[#A86851] border-[#D9B3AC]'
                  }`}
                >
                  {loginFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{loginFeedback.text}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingLogin}
                  className="inline-flex items-center gap-2 bg-[#4F5E47] hover:bg-[#384631] disabled:opacity-50 text-[#FAF7F2] text-xs font-medium px-5 py-2.5 rounded-xl transition"
                >
                  {savingLogin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{savingLogin ? 'Updating...' : 'Update Login Info'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 3. Collapsible: Intake Form */}
        <div className="bg-[#FFFFFF] border border-[#4F5E47]/10 rounded-2xl shadow-serene overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('intake')}
            aria-expanded={openSections.intake}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F4EFEA]/60 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EDE6DD] flex items-center justify-center text-[#4F5E47]">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-normal text-[#1c1c19]">Intake Form &amp; Case Profile</h2>
                <p className="text-xs text-[#5F635E]">
                  Edit your legal context, household, financial visibility, and priorities
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-[#5F635E] transition-transform duration-200 ${
                openSections.intake ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.intake && (
            <form onSubmit={handleSaveIntake} className="px-6 pb-6 pt-2 border-t border-[#E2DAD0]/70 space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    Current Goal
                  </label>
                  <select
                    value={intakeData.goal}
                    onChange={(e) => setIntakeData({ ...intakeData, goal: e.target.value })}
                    className="w-full text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  >
                    <option value="pursuing_divorce">Pursuing a Divorce</option>
                    <option value="legal_separation">Legal Separation</option>
                    <option value="exploring_options">Just Exploring</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    Filing State / Jurisdiction
                  </label>
                  <select
                    value={intakeData.stateJurisdiction}
                    onChange={(e) => setIntakeData({ ...intakeData, stateJurisdiction: e.target.value })}
                    className="w-full text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  >
                    {INTAKE_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    Length of Marriage (years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={intakeData.marriageLengthYears}
                    onChange={(e) =>
                      setIntakeData({ ...intakeData, marriageLengthYears: Number(e.target.value) || 0 })
                    }
                    className="w-full text-sm font-mono bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    Divorce Pathway
                  </label>
                  <select
                    value={intakeData.divorcePathway}
                    onChange={(e) => setIntakeData({ ...intakeData, divorcePathway: e.target.value })}
                    className="w-full text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  >
                    <option value="unsure">Unsure / Deciding</option>
                    <option value="uncontested">Uncontested / Amicable</option>
                    <option value="mediation">Mediation</option>
                    <option value="contested">Contested / Litigation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    Who Handled Finances?
                  </label>
                  <select
                    value={intakeData.financialRole}
                    onChange={(e) => setIntakeData({ ...intakeData, financialRole: e.target.value })}
                    className="w-full text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  >
                    <option value="spouse_handled_all">My spouse handled most/all finances</option>
                    <option value="shared_finances">We shared financial management</option>
                    <option value="i_handled_all">I handled most/all finances</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    Account Visibility
                  </label>
                  <select
                    value={intakeData.accountVisibility}
                    onChange={(e) => setIntakeData({ ...intakeData, accountVisibility: e.target.value })}
                    className="w-full text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  >
                    <option value="full_visibility">Full visibility into all accounts</option>
                    <option value="partial_visibility">Partial visibility</option>
                    <option value="no_visibility">Little or no visibility</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F635E] mb-1.5">
                    Prenuptial Agreement
                  </label>
                  <select
                    value={intakeData.hasPrenup}
                    onChange={(e) => setIntakeData({ ...intakeData, hasPrenup: e.target.value })}
                    className="w-full text-sm bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3.5 py-2.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                    <option value="unsure">Unsure</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <label className="flex items-center gap-2 text-sm text-[#1c1c19] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={intakeData.hasChildren}
                      onChange={(e) =>
                        setIntakeData({
                          ...intakeData,
                          hasChildren: e.target.checked,
                          childrenCount: e.target.checked ? Math.max(1, intakeData.childrenCount) : 0
                        })
                      }
                      className="h-4 w-4 accent-[#4F5E47] rounded"
                    />
                    <span>Minor children</span>
                  </label>
                  {intakeData.hasChildren && (
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={intakeData.childrenCount}
                      onChange={(e) =>
                        setIntakeData({ ...intakeData, childrenCount: Number(e.target.value) || 1 })
                      }
                      aria-label="Number of children"
                      className="w-20 text-sm font-mono bg-[#FAF7F2] border border-[#E2DAD0] rounded-xl px-3 py-1.5 text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#A07E5F]/20 focus:border-[#A07E5F]"
                    />
                  )}
                </div>
              </div>

              {/* Household & Safety Flags */}
              <div className="pt-3 border-t border-[#E2DAD0]/70 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'ownsHome', label: 'Own marital home / real estate' },
                  { key: 'hasRetirementAccounts', label: '401(k), IRA, or pension accounts' },
                  { key: 'fearOfHiddenAssets', label: 'Concerned about hidden assets' },
                  { key: 'needsFeeWaiver', label: 'May need court fee waiver' },
                  { key: 'needsProtectiveOrder', label: 'Need protective order info' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2.5 text-xs text-[#2C332A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean((intakeData as any)[item.key])}
                      onChange={(e) =>
                        setIntakeData({ ...intakeData, [item.key]: e.target.checked })
                      }
                      className="h-4 w-4 accent-[#4F5E47] rounded"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              {/* Primary Concerns */}
              <div className="pt-3 border-t border-[#E2DAD0]/70">
                <label className="block text-xs font-medium text-[#5F635E] mb-2">
                  Primary Priorities &amp; Concerns
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONCERN_OPTIONS.map((c) => {
                    const selected = intakeData.primaryConcerns.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleConcernToggle(c.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                          selected
                            ? 'bg-[#4F5E47] text-[#FAF7F2] border-[#4F5E47]'
                            : 'bg-[#FAF7F2] text-[#5F635E] border-[#E2DAD0] hover:border-[#8A9A7B]'
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {intakeFeedback && (
                <div
                  className={`flex items-center gap-2 text-xs px-3.5 py-2.5 rounded-xl border ${
                    intakeFeedback.type === 'success'
                      ? 'bg-[#F5F7F3] text-[#384631] border-[#8A9A7B]/50'
                      : 'bg-[#FAF2F0] text-[#A86851] border-[#D9B3AC]'
                  }`}
                >
                  {intakeFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{intakeFeedback.text}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingIntake}
                  className="inline-flex items-center gap-2 bg-[#4F5E47] hover:bg-[#384631] disabled:opacity-50 text-[#FAF7F2] text-xs font-medium px-5 py-2.5 rounded-xl transition"
                >
                  {savingIntake ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savingIntake ? 'Saving Intake...' : 'Save Intake Form'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
