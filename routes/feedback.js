// routes/feedback.js
const express = require('express');
const router = express.Router();
const Feedback = require('../Models/feedback');
const auth = require('../middleware/auth');

// Submit feedback for a track
router.post('/', auth, async (req, res) => {
  const { track, rating, comment } = req.body;
  try {
    const newFeedback = new Feedback({
      user: req.user.id,
      track,
      rating,
      comment,
    });
    const savedFeedback = await newFeedback.save();
    res.status(201).json(savedFeedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get feedback for a track
router.get('/:trackId', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ track: req.params.trackId }).populate('user', 'username');
    res.json(feedbacks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
