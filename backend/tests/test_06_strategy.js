import { HOST, getAuthToken, getHeaders } from './test_utils.js';

async function runTest() {
  console.log('[Test 6/11] Strategy Engine...');
  const token = await getAuthToken();
  const headers = getHeaders(token);

  const res = await fetch(`${HOST}/api/engines/strategy`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productName: 'HealOS', industry: 'Health', targetAudience: 'CIOs' })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  console.log(' ✅ Strategy Engine Success!');
}
runTest().catch(console.error);
