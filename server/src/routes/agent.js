const express = require('express');
const router = express.Router();
const memoryStore = require('../store/memoryStore');
const knowledgeStore = require('../store/knowledgeStore');

// GET agent memory per user profile
router.get('/memory/:userId', (req, res) => {
  const { userId } = req.params;
  const memory = memoryStore.getAgentMemory(userId);
  return res.json({ success: true, memory });
});

// POST update agent memory (add discovered assets, notes, checklist progress)
router.post('/memory', (req, res) => {
  const { userId, ...memoryUpdates } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const updatedMemory = memoryStore.updateAgentMemory(userId, memoryUpdates);
  return res.json({
    success: true,
    message: 'Agent memory updated successfully',
    memory: updatedMemory
  });
});

// GET chat history
router.get('/chat/:userId', (req, res) => {
  const { userId } = req.params;
  const history = memoryStore.getChatHistory(userId);
  return res.json({ success: true, history });
});

// POST chat message with Ruth AI agent
router.post('/chat', async (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  // Record user message
  memoryStore.appendChatMessage(userId, { sender: 'user', text: message });

  // Retrieve user profile & agent memory context
  const profile = memoryStore.getUserProfile(userId) || {};
  const memory = memoryStore.getAgentMemory(userId) || {};

  // Evaluate matching deterministic rules cards for the profile
  const matchedCards = knowledgeStore.evaluateRules(profile);

  // Search knowledge base articles matching user query
  const searchResults = knowledgeStore.searchKnowledge(message);

  let agentReply = '';
  const lowerMsg = message.toLowerCase();

  // Grounded agent logic following agent-guidelines.md (plain English, cite sources, disclaimers, next step)
  if (lowerMsg.includes('house') || lowerMsg.includes('home') || lowerMsg.includes('mortgage')) {
    agentReply = `I understand how deeply important keeping the family home feels right now, especially for stability. Under California community property law, real estate acquired during marriage is presumed community property (Cal. Fam. Code § 760) [src-005]. If your spouse owned the house prior to marriage or paid down principal using community income, the Moore/Marsden equity rule determines community appreciation [src-005]. Keeping the home requires looking closely at property taxes, maintenance, and buying out your spouse's share of equity.\n\nNext step: Upload your mortgage statement to run our 5-Year Home Equity & Affordability Simulation.\n\nThis is information, not legal advice.`;
  } else if (lowerMsg.includes('hidden') || lowerMsg.includes('account') || lowerMsg.includes('tax') || lowerMsg.includes('bank') || lowerMsg.includes('gap')) {
    agentReply = `If your spouse handled the family finances, it's very common to feel unsure of what exists. We look for possible gaps worth asking about rather than making assumptions. Mandatory financial disclosures (Forms FL-140, FL-142, and FL-150) require both spouses to share all income, assets, and debts within 60 days of filing [S6, S7, S8]. Tax returns are our best investigative tool—Schedule B lists interest and dividends from accounts, and W-2s show retirement contributions.\n\nNext step: Upload a joint tax return or W-2 so we can extract account references and add any gaps to your Lawyer Prep Brief.\n\nThis is information, not legal advice.`;
  } else if (lowerMsg.includes('lawyer') || lowerMsg.includes('attorney') || lowerMsg.includes('cost') || lowerMsg.includes('fee')) {
    agentReply = `If your spouse earns significantly more than you, California Family Code section 2030 allows you to ask the court to order your spouse to pay for your lawyer and legal costs [S5]. This ensures both sides have fair access to legal representation [S2, S3]. To request fee help, you'll need Form FL-300 (Request for Order), Form FL-319 (Request for Attorney's Fees Attachment), Form FL-150 (Income and Expense Declaration), and Form FL-158 (Supporting Declaration) [S3, S4]. Missing Form FL-319 can cause a request to be denied [S13].\n\nNext step: Add Form FL-319 and FL-150 to your document checklist.\n\nThis is information, not legal advice.`;
  } else if (lowerMsg.includes('alimony') || lowerMsg.includes('support') || lowerMsg.includes('temporary') || lowerMsg.includes('bill')) {
    agentReply = `You can ask the judge for temporary spousal support as soon as your divorce case is filed to help pay living costs while the case is open (Cal. Fam. Code § 3600) [S1, S19]. The court orders support based on your financial need and your spouse's ability to pay [S10, S19]. You will file a Request for Order (Form FL-300) along with your Income and Expense Declaration (Form FL-150) [S10].\n\nNext step: Prepare your FL-150 Income and Expense Declaration with your recent pay stubs.\n\nThis is information, not legal advice.`;
  } else if (lowerMsg.includes('timeline') || lowerMsg.includes('how long') || lowerMsg.includes('wait') || lowerMsg.includes('process')) {
    agentReply = `In California, the earliest a divorce can be final is six months and one day after your spouse is legally served with the Petition (Form FL-100) and Summons (Form FL-110) [S11, S20]. This six-month waiting period is mandatory and cannot be shortened [S11]. Contested divorces average 12 to 24 months [S11].\n\nNext step: Check your residency status (6 months in California, 3 months in county) before filing [S12].\n\nThis is information, not legal advice.`;
  } else if (searchResults.length > 0) {
    const topArt = searchResults[0];
    agentReply = `${topArt.title}: ${topArt.summary}\n\nNext step: Explore the full article in the Knowledge Base or add related forms to your document vault.\n\nThis is information, not legal advice.`;
  } else {
    agentReply = `I hear you, and taking control of financial details step-by-step is the most empowering action you can take. Under California Community Property law, both spouses have equal rights to community assets and mandatory financial disclosure requirements [S6, S7].\n\nNext step: Tell me whether you'd like to review your financial disclosures, temporary support options, or lawyer prep checklist.\n\nThis is information, not legal advice.`;
  }

  const agentMessageRecord = {
    sender: 'agent',
    text: agentReply,
    matchedCards,
    suggestedActions: [
      'Review Discovered Assets',
      'Run 5-Year Life Projection',
      'Download Lawyer Prep Brief'
    ]
  };

  memoryStore.appendChatMessage(userId, agentMessageRecord);

  return res.json({
    success: true,
    reply: agentReply,
    messageRecord: agentMessageRecord,
    matchedCards
  });
});

module.exports = router;
