const express = require('express');
const router = express.Router();
const memoryStore = require('../store/memoryStore');

// GET user profile
router.get('/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const profile = memoryStore.getUserProfile(userId);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  return res.json({ success: true, profile });
});

// POST update or create user profile
router.post('/profile', (req, res) => {
  const { userId, ...profileData } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const updatedProfile = memoryStore.setUserProfile(userId, profileData);

  // Synchronize initial agent memory based on onboarding responses
  const currentMemory = memoryStore.getAgentMemory(userId);
  const summaryNotes = [];
  if (profileData.stateJurisdiction) {
    summaryNotes.push(`Jurisdiction: ${profileData.stateJurisdiction}`);
  }
  if (profileData.marriageLengthYears) {
    summaryNotes.push(`Length of marriage: ${profileData.marriageLengthYears} years`);
  }
  if (profileData.financialRole) {
    summaryNotes.push(`Financial role during marriage: ${profileData.financialRole}`);
  }
  if (profileData.primaryConcerns && profileData.primaryConcerns.length) {
    summaryNotes.push(`Primary concerns: ${profileData.primaryConcerns.join(', ')}`);
  }

  if (summaryNotes.length > 0) {
    memoryStore.updateAgentMemory(userId, {
      financialProfileSummary: summaryNotes.join(' | ')
    });
  }

  return res.json({
    success: true,
    message: 'Profile saved successfully',
    profile: updatedProfile
  });
});

module.exports = router;
