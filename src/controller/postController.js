const prisma = require('../lib/prisma');

// Helper to find post by ID
async function findPostById(id) {
  return await prisma.post.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: {
        select: { username: true, email: true }
      },
      category: {
        select: { name: true }
      }
    }
  });
}

// --- POSTS ---

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { title, content, category, address } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required' });
    }

    // Fetch category_id from category name
    const categoryRecord = await prisma.category.findUnique({
      where: { name: category }
    });

    if (!categoryRecord) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const post = await prisma.post.create({
      data: {
        userId: req.user.id,
        title,
        content,
        image,
        categoryId: categoryRecord.id,
        status: 'pending',
        address: address || null
      }
    });

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

    let where = {};

    // Handle status filter
    if (status && status !== 'all') {
      where.status = status;
    } else if (!status) {
      where.status = 'approved';
    }

    if (category) {
      where.categoryId = parseInt(category);
    }

    if (address) {
      where.address = { contains: address, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { user: { username: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        user: { select: { username: true, email: true } },
        category: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedPosts = posts.map(post => ({
      ...post,
      category_name: post.category?.name,
      username: post.user.username,
      email: post.user.email,
      media: { images: post.image ? [post.image] : [], audio: [] }
    }));

    res.json(formattedPosts);
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update a post (only by owner)
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, address } = req.body;

    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(postId) },
      data: {
        title: title || undefined,
        content: content || undefined,
        address: address || undefined
      }
    });

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

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(postId) },
      data: { status },
      include: {
        user: { select: { username: true, email: true } },
        category: { select: { name: true } }
      }
    });

    res.json({ message: 'Post status updated', post: updatedPost });
  } catch (err) {
    console.error('Update post status error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete post (admin or owner)
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await prisma.post.delete({
      where: { id: parseInt(postId) }
    });

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

    const posts = await prisma.post.findMany({
      where: { userId },
      include: {
        category: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedPosts = posts.map(post => ({
      ...post,
      category: post.category?.name
    }));

    res.json(formattedPosts);
  } catch (err) {
    console.error('Error fetching user posts:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getPostById = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
      include: {
        user: { select: { username: true, email: true } },
        category: { select: { name: true } }
      }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const formattedPost = {
      ...post,
      username: post.user.username,
      email: post.user.email,
      category_name: post.category?.name
    };

    return res.json(formattedPost);
  } catch (err) {
    console.error('Error fetching post:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

