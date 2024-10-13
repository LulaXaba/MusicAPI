const express = require('express');
const router = express.Router();
const Playlist = require('../Models/Playlist');
const Music = require('../Models/Music');
const auth = require('../middleware/auth');

// Get all playlists for a user
router.get('/', auth, async (req, res) => {
  try {
    const playlists = await Playlist.find({ user: req.user.id }).populate('music');
    res.json(playlists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get a specific playlist by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id).populate('music');
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    res.json(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create a new playlist
router.post('/', auth, async (req, res) => {
  const { name, description, music } = req.body;

  // Validate request body
  if (!name || !req.user) {
    return res.status(400).json({ message: 'Name is required and user must be authenticated' });
  }

  try {
    const newPlaylist = new Playlist({
      name,
      description,
      user: req.user.id,
      music: music || [] // Ensure music is initialized to an empty array if not provided
    });
    await newPlaylist.save();
    res.status(201).json(newPlaylist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Add music to a playlist
router.put('/:id/music', auth, async (req, res) => {
  const { musicId } = req.body;

  // Validate request body
  if (!musicId) {
    return res.status(400).json({ message: 'Music ID is required' });
  }

  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check if music already exists in the playlist
    if (!playlist.music.includes(musicId)) {
      playlist.music.push(musicId);
      await playlist.save();
    }

    res.json(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Remove music from a playlist
router.delete('/:id/music/:musicId', auth, async (req, res) => {
  const { id, musicId } = req.params;

  try {
    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Filter out the music ID to remove
    playlist.music = playlist.music.filter((id) => id.toString() !== musicId);
    await playlist.save();

    res.json(playlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete a playlist
router.delete('/:id', auth, async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    res.json({ message: 'Playlist deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update a playlist (name, description, or music)
router.put('/:id', auth, async (req, res) => {
    const { name, description, music } = req.body; // Assume music is an array of music IDs
  
    try {
      const playlist = await Playlist.findById(req.params.id);
  
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }
  
      // Update the playlist's name and description
      if (name) playlist.name = name; // Update name if provided
      if (description) playlist.description = description; // Update description if provided
  
      // Handle music tracks
      if (music) {
        // Update music tracks: can be adding or resetting the whole array
        playlist.music = music; // This will overwrite the existing music tracks with new ones
      }
  
      await playlist.save(); // Save changes to the playlist
  
      res.json(playlist); // Return the updated playlist
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server Error' });
    }
  });
  

module.exports = router;
