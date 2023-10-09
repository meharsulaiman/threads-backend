import Post from '../models/postModel.js';
import User from '../models/userModel.js';
import { v2 as cloudinary } from 'cloudinary';

const createPost = async (req, res) => {
  try {
    const { postedBy, text } = req.body;
    let { img } = req.body;

    if (!postedBy || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await User.findById(postedBy);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!req.user._id.equals(user._id)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const maxLength = 500;
    if (text.length > maxLength) {
      return res
        .status(400)
        .json({ error: `Text must be less than ${maxLength} characters` });
    }

    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);

      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({ postedBy, text, img });
    await newPost.save();

    res.status(201).json({ message: 'Post created', post: newPost });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log('Error in createPost: ', error.message);
  }
};

const getPost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(200).json({ post });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log('Error in getPost: ', error.message);
  }
};

const deletePost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!req.user._id.equals(post.postedBy)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (post.img) {
      const imageId = post.img.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(imageId);
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log('Error in deletePost: ', error.message);
  }
};

const likeUnlikePost = async (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user._id;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isUserLikedPost = post.likes.includes(userId);

    if (isUserLikedPost) {
      // Unlike post
      await Post.findByIdAndUpdate(postId, {
        $pull: { likes: userId },
      });
      res.status(200).json({ message: 'Post unliked' });
    } else {
      // Like post
      await Post.findByIdAndUpdate(postId, {
        $push: { likes: userId },
      });
      res.status(200).json({ message: 'Post liked' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log('Error in likeUnlikePost: ', error.message);
  }
};

const replyToPost = async (req, res) => {
  const { id: postId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;
  const userProfilePic = req.user.profilePic;
  const username = req.user.username;
  if (!text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const reply = { userId, text, userProfilePic, username };

    post.replies.push(reply);
    await post.save();

    res.status(200).json({ message: 'Reply added', post });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log('Error in replyToPost: ', error.message);
    error;
  }
};

const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const following = user.following;

    const posts = await Post.find({ postedBy: { $in: following } }).sort({
      createdAt: -1,
    });
    // .populate('postedBy', 'username profilePic')
    // .populate('replies.userId', 'username profilePic');

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log('Error in getFeedPosts: ', error.message);
  }
};

const getUserPosts = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const posts = await Post.find({ postedBy: user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log('Error in getUserPosts: ', error.message);
  }
};

export {
  createPost,
  getPost,
  deletePost,
  likeUnlikePost,
  replyToPost,
  getFeedPosts,
  getUserPosts,
};
