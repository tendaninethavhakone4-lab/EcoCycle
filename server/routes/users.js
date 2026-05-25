const express  = require('express');
const bcrypt   = require('bcryptjs');   
const jwt      = require('jsonwebtoken');

const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'ecocycle_secret_key_change_later';

const { authRequired } = require('../middleware/auth');

const users = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@ecocycle.com',
   password: '$2b$10$masuME8mwQQCVdBo.Gl3IOx4Fb5tGWin5qLM4Qcaunvc4IyqfcrfK',
    role: 'admin',
    approved: true,
  },
  {
    id: 2,
    name: 'Super Admin',
    email: 'superadmin@ecocycle.com',
    password: '$2b$10$masuME8mwQQCVdBo.Gl3IOx4Fb5tGWin5qLM4Qcaunvc4IyqfcrfK',
    role: 'superadmin',
    approved: true,
  },
  {
    id: 3,
    name: 'Test Employee',
    email: 'employee@ecocycle.com',
    password: '$2b$10$masuME8mwQQCVdBo.Gl3IOx4Fb5tGWin5qLM4Qcaunvc4IyqfcrfK',
    role: 'user',
    approved: true,
  },
];

let nextId = 4;

// ─── ROUTE 1: REGISTER ────────────────────────────────────────────────────
// Create account

router.post('/register', async (req, res) => {

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please fill in all fields.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }


  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: nextId++,     
    name,
    email,
    password: hashedPassword,
    role: 'user',       
    approved: false,   
  };

 
  users.push(newUser);


  res.status(201).json({
    message: 'Account created successfully! An administrator will review and approve it. You will receive an email when it is active.',
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
  });
});

// ─── ROUTE 2: LOGIN ───────────────────────────────────────────────────────

router.post('/login', async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter your email and password.' });
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

// Check if the account has been approved by an admin

if (user.approved === false) {
  return res.status(403).json({
    error: 'Your account is pending admin approval. You will be notified once it is active.'
  });
}

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// ─── ROUTE 3: GET CURRENT USER ────────────────────────────────────────────

router.get('/me', authRequired, (req, res) => {

  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      approved: user.approved
    }
  });
});

// ─── ROUTE 4: GET PENDING ACCOUNTS ───────────────────────────────────────

router.get('/pending', (req, res) => {

  const pending = users
    .filter(u => u.approved === false)
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role
    }));

  res.json({ pending });
});

// ─── ROUTE 5: APPROVE AN ACCOUNT ─────────────────────────────────────────

router.put('/approve/:id', (req, res) => {

  const user = users.find(u => u.id === Number(req.params.id));

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  user.approved = true;

  res.json({
    message: `${user.name}'s account has been approved. They can now log in.`,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});


module.exports = router;