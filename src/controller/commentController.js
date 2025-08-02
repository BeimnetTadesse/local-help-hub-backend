const pool = require('../../config/db');

// Helper: Find comment by ID
async function findCommentById(id) {
  const [rows] = await pool.query(
    `SELECT c.*, u.username
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// Helper: Ensure post exists
async function postExists(postId) {
  const [rows] = await pool.query('SELECT id FROM posts WHERE id = ?', [postId]);
  return rows.length > 0;
}

// Add comment to a post
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ message: 'Content is required' });

    if (!(await postExists(postId))) return res.status(404).json({ message: 'Post not found' });

    const [result] = await pool.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, req.user.id, content]
    );

    const newComment = await findCommentById(result.insertId);
    res.status(201).json({ message: 'Comment added', comment: newComment });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all comments for a post
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const [comments] = await pool.query(
      `SELECT c.*, u.username
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at DESC`,
      [postId]
    );

    res.json(comments);
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a comment (owner or admin)
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await findCommentById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
