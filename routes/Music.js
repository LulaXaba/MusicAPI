// /routes/Music.js
const express = require('express');
const router = express.Router();
const Music = require('../Models/Music');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs').promises;

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
    const music = await Music.findById(req.params.id);
    if (!music) {
      return res.status(404).json({ message: 'Music not found' });
    }

    // Delete the audio file from the server if it exists
    const audioPath = path.join(__dirname, '..', music.audioFile);
    try {
      await fs.access(audioPath); // Check if the file exists
      await fs.unlink(audioPath);
    } catch (fileErr) {
      console.error('Audio file not found or unable to delete:', fileErr);
    }

    // Delete the music document from the database
    await Music.findByIdAndDelete(req.params.id);

    res.json({ message: 'Music deleted successfully' });
  } catch (err) {
    console.error('Error deleting music:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// Play music endpoint
router.get('/play/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid music ID' });
    }

    const music = await Music.findById(id);

    if (!music) {
      return res.status(404).json({ message: 'Music track not found' });
    }

    const audioPath = path.join(__dirname, '..', music.audioFile);

    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ message: 'Audio file not found' });
    }

    const stat = fs.statSync(audioPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(audioPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(audioPath).pipe(res);
    }
  } catch (error) {
    console.error('Error playing music:', error);
    res.status(500).json({ message: 'Error playing music' });
  }
});

// Download music endpoint
router.get('/download/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid music ID' });
    }

    const music = await Music.findById(id);

    if (!music) {
      return res.status(404).json({ message: 'Music track not found' });
    }

    const audioPath = path.join(__dirname, '..', music.audioFile);

    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ message: 'Audio file not found' });
    }

    const fileName = `${music.artist} - ${music.title}.mp3`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(audioPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading music:', error);
    res.status(500).json({ message: 'Error downloading music' });
  }
});

module.exports = router;
