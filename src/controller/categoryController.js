const prisma = require('../lib/prisma');

// Create category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const newCategory = await prisma.category.create({
      data: { name }
    });
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name }
    });
    res.json(updatedCategory);
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    if (error.code === 'P2025') {
       return res.status(404).json({ message: 'Category not found' });
    }
    res.status(500).json({ error: error.message });
  }
};
