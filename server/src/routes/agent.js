const express = require('express');
const router = express.Router();
const memoryStore = require('../store/memoryStore');
const knowledgeStore = require('../store/knowledgeStore');
const wikiStore = require('../store/wikiStore');
const ruthEngine = require('../services/ruthEngine');
const firebaseAdmin = require('../config/firebaseAdmin');

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

// GET user Personal LLM Wiki sections and memory statistics
router.get('/wiki/:userId', async (req, res) => {
  const { userId } = req.params;
  const wiki = await wikiStore.getWikiAsync(userId);
  return res.json({
    success: true,
    wiki,
    stats: wiki.stats,
    storage: firebaseAdmin.getStatus()
  });
});

// POST update specific wiki section, append facts, edit a fact, or delete a fact
router.post('/wiki/:userId', async (req, res) => {
  const { userId } = req.params;
  const { action = 'add', section, factId, text, category, source, facts } = req.body || {};

  if (!section || !wikiStore.WIKI_SECTIONS[section]) {
    return res.status(400).json({
      error: `Valid section is required (${wikiStore.SECTION_KEYS.join(', ')})`
    });
  }

  try {
    let wiki;
    let addedCount = 0;

    if (action === 'update') {
      if (!factId) return res.status(400).json({ error: 'factId is required for update' });
      wiki = await wikiStore.updateFactAsync(userId, section, factId, text, category);
    } else if (action === 'delete') {
      if (!factId) return res.status(400).json({ error: 'factId is required for delete' });
      wiki = await wikiStore.deleteFactAsync(userId, section, factId);
    } else if (action === 'replace') {
      wiki = await wikiStore.replaceSectionFactsAsync(userId, section, facts || []);
    } else {
      const payload = facts || (text ? [{ text, category: category || 'Note', source: source || 'Manual Entry' }] : []);
      const result = await wikiStore.addFactsAsync(userId, section, payload);
      wiki = result.wiki;
      addedCount = result.addedCount;
    }

    return res.json({
      success: true,
      wiki,
      stats: wiki.stats,
      addedCount
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// DELETE purge all user wiki & memory (CCPA compliance & safety)
router.delete('/wiki/:userId', async (req, res) => {
  const { userId } = req.params;
  const wiki = await wikiStore.purgeWikiAsync(userId);
  memoryStore.purgeUserMemory(userId);
  return res.json({
    success: true,
    message: 'All personal wiki and conversation memory purged.',
    wiki,
    stats: wiki.stats
  });
});

// GET chat history
router.get('/chat/:userId', (req, res) => {
  const { userId } = req.params;
  const history = memoryStore.getChatHistory(userId);
  return res.json({ success: true, history });
});

// POST chat message with Ruth AI agent (Dual-pass: Fact Extraction + Context-Injected Response)
router.post('/chat', async (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  // Record user message
  memoryStore.appendChatMessage(userId, { sender: 'user', text: message });

  // Pass 1: Extract personal, financial, priority, and legal-prep facts into the Personal LLM Wiki
  const extractedCandidates = ruthEngine.extractFactsFromMessage(message);
  const newlyAddedFacts = [];

  for (const item of extractedCandidates) {
    const resAdd = await wikiStore.addFactsAsync(userId, item.section, {
      text: item.text,
      category: item.category,
      source: item.source
    });
    if (resAdd.addedFacts.length > 0) {
      for (const f of resAdd.addedFacts) {
        newlyAddedFacts.push({ ...f, section: item.section });
      }
    }
  }

  // Retrieve user profile & agent memory context
  const profile = memoryStore.getUserProfile(userId) || {};

  // Evaluate matching deterministic rules cards for the profile
  const matchedCards = knowledgeStore.evaluateRules(profile);

  // Search knowledge base articles matching user query
  const searchResults = knowledgeStore.searchKnowledge(message);

  // Generate grounded Ruth AI response via ruthEngine
  const generated = await ruthEngine.generateRuthResponse({
    userId,
    message,
    profile,
    newlyAddedFacts
  });

  let agentReply = generated.reply;

  // Append knowledge base citation if applicable and not already cited
  if (searchResults.length > 0 && !agentReply.includes('[S') && !agentReply.includes('[src-')) {
    const topArt = searchResults[0];
    agentReply += `\n\n*Related Knowledge Base Topic:* ${topArt.title} — ${topArt.summary}`;
  }

  const agentMessageRecord = {
    sender: 'agent',
    text: agentReply,
    matchedCards,
    suggestedActions: generated.suggestedActions,
    extractedFacts: newlyAddedFacts.filter((f) => f.section !== 'interaction_log')
  };

  memoryStore.appendChatMessage(userId, agentMessageRecord);
  const latestWiki = await wikiStore.getWikiAsync(userId);

  return res.json({
    success: true,
    reply: agentReply,
    messageRecord: agentMessageRecord,
    matchedCards,
    extractedFacts: agentMessageRecord.extractedFacts,
    wiki: latestWiki,
    wikiStats: latestWiki.stats
  });
});

module.exports = router;
