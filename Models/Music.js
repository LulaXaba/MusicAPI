// /Models/Music.js
const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  genre: { type: String, required: true },
  audioFile: { type: String, required: true },
  // ... any other fields
});

module.exports = mongoose.model('Music', musicSchema);
