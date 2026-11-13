const express = require('express');
const router = express.Router();
const knowledgeStore = require('../store/knowledgeStore');

// GET list all knowledge base articles
router.get('/articles', (req, res) => {
  const articles = knowledgeStore.listArticles();
  return res.json({ success: true, count: articles.length, articles });
});

// GET search knowledge base by keyword/topic query
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Search query parameter "q" is required' });
  }

  const results = knowledgeStore.searchKnowledge(q);
  return res.json({
    success: true,
    query: q,
    count: results.length,
    results
  });
});

// GET deterministic rules
router.get('/rules', (req, res) => {
  const rules = knowledgeStore.getRules();
  return res.json({ success: true, ...rules });
});

// POST evaluate deterministic rules against user profile
router.post('/rules/evaluate', (req, res) => {
  const profile = req.body || {};
  const matchedCards = knowledgeStore.evaluateRules(profile);
  return res.json({
    success: true,
    count: matchedCards.length,
    cards: matchedCards
  });
});

// GET demo persona
router.get('/persona', (req, res) => {
  const persona = knowledgeStore.getDemoPersona();
  return res.json({ success: true, persona });
});

// GET agent guidelines
router.get('/guidelines', (req, res) => {
  const guidelines = knowledgeStore.getAgentGuidelines();
  return res.json({ success: true, guidelines });
});

// GET sources catalog
router.get('/sources', (req, res) => {
  const sources = knowledgeStore.getSources();
  return res.json({ success: true, sources });
});

// GET specific knowledge article by slug
router.get('/article/:slug', (req, res) => {
  const { slug } = req.params;
  const article = knowledgeStore.getArticleBySlug(slug);

  if (!article) {
    return res.status(404).json({ error: `Article with slug "${slug}" not found.` });
  }

  return res.json({ success: true, article });
});

module.exports = router;
