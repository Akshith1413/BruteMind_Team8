import { HOST, getAuthToken, getHeaders } from './test_utils.js';

async function runTest() {
  console.log('[Test 10/11] Analytics Engine...');
  const token = await getAuthToken();
  const headers = getHeaders(token);

  const res = await fetch(`${HOST}/api/engines/analytics`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ industry: 'Health', competitors: ['Epic'] })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  console.log(' ✅ Analytics Engine Success!');
}
runTest().catch(console.error);
