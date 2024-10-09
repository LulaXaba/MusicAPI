const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = req.header('x-auth-token') || req.query['x-auth-token'];
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    req.user = decoded.user;
    next();
  } catch (e) {
    console.error('Token verification error:', e);
    res.status(400).json({ msg: 'Token is not valid' });
  }
}

module.exports = auth;
