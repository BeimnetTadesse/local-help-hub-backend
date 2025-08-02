const pool = require('../../config/db');

// Get user profile (already implemented)
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, full_name, phone, address, role FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Update user profile (already implemented)
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { full_name, phone, address } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?',
      [full_name, phone, address, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found or no changes made' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Admin: List all users
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, full_name, phone, address, role FROM users'
    );
    res.json(rows);
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Admin: Delete user by ID
exports.deleteUserAdmin = async (req, res) => {
  const userId = req.params.id;

  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Admin: Change user role
exports.changeUserRole = async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found or role unchanged' });
    }

    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    console.error('Change user role error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
