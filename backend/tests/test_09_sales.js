import { HOST, getAuthToken, getHeaders } from './test_utils.js';

async function runTest() {
  console.log('[Test 9/11] Sales Engine...');
  const token = await getAuthToken();
  const headers = getHeaders(token);

  const res = await fetch(`${HOST}/api/engines/sales`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productName: 'HealOS', averageDealSize: '$50000' })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  console.log(' ✅ Sales Engine Success!');
}
runTest().catch(console.error);
