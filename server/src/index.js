const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/user');
const agentRoutes = require('./routes/agent');
const knowledgeRoutes = require('./routes/knowledge');
const firebaseAdmin = require('./config/firebaseAdmin');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '15mb' }));

// Routes
app.use('/api/user', userRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/knowledge', knowledgeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    name: 'RuthAI Backend Service',
    description: "Know What's Yours - Divorce Financial Navigation API",
    firebase: firebaseAdmin.getStatus(),
    time: new Date().toISOString()
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` RuthAI Server running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
}

module.exports = app;
