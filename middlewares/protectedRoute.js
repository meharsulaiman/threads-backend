import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const protectedRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.userId).select('-password');

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log('Error in protectedRoute: ', error.message);
  }
};

export default protectedRoute;
