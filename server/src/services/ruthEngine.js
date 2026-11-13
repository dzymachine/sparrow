const wikiStore = require('../store/wikiStore');

const INSTITUTIONS = [
  'Vanguard', 'Fidelity', 'Charles Schwab', 'Schwab', 'Chase', 'Bank of America',
  'Wells Fargo', 'Citibank', 'Citi', 'Capital One', 'Ally', 'Morgan Stanley',
  'Goldman Sachs', 'Merrill Lynch', 'E*TRADE', 'E-Trade', 'Robinhood',
  'TD Ameritrade', 'Coinbase', 'Venmo', 'PayPal', 'TIAA', 'BlackRock',
  'Edward Jones', 'American Express', 'Amex', 'Discover', 'USAA', 'Navy Federal'
];

const US_STATES = [
  'California', 'Texas', 'New York', 'Florida', 'Illinois', 'Washington',
  'Massachusetts', 'Colorado', 'Arizona', 'Georgia', 'North Carolina',
  'Virginia', 'New Jersey', 'Pennsylvania', 'Ohio', 'Michigan', 'Oregon'
];

const COMMUNITY_PROPERTY_STATES = new Set([
  'Arizona', 'California', 'Idaho', 'Louisiana', 'Nevada',
  'New Mexico', 'Texas', 'Washington', 'Wisconsin'
]);

/**
 * Strict key-fact extractor: extracts only explicitly stated personal,
 * financial, priority, or legal-prep facts from the user's message.
 */
