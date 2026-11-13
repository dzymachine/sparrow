const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const testDataDir = path.join(__dirname, '../data/test-checklist-wikis-' + Date.now());
const testUploadsDir = path.join(__dirname, '../data/test-checklist-uploads-' + Date.now());
process.env.WIKI_DATA_DIR = testDataDir;
process.env.UPLOADS_DATA_DIR = testUploadsDir;

const app = require('../src/index');
const { generateDivorceChecklist } = require('../src/services/checklistEngine');

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

describe('Divorce Document Checklist Engine & API', () => {
  const testUser = 'test-checklist-user-' + Date.now();

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
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    if (fs.existsSync(testUploadsDir)) {
      fs.rmSync(testUploadsDir, { recursive: true, force: true });
    }
  });

  it('tailors checklist for uncontested short CA marriage without children or home', () => {
    const checklist = generateDivorceChecklist({
      goal: 'pursuing_divorce',
      stateJurisdiction: 'California',
      marriageLengthYears: 3,
      hasChildren: false,
      childrenCount: 0,
      divorcePathway: 'amicable_uncontested',
      hasPrenup: 'no',
      ownsHome: false,
      hasRetirementAccounts: false,
      fearOfHiddenAssets: false,
      financialRole: 'equal_partnership',
      needsFeeWaiver: false,
      needsProtectiveOrder: false,
      primaryConcerns: []
    });

    assert.equal(checklist.isPursuingDivorce, true);
    const ids = new Set(checklist.items.map((i) => i.id));
    assert.ok(ids.has('doc-petition'));
    assert.ok(ids.has('doc-summary-dissolution'), 'Should suggest FL-800 Summary Dissolution');
    assert.ok(ids.has('doc-uncontested-stip'));
    assert.ok(!ids.has('doc-uccjea'), 'Should not include child custody UCCJEA');
    assert.ok(!ids.has('doc-qdro'), 'Should not include QDRO');
    assert.ok(!ids.has('doc-title-deed'), 'Should not include property transfer deed');
    assert.ok(!ids.has('doc-protective-order'), 'Should not include DV protective order');
  });

  it('includes complex discovery, custody, support, QDRO, deed, prenup, fee waiver, and DV forms when applicable', () => {
    const checklist = generateDivorceChecklist({
      goal: 'pursuing_divorce',
      stateJurisdiction: 'California',
      marriageLengthYears: 14,
      hasChildren: true,
      childrenCount: 2,
      divorcePathway: 'contested_or_uncooperative',
      hasPrenup: 'yes',
      ownsHome: true,
      hasRetirementAccounts: true,
      fearOfHiddenAssets: true,
      financialRole: 'spouse_handled_all',
      needsFeeWaiver: true,
      needsProtectiveOrder: true,
      primaryConcerns: ['keeping_marital_home', 'securing_spousal_support', 'protecting_retirement_share']
    });

    const ids = new Set(checklist.items.map((i) => i.id));
    assert.ok(ids.has('doc-fee-waiver'));
    assert.ok(ids.has('doc-uccjea'));
    assert.ok(ids.has('doc-custody-app'));
    assert.ok(ids.has('doc-protective-order'));
    assert.ok(ids.has('doc-real-estate-packet'));
    assert.ok(ids.has('doc-retirement-statements'));
    assert.ok(ids.has('doc-prenup-review'));
    assert.ok(ids.has('doc-formal-discovery'));
    assert.ok(ids.has('doc-rfo-temp'));
    assert.ok(ids.has('doc-spousal-support'));
    assert.ok(ids.has('doc-child-support'));
    assert.ok(ids.has('doc-trial-brief'));
    assert.ok(ids.has('doc-qdro'));
    assert.ok(ids.has('doc-title-deed'));
    assert.ok(ids.has('doc-iwo'));

    const petition = checklist.items.find((i) => i.id === 'doc-petition');
    assert.equal(petition.pdfUrl, 'https://www.courts.ca.gov/documents/fl100.pdf');
    assert.equal(petition.pdfAvailability, 'official_pdf');

    const taxReturns = checklist.items.find((i) => i.id === 'doc-tax-returns');
    assert.equal(taxReturns.pdfUrl, 'https://www.irs.gov/pub/irs-pdf/f1040.pdf');

    const qdro = checklist.items.find((i) => i.id === 'doc-qdro');
    assert.equal(qdro.pdfUrl, null);
    assert.equal(qdro.pdfAvailability, 'personal_or_custom');
  });

  it('adapts form codes to New York jurisdiction', () => {
    const checklist = generateDivorceChecklist({
      goal: 'pursuing_divorce',
      stateJurisdiction: 'New York',
      marriageLengthYears: 7,
      hasChildren: false,
      divorcePathway: 'amicable_uncontested'
    });

    const petition = checklist.items.find((i) => i.id === 'doc-petition');
    const disclosure = checklist.items.find((i) => i.id === 'doc-disclosure-decl');
    assert.equal(petition.formCode, 'UD-1 / UD-2');
    assert.equal(disclosure.formCode, 'Statement of Net Worth');
  });

  it('marks isPursuingDivorce false when user goal is exploring_options', () => {
    const checklist = generateDivorceChecklist({
      goal: 'exploring_options',
      stateJurisdiction: 'California'
    });
    assert.equal(checklist.isPursuingDivorce, false);
  });

  it('persists checklist status and notes updates via /api/user/checklist/:userId', async () => {
    // Save onboarding profile
    const profileRes = await request('POST', '/api/user/profile', {
      userId: testUser,
      goal: 'pursuing_divorce',
      stateJurisdiction: 'California',
      marriageLengthYears: 12,
      hasChildren: true,
      childrenCount: 1,
      divorcePathway: 'contested_or_uncooperative',
      ownsHome: true,
      hasRetirementAccounts: true
    });
    assert.equal(profileRes.status, 200);
    assert.equal(profileRes.body.checklist.isPursuingDivorce, true);
    const initialTotal = profileRes.body.checklist.summary.totalCount;
    assert.ok(initialTotal >= 15);

    // Update a document item to completed with a note
    const updateRes = await request('POST', `/api/user/checklist/${testUser}`, {
      docId: 'doc-petition',
      status: 'completed',
      notes: 'Filed at San Diego Superior Court'
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.checklist.summary.completedCount, 1);

    // Verify GET returns the persisted state
    const getRes = await request('GET', `/api/user/checklist/${testUser}`);
    assert.equal(getRes.status, 200);
    const petition = getRes.body.checklist.items.find((i) => i.id === 'doc-petition');
    assert.equal(petition.status, 'completed');
    assert.equal(petition.notes, 'Filed at San Diego Superior Court');
  });

  it('automatically tracks progress on open, partial save, PDF completion, and external check-off', async () => {
    const autoUser = 'test-auto-user-' + Date.now();
    await request('POST', '/api/user/profile', {
      userId: autoUser,
      goal: 'pursuing_divorce',
      stateJurisdiction: 'California',
      marriageLengthYears: 12,
      hasChildren: true,
      childrenCount: 1
    });

    // 1. Opening doc-petition automatically marks it in_progress
    const formRes = await request('GET', `/api/user/checklist/${autoUser}/form/doc-petition`);
    assert.equal(formRes.status, 200);
    assert.equal(formRes.body.success, true);
    assert.ok(Array.isArray(formRes.body.schema.sections));
    assert.ok(formRes.body.schema.sections.length >= 3);

    const partyFields = formRes.body.schema.sections[0].fields;
    assert.ok(partyFields.some((f) => f.key === 'petitionerName' && f.whereToFind));

    const afterOpen = await request('GET', `/api/user/checklist/${autoUser}`);
    const openedPetition = afterOpen.body.checklist.items.find((i) => i.id === 'doc-petition');
    assert.equal(openedPetition.status, 'in_progress');
    assert.ok(openedPetition.openedAt);
    assert.ok(afterOpen.body.checklist.summary.percentComplete > 0);

    // 2. Saving a partially filled draft updates fieldCompletionPercent automatically
    const draftRes = await request('POST', `/api/user/checklist/${autoUser}/form/doc-petition`, {
      values: {
        ...formRes.body.values,
        petitionerName: 'Sarah Johnson',
        respondentName: '',
        signatureName: ''
      }
    });
    assert.equal(draftRes.status, 200);
    const draftedPetition = draftRes.body.checklist.items.find((i) => i.id === 'doc-petition');
    assert.equal(draftedPetition.status, 'in_progress');
    assert.ok(draftedPetition.fieldCompletionPercent > 0 && draftedPetition.fieldCompletionPercent < 100);

    // 3. Downloading filled PDF with all required fields + signature automatically marks completed
    const pdfRes = await new Promise((resolve, reject) => {
      const url = new URL(`/api/user/checklist/${autoUser}/form/doc-petition/pdf`, baseUrl);
      const payload = JSON.stringify({
        values: {
          ...formRes.body.values,
          petitionerName: 'Sarah Johnson',
          respondentName: 'David Johnson',
          county: 'San Diego County Superior Court',
          dateOfMarriage: '2012-06-15',
          dateOfSeparation: '2026-10-01',
          residencyConfirmed: true,
          groundsForDivorce: 'Irreconcilable differences (no-fault standard)',
          requestSpousalSupport: 'Payable to Petitioner (Me)',
          signatureName: 'Sarah Johnson',
          signatureDate: '2026-11-13',
          perjuryConfirmed: true
        }
      });
      const req = http.request(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        },
        (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              contentType: res.headers['content-type'],
              buffer: Buffer.concat(chunks)
            });
          });
        }
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    assert.equal(pdfRes.status, 200);
    assert.match(pdfRes.contentType, /application\/pdf/);
    assert.ok(pdfRes.buffer.subarray(0, 5).toString('ascii') === '%PDF-');

    const checkRes = await request('GET', `/api/user/checklist/${autoUser}`);
    const completedPetition = checkRes.body.checklist.items.find((i) => i.id === 'doc-petition');
    assert.equal(completedPetition.status, 'completed');

    // 4. Optional external check-off button marks another document completedExternally
    const extRes = await request('POST', `/api/user/checklist/${autoUser}`, {
      docId: 'doc-summons',
      status: 'completed',
      completedExternally: true
    });
    assert.equal(extRes.status, 200);
    const summons = extRes.body.checklist.items.find((i) => i.id === 'doc-summons');
    assert.equal(summons.status, 'completed');
    assert.equal(summons.completedExternally, true);

    // 5. Uploading an already-completed document marks the item completed and stores the file
    const samplePdfBase64 = Buffer.from('%PDF-1.4\n%MockSignedDoc\n').toString('base64');
    const uploadRes = await request('POST', `/api/user/checklist/${autoUser}/upload/doc-disclosure-decl`, {
      fileName: 'FL140_Signed.pdf',
      fileSize: 24,
      mimeType: 'application/pdf',
      dataBase64: `data:application/pdf;base64,${samplePdfBase64}`
    });
    assert.equal(uploadRes.status, 200);
    assert.equal(uploadRes.body.uploadedFile.fileName, 'FL140_Signed.pdf');
    const uploadedDoc = uploadRes.body.checklist.items.find((i) => i.id === 'doc-disclosure-decl');
    assert.equal(uploadedDoc.status, 'completed');
    assert.equal(uploadedDoc.uploadedFile.fileName, 'FL140_Signed.pdf');
  });
});
