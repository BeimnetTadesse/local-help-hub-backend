const prisma = require('../lib/prisma');

// Get user profile
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        address: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { full_name, phone, address } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: full_name,
        phone,
        address
      }
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    if (err.code === 'P2025') {
       return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Admin: List all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        address: true,
        role: true
      }
    });
    res.json(users);
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Admin: Delete user by ID
exports.deleteUserAdmin = async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    if (err.code === 'P2025') {
       return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Admin: Change user role
exports.changeUserRole = async (req, res) => {
  const userId = parseInt(req.params.id);
  const { role } = req.body;

  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    console.error('Change user role error:', err);
    if (err.code === 'P2025') {
       return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};
