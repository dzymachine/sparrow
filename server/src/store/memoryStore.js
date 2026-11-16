/**
 * In-memory cache + Firebase Firestore persistence for user profiles,
 * agent memory, chat history, checklist progress, and document drafts.
 * Falls back seamlessly to in-memory storage when Firebase Admin is not configured.
 */
const firebaseAdmin = require('../config/firebaseAdmin');

const userProfiles = new Map();
const agentMemories = new Map();
const chatHistories = new Map();
const checklistProgress = new Map();
const documentDrafts = new Map();
const purgedUsers = new Set();

function sanitizeUserId(userId) {
  return String(userId || 'guest-user').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function isFirestoreReady() {
  return Boolean(firebaseAdmin.isConfigured() && firebaseAdmin.db);
}

async function writeFirestoreDoc(collection, userId, data, merge = false) {
  if (!isFirestoreReady()) return;
  try {
    const safeId = sanitizeUserId(userId);
    const ref = firebaseAdmin.db.collection(collection).doc(safeId);
    if (merge) {
      await ref.set(data, { merge: true });
    } else {
      await ref.set(data);
    }
  } catch (err) {
    console.warn(`[MemoryStore] Firestore write warning (${collection}/${userId}):`, err.message);
  }
}

async function readFirestoreDoc(collection, userId) {
  if (!isFirestoreReady()) return null;
  try {
    const safeId = sanitizeUserId(userId);
    const snap = await firebaseAdmin.db.collection(collection).doc(safeId).get();
    if (snap && snap.exists) {
      return snap.data() || null;
    }
  } catch (err) {
    console.warn(`[MemoryStore] Firestore read warning (${collection}/${userId}):`, err.message);
  }
  return null;
}

async function deleteFirestoreDoc(collection, userId) {
  if (!isFirestoreReady()) return;
  try {
    const safeId = sanitizeUserId(userId);
    await firebaseAdmin.db.collection(collection).doc(safeId).delete();
  } catch (err) {
    console.warn(`[MemoryStore] Firestore delete warning (${collection}/${userId}):`, err.message);
  }
}

// Seed default demo user for instant testing
const DEMO_USER_ID = 'demo-user-123';

userProfiles.set(DEMO_USER_ID, {
  userId: DEMO_USER_ID,
  email: 'demo.user@ruthai.org',
  displayName: 'Sarah',
  goal: 'pursuing_divorce',
  stateJurisdiction: 'California',
  marriageLengthYears: 18,
  hasChildren: true,
  childrenCount: 2,
  divorcePathway: 'contested_or_uncooperative',
  hasPrenup: 'no',
  ownsHome: true,
  hasRetirementAccounts: true,
  needsFeeWaiver: false,
  needsProtectiveOrder: false,
  financialRole: 'spouse_managed_all',
  fearOfHiddenAssets: true,
  primaryConcerns: [
    'keeping_marital_home',
    'discovering_hidden_accounts',
    'securing_spousal_support',
    'protecting_retirement_share'
  ],
  estimatedHouseholdIncome: '$180,000+',
  userGrossMonthlyIncome: 3200,
  spouseGrossMonthlyIncome: 13500,
  custodySharePercent: 65,
  monthlyLivingExpenses: 2400,
  monthlyDebtPayments: 350,
  totalDebts: 12000,
  healthInsuranceMonthlyCost: 480,
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

// Seed realistic lived-in account for Maya Lin (maya.lin@sparrow.demo)
const SEEDED_MAYA_ID = 'seeded-maya-lin';

userProfiles.set(SEEDED_MAYA_ID, {
  userId: SEEDED_MAYA_ID,
  email: 'maya.lin@sparrow.demo',
  displayName: 'Maya Lin',
  goal: 'pursuing_divorce',
  stateJurisdiction: 'California',
  marriageLengthYears: 12,
  hasChildren: true,
  childrenCount: 2,
  divorcePathway: 'collaborative_or_mediation',
  hasPrenup: 'no',
  ownsHome: true,
  hasRetirementAccounts: true,
  needsFeeWaiver: false,
  needsProtectiveOrder: false,
  financialRole: 'shared_but_spouse_led',
  fearOfHiddenAssets: true,
  primaryConcerns: [
    'keeping_marital_home',
    'discovering_hidden_accounts',
    'securing_spousal_support',
    'protecting_retirement_share'
  ],
  estimatedHouseholdIncome: '$220,000+',
  userGrossMonthlyIncome: 4500,
  spouseGrossMonthlyIncome: 14200,
  custodySharePercent: 60,
  monthlyLivingExpenses: 2600,
  monthlyDebtPayments: 420,
  totalDebts: 14500,
  healthInsuranceMonthlyCost: 520,
  estimatedRentIfSelling: 3400,
  employmentStatus: 'part_time_professional',
  safetyDiscreetMode: false,
  createdAt: '2026-10-18T14:20:00.000Z',
  updatedAt: new Date().toISOString()
});

agentMemories.set(SEEDED_MAYA_ID, {
  userId: SEEDED_MAYA_ID,
  financialProfileSummary: "Married 12 years in California (Community Property, >10-year long-duration marriage). Two children with 60% custody share. Exploring whether to keep the Oakland family home or sell and split equity.",
  discoveredAssets: [
    {
      id: 'maya-ast-1',
      type: 'Real Estate',
      name: 'Family Home (Oakland, CA)',
      estimatedValue: 920000,
      mortgageRemaining: 380000,
      monthlyPayment: 3150,
      status: 'Community Property - Valuation Complete',
      flag: 'Evaluate refinance vs. sale cash-flow impact'
    },
    {
      id: 'maya-ast-2',
      type: 'Retirement (401k)',
      name: 'Spouse Tech Corp 401(k)',
      estimatedValue: 485000,
      status: 'Subject to QDRO Division',
      flag: 'Requires Qualified Domestic Relations Order (QDRO)'
    },
    {
      id: 'maya-ast-3',
      type: 'Bank Account',
      name: 'Ally Joint High-Yield Savings',
      estimatedValue: 64000,
      status: 'Verified Community Liquid Cash',
      flag: 'Available for immediate transition buffer'
    },
    {
      id: 'maya-ast-4',
      type: 'Retirement (IRA)',
      name: 'Maya Vanguard Roth IRA',
      estimatedValue: 95000,
      status: 'Community Contribution Review',
      flag: 'Verify pre-marital balance if applicable'
    },
    {
      id: 'maya-ast-5',
      type: 'Potential Undisclosed Account',
      name: 'Charles Schwab Dividend Account (Schedule B)',
      estimatedValue: 52000,
      sourceDocument: '2024 Joint Form 1040 Schedule B',
      status: 'Needs formal FL-142 disclosure request',
      flag: 'Dividend income reported on tax return not yet on asset sheet'
    }
  ],
  keyQuestionsForLawyer: [
    "Can I use part of my QDRO / savings share to equalize the Oakland home buyout?",
    "How does California's 10+ year marriage rule affect spousal support duration?",
    "What documents do I need to subpoena for the Schedule B Schwab dividend account?"
  ],
  lastUpdated: new Date().toISOString()
});

chatHistories.set(SEEDED_MAYA_ID, [
  {
    role: 'user',
    text: 'We have been married 12 years in Oakland and have two kids. I earn $4,500/mo and my spouse earns $14,200/mo. Can I afford to keep our house?',
    timestamp: '2026-11-10T18:30:00.000Z'
  },
  {
    role: 'assistant',
    text: 'I\'ve saved your California 12-year marriage details, income figures, and Oakland home mortgage ($3,150/mo) into your Personal Wiki and Life Projection Engine. Because your marriage exceeds 10 years, California treats it as a long-duration marriage. Check your Post-Divorce Life Projection to compare keeping the home versus selling and investing your equity.',
    timestamp: '2026-11-10T18:30:05.000Z'
  }
]);

checklistProgress.set(SEEDED_MAYA_ID, {
  completedIds: ['fl-100', 'fl-110', 'fl-140', 'tax-returns-3yr', 'mortgage-statement'],
  notes: {
    'fl-140': 'Reviewed 2024 Form 1040 Schedule B; flagged Schwab dividend line item.',
    'mortgage-statement': 'Remaining principal $380,000 at 3.25% interest.'
  }
});

function getUserProfile(userId) {
  return userProfiles.get(userId) || null;
}

async function getUserProfileAsync(userId) {
  if (userProfiles.has(userId)) {
    return userProfiles.get(userId);
  }
  const remote = await readFirestoreDoc('users', userId);
  if (remote) {
    userProfiles.set(userId, remote);
    return remote;
  }
  return null;
}

function setUserProfile(userId, data) {
  const existing = userProfiles.get(userId) || {};
  const updated = {
    ...existing,
    ...data,
    userId,
    updatedAt: new Date().toISOString()
  };
  userProfiles.set(userId, updated);
  writeFirestoreDoc('users', userId, updated, true).catch(() => {});
  return updated;
}

async function setUserProfileAsync(userId, data) {
  const existing = (await getUserProfileAsync(userId)) || {};
  const updated = {
    ...existing,
    ...data,
    userId,
    updatedAt: new Date().toISOString()
  };
  userProfiles.set(userId, updated);
  await writeFirestoreDoc('users', userId, updated, true);
  return updated;
}

function defaultAgentMemory(userId) {
  return {
    userId,
    financialProfileSummary: 'New profile awaiting onboarding document discovery.',
    discoveredAssets: [],
    keyQuestionsForLawyer: [],
    lastUpdated: new Date().toISOString()
  };
}

function getAgentMemory(userId) {
  return agentMemories.get(userId) || defaultAgentMemory(userId);
}

async function getAgentMemoryAsync(userId) {
  if (agentMemories.has(userId) || purgedUsers.has(userId)) {
    return agentMemories.get(userId) || defaultAgentMemory(userId);
  }
  const remote = await readFirestoreDoc('agent_memories', userId);
  if (remote) {
    agentMemories.set(userId, remote);
    return remote;
  }
  return defaultAgentMemory(userId);
}

function updateAgentMemory(userId, memoryData) {
  purgedUsers.delete(userId);
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
  writeFirestoreDoc('agent_memories', userId, updated, false).catch(() => {});
  return updated;
}

async function updateAgentMemoryAsync(userId, memoryData) {
  purgedUsers.delete(userId);
  const existing = await getAgentMemoryAsync(userId);
  const updated = {
    ...existing,
    ...memoryData,
    userId,
    lastUpdated: new Date().toISOString()
  };
  agentMemories.set(userId, updated);
  await writeFirestoreDoc('agent_memories', userId, updated, false);
  return updated;
}

function getChatHistory(userId) {
  return chatHistories.get(userId) || [];
}

async function getChatHistoryAsync(userId) {
  if (chatHistories.has(userId) || purgedUsers.has(userId)) {
    return chatHistories.get(userId) || [];
  }
  const remote = await readFirestoreDoc('chat_histories', userId);
  if (remote && Array.isArray(remote.messages)) {
    chatHistories.set(userId, remote.messages);
    return remote.messages;
  }
  return [];
}

function appendChatMessage(userId, message) {
  purgedUsers.delete(userId);
  const history = chatHistories.get(userId) || [];
  history.push({
    ...message,
    timestamp: new Date().toISOString()
  });
  chatHistories.set(userId, history);
  writeFirestoreDoc('chat_histories', userId, {
    userId,
    messages: history,
    lastUpdated: new Date().toISOString()
  }, false).catch(() => {});
  return history;
}

async function appendChatMessageAsync(userId, message) {
  purgedUsers.delete(userId);
  const history = [...(await getChatHistoryAsync(userId))];
  history.push({
    ...message,
    timestamp: new Date().toISOString()
  });
  chatHistories.set(userId, history);
  await writeFirestoreDoc('chat_histories', userId, {
    userId,
    messages: history,
    lastUpdated: new Date().toISOString()
  }, false);
  return history;
}

function getChecklistProgress(userId) {
  return checklistProgress.get(userId) || {};
}

async function getChecklistProgressAsync(userId) {
  if (checklistProgress.has(userId) || purgedUsers.has(userId)) {
    return checklistProgress.get(userId) || {};
  }
  const remote = await readFirestoreDoc('checklist_progress', userId);
  if (remote && remote.items) {
    checklistProgress.set(userId, remote.items);
    return remote.items;
  }
  return {};
}

function updateChecklistItem(userId, docId, updates) {
  purgedUsers.delete(userId);
  const existing = checklistProgress.get(userId) || {};
  const prevItem = existing[docId] || {};
  const next = {
    ...existing,
    [docId]: {
      ...prevItem,
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
      ...(updates.openedAt !== undefined ? { openedAt: updates.openedAt } : {}),
      ...(updates.completedExternally !== undefined ? { completedExternally: updates.completedExternally } : {}),
      ...(updates.filledRequiredCount !== undefined ? { filledRequiredCount: updates.filledRequiredCount } : {}),
      ...(updates.totalRequiredCount !== undefined ? { totalRequiredCount: updates.totalRequiredCount } : {}),
      ...(updates.fieldCompletionPercent !== undefined ? { fieldCompletionPercent: updates.fieldCompletionPercent } : {}),
      ...(updates.uploadedFile !== undefined ? { uploadedFile: updates.uploadedFile } : {}),
      updatedAt: new Date().toISOString()
    }
  };
  checklistProgress.set(userId, next);
  writeFirestoreDoc('checklist_progress', userId, {
    userId,
    items: next,
    lastUpdated: new Date().toISOString()
  }, false).catch(() => {});
  return next;
}

async function updateChecklistItemAsync(userId, docId, updates) {
  purgedUsers.delete(userId);
  const existing = await getChecklistProgressAsync(userId);
  const prevItem = existing[docId] || {};
  const next = {
    ...existing,
    [docId]: {
      ...prevItem,
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
      ...(updates.openedAt !== undefined ? { openedAt: updates.openedAt } : {}),
      ...(updates.completedExternally !== undefined ? { completedExternally: updates.completedExternally } : {}),
      ...(updates.filledRequiredCount !== undefined ? { filledRequiredCount: updates.filledRequiredCount } : {}),
      ...(updates.totalRequiredCount !== undefined ? { totalRequiredCount: updates.totalRequiredCount } : {}),
      ...(updates.fieldCompletionPercent !== undefined ? { fieldCompletionPercent: updates.fieldCompletionPercent } : {}),
      ...(updates.uploadedFile !== undefined ? { uploadedFile: updates.uploadedFile } : {}),
      updatedAt: new Date().toISOString()
    }
  };
  checklistProgress.set(userId, next);
  await writeFirestoreDoc('checklist_progress', userId, {
    userId,
    items: next,
    lastUpdated: new Date().toISOString()
  }, false);
  return next;
}

function resetChecklistProgress(userId) {
  checklistProgress.delete(userId);
  deleteFirestoreDoc('checklist_progress', userId).catch(() => {});
}

function getDocumentDraft(userId, docId) {
  const userDrafts = documentDrafts.get(userId);
  return userDrafts ? userDrafts[docId] || null : null;
}

async function getDocumentDraftAsync(userId, docId) {
  if (documentDrafts.has(userId) || purgedUsers.has(userId)) {
    const userDrafts = documentDrafts.get(userId);
    return userDrafts ? userDrafts[docId] || null : null;
  }
  const remote = await readFirestoreDoc('document_drafts', userId);
  if (remote && remote.drafts) {
    documentDrafts.set(userId, remote.drafts);
    return remote.drafts[docId] || null;
  }
  return null;
}

function saveDocumentDraft(userId, docId, values) {
  purgedUsers.delete(userId);
  const userDrafts = documentDrafts.get(userId) || {};
  const record = {
    values: { ...(values || {}) },
    updatedAt: new Date().toISOString()
  };
  userDrafts[docId] = record;
  documentDrafts.set(userId, userDrafts);
  writeFirestoreDoc('document_drafts', userId, {
    userId,
    drafts: userDrafts,
    lastUpdated: new Date().toISOString()
  }, false).catch(() => {});
  return record;
}

async function saveDocumentDraftAsync(userId, docId, values) {
  purgedUsers.delete(userId);
  if (!documentDrafts.has(userId)) {
    const remote = await readFirestoreDoc('document_drafts', userId);
    if (remote && remote.drafts) {
      documentDrafts.set(userId, remote.drafts);
    }
  }
  const userDrafts = { ...(documentDrafts.get(userId) || {}) };
  const record = {
    values: { ...(values || {}) },
    updatedAt: new Date().toISOString()
  };
  userDrafts[docId] = record;
  documentDrafts.set(userId, userDrafts);
  await writeFirestoreDoc('document_drafts', userId, {
    userId,
    drafts: userDrafts,
    lastUpdated: new Date().toISOString()
  }, false);
  return record;
}

function purgeUserMemory(userId) {
  purgedUsers.add(userId);
  agentMemories.delete(userId);
  chatHistories.delete(userId);
  checklistProgress.delete(userId);
  documentDrafts.delete(userId);
  Promise.all([
    deleteFirestoreDoc('agent_memories', userId),
    deleteFirestoreDoc('chat_histories', userId),
    deleteFirestoreDoc('checklist_progress', userId),
    deleteFirestoreDoc('document_drafts', userId)
  ]).catch(() => {});
}

async function purgeUserMemoryAsync(userId) {
  purgedUsers.add(userId);
  agentMemories.delete(userId);
  chatHistories.delete(userId);
  checklistProgress.delete(userId);
  documentDrafts.delete(userId);
  await Promise.all([
    deleteFirestoreDoc('agent_memories', userId),
    deleteFirestoreDoc('chat_histories', userId),
    deleteFirestoreDoc('checklist_progress', userId),
    deleteFirestoreDoc('document_drafts', userId)
  ]);
}

module.exports = {
  getUserProfile,
  getUserProfileAsync,
  setUserProfile,
  setUserProfileAsync,
  getAgentMemory,
  getAgentMemoryAsync,
  updateAgentMemory,
  updateAgentMemoryAsync,
  getChatHistory,
  getChatHistoryAsync,
  appendChatMessage,
  appendChatMessageAsync,
  getChecklistProgress,
  getChecklistProgressAsync,
  updateChecklistItem,
  updateChecklistItemAsync,
  resetChecklistProgress,
  getDocumentDraft,
  getDocumentDraftAsync,
  saveDocumentDraft,
  saveDocumentDraftAsync,
  purgeUserMemory,
  purgeUserMemoryAsync,
  _clearCacheForTesting: (userId) => {
    if (userId) {
      userProfiles.delete(userId);
      agentMemories.delete(userId);
      chatHistories.delete(userId);
      checklistProgress.delete(userId);
      documentDrafts.delete(userId);
      purgedUsers.delete(userId);
    } else {
      userProfiles.clear();
      agentMemories.clear();
      chatHistories.clear();
      checklistProgress.clear();
      documentDrafts.clear();
      purgedUsers.clear();
    }
  }
};
