// /routes/Music.js
const express = require('express');
const router = express.Router();
const Music = require('../Models/Music');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

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
  try {
    const { title, artist, album, genre } = req.body; // Add album here
    
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }

    const newMusic = new Music({
      title,
      artist,
      album, // Add this line
      genre,
      audioFile: req.file.path
    });

    await newMusic.save();
    res.status(201).json(newMusic);
  } catch (error) {
    console.error('Error creating music:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update a music track
router.put('/:id', auth, upload.single('audioFile'), async (req, res) => {
  try {
    let { id } = req.params;
    id = id.replace(/^:/, '');

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid music ID' });
    }

    const { title, artist, album, genre } = req.body; // Add album here

    let updateData = { title, artist, album, genre }; // Add album here

    if (req.file) {
      updateData.audioFile = req.file.path;
    }

    const updatedMusic = await Music.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedMusic) {
      return res.status(404).json({ message: 'Music track not found' });
    }

    res.json(updatedMusic);
  } catch (error) {
    console.error('Error updating music track:', error);
    res.status(400).json({ message: error.message });
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
