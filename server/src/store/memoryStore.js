/**
 * In-memory fallback and cache for user profiles and agent memory.
 * Ensures the application runs seamlessly out-of-the-box before
 * and alongside Firebase Firestore setup.
 */

const userProfiles = new Map();
const agentMemories = new Map();
const chatHistories = new Map();

// Seed default demo user for instant testing
const DEMO_USER_ID = 'demo-user-123';

userProfiles.set(DEMO_USER_ID, {
  userId: DEMO_USER_ID,
  email: 'demo.user@ruthai.org',
  displayName: 'Sarah',
  stateJurisdiction: 'California',
  marriageLengthYears: 18,
  hasChildren: true,
  childrenCount: 2,
  financialRole: 'spouse_managed_all',
  primaryConcerns: [
    'keeping_marital_home',
    'discovering_hidden_accounts',
    'securing_spousal_support',
    'protecting_retirement_share'
  ],
  estimatedHouseholdIncome: '$180,000+',
  employmentStatus: 'part_time_caregiver',
  safetyDiscreetMode: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

agentMemories.set(DEMO_USER_ID, {
  userId: DEMO_USER_ID,
  financialProfileSummary: "Married 18 years in California (Community Property). Primary caregiver, spouse handled all accounts and tax filings. Desires to keep home for children but uncertain about monthly affordability on post-divorce income.",
  discoveredAssets: [
    {
      id: 'ast-1',
      type: 'Real Estate',
      name: 'Primary Residence (San Diego)',
      estimatedValue: 850000,
      mortgageRemaining: 320000,
      monthlyPayment: 2850,
      status: 'Community Property - Valuation Required',
      flag: 'High single-income maintenance cost'
    },
    {
      id: 'ast-2',
      type: 'Retirement (401k)',
      name: 'Spouse Tech Corp 401(k)',
      estimatedValue: 420000,
      status: 'Subject to QDRO Division',
      flag: 'Requires formal Qualified Domestic Relations Order'
    },
    {
      id: 'ast-3',
      type: 'Potential Undisclosed Account',
      name: 'Schedule B Interest Line Item (Fidelity)',
      estimatedValue: 45000,
      sourceDocument: '2024 Joint Tax Return Form 1040, Page 2',
      status: 'Needs formal disclosure request',
      flag: 'Account not mentioned on voluntary asset sheet'
    }
  ],
  keyQuestionsForLawyer: [
    "Should I request a forensic trace on the Schedule B Fidelity interest income?",
    "If I buy out the house equity, how will I handle refinancing interest rates?",
    "What is the statutory spousal support formula for an 18-year marriage in CA?"
  ],
  lastUpdated: new Date().toISOString()
});

module.exports = {
  getUserProfile: (userId) => userProfiles.get(userId) || null,
  setUserProfile: (userId, data) => {
    const existing = userProfiles.get(userId) || {};
    const updated = {
      ...existing,
      ...data,
      userId,
      updatedAt: new Date().toISOString()
    };
    userProfiles.set(userId, updated);
    return updated;
  },
  getAgentMemory: (userId) => agentMemories.get(userId) || {
    userId,
    financialProfileSummary: 'New profile awaiting onboarding document discovery.',
    discoveredAssets: [],
    keyQuestionsForLawyer: [],
    lastUpdated: new Date().toISOString()
  },
  updateAgentMemory: (userId, memoryData) => {
    const existing = agentMemories.get(userId) || {
      userId,
      discoveredAssets: [],
      keyQuestionsForLawyer: []
    };
    const updated = {
      ...existing,
      ...memoryData,
      userId,
      lastUpdated: new Date().toISOString()
    };
    agentMemories.set(userId, updated);
    return updated;
  },
  getChatHistory: (userId) => chatHistories.get(userId) || [],
  appendChatMessage: (userId, message) => {
    const history = chatHistories.get(userId) || [];
    history.push({
      ...message,
      timestamp: new Date().toISOString()
    });
    chatHistories.set(userId, history);
    return history;
  },
  purgeUserMemory: (userId) => {
    agentMemories.delete(userId);
    chatHistories.delete(userId);
  }
};
