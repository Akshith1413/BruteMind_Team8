import { HOST, getAuthToken, getHeaders } from './test_utils.js';

async function runTest() {
  console.log('[Test 7/11] Marketing Engine...');
  const token = await getAuthToken();
  const headers = getHeaders(token);

  const res = await fetch(`${HOST}/api/engines/marketing`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productName: 'HealOS', industry: 'Health', budget: 15000 })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  console.log(' ✅ Marketing Engine Success!');
}
runTest().catch(console.error);
