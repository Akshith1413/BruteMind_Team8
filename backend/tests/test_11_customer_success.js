import { HOST, getAuthToken, getHeaders } from './test_utils.js';

async function runTest() {
  console.log('[Test 11/11] Customer Success Engine...');
  const token = await getAuthToken();
  const headers = getHeaders(token);

  const res = await fetch(`${HOST}/api/engines/customer-success`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productName: 'HealOS' })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  console.log(' ✅ Customer Success Engine Success!');
}
runTest().catch(console.error);
