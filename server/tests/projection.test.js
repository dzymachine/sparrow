const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/index');
const { calculatePostDivorceProjection } = require('../src/services/projectionEngine');

function requestJson(baseUrl, method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      `${baseUrl}${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(data || '{}') });
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe('Post-Divorce Life Finance Projection Engine & API', () => {
  it('returns insufficient_data and suggests missing fields when required info is absent', () => {
    const result = calculatePostDivorceProjection({
      profile: {
        stateJurisdiction: 'California',
        hasChildren: true
      },
      agentMemory: {},
      wiki: {}
    });

    assert.equal(result.status, 'insufficient_data');
    assert.equal(result.canCalculate, false);
    assert.ok(Array.isArray(result.missingFields));

    const missingKeys = result.missingFields.map((f) => f.field);
    assert.ok(missingKeys.includes('marriageLengthYears'));
    assert.ok(missingKeys.includes('userGrossMonthlyIncome'));
    assert.ok(missingKeys.includes('spouseGrossMonthlyIncome'));
    assert.ok(missingKeys.includes('childrenCount'));
    assert.ok(!missingKeys.includes('stateJurisdiction'));
  });

  it('treats $0 user income as valid (stay-at-home spouse) and calculates alimony + child support', () => {
    const result = calculatePostDivorceProjection({
      profile: {
        stateJurisdiction: 'California',
        marriageLengthYears: 14,
        hasChildren: true,
        childrenCount: 2,
        custodySharePercent: 70,
        userGrossMonthlyIncome: 0,
        spouseGrossMonthlyIncome: 14000,
        hasPrenup: 'no'
      },
      agentMemory: {
        discoveredAssets: [
          {
            id: 'h1',
            type: 'Real Estate',
            name: 'Family Home',
            estimatedValue: 900000,
            mortgageRemaining: 400000,
            monthlyPayment: 3000
          },
          {
            id: 'r1',
            type: 'Retirement (401k)',
            name: 'Spouse 401k',
            estimatedValue: 300000
          }
        ]
      },
      wiki: {}
    });

    assert.equal(result.canCalculate, true);
    assert.equal(result.monthlyTakeHome.earnedIncome.netMonthly, 0);
    assert.ok(result.monthlyTakeHome.spousalSupport.monthlyMid > 0);
    assert.equal(result.monthlyTakeHome.spousalSupport.isLongDurationMarriage, true);
    assert.ok(result.monthlyTakeHome.childSupport.monthlyMid > 0);
    assert.equal(
      result.monthlyTakeHome.totalMonthlyTakeHome,
      result.monthlyTakeHome.spousalSupport.monthlyMid +
        result.monthlyTakeHome.childSupport.monthlyMid
    );
    // 50% of (500k home equity + 300k 401k) = 400k
    assert.equal(result.assetDivision.userConfirmedNetWorth, 400000);
    assert.equal(result.assetDivision.breakdown.homeEquity.userShare, 250000);
    assert.equal(result.assetDivision.breakdown.retirement.userShare, 150000);
  });

  it('recalculates dynamically via GET and POST /api/user/projection/:userId', async () => {
    const server = app.listen(0);
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;
    const testUserId = `proj-test-${Date.now()}`;

    try {
      // 1. Fresh user with no data -> insufficient_data
      const initial = await requestJson(baseUrl, 'GET', `/api/user/projection/${testUserId}`);
      assert.equal(initial.status, 200);
      assert.equal(initial.json.projection.status, 'insufficient_data');
      assert.equal(initial.json.projection.canCalculate, false);
      assert.ok(initial.json.projection.missingFields.length >= 4);

      // 2. Submit missing fields -> calculates initial projection
      const updated = await requestJson(baseUrl, 'POST', `/api/user/projection/${testUserId}`, {
        stateJurisdiction: 'California',
        marriageLengthYears: 8,
        hasChildren: true,
        childrenCount: 1,
        userGrossMonthlyIncome: 4000,
        spouseGrossMonthlyIncome: 11000,
        monthlyLivingExpenses: 2200,
        healthInsuranceMonthlyCost: 400
      });

      assert.equal(updated.status, 200);
      assert.equal(updated.json.projection.canCalculate, true);
      assert.ok(updated.json.projection.monthlyTakeHome.totalMonthlyTakeHome > 4000);
      assert.equal(updated.json.projection.monthlyTakeHome.spousalSupport.durationYears, 4);

      // 3. Add a discovered asset and verify GET recalculates with the new asset
      await requestJson(baseUrl, 'POST', '/api/agent/memory', {
        userId: testUserId,
        discoveredAssets: [
          {
            id: 'ast-new-1',
            type: 'Investment Account',
            name: 'Charles Schwab Brokerage',
            estimatedValue: 100000
          }
        ]
      });

      const recalculated = await requestJson(baseUrl, 'GET', `/api/user/projection/${testUserId}`);
      assert.equal(recalculated.status, 200);
      assert.equal(recalculated.json.projection.assetDivision.userConfirmedNetWorth, 50000);
    } finally {
      server.close();
    }
  });
});
