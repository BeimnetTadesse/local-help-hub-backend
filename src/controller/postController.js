const pool = require('../../config/db');


// Helper to find post by ID
async function findPostById(id) {
  const [rows] = await pool.query(
    `SELECT p.*, u.username, u.email, c.name as category_name
     FROM posts p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0] ? { ...rows[0], media: { images: rows[0].image ? [rows[0].image] : [], audio: [] } } : null;
}

// Helper to validate category_id
async function validateCategory(category_id) {
  if (!category_id) return true; // Allow null
  const [rows] = await pool.query('SELECT id FROM categories WHERE id = ?', [category_id]);
  return rows.length > 0;
}

// --- POSTS ---

 // Create a new post
exports.createPost = async (req, res) => {
  console.log('req.user:', req.user);

  try {
    const { title, content, category, address } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required' });
    }

    // Fetch category_id from category name
    const [catRows] = await pool.query(
      'SELECT id FROM categories WHERE name = ?',
      [category]
    );

    if (catRows.length === 0) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const category_id = catRows[0].id;

    const [result] = await pool.query(
      'INSERT INTO posts (user_id, title, content, image, category_id, status, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, content, image, category_id, 'pending', address || null]
    );

    const post = {
      id: result.insertId,
      user_id: req.user.id,
      title,
      content,
      image,
      category_id,
      status: 'pending',
    };

    res.status(201).json({ message: 'Post created', post });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Get all posts
exports.getPosts = async (req, res) => {
  try {
    const { category, status, search, address } = req.query;

    let query = `
      SELECT p.*, u.username, u.email, c.name as category_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
    `;

    let conditions = [];
    let params = [];

    // Handle status filter
    if (status && status !== 'all') {
      conditions.push('p.status = ?');
      params.push(status);
    } else if (!status) {
      conditions.push('p.status = ?');
      params.push('approved');
    }
    // If status === 'all', no status filter is applied

    if (category) {
      conditions.push('p.category_id = ?');
      params.push(category);
    }

    if (address) {
      conditions.push('p.address LIKE ?');
      params.push(`%${address}%`);
    }

    if (search) {
      conditions.push('(p.title LIKE ? OR p.content LIKE ? OR u.username LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.query(query, params);
    const posts = rows.map(row => ({
      ...row,
      media: { images: row.image ? [row.image] : [], audio: [] }
    }));

    res.json(posts);
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update a post (only by owner)
exports.updatePost = async (req, res) => {
  console.log('updatePost called with postId:', req.params.postId);
  console.log('req.user:', req.user);
  console.log('req.body:', req.body);
  try {
    const { postId } = req.params;
    const { title, content, address } = req.body;

    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [postId]);
    const post = rows[0];

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    const fields = [];
    const values = [];

    if (title) {
      fields.push('title = ?');
      values.push(title);
    }
    if (content) {
      fields.push('content = ?');
      values.push(content);
    }
    if (address) {
      fields.push('address = ?');
      values.push(address);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(postId);
    await pool.query(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`, values);

    res.json({ message: 'Post updated' });
  } catch (err) {
    console.error('Update post error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Update post status (admin only)
exports.updatePostStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'open', 'in_progress', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const post = await findPostById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await pool.query('UPDATE posts SET status = ? WHERE id = ?', [status, postId]);

    const updatedPost = await findPostById(postId);

    res.json({ message: 'Post status updated', post: updatedPost });
  } catch (err) {
    console.error('Update post status error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete post (admin or owner)
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await findPostById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [postId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Post not found or already deleted' });
    }

    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get posts by logged-in user
exports.getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT p.id, p.title, p.content, p.address, p.created_at, c.name AS category
       FROM posts p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching user posts:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getPostById = async (req, res) => {
  const { postId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.username, u.email, c.name AS category_name 
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [postId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching post:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

