const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const router = express.Router();

const sendVerificationEmail = async (email, token, host) => {
  const verifyUrl = `${host}/api/auth/verify-email?token=${token}`;
  // If SMTP config is provided, use it. Otherwise in non-production create
  // a test account (Ethereal) so we can actually send and preview messages.
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@example.com',
      to: email,
      subject: 'Verify your email',
      text: `Click to verify: ${verifyUrl}`,
      html: `<p>Click to verify your email: <a href="${verifyUrl}">Verify Email</a></p>`,
    });
  } else if (process.env.NODE_ENV !== 'production') {
    // Development fallback: try to create a test account and send via Ethereal.
    // If creating the test account fails (e.g. no outbound network), fall
    // back to logging the verification link so signup still succeeds.
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      // Use configured `SMTP_FROM` if provided, otherwise use the test account
      // email address (which is a valid sender) or a safe default.
      const fromAddress = process.env.SMTP_FROM || testAccount.user || 'no-reply@example.com';

      const info = await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: 'Verify your email',
        text: `Click to verify: ${verifyUrl}`,
        html: `<p>Click to verify your email: <a href="${verifyUrl}">Verify Email</a></p>`,
      });

      console.log(`Ethereal preview URL for ${email}: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (err) {
      console.warn('Could not create Nodemailer test account or send email:', err.message || err);
      console.log(`Verification link for ${email}: ${verifyUrl}`);
    }
  } else {
    // In production, don't attempt to create a test account — just log the link
    console.log(`Verification link for ${email}: ${verifyUrl}`);
  }
};

router.post('/sign-up/email', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const hash = await bcrypt.hash(password, 10);
    const token = uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = new User({
      email,
      passwordHash: hash,
      name,
      provider: 'email',
      verifyToken: token,
      verifyTokenExpires: expires,
      verified: false,
    });

    await user.save();

    const host = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 5000}`;
    await sendVerificationEmail(email, token, host);

    return res.status(201).json({ ok: true, message: 'Registered. Check email for verification.' });
  } catch (err) {
    console.error('signup error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Missing token');

    const user = await User.findOne({ verifyToken: token });
    if (!user) return res.status(404).send('Invalid token');
    if (user.verifyTokenExpires < new Date()) return res.status(410).send('Token expired');

    user.verified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpires = undefined;
    await user.save();

    const redirectTo = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return res.redirect(302, `${redirectTo}/login?verified=1`);
  } catch (err) {
    console.error('verify error', err);
    res.status(500).send('Server error');
  }
});

router.post('/sign-in/email', async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`signin: user not found for ${email}`);
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.passwordHash) {
      console.warn(`signin: user ${email} has no passwordHash (provider: ${user.provider})`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash || '');
    if (!match) {
      console.warn(`signin: invalid password for ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.verified) {
      console.warn(`signin: unverified user ${email}`);
      return res.status(403).json({ error: 'Email not verified' });
    }

    const sessionToken = uuidv4();
    const sessionExpires = new Date(Date.now() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000); // 30 days or 1 day
    user.sessionToken = sessionToken;
    user.sessionExpires = sessionExpires;
    await user.save();
    // Set a cookie when user asked to be remembered (dev-only simple approach)
    const maxAge = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    res.cookie('session', sessionToken, { httpOnly: true, maxAge });

    return res.json({ ok: true, user: { id: user._id, email: user.email, name: user.name }, sessionToken });
  } catch (err) {
    console.error('signin error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Return current user by session cookie or bearer token
router.get('/me', async (req, res) => {
  try {
    const cookieToken = req.cookies?.session;
    const authHeader = req.headers.authorization?.split(' ')[1];
    const token = authHeader || cookieToken || req.query?.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const user = await User.findOne({ sessionToken: token });
    if (!user) return res.status(401).json({ error: 'Invalid session' });
    if (user.sessionExpires && user.sessionExpires < new Date()) return res.status(401).json({ error: 'Session expired' });

    return res.json({ ok: true, user: { id: user._id, email: user.email, name: user.name, verified: user.verified } });
  } catch (err) {
    console.error('me error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

