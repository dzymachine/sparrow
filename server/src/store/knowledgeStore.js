const fs = require('fs');
const path = require('path');

const KNOWLEDGE_ROOT = path.join(__dirname, '../../../knowledge');
const WIKI_DIR = path.join(KNOWLEDGE_ROOT, 'wiki');
const SOURCES_DIR = path.join(KNOWLEDGE_ROOT, 'sources');
const RULES_PATH = path.join(KNOWLEDGE_ROOT, 'rules.json');
const GUIDELINES_PATH = path.join(KNOWLEDGE_ROOT, 'agent-guidelines.md');
const PERSONA_PATH = path.join(KNOWLEDGE_ROOT, 'demo-persona.json');
const SOURCES_CATALOG_PATH = path.join(KNOWLEDGE_ROOT, 'sources/sources.md');

// Fallback baseline wiki articles if disk reading fails
const BASELINE_ARTICLES = [
  {
    slug: 'overview',
    title: 'California Divorce Overview',
    topic: 'Fundamentals',
    summary: 'Overview of dissolution, residency requirements (6 months in CA, 3 months in county), and legal separation options.'
  },
  {
    slug: 'process-overview',
    title: 'California Divorce Process Step-by-Step',
    topic: 'Workflow',
    summary: 'Plain-English 6-phase walkthrough from document gathering to final judgment.'
  },
  {
    slug: 'financial-disclosure',
    title: 'Sharing the Money Picture',
    topic: 'Money & Property',
    summary: 'Mandatory financial disclosures, tax return account tracing, and document gaps.'
  },
  {
    slug: 'temporary-support',
    title: 'Temporary Spousal Support',
    topic: 'Support & Alimony',
    summary: 'Guide to requesting temporary spousal support under Cal. Fam. Code § 3600 (FL-300, FL-150).'
  },
  {
    slug: 'attorney-fees',
    title: "Requesting Attorney's Fees",
    topic: 'Legal Representation',
    summary: 'Guidance on requesting fee contributions from higher-earning spouse under FC § 2030.'
  },
  {
    slug: 'timeline-and-costs',
    title: 'Timeline and Costs',
    topic: 'Timeline & Costs',
    summary: '6-month minimum waiting period, $435 filing fee, 30-day response deadline, and fee waivers.'
  },
  {
    slug: 'forms',
    title: 'Common California Divorce Forms',
    topic: 'Forms Index',
    summary: 'Comprehensive plain-English guide to essential Judicial Council forms (FL-100 to FL-319).'
  },
  {
    slug: 'context-and-statistics',
    title: 'Background Statistics & Context',
    topic: 'Research & Education',
    summary: 'Post-divorce income disparity stats, self-representation rates, and civil justice gap research.'
  }
];

/**
 * List all knowledge base articles from disk.
 */
