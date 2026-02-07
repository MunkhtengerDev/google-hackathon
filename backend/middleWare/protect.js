const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandle');
const User = require('../models/User'); 

exports.protect = asyncHandler(async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    res.status(401);
    throw new Error(
      'Unauthorized access. Please log in and provide a valid token in the Authorization header.'
    );
  }

  const token = req.headers.authorization.split(' ')[1]; 
  if (!token) {
    res.status(401);
    throw new Error('No token provided. Please log in.');
  }

  let tokenObj;
  try {
    tokenObj = jwt.verify(token, process.env.JWT_SECRET); 
  } catch (err) {
    res.status(401);
    throw new Error('Invalid token. Please log in again.');
  }

  req.user = await User.findById(tokenObj.id).select('-password'); 

  if (!req.user) {
    res.status(401);
    throw new Error('User not found. Please log in again.');
  }

  next(); 
});