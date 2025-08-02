const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const pool = require('../../config/db');

// ===== validators (exported for route use) =============
exports.registerValidator = [
  body('username').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(['user', 'admin']) // Allow role to be specified
];

exports.loginValidator = [
  body('email').isEmail(),
  body('password').notEmpty()
];

// ===== controller functions =============================
exports.register = async (req, res) => {
  console.log('Register request body:', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, role = 'user' } = req.body; // Default to 'user'

  try {
    // Test DB connection
    console.log('Testing DB connection...');
    const [testRows] = await pool.query('SELECT 1 + 1 AS solution');
    console.log('DB test query result:', testRows);

    // Check if email or username exists
    const [emailRows] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
    if (emailRows.length) return res.status(409).json({ error: 'Email already registered' });

    const [usernameRows] = await pool.query('SELECT id FROM users WHERE username=?', [username]);
    if (usernameRows.length) return res.status(409).json({ error: 'Username already taken' });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert new user with role
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashed, role]
    );
    console.log('Insert result:', result);

    if (!result.affectedRows) {
      return res.status(500).json({ error: 'Failed to insert user' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertId, role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
    if (!rows.length) return res.status(400).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};