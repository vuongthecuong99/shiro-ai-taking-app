const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const noteRoutes = require('./routes/notes');
const categoryRoutes = require('./routes/categories');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/notes', noteRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', require('./routes/auth'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use('/uploads', express.static('uploads'));