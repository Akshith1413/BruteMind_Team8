import { HOST, getAuthToken, getHeaders } from './test_utils.js';

async function runTest() {
  console.log('[Test 1/11] Testing Clinician Authentication Gateway...');
  const token = await getAuthToken();
  console.log(' ✅ Auth Gateway working. Token acquired:', token.substring(0, 20) + '...');
}
runTest().catch(console.error);
