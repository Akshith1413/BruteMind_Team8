import { HOST, getAuthToken, getHeaders } from './test_utils.js';

async function runTest() {
  console.log('[Test 8/11] Lead Gen Engine...');
  const token = await getAuthToken();
  const headers = getHeaders(token);

  const res = await fetch(`${HOST}/api/engines/lead-gen`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productName: 'HealOS', targetAudience: 'CIOs' })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  console.log(' ✅ Lead Gen Engine Success!');
}
runTest().catch(console.error);
