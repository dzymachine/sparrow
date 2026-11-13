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
