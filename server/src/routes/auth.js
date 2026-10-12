import express from 'express';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../schemas.js';
import { supabase } from '../supabase.js';
import { findUserByEmail, findUserById, createProfile } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_prep_pulse_jwt_key_2026';

function generateToken(profile) {
  return jwt.sign(
    { id: profile.id, email: profile.email, fullName: profile.full_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const validated = registerSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validated.error.errors.map(e => e.message)
      });
    }

    const { email, password, fullName } = validated.data;
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // 2. Create profile in public.profiles table
    const profile = await createProfile({
      id: userId,
      authUserId: userId,
      email: normalizedEmail,
      fullName
    });

    const token = generateToken(profile);

    return res.status(201).json({
      message: 'Account created successfully in Supabase',
      user: profile,
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to create user account: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const validated = loginSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validated.error.errors.map(e => e.message)
      });
    }

    const { email, password } = validated.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Authenticate with Supabase Auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (signInError || !signInData.user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Retrieve or synchronize profile from public.profiles
    let profile = await findUserById(signInData.user.id);
    if (!profile) {
      profile = await createProfile({
        id: signInData.user.id,
        authUserId: signInData.user.id,
        email: normalizedEmail,
        fullName: signInData.user.user_metadata?.full_name || normalizedEmail.split('@')[0]
      });
    }

    const token = generateToken(profile);

    return res.json({
      message: 'Logged in successfully',
      user: profile,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to process login' });
  }
});

// POST /api/auth/demo-login
router.post('/demo-login', async (req, res) => {
  try {
    const demoEmail = 'student.demo@preppulse.ai';
    let profile = await findUserByEmail(demoEmail);

    if (!profile) {
      // Find or create in Supabase Auth
      const { data: listRes } = await supabase.auth.admin.listUsers();
      let authUser = listRes?.users?.find(u => u.email === demoEmail);

      if (!authUser) {
        const { data: newAuthData, error: newAuthErr } = await supabase.auth.admin.createUser({
          email: demoEmail,
          password: 'DemoPassword123!',
          email_confirm: true,
          user_metadata: { full_name: 'Alex Chen (Student)' }
        });
        if (newAuthErr) {
          throw new Error('Supabase Auth demo creation failed: ' + newAuthErr.message);
        }
        authUser = newAuthData?.user;
      }

      // Upsert profile in public.profiles
      profile = await createProfile({
        id: authUser.id,
        authUserId: authUser.id,
        email: demoEmail,
        fullName: 'Alex Chen (Student)'
      });
    }

    const token = generateToken(profile);

    return res.json({
      message: 'Logged in as Demo Student',
      user: profile,
      token
    });
  } catch (err) {
    console.error('Demo login error:', err);
    return res.status(500).json({ error: 'Failed demo login: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

export default router;
