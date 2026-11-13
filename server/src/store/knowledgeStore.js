const fs = require('fs');
const path = require('path');

const WIKI_DIR = path.join(__dirname, '../../knowledge/wiki');
const SOURCES_DIR = path.join(__dirname, '../../knowledge/sources');

// Fallback baseline wiki articles if files are not yet created on disk
const BASELINE_ARTICLES = [
  {
    slug: 'overview',
    title: 'California Divorce Overview',
    topic: 'Fundamentals',
    summary: 'Overview of dissolution, residency requirements (6 months in CA, 3 months in county), and legal separation options.',
    content: `> *Disclaimer: This platform provides legal and financial information for education and readiness in California. It does not constitute formal legal advice.*

# California Divorce Overview

In California, the legal term for divorce is **dissolution of marriage**. A divorce permanently ends your marriage or registered domestic partnership, allowing both parties to remarry.

## Residency Requirements
To file for divorce in California:
- At least one spouse must have lived in **California for the past 6 months**.
- At least one spouse must have lived in the **county of filing for the past 3 months**.

*Note: If you do not meet residency requirements yet, you can file for Legal Separation immediately and amend to divorce once requirements are met.*

## Key Options for Ending or Pausing Marriage
1. **Regular Dissolution (Divorce):** Standard process requiring one spouse to file and serve the other.
2. **Joint Petition for Divorce:** Both spouses file together if mutually agreeing.
3. **Summary Dissolution:** Expedited process for marriages under 5 years with minimal assets and no children.
4. **Legal Separation:** Divides property and issues support orders without ending marital status or requiring a 6-month wait.
5. **Annulment:** Declares a marriage legally invalid from the start under specific narrow conditions.`
  },
  {
    slug: 'process',
    title: 'The 4-Step California Divorce Process',
    topic: 'Workflow',
    summary: 'Detailed guide on the 4 main stages of California divorce and the statutory 6-month waiting period.',
    content: `> *Disclaimer: This platform provides legal and financial information for education and readiness in California. It does not constitute formal legal advice.*

# The 4-Step California Divorce Process

Every California divorce follows four primary procedural stages.

## The Statutory 6-Month Waiting Period
Under California law, a divorce cannot be finalized until **at least 6 months** have passed from the date the respondent was legally served with court papers (or filed a Response).

## The 4 Main Steps
1. **Part 1: Start the Case (File & Serve)**
   - Petitioner files Petition (Form FL-100) and Summons (Form FL-110).
   - Server personally delivers file-stamped copies to the Respondent with a blank Response (Form FL-120).
   - Server fills out Proof of Service (Form FL-115).

2. **Part 2: Mandatory Financial Disclosures**
   - Both parties must complete and exchange Preliminary Declarations of Disclosure (Form FL-140, FL-150, FL-142/FL-160) within 60 days of filing.
   - Proof of service of disclosure (Form FL-141) is filed with the court.

3. **Part 3: Make Decisions & Agreements**
   - Negotiate property division, spousal support, and debt allocation.
   - Reach a written settlement agreement or proceed to court hearings if contested.

4. **Part 4: Finalize the Divorce**
   - Submit final Judgment paperwork (Form FL-180, FL-190).
   - Court signs and issues final Notice of Entry of Judgment.`
  },
  {
    slug: 'financial-disclosures',
    title: 'Mandatory Financial Disclosures',
    topic: 'Money & Property',
    summary: 'Rules for preliminary and final declarations of disclosure (FL-140, FL-150, FL-142/FL-160).',
    content: `> *Disclaimer: This platform provides legal and financial information for education and readiness in California. It does not constitute formal legal advice.*

# Mandatory Financial Disclosures in California

Under California Family Code §§ 2102, 2104, and 2105, both spouses must fully disclose all assets, liabilities, income, and expenses.

## Key Principles
- **Financial documents are NOT filed with the court.** You exchange them directly with your spouse to maintain privacy.
- **Form FL-141 (Declaration Regarding Service)** is the only document filed with the court to verify you complied.

## Required Disclosure Package
1. **FL-140 (Declaration of Disclosure):** Cover sheet signed by disclosing spouse.
2. **FL-150 (Income and Expense Declaration):** Details monthly income and living expenses. Attach 2 months of pay stubs and 2 years of tax returns.
3. **FL-142 (Schedule of Assets and Debts) or FL-160 (Property Declaration):** Itemizes real estate, bank accounts, retirement plans, vehicles, and credit card debts.

## Statutory Deadlines
- **Petitioner:** Within 60 days of filing the Petition.
- **Respondent:** Within 60 days of filing the Response.`
  },
  {
    slug: 'property-and-debts',
    title: 'Community vs. Separate Property',
    topic: 'Money & Property',
    summary: 'Division of marital property under Cal. Fam. Code § 760, § 770, § 2550, Moore/Marsden, and FC § 2640.',
    content: `> *Disclaimer: This platform provides legal and financial information for education and readiness in California. It does not constitute formal legal advice.*

# Community vs. Separate Property in California

California is a **Community Property state**. Understanding the distinction between community and separate property is vital for fair financial division.

## Community Property (Cal. Fam. Code § 760)
All real or personal property acquired during the marriage while domiciled in California is presumed to be community property, regardless of whose name is on the title or who earned the money.
- **Division Standard (Cal. Fam. Code § 2550):** Net community estate is divided equally (50/50).

## Separate Property (Cal. Fam. Code §§ 770–771)
Separate property belongs exclusively to one spouse and includes:
- Assets owned before marriage.
- Gifts or inheritances received individually at any time.
- Earnings and accumulations acquired **after the Date of Separation**.

## Special Legal Rules
- **FC § 2640 Reimbursement:** Right to dollar-for-dollar reimbursement (without interest) for separate property down payments contributed to community real estate.
- **Moore/Marsden Equity Rule:** Determines community equity share when community funds pay down principal mortgage on a home owned by one spouse prior to marriage.`
  },
  {
    slug: 'safety',
    title: 'Domestic Violence & Financial Safety',
    topic: 'Safety & Crisis',
    summary: 'Emergency resources, DV hotline (1-800-799-SAFE), restraining orders, and quick exit safety measures.',
    content: `> *Disclaimer: This platform provides legal and financial information for education and readiness in California. It does not constitute formal legal advice.*

# Domestic Violence & Financial Safety

Safety for you and your children is the absolute highest priority. Financial control and isolation are common forms of domestic abuse.

## Emergency Resources
- **Immediate Danger:** Call **911** immediately.
- **National Domestic Violence Hotline:** Call **1-800-799-SAFE (7233)** or text "START" to 88788 for free, confidential 24/7 support.

## Safety Provisions in California Family Law
- **Domestic Violence Restraining Orders (DVRO):** Provides emergency move-out orders, temporary custody, and support.
- **Impact on Support (Cal. Fam. Code § 4325):** Rebuttable presumption against awarding spousal support to a spouse convicted of domestic violence.`
  }
];

/**
 * List all knowledge base articles (reads from disk or falls back to baseline).
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
            file
          };
        });
      }
    }
  } catch (err) {
    console.warn('[KnowledgeStore] Error reading wiki dir, using baseline articles:', err.message);
  }
  return BASELINE_ARTICLES.map(({ slug, title, topic, summary }) => ({ slug, title, topic, summary }));
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

  const found = BASELINE_ARTICLES.find(a => a.slug === slug);
  return found || null;
}

/**
 * Search knowledge base by query string.
 */
function searchKnowledge(query) {
  if (!query || typeof query !== 'string') return [];
  const q = query.toLowerCase().trim();
  const articles = BASELINE_ARTICLES;

  return articles.filter(art => {
    return (
      art.title.toLowerCase().includes(q) ||
      art.summary.toLowerCase().includes(q) ||
      art.content.toLowerCase().includes(q) ||
      art.topic.toLowerCase().includes(q)
    );
  });
}

module.exports = {
  listArticles,
  getArticleBySlug,
  searchKnowledge,
  BASELINE_ARTICLES
};
