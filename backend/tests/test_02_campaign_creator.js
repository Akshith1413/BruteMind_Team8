import { HOST, getAuthToken, getHeaders } from './test_utils.js';

async function runTest() {
  console.log('[Test 2/11] Testing AI Campaign Copy Creator (AI Gateway)...');
  const token = await getAuthToken();
  const headers = getHeaders(token);

  const campaignResponse = await fetch(`${HOST}/api/business/campaigns`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      campaignName: 'Cohort Alpha Vaccine Outbound',
      targetAudience: 'Clinical Immunologists',
      channels: ['LinkedIn', 'Direct Email'],
      budget: 5000
    })
  });

  const campaignData = await campaignResponse.json();
  if (!campaignResponse.ok) throw new Error(campaignData.error);
  
  console.log(' ✅ Campaign generated successfully via AI Gateway!');
  console.log(` -> Generated Copy: "${campaignData.campaign.copyTemplate.substring(0, 80)}..."`);
}
runTest().catch(console.error);
