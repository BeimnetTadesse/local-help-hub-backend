require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const postRoutes = require('./src/routes/postRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const testRoutes = require('./src/routes/testRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const prisma = require('./src/lib/prisma');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve static files

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/test', testRoutes);
app.use('/api/categories', categoryRoutes);

// Test route
app.get('/', async (req, res) => {
  try {
    // Simple health check with Prisma
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      message: 'Local Help Hub API is running with Prisma ✅',
    });
  } catch (err) {
    res.status(500).json({
      error: 'Database connection check failed',
      details: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});

module.exports = app;