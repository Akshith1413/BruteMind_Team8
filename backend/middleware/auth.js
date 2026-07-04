import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;

/**
 * Middleware protecting endpoints by verifying Supabase JWT sessions
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid format.' });
    }

    const token = authHeader.split(' ')[1];

    // Validate the token by querying Supabase Auth endpoint
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.SUPABASE_PUBLISHABLE_KEY
      }
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(401).json({ error: `Session authentication failed: ${errData.msg || errData.message || 'Invalid token'}` });
    }

    const user = await response.json();
    req.user = {
      id: user.id,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware] Token validation failed:', error);
    return res.status(401).json({ error: 'Session expired or authentication backend unreachable.' });
  }
}

// Refactor: optimize user id token checks
