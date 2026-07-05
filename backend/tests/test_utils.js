import { io } from 'socket.io-client';

export const HOST = 'http://127.0.0.1:5000';

export async function getAuthToken() {
  const testEmail = `inspector.clinician.test@healos.ai`;
  const testPin = '4321';

  // Try to register first, if it fails because it exists, we just login.
  try {
    await fetch(`${HOST}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Test User',
        email: testEmail,
        specialty: 'Testing',
        pin: testPin
      })
    });
  } catch (err) {} // ignore

  const loginResponse = await fetch(`${HOST}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, pin: testPin })
  });

  const loginData = await loginResponse.json();
  if (!loginResponse.ok) {
    throw new Error(`Auth Login failed: ${loginData.error}`);
  }
  
  return loginData.user.token;
}

export function getHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}
