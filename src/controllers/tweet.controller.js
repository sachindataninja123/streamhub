import mongoose from "mongoose";
import Tweet from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required!");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  if (!tweet) {
    throw new ApiError(500, "Database error in creation of tweet");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully!"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "UserId is invalid!");
  }

  const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });
  if (!tweets.length) {
    throw new ApiError(404, "No tweets found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "All tweets fetched successfully!"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;

  if (!content) {
    throw new ApiError(400, "Content is required!");
  }

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "TweetId is invalid!");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found!");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this tweet!");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { $set: { content } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully!"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "TweetId is invalid!");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found!");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this tweet!");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully!"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
