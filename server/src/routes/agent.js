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

  // Empathetic, grounded divorce finance response generation
  // (In production, this hooks into Google Gemini with long context & grounding citations)
  let agentReply = '';
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('house') || lowerMsg.includes('home') || lowerMsg.includes('mortgage')) {
    agentReply = `I understand how deeply important keeping the family home feels right now, especially for stability. Based on your profile in ${profile.stateJurisdiction || 'your state'}, keeping the house requires looking closely at not just the mortgage, but property taxes, maintenance, and whether you'd need to refinance to buy out your spouse's share of equity. Our Post-Divorce Life Projection tool can run this 5-year affordability simulation for you.`;
  } else if (lowerMsg.includes('hidden') || lowerMsg.includes('account') || lowerMsg.includes('tax') || lowerMsg.includes('bank')) {
    agentReply = `If your spouse handled the accounts, it's very common to feel unsure of what exists. Tax returns are our best investigative tool—Schedule B lists interest and dividends from accounts he may not have mentioned, and Schedule D shows stock sales. Upload any joint tax return from the last 3 years to your Document Vault and I'll extract all account references.`;
  } else if (lowerMsg.includes('lawyer') || lowerMsg.includes('attorney') || lowerMsg.includes('cost')) {
    agentReply = `Attorneys bill between $350–$650/hour. Don't spend those costly hours having them organize your basic paperwork. We've compiled your known assets and a targeted list of 3 specific questions in your Lawyer Prep Brief so your first consultation is focused and high-leverage.`;
  } else if (lowerMsg.includes('alimony') || lowerMsg.includes('support') || lowerMsg.includes('maintenance')) {
    const years = profile.marriageLengthYears || 10;
    agentReply = `Given your ${years}-year marriage, spousal support eligibility depends heavily on statutory duration rules in ${profile.stateJurisdiction || 'your jurisdiction'}. For marriages over 10 years, many states consider this a marriage of long duration, which significantly strengthens your position for ongoing transitional support.`;
  } else {
    agentReply = `I hear you, and you are not alone in this. Taking control of the financial details step-by-step is the most empowering thing you can do. Let's make sure we have your documents in the Vault and verify every asset you are legally entitled to. What area would you like to review first?`;
  }

  const agentMessageRecord = {
    sender: 'agent',
    text: agentReply,
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
    messageRecord: agentMessageRecord
  });
});

module.exports = router;
