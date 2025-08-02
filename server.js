require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const postRoutes = require('./src/routes/postRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const testRoutes = require('./src/routes/testRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve static files

// Log environment variables for debugging
console.log('Environment variables:', {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'helpuser',
  DB_NAME: process.env.DB_NAME || 'localhelpdb',
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT
});

const startServer = async () => {
  try {
    // Create MySQL connection pool
    const pool = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'helpuser',
      password: process.env.DB_PASSWORD || 'YourStrongPassword',
      database: process.env.DB_NAME || 'localhelpdb',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log('MySQL connected ✅');

    // Make pool available to routes/controllers
    app.locals.pool = pool;

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
        const [rows] = await pool.query('SELECT NOW() AS current_time');
        res.json({
          message: 'Local Help Hub API is running',
          db_time: rows[0].current_time,
        });
      } catch (err) {
        res.status(500).json({
          error: 'Database query failed',
          details: err.message,
        });
      }
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} 🚀`);
    });
  } catch (error) {
    console.error('MySQL connection failed ❌:', error.message);
    process.exit(1);
  }
};

startServer();