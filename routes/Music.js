// /routes/Music.js
const express = require('express');
const router = express.Router();
const Music = require('../Models/Music');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get all music tracks
router.get('/', async (req, res) => {
  try {
    const music = await Music.find();
    res.json(music);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get a specific music track
router.get('/:id', async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);
    if (!music) {
      return res.status(404).json({ message: 'Music not found' });
    }
    res.json(music);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create a new music track (protected route)
router.post('/', auth, upload.single('audioFile'), async (req, res) => {
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, artist, genre } = req.body;
    const audioFile = req.file.path;

    const newMusic = new Music({
      title,
      artist,
      genre,
      audioFile
    });

    await newMusic.save();
    res.status(201).json(newMusic);
  } catch (error) {
    console.error('Error in music upload:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update a music track (protected route)
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, artist, genre, filePath } = req.body;
    const updatedMusic = await Music.findByIdAndUpdate(
      req.params.id,
      { title, artist, genre, filePath },
      { new: true }
    );
    if (!updatedMusic) {
      return res.status(404).json({ message: 'Music not found' });
    }
    res.json(updatedMusic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete a music track (protected route)
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedMusic = await Music.findByIdAndDelete(req.params.id);
    if (!deletedMusic) {
      return res.status(404).json({ message: 'Music not found' });
    }
    res.json({ message: 'Music deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
