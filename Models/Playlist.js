const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  music: [{ // Changed from tracks to music
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Music'
  }]
}, {
  timestamps: true
});

const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;

