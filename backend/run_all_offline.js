import { HOST, getAuthToken, getHeaders } from './tests/test_utils.js';

async function setOfflineModeAndRun() {
  console.log('Setting system config to OFFLINE mode...');
  const token = await getAuthToken();
  const res = await fetch(`${HOST}/api/system/config`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ routingMode: 'offline' })
  });
  
  if (!res.ok) throw new Error('Failed to set offline mode');
  console.log('Offline mode active. Running all tests...\n');
  
  const tests = [
    'test_01_auth.js',
    'test_02_campaign_creator.js',
    'test_03_monte_carlo.js',
    'test_04_swarm.js',
    'test_05_sandbox.js',
    'test_06_strategy.js',
    'test_07_marketing.js',
    'test_08_lead_gen.js',
    'test_09_sales.js',
    'test_10_analytics.js',
    'test_11_customer_success.js'
  ];

  const { execSync } = await import('child_process');
  
  for (const test of tests) {
    try {
      console.log(`Executing ${test}...`);
      const output = execSync(`node tests/${test}`, { encoding: 'utf-8' });
      console.log(output);
    } catch (e) {
      console.error(`Failed ${test}:`, e.stdout || e.message);
    }
  }
}

setOfflineModeAndRun().catch(console.error);
