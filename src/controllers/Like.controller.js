import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import Like from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Comment from "../models/comment.model.js";
import Tweet from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "VideoId is not valid!");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  const like = await Like.findOne({ video: videoId, likedBy: req.user._id });

  if (like) {
    await Like.findByIdAndDelete(like._id);
  } else {
    await Like.create({ video: videoId, likedBy: req.user._id });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, like ? "Video unliked!" : "Video liked!"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "CommentId is invalid!");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found!");
  }

  const likedComment = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (likedComment) {
    await Like.findByIdAndDelete(likedComment._id);
  } else {
    await Like.create({ comment: commentId, likedBy: req.user._id });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        likedComment ? "Comment unliked!" : "Comment liked!"
      )
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const tweetId = req.params;

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "TweetId is not  valid!");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found!");
  }

  const likedTweet = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (likedTweet) {
    await Like.findByIdAndDelete(likedTweet._id);
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, likedTweet ? "Tweet Unliked!" : "Tweet Liked!"),
      ""
    );
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike };
