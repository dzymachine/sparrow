const fs = require('fs');
const path = require('path');
const firebaseAdmin = require('../config/firebaseAdmin');

const DATA_ROOT = process.env.WIKI_DATA_DIR || path.join(__dirname, '../../data/wikis');

const WIKI_SECTIONS = {
  profile: {
    key: 'profile',
    filename: 'wiki/profile.md',
    title: 'Profile & Jurisdiction',
    description: 'State jurisdiction, marriage duration, dependents, employment, and household financial role.'
  },
  financial_footprint: {
    key: 'financial_footprint',
    filename: 'wiki/financial_footprint.md',
    title: 'Financial Footprint',
    description: 'Discovered accounts, debts, real estate, mortgage terms, 401(k)/pensions, and Schedule B leads.'
  },
  priorities_and_goals: {
    key: 'priorities_and_goals',
    filename: 'wiki/priorities_and_goals.md',
    title: 'Priorities & Goals',
    description: 'Core priorities including keeping the home, spousal support, asset transparency, and children.'
  },
  lawyer_readiness: {
    key: 'lawyer_readiness',
    filename: 'wiki/lawyer_readiness.md',
    title: 'Lawyer Readiness',
    description: 'Open legal questions, missing documents, and attorney consultation strategy.'
  },
  interaction_log: {
    key: 'interaction_log',
    filename: 'wiki/interaction_log.md',
    title: 'Interaction Log',
    description: 'Chronological key takeaways from past conversations with Ruth.'
  }
};

const SECTION_KEYS = Object.keys(WIKI_SECTIONS);
const wikiCache = new Map();
const purgedUsers = new Set();

