import Post from '../models/postModel.js';
import User from '../models/userModel.js';

const createPost = async (req, res) => {
  try {
    const { postedBy, text, img } = req.body;

    if (!postedBy || !text) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await User.findById(postedBy);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.user._id.equals(user._id)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const maxLength = 500;
    if (text.length > maxLength) {
      return res
        .status(400)
        .json({ message: `Text must be less than ${maxLength} characters` });
    }

    const newPost = new Post({ postedBy, text, img });
    await newPost.save();

    res.status(201).json({ message: 'Post created', post: newPost });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log('Error in createPost: ', error.message);
  }
};

const getPost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json({ post });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log('Error in getPost: ', error.message);
  }
};

const deletePost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!req.user._id.equals(post.postedBy)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log('Error in deletePost: ', error.message);
  }
};

const likeUnlikePost = async (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user._id;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
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
    res.status(500).json({ message: error.message });
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
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const reply = { userId, text, userProfilePic, username };

    post.replies.push(reply);
    await post.save();

    res.status(200).json({ message: 'Reply added', post });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log('Error in replyToPost: ', error.message);
  }
};

const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const following = user.following;

    const posts = await Post.find({ postedBy: { $in: following } }).sort({
      createdAt: -1,
    });
    // .populate('postedBy', 'username profilePic')
    // .populate('replies.userId', 'username profilePic');

    res.status(200).json({ posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log('Error in getFeedPosts: ', error.message);
  }
};

export {
  createPost,
  getPost,
  deletePost,
  likeUnlikePost,
  replyToPost,
  getFeedPosts,
};
