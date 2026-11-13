const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const memoryStore = require('../store/memoryStore');
const wikiStore = require('../store/wikiStore');
const { generateDivorceChecklist } = require('../services/checklistEngine');
const { getGuidedFormSchema, buildDefaultValues } = require('../services/documentFormSchemas');
const { generateFilledDocumentPdf } = require('../services/pdfGenerator');
const { calculatePostDivorceProjection } = require('../services/projectionEngine');

const UPLOADS_ROOT = process.env.UPLOADS_DATA_DIR || path.join(__dirname, '../../data/uploads');

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
router.post('/profile', async (req, res) => {
  const { userId, ...profileData } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const updatedProfile = memoryStore.setUserProfile(userId, profileData);

  // Synchronize initial agent memory based on onboarding responses
  const summaryNotes = [];
  if (profileData.goal) {
    summaryNotes.push(`Goal: ${String(profileData.goal).replace(/_/g, ' ')}`);
  }
  if (profileData.maritalStatus) {
    summaryNotes.push(`Marital status: ${String(profileData.maritalStatus).replace(/_/g, ' ')}`);
  }
  if (profileData.stateJurisdiction) {
    summaryNotes.push(`Jurisdiction: ${profileData.stateJurisdiction}`);
  }
  if (profileData.marriageLengthYears) {
    summaryNotes.push(`Length of marriage: ${profileData.marriageLengthYears} years`);
  }
  if (profileData.hasChildren && profileData.childrenCount) {
    const ages = Array.isArray(profileData.childrenAges) && profileData.childrenAges.length
      ? ` (Ages: ${profileData.childrenAges.join(', ')})`
      : '';
    summaryNotes.push(`Children: ${profileData.childrenCount}${ages}`);
  }
  if (profileData.taxFilingStatus) {
    summaryNotes.push(`Tax filing status: ${String(profileData.taxFilingStatus).replace(/_/g, ' ')}`);
  }
  if (profileData.divorcePathway) {
    summaryNotes.push(`Pathway: ${String(profileData.divorcePathway).replace(/_/g, ' ')}`);
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

  // Sync onboarding responses into the Personal LLM Wiki (and Firebase)
  await wikiStore.syncFromProfileAsync(userId, updatedProfile);

  const checklist = generateDivorceChecklist(
    updatedProfile,
    memoryStore.getChecklistProgress(userId)
  );

  return res.json({
    success: true,
    message: 'Profile saved successfully',
    profile: updatedProfile,
    checklist
  });
});

// GET tailored divorce document checklist for a user
router.get('/checklist/:userId', (req, res) => {
  const { userId } = req.params;
  const profile = memoryStore.getUserProfile(userId);
  const progress = memoryStore.getChecklistProgress(userId);
  const checklist = generateDivorceChecklist(profile || {}, progress);

  return res.json({
    success: true,
    hasProfile: Boolean(profile),
    checklist
  });
});

// POST update status or notes for a specific checklist document
router.post('/checklist/:userId', (req, res) => {
  const { userId } = req.params;
  const { docId, status, notes, completedExternally, opened } = req.body || {};

  if (!docId) {
    return res.status(400).json({ error: 'docId is required' });
  }

  const validStatuses = new Set(['not_started', 'in_progress', 'signed_ready', 'completed']);
  if (status !== undefined && !validStatuses.has(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${Array.from(validStatuses).join(', ')}`
    });
  }

  const existingProgress = memoryStore.getChecklistProgress(userId)[docId] || {};
  const updates = { status, notes };
  if (completedExternally !== undefined) {
    updates.completedExternally = Boolean(completedExternally);
  }
  if (opened && !existingProgress.openedAt) {
    updates.openedAt = new Date().toISOString();
    if (!existingProgress.status || existingProgress.status === 'not_started') {
      updates.status = status || 'in_progress';
    }
  }

  const updatedProgress = memoryStore.updateChecklistItem(userId, docId, updates);
  const profile = memoryStore.getUserProfile(userId);
  const checklist = generateDivorceChecklist(profile || {}, updatedProgress);

  return res.json({
    success: true,
    checklist
  });
});

function computeDraftCompletion(schema, values = {}) {
  let totalRequiredCount = 0;
  let filledRequiredCount = 0;

  for (const sec of schema?.sections || []) {
    for (const f of sec.fields || []) {
      if (f.required) {
        totalRequiredCount += 1;
        const v = values[f.key];
        if (f.type === 'checkbox' ? Boolean(v) : String(v ?? '').trim().length > 0) {
          filledRequiredCount += 1;
        }
      }
    }
  }

  const fieldCompletionPercent =
    totalRequiredCount > 0 ? Math.round((filledRequiredCount / totalRequiredCount) * 100) : 0;
  const isSigned =
    Boolean(values.signatureName && String(values.signatureName).trim()) &&
    Boolean(values.perjuryConfirmed);
  const isAllRequiredFilled =
    totalRequiredCount > 0 && filledRequiredCount === totalRequiredCount;

  return {
    filledRequiredCount,
    totalRequiredCount,
    fieldCompletionPercent,
    isSigned,
    isAllRequiredFilled
  };
}

// Helper to resolve a checklist item + schema for a user
function resolveDocContext(userId, docId) {
  const profile = memoryStore.getUserProfile(userId) || {};
  const agentMemory = memoryStore.getAgentMemory(userId) || {};
  const progress = memoryStore.getChecklistProgress(userId);
  const checklist = generateDivorceChecklist(profile, progress);
  const docItem = checklist.items.find((i) => i.id === docId) || {
    id: docId,
    title: docId,
    formCode: 'FORM',
    actionType: 'Fill & File',
    whoSigns: 'You',
    description: ''
  };
  const schema = getGuidedFormSchema(docItem, profile, agentMemory);
  const defaults = buildDefaultValues(schema);
  const savedDraft = memoryStore.getDocumentDraft(userId, docId);
  const values = { ...defaults, ...(savedDraft?.values || {}) };

  return {
    profile,
    checklist,
    docItem,
    schema,
    defaults,
    values,
    lastSavedAt: savedDraft?.updatedAt || null
  };
}

// GET guided form schema + pre-filled values for a specific document
// Automatically marks the document as opened / in_progress if not_started
router.get('/checklist/:userId/form/:docId', (req, res) => {
  const { userId, docId } = req.params;
  const ctx = resolveDocContext(userId, docId);
  const stats = computeDraftCompletion(ctx.schema, ctx.values);

  const existingItem = memoryStore.getChecklistProgress(userId)[docId] || {};
  if (!existingItem.status || existingItem.status === 'not_started') {
    memoryStore.updateChecklistItem(userId, docId, {
      status: 'in_progress',
      openedAt: existingItem.openedAt || new Date().toISOString(),
      filledRequiredCount: stats.filledRequiredCount,
      totalRequiredCount: stats.totalRequiredCount,
      fieldCompletionPercent: stats.fieldCompletionPercent
    });
  }

  const updatedChecklist = generateDivorceChecklist(
    ctx.profile,
    memoryStore.getChecklistProgress(userId)
  );

  return res.json({
    success: true,
    schema: ctx.schema,
    defaults: ctx.defaults,
    values: ctx.values,
    lastSavedAt: ctx.lastSavedAt,
    checklist: updatedChecklist
  });
});

// POST save guided form draft and automatically compute checklist progress
router.post('/checklist/:userId/form/:docId', (req, res) => {
  const { userId, docId } = req.params;
  const { values } = req.body || {};

  const saved = memoryStore.saveDocumentDraft(userId, docId, values || {});
  const ctx = resolveDocContext(userId, docId);
  const stats = computeDraftCompletion(ctx.schema, saved.values);

  const existingItem = memoryStore.getChecklistProgress(userId)[docId] || {};
  let nextStatus = existingItem.status || 'in_progress';
  if (nextStatus !== 'completed') {
    nextStatus = stats.isSigned && stats.isAllRequiredFilled ? 'signed_ready' : 'in_progress';
  }

  memoryStore.updateChecklistItem(userId, docId, {
    status: nextStatus,
    openedAt: existingItem.openedAt || new Date().toISOString(),
    filledRequiredCount: stats.filledRequiredCount,
    totalRequiredCount: stats.totalRequiredCount,
    fieldCompletionPercent: stats.fieldCompletionPercent
  });

  const checklist = generateDivorceChecklist(ctx.profile, memoryStore.getChecklistProgress(userId));

  return res.json({
    success: true,
    values: saved.values,
    lastSavedAt: saved.updatedAt,
    checklist
  });
});

// POST generate and stream a filled PDF for download
// Automatically marks completed if signed & required fields are filled
router.post('/checklist/:userId/form/:docId/pdf', async (req, res) => {
  try {
    const { userId, docId } = req.params;
    const { values } = req.body || {};

    if (values && typeof values === 'object') {
      memoryStore.saveDocumentDraft(userId, docId, values);
    }

    const ctx = resolveDocContext(userId, docId);
    const stats = computeDraftCompletion(ctx.schema, ctx.values);
    const existingItem = memoryStore.getChecklistProgress(userId)[docId] || {};

    let nextStatus = 'in_progress';
    if (stats.isSigned && stats.isAllRequiredFilled) {
      nextStatus = 'completed';
    } else if (stats.isSigned) {
      nextStatus = 'signed_ready';
    }

    memoryStore.updateChecklistItem(userId, docId, {
      status: nextStatus,
      openedAt: existingItem.openedAt || new Date().toISOString(),
      completedExternally: false,
      filledRequiredCount: stats.filledRequiredCount,
      totalRequiredCount: stats.totalRequiredCount,
      fieldCompletionPercent: stats.fieldCompletionPercent
    });

    const pdfBuffer = await generateFilledDocumentPdf({
      schema: ctx.schema,
      values: ctx.values,
      stateJurisdiction: ctx.profile?.stateJurisdiction || 'California'
    });

    const safeCode = String(ctx.schema.formCode || docId).replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="RuthAI_${safeCode}_Filled.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('[PDF Generator] Error:', err);
    return res.status(500).json({ error: 'Failed to generate filled PDF' });
  }
});

// POST upload an already-completed document for a checklist item
router.post('/checklist/:userId/upload/:docId', (req, res) => {
  const { userId, docId } = req.params;
  const { fileName, fileSize, mimeType, dataBase64 } = req.body || {};

  if (!fileName) {
    return res.status(400).json({ error: 'fileName is required' });
  }

  const safeUser = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDoc = String(docId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeFile = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');

  let storedPath = null;
  if (dataBase64 && typeof dataBase64 === 'string') {
    try {
      const userDir = path.join(UPLOADS_ROOT, safeUser);
      fs.mkdirSync(userDir, { recursive: true });
      const base64Body = dataBase64.includes(',') ? dataBase64.split(',')[1] : dataBase64;
      storedPath = path.join(userDir, `${safeDoc}_${safeFile}`);
      fs.writeFileSync(storedPath, Buffer.from(base64Body, 'base64'));
    } catch (err) {
      console.warn('[Upload] Disk write skipped:', err.message);
    }
  }

  const uploadedFile = {
    fileName: String(fileName),
    fileSize: Number(fileSize || 0),
    mimeType: mimeType || 'application/pdf',
    storedPath,
    uploadedAt: new Date().toISOString()
  };

  const updatedProgress = memoryStore.updateChecklistItem(userId, docId, {
    status: 'completed',
    completedExternally: true,
    uploadedFile
  });

  const profile = memoryStore.getUserProfile(userId) || {};
  const checklist = generateDivorceChecklist(profile, updatedProgress);

  return res.json({
    success: true,
    uploadedFile: {
      fileName: uploadedFile.fileName,
      fileSize: uploadedFile.fileSize,
      mimeType: uploadedFile.mimeType,
      uploadedAt: uploadedFile.uploadedAt
    },
    checklist
  });
});

// GET download/view a previously uploaded completed document
router.get('/checklist/:userId/upload/:docId', (req, res) => {
  const { userId, docId } = req.params;
  const item = memoryStore.getChecklistProgress(userId)[docId];
  const uploaded = item?.uploadedFile;

  if (!uploaded || !uploaded.storedPath || !fs.existsSync(uploaded.storedPath)) {
    return res.status(404).json({ error: 'Uploaded file not found' });
  }

  res.setHeader('Content-Type', uploaded.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${uploaded.fileName}"`);
  return res.sendFile(path.resolve(uploaded.storedPath));
});

// GET post-divorce life finance projection (recalculates from latest profile, assets, and wiki)
router.get('/projection/:userId', async (req, res) => {
  const { userId } = req.params;
  const profile = memoryStore.getUserProfile(userId) || {};
  const agentMemory = memoryStore.getAgentMemory(userId) || {};
  const wiki = await wikiStore.getWikiAsync(userId);

  const projection = calculatePostDivorceProjection({
    profile,
    agentMemory,
    wiki
  });

  return res.json({
    success: true,
    projection
  });
});

// POST save updated financial inputs and immediately recalculate post-divorce projection
router.post('/projection/:userId', async (req, res) => {
  const { userId } = req.params;
  const allowedFields = [
    'stateJurisdiction',
    'marriageLengthYears',
    'hasChildren',
    'childrenCount',
    'hasPrenup',
    'userGrossMonthlyIncome',
    'spouseGrossMonthlyIncome',
    'custodySharePercent',
    'monthlyLivingExpenses',
    'monthlyDebtPayments',
    'totalDebts',
    'healthInsuranceMonthlyCost',
    'estimatedRentIfSelling',
    'homeValueOverride',
    'mortgageRemainingOverride',
    'monthlyMortgageOverride'
  ];

  const updates = {};
  for (const key of allowedFields) {
    if (req.body && req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  const updatedProfile = memoryStore.setUserProfile(userId, updates);
  await wikiStore.syncFromProfileAsync(userId, updatedProfile);

  const agentMemory = memoryStore.getAgentMemory(userId) || {};
  const wiki = await wikiStore.getWikiAsync(userId);
  const projection = calculatePostDivorceProjection({
    profile: updatedProfile,
    agentMemory,
    wiki
  });

  return res.json({
    success: true,
    profile: updatedProfile,
    projection
  });
});

module.exports = router;
