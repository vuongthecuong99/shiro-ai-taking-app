const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { summarize, generateTags, generateQuiz, generateFlashcards, generateKeyTerms } = require('../services/openaiService');
const upload = require('../middleware/upload');

// Generate summary from arbitrary text (used for "Study All")
router.post('/generate/summary', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });
    const summary = await summarize(text);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate quiz from arbitrary text
router.post('/generate/quiz', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });
    const quiz = await generateQuiz(text);
    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate flashcards from arbitrary text
router.post('/generate/flashcards', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });
    const flashcards = await generateFlashcards(text);
    res.json({ flashcards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all notes (optionally filtered by category)
router.get('/', async (req, res) => {
  try {
    const filter = req.query.category ? { category: req.query.category } : {};
    const notes = await Note.find(filter).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a note
router.put('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a note
router.delete('/:id', async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Summarize a note
router.post('/:id/summarize', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const summary = await summarize(note.content, note.images);
    note.summary = summary;
    await note.save();

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate tags for a note
router.post('/:id/tags', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const tags = await generateTags(note.content, note.images);
    note.tags = tags;
    await note.save();

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate quiz for a note
router.post('/:id/quiz', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    const quiz = await generateQuiz(note.content, note.images);
    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate flashcards for a note
router.post('/:id/flashcards', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    const flashcards = await generateFlashcards(note.content, note.images);
    res.json({ flashcards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate key terms for a note
router.post('/:id/keyterms', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    const keyTerms = await generateKeyTerms(note.content, note.images);
    res.json({ keyTerms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}); 

// Generate key terms from arbitrary text
router.post('/generate/keyterms', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });
    const keyTerms = await generateKeyTerms(text);
    res.json({ keyTerms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a note with image uploads
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.category) {
      data.category = data.category.trim();
      data.category = data.category.charAt(0).toUpperCase() + data.category.slice(1).toLowerCase();
    }
    if (req.files && req.files.length > 0) {
      data.images = req.files.map(f => `/uploads/${f.filename}`);
    }
    const note = new Note(data);
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;