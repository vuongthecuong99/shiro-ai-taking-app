const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: 'Uncategorized', trim: true },
  tags: { type: [String], default: [] },
  summary: { type: String, default: '' },
  images: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);