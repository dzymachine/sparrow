const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');

const app = require('../src/index');
const wikiStore = require('../src/store/wikiStore');
const memoryStore = require('../src/store/memoryStore');

let server;
let baseUrl;

function request(method, reqPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, baseUrl);
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const req = http.request(
      url,
      {
        method,
        headers: {
          ...(payload && typeof body !== 'string' ? { 'Content-Type': 'application/json' } : {}),
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers
        }
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

describe('Foothold Financial Discovery & Document Intelligence Engine', () => {
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
    await new Promise((resolve) => server.close(resolve));
  });

  it('GET /api/discovery/samples returns the 6 core sample document templates', async () => {
    const res = await request('GET', '/api/discovery/samples');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.samples));
    assert.equal(res.body.samples.length, 6);

    const keys = res.body.samples.map((s) => s.key);
    assert.ok(keys.includes('tax_1040_2024'));
    assert.ok(keys.includes('retirement_401k'));
    assert.ok(keys.includes('mortgage_statement'));
    assert.ok(keys.includes('bank_checking_statement'));
    assert.ok(keys.includes('marital_agreement'));
    assert.ok(keys.includes('paystub_insurance'));
  });

  it('POST /api/discovery/analyze extracts Tax Return 1040 with Schedule B leads', async () => {
    const res = await request('POST', '/api/discovery/analyze', { sampleDocId: 'tax_1040_2024' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const doc = res.body.document;

    assert.equal(doc.categoryKey, 'tax_returns');
    assert.equal(doc.extractedData.taxReturn.taxYear, 2024);
    assert.equal(doc.extractedData.taxReturn.adjustedGrossIncome, 198400);
    assert.equal(doc.extractedData.taxReturn.userWages, 48000);
    assert.equal(doc.extractedData.taxReturn.spouseWages, 142000);

    // Schedule B payers
    const scheduleB = doc.extractedData.taxReturn.scheduleBPayers;
    assert.ok(scheduleB.length >= 2);
    const vanguard = scheduleB.find((p) => p.payerName.includes('Vanguard'));
    assert.ok(vanguard);
    assert.equal(vanguard.potentialHiddenAccount, true);

    // Unlisted accounts identified
    assert.ok(doc.unlistedAccounts.length >= 2);
    assert.ok(doc.unlistedAccounts.some((a) => a.institution.includes('Vanguard')));
    assert.ok(doc.plainEnglishSummary.includes('$198,400'));
  });

  it('POST /api/discovery/analyze extracts 401(k) statement with ERISA QDRO mandate', async () => {
    const res = await request('POST', '/api/discovery/analyze', { sampleDocId: 'retirement_401k' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const doc = res.body.document;

    assert.equal(doc.categoryKey, 'retirement');
    assert.equal(doc.extractedData.retirement.currentBalance, 428500);
    assert.equal(doc.extractedData.retirement.requiresQDRO, true);
    assert.ok(doc.extractedData.retirement.qdroExplanation.includes('QDRO'));
  });

  it('POST /api/discovery/analyze extracts Mortgage PITI and co-borrower status', async () => {
    const res = await request('POST', '/api/discovery/analyze', { sampleDocId: 'mortgage_statement' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const doc = res.body.document;

    assert.equal(doc.categoryKey, 'mortgage_lease');
    assert.equal(doc.extractedData.property.loanBalance, 384200);
    assert.equal(doc.extractedData.property.interestRate, 3.25);
    assert.equal(doc.extractedData.property.monthlyPayment.total, 2480);
    assert.ok(doc.extractedData.property.coBorrowerStatus.includes('Joint'));
  });

  it('POST /api/discovery/analyze extracts CSV bank transactions into Bucket A and B with flagged transfers', async () => {
    const csvContent = [
      'Date,Description,Amount,Balance',
      '2024-10-01,Deposit Payroll Direct Dep,$4600.00,$9800.00',
      '2024-10-02,Electric Utility Pasadena Water,$185.00,$9615.00',
      '2024-10-05,Trader Joes Household Food,$420.00,$9195.00',
      '2024-10-10,Transfer to Marcus External Acct,$1500.00,$7695.00',
      '2024-10-15,Deposit Payroll Direct Dep,$4600.00,$12295.00',
      '2024-10-18,Sunshine Tutoring & Daycare,$950.00,$11345.00',
      '2024-10-22,Safeway Groceries,$400.00,$10945.00'
    ].join('\n');

    const res = await request('POST', '/api/discovery/analyze', {
      content: csvContent,
      mimeType: 'text/csv',
      fileName: 'october_checking.csv'
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const doc = res.body.document;

    assert.equal(doc.categoryKey, 'bank_statements');
    assert.equal(doc.extractedData.bankOrCredit.totalMonthlyInflows, 9200);

    const recurring = doc.extractedData.bankOrCredit.recurringExpenses;
    assert.ok(recurring.length >= 3);
    assert.ok(recurring.some((e) => e.bucket === 'bucket_a_must_pays'));

    const flagged = doc.extractedData.bankOrCredit.flaggedTransfersOrCharges;
    assert.ok(flagged.length >= 1);
    assert.equal(flagged[0].amount, 1500);
    assert.equal(flagged[0].potentialSeparateAccount, true);
  });

  it('POST /api/discovery/analyze extracts Marital Agreement support figures and deadlines', async () => {
    const res = await request('POST', '/api/discovery/analyze', { sampleDocId: 'marital_agreement' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const doc = res.body.document;

    assert.equal(doc.categoryKey, 'marital_agreements');
    assert.equal(doc.extractedData.maritalAgreement.spousalSupportMonthly, 2200);
    assert.equal(doc.extractedData.maritalAgreement.childSupportMonthly, 1650);
    assert.equal(doc.extractedData.maritalAgreement.coparentingSplitRatio, '60/40');
    assert.ok(doc.extractedData.maritalAgreement.assetSplitDeadlines.length >= 2);
    assert.ok(doc.extractedData.maritalAgreement.beneficiaryRequirements.length >= 1);
  });

  it('POST /api/discovery/analyze rejects empty request with helpful error guidance', async () => {
    const res = await request('POST', '/api/discovery/analyze', {});
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'NO_FILE_PROVIDED');
  });

  it('POST /api/discovery/analyze with userId persists extracted financial facts to LLM Wiki and memoryStore', async () => {
    const testUserId = `discovery-wiki-user-${Date.now()}`;
    await wikiStore.purgeWikiAsync(testUserId);
    memoryStore.purgeUserMemory(testUserId);

    const res = await request('POST', '/api/discovery/analyze', {
      sampleDocId: 'tax_1040_2024',
      userId: testUserId
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.wikiSync);
    assert.equal(res.body.wikiSync.synced, true);
    assert.ok(res.body.wikiSync.addedCount >= 4);

    const wiki = await wikiStore.getWikiAsync(testUserId);
    const footprintFacts = wiki.sections.financial_footprint.facts;
    const lawyerFacts = wiki.sections.lawyer_readiness.facts;
    const logFacts = wiki.sections.interaction_log.facts;

    assert.ok(footprintFacts.some((f) => f.text.includes('$198,400')));
    assert.ok(footprintFacts.some((f) => f.text.includes('Vanguard')));
    assert.ok(lawyerFacts.some((f) => f.text.includes('FL-140')));
    assert.ok(logFacts.length >= 1);

    const profile = memoryStore.getUserProfile(testUserId);
    assert.equal(profile.userGrossMonthlyIncome, 4000);
    assert.equal(profile.spouseGrossMonthlyIncome, 11833);

    await wikiStore.purgeWikiAsync(testUserId);
    memoryStore.purgeUserMemory(testUserId);
  });

  it('POST /api/discovery/commit persists confirmed document assets and legal deadlines to LLM Wiki', async () => {
    const testUserId = `discovery-commit-user-${Date.now()}`;
    await wikiStore.purgeWikiAsync(testUserId);
    memoryStore.purgeUserMemory(testUserId);

    const analyzeRes = await request('POST', '/api/discovery/analyze', {
      sampleDocId: 'retirement_401k'
    });
    assert.equal(analyzeRes.status, 200);

    const commitRes = await request('POST', '/api/discovery/commit', {
      userId: testUserId,
      document: analyzeRes.body.document
    });

    assert.equal(commitRes.status, 200);
    assert.equal(commitRes.body.success, true);
    assert.equal(commitRes.body.synced, true);
    assert.ok(commitRes.body.addedCount >= 3);

    const wiki = await wikiStore.getWikiAsync(testUserId);
    const footprintFacts = wiki.sections.financial_footprint.facts;
    const lawyerFacts = wiki.sections.lawyer_readiness.facts;

    assert.ok(footprintFacts.some((f) => f.text.includes('$428,500')));
    assert.ok(lawyerFacts.some((f) => f.text.includes('QDRO')));

    const agentMemory = memoryStore.getAgentMemory(testUserId);
    assert.ok(agentMemory.discoveredAssets.some((a) => a.estimatedValue === 428500));

    await wikiStore.purgeWikiAsync(testUserId);
    memoryStore.purgeUserMemory(testUserId);
  });
});
