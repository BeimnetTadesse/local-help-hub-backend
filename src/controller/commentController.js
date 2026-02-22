const prisma = require('../lib/prisma');

// Helper: Find comment by ID
async function findCommentById(id) {
  return await prisma.comment.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: {
        select: { username: true }
      }
    }
  });
}

// Add comment to a post
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ message: 'Content is required' });

    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) }
    });

    if (!post) return res.status(404).json({ message: 'Post not found' });

    const newComment = await prisma.comment.create({
      data: {
        postId: parseInt(postId),
        userId: req.user.id,
        content
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

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

    const comments = await prisma.comment.findMany({
      where: { postId: parseInt(postId) },
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

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

    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) }
    });

    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await prisma.comment.delete({
      where: { id: parseInt(commentId) }
    });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