function extractFactsFromMessage(message) {
  const text = String(message || '').trim();
  if (!text) return [];

  const extracted = [];
  const lower = text.toLowerCase();

  // 1. Named financial institutions & discovered accounts
  const matchedInstitutions = INSTITUTIONS.filter((inst) =>
    new RegExp(`\\b${inst.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
  );

  for (const inst of matchedInstitutions) {
    const isHiddenLead = /just found|found|secret|hidden|didn't know|didnt know|unreported|undisclosed|spouse|husband|wife/i.test(text);
    const category = isHiddenLead ? 'Account Lead' : 'Financial Account';
    extracted.push({
      section: 'financial_footprint',
      category,
      text: `${inst} account disclosed: "${text.length > 140 ? text.slice(0, 137) + '...' : text}"`,
      source: 'Chat Disclosure'
    });
  }

  // 2. General account types if no specific institution matched (or additional retirement/debt)
  if (/\b401\s?\(?k\)?\b/i.test(text) && matchedInstitutions.length === 0) {
    extracted.push({
      section: 'financial_footprint',
      category: 'Retirement',
      text: `401(k) retirement account mentioned: "${text.length > 140 ? text.slice(0, 137) + '...' : text}"`,
      source: 'Chat Disclosure'
    });
  }
  if (/\b(roth\s+)?ira\b/i.test(text) && matchedInstitutions.length === 0) {
    extracted.push({
      section: 'financial_footprint',
      category: 'Retirement',
      text: `IRA account mentioned: "${text.length > 140 ? text.slice(0, 137) + '...' : text}"`,
      source: 'Chat Disclosure'
    });
  }
  if (/\bpension\b/i.test(text)) {
    extracted.push({
      section: 'financial_footprint',
      category: 'Retirement',
      text: `Pension benefit mentioned (may require QDRO valuation): "${text.length > 140 ? text.slice(0, 137) + '...' : text}"`,
      source: 'Chat Disclosure'
    });
  }
  if (/\b(crypto|bitcoin|ethereum|coinbase|wallet)\b/i.test(text) && !matchedInstitutions.includes('Coinbase')) {
    extracted.push({
      section: 'financial_footprint',
      category: 'Digital Assets',
      text: `Cryptocurrency / digital asset mentioned: "${text.length > 140 ? text.slice(0, 137) + '...' : text}"`,
      source: 'Chat Disclosure'
    });
  }
  if (/\b(credit card debt|heloc|student loan|debt|owe \$)\b/i.test(text)) {
    extracted.push({
      section: 'financial_footprint',
      category: 'Liability',
      text: `Debt / liability disclosed: "${text.length > 140 ? text.slice(0, 137) + '...' : text}"`,
      source: 'Chat Disclosure'
    });
  }
  if (/\b(schedule b|schedule d|1040|tax return)\b/i.test(text)) {
    extracted.push({
      section: 'financial_footprint',
      category: 'Tax Lead',
      text: `Tax document lead mentioned: "${text.length > 140 ? text.slice(0, 137) + '...' : text}"`,
      source: 'Chat Disclosure'
    });
  }

  // 3. Real estate & mortgage terms (e.g., "bought the house in 2012 for $400k and our mortgage rate is 3.2%")
  const hasRealEstate = /\b(house|home|mortgage|condo|property|refinance|equity)\b/i.test(text);
  const yearMatch = text.match(/\b(?:in|since|bought(?:\s+\w+)*\s+in)\s+((?:19|20)\d{2})\b/i);
  const priceMatches = text.match(/\$[\d,]+(?:\.\d+)?\s*[kKmM]?/g);
  const rateMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:rate|interest|apr|mortgage)?/i) ||
                    text.match(/(?:rate|interest|mortgage)\s*(?:is|of|at)?\s*(\d+(?:\.\d+)?)\s*%/i);

  if (hasRealEstate && (yearMatch || priceMatches || rateMatch)) {
    const details = [];
    if (yearMatch) details.push(`purchased/dated ${yearMatch[1]}`);
    if (priceMatches && priceMatches.length > 0) details.push(`amount ${priceMatches.join(' / ')}`);
    if (rateMatch) details.push(`mortgage rate ${rateMatch[1]}%`);
    extracted.push({
      section: 'financial_footprint',
      category: 'Real Estate',
      text: `Real estate / mortgage details: ${details.join(', ')} (from: "${text.length > 120 ? text.slice(0, 117) + '...' : text}")`,
      source: 'Chat Disclosure'
    });
  }

  // 4. Profile & Jurisdiction facts
  for (const st of US_STATES) {
    if (new RegExp(`\\b${st}\\b`, 'i').test(text)) {
      const propType = COMMUNITY_PROPERTY_STATES.has(st) ? 'Community Property' : 'Equitable Distribution';
      extracted.push({
        section: 'profile',
        category: 'Jurisdiction',
        text: `Jurisdiction: ${st} (${propType} state)`,
        source: 'Chat Disclosure'
      });
    }
  }

  const marriageMatch = text.match(/married\s+(?:for\s+)?(\d{1,2})\s*(?:years?|yrs?)/i) ||
                        text.match(/(\d{1,2})[-\s]year\s+marriage/i);
  if (marriageMatch) {
    const yrs = parseInt(marriageMatch[1], 10);
    extracted.push({
      section: 'profile',
      category: 'Marriage',
      text: `Length of marriage: ${yrs} years`,
      source: 'Chat Disclosure'
    });
  }

  const kidsMatch = text.match(/\b(\d{1,2})\s+(?:kids?|children)\b/i);
  if (kidsMatch) {
    extracted.push({
      section: 'profile',
      category: 'Family',
      text: `Dependents: ${kidsMatch[1]} children`,
      source: 'Chat Disclosure'
    });
  }

  if (/\b(stay[- ]at[- ]home|homemaker|part[- ]time|caregiver|unemployed|not working)\b/i.test(text)) {
    extracted.push({
      section: 'profile',
      category: 'Employment & Role',
      text: `Employment / caregiving context: "${text.length > 120 ? text.slice(0, 117) + '...' : text}"`,
      source: 'Chat Disclosure'
    });
  }

  // 5. Priorities & emotional goals
  if (/\b(keep(?:ing)?\s+(?:the\s+)?(?:house|home)|stay\s+in\s+(?:the\s+)?(?:house|home))\b/i.test(text)) {
    extracted.push({
      section: 'priorities_and_goals',
      category: 'Housing',
      text: 'Priority: Wants to evaluate keeping the family home',
      source: 'Chat Disclosure'
    });
  }
  if (/\b(hiding\s+(?:money|assets|accounts)|hidden\s+account|just\s+found|secret\s+account)\b/i.test(text)) {
    extracted.push({
      section: 'priorities_and_goals',
      category: 'Transparency',
      text: 'Concern: Potential undisclosed or hidden marital assets',
      source: 'Chat Disclosure'
    });
  }
  if (/\b(alimony|spousal\s+support|spousal\s+maintenance)\b/i.test(text)) {
    extracted.push({
      section: 'priorities_and_goals',
      category: 'Support',
      text: 'Priority: Understanding spousal support / maintenance eligibility',
      source: 'Chat Disclosure'
    });
  }
  if (/\b(child\s+support|custody)\b/i.test(text)) {
    extracted.push({
      section: 'priorities_and_goals',
      category: 'Children',
      text: 'Priority: Child support and parenting/custody stability',
      source: 'Chat Disclosure'
    });
  }

  // 6. Lawyer readiness
  if (/\b(don'?t have|missing|no access|won'?t show|refuses to share)\b/i.test(text)) {
    extracted.push({
      section: 'lawyer_readiness',
      category: 'Missing Documents',
      text: `Document access gap noted: "${text.length > 120 ? text.slice(0, 117) + '...' : text}"`,
      source: 'Chat Disclosure'
    });
  }
  if (/\b(ask\s+(?:my|the|an)\s+(?:lawyer|attorney)|subpoena|qdro|forensic|prenup)\b/i.test(text)) {
    extracted.push({
      section: 'lawyer_readiness',
      category: 'Legal Question',
      text: `Consultation topic: "${text.length > 120 ? text.slice(0, 117) + '...' : text}"`,
      source: 'Chat Disclosure'
    });
  }

  // 7. Interaction log takeaway when facts were disclosed
  if (extracted.length > 0) {
    const summaryTopics = [...new Set(extracted.map((e) => e.category))].join(', ');
    extracted.push({
      section: 'interaction_log',
      category: 'Takeaway',
      text: `Discussed ${summaryTopics}: "${text.length > 90 ? text.slice(0, 87) + '...' : text}"`,
      source: 'Conversation Log'
    });
  }

  return extracted;
}

/**
 * Optional Gemini API call when GEMINI_API_KEY is configured.
 * Falls back cleanly to deterministic extraction/response if unavailable.
 */
async function callGeminiIfConfigured(promptText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.warn('[RuthEngine] Gemini API fallback triggered:', err.message);
    return null;
  }
}

function findJurisdictionFromWiki(wiki, profile) {
  const profileFacts = wiki?.sections?.profile?.facts || [];
  const jurFact = profileFacts.find((f) => /jurisdiction:/i.test(f.text));
  if (jurFact) {
    for (const st of US_STATES) {
      if (jurFact.text.toLowerCase().includes(st.toLowerCase())) return st;
    }
  }
  return profile?.stateJurisdiction || 'California';
}

function findMarriageYearsFromWiki(wiki, profile) {
  const profileFacts = wiki?.sections?.profile?.facts || [];
  const marFact = profileFacts.find((f) => /length of marriage:/i.test(f.text));
  if (marFact) {
    const m = marFact.text.match(/(\d+)/);
    if (m) return parseInt(m[1], 10);
  }
  return profile?.marriageLengthYears || null;
}

function getFootprintHighlights(wiki) {
  const facts = wiki?.sections?.financial_footprint?.facts || [];
  return facts.map((f) => f.text);
}

/**
 * Generates an empathetic, trauma-informed, wiki-context-grounded response.
 */
async function generateRuthResponse({ userId, message, profile, newlyAddedFacts = [] }) {
  const wiki = await wikiStore.getWikiAsync(userId);
  const compiledContext = await wikiStore.compileWikiContextAsync(userId);
  const jurisdiction = findJurisdictionFromWiki(wiki, profile);
  const isCommunityProp = COMMUNITY_PROPERTY_STATES.has(jurisdiction);
  const marriageYears = findMarriageYearsFromWiki(wiki, profile);
  const footprintFacts = getFootprintHighlights(wiki);
  const lawyerFacts = (wiki?.sections?.lawyer_readiness?.facts || []).map((f) => f.text);

  // Try Gemini if API key is configured
  if (process.env.GEMINI_API_KEY) {
    const systemPrompt = `You are Ruth, a warm, empathetic, trauma-informed AI financial discovery companion for women navigating divorce.
You are strictly educational (include a brief reminder that this is financial education, not legal advice).
Proactively reference relevant facts from the user's Personal LLM Wiki below when answering so they feel heard and remembered.

USER PERSONAL LLM WIKI:
${compiledContext}

USER MESSAGE:
${message}

Respond concisely (3-5 sentences), empathetically, and grounded in their state's rules (${jurisdiction}).`;

    const geminiText = await callGeminiIfConfigured(systemPrompt);
    if (geminiText) {
      return {
        reply: geminiText.trim(),
        suggestedActions: buildSuggestedActions(message, footprintFacts),
        compiledContextUsed: true
      };
    }
  }

  // Deterministic, deeply personalized wiki-grounded response
  const lower = String(message || '').toLowerCase();
  const parts = [];

  // Acknowledge newly saved facts if any
  const nonLogAdded = newlyAddedFacts.filter((f) => f.section !== 'interaction_log');
  if (nonLogAdded.length > 0) {
    const savedLabels = [...new Set(nonLogAdded.map((f) => f.category))].join(', ');
    parts.push(`I've noted that in your Personal Wiki (${savedLabels}) so you don't have to repeat yourself.`);
  }

  // Check for specific account/institution references in wiki
  const mentionedAccounts = footprintFacts.filter((t) =>
    INSTITUTIONS.some((inst) => t.toLowerCase().includes(inst.toLowerCase())) ||
    /401\(k\)|ira|pension|schedule b|vanguard|fidelity/i.test(t)
  );
  const realEstateFacts = footprintFacts.filter((t) =>
    /real estate|residence|house|mortgage|3\.\d%|400k|850,000/i.test(t)
  );

  if (lower.includes('remember') || lower.includes('know about me') || lower.includes('wiki') || lower.includes('summary')) {
    if (wiki.stats.totalFacts === 0) {
      parts.push(`Right now your Personal Wiki is completely clear. Whenever you share details about your state, marriage length, accounts, or goals, I'll organize them here so we can build your financial picture together.`);
    } else {
      const highlights = [];
      if (jurisdiction) highlights.push(`you're navigating this in **${jurisdiction}** (${isCommunityProp ? 'Community Property' : 'Equitable Distribution'})`);
      if (marriageYears) highlights.push(`a **${marriageYears}-year marriage**`);
      if (mentionedAccounts.length > 0) highlights.push(`tracked financial leads including **${mentionedAccounts.slice(0, 3).join('; ')}**`);
      if (realEstateFacts.length > 0) highlights.push(`property details (**${realEstateFacts[0]}**)`);
      parts.push(`Here is what I currently remember in your Personal Wiki: ${highlights.join(', ')}. You can inspect, edit, or purge any of these details anytime in the **Memory Inspector** tab.`);
    }
  } else if (lower.includes('house') || lower.includes('home') || lower.includes('mortgage') || lower.includes('refinance')) {
    const homeContext = realEstateFacts.length > 0
      ? `Looking at what we have recorded (**${realEstateFacts[0]}**), `
      : '';
    parts.push(
      `I understand how important stability and keeping your home can feel right now. ${homeContext}in ${jurisdiction}, keeping the marital home means evaluating both equity buyout rules and whether refinancing at current rates is sustainable on post-divorce income. Let's run the numbers in your 5-Year Life Projection so you can make a clear-eyed decision without becoming house-rich and cash-poor.`
    );
  } else if (
    lower.includes('account') || lower.includes('hidden') || lower.includes('vanguard') ||
    lower.includes('fidelity') || lower.includes('bank') || lower.includes('tax') ||
    lower.includes('find') || lower.includes('asset') || lower.includes('401k') || lower.includes('401(k)')
  ) {
    const acctRef = mentionedAccounts.length > 0
      ? `Based on your Personal Wiki, we already have these accounts flagged: **${mentionedAccounts.slice(0, 3).join(' | ')}**. `
      : '';
    parts.push(
      `${acctRef}When one spouse managed the accounts, tax returns are your strongest investigative tool—Form 1040 **Schedule B** reveals interest and dividend payers (like brokerage or savings accounts), and **Schedule D** shows stock sales. Under ${jurisdiction} ${isCommunityProp ? 'Community Property' : 'Equitable Distribution'} rules, marital contributions to these accounts are subject to formal disclosure and division.`
    );
  } else if (lower.includes('lawyer') || lower.includes('attorney') || lower.includes('ask') || lower.includes('prep') || lower.includes('legal')) {
    const acctRef = mentionedAccounts.length > 0
      ? `Make sure to bring up the specific accounts in your Wiki (**${mentionedAccounts.slice(0, 2).join('; ')}**) and request formal discovery/statements for each. `
      : '';
    const lawyerRef = lawyerFacts.length > 0
      ? `You also have ${lawyerFacts.length} open item(s) saved in your Lawyer Readiness wiki. `
      : '';
    parts.push(
      `Family law attorneys often charge $350–$650/hour, so walking in organized saves thousands. ${acctRef}${lawyerRef}Ask specifically about: (1) formal Schedule B/account disclosure requests, (2) QDRO requirements for any retirement accounts, and (3) temporary support orders while discovery is pending.`
    );
  } else if (lower.includes('alimony') || lower.includes('support') || lower.includes('maintenance')) {
    const yrNote = marriageYears
      ? `With your **${marriageYears}-year marriage** in **${jurisdiction}**, `
      : `In **${jurisdiction}**, `;
    const caRule = (jurisdiction === 'California' && marriageYears && marriageYears >= 10)
      ? `you cross the 10-year threshold under CA Family Code § 4336 for a "marriage of long duration," meaning the court retains ongoing jurisdiction over spousal support rather than setting an automatic short-term cutoff. `
      : `spousal support duration and amount depend on marriage length, income disparity, and caregiving history. `;
    parts.push(
      `${yrNote}${caRule}Documenting your household's historical standard of living and your caregiving/employment role will be essential for your attorney.`
    );
  } else {
    const contextHint = mentionedAccounts.length > 0
      ? ` We currently have **${mentionedAccounts.length} financial lead(s)** (including ${mentionedAccounts[0]}) saved in your Personal Wiki.`
      : '';
    parts.push(
      `I hear you, and you don't have to carry this alone. Taking financial discovery one step at a time is the most protective thing you can do right now.${contextHint} Would you like to review your tracked accounts, test housing affordability, or prepare questions for an attorney?`
    );
  }

  parts.push(`*Educational guidance only—not legal advice. Please confirm strategy with a licensed ${jurisdiction} family law attorney.*`);

  return {
    reply: parts.join(' '),
    suggestedActions: buildSuggestedActions(message, footprintFacts),
    compiledContextUsed: true
  };
}

function buildSuggestedActions(message, footprintFacts) {
  const lower = String(message || '').toLowerCase();
  if (lower.includes('house') || lower.includes('mortgage')) {
    return ['Run 5-Year Life Projection', 'Inspect Financial Wiki', 'Add Lawyer Question'];
  }
  if (footprintFacts.length > 0) {
    return ['View What Ruth Remembers', 'Download Lawyer Prep Brief', 'Check Schedule B Leads'];
  }
  return ['Tell Ruth About an Account', 'Ask About State Laws', 'View Memory Inspector'];
}

module.exports = {
  extractFactsFromMessage,
  generateRuthResponse
};