function sanitizeUserId(userId) {
  return String(userId || 'guest-user').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function normalizeFactText(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function renderSectionMarkdown(sectionMeta, facts) {
  const header = `# ${sectionMeta.title}\n\n> ${sectionMeta.description}\n\n`;
  if (!facts || facts.length === 0) {
    return `${header}_No entries recorded yet._\n`;
  }
  const lines = facts.map((f) => {
    const tag = f.category ? `[${f.category}] ` : '';
    return `- ${tag}${f.text}`;
  });
  return `${header}${lines.join('\n')}\n`;
}

function createEmptyWiki(userId) {
  const now = new Date().toISOString();
  const sections = {};
  for (const key of SECTION_KEYS) {
    const meta = WIKI_SECTIONS[key];
    sections[key] = {
      ...meta,
      facts: [],
      markdown: renderSectionMarkdown(meta, [])
    };
  }
  return {
    userId,
    sections,
    lastUpdated: now
  };
}

function createDemoSeedWiki(userId) {
  const now = new Date().toISOString();
  const wiki = createEmptyWiki(userId);

  const seed = {
    profile: [
      { id: 'fact-seed-1', text: 'Jurisdiction: California (Community Property state)', category: 'Jurisdiction', source: 'Onboarding Profile', createdAt: now },
      { id: 'fact-seed-2', text: 'Length of marriage: 18 years (crosses CA 10-year long-duration threshold)', category: 'Marriage', source: 'Onboarding Profile', createdAt: now },
      { id: 'fact-seed-3', text: 'Dependents: 2 children', category: 'Family', source: 'Onboarding Profile', createdAt: now },
      { id: 'fact-seed-4', text: 'Employment: Part-time caregiver; spouse managed all household accounts and tax filings', category: 'Employment & Role', source: 'Onboarding Profile', createdAt: now }
    ],
    financial_footprint: [
      { id: 'fact-seed-5', text: 'Primary Residence (San Diego): Est. value $850,000, mortgage remaining $320,000 (~$2,850/mo)', category: 'Real Estate', source: 'Initial Discovery', createdAt: now },
      { id: 'fact-seed-6', text: 'Spouse Tech Corp 401(k): Est. $420,000 (Subject to QDRO division)', category: 'Retirement', source: 'Initial Discovery', createdAt: now },
      { id: 'fact-seed-7', text: 'Potential undisclosed Fidelity account: Schedule B interest item ($45,000 est.) on 2024 Form 1040', category: 'Tax Lead', source: '2024 Form 1040 Schedule B', createdAt: now }
    ],
    priorities_and_goals: [
      { id: 'fact-seed-8', text: 'Core priority: Keep the family home for children stability if post-divorce budget allows', category: 'Housing', source: 'Onboarding Profile', createdAt: now },
      { id: 'fact-seed-9', text: 'Concern: Discovering any hidden or unmentioned financial accounts', category: 'Transparency', source: 'Onboarding Profile', createdAt: now },
      { id: 'fact-seed-10', text: 'Goal: Secure fair long-duration spousal support and equitable retirement share', category: 'Support', source: 'Onboarding Profile', createdAt: now }
    ],
    lawyer_readiness: [
      { id: 'fact-seed-11', text: 'Open question: Request forensic trace on Schedule B Fidelity interest income?', category: 'Legal Question', source: 'Lawyer Prep', createdAt: now },
      { id: 'fact-seed-12', text: 'Open question: Refinancing feasibility if buying out spouse equity in San Diego home', category: 'Legal Question', source: 'Lawyer Prep', createdAt: now },
      { id: 'fact-seed-13', text: 'Strategy: Confirm CA Family Code § 4336 spousal support rules for 18-year marriage', category: 'Strategy', source: 'Lawyer Prep', createdAt: now }
    ],
    interaction_log: [
      { id: 'fact-seed-14', text: 'Initial profile established: California 18-year marriage, 2 children, spouse-managed finances.', category: 'Milestone', source: 'System', createdAt: now }
    ]
  };

  for (const key of SECTION_KEYS) {
    wiki.sections[key].facts = seed[key];
    wiki.sections[key].markdown = renderSectionMarkdown(WIKI_SECTIONS[key], seed[key]);
  }
  return wiki;
}

function writeWikiToLocalDisk(wiki) {
  try {
    const safeId = sanitizeUserId(wiki.userId);
    const userDir = path.join(DATA_ROOT, safeId);
    const wikiDir = path.join(userDir, 'wiki');
    fs.mkdirSync(wikiDir, { recursive: true });

    fs.writeFileSync(path.join(userDir, 'wiki.json'), JSON.stringify(wiki, null, 2), 'utf8');

    for (const key of SECTION_KEYS) {
      const section = wiki.sections[key];
      const filePath = path.join(userDir, section.filename);
      fs.writeFileSync(filePath, section.markdown, 'utf8');
    }
  } catch (err) {
    // Non-fatal fallback: in-memory cache remains active
    console.warn('[WikiStore] Disk persistence skipped:', err.message);
  }
}

async function syncWikiToFirebase(wiki) {
  if (!firebaseAdmin.isConfigured() || !firebaseAdmin.db) {
    return;
  }
  const safeId = sanitizeUserId(wiki.userId);
  const tasks = [
    firebaseAdmin.db
      .collection('user_wikis')
      .doc(safeId)
      .set({
        userId: wiki.userId,
        sections: wiki.sections,
        lastUpdated: wiki.lastUpdated
      })
      .catch((e) => console.warn('[WikiStore] Firestore async sync warning:', e.message))
  ];

  if (firebaseAdmin.bucket) {
    for (const key of SECTION_KEYS) {
      const section = wiki.sections[key];
      const remotePath = `wikis/${safeId}/${section.filename}`;
      tasks.push(
        firebaseAdmin.bucket
          .file(remotePath)
          .save(section.markdown, {
            contentType: 'text/markdown; charset=utf-8',
            resumable: false
          })
          .catch((e) => console.warn('[WikiStore] Storage upload warning:', e.message))
      );
    }
  }

  await Promise.all(tasks);
}

function persistWikiToDisk(wiki) {
  writeWikiToLocalDisk(wiki);
  syncWikiToFirebase(wiki).catch((e) => console.warn('[WikiStore] Firebase sync warning:', e.message));
}

async function persistWikiAsync(wiki) {
  writeWikiToLocalDisk(wiki);
  await syncWikiToFirebase(wiki);
}

async function hydrateWikiFromFirestore(userId) {
  const id = userId || 'guest-user';
  if (wikiCache.has(id) || purgedUsers.has(id)) {
    return ensureWiki(id);
  }

  if (firebaseAdmin.isConfigured() && firebaseAdmin.db) {
    try {
      const safeId = sanitizeUserId(id);
      const snap = await firebaseAdmin.db.collection('user_wikis').doc(safeId).get();
      if (snap.exists) {
        const data = snap.data();
        if (data && data.sections) {
          for (const key of SECTION_KEYS) {
            if (!data.sections[key]) {
              data.sections[key] = {
                ...WIKI_SECTIONS[key],
                facts: [],
                markdown: renderSectionMarkdown(WIKI_SECTIONS[key], [])
              };
            } else {
              data.sections[key].markdown = renderSectionMarkdown(
                WIKI_SECTIONS[key],
                data.sections[key].facts || []
              );
            }
          }
          wikiCache.set(id, data);
          writeWikiToLocalDisk(data);
          return data;
        }
      }
    } catch (err) {
      console.warn('[WikiStore] Firestore hydrate warning:', err.message);
    }
  }

  const fromDisk = loadWikiFromDisk(id);
  if (fromDisk) {
    wikiCache.set(id, fromDisk);
    return fromDisk;
  }

  return ensureWiki(id);
}

async function getWikiAsync(userId) {
  const wiki = await hydrateWikiFromFirestore(userId);
  return formatWikiResponse(wiki);
}

function loadWikiFromDisk(userId) {
  try {
    const safeId = sanitizeUserId(userId);
    const jsonPath = path.join(DATA_ROOT, safeId, 'wiki.json');
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      const parsed = JSON.parse(raw);
      // Ensure all canonical sections exist
      for (const key of SECTION_KEYS) {
        if (!parsed.sections[key]) {
          parsed.sections[key] = {
            ...WIKI_SECTIONS[key],
            facts: [],
            markdown: renderSectionMarkdown(WIKI_SECTIONS[key], [])
          };
        } else {
          parsed.sections[key].markdown = renderSectionMarkdown(
            WIKI_SECTIONS[key],
            parsed.sections[key].facts || []
          );
        }
      }
      return parsed;
    }
  } catch (err) {
    console.warn('[WikiStore] Failed to load wiki from disk:', err.message);
  }
  return null;
}

function ensureWiki(userId) {
  const id = userId || 'guest-user';
  if (wikiCache.has(id)) {
    return wikiCache.get(id);
  }

  const fromDisk = loadWikiFromDisk(id);
  if (fromDisk) {
    wikiCache.set(id, fromDisk);
    return fromDisk;
  }

  if (id === 'demo-user-123' && !purgedUsers.has(id)) {
    const demoWiki = createDemoSeedWiki(id);
    wikiCache.set(id, demoWiki);
    persistWikiToDisk(demoWiki);
    return demoWiki;
  }

  const fresh = createEmptyWiki(id);
  wikiCache.set(id, fresh);
  return fresh;
}

function computeStats(wiki) {
  const sectionCounts = {};
  let totalFacts = 0;
  for (const key of SECTION_KEYS) {
    const count = wiki.sections[key]?.facts?.length || 0;
    sectionCounts[key] = count;
    totalFacts += count;
  }
  return {
    totalFacts,
    sectionCounts,
    lastUpdated: wiki.lastUpdated
  };
}

function formatWikiResponse(wiki) {
  const markdownFiles = {};
  for (const key of SECTION_KEYS) {
    markdownFiles[wiki.sections[key].filename] = wiki.sections[key].markdown;
  }
  return {
    userId: wiki.userId,
    sections: wiki.sections,
    stats: computeStats(wiki),
    markdownFiles,
    lastUpdated: wiki.lastUpdated
  };
}

function getWiki(userId) {
  const wiki = ensureWiki(userId);
  return formatWikiResponse(wiki);
}

function addFacts(userId, sectionKey, newFacts) {
  if (!WIKI_SECTIONS[sectionKey]) {
    throw new Error(`Invalid wiki section: ${sectionKey}`);
  }
  const wiki = ensureWiki(userId);
  purgedUsers.delete(userId);

  const section = wiki.sections[sectionKey];
  const existingNormalized = new Set(section.facts.map((f) => normalizeFactText(f.text)));
  const addedFacts = [];

  const items = Array.isArray(newFacts) ? newFacts : [newFacts];
  for (const item of items) {
    const text = typeof item === 'string' ? item.trim() : String(item?.text || '').trim();
    if (!text) continue;

    const norm = normalizeFactText(text);
    if (existingNormalized.has(norm)) continue;

    // Also skip if an existing fact already contains this exact substring (for short fragments)
    const isSubsumed = norm.length > 10 && section.facts.some((f) => normalizeFactText(f.text).includes(norm));
    if (isSubsumed) continue;

    const factRecord = {
      id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      category: (typeof item === 'object' && item?.category) ? item.category : 'Note',
      source: (typeof item === 'object' && item?.source) ? item.source : 'Chat Disclosure',
      createdAt: new Date().toISOString()
    };

    section.facts.push(factRecord);
    existingNormalized.add(norm);
    addedFacts.push(factRecord);
  }

  if (addedFacts.length > 0) {
    section.markdown = renderSectionMarkdown(WIKI_SECTIONS[sectionKey], section.facts);
    wiki.lastUpdated = new Date().toISOString();
    wikiCache.set(wiki.userId, wiki);
    persistWikiToDisk(wiki);
  }

  return {
    wiki: formatWikiResponse(wiki),
    addedFacts,
    addedCount: addedFacts.length
  };
}

function updateFact(userId, sectionKey, factId, newText, newCategory) {
  if (!WIKI_SECTIONS[sectionKey]) {
    throw new Error(`Invalid wiki section: ${sectionKey}`);
  }
  const wiki = ensureWiki(userId);
  const section = wiki.sections[sectionKey];
  const fact = section.facts.find((f) => f.id === factId);
  if (!fact) {
    throw new Error(`Fact not found: ${factId}`);
  }

  if (typeof newText === 'string' && newText.trim()) {
    fact.text = newText.trim();
  }
  if (typeof newCategory === 'string' && newCategory.trim()) {
    fact.category = newCategory.trim();
  }
  fact.updatedAt = new Date().toISOString();

  section.markdown = renderSectionMarkdown(WIKI_SECTIONS[sectionKey], section.facts);
  wiki.lastUpdated = new Date().toISOString();
  wikiCache.set(wiki.userId, wiki);
  persistWikiToDisk(wiki);

  return formatWikiResponse(wiki);
}

function deleteFact(userId, sectionKey, factId) {
  if (!WIKI_SECTIONS[sectionKey]) {
    throw new Error(`Invalid wiki section: ${sectionKey}`);
  }
  const wiki = ensureWiki(userId);
  const section = wiki.sections[sectionKey];
  const beforeLen = section.facts.length;
  section.facts = section.facts.filter((f) => f.id !== factId);

  if (section.facts.length !== beforeLen) {
    section.markdown = renderSectionMarkdown(WIKI_SECTIONS[sectionKey], section.facts);
    wiki.lastUpdated = new Date().toISOString();
    wikiCache.set(wiki.userId, wiki);
    persistWikiToDisk(wiki);
  }

  return formatWikiResponse(wiki);
}

function replaceSectionFacts(userId, sectionKey, factsArray) {
  if (!WIKI_SECTIONS[sectionKey]) {
    throw new Error(`Invalid wiki section: ${sectionKey}`);
  }
  const wiki = ensureWiki(userId);
  purgedUsers.delete(userId);

  const section = wiki.sections[sectionKey];
  section.facts = (factsArray || [])
    .map((item, idx) => ({
      id: item.id || `fact-${Date.now()}-${idx}`,
      text: typeof item === 'string' ? item.trim() : String(item?.text || '').trim(),
      category: item?.category || 'Note',
      source: item?.source || 'Manual Edit',
      createdAt: item?.createdAt || new Date().toISOString()
    }))
    .filter((f) => f.text.length > 0);

  section.markdown = renderSectionMarkdown(WIKI_SECTIONS[sectionKey], section.facts);
  wiki.lastUpdated = new Date().toISOString();
  wikiCache.set(wiki.userId, wiki);
  persistWikiToDisk(wiki);

  return formatWikiResponse(wiki);
}

async function deleteWikiFromFirebase(userId) {
  if (!firebaseAdmin.isConfigured() || !firebaseAdmin.db) {
    return;
  }
  const safeId = sanitizeUserId(userId);
  const tasks = [
    firebaseAdmin.db.collection('user_wikis').doc(safeId).delete().catch((e) => {
      console.warn('[WikiStore] Firestore purge warning:', e.message);
    })
  ];
  if (firebaseAdmin.bucket) {
    tasks.push(
      firebaseAdmin.bucket.deleteFiles({ prefix: `wikis/${safeId}/` }).catch((e) => {
        console.warn('[WikiStore] Storage purge warning:', e.message);
      })
    );
  }
  await Promise.all(tasks);
}

function purgeWikiLocal(userId) {
  const id = userId || 'guest-user';
  purgedUsers.add(id);
  const empty = createEmptyWiki(id);
  wikiCache.set(id, empty);

  try {
    const safeId = sanitizeUserId(id);
    const userDir = path.join(DATA_ROOT, safeId);
    if (fs.existsSync(userDir)) {
      fs.rmSync(userDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn('[WikiStore] Disk purge warning:', err.message);
  }
  return empty;
}

function purgeWiki(userId) {
  const id = userId || 'guest-user';
  const empty = purgeWikiLocal(id);
  deleteWikiFromFirebase(id).catch(() => {});
  return formatWikiResponse(empty);
}

async function purgeWikiAsync(userId) {
  const id = userId || 'guest-user';
  const empty = purgeWikiLocal(id);
  await deleteWikiFromFirebase(id);
  return formatWikiResponse(empty);
}

async function addFactsAsync(userId, sectionKey, newFacts) {
  await hydrateWikiFromFirestore(userId);
  const result = addFacts(userId, sectionKey, newFacts);
  if (result.addedCount > 0) {
    await syncWikiToFirebase(wikiCache.get(userId || 'guest-user'));
  }
  return result;
}

async function updateFactAsync(userId, sectionKey, factId, newText, newCategory) {
  await hydrateWikiFromFirestore(userId);
  const wikiRes = updateFact(userId, sectionKey, factId, newText, newCategory);
  await syncWikiToFirebase(wikiCache.get(userId || 'guest-user'));
  return wikiRes;
}

async function deleteFactAsync(userId, sectionKey, factId) {
  await hydrateWikiFromFirestore(userId);
  const wikiRes = deleteFact(userId, sectionKey, factId);
  await syncWikiToFirebase(wikiCache.get(userId || 'guest-user'));
  return wikiRes;
}

async function replaceSectionFactsAsync(userId, sectionKey, factsArray) {
  await hydrateWikiFromFirestore(userId);
  const wikiRes = replaceSectionFacts(userId, sectionKey, factsArray);
  await syncWikiToFirebase(wikiCache.get(userId || 'guest-user'));
  return wikiRes;
}

function compileWikiContext(userId) {
  const wiki = ensureWiki(userId);
  const parts = [];
  for (const key of SECTION_KEYS) {
    const sec = wiki.sections[key];
    if (sec.facts.length > 0) {
      parts.push(`## ${sec.title} (${sec.filename})\n${sec.facts.map((f) => `- [${f.category}] ${f.text}`).join('\n')}`);
    }
  }
  if (parts.length === 0) {
    return 'No personal wiki facts have been recorded yet for this user.';
  }
  return parts.join('\n\n');
}

async function compileWikiContextAsync(userId) {
  await hydrateWikiFromFirestore(userId);
  return compileWikiContext(userId);
}

function buildProfileSyncFacts(profileData) {
  const profileFacts = [];
  if (profileData.goal) {
    profileFacts.push({
      text: `Primary Goal: ${String(profileData.goal).replace(/_/g, ' ')}`,
      category: 'Goal',
      source: 'Onboarding Profile'
    });
  }
  if (profileData.maritalStatus) {
    profileFacts.push({
      text: `Marital Status: ${String(profileData.maritalStatus).replace(/_/g, ' ')}`,
      category: 'Marital Status',
      source: 'Onboarding Profile'
    });
  }
  if (profileData.stateJurisdiction) {
    profileFacts.push({
      text: `Jurisdiction: ${profileData.stateJurisdiction}`,
      category: 'Jurisdiction',
      source: 'Onboarding Profile'
    });
  }
  if (profileData.marriageLengthYears) {
    const isLongDuration = Number(profileData.marriageLengthYears) >= 10;
    const longDurationNote = isLongDuration ? ' (crosses CA 10-year long-duration threshold under Fam. Code § 4336)' : '';
    profileFacts.push({
      text: `Length of marriage: ${profileData.marriageLengthYears} years${longDurationNote}`,
      category: 'Marriage',
      source: 'Onboarding Profile'
    });
  }
  if (profileData.childrenCount !== undefined && profileData.childrenCount !== null) {
    const count = Number(profileData.childrenCount);
    const hasChildren = profileData.hasChildren !== false && count > 0;
    if (hasChildren) {
      const agesArr = Array.isArray(profileData.childrenAges) ? profileData.childrenAges.filter(a => String(a).trim()) : [];
      const agesStr = agesArr.length > 0 ? ` (Ages: ${agesArr.join(', ')})` : '';
      profileFacts.push({
        text: `Dependents: ${count} child${count === 1 ? '' : 'ren'}${agesStr}`,
        category: 'Family',
        source: 'Onboarding Profile'
      });
    } else {
      profileFacts.push({
        text: 'Dependents: No children',
        category: 'Family',
        source: 'Onboarding Profile'
      });
    }
  }
  if (profileData.taxFilingStatus) {
    const isJoint = String(profileData.taxFilingStatus).toLowerCase().includes('joint');
    const taxNote = isJoint ? ' (Form 1040 Schedule B tracing recommended for hidden asset discovery)' : '';
    profileFacts.push({
      text: `Tax Filing Status: ${String(profileData.taxFilingStatus).replace(/_/g, ' ')}${taxNote}`,
      category: 'Tax Status',
      source: 'Onboarding Profile'
    });
  }
  if (profileData.employmentStatus || profileData.financialRole) {
    profileFacts.push({
      text: `Employment & role: ${profileData.employmentStatus || 'unspecified'}, financial role: ${String(profileData.financialRole || 'unspecified').replace(/_/g, ' ')}`,
      category: 'Employment & Role',
      source: 'Onboarding Profile'
    });
  }

  const concernFacts = [];
  if (Array.isArray(profileData.primaryConcerns) && profileData.primaryConcerns.length > 0) {
    for (const c of profileData.primaryConcerns) {
      concernFacts.push({
        text: `Priority concern: ${String(c).replace(/_/g, ' ')}`,
        category: 'Priority',
        source: 'Onboarding Profile'
      });
    }
  }
  return { profileFacts, concernFacts };
}

function syncFromProfile(userId, profileData) {
  if (!userId || !profileData) return;
  const { profileFacts, concernFacts } = buildProfileSyncFacts(profileData);
  if (profileFacts.length > 0) {
    addFacts(userId, 'profile', profileFacts);
  }
  if (concernFacts.length > 0) {
    addFacts(userId, 'priorities_and_goals', concernFacts);
  }
}

async function syncFromProfileAsync(userId, profileData) {
  if (!userId || !profileData) return;
  await hydrateWikiFromFirestore(userId);
  const { profileFacts, concernFacts } = buildProfileSyncFacts(profileData);
  let changed = false;
  if (profileFacts.length > 0) {
    const r1 = addFacts(userId, 'profile', profileFacts);
    if (r1.addedCount > 0) changed = true;
  }
  if (concernFacts.length > 0) {
    const r2 = addFacts(userId, 'priorities_and_goals', concernFacts);
    if (r2.addedCount > 0) changed = true;
  }
  if (changed) {
    await syncWikiToFirebase(wikiCache.get(userId));
  }
}

module.exports = {
  WIKI_SECTIONS,
  SECTION_KEYS,
  getWiki,
  getWikiAsync,
  hydrateWikiFromFirestore,
  addFacts,
  addFactsAsync,
  updateFact,
  updateFactAsync,
  deleteFact,
  deleteFactAsync,
  replaceSectionFacts,
  replaceSectionFactsAsync,
  purgeWiki,
  purgeWikiAsync,
  compileWikiContext,
  compileWikiContextAsync,
  syncFromProfile,
  syncFromProfileAsync,
  _clearCacheForTesting: () => {
    wikiCache.clear();
    purgedUsers.clear();
  }
};
