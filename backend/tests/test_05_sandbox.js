import { HOST, getAuthToken, getHeaders } from './test_utils.js';
import { io } from 'socket.io-client';

async function runTest() {
  console.log('[Test 5/11] Synthetic Buyer Sandbox Simulator (WebSocket)...');
  const token = await getAuthToken();
  const headers = getHeaders(token);

  // First create a campaign to simulate
  const campRes = await fetch(`${HOST}/api/business/campaigns`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ campaignName: 'Sandbox Test', targetAudience: 'Test', channels: ['Web'], budget: 1000 })
  });
  const campData = await campRes.json();
  const campaignId = campData.campaign._id;

  const socket = io(HOST);
  socket.on('connect', () => {
    socket.emit('trigger_buyer_simulation', campaignId);
  });

  socket.on('buyer_sim_tick', (tick) => {
    console.log(`   [Tick #${tick.index}/30]: ${tick.role} | Converted: ${tick.converted}`);
  });

  socket.on('buyer_sim_complete', (report) => {
    console.log(' ✅ Sandbox simulation complete!');
    console.log(` -> Total Conversions: ${report.conversions}/30`);
    socket.close();
    process.exit(0);
  });
}
runTest().catch(console.error);
