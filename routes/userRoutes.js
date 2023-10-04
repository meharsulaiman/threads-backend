import express from 'express';
import {
  loginUser,
  logoutUser,
  signupUser,
  followUnFollowUser,
  updateUser,
  getUserProfile,
} from '../controllers/userController.js';
import protectedRoute from '../middlewares/protectedRoute.js';

const router = express.Router();

router.get('/profile/:username', getUserProfile);
router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/follow/:id', protectedRoute, followUnFollowUser);
router.post('/update/:id', protectedRoute, updateUser);

export default router;
