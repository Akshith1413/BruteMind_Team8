import { supabase } from '../config/supabaseClient.js';
import { getDB } from '../config/db.js';

/**
 * Register a new clinician
 * POST /api/auth/register
 */
export async function register(req, res) {
  try {
    const { username, email, specialty, pin } = req.body;

    if (!username || !email || !specialty || !pin) {
      return res.status(400).json({ error: 'Please provide username, email, specialty, and 4-digit PIN.' });
    }

    if (pin.length !== 4 || isNaN(pin)) {
      return res.status(400).json({ error: 'PIN must be a 4-digit number.' });
    }

    const db = getDB();
    const usersCollection = db.collection('users');

    // Check if user already exists in MongoDB
    const existingMongoUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingMongoUser) {
      return res.status(400).json({ error: 'This clinician email is already registered.' });
    }

    console.log(`Creating user in Supabase Auth: ${email}`);
    // Use admin.createUser to automatically confirm the email and bypass confirmation loops for seamless UX
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: pin,
      email_confirm: true,
      user_metadata: { username, specialty }
    });

    if (authError) {
      console.error('Supabase registration error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    const supabaseUid = authData.user.id;

    // Save profile metadata in MongoDB
    const newClinician = {
      supabase_uid: supabaseUid,
      username,
      email: email.toLowerCase(),
      specialty,
      pin, // Storing PIN for reference (and sandbox recovery)
      created_at: new Date()
    };

    await usersCollection.insertOne(newClinician);
    console.log(`Successfully registered clinician profile in MongoDB: ${email}`);

    // Automatically sign in the newly registered user to get session token
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: pin
    });

    if (signInError) {
      return res.status(400).json({ error: `Registration succeeded, but auto-login failed: ${signInError.message}` });
    }

    return res.status(201).json({
      message: 'Clinician registered successfully.',
      user: {
        username,
        email: email.toLowerCase(),
        specialty,
        token: sessionData.session.access_token
      }
    });

  } catch (error) {
    console.error('Registration controller exception:', error);
    return res.status(500).json({ error: 'Internal Server Error during clinical enrollment.' });
  }
}

/**
 * Log in an existing clinician
 * POST /api/auth/login
 */
export async function login(req, res) {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      return res.status(400).json({ error: 'Please enter clinical email and PIN.' });
    }

    const db = getDB();
    const usersCollection = db.collection('users');

    // Handle sandbox bypass (admin@healos.ai / PIN 1234)
    // If they don't exist in Supabase/MongoDB, we auto-create them to prevent demo failures!
    if (email.toLowerCase() === 'admin@healos.ai' && pin === '1234') {
      const existingAdmin = await usersCollection.findOne({ email: 'admin@healos.ai' });
      if (!existingAdmin) {
        console.log('Seeding default sandbox clinician...');
        try {
          const { data: adminAuth, error: adminAuthErr } = await supabase.auth.admin.createUser({
            email: 'admin@healos.ai',
            password: '1234',
            email_confirm: true,
            user_metadata: { username: 'Dr. Alex Vance', specialty: 'Genomic Specialist' }
          });

          if (!adminAuthErr) {
            await usersCollection.insertOne({
              supabase_uid: adminAuth.user.id,
              username: 'Dr. Alex Vance',
              email: 'admin@healos.ai',
              specialty: 'Genomic Specialist',
              pin: '1234',
              created_at: new Date()
            });
          }
        } catch (e) {
          console.error('Failed to seed sandbox admin, proceeding with standard authentication...', e);
        }
      }
    }

    console.log(`Authenticating clinician: ${email}`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: pin
    });

    if (authError) {
      console.error('Supabase authentication failed:', authError);
      return res.status(401).json({ error: 'Invalid credentials. Check email or clinical PIN.' });
    }

    // Retrieve profile details from MongoDB
    const clinicianProfile = await usersCollection.findOne({ supabase_uid: authData.user.id });
    
    // Recovery path if user exists in Supabase auth but not in MongoDB
    let profile = clinicianProfile;
    if (!profile) {
      console.warn(`User found in Supabase Auth but profile missing in MongoDB. Re-creating profile...`);
      profile = {
        supabase_uid: authData.user.id,
        username: authData.user.user_metadata?.username || 'Unknown Clinician',
        email: email.toLowerCase(),
        specialty: authData.user.user_metadata?.specialty || 'General Diagnostics',
        pin: pin,
        created_at: new Date()
      };
      await usersCollection.insertOne(profile);
    }

    return res.status(200).json({
      message: 'Ingress authorized.',
      user: {
        username: profile.username,
        email: profile.email,
        specialty: profile.specialty,
        token: authData.session.access_token
      }
    });

  } catch (error) {
    console.error('Login controller exception:', error);
    return res.status(500).json({ error: 'Internal Server Error during credential validation.' });
  }
}
