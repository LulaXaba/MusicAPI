const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const auth = require('../middleware/auth'); // Adjust the path to match your project structure
const mongoose = require('mongoose');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      email,
      password,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user to database
    try {
      await user.save(); // Just use `user.save()` without `const` or `let`
      console.log('User saved successfully:', user.id);
    } catch (error) {
      console.error('Error saving user:', error);
      return res.status(500).json({ msg: 'User registration failed', error: error.message });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Send response
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = {
      user: {
        id: user._id.toString() // Convert ObjectId to string
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get User Profile
router.get('/profile', auth, async (req, res) => {
  console.log('Profile route hit');
  try {
    console.log('User ID from token:', req.user.id);
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const user = await User.findById(userId).select('-password');
    if (!user) {
      console.log('User not found in database for ID:', req.user.id);
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update User
router.put('/update', async (req, res) => {
    const { username, email } = req.body; // You can expand this to include other fields if needed
  
    try {
      const userId = req.user.id; // Ensure you have middleware to get user from token
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { username, email },
        { new: true, runValidators: true } // Return the updated user and run validators
      ).select('-password'); // Exclude password from response
  
      if (!updatedUser) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Delete User
router.delete('/delete', async (req, res) => {
    try {
      const userId = req.user.id; // Ensure you have middleware to get user from token
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.json({ msg: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  });
  
// Log all routes
console.log('Auth routes:', router.stack.map(r => r.route?.path).filter(Boolean));

// List all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
