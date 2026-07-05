import { HOST, getAuthToken, getHeaders } from './test_utils.js';
import { io } from 'socket.io-client';

async function runTest() {
  console.log('[Test 4/11 & 5/11] WebSockets (Telemetry & Swarm Boardroom)...');
  const token = await getAuthToken(); // get token just to verify DB is up

  const socket = io(HOST);
  socket.on('connect', () => {
    console.log(` ✅ WebSocket connection established (ID: ${socket.id}).`);
    socket.emit('telemetry_stream_start');
    socket.emit('boardroom_debate_trigger', {
      directive: 'Initiate gene therapy modeling for target Cohort Delta',
      businessDNA: { name: 'HealOS Lab Unit', sector: 'Biotech', capital: 50000 }
    });
  });

  socket.on('telemetry_tick', (tick) => {
    console.log(` [Telemetry] HR: ${tick.heartRate} bpm`);
    socket.emit('telemetry_stream_stop');
  });

  socket.on('boardroom_debate_packet', (packet) => {
    if (packet.status === 'DEBATE_COMPLETE' || packet.status === 'NEGOTIATION_START') {
      console.log(` ✅ Boardroom Swarm Debate verdict: ${packet.verdict || 'VETO'}`);
      socket.close();
      process.exit(0);
    }
  });

  socket.on('boardroom_error', (err) => {
    console.error('Error:', err);
    socket.close();
    process.exit(1);
  });
}
runTest().catch(console.error);
