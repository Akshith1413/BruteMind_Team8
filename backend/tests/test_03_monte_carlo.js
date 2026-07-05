import { HOST, getAuthToken, getHeaders } from './test_utils.js';

async function runTest() {
  console.log('[Test 3/11] Testing REST Monte Carlo & Dashboard Analytics...');
  const token = await getAuthToken();
  const headers = getHeaders(token);

  const mcResponse = await fetch(`${HOST}/api/business/stress-test`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      baseValue: 200,
      iterations: 100,
      steps: 6,
      growthRate: 0.08,
      riskFactor: 0.15
    })
  });

  const mcData = await mcResponse.json();
  if (!mcResponse.ok) throw new Error(mcData.error);

  console.log(' ✅ Monte Carlo Stress Test completed successfully!');
  
  const statsResponse = await fetch(`${HOST}/api/business/dashboard-stats`, { method: 'GET', headers });
  const statsData = await statsResponse.json();
  if (!statsResponse.ok) throw new Error(statsData.error);
  
  console.log(' ✅ Dashboard telemetry compiled successfully:');
  console.log(` -> Total Clinicians Registered: ${statsData.stats.totalClinicians}`);
}
runTest().catch(console.error);