function listArticles() {
  try {
    if (fs.existsSync(WIKI_DIR)) {
      const files = fs.readdirSync(WIKI_DIR).filter(f => f.endsWith('.md') && f !== 'README.md');
      if (files.length > 0) {
        return files.map(file => {
          const slug = file.replace('.md', '');
          const fullPath = path.join(WIKI_DIR, file);
          const content = fs.readFileSync(fullPath, 'utf8');
          const titleLine = content.split('\n').find(l => l.startsWith('# ')) || `# ${slug}`;
          return {
            slug,
            title: titleLine.replace('# ', '').trim(),
            file,
            summary: content.slice(0, 200).replace(/^[#>\s*]+/g, '').slice(0, 150) + '...'
          };
        });
      }
    }
  } catch (err) {
    console.warn('[KnowledgeStore] Error reading wiki dir, using baseline articles:', err.message);
  }
  return BASELINE_ARTICLES;
}

/**
 * Get a single article by slug.
 */
function getArticleBySlug(slug) {
  try {
    const filePath = path.join(WIKI_DIR, `${slug}.md`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const titleLine = content.split('\n').find(l => l.startsWith('# ')) || `# ${slug}`;
      return {
        slug,
        title: titleLine.replace('# ', '').trim(),
        content
      };
    }
  } catch (err) {
    console.warn(`[KnowledgeStore] Error reading file for ${slug}:`, err.message);
  }
  return null;
}

/**
 * Search knowledge base by query string.
 */
function searchKnowledge(query) {
  if (!query || typeof query !== 'string') return [];
  const q = query.toLowerCase().trim();
  const articlesList = listArticles();

  const results = [];
  for (const artMeta of articlesList) {
    const fullArt = getArticleBySlug(artMeta.slug);
    if (!fullArt) continue;
    
    if (
      fullArt.title.toLowerCase().includes(q) ||
      fullArt.content.toLowerCase().includes(q) ||
      artMeta.slug.toLowerCase().includes(q)
    ) {
      results.push({
        slug: fullArt.slug,
        title: fullArt.title,
        content: fullArt.content,
        summary: artMeta.summary || fullArt.content.slice(0, 150)
      });
    }
  }
  return results;
}

/**
 * Load deterministic rules from rules.json
 */
function getRules() {
  try {
    if (fs.existsSync(RULES_PATH)) {
      const raw = fs.readFileSync(RULES_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[KnowledgeStore] Error reading rules.json:', err.message);
  }
  return { rules: [] };
}

/**
 * Evaluate deterministic rules against a user profile.
 */
function evaluateRules(profile = {}) {
  const { rules } = getRules();
  const matchedCards = [];

  const income_self = profile.income_self ?? profile.monthlyIncomeSelf ?? 0;
  const income_spouse = profile.income_spouse ?? profile.monthlyIncomeSpouse ?? 0;
  const has_children = profile.has_children ?? profile.hasChildren ?? false;
  const years_married = profile.years_married ?? profile.marriageLengthYears ?? 0;
  const has_access_to_accounts = profile.has_access_to_accounts ?? profile.hasAccessToAccounts ?? true;
  const owns_home = profile.owns_home ?? profile.ownsHome ?? false;
  const case_filed = profile.case_filed ?? profile.caseFiled ?? false;
  const stage = profile.stage ?? profile.relationshipStage ?? 'thinking';

  for (const rule of rules) {
    let matches = false;
    const cond = rule.condition;

    if (cond === 'always') {
      matches = true;
    } else if (cond === 'income_self < income_spouse') {
      matches = Number(income_self) < Number(income_spouse);
    } else if (cond === 'has_access_to_accounts == false') {
      matches = has_access_to_accounts === false;
    } else if (cond === 'case_filed == false') {
      matches = case_filed === false;
    } else if (cond === 'has_children == true') {
      matches = has_children === true || has_children === 'true';
    } else if (cond === 'income_self == 0 || income_self < income_spouse') {
      matches = Number(income_self) === 0 || Number(income_self) < Number(income_spouse);
    }

    if (matches) {
      matchedCards.push({
        ...rule,
        evaluatedFor: {
          income_self,
          income_spouse,
          has_children,
          years_married,
          has_access_to_accounts,
          owns_home,
          case_filed,
          stage
        }
      });
    }
  }

  return matchedCards;
}

/**
 * Load agent guidelines.
 */
function getAgentGuidelines() {
  try {
    if (fs.existsSync(GUIDELINES_PATH)) {
      return fs.readFileSync(GUIDELINES_PATH, 'utf8');
    }
  } catch (err) {
    console.warn('[KnowledgeStore] Error reading agent-guidelines.md:', err.message);
  }
  return '';
}

/**
 * Load demo persona.
 */
function getDemoPersona() {
  try {
    if (fs.existsSync(PERSONA_PATH)) {
      const raw = fs.readFileSync(PERSONA_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[KnowledgeStore] Error reading demo-persona.json:', err.message);
  }
  return null;
}

/**
 * Load sources catalog.
 */
function getSources() {
  try {
    if (fs.existsSync(SOURCES_CATALOG_PATH)) {
      return fs.readFileSync(SOURCES_CATALOG_PATH, 'utf8');
    }
  } catch (err) {
    console.warn('[KnowledgeStore] Error reading sources.md:', err.message);
  }
  return '';
}

module.exports = {
  listArticles,
  getArticleBySlug,
  searchKnowledge,
  getRules,
  evaluateRules,
  getAgentGuidelines,
  getDemoPersona,
  getSources,
  BASELINE_ARTICLES
};
