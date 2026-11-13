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

  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 512,
          thinkingConfig: { thinkingBudget: 0 }
        }
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
    const systemPrompt = `You are Finch, a warm, casual, down-to-earth AI buddy helping women sort out their money during a divorce.
Style rules (strict):
- Be VERY short and concise (2-3 short sentences max, or 3 tiny bullets if listing things).
- Sound conversational, casual, and friendly—like a supportive, smart friend texting, not a textbook or lawyer.
- Explain complex money or legal stuff in plain, everyday words. NO complex jargon (if you must mention a term like QDRO or Schedule B, explain it in 3-5 simple words).
- Reference relevant facts (including specific account/institution names) from the user's Personal Wiki below so they feel heard.
- End with a super brief reminder that this is just helpful info, not legal advice.

USER PERSONAL LLM WIKI:
${compiledContext}

USER MESSAGE:
${message}

Keep it short, casual, easy to read, and grounded in ${jurisdiction} rules.`;

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
    parts.push(`Got it—saved that so you don't have to repeat yourself.`);
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
      parts.push(`Nothing saved yet! Share your state, accounts, or goals anytime and I'll keep track of it here.`);
    } else {
      const highlights = [];
      if (jurisdiction) highlights.push(`you're in **${jurisdiction}** (${isCommunityProp ? '50/50 split state' : 'fair-split state'})`);
      if (marriageYears) highlights.push(`married **${marriageYears} years**`);
      if (mentionedAccounts.length > 0) highlights.push(`accounts we're tracking: **${mentionedAccounts.slice(0, 3).join('; ')}**`);
      if (realEstateFacts.length > 0) highlights.push(`home info (**${realEstateFacts[0]}**)`);
      parts.push(`Here's what I've got so far: ${highlights.join(', ')}. You can edit or delete any of this anytime in **Memory Inspector**.`);
    }
  } else if (lower.includes('house') || lower.includes('home') || lower.includes('mortgage') || lower.includes('refinance')) {
    const homeContext = realEstateFacts.length > 0
      ? `Based on your notes (**${realEstateFacts[0]}**), `
      : '';
    parts.push(
      `Wanting to keep the house makes total sense. ${homeContext}In ${jurisdiction}, keeping it usually means buying out your spouse's share and refinancing on your own income. Check your **5-Year Life Projection** to see if the monthly payments still feel comfortable.`
    );
  } else if (
    lower.includes('account') || lower.includes('hidden') || lower.includes('vanguard') ||
    lower.includes('fidelity') || lower.includes('bank') || lower.includes('tax') ||
    lower.includes('find') || lower.includes('asset') || lower.includes('401k') || lower.includes('401(k)')
  ) {
    const acctRef = mentionedAccounts.length > 0
      ? `We already have these flagged: **${mentionedAccounts.slice(0, 3).join(' | ')}**. `
      : '';
    parts.push(
      `${acctRef}Tax returns are the easiest place to spot hidden accounts—check **Schedule B** (shows bank and investment interest) and **Schedule D** (shows stock sales). In ${jurisdiction}, money saved during marriage usually has to be shared and split.`
    );
  } else if (lower.includes('lawyer') || lower.includes('attorney') || lower.includes('ask') || lower.includes('prep') || lower.includes('legal')) {
    const acctRef = mentionedAccounts.length > 0
      ? `Bring up the accounts we saved (**${mentionedAccounts.slice(0, 2).join('; ')}**) and ask how to get official statements. `
      : '';
    const lawyerRef = lawyerFacts.length > 0
      ? `You also have ${lawyerFacts.length} note(s) saved for your lawyer. `
      : '';
    parts.push(
      `Lawyers charge by the hour, so going in organized saves real money. ${acctRef}${lawyerRef}Ask them: (1) how to get full account statements, (2) how to split retirement accounts without tax penalties, and (3) if you can get temporary support while things are sorted out.`
    );
  } else if (lower.includes('alimony') || lower.includes('support') || lower.includes('maintenance')) {
    const yrNote = marriageYears
      ? `Since you've been married **${marriageYears} years** in **${jurisdiction}**, `
      : `In **${jurisdiction}**, `;
    const caRule = (jurisdiction === 'California' && marriageYears && marriageYears >= 10)
      ? `California treats 10+ years as a long marriage—meaning spousal support doesn't have an automatic cutoff date. `
      : `spousal support depends on how long you were married, what each of you earns, and who handled caregiving. `;
    parts.push(
      `${yrNote}${caRule}Jot down your usual living costs and work history so your lawyer has the full picture.`
    );
  } else {
    const contextHint = mentionedAccounts.length > 0
      ? ` We've already got **${mentionedAccounts.length} account(s)** saved (like ${mentionedAccounts[0]}).`
      : '';
    parts.push(
      `I've got your back—let's take this one small step at a time.${contextHint} Want to look over your accounts, check if the house fits your budget, or prep questions for a lawyer?`
    );
  }

  parts.push(`*Just helpful info, not legal advice—double-check with a ${jurisdiction} lawyer.*`);

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
