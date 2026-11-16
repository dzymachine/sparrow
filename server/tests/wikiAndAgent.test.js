const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

// Use an isolated temp directory for test wiki persistence
const testDataDir = path.join(__dirname, '../data/test-wikis-' + Date.now());
process.env.WIKI_DATA_DIR = testDataDir;

const app = require('../src/index');
const wikiStore = require('../src/store/wikiStore');
const memoryStore = require('../src/store/memoryStore');

let server;
let baseUrl;

function request(method, reqPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, baseUrl);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      url,
      {
        method,
        headers: payload
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
          : {}
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe('Personal LLM Wiki & Ruth Agent Pipeline', () => {
  const testUser = 'test-user-wiki-' + Date.now();

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      await new Promise((resolve) => server.close(resolve));
    }
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  it('initializes all 5 canonical wiki sections for a user', async () => {
    const res = await request('GET', `/api/agent/wiki/${testUser}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const sectionKeys = Object.keys(res.body.wiki.sections);
    assert.deepEqual(sectionKeys.sort(), [
      'financial_footprint',
      'interaction_log',
      'lawyer_readiness',
      'priorities_and_goals',
      'profile'
    ]);
    assert.equal(res.body.stats.totalFacts, 0);
  });

  it('extracts Vanguard account disclosure into financial_footprint in real-time', async () => {
    const res = await request('POST', '/api/agent/chat', {
      userId: testUser,
      message: 'My husband has a Vanguard account I just found'
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.extractedFacts.length >= 1);

    const footprintFacts = res.body.wiki.sections.financial_footprint.facts;
    assert.ok(
      footprintFacts.some((f) => /vanguard/i.test(f.text)),
      'Expected Vanguard account to be saved in financial_footprint'
    );
  });

  it('merges house/mortgage facts without overwriting prior Vanguard knowledge', async () => {
    const res = await request('POST', '/api/agent/chat', {
      userId: testUser,
      message: 'We bought the house in 2012 for $400k and our mortgage rate is 3.2%'
    });
    assert.equal(res.status, 200);

    const footprintFacts = res.body.wiki.sections.financial_footprint.facts;
    assert.ok(
      footprintFacts.some((f) => /vanguard/i.test(f.text)),
      'Prior Vanguard fact must still be preserved'
    );
    assert.ok(
      footprintFacts.some((f) => /2012/.test(f.text) && /3\.2%/.test(f.text)),
      'New real estate & mortgage rate fact must be merged'
    );
  });

  it('explicitly references remembered Vanguard account in subsequent questions', async () => {
    const res = await request('POST', '/api/agent/chat', {
      userId: testUser,
      message: 'What should I ask my lawyer about our accounts?'
    });
    assert.equal(res.status, 200);
    assert.match(res.body.reply, /vanguard/i);
  });

  it('supports editing and deleting individual facts via POST /api/agent/wiki/:userId', async () => {
    const addRes = await request('POST', `/api/agent/wiki/${testUser}`, {
      action: 'add',
      section: 'lawyer_readiness',
      text: 'Bring 2023 tax return to consultation',
      category: 'Document'
    });
    assert.equal(addRes.status, 200);
    const addedFact = addRes.body.wiki.sections.lawyer_readiness.facts.find((f) =>
      f.text.includes('2023 tax return')
    );
    assert.ok(addedFact);

    // Edit fact
    const editRes = await request('POST', `/api/agent/wiki/${testUser}`, {
      action: 'update',
      section: 'lawyer_readiness',
      factId: addedFact.id,
      text: 'Bring 2022 and 2023 tax returns to consultation'
    });
    assert.equal(editRes.status, 200);
    assert.ok(
      editRes.body.wiki.sections.lawyer_readiness.facts.some((f) =>
        f.text.includes('2022 and 2023 tax returns')
      )
    );

    // Delete fact
    const delRes = await request('POST', `/api/agent/wiki/${testUser}`, {
      action: 'delete',
      section: 'lawyer_readiness',
      factId: addedFact.id
    });
    assert.equal(delRes.status, 200);
    assert.ok(
      !delRes.body.wiki.sections.lawyer_readiness.facts.some((f) => f.id === addedFact.id)
    );
  });

  it('purges all user memory via DELETE /api/agent/wiki/:userId', async () => {
    const res = await request('DELETE', `/api/agent/wiki/${testUser}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.stats.totalFacts, 0);

    const checkRes = await request('GET', `/api/agent/wiki/${testUser}`);
    assert.equal(checkRes.body.stats.totalFacts, 0);
  });

  it('compiles non-empty wiki context for prompt injection', () => {
    const ctxUser = 'ctx-user-' + Date.now();
    wikiStore.addFacts(ctxUser, 'profile', { text: 'Jurisdiction: California', category: 'Jurisdiction' });
    const compiled = wikiStore.compileWikiContext(ctxUser);
    assert.match(compiled, /Jurisdiction: California/);
    assert.match(compiled, /wiki\/profile\.md/);
  });

  it('syncs onboarding profile into wiki/profile.md with goal, children ages, and tax status', async () => {
    const onboardUser = 'onboard-user-' + Date.now();
    const res = await request('POST', '/api/user/profile', {
      userId: onboardUser,
      goal: 'preparing_divorce',
      maritalStatus: 'married_considering_divorce',
      stateJurisdiction: 'California',
      marriageLengthYears: 12,
      hasChildren: true,
      childrenCount: 2,
      childrenAges: ['4', '9'],
      taxFilingStatus: 'married_filing_jointly',
      financialRole: 'spouse_handled_all',
      primaryConcerns: ['keeping_marital_home', 'discovering_hidden_accounts']
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const wikiRes = await request('GET', `/api/agent/wiki/${onboardUser}`);
    assert.equal(wikiRes.status, 200);

    const profileFacts = wikiRes.body.wiki.sections.profile.facts;
    assert.ok(profileFacts.some((f) => /preparing divorce/i.test(f.text)), 'Goal fact in profile');
    assert.ok(profileFacts.some((f) => /married considering divorce/i.test(f.text)), 'Marital status fact in profile');
    assert.ok(profileFacts.some((f) => /12 years/i.test(f.text) && /4336/i.test(f.text)), 'Long duration threshold fact in profile');
    assert.ok(profileFacts.some((f) => /2 children/i.test(f.text) && /Ages: 4, 9/i.test(f.text)), 'Children & ages fact in profile');
    assert.ok(profileFacts.some((f) => /married filing jointly/i.test(f.text) && /Schedule B/i.test(f.text)), 'Tax status fact in profile');
  });

  it('persists, hydrates, and purges per-user knowledge base files in Firebase Firestore & Storage', async () => {
    const firebaseAdmin = require('../src/config/firebaseAdmin');
    const origDb = firebaseAdmin.db;
    const origBucket = firebaseAdmin.bucket;
    const origIsConfigured = firebaseAdmin.isConfigured;

    const firestoreDocs = new Map();
    const storageFiles = new Map();

    firebaseAdmin.db = {
      collection: (colName) => ({
        doc: (docId) => ({
          set: async (data) => {
            firestoreDocs.set(`${colName}/${docId}`, JSON.parse(JSON.stringify(data)));
          },
          get: async () => {
            const key = `${colName}/${docId}`;
            return {
              exists: firestoreDocs.has(key),
              data: () => firestoreDocs.get(key)
            };
          },
          delete: async () => {
            firestoreDocs.delete(`${colName}/${docId}`);
          }
        })
      })
    };

    firebaseAdmin.bucket = {
      name: 'mock-bucket.firebasestorage.app',
      file: (remotePath) => ({
        save: async (content) => {
          storageFiles.set(remotePath, String(content));
        }
      }),
      deleteFiles: async ({ prefix }) => {
        for (const k of Array.from(storageFiles.keys())) {
          if (k.startsWith(prefix)) storageFiles.delete(k);
        }
      }
    };
    firebaseAdmin.isConfigured = () => true;

    const fbUser = 'fb-user-' + Date.now();
    try {
      // Save onboarding profile
      const profileRes = await request('POST', '/api/user/profile', {
        userId: fbUser,
        stateJurisdiction: 'Texas',
        marriageLengthYears: 9,
        goal: 'preparing_divorce'
      });
      assert.equal(profileRes.status, 200);
      assert.ok(firestoreDocs.has(`users/${fbUser}`), 'User profile should be saved to Firestore users/{userId}');
      assert.ok(firestoreDocs.has(`agent_memories/${fbUser}`), 'Agent memory summary should be saved to Firestore agent_memories/{userId}');

      // Save agent memory asset
      const memRes = await request('POST', '/api/agent/memory', {
        userId: fbUser,
        discoveredAssets: [{ id: 'ast-fb-1', name: 'Chase Savings', type: 'Bank Account', estimatedValue: 25000 }]
      });
      assert.equal(memRes.status, 200);

      // Chat with Finch
      const chatRes = await request('POST', '/api/agent/chat', {
        userId: fbUser,
        message: 'We have a Chase savings account and a 401(k) in Texas'
      });
      assert.equal(chatRes.status, 200);
      assert.ok(firestoreDocs.has(`user_wikis/${fbUser}`), 'Firestore doc should be saved per user');
      assert.ok(firestoreDocs.has(`chat_histories/${fbUser}`), 'Chat history should be saved to Firestore chat_histories/{userId}');
      assert.ok(
        storageFiles.has(`wikis/${fbUser}/wiki/financial_footprint.md`),
        'Storage financial_footprint.md should be saved per user'
      );
      assert.match(storageFiles.get(`wikis/${fbUser}/wiki/financial_footprint.md`), /Chase/i);
      assert.ok(storageFiles.has(`wikis/${fbUser}/wiki/profile.md`));

      // Simulate cold start: clear in-memory caches and local disk
      wikiStore._clearCacheForTesting();
      memoryStore._clearCacheForTesting();
      const localUserDir = path.join(testDataDir, fbUser);
      if (fs.existsSync(localUserDir)) {
        fs.rmSync(localUserDir, { recursive: true, force: true });
      }

      // Hydrate from Firestore via GET and verify wiki, profile, agent memory, and chat history remain intact
      const getRes = await request('GET', `/api/agent/wiki/${fbUser}`);
      assert.equal(getRes.status, 200);
      assert.ok(
        getRes.body.wiki.sections.financial_footprint.facts.some((f) => /Chase/i.test(f.text)),
        'Should hydrate Chase fact from Firestore after cold start'
      );

      const getProfileRes = await request('GET', `/api/user/profile/${fbUser}`);
      assert.equal(getProfileRes.status, 200);
      assert.equal(getProfileRes.body.profile.stateJurisdiction, 'Texas');

      const getMemRes = await request('GET', `/api/agent/memory/${fbUser}`);
      assert.equal(getMemRes.status, 200);
      assert.equal(getMemRes.body.memory.discoveredAssets.length, 1);

      const getChatRes = await request('GET', `/api/agent/chat/${fbUser}`);
      assert.equal(getChatRes.status, 200);
      assert.equal(getChatRes.body.history.length, 2);

      // Purge should remove wiki Firestore doc, Storage files, and agent memory/chat Firestore docs
      const delRes = await request('DELETE', `/api/agent/wiki/${fbUser}`);
      assert.equal(delRes.status, 200);
      assert.equal(firestoreDocs.has(`user_wikis/${fbUser}`), false);
      assert.equal(firestoreDocs.has(`agent_memories/${fbUser}`), false);
      assert.equal(firestoreDocs.has(`chat_histories/${fbUser}`), false);
      assert.equal(storageFiles.has(`wikis/${fbUser}/wiki/financial_footprint.md`), false);
    } finally {
      firebaseAdmin.db = origDb;
      firebaseAdmin.bucket = origBucket;
      firebaseAdmin.isConfigured = origIsConfigured;
    }
  });

  it('always reads knowledge/wiki/ when answering California law questions', async () => {
    const knowledgeStore = require('../src/store/knowledgeStore');
    const lawWiki = knowledgeStore.compileLawWikiContext();
    assert.match(lawWiki, /knowledge\/wiki\/temporary-support\.md/);
    assert.match(lawWiki, /knowledge\/wiki\/attorney-fees\.md/);

    const searchHits = knowledgeStore.searchKnowledge('How do I ask for attorney fees under Family Code 2030?');
    assert.ok(searchHits.length > 0, 'Expected natural-language law query to match knowledge/wiki');
    assert.equal(searchHits[0].slug, 'attorney-fees');

    const lawUser = 'law-user-' + Date.now();
    const res = await request('POST', '/api/agent/chat', {
      userId: lawUser,
      message: 'What is the 6-month waiting period and how much is the filing fee in California?'
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.match(res.body.reply, /six months|6 months|\$435|filing fee|Timeline/i);
  });
});
