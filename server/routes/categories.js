const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Note = require('../models/Note');

// Create a new category
router.post('/', async (req, res) => {
  try {
    let name = req.body.name.trim();
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    const existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ error: 'Category already exists' });

    const category = new Category({ name });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all categories with note counts
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    const counts = await Note.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach((c) => { countMap[c._id] = c.count; });

    const result = categories.map((c) => ({
      _id: c.name,
      count: countMap[c.name] || 0
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a category (moves its notes to Uncategorized)
router.delete('/:name', async (req, res) => {
  try {
    const name = req.params.name;

    await Note.updateMany({ category: name }, { category: 'Uncategorized' });
    await Category.findOneAndDelete({ name });

    res.json({ message: 'Category deleted, notes moved to Uncategorized' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;